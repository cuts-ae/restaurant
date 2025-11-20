const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const RESTAURANT_PORTAL_URL = 'http://localhost:45002';
const SUPPORT_PORTAL_URL = 'http://localhost:45004';
const API_URL = 'http://localhost:45000';

const RESTAURANT_CREDENTIALS = {
  email: 'owner1@cuts.ae',
  password: 'TabsTriggerIsnt2026*$'
};

const SUPPORT_CREDENTIALS = {
  email: 'support@cuts.ae',
  password: 'TabsTriggerIsnt2026*$'
};

const TEST_MESSAGES = {
  initial: 'I need help with my menu settings',
  support_response: 'Hello! How can I help you?',
  customer_followup: "I can't update my menu items"
};

class ChatE2ETest {
  constructor() {
    this.browser = null;
    this.results = {
      testName: 'Chat End-to-End Test',
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };
    this.screenshotsDir = path.join(__dirname, 'test-screenshots', 'chat-e2e');

    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  async init() {
    console.log('Launching browser...');
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  addTestResult(name, passed, details, screenshot = null) {
    const result = {
      name,
      passed,
      details,
      screenshot,
      timestamp: new Date().toISOString()
    };

    this.results.tests.push(result);
    this.results.summary.total++;

    if (passed) {
      this.results.summary.passed++;
      console.log(`✓ ${name}`);
    } else {
      this.results.summary.failed++;
      console.log(`✗ ${name}`);
      console.log(`  Details: ${details}`);
    }
  }

  async takeScreenshot(page, name) {
    const screenshotPath = path.join(this.screenshotsDir, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }

  async loginToRestaurantPortal() {
    console.log('\n=== Step 1: Login to Restaurant Portal ===');
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      // Navigate to login page
      await page.goto(`${RESTAURANT_PORTAL_URL}/login`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for page to fully load and hydrate
      await this.wait(3000);

      let screenshot = await this.takeScreenshot(page, '01-restaurant-login-page');
      this.addTestResult('Navigate to restaurant login page', true, 'Login page loaded', screenshot);

      // Fill in credentials - wait for inputs with longer timeout
      await page.waitForSelector('input[type="email"]', { timeout: 20000 });
      await page.type('input[type="email"]', RESTAURANT_CREDENTIALS.email);
      await page.type('input[type="password"]', RESTAURANT_CREDENTIALS.password);

      screenshot = await this.takeScreenshot(page, '02-restaurant-credentials-filled');
      this.addTestResult('Fill restaurant credentials', true, 'Email and password entered', screenshot);

      // Submit login form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      ]);

      screenshot = await this.takeScreenshot(page, '03-restaurant-dashboard');

      // Verify we're on the dashboard
      const currentUrl = page.url();
      const isOnDashboard = currentUrl.includes('/dashboard') || currentUrl.includes('/restaurant/');
      this.addTestResult('Login to restaurant portal', isOnDashboard, `Current URL: ${currentUrl}`, screenshot);

      return page;
    } catch (error) {
      const screenshot = await this.takeScreenshot(page, '01-restaurant-login-error');
      this.addTestResult('Login to restaurant portal', false, `Error: ${error.message}`, screenshot);
      throw error;
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async navigateToRestaurant(restaurantPage) {
    console.log('\n=== Step 2: Navigate to Restaurant ===');

    try {
      // Wait for dashboard to load
      await this.wait(3000);

      let screenshot = await this.takeScreenshot(restaurantPage, '04-dashboard-loaded');

      // Look for a restaurant card to click
      const restaurantCards = await restaurantPage.$$('a[href*="/restaurant/"]');

      if (restaurantCards.length > 0) {
        await restaurantCards[0].click();
        await this.wait(3000);

        screenshot = await this.takeScreenshot(restaurantPage, '05-restaurant-portal');
        this.addTestResult('Navigate to restaurant portal', true, 'Restaurant portal loaded', screenshot);
        return true;
      } else {
        screenshot = await this.takeScreenshot(restaurantPage, '04-no-restaurants');
        this.addTestResult('Navigate to restaurant portal', false, 'No restaurants found', screenshot);
        return false;
      }
    } catch (error) {
      const screenshot = await this.takeScreenshot(restaurantPage, '04-restaurant-nav-error');
      this.addTestResult('Navigate to restaurant portal', false, `Error: ${error.message}`, screenshot);
      return false;
    }
  }

  async navigateToSupportTab(restaurantPage) {
    console.log('\n=== Step 3: Navigate to Support Tab ===');

    try {
      // Wait for page to load
      await this.wait(2000);

      // Look for Support tab/link in the restaurant portal
      const supportTabSelectors = [
        'a[href*="support"]',
        'button[data-tab="support"]',
        '[role="tab"]:has-text("Support")'
      ];

      let supportTabFound = false;
      let screenshot;

      for (const selector of supportTabSelectors) {
        try {
          const elements = await restaurantPage.$$(selector);
          if (elements.length > 0) {
            await elements[0].click();
            supportTabFound = true;
            await this.wait(2000);
            screenshot = await this.takeScreenshot(restaurantPage, '06-support-tab-clicked');
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!supportTabFound) {
        // Try to find tabs by text content
        const tabs = await restaurantPage.$$('[role="tab"], nav a, button');
        for (const tab of tabs) {
          const text = await restaurantPage.evaluate(el => el.textContent || '', tab);
          if (text.toLowerCase().includes('support')) {
            await tab.click();
            supportTabFound = true;
            await this.wait(2000);
            screenshot = await this.takeScreenshot(restaurantPage, '06-support-tab-clicked');
            break;
          }
        }
      }

      await this.wait(2000);
      screenshot = await this.takeScreenshot(restaurantPage, '07-support-page-loaded');

      this.addTestResult('Navigate to Support tab', supportTabFound,
        supportTabFound ? 'Support tab found and clicked' : 'Support tab not found',
        screenshot);

      return supportTabFound;
    } catch (error) {
      const screenshot = await this.takeScreenshot(restaurantPage, '06-support-tab-error');
      this.addTestResult('Navigate to Support tab', false, `Error: ${error.message}`, screenshot);
      return false;
    }
  }

  async verifyWebSocketConnection(page) {
    console.log('\n=== Checking WebSocket Connection ===');

    try {
      // Listen for WebSocket events
      const wsMessages = [];

      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('WebSocket') || text.includes('socket') || text.includes('Connected')) {
          wsMessages.push(text);
          console.log('  WS Log:', text);
        }
      });

      await this.wait(3000);

      // Check connection status in the UI
      const connectionIndicators = await page.$$('.bg-green-500, .text-green-500, text/Connected');
      const isConnected = connectionIndicators.length > 0 || wsMessages.some(msg =>
        msg.includes('Connected') || msg.includes('connect')
      );

      const screenshot = await this.takeScreenshot(page, '06-websocket-connection');
      this.addTestResult('WebSocket connection established', isConnected,
        `WebSocket messages: ${wsMessages.join(', ')}`,
        screenshot);

      return isConnected;
    } catch (error) {
      this.addTestResult('WebSocket connection established', false, `Error: ${error.message}`);
      return false;
    }
  }

  async startNewChat(restaurantPage) {
    console.log('\n=== Step 3: Start New Chat ===');

    try {
      await this.wait(2000);

      // The support page might auto-create a session, or we might need to send a message
      // Look for a message input
      const messageInputSelectors = [
        'input[placeholder*="message"]',
        'input[placeholder*="Type"]',
        'textarea[placeholder*="message"]',
        'textarea[placeholder*="Type"]'
      ];

      let messageInput = null;
      for (const selector of messageInputSelectors) {
        try {
          messageInput = await restaurantPage.waitForSelector(selector, { timeout: 5000 });
          break;
        } catch (e) {
          continue;
        }
      }

      if (!messageInput) {
        throw new Error('Message input not found');
      }

      // Type initial message
      await restaurantPage.type(messageInput, TEST_MESSAGES.initial);
      let screenshot = await this.takeScreenshot(restaurantPage, '07-initial-message-typed');
      this.addTestResult('Type initial message', true, `Message: "${TEST_MESSAGES.initial}"`, screenshot);

      // Find and click send button
      const sendButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("Send")',
        'button svg[data-testid*="Send"]',
        'button:has(svg)' // MUI SendIcon
      ];

      let sendButton = null;
      for (const selector of sendButtonSelectors) {
        try {
          const buttons = await restaurantPage.$$(selector);
          if (buttons.length > 0) {
            // Get the last button (usually the send button in the message form)
            sendButton = buttons[buttons.length - 1];
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (sendButton) {
        await sendButton.click();
        await this.wait(2000);
        screenshot = await this.takeScreenshot(restaurantPage, '08-message-sent');
        this.addTestResult('Send initial message', true, 'Message sent successfully', screenshot);
      } else {
        // Try submitting the form
        await messageInput.press('Enter');
        await this.wait(2000);
        screenshot = await this.takeScreenshot(restaurantPage, '08-message-sent');
        this.addTestResult('Send initial message', true, 'Message sent via Enter key', screenshot);
      }

      // Wait for message to appear
      await this.wait(2000);

      // Check if message appears in chat
      const messageText = await restaurantPage.evaluate((msg) => {
        return document.body.innerText.includes(msg);
      }, TEST_MESSAGES.initial);

      screenshot = await this.takeScreenshot(restaurantPage, '09-message-in-chat');
      this.addTestResult('Message appears in chat', messageText,
        messageText ? 'Message visible in chat window' : 'Message not found in chat',
        screenshot);

      return true;
    } catch (error) {
      const screenshot = await this.takeScreenshot(restaurantPage, '07-start-chat-error');
      this.addTestResult('Start new chat', false, `Error: ${error.message}`, screenshot);
      return false;
    }
  }

  async verifyWaitingState(restaurantPage) {
    console.log('\n=== Step 4: Verify Waiting State ===');

    try {
      await this.wait(2000);

      // Look for waiting indicators
      const waitingTexts = [
        'Waiting for support',
        'waiting for agent',
        'waiting',
        'pending'
      ];

      let hasWaitingState = false;
      const pageText = await restaurantPage.evaluate(() => document.body.innerText.toLowerCase());

      for (const text of waitingTexts) {
        if (pageText.includes(text.toLowerCase())) {
          hasWaitingState = true;
          break;
        }
      }

      // Check for waiting badge/status
      const waitingBadges = await restaurantPage.$$('.bg-yellow-100, .text-yellow-800, [class*="waiting"]');
      hasWaitingState = hasWaitingState || waitingBadges.length > 0;

      const screenshot = await this.takeScreenshot(restaurantPage, '10-waiting-state');
      this.addTestResult('Waiting state visible', hasWaitingState,
        hasWaitingState ? 'Waiting indicator found' : 'No waiting indicator',
        screenshot);

      return hasWaitingState;
    } catch (error) {
      this.addTestResult('Waiting state visible', false, `Error: ${error.message}`);
      return false;
    }
  }

  async loginToSupportPortal() {
    console.log('\n=== Step 5: Login to Support Portal ===');
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      // Navigate to support portal login
      await page.goto(`${SUPPORT_PORTAL_URL}/login`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for hydration
      await this.wait(3000);

      let screenshot = await this.takeScreenshot(page, '11-support-login-page');
      this.addTestResult('Navigate to support portal login', true, 'Support login page loaded', screenshot);

      // Fill in credentials
      await page.waitForSelector('input[type="email"]', { timeout: 20000 });
      await page.type('input[type="email"]', SUPPORT_CREDENTIALS.email);
      await page.type('input[type="password"]', SUPPORT_CREDENTIALS.password);

      screenshot = await this.takeScreenshot(page, '12-support-credentials-filled');
      this.addTestResult('Fill support credentials', true, 'Support credentials entered', screenshot);

      // Submit login form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      ]);

      screenshot = await this.takeScreenshot(page, '13-support-dashboard');

      const currentUrl = page.url();
      const isLoggedIn = currentUrl.includes('/dashboard') || currentUrl.includes('/support/');
      this.addTestResult('Login to support portal', isLoggedIn, `Current URL: ${currentUrl}`, screenshot);

      return page;
    } catch (error) {
      const screenshot = await this.takeScreenshot(page, '11-support-login-error');
      this.addTestResult('Login to support portal', false, `Error: ${error.message}`, screenshot);
      throw error;
    }
  }

  async acceptChatInSupportPortal(supportPage) {
    console.log('\n=== Step 6: Accept Chat in Support Portal ===');

    try {
      await this.wait(3000);

      // Look for pending chats
      const pendingChatSelectors = [
        'text/pending',
        'text/waiting',
        '[data-status="waiting"]',
        '.bg-yellow-100',
        'button:has-text("Accept")',
        'button:has-text("Take")'
      ];

      let chatFound = false;
      let screenshot;

      // First, check if there are any chats visible
      screenshot = await this.takeScreenshot(supportPage, '14-support-portal-view');

      // Try to find and click on a pending chat
      for (const selector of pendingChatSelectors) {
        try {
          const elements = await supportPage.$$(selector);
          if (elements.length > 0) {
            await elements[0].click();
            chatFound = true;
            await this.wait(1000);
            screenshot = await this.takeScreenshot(supportPage, '15-chat-clicked');
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Look for accept button
      if (chatFound) {
        const acceptButtonSelectors = [
          'button:has-text("Accept")',
          'button:has-text("Take")',
          'button:has-text("Assign")',
          'text/Accept'
        ];

        let accepted = false;
        for (const selector of acceptButtonSelectors) {
          try {
            await supportPage.waitForSelector(selector, { timeout: 3000 });
            await supportPage.click(selector);
            accepted = true;
            await this.wait(2000);
            screenshot = await this.takeScreenshot(supportPage, '16-chat-accepted');
            break;
          } catch (e) {
            continue;
          }
        }

        this.addTestResult('Accept chat in support portal', accepted,
          accepted ? 'Chat accepted successfully' : 'Could not find accept button',
          screenshot);

        return accepted;
      } else {
        screenshot = await this.takeScreenshot(supportPage, '14-no-pending-chats');
        this.addTestResult('Find pending chat', false, 'No pending chats found', screenshot);
        return false;
      }
    } catch (error) {
      const screenshot = await this.takeScreenshot(supportPage, '14-accept-chat-error');
      this.addTestResult('Accept chat in support portal', false, `Error: ${error.message}`, screenshot);
      return false;
    }
  }

  async testBidirectionalMessaging(restaurantPage, supportPage) {
    console.log('\n=== Step 7: Test Bidirectional Messaging ===');

    try {
      await this.wait(2000);

      // Support sends message
      const supportInputSelectors = [
        'input[placeholder*="message"]',
        'textarea[placeholder*="message"]',
        'input[type="text"]',
        'textarea'
      ];

      let supportInput = null;
      for (const selector of supportInputSelectors) {
        try {
          const inputs = await supportPage.$$(selector);
          if (inputs.length > 0) {
            supportInput = inputs[inputs.length - 1]; // Get last input
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (supportInput) {
        await supportInput.type(TEST_MESSAGES.support_response);
        await this.wait(500);

        // Send the message
        await supportPage.keyboard.press('Enter');
        await this.wait(2000);

        let screenshot = await this.takeScreenshot(supportPage, '17-support-message-sent');
        this.addTestResult('Support sends message', true,
          `Message: "${TEST_MESSAGES.support_response}"`,
          screenshot);

        // Check if message appears in restaurant portal
        await this.wait(3000);
        const messageInRestaurant = await restaurantPage.evaluate((msg) => {
          return document.body.innerText.includes(msg);
        }, TEST_MESSAGES.support_response);

        screenshot = await this.takeScreenshot(restaurantPage, '18-message-in-restaurant');
        this.addTestResult('Support message appears in restaurant portal', messageInRestaurant,
          messageInRestaurant ? 'Message received in restaurant portal' : 'Message not visible',
          screenshot);

        // Restaurant sends reply
        await this.wait(1000);
        const restaurantInputs = await restaurantPage.$$(supportInputSelectors.join(','));
        if (restaurantInputs.length > 0) {
          const restaurantInput = restaurantInputs[restaurantInputs.length - 1];
          await restaurantInput.type(TEST_MESSAGES.customer_followup);
          await this.wait(500);
          await restaurantPage.keyboard.press('Enter');
          await this.wait(2000);

          screenshot = await this.takeScreenshot(restaurantPage, '19-customer-reply-sent');
          this.addTestResult('Customer sends reply', true,
            `Message: "${TEST_MESSAGES.customer_followup}"`,
            screenshot);

          // Check if reply appears in support portal
          await this.wait(3000);
          const replyInSupport = await supportPage.evaluate((msg) => {
            return document.body.innerText.includes(msg);
          }, TEST_MESSAGES.customer_followup);

          screenshot = await this.takeScreenshot(supportPage, '20-reply-in-support');
          this.addTestResult('Customer reply appears in support portal', replyInSupport,
            replyInSupport ? 'Reply received in support portal' : 'Reply not visible',
            screenshot);

          return messageInRestaurant && replyInSupport;
        } else {
          this.addTestResult('Customer sends reply', false, 'Could not find message input');
          return false;
        }
      } else {
        this.addTestResult('Support sends message', false, 'Could not find message input');
        return false;
      }
    } catch (error) {
      const screenshot = await this.takeScreenshot(supportPage, '17-messaging-error');
      this.addTestResult('Bidirectional messaging', false, `Error: ${error.message}`, screenshot);
      return false;
    }
  }

  async verifyUIElements(restaurantPage) {
    console.log('\n=== Step 8: Verify UI Elements ===');

    try {
      await this.wait(2000);

      // Check for online status
      const hasOnlineStatus = await restaurantPage.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('online') || text.includes('connected') || text.includes('active');
      });

      let screenshot = await this.takeScreenshot(restaurantPage, '21-ui-status-check');
      this.addTestResult('Online status indicator visible', hasOnlineStatus,
        hasOnlineStatus ? 'Status indicator found' : 'No status indicator',
        screenshot);

      // Check for file upload button
      const fileUploadButtons = await restaurantPage.$$('input[type="file"], button:has(svg[data-testid*="Attach"])');
      const hasFileUpload = fileUploadButtons.length > 0;

      screenshot = await this.takeScreenshot(restaurantPage, '22-ui-file-upload');
      this.addTestResult('File upload button present', hasFileUpload,
        hasFileUpload ? 'File upload button found' : 'No file upload button',
        screenshot);

      // Check send button state
      const sendButtons = await restaurantPage.$$('button[type="submit"]');
      const hasSendButton = sendButtons.length > 0;

      screenshot = await this.takeScreenshot(restaurantPage, '23-ui-send-button');
      this.addTestResult('Send button present', hasSendButton,
        hasSendButton ? 'Send button found' : 'No send button',
        screenshot);

      return hasOnlineStatus && hasSendButton;
    } catch (error) {
      this.addTestResult('Verify UI elements', false, `Error: ${error.message}`);
      return false;
    }
  }

  async generateReport() {
    console.log('\n=== Generating Test Report ===');

    const reportPath = path.join(__dirname, 'chat-e2e-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log(`\nTest report saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${this.screenshotsDir}`);

    // Generate markdown report
    const mdReport = this.generateMarkdownReport();
    const mdReportPath = path.join(__dirname, 'CHAT_E2E_TEST_REPORT.md');
    fs.writeFileSync(mdReportPath, mdReport);
    console.log(`Markdown report saved to: ${mdReportPath}`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));

    return this.results.summary.failed === 0;
  }

  generateMarkdownReport() {
    const { tests, summary, timestamp } = this.results;

    let md = `# Chat End-to-End Test Report\n\n`;
    md += `**Test Date:** ${new Date(timestamp).toLocaleString()}\n\n`;
    md += `## Summary\n\n`;
    md += `- **Total Tests:** ${summary.total}\n`;
    md += `- **Passed:** ${summary.passed}\n`;
    md += `- **Failed:** ${summary.failed}\n`;
    md += `- **Success Rate:** ${((summary.passed / summary.total) * 100).toFixed(2)}%\n\n`;

    md += `## Test Results\n\n`;

    tests.forEach((test, index) => {
      const status = test.passed ? '✓ PASS' : '✗ FAIL';
      const emoji = test.passed ? '✅' : '❌';

      md += `### ${index + 1}. ${test.name} ${emoji}\n\n`;
      md += `- **Status:** ${status}\n`;
      md += `- **Details:** ${test.details}\n`;

      if (test.screenshot) {
        const screenshotName = path.basename(test.screenshot);
        md += `- **Screenshot:** \`${screenshotName}\`\n`;
      }

      md += `- **Timestamp:** ${new Date(test.timestamp).toLocaleTimeString()}\n\n`;
    });

    md += `## Test Flow\n\n`;
    md += `1. **Restaurant Portal Login**\n`;
    md += `   - Navigate to login page\n`;
    md += `   - Enter credentials\n`;
    md += `   - Verify successful login\n\n`;

    md += `2. **Start Chat Session**\n`;
    md += `   - Navigate to Support tab\n`;
    md += `   - Send initial message\n`;
    md += `   - Verify waiting state\n\n`;

    md += `3. **Support Portal**\n`;
    md += `   - Login to support portal\n`;
    md += `   - Find pending chat\n`;
    md += `   - Accept chat\n\n`;

    md += `4. **Bidirectional Messaging**\n`;
    md += `   - Support sends message\n`;
    md += `   - Verify message in restaurant portal\n`;
    md += `   - Customer sends reply\n`;
    md += `   - Verify reply in support portal\n\n`;

    md += `5. **UI Verification**\n`;
    md += `   - Check online status\n`;
    md += `   - Verify file upload button\n`;
    md += `   - Verify send button state\n\n`;

    md += `## Notes\n\n`;
    md += `- Test used Puppeteer for browser automation\n`;
    md += `- Screenshots captured at each major step\n`;
    md += `- WebSocket connections monitored via console logs\n`;
    md += `- All timestamps in local timezone\n`;

    return md;
  }

  async run() {
    let restaurantPage = null;
    let supportPage = null;

    try {
      await this.init();

      // Step 1: Login to restaurant portal
      restaurantPage = await this.loginToRestaurantPortal();

      // Step 2: Navigate to restaurant
      const onRestaurant = await this.navigateToRestaurant(restaurantPage);

      if (!onRestaurant) {
        throw new Error('Failed to navigate to restaurant');
      }

      // Step 3: Navigate to support tab
      const onSupportTab = await this.navigateToSupportTab(restaurantPage);

      if (onSupportTab) {
        // Check WebSocket connection
        await this.verifyWebSocketConnection(restaurantPage);

        // Step 3: Start new chat
        const chatStarted = await this.startNewChat(restaurantPage);

        if (chatStarted) {
          // Step 4: Verify waiting state
          await this.verifyWaitingState(restaurantPage);

          // Step 5: Login to support portal
          supportPage = await this.loginToSupportPortal();

          // Step 6: Accept chat
          const chatAccepted = await this.acceptChatInSupportPortal(supportPage);

          if (chatAccepted) {
            // Step 7: Test bidirectional messaging
            await this.testBidirectionalMessaging(restaurantPage, supportPage);

            // Step 8: Verify UI elements
            await this.verifyUIElements(restaurantPage);
          }
        }
      }

      // Generate final report
      const allTestsPassed = await this.generateReport();

      return allTestsPassed;

    } catch (error) {
      console.error('\nTest execution failed:', error);
      this.addTestResult('Test Execution', false, `Fatal error: ${error.message}`);
      await this.generateReport();
      return false;
    } finally {
      // Keep browser open for inspection
      console.log('\nBrowser will remain open for inspection. Close manually when done.');
      // await this.cleanup();
    }
  }
}

// Run the test
(async () => {
  const test = new ChatE2ETest();
  const success = await test.run();

  if (success) {
    console.log('\n🎉 All tests passed!');
    // process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the report for details.');
    // process.exit(1);
  }
})();
