import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding rich circulation, reviews, fines, and reservations demo data...');

  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const faculty = await prisma.user.findFirst({ where: { role: 'FACULTY' } });
  const librarian = await prisma.user.findFirst({ where: { role: 'LIBRARIAN' } });

  if (!student || !faculty || !librarian) {
    console.log('Demo users not found. Run base seed first.');
    return;
  }

  // Get sample book copies
  const copies = await prisma.bookCopy.findMany({
    take: 10,
    include: { book: true },
  });

  if (copies.length === 0) {
    console.log('No book copies found in database. Run Excel import first.');
    return;
  }

  // 1. Create Active Issue for Student (due in 5 days)
  const copy1 = copies[0];
  const now = new Date();
  const dueIn5Days = new Date(Date.now() + 5 * 24 * 3600 * 1000);

  const existingIssue1 = await prisma.issueRecord.findFirst({
    where: { bookCopyId: copy1.id, status: 'ACTIVE' },
  });

  if (!existingIssue1) {
    await prisma.issueRecord.create({
      data: {
        bookCopyId: copy1.id,
        userId: student.id,
        issuedDate: new Date(Date.now() - 9 * 24 * 3600 * 1000),
        dueDate: dueIn5Days,
        status: 'ACTIVE',
        issuedBy: librarian.name,
        remarks: 'Issued for Semester Exam Prep',
      },
    });

    await prisma.bookCopy.update({
      where: { id: copy1.id },
      data: { status: 'ISSUED' },
    });
  }

  // 2. Create an Overdue Issue with Fine for Student (due 4 days ago)
  if (copies.length > 1) {
    const copy2 = copies[1];
    const overdueDue = new Date(Date.now() - 4 * 24 * 3600 * 1000);

    const existingIssue2 = await prisma.issueRecord.findFirst({
      where: { bookCopyId: copy2.id, status: 'ACTIVE' },
    });

    if (!existingIssue2) {
      const issueOverdue = await prisma.issueRecord.create({
        data: {
          bookCopyId: copy2.id,
          userId: student.id,
          issuedDate: new Date(Date.now() - 18 * 24 * 3600 * 1000),
          dueDate: overdueDue,
          status: 'OVERDUE',
          issuedBy: librarian.name,
          remarks: 'Overdue by 4 days',
        },
      });

      await prisma.bookCopy.update({
        where: { id: copy2.id },
        data: { status: 'ISSUED' },
      });

      // Create unpaid fine of Rs. 20 (4 days * Rs. 5/day)
      await prisma.fine.create({
        data: {
          issueRecordId: issueOverdue.id,
          userId: student.id,
          amount: 20.0,
          daysOverdue: 4,
          status: 'UNPAID',
        },
      });
    }
  }

  // 3. Create a Faculty Must-Read List
  if (copies.length > 3) {
    const existingList = await prisma.facultyList.findFirst({
      where: { facultyId: faculty.id },
    });

    if (!existingList) {
      const facList = await prisma.facultyList.create({
        data: {
          facultyId: faculty.id,
          subjectCode: 'CS-401',
          subjectName: 'Advanced Computer Networks',
          semester: 6,
        },
      });

      await prisma.facultyListItem.create({
        data: {
          listId: facList.id,
          bookId: copies[2].bookId,
          isMandatory: true,
          notes: 'Chapters 3, 4 and 7 are required for Unit Test 1.',
        },
      });
    }
  }

  // 4. Create Sample Seat Bookings
  const existingBooking = await prisma.seatBooking.findFirst({
    where: { userId: student.id },
  });

  if (!existingBooking) {
    await prisma.seatBooking.create({
      data: {
        userId: student.id,
        seatCode: 'ZONE-A-S04',
        roomType: 'Silent Study',
        startTime: new Date(Date.now() - 3600 * 1000),
        endTime: new Date(Date.now() + 3 * 3600 * 1000),
        status: 'ACTIVE',
      },
    });
  }

  console.log('✅ Rich circulation demo data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
