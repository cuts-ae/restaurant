const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testOrdersPage() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    consoleErrors: [],
    networkErrors: []
  };

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
      console.log('[Console Error]:', msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    results.consoleErrors.push({
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error('[Page Error]:', error.message);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    results.networkErrors.push({
      url: request.url(),
      failure: request.failure().errorText,
      timestamp: new Date().toISOString()
    });
    console.error('[Request Failed]:', request.url(), request.failure().errorText);
  });

  try {
    console.log('\n==================================================');
    console.log('  RESTAURANT ORDERS PAGE TEST');
    console.log('==================================================\n');

    // Step 1: Login
    console.log('STEP 1: Navigating to login page...');
    await page.goto('http://localhost:45002/login', { waitUntil: 'networkidle2' });

    console.log('STEP 2: Filling credentials...');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"]', 'TabsTriggerIsnt2026*$');

    console.log('STEP 3: Clicking login button...');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('Login successful! Current URL:', page.url());

    // Take dashboard screenshot
    fs.mkdirSync(path.join(__dirname, 'screenshots'), { recursive: true });
    await page.screenshot({
      path: path.join(__dirname, 'screenshots', 'dashboard.png'),
      fullPage: true
    });

    // Step 4: Navigate directly to orders page
    console.log('\nSTEP 4: Navigating to orders page...');
    await page.goto('http://localhost:45002/restaurant/@fitfresh-abudhabi/orders', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    console.log('Orders page loaded! Current URL:', page.url());

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    await page.screenshot({
      path: path.join(__dirname, 'screenshots', 'orders-page.png'),
      fullPage: true
    });

    console.log('\n==================================================');
    console.log('  CHECKING PAGE CONTENT');
    console.log('==================================================\n');

    // Check for restaurant name
    const pageText = await page.evaluate(() => document.body.textContent);
    const hasLoading = pageText.includes('Loading...');
    const hasRestaurantName = pageText.includes('Fit & Fresh') || pageText.includes('fitfresh');
    const hasNoOrders = pageText.includes('No orders found');

    console.log('1. Restaurant Name Check:');
    console.log('   - Contains "Loading...":', hasLoading ? 'YES (BAD)' : 'NO (GOOD)');
    console.log('   - Contains restaurant name:', hasRestaurantName ? 'YES (GOOD)' : 'NO (BAD)');

    results.tests.push({
      name: 'Restaurant name loads',
      passed: !hasLoading && hasRestaurantName,
      details: { hasLoading, hasRestaurantName }
    });

    console.log('\n2. Orders Display Check:');
    console.log('   - Shows "No orders found":', hasNoOrders ? 'YES' : 'NO');

    // Check for order elements
    const orderElements = await page.$$('[class*="order"], table tbody tr, .order-item');
    console.log('   - Order elements found:', orderElements.length);

    results.tests.push({
      name: 'Orders displayed',
      passed: !hasNoOrders || orderElements.length > 0,
      details: { hasNoOrders, orderCount: orderElements.length }
    });

    // Check for specific UI elements
    console.log('\n3. UI Elements Check:');
    const hasOrdersHeading = await page.$('h1, h2').then(el =>
      el ? page.evaluate(e => e.textContent, el) : ''
    );
    console.log('   - Page heading:', hasOrdersHeading || 'Not found');

    const hasTabs = await page.$$('[role="tablist"], .tabs').then(els => els.length > 0);
    console.log('   - Has tabs:', hasTabs ? 'YES' : 'NO');

    // Get all visible text for debugging
    const allH1 = await page.$$eval('h1', elements => elements.map(el => el.textContent));
    const allH2 = await page.$$eval('h2', elements => elements.map(el => el.textContent));
    console.log('\n4. All H1 headings:', allH1.length > 0 ? allH1 : 'None');
    console.log('5. All H2 headings:', allH2.length > 0 ? allH2 : 'None');

    // Check for errors in console
    console.log('\n==================================================');
    console.log('  ERROR SUMMARY');
    console.log('==================================================\n');
    console.log('Console Errors:', results.consoleErrors.length);
    console.log('Network Errors:', results.networkErrors.length);

    if (results.consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      results.consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text}`);
      });
    }

    if (results.networkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      results.networkErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.url} - ${err.failure}`);
      });
    }

    // Final screenshot
    await page.screenshot({
      path: path.join(__dirname, 'screenshots', 'final.png'),
      fullPage: true
    });

    console.log('\n==================================================');
    console.log('  TEST RESULTS SUMMARY');
    console.log('==================================================\n');

    const passedTests = results.tests.filter(t => t.passed).length;
    const totalTests = results.tests.length;

    results.tests.forEach(test => {
      const status = test.passed ? 'PASS' : 'FAIL';
      console.log(`${status}: ${test.name}`);
    });

    console.log(`\nTotal: ${passedTests}/${totalTests} tests passed`);
    console.log(`Overall: ${passedTests === totalTests ? 'SUCCESS' : 'FAILURE'}`);

    // Save results
    const resultsPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${resultsPath}`);
    console.log('Screenshots saved to:', path.join(__dirname, 'screenshots'));

    console.log('\nKeeping browser open for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error(error);
    results.error = {
      message: error.message,
      stack: error.stack
    };
  }

  await browser.close();
  return results;
}

// Run the test
testOrdersPage()
  .then(() => {
    console.log('\n=== Test completed ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n=== Test failed with error ===');
    console.error(error);
    process.exit(1);
  });
