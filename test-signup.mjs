import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    const t = msg.type();
    if (t === 'error' || t === 'warn') console.log(`[CONSOLE ${t.toUpperCase()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => console.log(`[PAGE ERROR]: ${err.message}`));
  page.on('requestfailed', req => console.log(`[REQUEST FAILED]: ${req.url()} -- ${req.failure()?.errorText}`));

  page.on('response', async (response) => {
    const request = response.request();
    if (['xhr', 'fetch'].includes(request.resourceType())) {
      const status = response.status();
      const url = request.url();
      try {
        const text = await response.text();
        console.log(`[API] ${status} ${url}\n  -> ${text.slice(0, 300)}`);
      } catch (e) {
        console.log(`[API] ${status} ${url} -> (unreadable)`);
      }
    }
  });

  try {
    await page.goto('https://www.explorebulusan.com/signup', { waitUntil: 'domcontentloaded' });
    console.log('Navigated to signup page.');
    await new Promise(r => setTimeout(r, 2000));

    await page.type('input[type="text"]', 'Test User Diag');
    await page.type('input[type="email"]', `diag${Date.now()}@test.com`);
    await page.type('input[type="password"]', 'Password123!');

    await page.click('button[type="submit"]');
    console.log('Clicked submit.');
    await new Promise(r => setTimeout(r, 6000));

    const text = await page.evaluate(() => document.body.innerText);
    console.log('[SCREEN TEXT]\n' + text.slice(0, 500));
  } catch (err) {
    console.log(`[ERROR]: ${err.message}`);
  }

  await browser.close();
})();
