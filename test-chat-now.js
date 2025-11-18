const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('[BROWSER]', msg.text());
  });

  try {
    await page.goto('http://localhost:45002/login');
    await page.waitForSelector('input[type="email"]');
    
    await page.type('input[type="email"]', 'owner1@cuts.ae');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    await new Promise(r => setTimeout(r, 2000));
    
    const links = await page.$$('a[href*="/restaurant/"]');
    if (links[0]) await links[0].click();
    
    await page.waitForNavigation();
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('\n=== NOW CHECK CONSOLE LOGS ===\n');
    await new Promise(r => setTimeout(r, 10000));
    
  } catch (e) {
    console.error(e);
  }
})();
