const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SUPPORT_URL = 'http://localhost:45004';
const LOGIN_EMAIL = 'support@cuts.ae';
const LOGIN_PASSWORD = 'TabsTriggerIsnt2026*$';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('Starting Manual Browser Test...');

  const browser = await puppeteer.launch({
    headless: false, // Run in visible mode
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  const screenshotDir = path.join(__dirname, 'test-screenshots', 'support-manual');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Track console
  const consoleLogs = [];
  page.on('console', msg => {
    const log = `[${msg.type()}] ${msg.text()}`;
    console.log(log);
    consoleLogs.push({ type: msg.type(), text: msg.text(), timestamp: new Date().toISOString() });
  });

  // Track errors
  const errors = [];
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
    errors.push({ type: 'page_error', message: error.message, timestamp: new Date().toISOString() });
  });

  page.on('requestfailed', request => {
    console.error('REQUEST FAILED:', request.url(), request.failure().errorText);
    errors.push({ type: 'network', url: request.url(), error: request.failure().errorText, timestamp: new Date().toISOString() });
  });

  try {
    // Step 1: Navigate to login page
    console.log('\n=== Step 1: Navigate to Login ===');
    await page.goto(`${SUPPORT_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: path.join(screenshotDir, '01_login_page.png'), fullPage: true });
    console.log('Screenshot saved: 01_login_page.png');

    // Step 2: Fill credentials
    console.log('\n=== Step 2: Fill Credentials ===');
    await page.type('input[type="email"]', LOGIN_EMAIL, { delay: 100 });
    await page.type('input[type="password"]', LOGIN_PASSWORD, { delay: 100 });
    await delay(500);
    await page.screenshot({ path: path.join(screenshotDir, '02_credentials_entered.png'), fullPage: true });
    console.log('Screenshot saved: 02_credentials_entered.png');

    // Step 3: Submit form
    console.log('\n=== Step 3: Submit Form ===');
    await page.click('button[type="submit"]');
    await delay(3000); // Wait for response
    await page.screenshot({ path: path.join(screenshotDir, '03_after_submit.png'), fullPage: true });
    console.log('Screenshot saved: 03_after_submit.png');

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check for error messages
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('invalid')) {
      console.log('\n=== ERROR DETECTED ===');
      const errorText = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        for (let el of elements) {
          const text = el.textContent || '';
          if (text.toLowerCase().includes('error') || text.toLowerCase().includes('invalid')) {
            return text.trim();
          }
        }
        return 'Error found but text not extracted';
      });
      console.log('Error message:', errorText);
    }

    // Wait for any navigation
    if (currentUrl.includes('/login')) {
      console.log('\nStill on login page - login may have failed');
      await delay(5000);
      await page.screenshot({ path: path.join(screenshotDir, '04_still_on_login.png'), fullPage: true });
    } else {
      console.log('\nRedirected successfully!');
      await delay(3000);
      await page.screenshot({ path: path.join(screenshotDir, '04_dashboard.png'), fullPage: true });
      console.log('Screenshot saved: 04_dashboard.png');

      // Find all buttons
      const buttons = await page.$$eval('button', btns =>
        btns.map(btn => ({
          text: btn.textContent?.trim() || '',
          disabled: btn.disabled,
          visible: btn.offsetParent !== null
        }))
      );
      console.log('\n=== Buttons Found ===');
      buttons.forEach((btn, i) => console.log(`${i + 1}. "${btn.text}" (${btn.disabled ? 'disabled' : 'enabled'}, ${btn.visible ? 'visible' : 'hidden'})`));

      // Find all links
      const links = await page.$$eval('a[href]', anchors =>
        anchors.map(a => ({
          text: a.textContent?.trim() || '',
          href: a.href
        }))
      );
      console.log('\n=== Links Found ===');
      links.forEach((link, i) => console.log(`${i + 1}. "${link.text}" -> ${link.href}`));
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      url: SUPPORT_URL,
      finalUrl: page.url(),
      loginSuccess: !page.url().includes('/login'),
      consoleLogs,
      errors,
      screenshots: fs.readdirSync(screenshotDir).map(f => path.join(screenshotDir, f))
    };

    fs.writeFileSync(
      path.join(__dirname, 'manual-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n=== Test Complete ===');
    console.log('Login Success:', report.loginSuccess);
    console.log('Console Logs:', consoleLogs.length);
    console.log('Errors:', errors.length);
    console.log('\nKeeping browser open for 30 seconds...');
    await delay(30000);

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
