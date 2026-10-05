import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/authMiddleware.js';
import { AuditService } from '../services/auditService.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'libra-ai-super-secure-secret-key-2026';

// In-Memory Rate Limiter for Login/Signup attempts
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  record.count += 1;
  return true;
};

// Strong Password Validation Helper
const isStrongPassword = (pwd: string): { valid: boolean; error?: string } => {
  if (!pwd || pwd.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(pwd)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(pwd)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(pwd)) {
    return { valid: false, error: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*...).' };
  }
  return { valid: true };
};

/**
 * POST /api/auth/login
 * Single, secure login endpoint for all roles.
 * Returns generic error "Invalid email or password" on all authentication failures.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = req.ip || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      res.status(429).json({
        success: false,
        error: 'Too many failed attempts. Please try again in 15 minutes.',
      });
      return;
    }

    const { email, identifier, password, rememberMe } = req.body;
    const loginIdentifier = (email || identifier || '').trim().toLowerCase();

    if (!loginIdentifier || !password) {
      res.status(400).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { memberId: loginIdentifier.toUpperCase() },
        ],
      },
    });

    // Constant-time check mitigation: hash comparison even if user not found to prevent timing attacks
    if (!user) {
      await bcrypt.compare(password, '$2a$12$e8Yh9f6yN4m3D3h5i2bY9e8Yh9f6yN4m3D3h5i2bY9e8Yh9f6yN4m');
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    // Check account status
    if (user.status === 'PENDING_APPROVAL') {
      res.status(403).json({
        success: false,
        error: 'Your student registration is pending administrator approval. Please check back shortly.',
      });
      return;
    }

    if (!user.isActive || user.status === 'INACTIVE' || user.status === 'REJECTED') {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    // Clear rate limit on success
    loginAttempts.delete(ip);

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { id: user.id, role: user.role, memberId: user.memberId },
      JWT_SECRET,
      { expiresIn: expiresIn as any }
    );

    await AuditService.logAction({
      userId: user.id,
      action: 'USER_LOGIN',
      details: { memberId: user.memberId, role: user.role },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        memberId: user.memberId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        year: user.year,
        enrollmentNumber: user.enrollmentNumber,
        avatarUrl: user.avatarUrl,
        readingStreak: user.readingStreak,
        totalPoints: user.totalPoints,
        mustChangePassword: user.mustChangePassword,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal authentication error.' });
  }
});

/**
 * POST /api/auth/signup
 * Self-registration for new students.
 * Server strictly forces role = 'STUDENT'.
 */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      enrollmentNumber,
      department,
      year,
      password,
      confirmPassword,
    } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ success: false, error: 'Passwords do not match.' });
      return;
    }

    const pwdValidation = isStrongPassword(password);
    if (!pwdValidation.valid) {
      res.status(400).json({ success: false, error: pwdValidation.error });
      return;
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }

    // Check duplicate enrollmentNumber if provided
    if (enrollmentNumber && enrollmentNumber.trim()) {
      const existingEnroll = await prisma.user.findFirst({
        where: { enrollmentNumber: enrollmentNumber.trim().toUpperCase() },
      });
      if (existingEnroll) {
        res.status(400).json({ success: false, error: 'An account with this enrollment number already exists.' });
        return;
      }
    }

    // Auto-generate student member ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const memberId = `STU${randomSuffix}`;

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user (ENFORCED: role is ALWAYS STUDENT)
    const newUser = await prisma.user.create({
      data: {
        memberId,
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'STUDENT', // Server-side enforced
        phone: phone ? phone.trim() : null,
        enrollmentNumber: enrollmentNumber ? enrollmentNumber.trim().toUpperCase() : null,
        department: department || 'General Engineering',
        year: year ? parseInt(year, 10) : 1,
        status: 'ACTIVE',
        isActive: true,
        isEmailVerified: true,
        mustChangePassword: false,
        verificationToken,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(memberId)}`,
        badges: JSON.stringify(['Student Scholar']),
      },
    });

    await AuditService.logAction({
      userId: newUser.id,
      action: 'STUDENT_SIGNUP',
      details: { memberId: newUser.memberId, email: newUser.email },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now log in with your email and password.',
      user: {
        id: newUser.id,
        memberId: newUser.memberId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, error: 'Failed to process student registration.' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Send secure password reset link / generate token
 */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (cleanEmail) {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetExpires,
          },
        });

        await AuditService.logAction({
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          details: { email: user.email },
          ipAddress: req.ip,
        });
      }
    }

    // Generic success response to prevent user enumeration
    res.json({
      success: true,
      message: 'If that email address is registered, password reset instructions have been generated.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Failed to process password reset request.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ success: false, error: 'Token and new password are required.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ success: false, error: 'Passwords do not match.' });
      return;
    }

    const pwdCheck = isStrongPassword(newPassword);
    if (!pwdCheck.valid) {
      res.status(400).json({ success: false, error: pwdCheck.error });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ success: false, error: 'Password reset link is invalid or has expired.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await AuditService.logAction({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      details: { email: user.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Password reset successfully. You may now log in with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
});

/**
 * POST /api/auth/change-password
 * Authenticated password change (also used for mandatory first-login password change)
 */
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user!.id;

    if (!newPassword || !confirmPassword) {
      res.status(400).json({ success: false, error: 'New password and confirmation are required.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ success: false, error: 'Passwords do not match.' });
      return;
    }

    const pwdCheck = isStrongPassword(newPassword);
    if (!pwdCheck.valid) {
      res.status(400).json({ success: false, error: pwdCheck.error });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    // If not forced first-login change, verify current password
    if (!user.mustChangePassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, error: 'Current password is required.' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, error: 'Incorrect current password.' });
        return;
      }
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    await AuditService.logAction({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      details: { email: user.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Password updated successfully!',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to update password.' });
  }
});

/**
 * GET /api/auth/me
 * Get authenticated user profile
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
        badges: true,
        status: true,
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
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: {
        ...user,
        badges: user.badges ? JSON.parse(user.badges) : [],
        activeIssuesCount: user._count.issues,
        pendingReservationsCount: user._count.reservations,
        unpaidFinesCount: user._count.fines,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
});

export default router;
