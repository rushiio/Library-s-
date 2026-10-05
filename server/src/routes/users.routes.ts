import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware.js';
import { AuditService } from '../services/auditService.js';

const router = Router();

/**
 * GET /api/users/leaderboard
 * Top reading streaks and points
 */
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const department = req.query.department as string;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const where: any = {
      isActive: true,
      role: 'STUDENT',
    };

    if (department && department !== 'ALL') {
      where.department = department;
    }

    const leaders = await prisma.user.findMany({
      where,
      orderBy: [
        { totalPoints: 'desc' },
        { readingStreak: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        memberId: true,
        name: true,
        department: true,
        semester: true,
        avatarUrl: true,
        readingStreak: true,
        totalPoints: true,
        badges: true,
        _count: {
          select: {
            issues: { where: { status: 'RETURNED' } },
            reviews: true,
          },
        },
      },
    });

    const formattedLeaders = leaders.map((leader, index) => {
      let parsedBadges: string[] = [];
      try {
        parsedBadges = leader.badges ? JSON.parse(leader.badges) : [];
      } catch (e) {
        parsedBadges = [];
      }

      return {
        rank: index + 1,
        id: leader.id,
        memberId: leader.memberId,
        name: leader.name,
        department: leader.department,
        semester: leader.semester,
        avatarUrl: leader.avatarUrl,
        readingStreak: leader.readingStreak,
        totalPoints: leader.totalPoints,
        badges: parsedBadges,
        booksReadCount: leader._count.issues,
        reviewsCount: leader._count.reviews,
      };
    });

    res.json({
      success: true,
      leaderboard: formattedLeaders,
    });
  } catch (error: any) {
    console.error('Fetch leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve leaderboard.' });
  }
});

/**
 * GET /api/users
 * Search and filter users with pagination (Admin/Librarian lookup)
 */
router.get('/', authenticate, authorize(['ADMIN', 'LIBRARIAN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.q as string || req.query.search as string || '').trim();
    const role = (req.query.role as string || '').trim();
    const status = (req.query.status as string || '').trim();
    const department = (req.query.department as string || '').trim();
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { memberId: { contains: search } },
        { phone: { contains: search } },
        { enrollmentNumber: { contains: search } },
      ];
    }

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (department && department !== 'ALL') {
      where.department = department;
    }

    const [totalUsers, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          memberId: true,
          name: true,
          email: true,
          role: true,
          department: true,
          semester: true,
          year: true,
          enrollmentNumber: true,
          phone: true,
          avatarUrl: true,
          readingStreak: true,
          totalPoints: true,
          status: true,
          isActive: true,
          isEmailVerified: true,
          mustChangePassword: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              issues: { where: { status: 'ACTIVE' } },
              reservations: { where: { status: 'PENDING' } },
              fines: { where: { status: 'UNPAID' } },
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve users list.' });
  }
});

/**
 * GET /api/users/:id
 * Get single user details
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (['STUDENT', 'FACULTY'].includes(req.user!.role) && req.user!.id !== id) {
      res.status(403).json({ success: false, error: 'Forbidden. You may only view your own profile.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        issues: {
          orderBy: { issuedDate: 'desc' },
          take: 20,
          include: {
            copy: {
              include: { book: true },
            },
          },
        },
        reservations: {
          orderBy: { reservedDate: 'desc' },
          take: 10,
          include: { book: true },
        },
        fines: {
          orderBy: { createdAt: 'desc' },
          include: {
            issueRecord: {
              include: { copy: { include: { book: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const { passwordHash: _, ...userSafe } = user;
    res.json({ success: true, user: userSafe });
  } catch (error: any) {
    console.error('Fetch user detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve user details.' });
  }
});

/**
 * POST /api/users
 * Admin creates a new user account with assigned role (STUDENT, FACULTY, LIBRARIAN, ADMIN)
 */
