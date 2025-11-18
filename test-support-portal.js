const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testSupportPortal() {
  console.log('Starting Support Portal Test...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'test-screenshots', 'support-portal');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    url: 'http://localhost:45004',
    credentials: {
      email: 'support@cuts.ae',
      password: 'password123'
    },
    dashboard: {},
    console: [],
    network: [],
    websocket: {},
    errors: []
  };

  // Listen to console messages
  page.on('console', msg => {
    const text = msg.text();
    console.log('CONSOLE:', text);
    report.console.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
    report.errors.push({
      type: 'page_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Listen to network requests
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('socket.io')) {
      const networkEntry = {
        url: url,
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      };

      try {
        const contentType = response.headers()['content-type'];
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          networkEntry.data = data;
        }
      } catch (e) {
        // Not JSON or already consumed
      }

      console.log('NETWORK:', networkEntry.url, networkEntry.status);
      report.network.push(networkEntry);
    }
  });

  try {
    console.log('\n=== STEP 1: Navigate to Login Page ===');
    await page.goto('http://localhost:45004/login', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png'), fullPage: true });
    console.log('Screenshot: 01-login-page.png');

    console.log('\n=== STEP 2: Enter Credentials ===');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    await page.type('input[type="email"], input[name="email"]', 'support@cuts.ae');
    await page.type('input[type="password"], input[name="password"]', 'password123');
    await page.screenshot({ path: path.join(screenshotsDir, '02-credentials-entered.png'), fullPage: true });
    console.log('Screenshot: 02-credentials-entered.png');

    console.log('\n=== STEP 3: Click Login Button ===');
    await page.click('button[type="submit"]');

    // Wait for navigation or dashboard to load
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
      console.log('No navigation occurred, checking if already on dashboard...');
    });

    // Wait a bit for the page to settle
    await delay(3000);

    await page.screenshot({ path: path.join(screenshotsDir, '03-after-login.png'), fullPage: true });
    console.log('Screenshot: 03-after-login.png');

    console.log('\n=== STEP 4: Extract Dashboard Data ===');

    // Wait for dashboard elements to load
    await delay(2000);

    const dashboardData = await page.evaluate(() => {
      const data = {
        url: window.location.href,
        title: document.title,
        pendingChats: null,
        activeChats: null,
        chatsInQueue: [],
        websocketStatus: null,
        elementsFound: []
      };

      // Find pending chats count
      const pendingElements = document.querySelectorAll('*');
      pendingElements.forEach(el => {
        const text = el.textContent;
        if (text && text.includes('Pending')) {
          data.elementsFound.push({ type: 'pending', text: text.trim() });
          // Try to extract number
          const match = text.match(/(\d+)/);
          if (match && data.pendingChats === null) {
            data.pendingChats = parseInt(match[1]);
          }
        }
        if (text && text.includes('Active')) {
          data.elementsFound.push({ type: 'active', text: text.trim() });
          const match = text.match(/(\d+)/);
          if (match && data.activeChats === null) {
            data.activeChats = parseInt(match[1]);
          }
        }
        if (text && text.includes('WebSocket') || text.includes('Connected') || text.includes('Disconnected')) {
          data.elementsFound.push({ type: 'websocket', text: text.trim() });
        }
      });

      // Look for chat queue items
      const queueItems = document.querySelectorAll('[class*="chat"], [class*="queue"], [class*="session"]');
      queueItems.forEach(item => {
        if (item.textContent.trim()) {
          data.chatsInQueue.push(item.textContent.trim());
        }
      });

      // Check for WebSocket status in various ways
      const statusElements = document.querySelectorAll('[class*="status"], [class*="connection"]');
      statusElements.forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes('connected') || text.includes('disconnected')) {
          data.websocketStatus = text.includes('connected') ? 'Connected' : 'Disconnected';
        }
      });

      return data;
    });

    report.dashboard = dashboardData;
    console.log('\nDashboard Data:', JSON.stringify(dashboardData, null, 2));

    console.log('\n=== STEP 5: Check for Chat Queue ===');
    await page.screenshot({ path: path.join(screenshotsDir, '04-dashboard-full.png'), fullPage: true });
    console.log('Screenshot: 04-dashboard-full.png');

    // Try to find and click "Accept" button if available
    console.log('\n=== STEP 6: Check for Available Chats ===');
    const acceptButton = await page.$('button:has-text("Accept"), button:has-text("accept")').catch(() => null);

    if (acceptButton) {
      console.log('Found Accept button, clicking it...');
      await acceptButton.click();
      await delay(2000);
      await page.screenshot({ path: path.join(screenshotsDir, '05-chat-accepted.png'), fullPage: true });
      console.log('Screenshot: 05-chat-accepted.png');
      report.dashboard.chatAccepted = true;
    } else {
      console.log('No Accept button found - no chats in queue');
      report.dashboard.chatAccepted = false;
    }

    console.log('\n=== STEP 7: Capture Browser Console ===');
    // Console messages are already being captured

    console.log('\n=== STEP 8: Check Network Tab ===');
    await delay(2000);

    // Get WebSocket connections
    const wsConnections = await page.evaluate(() => {
      const ws = [];
      if (window.performance) {
        const entries = window.performance.getEntriesByType('resource');
        entries.forEach(entry => {
          if (entry.name.includes('socket.io') || entry.name.includes('ws://') || entry.name.includes('wss://')) {
            ws.push({
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      }
      return ws;
    });

    report.websocket.connections = wsConnections;
    console.log('\nWebSocket Connections:', JSON.stringify(wsConnections, null, 2));

    // Take final screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '06-final-state.png'), fullPage: true });
    console.log('Screenshot: 06-final-state.png');

    // Save report
    const reportPath = path.join(__dirname, 'support-portal-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);

  } catch (error) {
    console.error('Test Error:', error);
    report.errors.push({
      type: 'test_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    await page.screenshot({ path: path.join(screenshotsDir, 'error-screenshot.png'), fullPage: true });
  } finally {
    console.log('\n=== Test Complete ===');
    console.log('Keeping browser open for 5 seconds...');
    await delay(5000);
    await browser.close();
  }

  return report;
}

testSupportPortal()
  .then(report => {
    console.log('\n=== FINAL REPORT ===');
    console.log('Dashboard URL:', report.dashboard.url);
    console.log('Pending Chats:', report.dashboard.pendingChats);
    console.log('Active Chats:', report.dashboard.activeChats);
    console.log('Chat Accepted:', report.dashboard.chatAccepted);
    console.log('Total Console Messages:', report.console.length);
    console.log('Total Network Requests:', report.network.length);
    console.log('Total Errors:', report.errors.length);
  })
  .catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
  });
