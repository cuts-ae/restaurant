const puppeteer = require('puppeteer');

async function captureDetailedError() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];
  const consoleMessages = [];

  // Capture ALL console messages with full details
  page.on('console', async msg => {
    const type = msg.type();
    const text = msg.text();

    // Try to get the actual error object if it's an error
    const args = await Promise.all(
      msg.args().map(arg => arg.jsonValue().catch(() => arg.toString()))
    );

    consoleMessages.push({ type, text, args, timestamp: new Date().toISOString() });

    console.log(`[${type.toUpperCase()}]:`, text);
    if (args.length > 0 && type === 'error') {
      console.log('Error args:', JSON.stringify(args, null, 2));
    }
  });

  // Capture page errors with full stack
  page.on('pageerror', error => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    };
    errors.push(errorDetails);
    console.error('\n=== PAGE ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  });

  try {
    // Login
    console.log('Navigating to login...');
    await page.goto('http://localhost:45002/login', { waitUntil: 'networkidle2' });

    await page.type('input[type="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Logged in, navigating to orders page...');

    // Navigate to orders page
    await page.goto('http://localhost:45002/restaurant/@fitfresh-abudhabi/orders', {
      waitUntil: 'networkidle2'
    });

    // Wait a bit for any errors to surface
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== SUMMARY ===');
    console.log('Total errors:', errors.length);
    console.log('Total console messages:', consoleMessages.length);

    if (errors.length > 0) {
      console.log('\n=== DETAILED ERRORS ===');
      errors.forEach((err, i) => {
        console.log(`\nError ${i + 1}:`);
        console.log(JSON.stringify(err, null, 2));
      });
    }

    // Check for error messages in console
    const errorMessages = consoleMessages.filter(m => m.type === 'error');
    if (errorMessages.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      errorMessages.forEach((msg, i) => {
        console.log(`\nConsole Error ${i + 1}:`);
        console.log(JSON.stringify(msg, null, 2));
      });
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  console.log('\nKeeping browser open for 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  await browser.close();
}

captureDetailedError()
  .then(() => console.log('Done'))
  .catch(err => console.error('Failed:', err));
