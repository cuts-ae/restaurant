const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SUPPORT_URL = 'http://localhost:45004';
const LOGIN_EMAIL = 'support@cuts.ae';
const LOGIN_PASSWORD = 'TabsTriggerIsnt2026*$';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  screenshots: [],
  consoleErrors: [],
  networkErrors: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function addTest(name, status, details = '', screenshot = null) {
  results.tests.push({
    name,
    status,
    details,
    screenshot,
    timestamp: new Date().toISOString()
  });
  results.summary.total++;
  if (status === 'PASS') results.summary.passed++;
  if (status === 'FAIL') results.summary.failed++;
  if (status === 'WARN') results.summary.warnings++;
}

async function takeScreenshot(page, name) {
  const screenshotDir = path.join(__dirname, 'test-screenshots', 'support-portal');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const filename = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
  const filepath = path.join(screenshotDir, filename);

  await page.screenshot({
    path: filepath,
    fullPage: true
  });

  results.screenshots.push({
    name,
    path: filepath,
    timestamp: new Date().toISOString()
  });

  return filepath;
}

async function testLoginPage(browser) {
  console.log('\n=== Testing Login Page ===');
  const page = await browser.newPage();

  // Track console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      results.consoleErrors.push({
        page: 'login',
        type,
        text,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Track network failures
  page.on('requestfailed', request => {
    results.networkErrors.push({
      page: 'login',
      url: request.url(),
      error: request.failure().errorText,
      timestamp: new Date().toISOString()
    });
  });

  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    const response = await page.goto(`${SUPPORT_URL}/login`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const screenshot1 = await takeScreenshot(page, 'login_page_initial');

    if (response.ok()) {
      addTest('Login Page - Navigation', 'PASS', `Status: ${response.status()}`, screenshot1);
    } else {
      addTest('Login Page - Navigation', 'FAIL', `Status: ${response.status()}`, screenshot1);
      await page.close();
      return false;
    }

    // Check for page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    addTest('Login Page - Title', title ? 'PASS' : 'WARN', `Title: "${title}"`);

    // Check for email input
    console.log('Checking for email input...');
    const emailInput = await page.$('input[type="email"], input[name="email"], input[id*="email"]');
    if (emailInput) {
      addTest('Login Page - Email Input', 'PASS', 'Email input field found');
    } else {
      addTest('Login Page - Email Input', 'FAIL', 'Email input field not found');
      await page.close();
      return false;
    }

    // Check for password input
    console.log('Checking for password input...');
    const passwordInput = await page.$('input[type="password"], input[name="password"], input[id*="password"]');
    if (passwordInput) {
      addTest('Login Page - Password Input', 'PASS', 'Password input field found');
    } else {
      addTest('Login Page - Password Input', 'FAIL', 'Password input field not found');
      await page.close();
      return false;
    }

    // Check for submit button
    console.log('Checking for submit button...');
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      addTest('Login Page - Submit Button', 'PASS', 'Submit button found');
    } else {
      addTest('Login Page - Submit Button', 'FAIL', 'Submit button not found');
      await page.close();
      return false;
    }

    // Test login functionality
    console.log('Testing login functionality...');
    await emailInput.type(LOGIN_EMAIL, { delay: 50 });
    await passwordInput.type(LOGIN_PASSWORD, { delay: 50 });

    const screenshot2 = await takeScreenshot(page, 'login_page_filled');
    addTest('Login Page - Form Fill', 'PASS', 'Credentials entered successfully', screenshot2);

    // Click submit and wait for navigation
    console.log('Submitting login form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(e => {
        console.log('Navigation timeout or error:', e.message);
        return null;
      }),
      submitButton.click()
    ]);

    await delay(2000);
    const screenshot3 = await takeScreenshot(page, 'login_page_after_submit');

    // Check if login was successful
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      // Check for error messages
      const bodyText = await page.evaluate(() => document.body.textContent);
      if (bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('invalid')) {
        addTest('Login Page - Authentication', 'FAIL', `Login failed - still on login page`, screenshot3);
      } else {
        addTest('Login Page - Authentication', 'FAIL', 'Login did not redirect to dashboard', screenshot3);
      }
      await page.close();
      return false;
    } else {
      addTest('Login Page - Authentication', 'PASS', `Successfully redirected to: ${currentUrl}`, screenshot3);
      await page.close();
      return true;
    }

  } catch (error) {
    console.error('Error testing login page:', error);
    const screenshot = await takeScreenshot(page, 'login_page_error');
    addTest('Login Page - Error', 'FAIL', `Exception: ${error.message}`, screenshot);
    await page.close();
    return false;
  }
}

