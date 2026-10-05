import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAnalyticsData() {
  console.log('📊 Seeding rich multi-month library analytics and transaction dataset...');

  // 1. Fetch existing users and books
  const users = await prisma.user.findMany();
  const books = await prisma.book.findMany({
    include: { copies: true },
    take: 50,
  });

  if (users.length === 0 || books.length === 0) {
    console.log('Please ensure base users and catalog books are imported first.');
    return;
  }

  // Ensure we have multiple student members across departments
  const studentNames = [
    { name: 'Priya Sharma', dept: 'Computer Engineering', sem: 4, email: 'priya.s@libra.ai', id: 'STU002' },
    { name: 'Aditya Patil', dept: 'Mechanical Engineering', sem: 6, email: 'aditya.p@libra.ai', id: 'STU003' },
    { name: 'Sneha Kulkarni', dept: 'Electronics and Telecommunication Engineering', sem: 4, email: 'sneha.k@libra.ai', id: 'STU004' },
    { name: 'Rahul Joshi', dept: 'Civil Engineering', sem: 8, email: 'rahul.j@libra.ai', id: 'STU005' },
    { name: 'Ananya Deshmukh', dept: 'Electrical Engineering', sem: 2, email: 'ananya.d@libra.ai', id: 'STU006' },
    { name: 'Tanmay Shinde', dept: 'Engineering Science', sem: 2, email: 'tanmay.s@libra.ai', id: 'STU007' },
    { name: 'Neha Varma', dept: 'Computer Engineering', sem: 6, email: 'neha.v@libra.ai', id: 'STU008' },
    { name: 'Saurabh Gokhale', dept: 'Mechanical Engineering', sem: 4, email: 'saurabh.g@libra.ai', id: 'STU009' },
  ];

  const createdStudents = [];
  for (const s of studentNames) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        memberId: s.id,
        name: s.name,
        email: s.email,
        passwordHash: '$2a$10$wO3t4hNlC59f1U0PqN26xOBQy5G9P31K9bI0oKqJ9T2N3V4.d5.q6', // Password@123
        role: 'STUDENT',
        department: s.dept,
        semester: s.sem,
        readingStreak: Math.floor(Math.random() * 20) + 1,
        totalPoints: Math.floor(Math.random() * 500) + 50,
        badges: JSON.stringify(['Bookworm', 'Active Reader']),
      },
    });
    createdStudents.push(user);
  }

  const allMembers = [...users, ...createdStudents];
  const librarian = users.find((u) => u.role === 'LIBRARIAN') || users[0];

  // 2. Generate historical issues & returns across the past 120 days
  console.log('Generating 120-day historical issue/return circulation records...');

  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  for (let i = 0; i < 120; i++) {
    const daysAgo = 120 - i;
    const dateOfIssue = new Date(now - daysAgo * dayMs);
    
    // Vary daily volume by day of week (weekdays higher)
    const dayOfWeek = dateOfIssue.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dailyVolume = isWeekend ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 8) + 4;

    for (let v = 0; v < dailyVolume; v++) {
      const randomUser = allMembers[Math.floor(Math.random() * allMembers.length)];
      const randomBook = books[Math.floor(Math.random() * books.length)];
      const randomCopy = randomBook.copies[Math.floor(Math.random() * randomBook.copies.length)];

      if (!randomCopy) continue;

      const loanDurationDays = 14;
      const dueDate = new Date(dateOfIssue.getTime() + loanDurationDays * dayMs);

      // If issue was more than 14 days ago, mark as returned or overdue
      let returnedDate: Date | null = null;
      let status = 'RETURNED';

      if (daysAgo < 14) {
        // Active loan
        status = 'ACTIVE';
      } else if (daysAgo < 20 && Math.random() < 0.25) {
        // Currently overdue
        status = 'OVERDUE';
      } else {
        // Returned (some on time, some late with fine)
        const returnDelay = Math.random() < 0.3 ? Math.floor(Math.random() * 6) + 1 : 0;
        returnedDate = new Date(dueDate.getTime() + returnDelay * dayMs);

        // If returned late, create fine
        if (returnDelay > 0 && Math.random() < 0.8) {
          const fineAmount = returnDelay * 5.0; // Rs 5/day
          const finePaid = Math.random() < 0.7;

          const record = await prisma.issueRecord.create({
            data: {
              bookCopyId: randomCopy.id,
              userId: randomUser.id,
              issuedDate: dateOfIssue,
              dueDate,
              returnedDate,
              status: 'RETURNED',
              issuedBy: librarian.name,
              remarks: 'Returned late',
            },
          });

          await prisma.fine.create({
            data: {
              issueRecordId: record.id,
              userId: randomUser.id,
              amount: fineAmount,
              daysOverdue: returnDelay,
              status: finePaid ? 'PAID' : 'UNPAID',
              paidDate: finePaid ? new Date(returnedDate.getTime() + dayMs) : null,
            },
          });
          continue;
        }
      }

      await prisma.issueRecord.create({
        data: {
          bookCopyId: randomCopy.id,
          userId: randomUser.id,
          issuedDate: dateOfIssue,
          dueDate,
          returnedDate,
          status,
          issuedBy: librarian.name,
          remarks: status === 'ACTIVE' ? 'Regular Semester Issue' : undefined,
        },
      });
    }
  }

  // 3. Generate Seat Bookings across 3 zones
  console.log('Generating study seat reservations dataset...');
  const zones = [
    { prefix: 'ZONE-A-S', type: 'Silent Study', count: 18 },
    { prefix: 'ZONE-B-S', type: 'Group Discussion', count: 12 },
    { prefix: 'ZONE-C-S', type: 'Digital Lab', count: 10 },
  ];

  for (const z of zones) {
    for (let seatNum = 1; seatNum <= z.count; seatNum++) {
      if (Math.random() < 0.45) {
        const randomStudent = createdStudents[Math.floor(Math.random() * createdStudents.length)];
        const seatCode = `${z.prefix}${seatNum < 10 ? '0' + seatNum : seatNum}`;
        const startTime = new Date(Date.now() - Math.floor(Math.random() * 2) * 3600 * 1000);
        const endTime = new Date(startTime.getTime() + 4 * 3600 * 1000);

        await prisma.seatBooking.create({
          data: {
            userId: randomStudent.id,
            seatCode,
            roomType: z.type,
            startTime,
            endTime,
            status: 'ACTIVE',
          },
        });
      }
    }
  }

  // 4. Generate Book Reviews with sentiments
  console.log('Generating book ratings and peer reviews...');
  const reviewsSample = [
    { rating: 5, comment: 'Exceptional textbook with step-by-step solved engineering numericals!', sentiment: 'positive' },
    { rating: 5, comment: 'Clear explanations for university semester exams.', sentiment: 'positive' },
    { rating: 4, comment: 'Very useful reference diagrams and code snippets.', sentiment: 'positive' },
    { rating: 4, comment: 'Good quality textbook, recommended for 2nd and 3rd year students.', sentiment: 'positive' },
    { rating: 3, comment: 'Good conceptual overview but could have more updated real-world examples.', sentiment: 'neutral' },
    { rating: 2, comment: 'Some formulas in chapter 4 need errata updates.', sentiment: 'negative' },
  ];

  for (let b = 0; b < Math.min(books.length, 25); b++) {
    const book = books[b];
    const reviewCount = Math.floor(Math.random() * 4) + 1;
    for (let r = 0; r < reviewCount; r++) {
      const sample = reviewsSample[Math.floor(Math.random() * reviewsSample.length)];
      const student = allMembers[Math.floor(Math.random() * allMembers.length)];

      await prisma.bookReview.create({
        data: {
          bookId: book.id,
          userId: student.id,
          rating: sample.rating,
          comment: sample.comment,
          sentiment: sample.sentiment,
        },
      });
    }
  }

  console.log('✅ Multi-month library analytics and transaction dataset generated successfully!');
}

seedAnalyticsData()
  .catch((e) => {
    console.error('Seed analytics error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
