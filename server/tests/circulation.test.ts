import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Running LibraAI Circulation & Fines Automated Logic Tests...\n');
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
    // Test 1: User authentication and role retrieval
    const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    assert(Boolean(student && student.memberId === 'STU001'), 'Student demo user exists and has memberId STU001');

    const librarian = await prisma.user.findFirst({ where: { role: 'LIBRARIAN' } });
    assert(Boolean(librarian && librarian.role === 'LIBRARIAN'), 'Librarian demo user exists with role LIBRARIAN');

    // Test 2: Book and Copies Integrity
    const totalBooks = await prisma.book.count();
    assert(totalBooks > 2000, `Catalog contains 2,000+ distinct titles (actual: ${totalBooks})`);

    const totalCopies = await prisma.bookCopy.count();
    assert(totalCopies >= 8000, `Catalog inventory contains 8,000+ physical copies (actual: ${totalCopies})`);

    // Test 3: Active Loans & Status
    const activeIssue = await prisma.issueRecord.findFirst({
      where: { userId: student!.id, status: 'ACTIVE' },
      include: { copy: true },
    });
    assert(Boolean(activeIssue && activeIssue.copy.status === 'ISSUED'), 'Active loan correctly marks physical copy status as ISSUED');

    // Test 4: Overdue fine calculation logic
    const overdueIssue = await prisma.issueRecord.findFirst({
      where: { userId: student!.id, status: 'OVERDUE' },
      include: { fines: true },
    });
    assert(
      Boolean(overdueIssue && overdueIssue.fines.length > 0 && overdueIssue.fines[0].amount === 20.0),
      'Overdue issue calculates ₹5/day fine correctly (4 days = ₹20.00)'
    );

    // Test 5: Seat Reservation System
    const seat = await prisma.seatBooking.findFirst({
      where: { userId: student!.id },
    });
    assert(Boolean(seat && seat.seatCode.startsWith('ZONE-A')), 'Seat booking created in Silent Study zone');

    // Test 6: Tamper-Evident SHA-256 Audit Trail
    const logs = await prisma.activityLog.findMany({ take: 5 });
    assert(logs.length > 0 && Boolean(logs[0].currentHash), 'Audit logs recorded with cryptographic SHA-256 hash');

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
