import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'D:\\libarr\\report_screenshots';

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('BROWSER ERROR:', err.message));

  // 1. Go to home
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // 2. Login via API into localStorage
  const loginResult = await page.evaluate(async () => {
    localStorage.setItem('libra_theme', 'light');
    document.documentElement.classList.remove('dark');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@2007', password: 'admin@2008' }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('libra_token', data.token);
        localStorage.setItem('libra_user', JSON.stringify(data.user));
        return { success: true, user: data.user.email };
      }
      return { success: false, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  console.log('Login result in browser:', loginResult);

  // 3. Navigate to /admin first to let AuthContext initialize smoothly
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('libra_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await wait(1500);

  // 4. Click the "22-Chart Analytics" button or navigate to /analytics
  console.log('Navigating to /analytics...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, a')).find((el) =>
      el.textContent?.includes('22-Chart Analytics') || el.textContent?.includes('Analytics & Reports')
    );
    if (btn) {
      (btn as HTMLElement).click();
    } else {
      window.location.href = '/analytics';
    }
  });

  await wait(3500);

  await page.evaluate(() => {
    localStorage.setItem('libra_theme', 'light');
    document.documentElement.classList.remove('dark');
    // Scroll down slightly so charts are prominently displayed
    window.scrollBy({ top: 400, behavior: 'instant' });
  });

  await wait(1500);

  const shotPath = path.join(SCREENSHOT_DIR, '10_analytics_charts.png');
  await page.screenshot({ path: shotPath });
  console.log('✅ Captured 10_analytics_charts.png at', shotPath);

  await browser.close();
}

capture().catch(console.error);
