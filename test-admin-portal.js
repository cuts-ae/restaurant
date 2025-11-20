const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:45003';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots', 'admin-portal');
const CREDENTIALS = {
  email: 'admin@cuts.ae',
  password: 'TabsTriggerIsnt2026*$'
};

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const testResults = {
  timestamp: new Date().toISOString(),
  portal: 'Admin Portal',
  baseUrl: BASE_URL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

async function captureConsoleErrors(page) {
  const consoleErrors = [];
  const consoleWarnings = [];
  const networkErrors = [];

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      consoleErrors.push(text);
    } else if (type === 'warning') {
      consoleWarnings.push(text);
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });

  page.on('requestfailed', (request) => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure()?.errorText || 'Unknown error'
    });
  });

  return { consoleErrors, consoleWarnings, networkErrors };
}

async function takeScreenshot(page, name) {
  const filename = `${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function login(page) {
  console.log('\n--- Testing Login Page ---');
  const testResult = {
    page: 'Login',
    url: `${BASE_URL}/login`,
    status: 'passed',
    duration: 0,
    screenshots: [],
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    actions: [],
    notes: []
  };

  const startTime = Date.now();
  const errorTracking = await captureConsoleErrors(page);

  try {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    testResult.screenshots.push(await takeScreenshot(page, 'admin-01-login-page'));
    testResult.actions.push('Navigated to login page');

    // Check if already logged in (redirected to dashboard)
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl === `${BASE_URL}/`) {
      testResult.actions.push('Already logged in, redirected to dashboard');
      testResult.notes.push('Session already exists');
      return testResult;
    }

    // Wait for email input
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    testResult.actions.push('Found email input field');

    // Fill in credentials
    await page.type('input[type="email"], input[name="email"]', CREDENTIALS.email);
    testResult.actions.push(`Entered email: ${CREDENTIALS.email}`);

    await page.type('input[type="password"], input[name="password"]', CREDENTIALS.password);
    testResult.actions.push('Entered password');

    testResult.screenshots.push(await takeScreenshot(page, 'admin-02-login-filled'));

    // Click login button
    const loginButton = await page.$('button[type="submit"]');
    if (!loginButton) {
      throw new Error('Login button not found');
    }

    await loginButton.click();
    testResult.actions.push('Clicked login button');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    testResult.screenshots.push(await takeScreenshot(page, 'admin-03-after-login'));

    const finalUrl = page.url();
    testResult.actions.push(`Redirected to: ${finalUrl}`);

    if (finalUrl.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }

    testResult.notes.push('Login successful');

  } catch (error) {
    testResult.status = 'failed';
    testResult.consoleErrors.push(`Test Error: ${error.message}`);
    testResult.screenshots.push(await takeScreenshot(page, 'admin-login-error'));
  }

  testResult.consoleErrors.push(...errorTracking.consoleErrors);
  testResult.consoleWarnings.push(...errorTracking.consoleWarnings);
  testResult.networkErrors.push(...errorTracking.networkErrors);
  testResult.duration = Date.now() - startTime;

  return testResult;
}

async function testDashboard(page) {
  console.log('\n--- Testing Dashboard ---');
  const testResult = {
    page: 'Dashboard',
    url: `${BASE_URL}/admin/dashboard`,
    status: 'passed',
    duration: 0,
    screenshots: [],
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    actions: [],
    notes: [],
    elements: {}
  };

  const startTime = Date.now();
  const errorTracking = await captureConsoleErrors(page);

  try {
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
    testResult.actions.push('Navigated to dashboard');

    await page.waitForSelector('body', { timeout: 5000 });
    testResult.screenshots.push(await takeScreenshot(page, 'admin-04-dashboard'));

    // Check for key dashboard elements
    const pageTitle = await page.title();
    testResult.elements.pageTitle = pageTitle;
    testResult.actions.push(`Page title: ${pageTitle}`);

    // Check for common dashboard elements
    const h1Text = await page.$eval('h1', el => el.textContent).catch(() => null);
    if (h1Text) {
      testResult.elements.mainHeading = h1Text;
      testResult.actions.push(`Main heading: ${h1Text}`);
    }

    // Count cards or widgets
    const cards = await page.$$('[class*="card"], .card, [role="article"]');
    testResult.elements.cardCount = cards.length;
    testResult.actions.push(`Found ${cards.length} card elements`);

    // Check for navigation links
    const navLinks = await page.$$('nav a, [role="navigation"] a');
    testResult.elements.navLinkCount = navLinks.length;
    testResult.actions.push(`Found ${navLinks.length} navigation links`);

    testResult.notes.push('Dashboard loaded successfully');

  } catch (error) {
    testResult.status = 'failed';
    testResult.consoleErrors.push(`Test Error: ${error.message}`);
    testResult.screenshots.push(await takeScreenshot(page, 'admin-dashboard-error'));
  }

  testResult.consoleErrors.push(...errorTracking.consoleErrors);
  testResult.consoleWarnings.push(...errorTracking.consoleWarnings);
  testResult.networkErrors.push(...errorTracking.networkErrors);
  testResult.duration = Date.now() - startTime;

  return testResult;
}

async function testRestaurants(page) {
  console.log('\n--- Testing Restaurants Page ---');
  const testResult = {
    page: 'Restaurants',
    url: `${BASE_URL}/admin/restaurants`,
    status: 'passed',
    duration: 0,
    screenshots: [],
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    actions: [],
    notes: [],
    elements: {}
  };

  const startTime = Date.now();
  const errorTracking = await captureConsoleErrors(page);

  try {
    await page.goto(`${BASE_URL}/admin/restaurants`, { waitUntil: 'networkidle2', timeout: 30000 });
    testResult.actions.push('Navigated to restaurants page');

    await page.waitForSelector('body', { timeout: 5000 });
    testResult.screenshots.push(await takeScreenshot(page, 'admin-05-restaurants'));

    const pageTitle = await page.title();
    testResult.elements.pageTitle = pageTitle;
    testResult.actions.push(`Page title: ${pageTitle}`);

    const h1Text = await page.$eval('h1', el => el.textContent).catch(() => null);
    if (h1Text) {
      testResult.elements.mainHeading = h1Text;
      testResult.actions.push(`Main heading: ${h1Text}`);
    }

    // Look for restaurant list or table
    const tableRows = await page.$$('table tr, [role="row"]').catch(() => []);
    testResult.elements.tableRows = tableRows.length;
    testResult.actions.push(`Found ${tableRows.length} table rows`);

    // Look for add/create buttons
    const buttons = await page.$$('button');
    testResult.elements.buttonCount = buttons.length;
    testResult.actions.push(`Found ${buttons.length} buttons`);

    // Test search or filter if available
    const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]');
    if (searchInput) {
      testResult.actions.push('Search/filter input found');
      testResult.elements.hasSearch = true;
    }

    testResult.notes.push('Restaurants page loaded successfully');

  } catch (error) {
    testResult.status = 'failed';
    testResult.consoleErrors.push(`Test Error: ${error.message}`);
    testResult.screenshots.push(await takeScreenshot(page, 'admin-restaurants-error'));
  }

  testResult.consoleErrors.push(...errorTracking.consoleErrors);
  testResult.consoleWarnings.push(...errorTracking.consoleWarnings);
  testResult.networkErrors.push(...errorTracking.networkErrors);
  testResult.duration = Date.now() - startTime;

  return testResult;
}

async function testOrders(page) {
  console.log('\n--- Testing Orders Page ---');
  const testResult = {
    page: 'Orders',
    url: `${BASE_URL}/admin/orders`,
    status: 'passed',
    duration: 0,
    screenshots: [],
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    actions: [],
    notes: [],
    elements: {}
  };

  const startTime = Date.now();
  const errorTracking = await captureConsoleErrors(page);

  try {
    await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle2', timeout: 30000 });
    testResult.actions.push('Navigated to orders page');

    await page.waitForSelector('body', { timeout: 5000 });
    testResult.screenshots.push(await takeScreenshot(page, 'admin-06-orders'));

    const pageTitle = await page.title();
    testResult.elements.pageTitle = pageTitle;
    testResult.actions.push(`Page title: ${pageTitle}`);

    const h1Text = await page.$eval('h1', el => el.textContent).catch(() => null);
    if (h1Text) {
      testResult.elements.mainHeading = h1Text;
      testResult.actions.push(`Main heading: ${h1Text}`);
    }

    // Look for orders list or table
    const tableRows = await page.$$('table tr, [role="row"]').catch(() => []);
    testResult.elements.tableRows = tableRows.length;
    testResult.actions.push(`Found ${tableRows.length} table rows`);

    // Look for order cards
    const orderCards = await page.$$('[class*="order"], [data-order-id]').catch(() => []);
    testResult.elements.orderCards = orderCards.length;
    testResult.actions.push(`Found ${orderCards.length} order cards`);

    // Check for status filters
    const filterButtons = await page.$$('[role="tab"], button[data-status], [class*="filter"]').catch(() => []);
    testResult.elements.filterCount = filterButtons.length;
    testResult.actions.push(`Found ${filterButtons.length} filter/tab elements`);

    testResult.notes.push('Orders page loaded successfully');

  } catch (error) {
    testResult.status = 'failed';
    testResult.consoleErrors.push(`Test Error: ${error.message}`);
    testResult.screenshots.push(await takeScreenshot(page, 'admin-orders-error'));
  }

  testResult.consoleErrors.push(...errorTracking.consoleErrors);
  testResult.consoleWarnings.push(...errorTracking.consoleWarnings);
  testResult.networkErrors.push(...errorTracking.networkErrors);
  testResult.duration = Date.now() - startTime;

  return testResult;
}

async function testUsers(page) {
  console.log('\n--- Testing Users Page ---');
  const testResult = {
    page: 'Users',
    url: `${BASE_URL}/admin/users`,
    status: 'passed',
    duration: 0,
    screenshots: [],
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    actions: [],
    notes: [],
    elements: {}
  };

  const startTime = Date.now();
  const errorTracking = await captureConsoleErrors(page);

  try {
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle2', timeout: 30000 });
    testResult.actions.push('Navigated to users page');

    await page.waitForSelector('body', { timeout: 5000 });
    testResult.screenshots.push(await takeScreenshot(page, 'admin-07-users'));

    const pageTitle = await page.title();
    testResult.elements.pageTitle = pageTitle;
    testResult.actions.push(`Page title: ${pageTitle}`);

    const h1Text = await page.$eval('h1', el => el.textContent).catch(() => null);
    if (h1Text) {
      testResult.elements.mainHeading = h1Text;
      testResult.actions.push(`Main heading: ${h1Text}`);
    }

    // Look for users list or table
    const tableRows = await page.$$('table tr, [role="row"]').catch(() => []);
    testResult.elements.tableRows = tableRows.length;
    testResult.actions.push(`Found ${tableRows.length} table rows`);

    // Look for user management buttons
    const buttons = await page.$$('button');
    testResult.elements.buttonCount = buttons.length;
    testResult.actions.push(`Found ${buttons.length} buttons`);

    // Check for role filters or user type filters
    const filterElements = await page.$$('select, [role="combobox"], [class*="filter"]').catch(() => []);
    testResult.elements.filterCount = filterElements.length;
    testResult.actions.push(`Found ${filterElements.length} filter elements`);

    testResult.notes.push('Users page loaded successfully');

  } catch (error) {
    testResult.status = 'failed';
    testResult.consoleErrors.push(`Test Error: ${error.message}`);
    testResult.screenshots.push(await takeScreenshot(page, 'admin-users-error'));
  }

  testResult.consoleErrors.push(...errorTracking.consoleErrors);
  testResult.consoleWarnings.push(...errorTracking.consoleWarnings);
  testResult.networkErrors.push(...errorTracking.networkErrors);
  testResult.duration = Date.now() - startTime;

  return testResult;
}

async function testButtonInteractions(page) {
  console.log('\n--- Testing Button Interactions ---');
  const testResult = {
    page: 'Button Interactions',
    url: page.url(),
    status: 'passed',
    duration: 0,
    screenshots: [],
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    actions: [],
    notes: []
  };

  const startTime = Date.now();
  const errorTracking = await captureConsoleErrors(page);

  try {
    // Go back to dashboard for comprehensive button testing
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Test navigation between pages
    const navLinks = await page.$$('nav a, [role="navigation"] a');
    testResult.actions.push(`Found ${navLinks.length} navigation links to test`);

    for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
      try {
        const link = navLinks[i];
        const href = await page.evaluate(el => el.href, link);
        const text = await page.evaluate(el => el.textContent, link);

        testResult.actions.push(`Testing link: "${text}" (${href})`);

        await link.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

        const currentUrl = page.url();
        testResult.actions.push(`Navigated to: ${currentUrl}`);

        await page.waitForTimeout(500);
      } catch (error) {
        testResult.consoleErrors.push(`Link test error: ${error.message}`);
      }
    }

    testResult.screenshots.push(await takeScreenshot(page, 'admin-08-navigation-test'));
    testResult.notes.push('Navigation button tests completed');

  } catch (error) {
    testResult.status = 'failed';
    testResult.consoleErrors.push(`Test Error: ${error.message}`);
    testResult.screenshots.push(await takeScreenshot(page, 'admin-buttons-error'));
  }

  testResult.consoleErrors.push(...errorTracking.consoleErrors);
  testResult.consoleWarnings.push(...errorTracking.consoleWarnings);
  testResult.networkErrors.push(...errorTracking.networkErrors);
  testResult.duration = Date.now() - startTime;

  return testResult;
}

async function runTests() {
  console.log('Starting Admin Portal Tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Run all tests
    testResults.tests.push(await login(page));
    testResults.tests.push(await testDashboard(page));
    testResults.tests.push(await testRestaurants(page));
    testResults.tests.push(await testOrders(page));
    testResults.tests.push(await testUsers(page));
    testResults.tests.push(await testButtonInteractions(page));

    // Calculate summary
    testResults.tests.forEach(test => {
      testResults.summary.total++;
      if (test.status === 'passed') {
        testResults.summary.passed++;
      } else if (test.status === 'failed') {
        testResults.summary.failed++;
      }
      testResults.summary.warnings += test.consoleWarnings.length;
    });

  } catch (error) {
    console.error('Fatal test error:', error);
    testResults.fatalError = error.message;
  } finally {
    await browser.close();
  }

  // Save JSON results
  const resultsFile = path.join(__dirname, 'admin-portal-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\nResults saved to: ${resultsFile}`);

  // Generate report
  generateReport();

  return testResults;
}

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('ADMIN PORTAL TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${testResults.timestamp}`);
  console.log(`Base URL: ${testResults.baseUrl}`);
  console.log('\nSUMMARY:');
  console.log(`  Total Tests: ${testResults.summary.total}`);
  console.log(`  Passed: ${testResults.summary.passed}`);
  console.log(`  Failed: ${testResults.summary.failed}`);
  console.log(`  Warnings: ${testResults.summary.warnings}`);
  console.log('\n' + '-'.repeat(80));

  testResults.tests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.page} - ${test.status.toUpperCase()}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Duration: ${test.duration}ms`);
    console.log(`   Screenshots: ${test.screenshots.length}`);
    console.log(`   Console Errors: ${test.consoleErrors.length}`);
    console.log(`   Console Warnings: ${test.consoleWarnings.length}`);
    console.log(`   Network Errors: ${test.networkErrors.length}`);

    if (test.actions.length > 0) {
      console.log('   Actions:');
      test.actions.forEach(action => console.log(`     - ${action}`));
    }

    if (test.consoleErrors.length > 0) {
      console.log('   Console Errors:');
      test.consoleErrors.forEach(error => console.log(`     ! ${error}`));
    }

    if (test.networkErrors.length > 0) {
      console.log('   Network Errors:');
      test.networkErrors.forEach(error => console.log(`     ! ${error.url}: ${error.failure}`));
    }

    if (test.notes.length > 0) {
      console.log('   Notes:');
      test.notes.forEach(note => console.log(`     * ${note}`));
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(80) + '\n');
}

// Run the tests
runTests().catch(console.error);
