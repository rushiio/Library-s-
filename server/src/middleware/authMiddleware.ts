import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    memberId: string;
    name: string;
    email: string;
    role: string;
    department?: string | null;
    semester?: number | null;
    status: string;
    mustChangePassword: boolean;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only access_token cookie first
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }
    // 2. Fallback to Authorization: Bearer <token> header for REST/mobile/PWA
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required. Please login.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'libra-ai-super-secure-secret-key-2026';
    const decoded = jwt.verify(token, secret) as { id: string; role: string; memberId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        memberId: true,
        name: true,
        email: true,
        role: true,
        department: true,
        semester: true,
        status: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive || user.status === 'INACTIVE' || user.status === 'REJECTED') {
      res.status(401).json({ success: false, error: 'User account is inactive or not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized. Please login.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Role '${req.user.role}' lacks permission for this resource.`,
      });
      return;
    }

    next();
  };
};