async function testDashboard(browser) {
  console.log('\n=== Testing Dashboard ===');
  const page = await browser.newPage();

  // Track console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`CONSOLE [${type}]:`, text);
    if (type === 'error') {
      results.consoleErrors.push({
        page: 'dashboard',
        type,
        text,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Track network failures
  page.on('requestfailed', request => {
    console.log(`NETWORK ERROR:`, request.url(), request.failure().errorText);
    results.networkErrors.push({
      page: 'dashboard',
      url: request.url(),
      error: request.failure().errorText,
      timestamp: new Date().toISOString()
    });
  });

  try {
    // First login
    console.log('Logging in...');
    await page.goto(`${SUPPORT_URL}/login`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const emailInput = await page.$('input[type="email"], input[name="email"], input[id*="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"], input[id*="password"]');
    const submitButton = await page.$('button[type="submit"]');

    if (!emailInput || !passwordInput || !submitButton) {
      addTest('Dashboard - Prerequisites', 'FAIL', 'Could not find login form elements');
      await page.close();
      return false;
    }

    await emailInput.type(LOGIN_EMAIL, { delay: 50 });
    await passwordInput.type(LOGIN_PASSWORD, { delay: 50 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => null),
      submitButton.click()
    ]);

    await delay(3000);

    const screenshot1 = await takeScreenshot(page, 'dashboard_initial');

    // Check if we're on dashboard
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      addTest('Dashboard - Access', 'FAIL', 'Could not access dashboard, still on login page', screenshot1);
      await page.close();
      return false;
    }

    addTest('Dashboard - Access', 'PASS', `Successfully accessed dashboard at: ${currentUrl}`, screenshot1);

    // Check page title
    const title = await page.title();
    console.log(`Dashboard title: ${title}`);
    addTest('Dashboard - Title', title ? 'PASS' : 'WARN', `Title: "${title}"`);

    // Check for main content elements
    console.log('Checking for main content...');
    const mainContent = await page.$('main, [role="main"], .main-content, #main, body > div');
    if (mainContent) {
      addTest('Dashboard - Main Content', 'PASS', 'Main content area found');
    } else {
      addTest('Dashboard - Main Content', 'WARN', 'Main content area not clearly identified');
    }

    // Look for navigation/menu
    console.log('Checking for navigation...');
    const nav = await page.$('nav, [role="navigation"], .nav, .navigation, header');
    if (nav) {
      addTest('Dashboard - Navigation', 'PASS', 'Navigation element found');
    } else {
      addTest('Dashboard - Navigation', 'WARN', 'Navigation element not found');
    }

    // Find all buttons
    console.log('Finding all buttons...');
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons`);
    addTest('Dashboard - Interactive Elements', 'PASS', `Found ${buttons.length} buttons`);

    // Get button details
    if (buttons.length > 0) {
      console.log('\nButton details:');
      for (let i = 0; i < Math.min(buttons.length, 15); i++) {
        const button = buttons[i];
        const buttonInfo = await page.evaluate(el => {
          return {
            text: el.textContent?.trim() || '',
            id: el.id || '',
            class: el.className || '',
            type: el.type || '',
            disabled: el.disabled,
            visible: el.offsetParent !== null
          };
        }, button);
        console.log(`  Button ${i + 1}:`, JSON.stringify(buttonInfo));
      }

      // Test clicking visible, enabled buttons
      console.log('\nTesting button interactions...');
      let buttonTestsPassed = 0;
      let buttonTestsFailed = 0;

      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        try {
          const button = buttons[i];
          const buttonInfo = await page.evaluate(el => {
            return {
              text: el.textContent?.trim() || `Button ${i + 1}`,
              disabled: el.disabled,
              visible: el.offsetParent !== null
            };
          }, button);

          if (!buttonInfo.visible || buttonInfo.disabled) {
            console.log(`Skipping button ${i + 1}: "${buttonInfo.text}" (not visible or disabled)`);
            continue;
          }

          console.log(`Testing button ${i + 1}: "${buttonInfo.text}"`);

          const beforeUrl = page.url();
          const beforeClick = await takeScreenshot(page, `dashboard_before_button_${i + 1}_${buttonInfo.text}`);

          try {
            await button.click({ timeout: 3000 });
            await delay(1500);

            const afterUrl = page.url();
            const afterClick = await takeScreenshot(page, `dashboard_after_button_${i + 1}_${buttonInfo.text}`);

            addTest(`Dashboard - Button: ${buttonInfo.text}`, 'PASS', `Clicked successfully. URL: ${beforeUrl} -> ${afterUrl}`, afterClick);
            buttonTestsPassed++;

            // Navigate back if URL changed
            if (afterUrl !== beforeUrl) {
              console.log(`URL changed, navigating back to dashboard...`);
              await page.goto(beforeUrl, { waitUntil: 'networkidle0', timeout: 10000 });
              await delay(1000);
            }
          } catch (clickError) {
            addTest(`Dashboard - Button: ${buttonInfo.text}`, 'WARN', `Click error: ${clickError.message}`);
            buttonTestsFailed++;
          }
        } catch (error) {
          console.error(`Error testing button ${i + 1}:`, error);
          buttonTestsFailed++;
        }
      }

      console.log(`Button tests: ${buttonTestsPassed} passed, ${buttonTestsFailed} failed/warned`);
    }

    // Find all links
    console.log('\nFinding all links...');
    const links = await page.$$('a[href]');
    console.log(`Found ${links.length} links`);
    addTest('Dashboard - Links', 'PASS', `Found ${links.length} navigation links`);

    // Get link details
    if (links.length > 0) {
      console.log('\nLink details:');
      for (let i = 0; i < Math.min(links.length, 10); i++) {
        const link = links[i];
        const linkInfo = await page.evaluate(el => {
          return {
            text: el.textContent?.trim() || '',
            href: el.getAttribute('href') || '',
            visible: el.offsetParent !== null
          };
        }, link);
        console.log(`  Link ${i + 1}:`, JSON.stringify(linkInfo));
      }

      // Test a few links
      console.log('\nTesting link navigation...');
      const baseUrl = page.url();

      for (let i = 0; i < Math.min(links.length, 5); i++) {
        try {
          const link = links[i];
          const linkInfo = await page.evaluate(el => {
            return {
              text: el.textContent?.trim() || 'Link',
              href: el.getAttribute('href') || '',
              visible: el.offsetParent !== null
            };
          }, link);

          if (!linkInfo.visible || !linkInfo.href || linkInfo.href.startsWith('#') || linkInfo.href.startsWith('javascript:')) {
            console.log(`Skipping link ${i + 1}: "${linkInfo.text}" (not suitable for testing)`);
            continue;
          }

          console.log(`Testing link ${i + 1}: "${linkInfo.text}" -> ${linkInfo.href}`);

          const beforeClick = await takeScreenshot(page, `dashboard_before_link_${i + 1}_${linkInfo.text}`);

          try {
            await link.click({ timeout: 3000 });
            await delay(2000);

            const afterClick = await takeScreenshot(page, `dashboard_after_link_${i + 1}_${linkInfo.text}`);
            addTest(`Dashboard - Link: ${linkInfo.text}`, 'PASS', `Navigated to: ${page.url()}`, afterClick);

            // Go back
            await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 10000 });
            await delay(1000);
          } catch (linkError) {
            addTest(`Dashboard - Link: ${linkInfo.text}`, 'WARN', `Navigation error: ${linkError.message}`);
            // Try to go back anyway
            await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
          }
        } catch (error) {
          console.error(`Error testing link ${i + 1}:`, error);
        }
      }
    }

    // Final screenshot
    await page.goto(currentUrl, { waitUntil: 'networkidle0' });
    const finalScreenshot = await takeScreenshot(page, 'dashboard_final');
    addTest('Dashboard - Final State', 'PASS', 'Dashboard test completed', finalScreenshot);

    await page.close();
    return true;

  } catch (error) {
    console.error('Error testing dashboard:', error);
    const screenshot = await takeScreenshot(page, 'dashboard_error');
    addTest('Dashboard - Error', 'FAIL', `Exception: ${error.message}`, screenshot);
    await page.close();
    return false;
  }
}

async function generateReport() {
  const reportPath = path.join(__dirname, 'SUPPORT_PORTAL_TEST_REPORT.md');

  let report = `# Support Portal Test Report\n\n`;
  report += `**Generated:** ${results.timestamp}\n\n`;
  report += `**Support Portal URL:** ${SUPPORT_URL}\n\n`;
  report += `**Test Credentials:** ${LOGIN_EMAIL}\n\n`;

  // Summary
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${results.summary.total}\n`;
  report += `- **Passed:** ${results.summary.passed}\n`;
  report += `- **Failed:** ${results.summary.failed}\n`;
  report += `- **Warnings:** ${results.summary.warnings}\n`;
  report += `- **Success Rate:** ${results.summary.total > 0 ? ((results.summary.passed / results.summary.total) * 100).toFixed(2) : 0}%\n\n`;

  // Console Errors
  if (results.consoleErrors.length > 0) {
    report += `## Console Errors\n\n`;
    report += `Found ${results.consoleErrors.length} console error(s):\n\n`;
    results.consoleErrors.forEach((error, index) => {
      report += `### Error ${index + 1} (${error.page} page)\n`;
      report += `\`\`\`\n${error.text}\n\`\`\`\n`;
      report += `**Time:** ${error.timestamp}\n\n`;
    });
  } else {
    report += `## Console Errors\n\n`;
    report += `No console errors detected.\n\n`;
  }

  // Network Errors
  if (results.networkErrors.length > 0) {
    report += `## Network Errors\n\n`;
    report += `Found ${results.networkErrors.length} network error(s):\n\n`;
    results.networkErrors.forEach((error, index) => {
      report += `### Error ${index + 1} (${error.page} page)\n`;
      report += `- **URL:** ${error.url}\n`;
      report += `- **Error:** ${error.error}\n`;
      report += `- **Time:** ${error.timestamp}\n\n`;
    });
  } else {
    report += `## Network Errors\n\n`;
    report += `No network errors detected.\n\n`;
  }

  // Test Results
  report += `## Detailed Test Results\n\n`;

  const groupedTests = {};
  results.tests.forEach(test => {
    const category = test.name.split(' - ')[0];
    if (!groupedTests[category]) {
      groupedTests[category] = [];
    }
    groupedTests[category].push(test);
  });

  Object.keys(groupedTests).forEach(category => {
    report += `### ${category}\n\n`;
    groupedTests[category].forEach(test => {
      const statusIcon = test.status === 'PASS' ? 'PASS' : test.status === 'FAIL' ? 'FAIL' : 'WARN';
      report += `#### [${statusIcon}] ${test.name}\n`;
      report += `- **Status:** ${test.status}\n`;
      if (test.details) {
        report += `- **Details:** ${test.details}\n`;
      }
      if (test.screenshot) {
        report += `- **Screenshot:** \`${test.screenshot}\`\n`;
      }
      report += `- **Time:** ${test.timestamp}\n\n`;
    });
  });

  // Screenshots
  report += `## Screenshots\n\n`;
  report += `Total screenshots captured: ${results.screenshots.length}\n\n`;
  results.screenshots.forEach((screenshot, index) => {
    report += `${index + 1}. **${screenshot.name}**\n`;
    report += `   - Path: \`${screenshot.path}\`\n`;
    report += `   - Time: ${screenshot.timestamp}\n\n`;
  });

  // Recommendations
  report += `## Recommendations\n\n`;
  if (results.summary.failed > 0) {
    report += `- Fix ${results.summary.failed} failed test(s)\n`;
  }
  if (results.consoleErrors.length > 0) {
    report += `- Investigate and resolve ${results.consoleErrors.length} console error(s)\n`;
  }
  if (results.networkErrors.length > 0) {
    report += `- Fix ${results.networkErrors.length} network error(s)\n`;
  }
  if (results.summary.warnings > 0) {
    report += `- Review ${results.summary.warnings} warning(s) for potential improvements\n`;
  }
  if (results.summary.failed === 0 && results.consoleErrors.length === 0 && results.networkErrors.length === 0) {
    report += `All tests passed successfully with no errors detected!\n`;
  }

  fs.writeFileSync(reportPath, report);
  console.log(`\nReport saved to: ${reportPath}`);

  // Also save JSON results
  const jsonPath = path.join(__dirname, 'support-portal-test-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`JSON results saved to: ${jsonPath}`);

  return reportPath;
}

async function main() {
  console.log('Starting Support Portal Comprehensive Test Suite...');
  console.log(`Testing: ${SUPPORT_URL}`);
  console.log(`Timestamp: ${results.timestamp}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security'
    ]
  });

  try {
    // Test login page
    const loginSuccess = await testLoginPage(browser);

    // Test dashboard
    const dashboardSuccess = await testDashboard(browser);

    // Generate report
    const reportPath = await generateReport();

    // Print summary
    console.log('\n=== Test Summary ===');
    console.log(`Total Tests: ${results.summary.total}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Failed: ${results.summary.failed}`);
    console.log(`Warnings: ${results.summary.warnings}`);
    console.log(`Success Rate: ${results.summary.total > 0 ? ((results.summary.passed / results.summary.total) * 100).toFixed(2) : 0}%`);
    console.log(`\nReport: ${reportPath}`);
    console.log(`Screenshots: ${results.screenshots.length} captured`);

    if (results.consoleErrors.length > 0) {
      console.log(`\nConsole Errors: ${results.consoleErrors.length}`);
      results.consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. [${err.page}] ${err.text}`);
      });
    }
    if (results.networkErrors.length > 0) {
      console.log(`\nNetwork Errors: ${results.networkErrors.length}`);
      results.networkErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. [${err.page}] ${err.url} - ${err.error}`);
      });
    }

  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
