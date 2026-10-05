import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware.js';
import { AuditService } from '../services/auditService.js';

const router = Router();

/**
 * GET /api/faculty/lists
 * Get faculty curated reading lists
 */
router.get('/lists', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const facultyId = req.query.facultyId as string;
    const semester = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;
    const department = req.query.department as string;

    const where: any = {};
    if (facultyId) where.facultyId = facultyId;
    if (semester) where.semester = semester;

    const lists = await prisma.facultyList.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            memberId: true,
            department: true,
          },
        },
        items: {
          include: {
            book: {
              include: {
                copies: {
                  select: { status: true },
                },
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      lists,
    });
  } catch (error: any) {
    console.error('Fetch faculty lists error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve faculty reading lists.' });
  }
});

/**
 * POST /api/faculty/lists
 * Create or update a course reading list
 */
router.post('/lists', authenticate, authorize(['FACULTY', 'ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectCode, subjectName, semester, items } = req.body;
    const facultyId = req.user!.id;

    if (!subjectCode || !subjectName || !semester) {
      res.status(400).json({ success: false, error: 'Subject code, subject name, and semester are required.' });
      return;
    }

    // Create faculty list with items
    const list = await prisma.facultyList.create({
      data: {
        facultyId,
        subjectCode: subjectCode.trim().toUpperCase(),
        subjectName: subjectName.trim(),
        semester: parseInt(semester, 10),
        items: {
          create: (items || []).map((item: any) => ({
            bookId: item.bookId,
            isMandatory: item.isMandatory !== undefined ? Boolean(item.isMandatory) : true,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: {
          include: { book: true },
        },
      },
    });

    await AuditService.logAction({
      userId: req.user?.id,
      action: 'FACULTY_LIST_CREATE',
      details: {
        listId: list.id,
        subjectCode: list.subjectCode,
        subjectName: list.subjectName,
        bookCount: (items || []).length,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Course reading list for '${list.subjectCode} - ${list.subjectName}' created successfully.`,
      list,
    });
  } catch (error: any) {
    console.error('Create faculty list error:', error);
    res.status(500).json({ success: false, error: 'Failed to create reading list.' });
  }
});

/**
 * DELETE /api/faculty/lists/:id
 * Delete a reading list
 */
router.delete('/lists/:id', authenticate, authorize(['FACULTY', 'ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const list = await prisma.facultyList.findUnique({
      where: { id },
    });

    if (!list) {
      res.status(404).json({ success: false, error: 'Reading list not found.' });
      return;
    }

    if (req.user!.role !== 'ADMIN' && list.facultyId !== req.user!.id) {
      res.status(403).json({ success: false, error: 'Unauthorized to delete this list.' });
      return;
    }

    await prisma.facultyList.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Reading list deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete faculty list error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete reading list.' });
  }
});

/**
 * POST /api/faculty/recommend
 * Submit book purchase recommendation
 */
router.post('/recommend', authenticate, authorize(['FACULTY', 'ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, author, isbn, publisher, estimatedPrice, reason, courseName } = req.body;

    if (!title || !author) {
      res.status(400).json({ success: false, error: 'Title and author are required.' });
      return;
    }

    await AuditService.logAction({
      userId: req.user?.id,
      action: 'BOOK_PURCHASE_RECOMMENDATION',
      details: {
        title,
        author,
        isbn,
        publisher,
        estimatedPrice,
        courseName,
        reason,
        facultyMember: req.user?.name,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Purchase recommendation for "${title}" by ${author} submitted to Library Acquisition Committee.`,
    });
  } catch (error: any) {
    console.error('Recommend book error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit recommendation.' });
  }
});

/**
 * GET /api/faculty/engagement
 * Student engagement metrics with course textbooks
 */
router.get('/engagement', authenticate, authorize(['FACULTY', 'ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const facultyId = req.user!.id;
    const lists = await prisma.facultyList.findMany({
      where: req.user!.role === 'ADMIN' ? {} : { facultyId },
      include: {
        items: {
          include: {
            book: {
              include: {
                copies: {
                  include: {
                    issues: {
                      take: 50,
                      orderBy: { issuedDate: 'desc' },
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            memberId: true,
                            department: true,
                            semester: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const engagementData = lists.map((list) => {
      let totalAssignedBooks = list.items.length;
      let totalIssues = 0;
      let uniqueStudents = new Set<string>();

      list.items.forEach((item) => {
        item.book.copies.forEach((copy) => {
          copy.issues.forEach((issue) => {
            totalIssues += 1;
            uniqueStudents.add(issue.userId);
          });
        });
      });

      return {
        listId: list.id,
        subjectCode: list.subjectCode,
        subjectName: list.subjectName,
        semester: list.semester,
        totalBooks: totalAssignedBooks,
        totalBorrowCount: totalIssues,
        activeStudentReaders: uniqueStudents.size,
      };
    });

    res.json({
      success: true,
      engagement: engagementData,
    });
  } catch (error: any) {
    console.error('Fetch faculty engagement error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve engagement statistics.' });
  }
});

export default router;
