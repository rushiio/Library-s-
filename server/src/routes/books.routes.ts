import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware.js';
import { AuditService } from '../services/auditService.js';
import { AIService } from '../services/aiService.js';

const router = Router();

/**
 * GET /api/books/landing-data
 * Public landing stats, new arrivals, popular books, and categories for guests
 */
router.get('/landing-data', async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    // Compute library open status: Mon-Fri 8:00 AM - 8:00 PM, Sat 9:00 AM - 4:00 PM
    const day = now.getDay(); // 0 Sun, 1 Mon ... 6 Sat
    const hour = now.getHours();
    let isLibraryOpen = false;
    let timingNote = 'Closed today (Sunday)';

    if (day >= 1 && day <= 5) {
      if (hour >= 8 && hour < 20) {
        isLibraryOpen = true;
        timingNote = 'Open Today: 8:00 AM – 8:00 PM';
      } else {
        isLibraryOpen = false;
        timingNote = 'Closed now (Opens at 8:00 AM)';
      }
    } else if (day === 6) {
      if (hour >= 9 && hour < 16) {
        isLibraryOpen = true;
        timingNote = 'Open Today: 9:00 AM – 4:00 PM';
      } else {
        isLibraryOpen = false;
        timingNote = 'Closed now (Opens Saturday 9:00 AM)';
      }
    }

    const [
      totalTitles,
      totalCopies,
      availableCopies,
      departmentGroups,
      newArrivalsRaw,
      recentIssues,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.count(),
      prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
      prisma.book.groupBy({
        by: ['department'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.book.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          copies: {
            where: { status: 'AVAILABLE' },
            select: { id: true },
          },
          _count: {
            select: { copies: true, reviews: true },
          },
        },
      }),
      prisma.issueRecord.findMany({
        take: 100,
        orderBy: { issuedDate: 'desc' },
        include: {
          copy: {
            include: { book: true },
          },
        },
      }),
    ]);

    // Format New Arrivals
    const newArrivals = newArrivalsRaw.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      department: b.department,
      year: b.year,
      coverUrl: b.coverUrl,
      copiesCount: b._count.copies,
      availableCopiesCount: b.copies.length,
    }));

    // Aggregate Popular Books from actual issue records
    const issueCountMap = new Map<string, number>();
    for (const r of recentIssues) {
      if (r.copy?.bookId) {
        issueCountMap.set(r.copy.bookId, (issueCountMap.get(r.copy.bookId) || 0) + 1);
      }
    }

    let popularBooks: any[] = [];
    if (issueCountMap.size > 0) {
      const topBookIds = Array.from(issueCountMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id]) => id);

      const popBooksRaw = await prisma.book.findMany({
        where: { id: { in: topBookIds } },
        include: {
          copies: {
            where: { status: 'AVAILABLE' },
            select: { id: true },
          },
          _count: {
            select: { copies: true, reviews: true },
          },
        },
      });

      popularBooks = popBooksRaw.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        department: b.department,
        year: b.year,
        coverUrl: b.coverUrl,
        copiesCount: b._count.copies,
        availableCopiesCount: b.copies.length,
        borrowsCount: issueCountMap.get(b.id) || 0,
      }));
    } else {
      // Fallback to highest copy count books
      const popFallback = await prisma.book.findMany({
        take: 8,
        orderBy: { title: 'asc' },
        include: {
          copies: {
            where: { status: 'AVAILABLE' },
            select: { id: true },
          },
          _count: {
            select: { copies: true, reviews: true },
          },
        },
      });

      popularBooks = popFallback.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        department: b.department,
        year: b.year,
        coverUrl: b.coverUrl,
        copiesCount: b._count.copies,
        availableCopiesCount: b.copies.length,
      }));
    }

    // Format Categories
    const categories = departmentGroups.map((g) => ({
      name: g.department,
      displayName: g.department.replace(' Engineering', ''),
      count: g._count.id,
    }));

    res.json({
      success: true,
      stats: {
        totalTitles,
        totalCopies,
        availableCopies,
        totalCategories: departmentGroups.length,
        isLibraryOpen,
        timingNote,
      },
      newArrivals,
      popularThisMonth: popularBooks,
      categories,
    });
  } catch (error: any) {
    console.error('Fetch landing data error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve landing data.' });
  }
});

