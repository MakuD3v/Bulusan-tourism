import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR]: ${err.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED]: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    await page.goto('https://bulusan-tourism.web.app', { waitUntil: 'networkidle0', timeout: 15000 });
  } catch (err) {
    console.log(`[NAVIGATION ERROR]: ${err.message}`);
  }

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
