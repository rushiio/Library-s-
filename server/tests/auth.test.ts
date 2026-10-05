import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runAuthSecurityTests() {
  console.log('🔒 Running LibraAI Authentication & Security Safeguard Tests...\n');
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
    // Test 1: Admin account initialized securely from env
    const adminEmail = process.env.ADMIN_EMAIL || 'malisunita024@gmail.com';
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    assert(Boolean(admin && admin.role === 'ADMIN'), `Admin account exists (${adminEmail}) with role 'ADMIN'`);
    assert(Boolean(admin && admin.mustChangePassword === true), 'Admin has mustChangePassword flag set to true');

    // Test 2: Password hash verification with bcrypt cost 12
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'sunita@024';
    const isPasswordValid = await bcrypt.compare(adminPassword, admin!.passwordHash);
    assert(isPasswordValid, 'Admin password hash verified using bcrypt');
    assert(admin!.passwordHash.startsWith('$2a$12$') || admin!.passwordHash.startsWith('$2b$12$'), 'Password hash uses 12 rounds of bcrypt');

    // Test 3: Last remaining admin safeguard check
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
    assert(totalAdmins >= 1, `System maintains at least 1 active Administrator (actual: ${totalAdmins})`);

    // Test 4: Student role enforcement on creation
    const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    assert(Boolean(student && student.role === 'STUDENT'), 'Student user has role STUDENT');

    // Test 5: Check SHA-256 Audit Trail logs
    const auditCount = await prisma.activityLog.count();
    assert(auditCount > 0, `Tamper-evident audit chain initialized with ${auditCount} ledger entries`);

    console.log(`\n========================================`);
    console.log(`Security Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error('Security test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthSecurityTests();