/**
 * Get paginated catalog with search, department, and availability filters
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 24;
    const search = (req.query.q as string || '').trim();
    const department = (req.query.department as string || '').trim();
    const difficulty = (req.query.difficulty as string || '').trim();
    const language = (req.query.language as string || '').trim();
    const availability = (req.query.availability as string || '').trim(); // 'available', 'all'
    const sort = (req.query.sort as string || 'title_asc');

    const skip = (page - 1) * limit;

    // Build Prisma query where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } },
        { publisher: { contains: search } },
        { department: { contains: search } },
      ];
    }

    if (department && department !== 'ALL') {
      where.department = department;
    }

    if (difficulty && difficulty !== 'ALL') {
      where.difficultyLevel = difficulty;
    }

    if (language && language !== 'ALL') {
      where.language = language;
    }

    if (availability === 'available') {
      where.copies = {
        some: {
          status: 'AVAILABLE',
        },
      };
    }

    // Determine order
    let orderBy: any = { title: 'asc' };
    if (sort === 'title_desc') orderBy = { title: 'desc' };
    else if (sort === 'year_desc') orderBy = { year: 'desc' };
    else if (sort === 'year_asc') orderBy = { year: 'asc' };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };

    const [totalBooks, books] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              copies: true,
              reviews: true,
            },
          },
          copies: {
            where: { status: 'AVAILABLE' },
            select: { id: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
      }),
    ]);

    const formattedBooks = books.map((b) => {
      const avgRating =
        b.reviews.length > 0
          ? Number((b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length).toFixed(1))
          : 4.5; // default fallback rating

      return {
        id: b.id,
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        publisher: b.publisher,
        edition: b.edition,
        year: b.year,
        department: b.department,
        resourceType: b.resourceType,
        language: b.language,
        description: b.description,
        coverUrl: b.coverUrl,
        difficultyLevel: b.difficultyLevel,
        tags: b.tags ? JSON.parse(b.tags) : [],
        copiesCount: b._count.copies,
        availableCopiesCount: b.copies.length,
        averageRating: avgRating,
        reviewsCount: b._count.reviews,
      };
    });

    res.json({
      success: true,
      books: formattedBooks,
      pagination: {
        page,
        limit,
        totalBooks,
        totalPages: Math.ceil(totalBooks / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch books error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve books catalog.' });
  }
});

/**
 * Get distinct departments with book counts
 */
router.get('/departments', async (req: Request, res: Response): Promise<void> => {
  try {
    const groups = await prisma.book.groupBy({
      by: ['department'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const totalCount = await prisma.book.count();

    const departments = groups.map((g) => ({
      name: g.department,
      count: g._count.id,
    }));

    res.json({
      success: true,
      totalCount,
      departments,
    });
  } catch (error: any) {
    console.error('Fetch departments error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve departments list.' });
  }
});

/**
 * Get single book detail by ID with all copy records and reviews
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: {
          orderBy: { accessionNumber: 'asc' },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reservations: {
          where: { status: 'PENDING' },
          select: { id: true },
        },
      },
    }) as any;

    if (!book) {
      res.status(404).json({ success: false, error: 'Book not found in library catalog.' });
      return;
    }

    const availableCopies = (book.copies || []).filter((c: any) => c.status === 'AVAILABLE');
    const avgRating =
      book.reviews && book.reviews.length > 0
        ? Number((book.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / book.reviews.length).toFixed(1))
        : 4.5;

    res.json({
      success: true,
      book: {
        ...book,
        tags: book.tags ? JSON.parse(book.tags) : [],
        copiesCount: (book.copies || []).length,
        availableCopiesCount: availableCopies.length,
        averageRating: avgRating,
        reviewsCount: (book.reviews || []).length,
        pendingWaitlistCount: (book.reservations || []).length,
      },
    });
  } catch (error: any) {
    console.error('Get book error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve book details.' });
  }
});

/**
 * Submit a Book Review with sentiment detection
 */
router.post('/:id/reviews', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookId = req.params.id as string;
    const { rating, comment } = req.body;
    const userId = req.user!.id;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: 'Rating must be between 1 and 5 stars.' });
      return;
    }

    // Heuristic sentiment analysis
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (rating >= 4) sentiment = 'positive';
    else if (rating <= 2) sentiment = 'negative';

    const review = await prisma.bookReview.create({
      data: {
        bookId,
        userId,
        rating: parseInt(rating, 10),
        comment: comment ? String(comment).trim() : null,
        sentiment,
      },
    });

    // Award student points for review
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: 15 },
      },
    });

    res.json({ success: true, review });
  } catch (error: any) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit review.' });
  }
});

export default router;
