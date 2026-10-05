"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Hash password for demo accounts
    const passwordHash = await bcryptjs_1.default.hash('Password@123', 10);
    // 1. Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@libra.ai' },
        update: {},
        create: {
            memberId: 'ADM001',
            name: 'Dr. Rajesh Sharma',
            email: 'admin@libra.ai',
            passwordHash: passwordHash,
            role: 'ADMIN',
            department: 'Central Administration',
            phone: '+91 98230 11001',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            totalPoints: 500,
        },
    });
    // 2. Create Librarian
    const librarian = await prisma.user.upsert({
        where: { email: 'librarian@libra.ai' },
        update: {},
        create: {
            memberId: 'LIB001',
            name: 'Sunita Patil',
            email: 'librarian@libra.ai',
            passwordHash: passwordHash,
            role: 'LIBRARIAN',
            department: 'Library Sciences',
            phone: '+91 98230 11002',
            avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
            totalPoints: 350,
        },
    });
    // 3. Create Faculty
    const faculty = await prisma.user.upsert({
        where: { email: 'faculty@libra.ai' },
        update: {},
        create: {
            memberId: 'FAC001',
            name: 'Prof. Amit Verma',
            email: 'faculty@libra.ai',
            passwordHash: passwordHash,
            role: 'FACULTY',
            department: 'Computer Engineering',
            phone: '+91 98230 11003',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            totalPoints: 420,
        },
    });
    // 4. Create Student
    const student = await prisma.user.upsert({
        where: { email: 'student@libra.ai' },
        update: {},
        create: {
            memberId: 'STU001',
            name: 'Rohan Deshmukh',
            email: 'student@libra.ai',
            passwordHash: passwordHash,
            role: 'STUDENT',
            department: 'Computer Engineering',
            semester: 6,
            phone: '+91 98230 11004',
            avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
            readingStreak: 12,
            totalPoints: 240,
            badges: JSON.stringify(['Bookworm', 'Top Reviewer', 'Speed Reader']),
        },
    });
    console.log('✅ Demo Users seeded successfully:');
    console.log(' - Admin: admin@libra.ai / Password@123 (ADM001)');
    console.log(' - Librarian: librarian@libra.ai / Password@123 (LIB001)');
    console.log(' - Faculty: faculty@libra.ai / Password@123 (FAC001)');
    console.log(' - Student: student@libra.ai / Password@123 (STU001)');
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
