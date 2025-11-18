const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:45002';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

// Create screenshot directory if it doesn't exist
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filepath}`);
  return filepath;
}

async function getConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

async function test1LoginRedirect(browser) {
  console.log('\n========================================');
  console.log('TEST 1: Login Page Redirect');
  console.log('========================================\n');

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    await takeScreenshot(page, 'test1-step1-login-page');

    // Step 2: Fill in credentials
    console.log('Step 2: Filling in credentials (owner1@cuts.ae / password123)...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"]', 'password123');
    await takeScreenshot(page, 'test1-step2-filled-credentials');

    // Step 3: Click login button
    console.log('Step 3: Clicking login button...');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    console.log('Step 4: Waiting for redirect to dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    await sleep(1000);

    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    await takeScreenshot(page, 'test1-step3-after-login');

    if (currentUrl.includes('/dashboard')) {
      console.log('✓ Successfully redirected to dashboard');
    } else {
      console.log('✗ FAILED: Not redirected to dashboard');
      console.log(`FAIL: Expected /dashboard, got ${currentUrl}`);
      return { status: 'FAIL', message: `Not redirected to dashboard. Current URL: ${currentUrl}` };
    }

    // Step 5: Now navigate directly to /login
    console.log('\nStep 5: Navigating directly to /login (should redirect back to dashboard)...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const urlAfterLoginAttempt = page.url();
    console.log(`URL after attempting to visit /login: ${urlAfterLoginAttempt}`);
    await takeScreenshot(page, 'test1-step5-login-redirect-check');

    // Check if we're still on dashboard or redirected back
    if (urlAfterLoginAttempt.includes('/dashboard')) {
      console.log('✓ PASS: Correctly redirected back to dashboard');
      console.log('✓ Login page redirect is working properly');
      return {
        status: 'PASS',
        message: 'Login page correctly redirects authenticated users to dashboard',
        consoleErrors: consoleErrors
      };
    } else if (urlAfterLoginAttempt.includes('/login')) {
      console.log('✗ FAIL: Login form is shown (should have redirected to dashboard)');
      return {
        status: 'FAIL',
        message: 'Authenticated user can still see login page - redirect not working',
        consoleErrors: consoleErrors
      };
    } else {
      console.log(`✗ FAIL: Unexpected URL: ${urlAfterLoginAttempt}`);
      return {
        status: 'FAIL',
        message: `Unexpected redirect to: ${urlAfterLoginAttempt}`,
        consoleErrors: consoleErrors
      };
    }

  } catch (error) {
    console.error('✗ FAIL: Error during Test 1:', error.message);
    await takeScreenshot(page, 'test1-error');
    return { status: 'FAIL', message: error.message, consoleErrors: consoleErrors };
  } finally {
    await page.close();
  }
}

async function test2MenuPage(browser) {
  console.log('\n========================================');
  console.log('TEST 2: Menu Page');
  console.log('========================================\n');

  // Create new incognito context for fresh session
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      consoleErrors.push(text);
      if (text.includes('toFixed')) {
        console.log(`⚠ Console Error: ${text}`);
      }
    }
  });

  try {
    // Login first
    console.log('Step 1: Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    await sleep(1000);

    console.log('Step 2: Clicking on "Fit & Fresh Abu Dhabi" restaurant...');
    // Wait for restaurant cards to load (they have cursor-pointer class)
    await page.waitForSelector('.cursor-pointer', { timeout: 10000 });
    await sleep(1000);
    await takeScreenshot(page, 'test2-step1-dashboard');

    // Find and click the Fit & Fresh Abu Dhabi card
    const restaurantCards = await page.$$('.cursor-pointer');
    let foundRestaurant = false;

    for (const card of restaurantCards) {
      const text = await page.evaluate(el => el.textContent, card);
      if (text.includes('Fit & Fresh') && text.includes('Abu Dhabi')) {
        console.log(`Found restaurant: Fit & Fresh Abu Dhabi`);
        await card.click();
        foundRestaurant = true;
        break;
      }
    }

    if (!foundRestaurant && restaurantCards.length > 0) {
      // Just click the first restaurant
      console.log('Could not find Fit & Fresh specifically, clicking first restaurant...');
      await restaurantCards[0].click();
    } else if (!foundRestaurant) {
      throw new Error('No restaurant cards found on dashboard');
    }

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    await sleep(1000);
    await takeScreenshot(page, 'test2-step2-restaurant-page');

    console.log('Step 3: Clicking on "Menu" tab...');
    // Wait for and click Menu tab
    await page.waitForSelector('button[role="tab"]', { timeout: 5000 });
    const tabs = await page.$$('button[role="tab"]');

    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.toLowerCase().includes('menu')) {
        console.log('Found Menu tab, clicking...');
        await tab.click();
        break;
      }
    }

    await sleep(2000);
    await takeScreenshot(page, 'test2-step3-menu-tab');

    console.log('Step 4: Checking menu items...');

    // Check for loading state
    const loadingText = await page.evaluate(() => {
      return document.body.textContent.includes('Loading menu items');
    });

    if (loadingText) {
      console.log('⚠ Warning: "Loading menu items..." is still showing');
      await sleep(3000); // Wait a bit more
      await takeScreenshot(page, 'test2-step4-still-loading');
    }

    // Check for menu items with prices
    const hasMenuItems = await page.evaluate(() => {
      const body = document.body.textContent;
      return body.includes('AED') && (body.includes('.00') || body.includes('.50'));
    });

    if (hasMenuItems) {
      console.log('✓ Menu items found with prices in AED format');
    } else {
      console.log('✗ No menu items with proper pricing found');
    }

    // Check for toFixed errors in console
    const hasToFixedError = consoleErrors.some(err =>
      err.includes('toFixed') || err.includes('is not a function')
    );

    if (hasToFixedError) {
      console.log('✗ FAIL: Console shows toFixed errors');
      return {
        status: 'FAIL',
        message: 'Menu page has toFixed errors in console',
        consoleErrors: consoleErrors
      };
    }

    // Check for error messages on page
    const hasErrorMessage = await page.evaluate(() => {
      const body = document.body.textContent;
      return body.includes('Error loading') || body.includes('Failed to');
    });

    if (hasErrorMessage) {
      console.log('✗ FAIL: Error message displayed on page');
      return {
        status: 'FAIL',
        message: 'Error message displayed on menu page',
        consoleErrors: consoleErrors
      };
    }

    await takeScreenshot(page, 'test2-final-menu-page');

    if (hasMenuItems && !hasToFixedError && !hasErrorMessage && !loadingText) {
      console.log('✓ PASS: Menu page loads correctly with proper pricing');
      return {
        status: 'PASS',
        message: 'Menu items display with correct AED pricing format',
        consoleErrors: consoleErrors
      };
    } else {
      console.log('✗ FAIL: Menu page has issues');
      return {
        status: 'FAIL',
        message: `Issues found - hasMenuItems: ${hasMenuItems}, loadingText: ${loadingText}`,
        consoleErrors: consoleErrors
      };
    }

  } catch (error) {
    console.error('✗ FAIL: Error during Test 2:', error.message);
    await takeScreenshot(page, 'test2-error');
    return { status: 'FAIL', message: error.message, consoleErrors: consoleErrors };
  } finally {
    await page.close();
    await context.close();
  }
}

async function test3OrdersPage(browser) {
  console.log('\n========================================');
  console.log('TEST 3: Orders Page');
  console.log('========================================\n');

  // Create new incognito context for fresh session
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Login first
    console.log('Step 1: Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    await sleep(1000);

    console.log('Step 2: Navigating to restaurant...');
    await page.waitForSelector('.cursor-pointer', { timeout: 10000 });
    await sleep(1000);
    const restaurantCards = await page.$$('.cursor-pointer');
    if (restaurantCards.length === 0) {
      throw new Error('No restaurant cards found on dashboard');
    }
    await restaurantCards[0].click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    await sleep(1000);

    console.log('Step 3: Clicking on "Orders" tab...');
    await page.waitForSelector('button[role="tab"]', { timeout: 5000 });
    const tabs = await page.$$('button[role="tab"]');

    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.toLowerCase().includes('order')) {
        console.log('Found Orders tab, clicking...');
        await tab.click();
        break;
      }
    }

    await sleep(2000);
    await takeScreenshot(page, 'test3-orders-page');

    console.log('Step 4: Checking for orders...');

    // Check for order statuses
    const orderInfo = await page.evaluate(() => {
      const body = document.body.textContent;
      return {
        hasPending: body.toLowerCase().includes('pending'),
        hasPreparing: body.toLowerCase().includes('preparing'),
        hasConfirmed: body.toLowerCase().includes('confirmed'),
        hasPrices: body.includes('AED'),
        hasOrders: body.includes('Order') || body.includes('#')
      };
    });

    console.log('Order page analysis:', orderInfo);

    if (orderInfo.hasOrders && orderInfo.hasPrices) {
      console.log('✓ PASS: Orders page displays orders with prices');
      return {
        status: 'PASS',
        message: 'Orders page shows orders with different statuses and AED pricing',
        details: orderInfo,
        consoleErrors: consoleErrors
      };
    } else {
      console.log('✗ FAIL: Orders page missing expected content');
      return {
        status: 'FAIL',
        message: 'Orders page does not show expected orders or prices',
        details: orderInfo,
        consoleErrors: consoleErrors
      };
    }

  } catch (error) {
    console.error('✗ FAIL: Error during Test 3:', error.message);
    await takeScreenshot(page, 'test3-error');
    return { status: 'FAIL', message: error.message, consoleErrors: consoleErrors };
  } finally {
    await page.close();
    await context.close();
  }
}

async function test4PasswordAutofill(browser) {
  console.log('\n========================================');
  console.log('TEST 4: Password Autofill');
  console.log('========================================\n');

  // Create new incognito context for fresh session
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('Step 1: Logging in to save credentials...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await takeScreenshot(page, 'test4-step1-login-page');

    // Type credentials
    await page.type('input[type="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"]', 'password123');
    await takeScreenshot(page, 'test4-step2-credentials-filled');

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    await sleep(1000);

    console.log('Step 2: Logging out...');
    // Look for logout button
    const logoutButtons = await page.$$('button');
    for (const button of logoutButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.toLowerCase().includes('logout') || text.toLowerCase().includes('sign out')) {
        console.log('Found logout button, clicking...');
        await button.click();
        await sleep(2000);
        break;
      }
    }

    await takeScreenshot(page, 'test4-step3-after-logout');

    console.log('Step 3: Checking autofill behavior...');
    const currentUrl = page.url();

    if (!currentUrl.includes('/login')) {
      console.log('Navigating back to login page...');
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      await sleep(1000);
    }

    // Click on email field to trigger autofill
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.click('input[type="email"]');
    await sleep(1000);
    await takeScreenshot(page, 'test4-step4-autofill-check');

    // Check if fields have values (autofilled)
    const fieldValues = await page.evaluate(() => {
      const email = document.querySelector('input[type="email"]');
      const password = document.querySelector('input[type="password"]');
      return {
        emailValue: email ? email.value : '',
        passwordValue: password ? password.value : '',
        emailAutocomplete: email ? email.getAttribute('autocomplete') : '',
        passwordAutocomplete: password ? password.getAttribute('autocomplete') : ''
      };
    });

    console.log('Field values after clicking email:', fieldValues);

    console.log('\nNOTE: Autofill behavior depends on browser settings and saved credentials.');
    console.log('Autocomplete attributes found:');
    console.log(`- Email field: autocomplete="${fieldValues.emailAutocomplete}"`);
    console.log(`- Password field: autocomplete="${fieldValues.passwordAutocomplete}"`);

    if (fieldValues.emailAutocomplete && fieldValues.passwordAutocomplete) {
      console.log('✓ PASS: Autocomplete attributes are properly set on form fields');
      return {
        status: 'PASS',
        message: 'Form fields have proper autocomplete attributes to support autofill',
        details: fieldValues,
        note: 'Actual autofill behavior depends on browser having saved credentials',
        consoleErrors: consoleErrors
      };
    } else {
      console.log('⚠ WARNING: Autocomplete attributes may be missing');
      return {
        status: 'PARTIAL',
        message: 'Form may not have optimal autocomplete attributes',
        details: fieldValues,
        consoleErrors: consoleErrors
      };
    }

  } catch (error) {
    console.error('✗ FAIL: Error during Test 4:', error.message);
    await takeScreenshot(page, 'test4-error');
    return { status: 'FAIL', message: error.message, consoleErrors: consoleErrors };
  } finally {
    await page.close();
    await context.close();
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('COMPREHENSIVE RESTAURANT PORTAL TEST');
  console.log('========================================');
  console.log(`Testing: ${BASE_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security'
    ]
  });

  const results = {
    test1: null,
    test2: null,
    test3: null,
    test4: null
  };

  try {
    results.test1 = await test1LoginRedirect(browser);
    results.test2 = await test2MenuPage(browser);
    results.test3 = await test3OrdersPage(browser);
    results.test4 = await test4PasswordAutofill(browser);

    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');

    console.log('TEST 1 - Login Page Redirect:', results.test1.status);
    console.log('  Message:', results.test1.message);
    if (results.test1.consoleErrors.length > 0) {
      console.log('  Console Errors:', results.test1.consoleErrors.length);
    }

    console.log('\nTEST 2 - Menu Page:', results.test2.status);
    console.log('  Message:', results.test2.message);
    if (results.test2.consoleErrors.length > 0) {
      console.log('  Console Errors:', results.test2.consoleErrors.length);
      results.test2.consoleErrors.forEach(err => console.log('    -', err));
    }

    console.log('\nTEST 3 - Orders Page:', results.test3.status);
    console.log('  Message:', results.test3.message);
    if (results.test3.consoleErrors.length > 0) {
      console.log('  Console Errors:', results.test3.consoleErrors.length);
    }

    console.log('\nTEST 4 - Password Autofill:', results.test4.status);
    console.log('  Message:', results.test4.message);
    if (results.test4.note) {
      console.log('  Note:', results.test4.note);
    }

    const totalTests = 4;
    const passedTests = Object.values(results).filter(r => r.status === 'PASS').length;

    console.log('\n========================================');
    console.log(`OVERALL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('========================================');

    // Save detailed results to file
    const reportPath = path.join(__dirname, 'COMPREHENSIVE_TEST_REPORT.md');
    const report = generateReport(results);
    fs.writeFileSync(reportPath, report);
    console.log(`\nDetailed report saved to: ${reportPath}`);

  } catch (error) {
    console.error('Fatal error during testing:', error);
  } finally {
    await browser.close();
  }
}

function generateReport(results) {
  return `# Comprehensive Restaurant Portal Test Report

**Date:** ${new Date().toISOString()}
**Base URL:** ${BASE_URL}

## Test Results Summary

| Test | Status | Details |
|------|--------|---------|
| Test 1: Login Page Redirect | ${results.test1.status} | ${results.test1.message} |
| Test 2: Menu Page | ${results.test2.status} | ${results.test2.message} |
| Test 3: Orders Page | ${results.test3.status} | ${results.test3.message} |
| Test 4: Password Autofill | ${results.test4.status} | ${results.test4.message} |

---

## Test 1: Login Page Redirect

**Status:** ${results.test1.status}

**Description:** Tests that authenticated users are automatically redirected from /login to /dashboard

**Result:** ${results.test1.message}

**Console Errors:** ${results.test1.consoleErrors.length > 0 ? results.test1.consoleErrors.join(', ') : 'None'}

**Screenshots:**
- test1-step1-login-page.png
- test1-step2-filled-credentials.png
- test1-step3-after-login.png
- test1-step5-login-redirect-check.png

---

## Test 2: Menu Page

**Status:** ${results.test2.status}

**Description:** Tests that menu items load properly with correct price formatting (AED XX.XX)

**Result:** ${results.test2.message}

**Console Errors:** ${results.test2.consoleErrors.length > 0 ? '\n' + results.test2.consoleErrors.map(e => `- ${e}`).join('\n') : 'None'}

**Key Checks:**
- Menu items display: ${results.test2.message.includes('correct') ? 'PASS' : 'FAIL'}
- No toFixed errors: ${results.test2.consoleErrors.some(e => e.includes('toFixed')) ? 'FAIL' : 'PASS'}
- Prices in AED format: ${results.test2.message.includes('AED') ? 'PASS' : 'FAIL'}

**Screenshots:**
- test2-step1-dashboard.png
- test2-step2-restaurant-page.png
- test2-step3-menu-tab.png
- test2-final-menu-page.png

---

## Test 3: Orders Page

**Status:** ${results.test3.status}

**Description:** Verifies that orders page displays orders with statuses and pricing

**Result:** ${results.test3.message}

**Console Errors:** ${results.test3.consoleErrors.length > 0 ? results.test3.consoleErrors.join(', ') : 'None'}

${results.test3.details ? `**Details:**
- Has Orders: ${results.test3.details.hasOrders}
- Has Prices: ${results.test3.details.hasPrices}
- Has Pending: ${results.test3.details.hasPending}
- Has Preparing: ${results.test3.details.hasPreparing}
- Has Confirmed: ${results.test3.details.hasConfirmed}
` : ''}

**Screenshots:**
- test3-orders-page.png

---

## Test 4: Password Autofill

**Status:** ${results.test4.status}

**Description:** Checks that form fields support browser autofill for credentials

**Result:** ${results.test4.message}

${results.test4.note ? `**Note:** ${results.test4.note}` : ''}

${results.test4.details ? `**Form Field Analysis:**
- Email autocomplete attribute: ${results.test4.details.emailAutocomplete || 'not set'}
- Password autocomplete attribute: ${results.test4.details.passwordAutocomplete || 'not set'}
` : ''}

**Screenshots:**
- test4-step1-login-page.png
- test4-step2-credentials-filled.png
- test4-step3-after-logout.png
- test4-step4-autofill-check.png

---

## Overall Assessment

**Total Tests:** 4
**Passed:** ${Object.values(results).filter(r => r.status === 'PASS').length}
**Failed:** ${Object.values(results).filter(r => r.status === 'FAIL').length}
**Partial/Warning:** ${Object.values(results).filter(r => r.status === 'PARTIAL').length}

## Recommendations

${results.test1.status === 'FAIL' ? '- Fix login page redirect for authenticated users\n' : ''}
${results.test2.status === 'FAIL' ? '- Fix menu page loading and price formatting issues\n' : ''}
${results.test3.status === 'FAIL' ? '- Fix orders page display\n' : ''}
${results.test4.status === 'FAIL' ? '- Add proper autocomplete attributes to login form\n' : ''}
${Object.values(results).every(r => r.status === 'PASS') ? '- All tests passed! No immediate action required.\n' : ''}

---

*Report generated automatically by comprehensive-test.js*
`;
}

runAllTests().catch(console.error);
