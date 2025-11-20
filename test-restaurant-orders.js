const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testRestaurantOrdersPage() {
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

    const screenshot1 = await page.screenshot({ fullPage: true });
    const screenshot1Path = path.join(__dirname, 'screenshots', 'step1-login-page.png');
    fs.mkdirSync(path.dirname(screenshot1Path), { recursive: true });
    fs.writeFileSync(screenshot1Path, screenshot1);
    results.screenshots.push(screenshot1Path);
    console.log('Screenshot saved:', screenshot1Path);

    // Step 2: Fill in login credentials
    console.log('\n=== Step 2: Fill Login Credentials ===');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    await page.type('input[type="email"], input[name="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"], input[name="password"]', 'TabsTriggerIsnt2026*$');
    results.steps.push({ step: 2, action: 'Fill login credentials', status: 'success' });

    const screenshot2 = await page.screenshot({ fullPage: true });
    const screenshot2Path = path.join(__dirname, 'screenshots', 'step2-credentials-filled.png');
    fs.writeFileSync(screenshot2Path, screenshot2);
    results.screenshots.push(screenshot2Path);
    console.log('Screenshot saved:', screenshot2Path);

    // Step 3: Click login button
    console.log('\n=== Step 3: Click Login Button ===');
    await page.click('button[type="submit"]');
    results.steps.push({ step: 3, action: 'Click login button', status: 'success' });

    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

    const screenshot3 = await page.screenshot({ fullPage: true });
    const screenshot3Path = path.join(__dirname, 'screenshots', 'step3-after-login.png');
    fs.writeFileSync(screenshot3Path, screenshot3);
    results.screenshots.push(screenshot3Path);
    console.log('Screenshot saved:', screenshot3Path);
    console.log('Current URL:', page.url());

    // Step 4: Wait for dashboard and find restaurant card
    console.log('\n=== Step 4: Find Restaurant Card ===');
    await page.waitForSelector('body', { timeout: 5000 });

    // Wait a bit for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    const screenshot4 = await page.screenshot({ fullPage: true });
    const screenshot4Path = path.join(__dirname, 'screenshots', 'step4-dashboard.png');
    fs.writeFileSync(screenshot4Path, screenshot4);
    results.screenshots.push(screenshot4Path);
    console.log('Screenshot saved:', screenshot4Path);

    // Look for "Fit & Fresh Abu Dhabi" restaurant card - try multiple selectors
    let restaurantCard = null;
    const possibleSelectors = [
      'a:has-text("Fit & Fresh Abu Dhabi")',
      'a[href*="fitfresh"]',
      'a[href*="@fitfresh-abudhabi"]',
      'div:has-text("Fit & Fresh Abu Dhabi")',
      '[data-restaurant-name="Fit & Fresh Abu Dhabi"]'
    ];

    // Try to find the restaurant card
    const restaurantLinks = await page.$$('a');
    for (const link of restaurantLinks) {
      const text = await page.evaluate(el => el.textContent, link);
      if (text.includes('Fit & Fresh Abu Dhabi') || text.includes('Fit')) {
        restaurantCard = link;
        console.log('Found restaurant card with text:', text);
        break;
      }
    }

    if (!restaurantCard) {
      // Try to find by href
      restaurantCard = await page.$('a[href*="fitfresh"]') || await page.$('a[href*="@fitfresh-abudhabi"]');
    }

    if (restaurantCard) {
      console.log('Restaurant card found!');
      results.steps.push({ step: 4, action: 'Find restaurant card', status: 'success' });

      // Step 5: Click on restaurant card
      console.log('\n=== Step 5: Click Restaurant Card ===');
      await restaurantCard.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      results.steps.push({ step: 5, action: 'Click restaurant card', status: 'success' });

      console.log('Navigated to:', page.url());

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      const screenshot5 = await page.screenshot({ fullPage: true });
      const screenshot5Path = path.join(__dirname, 'screenshots', 'step5-restaurant-page.png');
      fs.writeFileSync(screenshot5Path, screenshot5);
      results.screenshots.push(screenshot5Path);
      console.log('Screenshot saved:', screenshot5Path);

      // Step 6: Check restaurant name
      console.log('\n=== Step 6: Check Restaurant Name ===');
      const pageContent = await page.content();
      const hasLoadingText = pageContent.includes('Loading...');
      const hasRestaurantName = pageContent.includes('Fit & Fresh Abu Dhabi') || pageContent.includes('fitfresh');

      results.restaurantNameCheck = {
        hasLoadingText,
        hasRestaurantName,
        status: !hasLoadingText && hasRestaurantName ? 'success' : 'warning'
      };

      console.log('Has "Loading..." text:', hasLoadingText);
      console.log('Has restaurant name:', hasRestaurantName);
      results.steps.push({
        step: 6,
        action: 'Check restaurant name',
        status: results.restaurantNameCheck.status,
        details: { hasLoadingText, hasRestaurantName }
      });

      // Step 7: Navigate to orders page
      console.log('\n=== Step 7: Navigate to Orders Page ===');

      // First, check if we're already on the orders page
      const currentUrl = page.url();
      if (currentUrl.includes('/orders')) {
        console.log('Already on orders page');
        results.steps.push({ step: 7, action: 'Already on orders page', status: 'success' });
      } else {
        // Try to find and click orders tab/link
        const ordersSelectors = [
          'a[href*="/orders"]',
          'button:has-text("Orders")',
          'a:has-text("Orders")',
          '[data-tab="orders"]'
        ];

        let ordersLink = null;
        for (const selector of ordersSelectors) {
          try {
            const elements = await page.$$(selector.includes(':has-text') ? 'a, button' : selector);
            for (const el of elements) {
              const text = await page.evaluate(e => e.textContent, el);
              if (text.toLowerCase().includes('orders')) {
                ordersLink = el;
                break;
              }
            }
            if (ordersLink) break;
          } catch (e) {
            // Continue to next selector
          }
        }

        if (ordersLink) {
          await ordersLink.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          results.steps.push({ step: 7, action: 'Navigate to orders page', status: 'success' });
        } else {
          // Try navigating directly
          const slug = currentUrl.includes('@') ? currentUrl.split('/@')[1].split('/')[0] : 'fitfresh-abudhabi';
          await page.goto(`http://localhost:45002/restaurant/@${slug}/orders`, { waitUntil: 'networkidle2' });
          results.steps.push({ step: 7, action: 'Navigate directly to orders page', status: 'success' });
        }
      }

      const screenshot7 = await page.screenshot({ fullPage: true });
      const screenshot7Path = path.join(__dirname, 'screenshots', 'step7-orders-page.png');
      fs.writeFileSync(screenshot7Path, screenshot7);
      results.screenshots.push(screenshot7Path);
      console.log('Screenshot saved:', screenshot7Path);
      console.log('Orders page URL:', page.url());

      // Step 8: Check for orders
      console.log('\n=== Step 8: Check for Orders ===');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const ordersPageContent = await page.content();
      const hasNoOrdersText = ordersPageContent.includes('No orders found');
      const hasOrderElements = await page.$$('div[class*="order"], table tr, [data-order-id]');

      results.ordersCheck = {
        hasNoOrdersText,
        orderElementsCount: hasOrderElements.length,
        status: !hasNoOrdersText || hasOrderElements.length > 0 ? 'success' : 'warning'
      };

      console.log('Has "No orders found" text:', hasNoOrdersText);
      console.log('Order elements found:', hasOrderElements.length);
      results.steps.push({
        step: 8,
        action: 'Check for orders',
        status: results.ordersCheck.status,
        details: { hasNoOrdersText, orderElementsCount: hasOrderElements.length }
      });

      const screenshot8 = await page.screenshot({ fullPage: true });
      const screenshot8Path = path.join(__dirname, 'screenshots', 'step8-orders-final.png');
      fs.writeFileSync(screenshot8Path, screenshot8);
      results.screenshots.push(screenshot8Path);
      console.log('Screenshot saved:', screenshot8Path);

    } else {
      console.log('Restaurant card not found!');
      results.steps.push({ step: 4, action: 'Find restaurant card', status: 'failed' });

      // Save page content for debugging
      const pageContent = await page.content();
      const debugPath = path.join(__dirname, 'screenshots', 'debug-dashboard.html');
      fs.writeFileSync(debugPath, pageContent);
      console.log('Dashboard HTML saved to:', debugPath);
    }

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
    const finalPath = path.join(__dirname, 'screenshots', 'final-state.png');
    fs.writeFileSync(finalPath, finalScreenshot);
    results.screenshots.push(finalPath);
    console.log('\nFinal screenshot saved:', finalPath);
  } catch (e) {
    console.error('Could not save final screenshot:', e.message);
  }

  // Save test results
  const resultsPath = path.join(__dirname, 'test-results-orders.json');
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
  console.log('Screenshots:', results.screenshots.length);

  if (results.restaurantNameCheck) {
    console.log('\nRestaurant Name Check:');
    console.log('  Status:', results.restaurantNameCheck.status);
    console.log('  Has Loading text:', results.restaurantNameCheck.hasLoadingText);
    console.log('  Has Restaurant name:', results.restaurantNameCheck.hasRestaurantName);
  }

  if (results.ordersCheck) {
    console.log('\nOrders Check:');
    console.log('  Status:', results.ordersCheck.status);
    console.log('  Has "No orders found":', results.ordersCheck.hasNoOrdersText);
    console.log('  Order elements:', results.ordersCheck.orderElementsCount);
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
testRestaurantOrdersPage()
  .then(() => {
    console.log('\n=== Test Completed ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n=== Test Failed ===');
    console.error(error);
    process.exit(1);
  });
