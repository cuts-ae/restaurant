const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function comprehensiveSupportTest() {
  const screenshotsDir = '/Users/sour/Projects/cuts.ae/restaurant/screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--disable-web-security']
  });

  const report = {
    timestamp: new Date().toISOString(),
    testSteps: [],
    consoleLogs: [],
    networkRequests: [],
    failedRequests: [],
    screenshots: [],
    findings: {}
  };

  try {
    const page = await browser.newPage();

    page.on('console', msg => {
      const log = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      report.consoleLogs.push(log);
      console.log(`[${log.type.toUpperCase()}]`, log.text);
    });

    page.on('request', request => {
      const req = {
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      };
      report.networkRequests.push(req);
      if (request.url().includes('/api/')) {
        console.log(`[API REQUEST] ${req.method} ${req.url}`);
      }
    });

    page.on('requestfailed', request => {
      const failed = {
        url: request.url(),
        failure: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      };
      report.failedRequests.push(failed);
      console.log(`[FAILED]`, failed.url, failed.failure);
    });

    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        console.log(`[API RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    console.log('\n========================================');
    console.log('STEP 1: Navigate to Login Page');
    console.log('========================================\n');

    await page.goto('http://localhost:45002/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const loginScreenshot = 'step-01-login-page.png';
    await page.screenshot({
      path: path.join(screenshotsDir, loginScreenshot),
      fullPage: true
    });
    report.screenshots.push(loginScreenshot);
    console.log(`Screenshot: ${loginScreenshot}`);

    const loginPageState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        bodyText: document.body.innerText.substring(0, 300)
      };
    });

    report.testSteps.push({
      step: 1,
      name: 'Login Page Load',
      state: loginPageState
    });

    console.log('\n========================================');
    console.log('STEP 2: Enter Credentials and Login');
    console.log('========================================\n');

    console.log('Attempting login with owner@burgerspot.com...');

    await page.type('input[type="email"]', 'owner@burgerspot.com', { delay: 50 });
    await page.type('input[type="password"]', 'password123', { delay: 50 });

    const credentialsScreenshot = 'step-02-credentials-entered.png';
    await page.screenshot({
      path: path.join(screenshotsDir, credentialsScreenshot),
      fullPage: true
    });
    report.screenshots.push(credentialsScreenshot);
    console.log(`Screenshot: ${credentialsScreenshot}`);

    await page.click('button[type="submit"]');
    console.log('Login button clicked');

    await new Promise(resolve => setTimeout(resolve, 3000));

    const afterLoginScreenshot = 'step-03-after-login-attempt.png';
    await page.screenshot({
      path: path.join(screenshotsDir, afterLoginScreenshot),
      fullPage: true
    });
    report.screenshots.push(afterLoginScreenshot);
    console.log(`Screenshot: ${afterLoginScreenshot}`);

    const postLoginState = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasAuthToken: !!localStorage.getItem('auth-token'),
        hasUser: !!localStorage.getItem('user'),
        errorVisible: !!document.querySelector('[class*="destructive"]') ||
                      document.body.innerText.includes('401') ||
                      document.body.innerText.includes('Unauthorized') ||
                      document.body.innerText.includes('failed'),
        errorText: document.querySelector('[class*="destructive"]')?.textContent ||
                   document.body.innerText.match(/error|failed|unauthorized/i)?.[0] || 'None',
        stillOnLoginPage: window.location.pathname === '/login'
      };
    });

    report.testSteps.push({
      step: 2,
      name: 'Login Attempt',
      state: postLoginState
    });

    console.log('Post-login state:', JSON.stringify(postLoginState, null, 2));

    if (postLoginState.errorVisible || postLoginState.stillOnLoginPage) {
      console.log('\nLogin failed. Trying alternate credentials (owner1@cuts.ae)...');

      await page.goto('http://localhost:45002/login', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      await page.type('input[type="email"]', 'owner1@cuts.ae', { delay: 50 });
      await page.type('input[type="password"]', 'password123', { delay: 50 });

      const altCredsScreenshot = 'step-04-alternate-credentials.png';
      await page.screenshot({
        path: path.join(screenshotsDir, altCredsScreenshot),
        fullPage: true
      });
      report.screenshots.push(altCredsScreenshot);

      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const altLoginScreenshot = 'step-05-alternate-login-result.png';
      await page.screenshot({
        path: path.join(screenshotsDir, altLoginScreenshot),
        fullPage: true
      });
      report.screenshots.push(altLoginScreenshot);
    }

    const currentState = await page.evaluate(() => {
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        hasAuthToken: !!localStorage.getItem('auth-token'),
        authToken: localStorage.getItem('auth-token'),
        user: localStorage.getItem('user')
      };
    });

    console.log('\nCurrent state:', JSON.stringify(currentState, null, 2));

    console.log('\n========================================');
    console.log('STEP 3: Navigate to Support Page');
    console.log('========================================\n');

    let supportUrl;
    if (currentState.hasAuthToken) {
      const user = JSON.parse(currentState.user || '{}');
      if (user.restaurants && user.restaurants.length > 0) {
        const restaurantSlug = user.restaurants[0].slug || 'burgerspot';
        supportUrl = `http://localhost:45002/restaurant/${restaurantSlug}/support`;
      }
    }

    if (!supportUrl) {
      supportUrl = 'http://localhost:45002/restaurant/burgerspot/support';
      console.log('Using default support URL:', supportUrl);
    } else {
      console.log('Using restaurant-specific support URL:', supportUrl);
    }

    await page.goto(supportUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const supportPageScreenshot = 'step-06-support-page.png';
    await page.screenshot({
      path: path.join(screenshotsDir, supportPageScreenshot),
      fullPage: true
    });
    report.screenshots.push(supportPageScreenshot);
    console.log(`Screenshot: ${supportPageScreenshot}`);

    console.log('\n========================================');
    console.log('STEP 4: Analyze Support Page Elements');
    console.log('========================================\n');

    const supportPageAnalysis = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        pageHeading: document.querySelector('h2')?.textContent || 'None',
        pageDescription: document.querySelector('p')?.textContent || 'None',

        chatInterface: {
          visible: !!document.querySelector('[class*="chat"]'),
          hasChatCard: !!document.querySelector('.bg-white'),
          hasMessageArea: !!document.querySelector('[class*="overflow-y-auto"]'),
          hasInputField: !!document.querySelector('input[placeholder*="message"], input[placeholder*="Message"]'),
          hasSendButton: !!document.querySelector('button[type="submit"]'),
          hasFileUploadButton: !!document.querySelector('button[type="button"]'),
        },

        connectionStatus: {
          indicator: document.querySelector('[class*="rounded-full"]')?.className || 'None',
          statusText: Array.from(document.querySelectorAll('span')).find(s =>
            s.textContent?.includes('Connected') || s.textContent?.includes('Disconnected')
          )?.textContent || 'Unknown',
          sessionStatus: Array.from(document.querySelectorAll('span')).find(s =>
            s.textContent?.includes('Waiting') || s.textContent?.includes('Active')
          )?.textContent || 'Unknown'
        },

        messages: {
          count: document.querySelectorAll('[class*="flex"][class*="justify-"]').length,
          noMessagesText: document.querySelector('.text-gray-500')?.textContent || 'None',
          hasMessages: document.body.innerText.includes('No messages yet')
        },

        inputElements: Array.from(document.querySelectorAll('input, textarea')).map(el => ({
          type: el.type,
          placeholder: el.placeholder,
          disabled: el.disabled,
          id: el.id,
          className: el.className
        })),

        buttons: Array.from(document.querySelectorAll('button')).map(el => ({
          text: el.textContent?.trim(),
          type: el.type,
          disabled: el.disabled,
          className: el.className
        })),

        visibleText: document.body.innerText.substring(0, 1000)
      };
    });

    console.log('Support Page Analysis:');
    console.log(JSON.stringify(supportPageAnalysis, null, 2));

    report.testSteps.push({
      step: 3,
      name: 'Support Page Analysis',
      state: supportPageAnalysis
    });

    report.findings = {
      chatInterfaceVisible: supportPageAnalysis.chatInterface.visible,
      hasInputField: supportPageAnalysis.chatInterface.hasInputField,
      hasSendButton: supportPageAnalysis.chatInterface.hasSendButton,
      connectionStatus: supportPageAnalysis.connectionStatus.statusText,
      sessionStatus: supportPageAnalysis.connectionStatus.sessionStatus,
      messagesPresent: !supportPageAnalysis.messages.hasMessages
    };

    console.log('\n========================================');
    console.log('STEP 5: Check WebSocket Connection');
    console.log('========================================\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    const wsAnalysis = await page.evaluate(() => {
      return {
        hasWebSocket: typeof WebSocket !== 'undefined',
        hasSocketIO: typeof window['io'] !== 'undefined',
        wsAttempts: window.performance?.getEntriesByType?.('resource')
          ?.filter(r => r.name.includes('socket.io') || r.name.includes('ws://'))
          ?.map(r => ({ name: r.name, duration: r.duration })) || []
      };
    });

    console.log('WebSocket Analysis:', JSON.stringify(wsAnalysis, null, 2));

    report.testSteps.push({
      step: 4,
      name: 'WebSocket Analysis',
      state: wsAnalysis
    });

    console.log('\n========================================');
    console.log('STEP 6: Attempt Message Input');
    console.log('========================================\n');

    const messageInputSelector = 'input[placeholder*="message"], input[placeholder*="Type"]';
    const inputExists = await page.$(messageInputSelector);

    if (inputExists) {
      console.log('Chat input field found, attempting to type message...');

      await page.type(messageInputSelector, 'Test message from automated test', { delay: 100 });

      const messageTypedScreenshot = 'step-07-message-typed.png';
      await page.screenshot({
        path: path.join(screenshotsDir, messageTypedScreenshot),
        fullPage: true
      });
      report.screenshots.push(messageTypedScreenshot);
      console.log(`Screenshot: ${messageTypedScreenshot}`);

      const sendButtonSelector = 'button[type="submit"]';
      const sendButton = await page.$(sendButtonSelector);

      if (sendButton) {
        const isDisabled = await page.evaluate(sel => {
          return document.querySelector(sel)?.disabled;
        }, sendButtonSelector);

        console.log('Send button found, disabled:', isDisabled);

        if (!isDisabled) {
          console.log('Clicking send button...');
          await page.click(sendButtonSelector);
          await new Promise(resolve => setTimeout(resolve, 2000));

          const afterSendScreenshot = 'step-08-after-send.png';
          await page.screenshot({
            path: path.join(screenshotsDir, afterSendScreenshot),
            fullPage: true
          });
          report.screenshots.push(afterSendScreenshot);
          console.log(`Screenshot: ${afterSendScreenshot}`);
        }
      }
    } else {
      console.log('No chat input field found');
    }

    console.log('\n========================================');
    console.log('STEP 7: Final State Capture');
    console.log('========================================\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    const finalScreenshot = 'step-09-final-state.png';
    await page.screenshot({
      path: path.join(screenshotsDir, finalScreenshot),
      fullPage: true
    });
    report.screenshots.push(finalScreenshot);
    console.log(`Screenshot: ${finalScreenshot}`);

    const finalState = await page.evaluate(() => {
      return {
        url: window.location.href,
        messageCount: document.querySelectorAll('[class*="justify-"]').length,
        connectionIndicator: document.querySelector('[class*="bg-green-500"], [class*="bg-red-500"]')?.className || 'None',
        anyErrors: document.body.innerText.includes('error') || document.body.innerText.includes('Error'),
        visibleContent: document.body.innerText.substring(0, 500)
      };
    });

    report.testSteps.push({
      step: 5,
      name: 'Final State',
      state: finalState
    });

    const reportPath = '/Users/sour/Projects/cuts.ae/restaurant/SUPPORT_CHAT_TEST_REPORT.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nFull report saved to: ${reportPath}`);

    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');
    console.log('Total Screenshots:', report.screenshots.length);
    console.log('Console Logs:', report.consoleLogs.length);
    console.log('Network Requests:', report.networkRequests.length);
    console.log('Failed Requests:', report.failedRequests.length);
    console.log('\nKey Findings:');
    console.log(JSON.stringify(report.findings, null, 2));
    console.log('\nAPI Errors:', report.failedRequests.filter(r => r.url.includes('/api/')).length);

    console.log('\n\nBrowser will stay open for 20 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 20000));

  } catch (error) {
    console.error('\n!!! TEST ERROR !!!\n', error);
    report.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    await browser.close();
    console.log('\nTest completed. Browser closed.');
  }
}

comprehensiveSupportTest().catch(console.error);
