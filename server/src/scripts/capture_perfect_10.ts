import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'D:\\libarr\\report_screenshots';

function getBrowserExecutablePath(): string {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setLightMode(page: any) {
  await page.evaluate(() => {
    localStorage.setItem('libra_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
}

async function loginViaApi(page: any, email: string, pass: string) {
  await page.evaluate(async (email, pass) => {
    localStorage.setItem('libra_theme', 'light');
    document.documentElement.classList.remove('dark');
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('libra_token', data.token);
      localStorage.setItem('libra_user', JSON.stringify(data.user));
    }
  }, email, pass);
}

async function capturePerfectScreenshots() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const execPath = getBrowserExecutablePath();
  console.log('🚀 Launching Browser (1440x900, Light Mode) for 10 Perfect Report Screenshots...');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: execPath || undefined,
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // -------------------------------------------------------------
  // 1. GUEST HOME
  // -------------------------------------------------------------
  console.log('📸 1/10: Guest Landing Page (01_guest_home.png)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('libra_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await wait(1200);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_guest_home.png') });

  // -------------------------------------------------------------
  // 2. LOGIN POPUP
  // -------------------------------------------------------------
  console.log('📸 2/10: Login Popup Open (02_login_popup.png)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find((b) => b.textContent?.trim().includes('Login'));
    if (btn) (btn as HTMLElement).click();
  });
  await wait(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_popup.png') });

  // -------------------------------------------------------------
  // 3. STUDENT DASHBOARD
  // -------------------------------------------------------------
  console.log('📸 3/10: Student Dashboard (03_student_dashboard.png)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await loginViaApi(page, 'student.aarav@college.edu', 'Student@123');
  await page.goto('http://localhost:5173/student', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_student_dashboard.png') });

  // -------------------------------------------------------------
  // 4. BOOKS CATALOG WITH SEARCH & FILTER
  // -------------------------------------------------------------
  console.log('📸 4/10: Books Catalog Search & Filter (04_catalog_search.png)...');
  await page.goto('http://localhost:5173/catalog?q=Computer', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(2500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_catalog_search.png') });

  // -------------------------------------------------------------
  // 5. AI FEATURE IN ACTION (Floating LibraBot AI Chatbot)
  // -------------------------------------------------------------
  console.log('📸 5/10: AI Assistant Chatbot In Action (05_ai_feature.png)...');
  await page.goto('http://localhost:5173/student', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(1500);

  // Click the floating AI Assistant button at bottom right
  await page.evaluate(() => {
    const aiBtn = document.querySelector('button.fixed.bottom-6.right-6, [class*="bottom-6"][class*="right-6"] button, button:has(svg.lucide-sparkles)');
    if (aiBtn) (aiBtn as HTMLElement).click();
  });
  await wait(800);

  // Type in the AI input
  const aiChatInput = await page.$('input[placeholder*="Ask LibraBot" i], input[placeholder*="Ask" i], textarea[placeholder*="Ask" i]');
  if (aiChatInput) {
    await aiChatInput.type('What are the key differences between SQL and NoSQL databases for college projects?');
    await wait(300);
    await page.keyboard.press('Enter');
    await wait(3000); // Wait for API response
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_ai_feature.png') });

  // Close AI modal if open
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close"], button:has(svg.lucide-x)');
    if (closeBtn) (closeBtn as HTMLElement).click();
  });

  // -------------------------------------------------------------
  // 6. LIBRARIAN DASHBOARD
  // -------------------------------------------------------------
  console.log('📸 6/10: Librarian Dashboard (06_librarian_dashboard.png)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await loginViaApi(page, 'librarian@college.edu', 'Librarian@123');
  await page.goto('http://localhost:5173/librarian', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_librarian_dashboard.png') });

  // -------------------------------------------------------------
  // 7. ISSUE / RETURN CIRCULATION DESK
  // -------------------------------------------------------------
  console.log('📸 7/10: Rapid Circulation Desk (07_issue_return.png)...');
  await page.evaluate(() => {
    const tabBtns = Array.from(document.querySelectorAll('button')).filter((b) => b.textContent?.includes('Rapid Circulation Desk') || b.textContent?.includes('Circulation'));
    if (tabBtns.length > 0) (tabBtns[0] as HTMLElement).click();
  });
  await wait(1200);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_issue_return.png') });

  // -------------------------------------------------------------
  // 8. ADMIN DASHBOARD
  // -------------------------------------------------------------
  console.log('📸 8/10: Admin Dashboard (08_admin_dashboard.png)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await loginViaApi(page, 'admin@2007', 'admin@2008');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_admin_dashboard.png') });

  // -------------------------------------------------------------
  // 9. ADMIN USER MANAGEMENT & CREATE MODAL
  // -------------------------------------------------------------
  console.log('📸 9/10: Admin User Management (09_admin_users.png)...');
  await page.goto('http://localhost:5173/admin/members', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(1500);
  // Click "Provision New Account" button
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Provision') || b.textContent?.includes('Add') || b.textContent?.includes('Create'));
    if (addBtn) addBtn.click();
  });
  await wait(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_admin_users.png') });

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close"], button:has(svg.lucide-x)');
    if (closeBtn) (closeBtn as HTMLElement).click();
  });

  // -------------------------------------------------------------
  // 10. ANALYTICS & REPORTS PAGE WITH CHARTS
  // -------------------------------------------------------------
  console.log('📸 10/10: Analytics Charts & Reports (10_analytics_charts.png)...');
  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(3000); // Give Recharts full time to animate and render SVG charts
  // Scroll down slightly so the charts are centered in the 1440x900 viewport
  await page.evaluate(() => {
    window.scrollBy({ top: 380, behavior: 'instant' });
  });
  await wait(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_analytics_charts.png') });

  await browser.close();
  console.log('🎉 ALL 10 PERFECT SCREENSHOTS CAPTURED IN LIGHT MODE!');
}

capturePerfectScreenshots().catch(console.error);
