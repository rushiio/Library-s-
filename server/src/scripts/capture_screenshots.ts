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

async function captureAll() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const execPath = getBrowserExecutablePath();
  console.log('🚀 Launching Chrome at 1440x900 in LIGHT MODE...');
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: execPath || undefined,
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // 1. Guest Landing Page (Light Mode)
  console.log('📸 1. Capturing Guest Landing Page (01_guest_home.png)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('libra_theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await wait(1200);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_guest_home.png') });

  // 2. Login Popup open on Landing Page (Light Mode)
  console.log('📸 2. Capturing Login Popup (02_login_popup.png)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find((b) => b.textContent?.trim().includes('Login'));
    if (btn) (btn as HTMLElement).click();
  });
  await wait(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_popup.png') });

  // 3. Student Dashboard
  console.log('📸 3. Logging in as Student & Capturing Dashboard (03_student_dashboard.png)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await loginViaApi(page, 'student.aarav@college.edu', 'Student@123');
  await page.goto('http://localhost:5173/student', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_student_dashboard.png') });

  // 4. Books Catalog page with search, filters & details modal
  console.log('📸 4. Capturing Books Catalog Search (04_catalog_search.png)...');
  await page.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(1200);
  
  // Search for Computer
  const searchInput = await page.$('input[placeholder*="Search" i], input[type="text"]');
  if (searchInput) {
    await searchInput.type('Computer');
    await wait(600);
  }
  // Click on a book card to open details modal
  await page.evaluate(() => {
    const bookCard = document.querySelector('.grid > div');
    if (bookCard) (bookCard as HTMLElement).click();
  });
  await wait(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_catalog_search.png') });

  // 5. AI feature in use (Ask-the-Book / AI Assistant)
  console.log('📸 5. Capturing AI Feature In Action (05_ai_feature.png)...');
  await page.goto('http://localhost:5173/student?tab=ai', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(1500);
  
  // Type question in AI Assistant
  const aiBox = await page.$('input[placeholder*="Ask" i], textarea[placeholder*="Ask" i], input[type="text"]');
  if (aiBox) {
    await aiBox.type('What are the key differences between SQL and NoSQL databases for college projects?');
    await wait(300);
    await page.keyboard.press('Enter');
    await wait(3500);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_ai_feature.png') });

  // 6. Librarian Dashboard
  console.log('📸 6. Logging in as Librarian & Capturing Dashboard (06_librarian_dashboard.png)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await loginViaApi(page, 'librarian@college.edu', 'Librarian@123');
  await page.goto('http://localhost:5173/librarian', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_librarian_dashboard.png') });

  // 7. Issue/Return circulation counter
  console.log('📸 7. Capturing Issue / Return Page (07_issue_return.png)...');
  await page.goto('http://localhost:5173/librarian?tab=circulation', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_issue_return.png') });

  // 8. Admin Dashboard
  console.log('📸 8. Logging in as Admin & Capturing Admin Dashboard (08_admin_dashboard.png)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await loginViaApi(page, 'admin@2007', 'admin@2008');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_admin_dashboard.png') });

  // 9. Admin User Management
  console.log('📸 9. Capturing Admin User Management (09_admin_users.png)...');
  await page.goto('http://localhost:5173/admin/members', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(2000);
  // Open create member modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find((b) => b.textContent?.includes('Add') || b.textContent?.includes('Member') || b.textContent?.includes('Create'));
    if (addBtn) addBtn.click();
  });
  await wait(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_admin_users.png') });

  // 10. Analytics Page with multiple charts
  console.log('📸 10. Capturing Analytics & Reports Page (10_analytics_charts.png)...');
  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle2' });
  await setLightMode(page);
  await wait(2500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_analytics_charts.png') });

  await browser.close();
  console.log('🎉 ALL 10 SCREENSHOTS CAPTURED IN LIGHT MODE (1440x900)!');
}

captureAll().catch(console.error);
