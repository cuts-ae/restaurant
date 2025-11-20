const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
  baseURL: 'http://localhost:45002',
  credentials: {
    email: 'owner1@cuts.ae',
    password: 'TabsTriggerIsnt2026*$'
  },
  urls: [
    { path: '/login', name: 'Login Page', requiresAuth: false },
    { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
    { path: '/restaurant/@restaurant1/orders', name: 'Orders Page', requiresAuth: true },
    { path: '/restaurant/@restaurant1/menu', name: 'Menu Page', requiresAuth: true },
    { path: '/restaurant/@restaurant1/analytics', name: 'Analytics Page', requiresAuth: true }
  ],
  screenshotDir: './test-screenshots/portal',
  timeout: 30000
};

const testResults = {
  timestamp: new Date().toISOString(),
  baseURL: TEST_CONFIG.baseURL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function createScreenshotDir() {
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
}

async function captureConsoleLogs(page) {
  const logs = {
    errors: [],
    warnings: [],
    logs: []
  };

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      logs.errors.push(text);
    } else if (type === 'warning') {
      logs.warnings.push(text);
    } else {
      logs.logs.push(text);
    }
  });

  page.on('pageerror', error => {
    logs.errors.push(`Page Error: ${error.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      logs.errors.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });

  return logs;
}

async function login(page) {
  console.log('\n=== Performing Login ===');

  try {
    await page.goto(`${TEST_CONFIG.baseURL}/login`, {
      waitUntil: 'networkidle0',
      timeout: TEST_CONFIG.timeout
    });

    // Wait for email input
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });

    // Fill in credentials
    await page.type('input[type="email"], input[name="email"]', TEST_CONFIG.credentials.email);
    await page.type('input[type="password"], input[name="password"]', TEST_CONFIG.credentials.password);

    // Take screenshot before login
    await page.screenshot({
      path: path.join(TEST_CONFIG.screenshotDir, '00-login-form-filled.png'),
      fullPage: true
    });

    // Click login button
    const loginButton = await page.$('button[type="submit"]');
    if (!loginButton) {
      throw new Error('Login button not found');
    }

    await Promise.all([
      loginButton.click(),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TEST_CONFIG.timeout })
    ]);

    // Verify login success
    const currentURL = page.url();
    console.log(`After login, redirected to: ${currentURL}`);

    // Take screenshot after login
    await page.screenshot({
      path: path.join(TEST_CONFIG.screenshotDir, '00-after-login.png'),
      fullPage: true
    });

    return {
      success: true,
      redirectURL: currentURL
    };
  } catch (error) {
    console.error('Login failed:', error.message);
    await page.screenshot({
      path: path.join(TEST_CONFIG.screenshotDir, '00-login-error.png'),
      fullPage: true
    });
    return {
      success: false,
      error: error.message
    };
  }
}

async function testPage(page, urlConfig, index) {
  const testResult = {
    name: urlConfig.name,
    url: `${TEST_CONFIG.baseURL}${urlConfig.path}`,
    status: 'pending',
    errors: [],
    warnings: [],
    screenshots: [],
    interactions: [],
    loadTime: 0,
    timestamp: new Date().toISOString()
  };

  console.log(`\n=== Testing: ${urlConfig.name} ===`);
  console.log(`URL: ${testResult.url}`);

  try {
    // Setup console log capture
    const logs = await captureConsoleLogs(page);

    // Navigate to page
    const startTime = Date.now();
    await page.goto(testResult.url, {
      waitUntil: 'networkidle0',
      timeout: TEST_CONFIG.timeout
    });
    testResult.loadTime = Date.now() - startTime;

    console.log(`Page loaded in ${testResult.loadTime}ms`);

    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take main screenshot
    const screenshotPath = path.join(
      TEST_CONFIG.screenshotDir,
      `${String(index + 1).padStart(2, '0')}-${urlConfig.name.toLowerCase().replace(/\s+/g, '-')}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    testResult.screenshots.push(screenshotPath);
    console.log(`Screenshot saved: ${screenshotPath}`);

    // Check page title
    const title = await page.title();
    testResult.pageTitle = title;
    console.log(`Page title: ${title}`);

    // Test specific interactions based on page
    await testPageInteractions(page, urlConfig, testResult);

    // Capture final console logs
    testResult.errors = logs.errors;
    testResult.warnings = logs.warnings;

    // Determine status
    if (logs.errors.length > 0) {
      testResult.status = 'failed';
      console.log(`FAILED: Found ${logs.errors.length} error(s)`);
    } else if (logs.warnings.length > 0) {
      testResult.status = 'warning';
      console.log(`WARNING: Found ${logs.warnings.length} warning(s)`);
    } else {
      testResult.status = 'passed';
      console.log('PASSED: No errors found');
    }

  } catch (error) {
    testResult.status = 'failed';
    testResult.errors.push(`Test execution error: ${error.message}`);
    console.error(`ERROR: ${error.message}`);

    // Take error screenshot
    try {
      const errorScreenshot = path.join(
        TEST_CONFIG.screenshotDir,
        `${String(index + 1).padStart(2, '0')}-${urlConfig.name.toLowerCase().replace(/\s+/g, '-')}-error.png`
      );
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      testResult.screenshots.push(errorScreenshot);
    } catch (screenshotError) {
      console.error('Failed to capture error screenshot:', screenshotError.message);
    }
  }

  return testResult;
}

async function testPageInteractions(page, urlConfig, testResult) {
  console.log('Testing page interactions...');

  try {
    switch (urlConfig.name) {
      case 'Login Page':
        await testLoginPage(page, testResult);
        break;
      case 'Dashboard':
        await testDashboard(page, testResult);
        break;
      case 'Orders Page':
        await testOrdersPage(page, testResult);
        break;
      case 'Menu Page':
        await testMenuPage(page, testResult);
        break;
      case 'Analytics Page':
        await testAnalyticsPage(page, testResult);
        break;
    }
  } catch (error) {
    testResult.warnings.push(`Interaction test error: ${error.message}`);
  }
}

async function testLoginPage(page, testResult) {
  // Check for email input
  const emailInput = await page.$('input[type="email"]');
  testResult.interactions.push({
    element: 'Email Input',
    found: !!emailInput
  });

  // Check for password input
  const passwordInput = await page.$('input[type="password"]');
  testResult.interactions.push({
    element: 'Password Input',
    found: !!passwordInput
  });

  // Check for login button
  const loginButton = await page.$('button[type="submit"]');
  testResult.interactions.push({
    element: 'Login Button',
    found: !!loginButton
  });
}

async function testDashboard(page, testResult) {
  // Check for navigation elements
  const navLinks = await page.$$('nav a, [role="navigation"] a');
  testResult.interactions.push({
    element: 'Navigation Links',
    count: navLinks.length
  });

  // Check for main content area
  const mainContent = await page.$('main, [role="main"]');
  testResult.interactions.push({
    element: 'Main Content Area',
    found: !!mainContent
  });

  // Check for any cards or stats
  const cards = await page.$$('[class*="card"], [class*="stat"]');
  testResult.interactions.push({
    element: 'Dashboard Cards',
    count: cards.length
  });
}

async function testOrdersPage(page, testResult) {
  // Wait for orders to potentially load
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check for orders table or list
  const ordersTable = await page.$('table, [role="table"]');
  testResult.interactions.push({
    element: 'Orders Table',
    found: !!ordersTable
  });

  // Check for order rows
  const orderRows = await page.$$('tr[data-order], [data-testid*="order"]');
  testResult.interactions.push({
    element: 'Order Rows',
    count: orderRows.length
  });

  // Check for status filters or tabs
  const statusTabs = await page.$$('[role="tab"], button[data-status]');
  testResult.interactions.push({
    element: 'Status Tabs/Filters',
    count: statusTabs.length
  });

  // Try to click first tab if exists
  if (statusTabs.length > 0) {
    try {
      await statusTabs[0].click();
      await new Promise(resolve => setTimeout(resolve, 500));
      testResult.interactions.push({
        element: 'Tab Click Test',
        success: true
      });
    } catch (error) {
      testResult.interactions.push({
        element: 'Tab Click Test',
        success: false,
        error: error.message
      });
    }
  }
}

async function testMenuPage(page, testResult) {
  // Check for menu items
  const menuItems = await page.$$('[data-menu-item], [class*="menu-item"]');
  testResult.interactions.push({
    element: 'Menu Items',
    count: menuItems.length
  });

  // Check for add/edit buttons
  const actionButtons = await page.$$('button[data-action], button:has-text("Add"), button:has-text("Edit")');
  testResult.interactions.push({
    element: 'Action Buttons',
    count: actionButtons.length
  });

  // Check for categories or sections
  const categories = await page.$$('[data-category], section');
  testResult.interactions.push({
    element: 'Menu Categories',
    count: categories.length
  });
}

async function testAnalyticsPage(page, testResult) {
  // Check for charts or graphs
  const charts = await page.$$('canvas, svg[class*="chart"], [class*="graph"]');
  testResult.interactions.push({
    element: 'Charts/Graphs',
    count: charts.length
  });

  // Check for stat cards
  const statCards = await page.$$('[class*="stat"], [data-stat]');
  testResult.interactions.push({
    element: 'Statistics Cards',
    count: statCards.length
  });

  // Check for date pickers or filters
  const dateFilters = await page.$$('input[type="date"], [data-date-picker]');
  testResult.interactions.push({
    element: 'Date Filters',
    count: dateFilters.length
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Restaurant Portal Automated Test Suite');
  console.log('='.repeat(60));
  console.log(`Base URL: ${TEST_CONFIG.baseURL}`);
  console.log(`Timestamp: ${testResults.timestamp}`);
  console.log('='.repeat(60));

  createScreenshotDir();

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Set longer timeout
    page.setDefaultTimeout(TEST_CONFIG.timeout);

    // Perform login first
    console.log('\nStep 1: Authentication');
    const loginResult = await login(page);

    if (!loginResult.success) {
      console.error('\nFATAL: Login failed. Cannot proceed with authenticated tests.');
      testResults.loginError = loginResult.error;

      // Still test the login page
      const loginPageTest = await testPage(page, TEST_CONFIG.urls[0], 0);
      testResults.tests.push(loginPageTest);
      testResults.summary.total = 1;
      testResults.summary.failed = 1;
    } else {
      console.log('\nStep 2: Testing Pages');

      // Test all pages
      for (let i = 0; i < TEST_CONFIG.urls.length; i++) {
        const urlConfig = TEST_CONFIG.urls[i];
        const testResult = await testPage(page, urlConfig, i);
        testResults.tests.push(testResult);
        testResults.summary.total++;

        if (testResult.status === 'passed') {
          testResults.summary.passed++;
        } else if (testResult.status === 'warning') {
          testResults.summary.warnings++;
        } else {
          testResults.summary.failed++;
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

  } catch (error) {
    console.error('\nFATAL ERROR:', error);
    testResults.fatalError = error.message;
  } finally {
    await browser.close();
  }

  // Generate report
  generateReport();
}

function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Warnings: ${testResults.summary.warnings}`);
  console.log('='.repeat(60));

  // Detailed results
  console.log('\nDETAILED RESULTS:\n');
  testResults.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Status: ${test.status.toUpperCase()}`);
    console.log(`   Load Time: ${test.loadTime}ms`);

    if (test.pageTitle) {
      console.log(`   Page Title: ${test.pageTitle}`);
    }

    if (test.interactions.length > 0) {
      console.log(`   Interactions:`);
      test.interactions.forEach(interaction => {
        const details = interaction.count !== undefined
          ? `Count: ${interaction.count}`
          : interaction.found !== undefined
            ? (interaction.found ? 'Found' : 'Not Found')
            : interaction.success !== undefined
              ? (interaction.success ? 'Success' : 'Failed')
              : '';
        console.log(`     - ${interaction.element}: ${details}`);
      });
    }

    if (test.errors.length > 0) {
      console.log(`   Errors (${test.errors.length}):`);
      test.errors.forEach(error => console.log(`     - ${error}`));
    }

    if (test.warnings.length > 0) {
      console.log(`   Warnings (${test.warnings.length}):`);
      test.warnings.forEach(warning => console.log(`     - ${warning}`));
    }

    if (test.screenshots.length > 0) {
      console.log(`   Screenshots: ${test.screenshots.length}`);
      test.screenshots.forEach(screenshot => console.log(`     - ${screenshot}`));
    }

    console.log('');
  });

  // Save JSON report
  const reportPath = './RESTAURANT_PORTAL_TEST_REPORT.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\nJSON report saved to: ${reportPath}`);

  // Generate markdown report
  generateMarkdownReport();
}

function generateMarkdownReport() {
  const lines = [];

  lines.push('# Restaurant Portal Test Report');
  lines.push('');
  lines.push(`**Generated:** ${testResults.timestamp}`);
  lines.push(`**Base URL:** ${TEST_CONFIG.baseURL}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Total Tests | ${testResults.summary.total} |`);
  lines.push(`| Passed | ${testResults.summary.passed} |`);
  lines.push(`| Failed | ${testResults.summary.failed} |`);
  lines.push(`| Warnings | ${testResults.summary.warnings} |`);
  lines.push('');

  if (testResults.loginError) {
    lines.push('## Login Error');
    lines.push('');
    lines.push(`**Error:** ${testResults.loginError}`);
    lines.push('');
  }

  lines.push('## Test Results');
  lines.push('');

  testResults.tests.forEach((test, index) => {
    const statusEmoji = test.status === 'passed' ? 'PASS' : test.status === 'warning' ? 'WARN' : 'FAIL';

    lines.push(`### ${index + 1}. ${test.name} [${statusEmoji}]`);
    lines.push('');
    lines.push(`**URL:** ${test.url}`);
    lines.push(`**Status:** ${test.status.toUpperCase()}`);
    lines.push(`**Load Time:** ${test.loadTime}ms`);
    if (test.pageTitle) {
      lines.push(`**Page Title:** ${test.pageTitle}`);
    }
    lines.push('');

    if (test.interactions.length > 0) {
      lines.push('#### Interactions');
      lines.push('');
      lines.push('| Element | Result |');
      lines.push('|---------|--------|');
      test.interactions.forEach(interaction => {
        const details = interaction.count !== undefined
          ? `${interaction.count} found`
          : interaction.found !== undefined
            ? (interaction.found ? 'Found' : 'Not Found')
            : interaction.success !== undefined
              ? (interaction.success ? 'Success' : 'Failed')
              : '';
        lines.push(`| ${interaction.element} | ${details} |`);
      });
      lines.push('');
    }

    if (test.errors.length > 0) {
      lines.push(`#### Errors (${test.errors.length})`);
      lines.push('');
      test.errors.forEach(error => {
        lines.push(`- ${error}`);
      });
      lines.push('');
    }

    if (test.warnings.length > 0) {
      lines.push(`#### Warnings (${test.warnings.length})`);
      lines.push('');
      test.warnings.forEach(warning => {
        lines.push(`- ${warning}`);
      });
      lines.push('');
    }

    if (test.screenshots.length > 0) {
      lines.push('#### Screenshots');
      lines.push('');
      test.screenshots.forEach(screenshot => {
        const filename = path.basename(screenshot);
        lines.push(`- ${filename}`);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  });

  const reportPath = './RESTAURANT_PORTAL_TEST_REPORT.md';
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`Markdown report saved to: ${reportPath}`);
}

// Run the tests
runTests().catch(console.error);
