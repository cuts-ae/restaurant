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
  timeout: 15000 // Reduced timeout
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

async function testPage(page, urlConfig, index, logs) {
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
    // Navigate to page
    const startTime = Date.now();

    try {
      await page.goto(testResult.url, {
        waitUntil: 'networkidle0',
        timeout: TEST_CONFIG.timeout
      });
    } catch (navError) {
      // If navigation fails, still try to proceed
      console.log(`Navigation warning: ${navError.message}`);
      testResult.warnings.push(`Navigation: ${navError.message}`);
    }

    testResult.loadTime = Date.now() - startTime;
    console.log(`Page loaded in ${testResult.loadTime}ms`);

    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get current URL (might have redirected)
    const currentURL = page.url();
    if (currentURL !== testResult.url) {
      testResult.redirectedTo = currentURL;
      console.log(`Redirected to: ${currentURL}`);
    }

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

    // Get page content to check if it's an error page
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Internal Server Error') || bodyText.includes('404')) {
      testResult.warnings.push(`Page shows error message: ${bodyText.substring(0, 200)}`);
    }

    // Test specific interactions based on page
    await testPageInteractions(page, urlConfig, testResult);

    // Capture final console logs
    testResult.errors = [...logs.errors];
    testResult.warnings = [...testResult.warnings, ...logs.warnings];

    // Determine status
    if (testResult.errors.length > 0) {
      testResult.status = 'failed';
      console.log(`FAILED: Found ${testResult.errors.length} error(s)`);
    } else if (testResult.warnings.length > 0) {
      testResult.status = 'warning';
      console.log(`WARNING: Found ${testResult.warnings.length} warning(s)`);
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
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  testResult.interactions.push({
    element: 'Email Input',
    found: !!emailInput
  });

  // Check for password input
  const passwordInput = await page.$('input[type="password"], input[name="password"]');
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

  // Check for demo credentials display
  const demoCredentials = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('owner1@cuts.ae') && text.includes('TabsTriggerIsnt2026*$');
  });
  testResult.interactions.push({
    element: 'Demo Credentials Display',
    found: demoCredentials
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
  const mainContent = await page.$('main, [role="main"], article');
  testResult.interactions.push({
    element: 'Main Content Area',
    found: !!mainContent
  });

  // Check for any cards or stats
  const cards = await page.$$('[class*="card"], [class*="Card"], [class*="stat"]');
  testResult.interactions.push({
    element: 'Dashboard Cards',
    count: cards.length
  });

  // Check for restaurant name or branding
  const hasRestaurantInfo = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase();
    return text.includes('restaurant') || text.includes('dashboard');
  });
  testResult.interactions.push({
    element: 'Restaurant/Dashboard Content',
    found: hasRestaurantInfo
  });
}

