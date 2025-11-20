const puppeteer = require('puppeteer');

async function captureDetailedErrors() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];

  // Capture ALL console messages with full details
  page.on('console', async msg => {
    const args = [];
    for (let i = 0; i < msg.args().length; i++) {
      try {
        const arg = await msg.args()[i].jsonValue();
        args.push(arg);
      } catch (e) {
        try {
          const text = await msg.args()[i].evaluate(obj => {
            if (obj instanceof Error) {
              return {
                message: obj.message,
                stack: obj.stack,
                name: obj.name
              };
            }
            return String(obj);
          });
          args.push(text);
        } catch (e2) {
          args.push('[Unable to serialize]');
        }
      }
    }

    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      args: args,
      location: msg.location()
    };

    errors.push(logEntry);

    if (msg.type() === 'error') {
      console.log('\n=== CONSOLE ERROR ===');
      console.log('Text:', msg.text());
      console.log('Args:', JSON.stringify(args, null, 2));
      console.log('Location:', msg.location());
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('\n=== PAGE ERROR ===');
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
    errors.push({
      type: 'pageerror',
      message: error.message,
      stack: error.stack
    });
  });

  try {
    console.log('Logging in...');
    await page.goto('http://localhost:45002/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"]', 'TabsTriggerIsnt2026*$');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('\nNavigating to orders page...');
    await page.goto('http://localhost:45002/restaurant/@fitfresh-abudhabi/orders', {
      waitUntil: 'networkidle2'
    });

    // Wait for any errors to appear
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== ALL CAPTURED ERRORS ===');
    console.log(JSON.stringify(errors, null, 2));

    // Try to get React DevTools error
    const reactError = await page.evaluate(() => {
      // Check if there's an error displayed
      const errorElement = document.querySelector('h2');
      if (errorElement && errorElement.textContent.includes('Something went wrong')) {
        return {
          found: true,
          text: errorElement.textContent,
          html: document.body.innerHTML.substring(0, 1000)
        };
      }
      return { found: false };
    });

    console.log('\n=== REACT ERROR CHECK ===');
    console.log(JSON.stringify(reactError, null, 2));

    console.log('\nKeeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('Test error:', error);
  }

  await browser.close();
}

captureDetailedErrors()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
