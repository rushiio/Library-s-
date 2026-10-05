import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Checking and initializing institutional accounts...');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@libra.edu').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Secure2026';

  // Cost factor 12 for strong cryptographic password hashing
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  // Check if admin already exists by email or memberId
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { memberId: 'ADM001' },
      ],
    },
  });

  if (existingAdmin) {
    const updated = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        mustChangePassword: false,
        isEmailVerified: true,
        status: 'ACTIVE',
        isActive: true,
      },
    });
    console.log(`✅ Default Administrator synchronized: ${updated.email} (${updated.memberId})`);
  } else {
    const created = await prisma.user.create({
      data: {
        memberId: 'ADM001',
        name: 'System Administrator',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        department: 'Central Administration',
        mustChangePassword: false,
        isEmailVerified: true,
        status: 'ACTIVE',
        isActive: true,
      },
    });
    console.log(`✅ Default Administrator created: ${created.email} (${created.memberId})`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
