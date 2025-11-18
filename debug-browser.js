const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[BROWSER ${type.toUpperCase()}]:`, msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
  });

  try {
    console.log('Navigating to admin dashboard...');
    await page.goto('http://localhost:45003/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    console.log('✓ Admin dashboard loaded');
    await page.waitForTimeout(3000);

    console.log('\nNavigating to restaurant analytics...');
    await page.goto('http://localhost:45002/restaurant/@fitfresh-abudhabi/analytics', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    console.log('✓ Restaurant analytics loaded');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Navigation error:', error.message);
  } finally {
    await browser.close();
  }
})();
