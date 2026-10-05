import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';

async function setupTestData() {
  console.log('🔧 Setting up verified test data for screenshots...');

  const pwdHash = await bcrypt.hash('Student@123', 12);
  const libPwdHash = await bcrypt.hash('Librarian@123', 12);

  // 1. Ensure Student account
  let student = await prisma.user.findFirst({
    where: { email: 'student.aarav@college.edu' }
  });

  if (!student) {
    student = await prisma.user.create({
      data: {
        memberId: 'STU1001',
        name: 'Aarav Sharma',
        email: 'student.aarav@college.edu',
        passwordHash: pwdHash,
        role: 'STUDENT',
        department: 'Computer Engineering',
        year: 3,
        semester: 5,
        enrollmentNumber: 'ENR2024CS042',
        phone: '9876543210',
        readingStreak: 12,
        totalPoints: 340,
        status: 'ACTIVE',
        isActive: true,
        isEmailVerified: true,
        mustChangePassword: false,
      }
    });
    console.log('✅ Student created:', student.email);
  }

  // 2. Ensure Librarian account
  let librarian = await prisma.user.findFirst({
    where: { email: 'librarian@college.edu' }
  });

  if (!librarian) {
    librarian = await prisma.user.create({
      data: {
        memberId: 'LIB001',
        name: 'Priya Deshmukh',
        email: 'librarian@college.edu',
        passwordHash: libPwdHash,
        role: 'LIBRARIAN',
        department: 'Central Library',
        phone: '9822334455',
        status: 'ACTIVE',
        isActive: true,
        isEmailVerified: true,
        mustChangePassword: false,
      }
    });
    console.log('✅ Librarian created:', librarian.email);
  }

  // 3. Ensure at least 2 active book issues for Student
  const copies = await prisma.bookCopy.findMany({
    where: { status: 'AVAILABLE' },
    take: 4,
    include: { book: true }
  });

  if (copies.length >= 2) {
    const existingIssues = await prisma.issueRecord.findMany({
      where: { userId: student.id, status: 'ACTIVE' }
    });

    if (existingIssues.length === 0) {
      const now = new Date();
      const due1 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days left
      const due2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);  // 2 days left (Due Soon)

      await prisma.issueRecord.create({
        data: {
          bookCopyId: copies[0].id,
          userId: student.id,
          issuedDate: now,
          dueDate: due1,
          status: 'ACTIVE',
          renewCount: 0,
        }
      });
      await prisma.bookCopy.update({
        where: { id: copies[0].id },
        data: { status: 'ISSUED' }
      });

      await prisma.issueRecord.create({
        data: {
          bookCopyId: copies[1].id,
          userId: student.id,
          issuedDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
          dueDate: due2,
          status: 'ACTIVE',
          renewCount: 1,
        }
      });
      await prisma.bookCopy.update({
        where: { id: copies[1].id },
        data: { status: 'ISSUED' }
      });

      console.log('✅ Active loan records created for student.');
    }
  }

  // 4. Ensure a seat booking for student
  const existingBooking = await prisma.seatBooking.findFirst({
    where: { userId: student.id }
  });
  if (!existingBooking) {
    const now = new Date();
    await prisma.seatBooking.create({
      data: {
        userId: student.id,
        seatCode: 'ZONE-A-S14',
        roomType: 'Digital Lab (AI Terminal)',
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    });
    console.log('✅ Seat booking created for student.');
  }

  console.log('🎉 Screenshot test data ready!');
}

setupTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