router.post('/', authenticate, authorize(['ADMIN', 'LIBRARIAN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let { name, email, role = 'STUDENT', department, phone, enrollmentNumber, temporaryPassword, mustChangePassword = true } = req.body;

    if (!name || !email) {
      res.status(400).json({ success: false, error: 'Name and email are required.' });
      return;
    }

    // Only ADMIN can create LIBRARIAN or ADMIN accounts
    if (['ADMIN', 'LIBRARIAN'].includes(role) && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only Administrators can provision staff accounts.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      res.status(400).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    // Generate Member ID based on role
    const prefix = role === 'FACULTY' ? 'FAC' : role === 'LIBRARIAN' ? 'LIB' : role === 'ADMIN' ? 'ADM' : 'STU';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const memberId = `${prefix}${randomSuffix}`;

    // Use temporary password or generate a secure 10-char password
    const pwd = temporaryPassword && temporaryPassword.trim() ? temporaryPassword.trim() : crypto.randomBytes(6).toString('hex') + 'A1!';
    const passwordHash = await bcrypt.hash(pwd, 12);

    const newUser = await prisma.user.create({
      data: {
        memberId,
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: role.toUpperCase(),
        department: department || null,
        phone: phone ? phone.trim() : null,
        enrollmentNumber: enrollmentNumber ? enrollmentNumber.trim().toUpperCase() : null,
        mustChangePassword: Boolean(mustChangePassword),
        status: 'ACTIVE',
        isActive: true,
        isEmailVerified: true,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(memberId)}`,
      },
    });

    await AuditService.logAction({
      userId: req.user?.id,
      action: 'ADMIN_USER_CREATE',
      details: {
        targetUserId: newUser.id,
        memberId: newUser.memberId,
        email: newUser.email,
        role: newUser.role,
      },
      ipAddress: req.ip,
    });

    const { passwordHash: _, ...userSafe } = newUser;

    res.status(201).json({
      success: true,
      message: `Account created for ${newUser.name} (${newUser.role}).`,
      generatedPassword: temporaryPassword ? undefined : pwd,
      user: userSafe,
    });
  } catch (error: any) {
    console.error('Admin create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user account.' });
  }
});

/**
 * PUT /api/users/:id
 * Admin updates user details, role, status
 */
router.put('/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const { name, email, role, department, phone, enrollmentNumber, status, isActive, mustChangePassword } = req.body;

    // Guard 1: Cannot demote the last remaining ADMIN
    if (targetUser.role === 'ADMIN' && role && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
      if (adminCount <= 1) {
        res.status(400).json({ success: false, error: 'Cannot demote the last active Administrator.' });
        return;
      }
    }

    // Guard 2: Cannot deactivate the currently logged in admin if they are the last admin
    if (targetUser.id === req.user!.id && (status === 'INACTIVE' || isActive === false)) {
      res.status(400).json({ success: false, error: 'You cannot deactivate your own administrative account.' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (role !== undefined) updateData.role = role.toUpperCase();
    if (department !== undefined) updateData.department = department;
    if (phone !== undefined) updateData.phone = phone;
    if (enrollmentNumber !== undefined) updateData.enrollmentNumber = enrollmentNumber;
    if (status !== undefined) {
      updateData.status = status;
      updateData.isActive = status === 'ACTIVE';
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
      updateData.status = isActive ? 'ACTIVE' : 'INACTIVE';
    }
    if (mustChangePassword !== undefined) updateData.mustChangePassword = Boolean(mustChangePassword);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await AuditService.logAction({
      userId: req.user?.id,
      action: 'ADMIN_USER_UPDATE',
      details: {
        targetUserId: updatedUser.id,
        memberId: updatedUser.memberId,
        updates: Object.keys(updateData),
      },
      ipAddress: req.ip,
    });

    const { passwordHash: _, ...userSafe } = updatedUser;
    res.json({
      success: true,
      message: `User ${updatedUser.name} updated successfully.`,
      user: userSafe,
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user profile.' });
  }
});

/**
 * POST /api/users/:id/reset-password
 * Admin resets a user's password and sets mustChangePassword = true
 */
router.post('/:id/reset-password', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const tempPassword = newPassword && newPassword.trim() ? newPassword.trim() : crypto.randomBytes(6).toString('hex') + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    await AuditService.logAction({
      userId: req.user?.id,
      action: 'ADMIN_PASSWORD_RESET',
      details: { targetUserId: user.id, memberId: user.memberId },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Password reset successfully for ${user.name}. They will be required to set a new password on login.`,
      temporaryPassword: newPassword ? undefined : tempPassword,
    });
  } catch (error: any) {
    console.error('Reset user password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset user password.' });
  }
});

/**
 * DELETE /api/users/:id
 * Admin deletes a user account with safeguards
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Guard 1: Cannot delete self
    if (id === req.user!.id) {
      res.status(400).json({ success: false, error: 'You cannot delete your own administrative account.' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    // Guard 2: Cannot delete the last remaining ADMIN
    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        res.status(400).json({ success: false, error: 'Cannot delete the only remaining Administrator in the system.' });
        return;
      }
    }

    // Check if user has active book loans
    const activeLoans = await prisma.issueRecord.count({
      where: { userId: id, status: 'ACTIVE' },
    });

    if (activeLoans > 0) {
      res.status(400).json({
        success: false,
        error: `Cannot delete member with ${activeLoans} active book checkout(s). Please return books first.`,
      });
      return;
    }

    await prisma.user.delete({ where: { id } });

    await AuditService.logAction({
      userId: req.user?.id,
      action: 'ADMIN_USER_DELETE',
      details: {
        deletedUserId: targetUser.id,
        deletedMemberId: targetUser.memberId,
        deletedEmail: targetUser.email,
        deletedRole: targetUser.role,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Account for ${targetUser.name} (${targetUser.memberId}) deleted permanently.`,
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user account.' });
  }
});

export default router;