async function testOrdersPage(page, testResult) {
  // Wait for orders to potentially load
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check for orders table or list
  const ordersTable = await page.$('table, [role="table"], [role="grid"]');
  testResult.interactions.push({
    element: 'Orders Table',
    found: !!ordersTable
  });

  // Check for order rows
  const orderRows = await page.$$('tr, [data-order], [class*="order"]');
  testResult.interactions.push({
    element: 'Order Rows/Elements',
    count: orderRows.length
  });

  // Check for status tabs or filters
  const tabs = await page.$$('[role="tab"], [role="tablist"] button, button[data-status]');
  testResult.interactions.push({
    element: 'Status Tabs/Filters',
    count: tabs.length
  });

  // Try to click first tab if exists
  if (tabs.length > 0) {
    try {
      await tabs[0].click();
      await new Promise(resolve => setTimeout(resolve, 500));

      const afterClickScreenshot = path.join(
        TEST_CONFIG.screenshotDir,
        '03-orders-tab-clicked.png'
      );
      await page.screenshot({ path: afterClickScreenshot, fullPage: true });

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

  // Check for order status indicators
  const statusIndicators = await page.$$('[class*="status"], [class*="badge"]');
  testResult.interactions.push({
    element: 'Status Indicators',
    count: statusIndicators.length
  });
}

async function testMenuPage(page, testResult) {
  // Check for menu items
  const menuItems = await page.$$('[data-menu-item], [class*="menu"], [class*="item"]');
  testResult.interactions.push({
    element: 'Menu Items',
    count: menuItems.length
  });

  // Check for add/edit buttons
  const buttons = await page.$$('button');
  const buttonTexts = await Promise.all(
    buttons.slice(0, 20).map(btn =>
      btn.evaluate(el => el.textContent?.toLowerCase() || '')
    )
  );
  const hasActionButtons = buttonTexts.some(text =>
    text.includes('add') || text.includes('edit') || text.includes('create')
  );
  testResult.interactions.push({
    element: 'Action Buttons (Add/Edit)',
    found: hasActionButtons
  });

  // Check for categories or sections
  const sections = await page.$$('section, [data-category], [role="region"]');
  testResult.interactions.push({
    element: 'Menu Sections/Categories',
    count: sections.length
  });

  // Check for images (menu item photos)
  const images = await page.$$('img[src*="menu"], img[alt*="menu"], img[class*="menu"]');
  testResult.interactions.push({
    element: 'Menu Item Images',
    count: images.length
  });
}

async function testAnalyticsPage(page, testResult) {
  // Check for charts or graphs
  const charts = await page.$$('canvas, svg[class*="chart"], [class*="graph"], [class*="Chart"]');
  testResult.interactions.push({
    element: 'Charts/Graphs',
    count: charts.length
  });

  // Check for stat cards
  const statCards = await page.$$('[class*="stat"], [class*="Stat"], [class*="metric"]');
  testResult.interactions.push({
    element: 'Statistics Cards',
    count: statCards.length
  });

  // Check for date pickers or filters
  const dateInputs = await page.$$('input[type="date"], input[type="datetime"], [data-date], select');
  testResult.interactions.push({
    element: 'Date/Time Filters',
    count: dateInputs.length
  });

  // Check for data tables
  const tables = await page.$$('table, [role="table"], [role="grid"]');
  testResult.interactions.push({
    element: 'Data Tables',
    count: tables.length
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
    page.setDefaultTimeout(TEST_CONFIG.timeout);

    // Setup console log capture
    const logs = await captureConsoleLogs(page);

    // Test all pages
    for (let i = 0; i < TEST_CONFIG.urls.length; i++) {
      const urlConfig = TEST_CONFIG.urls[i];

      // Reset logs for each page
      logs.errors = [];
      logs.warnings = [];

      const testResult = await testPage(page, urlConfig, i, logs);
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

    if (test.redirectedTo) {
      console.log(`   Redirected To: ${test.redirectedTo}`);
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
        if (interaction.error) {
          console.log(`       Error: ${interaction.error}`);
        }
      });
    }

    if (test.errors.length > 0) {
      console.log(`   Errors (${test.errors.length}):`);
      test.errors.slice(0, 5).forEach(error => console.log(`     - ${error}`));
      if (test.errors.length > 5) {
        console.log(`     ... and ${test.errors.length - 5} more`);
      }
    }

    if (test.warnings.length > 0) {
      console.log(`   Warnings (${test.warnings.length}):`);
      test.warnings.slice(0, 3).forEach(warning => console.log(`     - ${warning}`));
      if (test.warnings.length > 3) {
        console.log(`     ... and ${test.warnings.length - 3} more`);
      }
    }

    if (test.screenshots.length > 0) {
      console.log(`   Screenshots: ${test.screenshots.length}`);
      test.screenshots.forEach(screenshot => console.log(`     - ${path.basename(screenshot)}`));
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

  lines.push('# Restaurant Portal Comprehensive Test Report');
  lines.push('');
  lines.push(`**Generated:** ${testResults.timestamp}`);
  lines.push(`**Base URL:** ${TEST_CONFIG.baseURL}`);
  lines.push('');

  lines.push('## Executive Summary');
  lines.push('');
  lines.push('| Metric | Count | Percentage |');
  lines.push('|--------|-------|------------|');
  const passRate = testResults.summary.total > 0
    ? ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)
    : 0;
  lines.push(`| Total Tests | ${testResults.summary.total} | 100% |`);
  lines.push(`| Passed | ${testResults.summary.passed} | ${passRate}% |`);
  lines.push(`| Failed | ${testResults.summary.failed} | ${((testResults.summary.failed / testResults.summary.total) * 100).toFixed(1)}% |`);
  lines.push(`| Warnings | ${testResults.summary.warnings} | ${((testResults.summary.warnings / testResults.summary.total) * 100).toFixed(1)}% |`);
  lines.push('');

  lines.push('## Test Results Detail');
  lines.push('');

  testResults.tests.forEach((test, index) => {
    const statusBadge = test.status === 'passed' ? '✅ PASS' : test.status === 'warning' ? '⚠️  WARN' : '❌ FAIL';

    lines.push(`### ${index + 1}. ${test.name} ${statusBadge}`);
    lines.push('');
    lines.push(`**URL:** \`${test.url}\``);
    lines.push(`**Status:** ${test.status.toUpperCase()}`);
    lines.push(`**Load Time:** ${test.loadTime}ms`);
    if (test.pageTitle) {
      lines.push(`**Page Title:** ${test.pageTitle}`);
    }
    if (test.redirectedTo) {
      lines.push(`**Redirected To:** \`${test.redirectedTo}\``);
    }
    lines.push('');

    if (test.interactions.length > 0) {
      lines.push('#### UI Elements & Interactions');
      lines.push('');
      lines.push('| Element | Result |');
      lines.push('|---------|--------|');
      test.interactions.forEach(interaction => {
        const details = interaction.count !== undefined
          ? `${interaction.count} found`
          : interaction.found !== undefined
            ? (interaction.found ? '✓ Found' : '✗ Not Found')
            : interaction.success !== undefined
              ? (interaction.success ? '✓ Success' : '✗ Failed')
              : '';
        lines.push(`| ${interaction.element} | ${details} |`);
      });
      lines.push('');
    }

    if (test.errors.length > 0) {
      lines.push(`#### Errors (${test.errors.length})`);
      lines.push('');
      lines.push('```');
      test.errors.slice(0, 10).forEach(error => {
        lines.push(error);
      });
      if (test.errors.length > 10) {
        lines.push(`... and ${test.errors.length - 10} more errors`);
      }
      lines.push('```');
      lines.push('');
    }

    if (test.warnings.length > 0) {
      lines.push(`#### Warnings (${test.warnings.length})`);
      lines.push('');
      test.warnings.slice(0, 5).forEach(warning => {
        lines.push(`- ${warning}`);
      });
      if (test.warnings.length > 5) {
        lines.push(`- ... and ${test.warnings.length - 5} more warnings`);
      }
      lines.push('');
    }

    if (test.screenshots.length > 0) {
      lines.push('#### Screenshots');
      lines.push('');
      test.screenshots.forEach(screenshot => {
        const filename = path.basename(screenshot);
        lines.push(`- \`${filename}\``);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  });

  lines.push('## Recommendations');
  lines.push('');

  const failedTests = testResults.tests.filter(t => t.status === 'failed');
  const warningTests = testResults.tests.filter(t => t.status === 'warning');

  if (failedTests.length > 0) {
    lines.push('### Critical Issues');
    lines.push('');
    failedTests.forEach(test => {
      lines.push(`- **${test.name}**: ${test.errors[0] || 'Unknown error'}`);
    });
    lines.push('');
  }

  if (warningTests.length > 0) {
    lines.push('### Warnings to Address');
    lines.push('');
    warningTests.forEach(test => {
      lines.push(`- **${test.name}**: ${test.warnings[0] || 'Unknown warning'}`);
    });
    lines.push('');
  }

  const reportPath = './RESTAURANT_PORTAL_TEST_REPORT.md';
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`Markdown report saved to: ${reportPath}`);
}

// Run the tests
runTests().catch(console.error);
