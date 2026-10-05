import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import booksRoutes from './routes/books.routes.js';
import importRoutes from './routes/import.routes.js';
import circulationRoutes from './routes/circulation.routes.js';
import finesRoutes from './routes/fines.routes.js';
import usersRoutes from './routes/users.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import facultyRoutes from './routes/faculty.routes.js';
import aiRoutes from './routes/ai.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import studentRoutes from './routes/student.routes.js';
import { AIService } from './services/aiService.js';
import { prisma } from './config/db.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible API usage & cross-origin embedding
  crossOriginEmbedderPolicy: false,
}));

app.use(cookieParser());

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health / Status Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    aiConfigured: AIService.isConfigured(),
    service: 'LibraAI Enterprise Backend Core',
  });
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/import', importRoutes);
app.use('/api/circulation', circulationRoutes);
app.use('/api/fines', finesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/student', studentRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Auto-seed Default Admin on Boot from Environment Variables
const initAdminAccount = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@libra.edu').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Secure2026';

    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { memberId: 'ADM001' },
        ],
      },
    });

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          memberId: 'ADM001',
          name: 'System Administrator',
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          department: 'Central Administration',
          mustChangePassword: false,
          status: 'ACTIVE',
          isActive: true,
          isEmailVerified: true,
        },
      });
      console.log(`🔐 Default Administrator provisioned safely from environment (${adminEmail}).`);
    } else {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          mustChangePassword: false,
          status: 'ACTIVE',
          isActive: true,
        },
      });
      console.log(`🔐 Default Administrator credentials updated to ${adminEmail}.`);
    }
  } catch (err) {
    console.error('Admin auto-init check:', err);
  }
};

app.listen(PORT, async () => {
  console.log(`🚀 LibraAI Server running on port ${PORT}`);
  console.log(`📡 AI Service Configured: ${AIService.isConfigured() ? 'YES (OpenRouter)' : 'OFFLINE (Fallback Mode)'}`);
  await initAdminAccount();
});

export default app;
