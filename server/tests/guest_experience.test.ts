import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runGuestExperienceTests() {
  console.log('🌐 Running LibraAI Guest Experience & Access Control Automated Tests...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    const API_BASE = 'http://localhost:5000/api';

    // Test 1: Public Landing Data is accessible without authorization
    const landingRes = await fetch(`${API_BASE}/books/landing-data`);
    const landingData = await landingRes.json() as any;
    assert(landingRes.status === 200 && landingData.success === true, 'Public /api/books/landing-data responds with 200 OK');
    assert(landingData.stats.totalTitles > 0, `Stats reflect real DB titles (actual: ${landingData.stats.totalTitles})`);
    assert(landingData.stats.totalCopies > 0, `Stats reflect real DB copies (actual: ${landingData.stats.totalCopies})`);
    assert(landingData.newArrivals.length > 0, `New Arrivals returned from real DB (count: ${landingData.newArrivals.length})`);
    assert(landingData.popularThisMonth.length > 0, `Popular books returned from real DB (count: ${landingData.popularThisMonth.length})`);
    assert(landingData.categories.length > 0, `Academic categories populated (count: ${landingData.categories.length})`);

    // Test 2: Public Catalog Search is accessible to guests
    const catalogRes = await fetch(`${API_BASE}/books?limit=10`);
    const catalogData = await catalogRes.json() as any;
    assert(catalogRes.status === 200 && catalogData.books.length > 0, 'Guest can search and browse full catalog without authentication');

    // Test 3: Public Single Book Details is accessible to guests
    const sampleBookId = catalogData.books[0].id;
    const bookRes = await fetch(`${API_BASE}/books/${sampleBookId}`);
    const bookData = await bookRes.json() as any;
    assert(bookRes.status === 200 && Boolean(bookData.book.title), `Guest can view full book detail & shelf locator (${bookData.book.title})`);

    // Test 4: Protected API routes reject unauthenticated guest requests with 401
    const protectedAnalytics = await fetch(`${API_BASE}/analytics/kpis`);
    assert(protectedAnalytics.status === 401, 'Protected /api/analytics/kpis rejects guest request with 401 Unauthorized');

    const protectedIssue = await fetch(`${API_BASE}/circulation/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: 'D-1', memberId: 'STU001' }),
    });
    assert(protectedIssue.status === 401, 'Protected /api/circulation/issue rejects guest request with 401 Unauthorized');

    const protectedUsers = await fetch(`${API_BASE}/users`);
    assert(protectedUsers.status === 401, 'Protected /api/users rejects guest request with 401 Unauthorized');

    console.log(`\n========================================`);
    console.log(`Guest Experience Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runGuestExperienceTests();
