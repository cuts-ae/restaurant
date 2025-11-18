const puppeteer = require('puppeteer');
const fs = require('fs');

async function testChatCreation() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  const consoleLogs = [];
  const apiCalls = [];

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    console.log(`[CONSOLE ${msg.type().toUpperCase()}]:`, text);
  });

  // Capture network requests to API
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      const postData = request.postData();
      apiCalls.push({
        type: 'REQUEST',
        url: url,
        method: request.method(),
        postData: postData,
        timestamp: new Date().toISOString()
      });
      console.log(`\n[API REQUEST]: ${request.method()} ${url}`);
      if (postData) {
        console.log('[POST DATA]:', postData);
      }
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      try {
        const text = await response.text();
        apiCalls.push({
          type: 'RESPONSE',
          url: url,
          status: response.status(),
          body: text,
          timestamp: new Date().toISOString()
        });
        console.log(`[API RESPONSE]: ${response.status()} ${url}`);
        console.log('[RESPONSE BODY]:', text);
      } catch (e) {
        console.log('[API RESPONSE]: Could not read body');
      }
    }
  });

  try {
    console.log('\n========================================');
    console.log('STEP 1: Navigate to login page');
    console.log('========================================\n');
    await page.goto('http://localhost:45002/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    console.log('\n========================================');
    console.log('STEP 2: Login with owner1@cuts.ae');
    console.log('========================================\n');
    await page.type('input[type="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n========================================');
    console.log('STEP 3: Click on first restaurant');
    console.log('========================================\n');
    // Wait for restaurant cards to load - they are Card components
    await page.waitForSelector('[class*="group"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));
    const cards = await page.$$('[class*="group"][class*="hover:shadow"]');
    if (cards.length > 0) {
      console.log('Found', cards.length, 'restaurant cards, clicking first one');
      // The card uses window.location.href so we need to wait for URL change instead
      await Promise.all([
        page.waitForFunction(() => window.location.href.includes('/restaurant/@'), { timeout: 10000 }),
        cards[0].click()
      ]);
      await new Promise(r => setTimeout(r, 3000));
    } else {
      throw new Error('No restaurant cards found');
    }

    console.log('\n========================================');
    console.log('STEP 4: Navigate to Support tab');
    console.log('========================================\n');
    // The URL should now be /restaurant/@{slug}/... we need to navigate to support
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    const supportUrl = currentUrl.replace(/\/[^/]*$/, '/support');
    console.log('Navigating to:', supportUrl);
    await page.goto(supportUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n========================================');
    console.log('STEP 5: Click New Chat button');
    console.log('========================================\n');
    // Wait for page to load and find New Chat button
    await new Promise(r => setTimeout(r, 1000));
    const buttons = await page.$$('button');
    let clicked = false;
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('New Chat')) {
        console.log('Found and clicking New Chat button');
        await button.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      throw new Error('New Chat button not found');
    }
    await new Promise(r => setTimeout(r, 1000));

    console.log('\n========================================');
    console.log('STEP 6: Fill in chat form');
    console.log('========================================\n');
    // Fill in subject and message using id selectors from the component
    await page.waitForSelector('#subject', { timeout: 5000 });
    await page.waitForSelector('#message', { timeout: 5000 });

    await page.type('#subject', 'Test Chat Subject');
    await page.type('#message', 'This is a test message to check UUID handling');
    await new Promise(r => setTimeout(r, 1000));

    console.log('\n========================================');
    console.log('STEP 7: Submit chat form');
    console.log('========================================\n');
    // Find and click the "Start Chat" submit button
    const submitButtons = await page.$$('button[type="submit"]');
    let submitted = false;
    for (const button of submitButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Start Chat')) {
        console.log('Clicking Start Chat button');
        await button.click();
        submitted = true;
        break;
      }
    }
    if (!submitted) {
      throw new Error('Start Chat button not found');
    }
    await new Promise(r => setTimeout(r, 3000));

    console.log('\n========================================');
    console.log('STEP 8: Wait for response');
    console.log('========================================\n');
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n========================================');
    console.log('TEST COMPLETE - Analyzing Results');
    console.log('========================================\n');

    // Analyze the logs
    console.log('\n\n=== CRITICAL CONSOLE LOGS ===\n');
    const criticalLogs = consoleLogs.filter(log =>
      log.text.includes('Restaurant API Response') ||
      log.text.includes('Setting Restaurant ID') ||
      log.text.includes('createNewSession called') ||
      log.text.includes('Creating new chat session') ||
      log.text.includes('restaurantId') ||
      log.text.includes('restaurant_id')
    );
    criticalLogs.forEach(log => {
      console.log(`[${log.timestamp}] [${log.type}]: ${log.text}`);
    });

    console.log('\n\n=== ALL API CALLS ===\n');
    apiCalls.forEach(call => {
      console.log(`\n[${call.timestamp}] ${call.type}: ${call.method || ''} ${call.url}`);
      if (call.postData) {
        console.log('POST DATA:', call.postData);
      }
      if (call.body) {
        console.log('RESPONSE:', call.body);
      }
    });

    // Save results to file
    const results = {
      consoleLogs,
      apiCalls,
      criticalLogs,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      '/Users/sour/Projects/cuts.ae/restaurant/chat-creation-test-results.json',
      JSON.stringify(results, null, 2)
    );

    console.log('\n\nResults saved to chat-creation-test-results.json');
    console.log('\nBrowser will stay open for 10 seconds for manual inspection...');
    await new Promise(r => setTimeout(r, 10000));

  } catch (error) {
    console.error('\n\nERROR during test:', error.message);
    console.error(error.stack);

    // Save error state
    await page.screenshot({
      path: '/Users/sour/Projects/cuts.ae/restaurant/error-screenshot.png',
      fullPage: true
    });
    console.log('Error screenshot saved to error-screenshot.png');
  } finally {
    await browser.close();
  }
}

testChatCreation().catch(console.error);
