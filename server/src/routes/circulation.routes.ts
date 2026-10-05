import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware.js';
import { AuditService } from '../services/auditService.js';

const router = Router();

/**
 * Helper: Find BookCopy by ID or Barcode
 */
async function findCopy(identifier: string) {
  return await prisma.bookCopy.findFirst({
    where: {
      OR: [
        { id: identifier },
        { barcode: identifier },
        { barcode: identifier.toUpperCase() },
        { barcode: identifier.trim() },
      ],
    },
    include: {
      book: true,
    },
  });
}

/**
 * Helper: Find User by ID, memberId, or Email
 */
async function findUser(identifier: string) {
  return await prisma.user.findFirst({
    where: {
      OR: [
        { id: identifier },
        { memberId: identifier },
        { memberId: identifier.toUpperCase() },
        { email: identifier },
      ],
    },
  });
}

/**
 * GET /api/circulation/copy/:barcodeOrId
 * Instant copy lookup for barcode scanner & circulation desk
 */
router.get('/copy/:barcodeOrId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const barcodeOrId = req.params.barcodeOrId as string;
    const copy = await findCopy(barcodeOrId);

    if (!copy) {
      res.status(404).json({ success: false, error: `Copy with barcode/ID '${barcodeOrId}' not found.` });
      return;
    }

    // If currently issued, fetch current active loan details
    let currentIssue = null;
    if (copy.status === 'ISSUED') {
      currentIssue = await prisma.issueRecord.findFirst({
        where: {
          bookCopyId: copy.id,
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              id: true,
              memberId: true,
              name: true,
              email: true,
              role: true,
              department: true,
            },
          },
        },
      });
    }

    // Check if there are active waitlist reservations for this book
    const pendingReservationsCount = await prisma.reservation.count({
      where: {
        bookId: copy.bookId,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      copy: {
        ...copy,
        currentIssue,
        pendingReservationsCount,
      },
    });
  } catch (error: any) {
    console.error('Lookup copy error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve book copy info.' });
  }
});

/**
 * POST /api/circulation/issue
 * Issue a book copy to a user
 */
