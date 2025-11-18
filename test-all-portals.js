/**
 * Comprehensive Portal Testing Script
 * Tests all three portals: Restaurant, Admin, and Support
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const PORTALS = {
  restaurant: {
    url: 'http://localhost:45002',
    name: 'Restaurant Portal',
    credentials: { email: 'owner1@cuts.ae', password: 'password123' },
    pages: ['/dashboard', '/orders', '/menu', '/analytics']
  },
  admin: {
    url: 'http://localhost:45003',
    name: 'Admin Portal',
    credentials: { email: 'admin@cuts.ae', password: 'password123' },
    pages: ['/admin/dashboard', '/admin/orders', '/admin/users', '/admin/invoices']
  },
  support: {
    url: 'http://localhost:45004',
    name: 'Support Portal',
    credentials: { email: 'support@cuts.ae', password: 'password123' },
    pages: ['/support']
  }
};

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  portals: {},
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    errors: []
  }
};

// Screenshot directory
const screenshotDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Helper function to wait for navigation
async function safeNavigate(page, url, timeout = 10000) {
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout
    });
    return true;
  } catch (error) {
    console.error(`Navigation failed for ${url}: ${error.message}`);
    return false;
  }
}

// Helper function to check for errors on page
async function checkForErrors(page) {
  const errors = [];

  // Check for visible error messages
  try {
    const errorText = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
      return Array.from(errorElements).map(el => el.textContent).filter(text => text.trim());
    });
    if (errorText.length > 0) {
      errors.push(...errorText);
    }
  } catch (e) {
    // Ignore evaluation errors
  }

  // Check for 500 errors or error pages
  const content = await page.content();
  if (content.includes('Internal Server Error') ||
      content.includes('500') ||
      content.includes('Application error')) {
    errors.push('Internal Server Error detected on page');
  }

  return errors;
}

// Helper function to check for Next.js logos
async function checkForNextJSLogos(page) {
  const hasNextLogo = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const svgs = Array.from(document.querySelectorAll('svg'));

    const imageCheck = images.some(img =>
      img.src.includes('next') ||
      img.alt?.toLowerCase().includes('next')
    );

    const svgCheck = svgs.some(svg =>
      svg.outerHTML.toLowerCase().includes('next') ||
      svg.getAttribute('aria-label')?.toLowerCase().includes('next')
    );

    return imageCheck || svgCheck;
  });

  return hasNextLogo;
}

// Test login functionality
async function testLogin(page, portal) {
  console.log(`  Testing login for ${portal.name}...`);

  const testResult = {
    name: 'Login',
    passed: false,
    errors: [],
    screenshot: null
  };

  try {
    // Navigate to login page
    const navigated = await safeNavigate(page, `${portal.url}/login`);
    if (!navigated) {
      testResult.errors.push('Failed to navigate to login page');
      return testResult;
    }

    // Take screenshot of login page
    const loginScreenshot = path.join(screenshotDir, `${portal.name.replace(/\s+/g, '-')}-login.png`);
    await page.screenshot({ path: loginScreenshot, fullPage: true });
    testResult.screenshot = loginScreenshot;

    // Check for errors on login page
    const loginErrors = await checkForErrors(page);
    if (loginErrors.length > 0) {
      testResult.errors.push(...loginErrors);
    }

    // Fill in login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    await page.type('input[type="email"], input[name="email"]', portal.credentials.email);
    await page.type('input[type="password"], input[name="password"]', portal.credentials.password);

    // Submit form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);

    // Check if login was successful (should redirect to dashboard)
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/support') || currentUrl.includes('/admin')) {
      testResult.passed = true;
      console.log(`    ✓ Login successful`);
    } else {
      testResult.errors.push(`Login failed - redirected to: ${currentUrl}`);
      console.log(`    ✗ Login failed`);
    }

  } catch (error) {
    testResult.errors.push(`Login error: ${error.message}`);
    console.log(`    ✗ Login error: ${error.message}`);
  }

  return testResult;
}

// Test individual page
async function testPage(page, url, pageName, portalName) {
  console.log(`  Testing page: ${pageName}...`);

  const testResult = {
    name: pageName,
    url: url,
    passed: false,
    errors: [],
    screenshot: null,
    hasNextLogo: false
  };

  try {
    // Navigate to page
    const navigated = await safeNavigate(page, url);
    if (!navigated) {
      testResult.errors.push('Failed to navigate to page');
      return testResult;
    }

    // Wait a bit for page to load
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotPath = path.join(screenshotDir, `${portalName.replace(/\s+/g, '-')}-${pageName.replace(/\//g, '-')}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    testResult.screenshot = screenshotPath;

    // Check for errors
    const pageErrors = await checkForErrors(page);
    if (pageErrors.length > 0) {
      testResult.errors.push(...pageErrors);
    }

    // Check for Next.js logos
    testResult.hasNextLogo = await checkForNextJSLogos(page);
    if (testResult.hasNextLogo) {
      testResult.errors.push('Next.js logo found on page');
    }

    // Check if page loaded successfully
    const content = await page.content();
    if (content.length < 100) {
      testResult.errors.push('Page content seems empty or too short');
    }

    // If no errors, mark as passed
    if (testResult.errors.length === 0) {
      testResult.passed = true;
      console.log(`    ✓ ${pageName} loaded successfully`);
    } else {
      console.log(`    ✗ ${pageName} has errors`);
    }

  } catch (error) {
    testResult.errors.push(`Page error: ${error.message}`);
    console.log(`    ✗ ${pageName} error: ${error.message}`);
  }

  return testResult;
}

// Test specific features for each portal
async function testSpecificFeatures(page, portalType, portalName) {
  console.log(`  Testing specific features for ${portalName}...`);

  const featureResults = [];

  try {
    if (portalType === 'admin') {
      // Test for favicon
      const hasFavicon = await page.evaluate(() => {
        const link = document.querySelector('link[rel="icon"]');
        return link !== null && link.href !== '';
      });

      featureResults.push({
        feature: 'Favicon',
        passed: hasFavicon,
        details: hasFavicon ? 'Favicon found' : 'Favicon missing'
      });
      console.log(`    ${hasFavicon ? '✓' : '✗'} Favicon check`);

      // Navigate to users page to check customer data
      await safeNavigate(page, 'http://localhost:45003/admin/users');
      await page.waitForTimeout(2000);

      const hasCustomerData = await page.evaluate(() => {
        const pageText = document.body.textContent;
        return pageText.includes('customer') || pageText.includes('user') || pageText.includes('email');
      });

      featureResults.push({
        feature: 'Customer Data on Users Page',
        passed: hasCustomerData,
        details: hasCustomerData ? 'Customer data found' : 'Customer data missing'
      });
      console.log(`    ${hasCustomerData ? '✓' : '✗'} Customer data check`);
    }

    if (portalType === 'support') {
      // Test for design elements (dots/gradients)
      const hasDesignElements = await page.evaluate(() => {
        const styles = Array.from(document.querySelectorAll('*')).map(el => {
          const computed = window.getComputedStyle(el);
          return computed.background + ' ' + computed.backgroundImage;
        }).join(' ');

        return styles.includes('gradient') || styles.includes('radial');
      });

      featureResults.push({
        feature: 'Design Elements (dots/gradients)',
        passed: hasDesignElements,
        details: hasDesignElements ? 'Design elements found' : 'Design elements missing'
      });
      console.log(`    ${hasDesignElements ? '✓' : '✗'} Design elements check`);

      // Test for green dot beside "Connected"
      const hasGreenDot = await page.evaluate(() => {
        const pageText = document.body.innerHTML;
        return pageText.toLowerCase().includes('connected') &&
               (pageText.includes('bg-green') || pageText.includes('green-'));
      });

      featureResults.push({
        feature: 'Green dot beside "Connected"',
        passed: hasGreenDot,
        details: hasGreenDot ? 'Green dot found' : 'Green dot missing'
      });
      console.log(`    ${hasGreenDot ? '✓' : '✗'} Green dot check`);

      // Test for 6 reply templates
      const templateCount = await page.evaluate(() => {
        const pageText = document.body.textContent.toLowerCase();
        if (!pageText.includes('template')) return 0;

        // Count template-related elements
        const templates = document.querySelectorAll('[class*="template"]');
        return templates.length;
      });

      const hasSixTemplates = templateCount >= 6;
      featureResults.push({
        feature: '6 Reply Templates',
        passed: hasSixTemplates,
        details: `Found ${templateCount} template elements`
      });
      console.log(`    ${hasSixTemplates ? '✓' : '✗'} Reply templates check (found: ${templateCount})`);
    }

  } catch (error) {
    console.log(`    ✗ Feature testing error: ${error.message}`);
  }

  return featureResults;
}

// Test a single portal
async function testPortal(browser, portalType, portal) {
  console.log(`\n=== Testing ${portal.name} ===`);

  const portalResults = {
    name: portal.name,
    url: portal.url,
    tests: [],
    features: [],
    passed: 0,
    failed: 0
  };

  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Test login
    const loginResult = await testLogin(page, portal);
    portalResults.tests.push(loginResult);
    if (loginResult.passed) {
      portalResults.passed++;
    } else {
      portalResults.failed++;
    }

    // If login successful, test other pages
    if (loginResult.passed) {
      for (const pagePath of portal.pages) {
        const pageUrl = `${portal.url}${pagePath}`;
        const pageResult = await testPage(page, pageUrl, pagePath, portal.name);
        portalResults.tests.push(pageResult);

        if (pageResult.passed) {
          portalResults.passed++;
        } else {
          portalResults.failed++;
        }
      }

      // Test specific features
      const features = await testSpecificFeatures(page, portalType, portal.name);
      portalResults.features = features;
    }

    // Add console errors to results
    if (consoleErrors.length > 0) {
      portalResults.consoleErrors = consoleErrors;
    }

  } catch (error) {
    console.log(`Error testing ${portal.name}: ${error.message}`);
    portalResults.error = error.message;
  } finally {
    await page.close();
  }

  return portalResults;
}

// Main test function
async function runTests() {
  console.log('Starting comprehensive portal testing...\n');
  console.log('Prerequisites:');
  console.log('- Restaurant portal running on http://localhost:45002');
  console.log('- Admin portal running on http://localhost:45003');
  console.log('- Support portal running on http://localhost:45004');
  console.log('- Backend API server running\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test each portal
    for (const [portalType, portal] of Object.entries(PORTALS)) {
      const portalResults = await testPortal(browser, portalType, portal);
      results.portals[portalType] = portalResults;
      results.summary.totalTests += portalResults.tests.length;
      results.summary.passed += portalResults.passed;
      results.summary.failed += portalResults.failed;
    }

  } catch (error) {
    console.error('Fatal error during testing:', error);
    results.summary.errors.push(error.message);
  } finally {
    await browser.close();
  }

  // Generate report
  generateReport();
}

// Generate comprehensive report
function generateReport() {
  console.log('\n\n=== TEST REPORT ===\n');

  console.log('Summary:');
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${((results.summary.passed / results.summary.totalTests) * 100).toFixed(2)}%`);

  console.log('\n\nDetailed Results:\n');

  for (const [portalType, portalResults] of Object.entries(results.portals)) {
    console.log(`\n${portalResults.name}:`);
    console.log(`  URL: ${portalResults.url}`);
    console.log(`  Tests Passed: ${portalResults.passed}`);
    console.log(`  Tests Failed: ${portalResults.failed}`);

    console.log('\n  Test Results:');
    for (const test of portalResults.tests) {
      console.log(`    ${test.passed ? '✓' : '✗'} ${test.name}`);
      if (test.errors.length > 0) {
        test.errors.forEach(err => console.log(`        - ${err}`));
      }
      if (test.screenshot) {
        console.log(`        Screenshot: ${test.screenshot}`);
      }
    }

    if (portalResults.features.length > 0) {
      console.log('\n  Feature Checks:');
      for (const feature of portalResults.features) {
        console.log(`    ${feature.passed ? '✓' : '✗'} ${feature.feature}: ${feature.details}`);
      }
    }

    if (portalResults.consoleErrors && portalResults.consoleErrors.length > 0) {
      console.log('\n  Console Errors:');
      portalResults.consoleErrors.forEach(err => console.log(`    - ${err}`));
    }
  }

  // Save results to JSON file
  const reportPath = path.join(__dirname, 'portal-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n\nFull report saved to: ${reportPath}`);
  console.log(`Screenshots saved to: ${screenshotDir}`);
}

// Run the tests
runTests().catch(console.error);
