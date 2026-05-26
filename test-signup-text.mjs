import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://bulusan-tourism.web.app/signup', { waitUntil: 'domcontentloaded' });
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Fill out the form
    await page.type('input[type="text"]', 'Test User');
    await page.type('input[type="email"]', `testuser${Date.now()}@bulusan.com`);
    await page.type('input[type="password"]', 'Password123!');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Wait for a few seconds
    await new Promise(r => setTimeout(r, 6000));
    
    // Print the text on the screen
    const text = await page.evaluate(() => document.body.innerText);
    console.log("[SCREEN TEXT]\n", text);
    
  } catch (err) {
    console.log(`[ERROR]: ${err.message}`);
  }

  await browser.close();
})();
