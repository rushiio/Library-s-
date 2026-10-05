import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware.js';
import { AuditService } from '../services/auditService.js';

const router = Router();

/**
 * GET /api/fines
 * List fines with filters (userId, status, search, pagination)
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isStaff = ['LIBRARIAN', 'ADMIN'].includes(req.user!.role);
    const userIdFilter = isStaff ? (req.query.userId as string) : req.user!.id;
    const statusFilter = (req.query.status as string) || 'ALL';
    const search = (req.query.search as string || '').trim();
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userIdFilter) {
      where.userId = userIdFilter;
    }

    if (statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { memberId: { contains: search } } },
        { user: { email: { contains: search } } },
        { issueRecord: { copy: { book: { title: { contains: search } } } } },
        { issueRecord: { copy: { barcode: { contains: search } } } },
      ];
    }

    const [totalFinesCount, fines, sumAggregate] = await Promise.all([
      prisma.fine.count({ where }),
      prisma.fine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          issueRecord: {
            include: {
              copy: {
                include: {
                  book: {
                    select: {
                      id: true,
                      title: true,
                      author: true,
                      coverUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.fine.groupBy({
        by: ['status'],
        _sum: {
          amount: true,
        },
        where: userIdFilter ? { userId: userIdFilter } : {},
      }),
    ]);

    const stats = {
      unpaidTotal: sumAggregate.find((s) => s.status === 'UNPAID')?._sum.amount || 0,
      paidTotal: sumAggregate.find((s) => s.status === 'PAID')?._sum.amount || 0,
      waivedTotal: sumAggregate.find((s) => s.status === 'WAIVED')?._sum.amount || 0,
    };

    res.json({
      success: true,
      fines,
      stats,
      pagination: {
        page,
        limit,
        total: totalFinesCount,
        totalPages: Math.ceil(totalFinesCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch fines error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve fines records.' });
  }
});

/**
 * POST /api/fines/:id/pay
 * Mark a fine as paid
 */
router.post('/:id/pay', authenticate, authorize(['LIBRARIAN', 'ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { paymentMethod, transactionRef } = req.body;

    const fine = await prisma.fine.findUnique({
      where: { id },
      include: {
        user: true,
        issueRecord: {
          include: {
            copy: {
              include: { book: true },
            },
          },
        },
      },
    }) as any;

    if (!fine) {
      res.status(404).json({ success: false, error: 'Fine record not found.' });
      return;
    }

    if (fine.status === 'PAID') {
      res.status(400).json({ success: false, error: 'This fine is already marked as PAID.' });
      return;
    }

    if (fine.status === 'WAIVED') {
      res.status(400).json({ success: false, error: 'This fine was WAIVED and cannot be paid.' });
      return;
    }

    const updatedFine = await prisma.fine.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
      },
    });

    await AuditService.logAction({
      userId: req.user?.id,
      action: 'FINE_PAY',
      details: {
        fineId: fine.id,
        memberId: fine.user?.memberId,
        amount: fine.amount,
        bookTitle: fine.issueRecord?.copy?.book?.title,
        paymentMethod: paymentMethod || 'CASH',
        transactionRef: transactionRef || null,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Fine of ₹${fine.amount} for member ${fine.user?.name} (${fine.user?.memberId}) marked as PAID.`,
      fine: updatedFine,
    });
  } catch (error: any) {
    console.error('Pay fine error:', error);
    res.status(500).json({ success: false, error: 'Failed to process fine payment.' });
  }
});

/**
 * POST /api/fines/:id/waive
 * Waive a fine with reason (Librarian/Admin only)
 */
router.post('/:id/waive', authenticate, authorize(['LIBRARIAN', 'ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { waiverReason } = req.body;

    if (!waiverReason || !waiverReason.trim()) {
      res.status(400).json({ success: false, error: 'A valid reason for fine waiver is required.' });
      return;
    }

    const fine = await prisma.fine.findUnique({
      where: { id },
      include: {
        user: true,
        issueRecord: {
          include: {
            copy: {
              include: { book: true },
            },
          },
        },
      },
    }) as any;

    if (!fine) {
      res.status(404).json({ success: false, error: 'Fine record not found.' });
      return;
    }

    if (fine.status === 'PAID') {
      res.status(400).json({ success: false, error: 'Cannot waive an already PAID fine.' });
      return;
    }

    if (fine.status === 'WAIVED') {
      res.status(400).json({ success: false, error: 'This fine has already been WAIVED.' });
      return;
    }

    const updatedFine = await prisma.fine.update({
      where: { id },
      data: {
        status: 'WAIVED',
        waivedBy: req.user?.id,
        waiverReason: waiverReason.trim(),
      },
    });

    await AuditService.logAction({
      userId: req.user?.id,
      action: 'FINE_WAIVE',
      details: {
        fineId: fine.id,
        memberId: fine.user?.memberId,
        amount: fine.amount,
        waivedBy: req.user?.memberId || req.user?.name,
        waiverReason: waiverReason.trim(),
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Fine of ₹${fine.amount} for member ${fine.user?.name} successfully waived.`,
      fine: updatedFine,
    });
  } catch (error: any) {
    console.error('Waive fine error:', error);
    res.status(500).json({ success: false, error: 'Failed to waive fine.' });
  }
});

export default router;
