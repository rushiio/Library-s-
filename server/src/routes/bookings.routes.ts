import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Defined Zone Specifications
const ZONES_CONFIG = [
  {
    id: 'ZONE-A',
    name: 'Silent Study Area',
    roomType: 'Silent Study',
    description: 'Ultra-quiet environment with individual study carrels, personal task lighting, and dedicated power sockets.',
    totalSeats: 24,
    features: ['Noise Level < 30dB', 'Power Socket per seat', 'Ergonomic Chair', 'Reading Lamp'],
    prefix: 'A',
  },
  {
    id: 'ZONE-B',
    name: 'Collaborative Group Discussion',
    roomType: 'Group Discussion',
    description: 'Spacious collaborative tables equipped with smart whiteboards and screen-sharing monitors.',
    totalSeats: 16,
    features: ['Whiteboards', 'Discussion Allowed', 'Group Tables (4 seats)', 'Screen Casting'],
    prefix: 'B',
  },
  {
    id: 'ZONE-C',
    name: 'Digital Research & AI Lab',
    roomType: 'Digital Lab',
    description: 'High-performance workstations configured with dual displays, developer tools, and IEEE/ACM digital access.',
    totalSeats: 16,
    features: ['Dual 27" Displays', 'Core i7 Workstations', 'High-Speed 1Gbps LAN', 'Digital Library Portal'],
    prefix: 'C',
  },
];

/**
 * GET /api/bookings/seats
 * Retrieve real-time seat occupancy and zone availability
 */
router.get('/seats', async (req: Request, res: Response): Promise<void> => {
  try {
    const timeSlot = (req.query.timeSlot as string) || new Date().toISOString();
    const targetDate = new Date(timeSlot);

    // Find active bookings that overlap with requested time
    const activeBookings = await prisma.seatBooking.findMany({
      where: {
        status: 'ACTIVE',
        startTime: { lte: targetDate },
        endTime: { gte: targetDate },
      },
      include: {
        user: {
          select: { id: true, name: true, memberId: true, role: true },
        },
      },
    });

    const occupiedSeatCodes = new Set(activeBookings.map((b) => b.seatCode));

    const zones = ZONES_CONFIG.map((zone) => {
      const seats = [];
      for (let i = 1; i <= zone.totalSeats; i++) {
        const seatCode = `${zone.id}-S${i.toString().padStart(2, '0')}`;
        const booking = activeBookings.find((b) => b.seatCode === seatCode);
        const isOccupied = occupiedSeatCodes.has(seatCode);

        seats.push({
          seatCode,
          seatNumber: i,
          zoneId: zone.id,
          roomType: zone.roomType,
          isOccupied,
          bookedBy: booking?.user ? { id: booking.user.id, name: booking.user.name, memberId: booking.user.memberId } : null,
          bookingId: booking?.id || null,
        });
      }

      const availableCount = seats.filter((s) => !s.isOccupied).length;

      return {
        ...zone,
        availableSeats: availableCount,
        occupiedSeats: zone.totalSeats - availableCount,
        seats,
      };
    });

    res.json({
      success: true,
      queryTime: targetDate.toISOString(),
      totalOccupied: activeBookings.length,
      zones,
    });
  } catch (error: any) {
    console.error('Fetch seats error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve seat status.' });
  }
});

/**
 * GET /api/bookings/my
 * Get current user's active and past bookings
 */
router.get('/my', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const bookings = await prisma.seatBooking.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      bookings,
    });
  } catch (error: any) {
    console.error('My bookings error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve your seat bookings.' });
  }
});

/**
 * POST /api/bookings/seats
 * Reserve a seat for a user
 */
router.post('/seats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { seatCode, roomType, startTime, endTime } = req.body;

    if (!seatCode || !startTime || !endTime) {
      res.status(400).json({ success: false, error: 'Seat code, start time, and end time are required.' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      res.status(400).json({ success: false, error: 'End time must be after start time.' });
      return;
    }

    // Check for conflicting active bookings for this exact seat
    const conflict = await prisma.seatBooking.findFirst({
      where: {
        seatCode,
        status: 'ACTIVE',
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
    });

    if (conflict) {
      res.status(409).json({
        success: false,
        error: `Seat ${seatCode} is already reserved for this duration. Please pick another seat or time slot.`,
      });
      return;
    }

    // Determine roomType if not provided
    let derivedRoomType = roomType;
    if (!derivedRoomType) {
      if (seatCode.startsWith('ZONE-A')) derivedRoomType = 'Silent Study';
      else if (seatCode.startsWith('ZONE-B')) derivedRoomType = 'Group Discussion';
      else if (seatCode.startsWith('ZONE-C')) derivedRoomType = 'Digital Lab';
      else derivedRoomType = 'General Study';
    }

    const newBooking = await prisma.seatBooking.create({
      data: {
        userId,
        seatCode,
        roomType: derivedRoomType,
        startTime: start,
        endTime: end,
        status: 'ACTIVE',
      },
    });

    res.status(201).json({
      success: true,
      message: `Seat ${seatCode} successfully reserved!`,
      booking: newBooking,
    });
  } catch (error: any) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to reserve study seat.' });
  }
});

/**
 * DELETE /api/bookings/seats/:id
 * Cancel an active seat reservation
 */
router.delete('/seats/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.seatBooking.findUnique({
      where: { id: id as string },
    });

    if (!booking) {
      res.status(404).json({ success: false, error: 'Seat reservation not found.' });
      return;
    }

    // Allow user to cancel their own booking, or librarian/admin to cancel any
    if (booking.userId !== userId && !['ADMIN', 'LIBRARIAN'].includes(userRole)) {
      res.status(403).json({ success: false, error: 'You are not authorized to cancel this booking.' });
      return;
    }

    const updated = await prisma.seatBooking.update({
      where: { id: id as string },
      data: { status: 'CANCELLED' },
    });

    res.json({
      success: true,
      message: `Seat reservation ${booking.seatCode} has been cancelled.`,
      booking: updated,
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel seat reservation.' });
  }
});

export default router;