router.post('/issue', authenticate, authorize(['LIBRARIAN', 'ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookCopyId, barcode, userId, memberId, dueDate, remarks } = req.body;

    const copyIdentifier = bookCopyId || barcode;
    const userIdentifier = userId || memberId;

    if (!copyIdentifier || !userIdentifier) {
      res.status(400).json({ success: false, error: 'Book barcode/copy ID and User ID/Member ID are required.' });
      return;
    }

    const copy = await findCopy(copyIdentifier);
    if (!copy) {
      res.status(404).json({ success: false, error: `Book copy '${copyIdentifier}' not found.` });
      return;
    }

    if (copy.status === 'ISSUED') {
      res.status(400).json({ success: false, error: `Book '${copy.book.title}' (${copy.barcode}) is already ISSUED.` });
      return;
    }

    if (['LOST', 'DAMAGED', 'IN_MAINTENANCE'].includes(copy.status)) {
      res.status(400).json({ success: false, error: `Book copy is currently unavailable (Status: ${copy.status}).` });
      return;
    }

    const targetUser = await findUser(userIdentifier);
    if (!targetUser) {
      res.status(404).json({ success: false, error: `User '${userIdentifier}' not found.` });
      return;
    }

    if (!targetUser.isActive) {
      res.status(400).json({ success: false, error: `User account '${targetUser.memberId}' is inactive or suspended.` });
      return;
    }

    // Check student borrowing limits (max 5 active loans for students, 10 for faculty)
    const activeLoansCount = await prisma.issueRecord.count({
      where: {
        userId: targetUser.id,
        status: 'ACTIVE',
      },
    });

    const maxLimit = targetUser.role === 'FACULTY' ? 10 : 5;
    if (activeLoansCount >= maxLimit) {
      res.status(400).json({
        success: false,
        error: `User has reached their borrowing limit of ${maxLimit} books (${activeLoansCount} active loans).`,
      });
      return;
    }

    // Calculate default due date (14 days from now if not specified)
    const issueDate = new Date();
    const finalDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Transaction to update copy, create issue record, fulfill reservation if applicable, and log audit
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update copy status to ISSUED
      const updatedCopy = await tx.bookCopy.update({
        where: { id: copy.id },
        data: { status: 'ISSUED' },
      });

      // 2. Create IssueRecord
      const issueRecord = await tx.issueRecord.create({
        data: {
          bookCopyId: copy.id,
          userId: targetUser.id,
          issuedDate: issueDate,
          dueDate: finalDueDate,
          status: 'ACTIVE',
          issuedBy: req.user?.id,
          remarks: remarks || null,
        },
        include: {
          copy: {
            include: {
              book: true,
            },
          },
          user: {
            select: {
              id: true,
              memberId: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // 3. Fulfill pending reservation if user had reserved this book
      await tx.reservation.updateMany({
        where: {
          bookId: copy.bookId,
          userId: targetUser.id,
          status: 'PENDING',
        },
        data: {
          status: 'FULFILLED',
        },
      });

      return issueRecord;
    });

    // Log tamper-evident audit trail
    await AuditService.logAction({
      userId: req.user?.id,
      action: 'BOOK_ISSUE',
      details: {
        issueRecordId: result.id,
        bookTitle: copy.book.title,
        barcode: copy.barcode,
        issuedToMemberId: targetUser.memberId,
        issuedToName: targetUser.name,
        dueDate: finalDueDate.toISOString(),
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Book '${copy.book.title}' successfully issued to ${targetUser.name} (${targetUser.memberId}).`,
      issueRecord: result,
    });
  } catch (error: any) {
    console.error('Issue book error:', error);
    res.status(500).json({ success: false, error: 'Failed to issue book copy.' });
  }
});

/**
 * POST /api/circulation/return
 * Return an issued book copy, calculate overdue fine (Rs. 5/day), update status, and fulfill waitlist
 */
router.post('/return', authenticate, authorize(['LIBRARIAN', 'ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookCopyId, barcode, returnRemarks, condition } = req.body;
    const copyIdentifier = bookCopyId || barcode;

    if (!copyIdentifier) {
      res.status(400).json({ success: false, error: 'Book barcode or copy ID is required.' });
      return;
    }

    const copy = await findCopy(copyIdentifier);
    if (!copy) {
      res.status(404).json({ success: false, error: `Book copy '${copyIdentifier}' not found.` });
      return;
    }

    // Find active issue record
    const activeIssue = await prisma.issueRecord.findFirst({
      where: {
        bookCopyId: copy.id,
        status: 'ACTIVE',
      },
      include: {
        user: true,
        copy: {
          include: { book: true },
        },
      },
    });

    if (!activeIssue) {
      res.status(400).json({ success: false, error: `No active issue record found for book copy '${copy.barcode}'. Current copy status is '${copy.status}'.` });
      return;
    }

    const returnDate = new Date();
    const dueDate = new Date(activeIssue.dueDate);

    // Calculate fines if overdue (Rs. 5 per day)
    let daysOverdue = 0;
    let fineAmount = 0;

    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
      daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 5; // Rs. 5 per day
    }

    // Check if another member has a pending reservation for this book
    const nextReservation = await prisma.reservation.findFirst({
      where: {
        bookId: copy.bookId,
        status: 'PENDING',
      },
      orderBy: [
        { priorityScore: 'desc' },
        { reservedDate: 'asc' },
      ],
      include: {
        user: { select: { id: true, name: true, email: true, memberId: true } },
      },
    });

    const newCopyStatus = nextReservation ? 'RESERVED' : 'AVAILABLE';

    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Update issue record
      const updatedIssue = await tx.issueRecord.update({
        where: { id: activeIssue.id },
        data: {
          status: 'RETURNED',
          returnedDate: returnDate,
          returnedTo: req.user?.id,
          remarks: returnRemarks || activeIssue.remarks,
        },
      });

      // 2. Update copy status and condition
      const updatedCopy = await tx.bookCopy.update({
        where: { id: copy.id },
        data: {
          status: newCopyStatus,
          condition: condition || copy.condition,
        },
      });

      // 3. Create Fine record if overdue
      let fine = null;
      if (fineAmount > 0) {
        fine = await tx.fine.create({
          data: {
            issueRecordId: activeIssue.id,
            userId: activeIssue.userId,
            amount: fineAmount,
            daysOverdue,
            status: 'UNPAID',
          },
        });
      }

      // 4. Reward member points & streak for returning book (bonus points if returned on time)
      const pointsToAdd = daysOverdue === 0 ? 15 : 5;
      await tx.user.update({
        where: { id: activeIssue.userId },
        data: {
          totalPoints: { increment: pointsToAdd },
          readingStreak: daysOverdue === 0 ? { increment: 1 } : undefined,
        },
      });

      return { updatedIssue, updatedCopy, fine };
    });

    // Log audit action
    await AuditService.logAction({
      userId: req.user?.id,
      action: 'BOOK_RETURN',
      details: {
        issueRecordId: activeIssue.id,
        bookTitle: copy.book.title,
        barcode: copy.barcode,
        returnedByMemberId: activeIssue.user.memberId,
        daysOverdue,
        fineAmount,
        reservedForNextUser: nextReservation ? nextReservation.user.memberId : null,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Book '${copy.book.title}' successfully returned.${fineAmount > 0 ? ` Overdue fine of Rs. ${fineAmount} (${daysOverdue} days) generated.` : ''}`,
      issueRecord: transactionResult.updatedIssue,
      fine: transactionResult.fine,
      nextReservation: nextReservation ? {
        reservedFor: nextReservation.user.name,
        memberId: nextReservation.user.memberId,
      } : null,
    });
  } catch (error: any) {
    console.error('Return book error:', error);
    res.status(500).json({ success: false, error: 'Failed to return book copy.' });
  }
});

/**
 * POST /api/circulation/renew
 * Extend due date by 14 days (max 3 renewals allowed)
 */
router.post('/renew', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { issueRecordId } = req.body;

    if (!issueRecordId) {
      res.status(400).json({ success: false, error: 'Issue record ID is required.' });
      return;
    }

    const issue = await prisma.issueRecord.findUnique({
      where: { id: issueRecordId },
      include: {
        copy: { include: { book: true } },
        user: true,
      },
    });

    if (!issue) {
      res.status(404).json({ success: false, error: 'Loan record not found.' });
      return;
    }

    // Check permission: Student/Faculty can only renew their own loans, Librarian/Admin can renew any
    if (['STUDENT', 'FACULTY'].includes(req.user!.role) && issue.userId !== req.user!.id) {
      res.status(403).json({ success: false, error: 'You are not authorized to renew another member’s loan.' });
      return;
    }

    if (issue.status !== 'ACTIVE') {
      res.status(400).json({ success: false, error: `Cannot renew book. Loan status is '${issue.status}'.` });
      return;
    }

    if (issue.renewCount >= 3) {
      res.status(400).json({ success: false, error: 'Maximum renewal limit (3 renewals) reached for this loan.' });
      return;
    }

    // Check if someone else has placed a waitlist reservation for this book
    const waitlistCount = await prisma.reservation.count({
      where: {
        bookId: issue.copy.bookId,
        status: 'PENDING',
        userId: { not: issue.userId },
      },
    });

    if (waitlistCount > 0) {
      res.status(400).json({
        success: false,
        error: 'Renewal unavailable: Other members are currently waiting in the reservation queue for this title.',
      });
      return;
    }

    // Calculate new due date (extend 14 days from current due date or today, whichever is later)
    const currentDue = new Date(issue.dueDate);
    const baseDate = currentDue > new Date() ? currentDue : new Date();
    const newDueDate = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const updatedIssue = await prisma.issueRecord.update({
      where: { id: issue.id },
      data: {
        dueDate: newDueDate,
        renewCount: { increment: 1 },
      },
      include: {
        copy: { include: { book: true } },
      },
    });

    await AuditService.logAction({
      userId: req.user?.id,
      action: 'BOOK_RENEW',
      details: {
        issueRecordId: issue.id,
        bookTitle: issue.copy.book.title,
        renewCount: updatedIssue.renewCount,
        newDueDate: newDueDate.toISOString(),
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Book loan extended until ${newDueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (Renewals: ${updatedIssue.renewCount}/3).`,
      issueRecord: updatedIssue,
    });
  } catch (error: any) {
    console.error('Renew loan error:', error);
    res.status(500).json({ success: false, error: 'Failed to renew book loan.' });
  }
});

/**
 * POST /api/circulation/reserve
 * Reserve a book / join waitlist with priority score calculation
 */
router.post('/reserve', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookId, userId } = req.body;
    const targetUserId = (['LIBRARIAN', 'ADMIN'].includes(req.user!.role) && userId) ? userId : req.user!.id;

    if (!bookId) {
      res.status(400).json({ success: false, error: 'Book ID is required.' });
      return;
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        copies: true,
      },
    });

    if (!book) {
      res.status(404).json({ success: false, error: 'Book not found.' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    // Check if user already has an active reservation
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        bookId,
        userId: targetUserId,
        status: 'PENDING',
      },
    });

    if (existingReservation) {
      res.status(400).json({
        success: false,
        error: `You already have an active reservation (Queue position #${existingReservation.queuePosition}) for this book.`,
      });
      return;
    }

    // Calculate queue position
    const currentReservationsCount = await prisma.reservation.count({
      where: {
        bookId,
        status: 'PENDING',
      },
    });
    const queuePosition = currentReservationsCount + 1;

    // Calculate priority score:
    // Faculty: base 2.5
    // Final year student (sem >= 7): base 1.8
    // High streak bonus: streak * 0.05
    let priorityScore = 1.0;
    if (targetUser.role === 'FACULTY') {
      priorityScore = 2.5;
    } else if (targetUser.semester && targetUser.semester >= 6) {
      priorityScore = 1.6;
    }
    if (targetUser.readingStreak > 0) {
      priorityScore += Math.min(1.0, targetUser.readingStreak * 0.05);
    }

    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days hold

    const reservation = await prisma.reservation.create({
      data: {
        bookId,
        userId: targetUserId,
        queuePosition,
        priorityScore: parseFloat(priorityScore.toFixed(2)),
        expiryDate,
        status: 'PENDING',
      },
      include: {
        book: true,
      },
    });

    await AuditService.logAction({
      userId: req.user?.id,
      action: 'BOOK_RESERVE',
      details: {
        reservationId: reservation.id,
        bookTitle: book.title,
        queuePosition,
        priorityScore,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Reservation placed! You are #${queuePosition} in the waitlist for "${book.title}".`,
      reservation,
    });
  } catch (error: any) {
    console.error('Reserve book error:', error);
    res.status(500).json({ success: false, error: 'Failed to reserve book.' });
  }
});

/**
 * GET /api/circulation/active-issues
 * Get active loans with filters (userId, search, overdue)
 */
router.get('/active-issues', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isStaff = ['LIBRARIAN', 'ADMIN'].includes(req.user!.role);
    const userIdFilter = isStaff ? (req.query.userId as string) : req.user!.id;
    const statusFilter = (req.query.status as string) || 'ACTIVE';
    const search = (req.query.search as string || '').trim();

    const where: any = {};

    if (userIdFilter) {
      where.userId = userIdFilter;
    }

    if (statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (search) {
      where.OR = [
        { copy: { barcode: { contains: search } } },
        { copy: { book: { title: { contains: search } } } },
        { copy: { book: { author: { contains: search } } } },
        { user: { name: { contains: search } } },
        { user: { memberId: { contains: search } } },
      ];
    }

    const issues = await prisma.issueRecord.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        copy: {
          include: {
            book: true,
          },
        },
        user: {
          select: {
            id: true,
            memberId: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
        fines: true,
      },
    });

    const now = new Date();
    const formattedIssues = issues.map((item) => {
      const dueDate = new Date(item.dueDate);
      const isOverdue = item.status === 'ACTIVE' && dueDate < now;
      const diffMs = dueDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        ...item,
        isOverdue,
        daysRemaining,
      };
    });

    res.json({
      success: true,
      issues: formattedIssues,
      totalCount: formattedIssues.length,
      overdueCount: formattedIssues.filter((i) => i.isOverdue).length,
    });
  } catch (error: any) {
    console.error('Fetch active issues error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve active issues.' });
  }
});

/**
 * GET /api/circulation/reservations
 * Get reservations list (userId, bookId, status)
 */
router.get('/reservations', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isStaff = ['LIBRARIAN', 'ADMIN'].includes(req.user!.role);
    const userIdFilter = isStaff ? (req.query.userId as string) : req.user!.id;
    const bookIdFilter = req.query.bookId as string;
    const statusFilter = (req.query.status as string) || 'PENDING';

    const where: any = {};

    if (userIdFilter) {
      where.userId = userIdFilter;
    }

    if (bookIdFilter) {
      where.bookId = bookIdFilter;
    }

    if (statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: [
        { priorityScore: 'desc' },
        { reservedDate: 'asc' },
      ],
      include: {
        book: {
          include: {
            copies: {
              select: { status: true, barcode: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            memberId: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
    });

    res.json({
      success: true,
      reservations,
      totalCount: reservations.length,
    });
  } catch (error: any) {
    console.error('Fetch reservations error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve reservations.' });
  }
});

/**
 * DELETE /api/circulation/reservations/:id/cancel
 * Cancel a pending reservation
 */
router.post('/reservations/:id/cancel', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      res.status(404).json({ success: false, error: 'Reservation not found.' });
      return;
    }

    if (['STUDENT', 'FACULTY'].includes(req.user!.role) && reservation.userId !== req.user!.id) {
      res.status(403).json({ success: false, error: 'Unauthorized to cancel this reservation.' });
      return;
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json({
      success: true,
      message: 'Reservation cancelled successfully.',
      reservation: updated,
    });
  } catch (error: any) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel reservation.' });
  }
});

export default router;
