import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * GET /api/student/dashboard
 * Aggregated live dashboard data for the authenticated student
 */
router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const now = new Date();

    // 1. Fetch Student User Record
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      res.status(404).json({ success: false, error: 'Student record not found.' });
      return;
    }

    const dept = student.department || 'Computer Engineering';

    // 2. Fetch Active Loans, Reservations, Fines, Seat Bookings, and Activity Logs
    const [
      activeIssues,
      allIssuesEver,
      pendingReservations,
      fines,
      seatBookings,
      trendingBranchBooksRaw,
      deptRecommendedRaw,
      recentLogs,
    ] = await Promise.all([
      prisma.issueRecord.findMany({
        where: {
          userId: studentId,
          status: 'ACTIVE',
        },
        include: {
          copy: {
            include: { book: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.issueRecord.findMany({
        where: { userId: studentId },
        include: {
          copy: {
            include: { book: true },
          },
        },
        orderBy: { issuedDate: 'desc' },
        take: 10,
      }),
      prisma.reservation.findMany({
        where: {
          userId: studentId,
          status: 'PENDING',
        },
        include: {
          book: {
            include: {
              copies: {
                where: { status: 'AVAILABLE' },
                select: { id: true },
              },
            },
          },
        },
        orderBy: { reservedDate: 'asc' },
      }),
      prisma.fine.findMany({
        where: { userId: studentId },
        include: {
          issueRecord: {
            include: {
              copy: {
                include: { book: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.seatBooking.findMany({
        where: {
          userId: studentId,
          endTime: { gte: now },
          status: 'ACTIVE',
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.book.findMany({
        where: { department: { contains: dept.split(' ')[0] } },
        take: 6,
        include: {
          copies: {
            where: { status: 'AVAILABLE' },
            select: { id: true },
          },
          _count: { select: { copies: true, reviews: true } },
        },
      }),
      prisma.book.findMany({
        where: {
          OR: [
            { department: dept },
            { department: 'Engineering Science' },
          ],
        },
        take: 6,
        orderBy: { title: 'asc' },
        include: {
          copies: {
            where: { status: 'AVAILABLE' },
            select: { id: true },
          },
          _count: { select: { copies: true } },
        },
      }),
      prisma.activityLog.findMany({
        where: { userId: studentId },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    // 3. Format Summary Stats
    const unpaidFinesTotal = fines
      .filter((f) => f.status === 'UNPAID')
      .reduce((sum, f) => sum + f.amount, 0);

    const summary = {
      borrowedCount: activeIssues.length,
      reservedCount: pendingReservations.length,
      unpaidFinesTotal,
      readingStreak: student.readingStreak || 0,
      totalPoints: student.totalPoints || 0,
      level: Math.floor((student.totalPoints || 0) / 100) + 1,
    };

    // 4. Compute Alerts Strip
    const alerts: any[] = [];

    // Overdue or Due Soon alerts
    for (const issue of activeIssues) {
      const dueDate = new Date(issue.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) {
        alerts.push({
          id: `overdue-${issue.id}`,
          type: 'OVERDUE',
          severity: 'danger',
          title: `Overdue: "${issue.copy.book.title}"`,
          message: `Due date was ${Math.abs(daysRemaining)} days ago. Please return or renew at circulation counter.`,
          actionLabel: issue.renewCount < 3 ? 'Renew Online' : 'View Details',
          actionType: issue.renewCount < 3 ? 'RENEW' : 'NAVIGATE',
          targetId: issue.id,
          bookId: issue.copy.bookId,
        });
      } else if (daysRemaining <= 3) {
        alerts.push({
          id: `due-soon-${issue.id}`,
          type: 'DUE_SOON',
          severity: 'warning',
          title: `Due in ${daysRemaining === 0 ? 'Today' : `${daysRemaining} day(s)`}: "${issue.copy.book.title}"`,
          message: `Due on ${dueDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}.`,
          actionLabel: issue.renewCount < 3 ? 'Renew (+14 Days)' : 'View Book',
          actionType: issue.renewCount < 3 ? 'RENEW' : 'NAVIGATE',
          targetId: issue.id,
          bookId: issue.copy.bookId,
        });
      }
    }

    // Unpaid Fines Alert
    if (unpaidFinesTotal > 0) {
      alerts.push({
        id: 'unpaid-fines',
        type: 'UNPAID_FINE',
        severity: 'danger',
        title: `Outstanding Fine: ₹${unpaidFinesTotal.toFixed(2)}`,
        message: 'You have pending overdue charges. Please clear at the counter or request librarian review.',
        actionLabel: 'View Fines',
        actionType: 'NAVIGATE_TAB',
        targetTab: 'fines',
      });
    }

    // Ready Reservations Alert
    for (const res of pendingReservations) {
      const availableCopies = res.book.copies?.length || 0;
      if (availableCopies > 0 && res.queuePosition === 1) {
        alerts.push({
          id: `ready-${res.id}`,
          type: 'RESERVATION_READY',
          severity: 'success',
          title: `Reserved Book Ready for Pickup: "${res.book.title}"`,
          message: 'A physical copy is now waiting on the holding shelf for self-service collection.',
          actionLabel: 'View Shelf Location',
          actionType: 'NAVIGATE_BOOK',
          bookId: res.bookId,
        });
      }
    }

    // 5. Format Currently Borrowed List
    const currentlyBorrowed = activeIssues.map((item) => {
      const dueDate = new Date(item.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isOverdue = daysRemaining < 0;

      return {
        id: item.id,
        bookId: item.copy.bookId,
        title: item.copy.book.title,
        author: item.copy.book.author,
        department: item.copy.book.department,
        barcode: item.copy.barcode,
        shelfLocation: item.copy.shelfNumber || 'Main Stacks',
        issuedDate: item.issuedDate,
        dueDate: item.dueDate,
        renewCount: item.renewCount,
        canRenew: item.renewCount < 3 && !isOverdue,
        isOverdue,
        daysRemaining,
        status: isOverdue ? 'OVERDUE' : daysRemaining <= 3 ? 'DUE_SOON' : 'ON_TIME',
      };
    });

    // 6. Format Continue Reading / My Shelf
    const shelfBooks = allIssuesEver.map((item) => ({
      id: item.copy.book.id,
      title: item.copy.book.title,
      author: item.copy.book.author,
      department: item.copy.book.department,
      status: item.status === 'ACTIVE' ? 'Currently Reading' : 'Completed',
      borrowedDate: item.issuedDate,
      returnedDate: item.returnedDate,
      rating: 5,
    }));

    // 7. Recommended for You with One-Line Reasons
    const recommendedBooks = deptRecommendedRaw.map((b, idx) => {
      const reasons = [
        `Recommended textbook for ${student.department || 'Engineering'} curriculum`,
        `Frequently referenced in ${student.department || 'Engineering'} examinations`,
        `Key conceptual reference aligned with MSBTE diploma syllabus`,
        `High student engagement and solved question sets`,
        `Recommended companion text by department faculty`,
        `Foundational reading for engineering semester projects`,
      ];

      return {
        id: b.id,
        title: b.title,
        author: b.author,
        department: b.department,
        year: b.year,
        availableCopies: b.copies.length,
        totalCopies: b._count.copies,
        reason: reasons[idx % reasons.length],
      };
    });

    // 8. Trending in My Branch
    const trendingBranchBooks = trendingBranchBooksRaw.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      department: b.department,
      availableCopies: b.copies.length,
      totalCopies: b._count.copies,
    }));

    // 9. Upcoming (Seat Bookings + Pending Reservations)
    const upcoming = {
      seatBookings: seatBookings.map((s) => ({
        id: s.id,
        seatCode: s.seatCode,
        roomType: s.roomType,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      reservations: pendingReservations.map((r) => ({
        id: r.id,
        bookId: r.bookId,
        title: r.book.title,
        author: r.book.author,
        reservedDate: r.reservedDate,
        queuePosition: r.queuePosition,
        expiryDate: r.expiryDate,
        availableCopies: r.book.copies.length,
      })),
      announcements: [
        {
          id: 'ann-1',
          title: 'Extended Reading Hall Hours for Exam Prep',
          date: 'Mon – Sat, 7:00 AM – 10:00 PM',
        },
        {
          id: 'ann-2',
          title: 'Digital Lab 24/7 AI Terminal Access Open',
          date: 'All engineering students eligible',
        },
      ],
    };

    // 10. Recent Activity
    const recentActivity = recentLogs.map((log) => {
      let detailsObj: any = {};
      try {
        detailsObj = JSON.parse(log.details);
      } catch {
        detailsObj = {};
      }

      return {
        id: log.id,
        action: log.action,
        timestamp: log.createdAt,
        details: detailsObj,
      };
    });

    // 11. Achievements
    let badgesArray: string[] = ['Active Scholar', 'Punctual Reader', 'Tech Explorer'];
    try {
      if (student.badges) badgesArray = JSON.parse(student.badges);
    } catch {
      // keep fallback
    }

    const achievements = {
      readingStreak: student.readingStreak || 0,
      totalPoints: student.totalPoints || 0,
      level: Math.floor((student.totalPoints || 0) / 100) + 1,
      badges: badgesArray,
    };

    res.json({
      success: true,
      student: {
        id: student.id,
        memberId: student.memberId,
        name: student.name,
        email: student.email,
        role: student.role,
        department: student.department || 'Computer Engineering',
        year: student.year || 3,
        semester: student.semester || 5,
        avatarUrl: student.avatarUrl,
      },
      summary,
      alerts,
      currentlyBorrowed,
      shelfBooks,
      recommendedBooks,
      trendingBranchBooks,
      upcoming,
      recentActivity,
      achievements,
    });
  } catch (error: any) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve student dashboard.' });
  }
});

/**
 * GET /api/student/stats
 * Real stats strictly for the logged-in student (books read, categories, streak, monthly activity)
 */
router.get('/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const now = new Date();

    const [student, allIssues, fines] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId } }),
      prisma.issueRecord.findMany({
        where: { userId: studentId },
        include: {
          copy: {
            include: { book: true },
          },
        },
        orderBy: { issuedDate: 'asc' },
      }),
      prisma.fine.findMany({
        where: { userId: studentId },
      }),
    ]);

    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }

    const totalBorrowed = allIssues.length;
    const returnedOnTime = allIssues.filter((i) => i.status === 'RETURNED' && (!i.returnedDate || i.returnedDate <= i.dueDate)).length;
    const onTimeRate = totalBorrowed > 0 ? Number(((returnedOnTime / totalBorrowed) * 100).toFixed(1)) : 100;

    // Categories breakdown
    const catMap = new Map<string, number>();
    for (const issue of allIssues) {
      const d = issue.copy?.book?.department || 'General';
      catMap.set(d, (catMap.get(d) || 0) + 1);
    }
    const categoriesDistribution = Array.from(catMap.entries()).map(([name, count]) => ({
      name: name.replace(' Engineering', ''),
      fullName: name,
      count,
    }));

    // Monthly Activity Timeline (Last 6 Months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map<string, { month: string; borrows: number; returns: number }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      monthlyMap.set(mName, { month: mName, borrows: 0, returns: 0 });
    }

    for (const issue of allIssues) {
      const m = months[new Date(issue.issuedDate).getMonth()];
      if (monthlyMap.has(m)) {
        monthlyMap.get(m)!.borrows += 1;
      }
      if (issue.returnedDate) {
        const retM = months[new Date(issue.returnedDate).getMonth()];
        if (monthlyMap.has(retM)) {
          monthlyMap.get(retM)!.returns += 1;
        }
      }
    }

    const monthlyActivity = Array.from(monthlyMap.values());

    res.json({
      success: true,
      stats: {
        totalBooksBorrowed: totalBorrowed,
        activeLoansCount: allIssues.filter((i) => i.status === 'ACTIVE').length,
        readingStreak: student.readingStreak || 0,
        totalPoints: student.totalPoints || 0,
        onTimeRate: `${onTimeRate}%`,
        totalFinesPaid: fines.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0),
        unpaidFines: fines.filter((f) => f.status === 'UNPAID').reduce((sum, f) => sum + f.amount, 0),
        categoriesDistribution,
        monthlyActivity,
      },
    });
  } catch (error: any) {
    console.error('Student stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve student statistics.' });
  }
});

export default router;
