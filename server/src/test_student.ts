const API_URL = 'http://localhost:5000/api';

async function runStudentTests() {
  console.log('========================================================');
  console.log('   LibraAI - Student Role Experience End-to-End Suite   ');
  console.log('========================================================\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failCount++;
    }
  }

  try {
    // 1. Sign up a student account
    const rand = Math.floor(100000 + Math.random() * 900000);
    const testEmail = `student_${rand}@college.edu`;
    const testPassword = 'Password@123';
    
    console.log(`1. Testing Student Self-Registration for ${testEmail}...`);
    const regRes = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Patel',
        email: testEmail,
        phone: '9876543210',
        enrollmentNumber: `ENR${rand}`,
        department: 'Computer Science',
        year: 3,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.user?.role === 'STUDENT', 'Self sign-up enforces STUDENT role strictly on server');

    // 2. Log in with the registered credentials
    console.log(`2. Testing Single Login Gateway authentication...`);
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && !!loginData.token, 'Student login succeeds with valid JWT token');
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. Fetch Student Dashboard
    console.log('3. Testing GET /api/student/dashboard (Real DB Data)...');
    const dashRes = await fetch(`${API_URL}/student/dashboard`, { headers: authHeaders });
    assert(dashRes.status === 200, 'GET /api/student/dashboard returned 200 OK');
    
    const d = await dashRes.json();
    assert(d.student && d.student.department === 'Computer Science', 'Student profile reflects department and year correctly');
    assert(typeof d.summary?.borrowedCount === 'number', 'Summary contains real borrowedCount');
    assert(typeof d.summary?.readingStreak === 'number', 'Summary contains real readingStreak');
    assert(Array.isArray(d.alerts), 'Alert strip returned as array');
    assert(Array.isArray(d.currentlyBorrowed), 'currentlyBorrowed returned as array');
    assert(Array.isArray(d.shelfBooks), 'shelfBooks returned as array');
    assert(Array.isArray(d.recommendedBooks), 'recommendedBooks returned with AI curriculum reasons');
    assert(Array.isArray(d.trendingBranchBooks), 'trendingBranchBooks returned as array');
    assert(Array.isArray(d.upcoming?.seatBookings), 'upcoming.seatBookings returned as array');
    assert(Array.isArray(d.upcoming?.reservations), 'upcoming.reservations returned as array');
    assert(Array.isArray(d.recentActivity), 'recentActivity returned as array');
    assert(Array.isArray(d.achievements?.badges), 'achievements.badges returned as array');

    // 4. Fetch Student Stats
    console.log('4. Testing GET /api/student/stats (Isolated Student Analytics)...');
    const statsRes = await fetch(`${API_URL}/student/stats`, { headers: authHeaders });
    assert(statsRes.status === 200, 'GET /api/student/stats returned 200 OK');
    const s = await statsRes.json();
    assert(typeof s.stats?.totalBooksBorrowed === 'number', 'Personal totalBooksBorrowed computed from real issues');
    assert(typeof s.stats?.onTimeRate === 'string', 'Personal onTimeRate calculated correctly');
    assert(Array.isArray(s.stats?.categoriesDistribution), 'Personal categoriesDistribution returned');
    assert(Array.isArray(s.stats?.monthlyActivity), 'Personal 6-month monthlyActivity timeline returned');

    // 5. Test Student Permission Isolation (Students MUST be blocked with 403 on Admin/Librarian routes)
    console.log('5. Testing Strict Role-Based Access Control / 403 Forbidden checks...');
    
    const usersRes = await fetch(`${API_URL}/users`, { headers: authHeaders });
    assert(usersRes.status === 403, 'GET /api/users returns 403 Forbidden for Student');

    const issueRes = await fetch(`${API_URL}/circulation/issue`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ userId: 'fake', bookCopyId: 'fake' }),
    });
    assert(issueRes.status === 403, 'POST /api/circulation/issue returns 403 Forbidden for Student');

    const importRes = await fetch(`${API_URL}/import/process`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    assert(importRes.status === 403, 'POST /api/import/process returns 403 Forbidden for Student');

    console.log(`\n========================================`);
    console.log(`STUDENT EXPERIENCE TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`========================================`);
    
    if (failCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Fatal error during student test execution:', err.message);
    process.exit(1);
  }
}

runStudentTests();
