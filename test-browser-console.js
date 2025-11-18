const puppeteer = require('puppeteer');
const fs = require('fs');

async function testPage(url, pageName) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const errors = [];
  const warnings = [];
  const logs = [];

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push({ type: 'console.error', message: text });
    } else if (type === 'warning') {
      warnings.push({ type: 'console.warning', message: text });
    } else {
      logs.push({ type: `console.${type}`, message: text });
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push({
      type: 'pageerror',
      message: error.message,
      stack: error.stack
    });
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    errors.push({
      type: 'requestfailed',
      url: request.url(),
      failure: request.failure().errorText
    });
  });

  // Capture response errors
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push({
        type: 'http_error',
        status: response.status(),
        url: response.url(),
        statusText: response.statusText()
      });
    }
  });

  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${pageName}`);
    console.log(`URL: ${url}`);
    console.log('='.repeat(80));

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a bit for any async errors
    await page.waitForTimeout(3000);

    // Take a screenshot
    const screenshotPath = `/Users/sour/Projects/cuts.ae/restaurant/screenshots/${pageName.replace(/\s+/g, '-').toLowerCase()}-screenshot.png`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Check for React errors in the DOM
    const reactErrors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[data-nextjs-dialog], [data-nextjs-toast]');
      return Array.from(errorElements).map(el => el.textContent);
    });

    if (reactErrors.length > 0) {
      errors.push({
        type: 'react_error_ui',
        messages: reactErrors
      });
    }

  } catch (error) {
    errors.push({
      type: 'navigation_error',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await browser.close();
  }

  return { errors, warnings, logs };
}

async function main() {
  const results = {};

  // Test Dashboard
  console.log('\n\nTESTING DASHBOARD PAGE...\n');
  results.dashboard = await testPage('http://localhost:45003/dashboard', 'Dashboard');

  // Test Restaurant Analytics
  console.log('\n\nTESTING RESTAURANT ANALYTICS PAGE...\n');
  results.analytics = await testPage('http://localhost:45002/restaurant/@fitfresh-abudhabi/analytics', 'Restaurant Analytics');

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  for (const [pageName, result] of Object.entries(results)) {
    console.log(`\n${pageName.toUpperCase()}:`);
    console.log(`  Errors: ${result.errors.length}`);
    console.log(`  Warnings: ${result.warnings.length}`);
    console.log(`  Console Logs: ${result.logs.length}`);

    if (result.errors.length > 0) {
      console.log('\n  ERROR DETAILS:');
      result.errors.forEach((error, index) => {
        console.log(`\n  [${index + 1}] Type: ${error.type}`);
        if (error.message) console.log(`      Message: ${error.message}`);
        if (error.url) console.log(`      URL: ${error.url}`);
        if (error.status) console.log(`      Status: ${error.status}`);
        if (error.stack) console.log(`      Stack: ${error.stack.substring(0, 200)}...`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n  WARNING DETAILS:');
      result.warnings.forEach((warning, index) => {
        console.log(`\n  [${index + 1}] ${warning.message}`);
      });
    }
  }

  // Save detailed results to JSON
  const reportPath = '/Users/sour/Projects/cuts.ae/restaurant/browser-console-test-results.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n\nDetailed report saved to: ${reportPath}`);

  console.log('\n' + '='.repeat(80) + '\n');
}

main().catch(console.error);
