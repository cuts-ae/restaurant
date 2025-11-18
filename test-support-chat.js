const puppeteer = require('puppeteer');
const fs = require('fs');

async function testSupportChat() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();

    // Collect console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
      console.log(`[CONSOLE ${type.toUpperCase()}]:`, text);
    });

    // Collect network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    });

    // Collect failed requests
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure().errorText,
        timestamp: new Date().toISOString()
      });
      console.log(`[FAILED REQUEST]:`, request.url(), request.failure().errorText);
    });

    console.log('\n=== STEP 1: Navigating to login page ===');
    await page.goto('http://localhost:45002/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: '/Users/sour/Projects/cuts.ae/restaurant/screenshots/support-chat-01-login.png', fullPage: true });
    console.log('Screenshot saved: support-chat-01-login.png');

    console.log('\n=== STEP 2: Logging in ===');
    await page.type('input[type="email"]', 'owner@burgerspot.com');
    await page.type('input[type="password"]', 'password123');
    await page.screenshot({ path: '/Users/sour/Projects/cuts.ae/restaurant/screenshots/support-chat-02-credentials-entered.png', fullPage: true });
    console.log('Screenshot saved: support-chat-02-credentials-entered.png');

    // Click login button
    await page.click('button[type="submit"]');
    console.log('Login button clicked, waiting for navigation...');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    await page.screenshot({ path: '/Users/sour/Projects/cuts.ae/restaurant/screenshots/support-chat-03-after-login.png', fullPage: true });
    console.log('Screenshot saved: support-chat-03-after-login.png');

    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    console.log('\n=== STEP 3: Navigating to Support tab ===');

    // Try to find and click Support tab
    const supportTabSelectors = [
      'a[href*="support"]',
      'button:has-text("Support")',
      '[role="tab"]:has-text("Support")',
      'nav a:has-text("Support")'
    ];

    let supportTabFound = false;
    for (const selector of supportTabSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`Found support tab with selector: ${selector}`);
          await element.click();
          supportTabFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!supportTabFound) {
      // Try to get all navigation links
      console.log('\n=== Available Navigation Links ===');
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a, button')).map(el => ({
          tag: el.tagName,
          text: el.textContent.trim(),
          href: el.href || '',
          id: el.id,
          className: el.className
        })).filter(link => link.text.length > 0 && link.text.length < 50);
      });
      console.log(JSON.stringify(links, null, 2));

      // Try to navigate directly to support URL
      const supportUrl = currentUrl.replace(/\/[^\/]*$/, '/support');
      console.log(`\nTrying direct navigation to: ${supportUrl}`);
      await page.goto(supportUrl, { waitUntil: 'networkidle0' });
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/sour/Projects/cuts.ae/restaurant/screenshots/support-chat-04-support-page.png', fullPage: true });
    console.log('Screenshot saved: support-chat-04-support-page.png');

    console.log('\n=== STEP 4: Analyzing Support Page ===');

    const pageAnalysis = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        visibleText: document.body.innerText.substring(0, 500),
        hasChat: !!document.querySelector('[class*="chat"]'),
        hasChatInput: !!document.querySelector('input[type="text"], textarea'),
        hasSendButton: !!document.querySelector('button:has-text("Send"), button[type="submit"]'),
        elements: {
          inputs: Array.from(document.querySelectorAll('input, textarea')).map(el => ({
            type: el.type,
            placeholder: el.placeholder,
            id: el.id,
            className: el.className
          })),
          buttons: Array.from(document.querySelectorAll('button')).map(el => ({
            text: el.textContent.trim(),
            id: el.id,
            className: el.className,
            disabled: el.disabled
          })),
          chatElements: Array.from(document.querySelectorAll('[class*="chat"], [class*="message"], [class*="conversation"]')).map(el => ({
            tag: el.tagName,
            className: el.className,
            id: el.id,
            text: el.textContent.substring(0, 100)
          }))
        }
      };
    });

    console.log('\nPage Analysis:');
    console.log(JSON.stringify(pageAnalysis, null, 2));

    console.log('\n=== STEP 5: Checking for WebSocket connections ===');

    // Check for WebSocket in the page context
    const wsStatus = await page.evaluate(() => {
      return {
        hasWebSocket: typeof WebSocket !== 'undefined',
        activeConnections: window.WebSocket ? 'Available' : 'Not Available'
      };
    });
    console.log('WebSocket Status:', wsStatus);

    console.log('\n=== STEP 6: Attempting to interact with chat ===');

    // Try to find and interact with chat input
    const chatInputSelectors = [
      'input[placeholder*="message"]',
      'input[placeholder*="Message"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Message"]',
      'input[type="text"]',
      'textarea'
    ];

    let chatInputFound = false;
    for (const selector of chatInputSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`Found chat input with selector: ${selector}`);
          await element.type('Test message for support chat');
          chatInputFound = true;
          await page.screenshot({ path: '/Users/sour/Projects/cuts.ae/restaurant/screenshots/support-chat-05-message-typed.png', fullPage: true });
          console.log('Screenshot saved: support-chat-05-message-typed.png');

          // Try to find and click send button
          const sendButtonSelectors = [
            'button:has-text("Send")',
            'button[type="submit"]',
            'button:has-text("send")'
          ];

          for (const btnSelector of sendButtonSelectors) {
            try {
              const btn = await page.$(btnSelector);
              if (btn) {
                console.log(`Found send button with selector: ${btnSelector}`);
                await btn.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: '/Users/sour/Projects/cuts.ae/restaurant/screenshots/support-chat-06-after-send.png', fullPage: true });
                console.log('Screenshot saved: support-chat-06-after-send.png');
                break;
              }
            } catch (e) {
              console.log(`Error clicking send button: ${e.message}`);
            }
          }
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!chatInputFound) {
      console.log('No chat input found on the page');
    }

    console.log('\n=== STEP 7: Final state capture ===');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/sour/Projects/cuts.ae/restaurant/screenshots/support-chat-07-final-state.png', fullPage: true });
    console.log('Screenshot saved: support-chat-07-final-state.png');

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      loginSuccessful: currentUrl.includes('restaurant') || currentUrl.includes('dashboard'),
      currentUrl: page.url(),
      pageAnalysis,
      consoleLogs,
      failedRequests,
      totalNetworkRequests: networkRequests.length,
      wsStatus,
      chatInputFound
    };

    fs.writeFileSync(
      '/Users/sour/Projects/cuts.ae/restaurant/support-chat-test-report.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\n=== Report saved to support-chat-test-report.json ===');

    console.log('\n=== SUMMARY ===');
    console.log('Login successful:', report.loginSuccessful);
    console.log('Final URL:', page.url());
    console.log('Chat input found:', chatInputFound);
    console.log('Console errors:', consoleLogs.filter(log => log.type === 'error').length);
    console.log('Failed requests:', failedRequests.length);

    // Keep browser open for manual inspection
    console.log('\nBrowser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error during test:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

testSupportChat().catch(console.error);
