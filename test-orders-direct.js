const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testOrdersPageDirectly() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    errors: [],
    consoleMessages: [],
    screenshots: []
  };

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    results.consoleMessages.push({ type, text, timestamp: new Date().toISOString() });
    console.log(`[Browser Console ${type.toUpperCase()}]:`, text);
  });

  // Capture page errors
  page.on('pageerror', error => {
    results.errors.push({
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error('[Page Error]:', error.message);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    results.errors.push({
      type: 'requestfailed',
      url: request.url(),
      failure: request.failure().errorText,
      timestamp: new Date().toISOString()
    });
    console.error('[Request Failed]:', request.url(), request.failure().errorText);
  });

  try {
    // Step 1: Navigate to login page
    console.log('\n=== Step 1: Navigate to Login Page ===');
    await page.goto('http://localhost:45002/login', { waitUntil: 'networkidle2' });
    results.steps.push({ step: 1, action: 'Navigate to login page', status: 'success' });

    // Step 2: Fill in login credentials
    console.log('\n=== Step 2: Fill Login Credentials ===');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    await page.type('input[type="email"], input[name="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"], input[name="password"]', 'password123');
    results.steps.push({ step: 2, action: 'Fill login credentials', status: 'success' });

    // Step 3: Click login button
    console.log('\n=== Step 3: Click Login Button ===');
    await page.click('button[type="submit"]');
    results.steps.push({ step: 3, action: 'Click login button', status: 'success' });

    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    console.log('Current URL:', page.url());

    // Step 4: Navigate directly to orders page
    console.log('\n=== Step 4: Navigate Directly to Orders Page ===');
    await page.goto('http://localhost:45002/restaurant/@fitfresh-abudhabi/orders', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    results.steps.push({ step: 4, action: 'Navigate directly to orders page', status: 'success' });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    const screenshot1 = await page.screenshot({ fullPage: true });
    const screenshot1Path = path.join(__dirname, 'screenshots', 'orders-page-direct.png');
    fs.mkdirSync(path.dirname(screenshot1Path), { recursive: true });
    fs.writeFileSync(screenshot1Path, screenshot1);
    results.screenshots.push(screenshot1Path);
    console.log('Screenshot saved:', screenshot1Path);

    // Step 5: Check page content
    console.log('\n=== Step 5: Check Page Content ===');
    const pageContent = await page.content();

    // Check for key indicators
    const hasLoadingText = pageContent.includes('Loading...');
    const hasSomethingWentWrong = pageContent.includes('Something went wrong');
    const hasRestaurantName = pageContent.includes('Fit & Fresh Abu Dhabi') || pageContent.includes('Fit') || pageContent.includes('Fresh');
    const hasOrdersText = pageContent.includes('Orders') || pageContent.includes('order');
    const hasNoOrdersText = pageContent.includes('No orders found');

    results.pageCheck = {
      hasLoadingText,
      hasSomethingWentWrong,
      hasRestaurantName,
      hasOrdersText,
      hasNoOrdersText,
      url: page.url()
    };

    console.log('\n=== Page Content Check ===');
    console.log('Has "Loading..." text:', hasLoadingText);
    console.log('Has "Something went wrong":', hasSomethingWentWrong);
    console.log('Has restaurant name:', hasRestaurantName);
    console.log('Has orders text:', hasOrdersText);
    console.log('Has "No orders found":', hasNoOrdersText);
    console.log('Current URL:', page.url());

    results.steps.push({
      step: 5,
      action: 'Check page content',
      status: !hasLoadingText && !hasSomethingWentWrong ? 'success' : 'warning',
      details: results.pageCheck
    });

    // Step 6: Check for visible elements
    console.log('\n=== Step 6: Check for Visible Elements ===');
    const hasOrderElements = await page.evaluate(() => {
      const orderDivs = document.querySelectorAll('[class*="order"]');
      const tableRows = document.querySelectorAll('table tr');
      return {
        orderDivs: orderDivs.length,
        tableRows: tableRows.length
      };
    });

    console.log('Order divs found:', hasOrderElements.orderDivs);
    console.log('Table rows found:', hasOrderElements.tableRows);

    results.elementsCheck = hasOrderElements;
    results.steps.push({
      step: 6,
      action: 'Check for visible elements',
      status: 'success',
      details: hasOrderElements
    });

  } catch (error) {
    console.error('\n=== Test Error ===');
    console.error(error);
    results.errors.push({
      type: 'test-error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  // Save final screenshot
  try {
    const finalScreenshot = await page.screenshot({ fullPage: true });
    const finalPath = path.join(__dirname, 'screenshots', 'orders-final-direct.png');
    fs.writeFileSync(finalPath, finalScreenshot);
    results.screenshots.push(finalPath);
    console.log('\nFinal screenshot saved:', finalPath);
  } catch (e) {
    console.error('Could not save final screenshot:', e.message);
  }

  // Save test results
  const resultsPath = path.join(__dirname, 'test-results-orders-direct.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log('\n=== Test Results ===');
  console.log('Results saved to:', resultsPath);

  // Print summary
  console.log('\n=== Summary ===');
  console.log('Total steps:', results.steps.length);
  console.log('Successful steps:', results.steps.filter(s => s.status === 'success').length);
  console.log('Failed steps:', results.steps.filter(s => s.status === 'failed').length);
  console.log('Errors:', results.errors.length);
  console.log('Console messages:', results.consoleMessages.length);

  if (results.pageCheck) {
    console.log('\n=== Page Check Results ===');
    console.log('Page works correctly:', !results.pageCheck.hasLoadingText && !results.pageCheck.hasSomethingWentWrong);
    console.log('Restaurant name visible:', results.pageCheck.hasRestaurantName);
    console.log('Has orders or "No orders found":', results.pageCheck.hasOrdersText || results.pageCheck.hasNoOrdersText);
  }

  if (results.errors.length > 0) {
    console.log('\n=== Errors ===');
    results.errors.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.type}:`, err.message || err.failure);
    });
  }

  // Keep browser open for 5 seconds to see final state
  console.log('\nKeeping browser open for 5 seconds...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  await browser.close();

  return results;
}

// Run the test
testOrdersPageDirectly()
  .then(() => {
    console.log('\n=== Test Completed ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n=== Test Failed ===');
    console.error(error);
    process.exit(1);
  });
