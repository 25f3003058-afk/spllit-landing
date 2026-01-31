import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { io } from '../server.js';

const router = Router();

const createMatchSchema = z.object({
  rideId: z.string()
});

/**
 * POST /api/matches
 * Create a match between current user and a ride
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = createMatchSchema.parse(req.body);

    // Get the ride
    const ride = await prisma.ride.findUnique({
      where: { id: data.rideId },
      include: { creator: true }
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ error: 'Ride is no longer available' });
    }

    if (ride.userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot match with own ride' });
    }

    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        rideId: data.rideId,
        OR: [
          { user1Id: req.user.userId },
          { user2Id: req.user.userId }
        ]
      }
    });

    if (existingMatch) {
      return res.status(400).json({ error: 'Match already exists' });
    }

    // Create match with unique chat room
    const chatRoomId = `chat_${ride.userId}_${req.user.userId}_${Date.now()}`;

    const match = await prisma.match.create({
      data: {
        rideId: data.rideId,
        user1Id: ride.userId,
        user2Id: req.user.userId,
        chatRoomId
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            college: true,
            rating: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            college: true,
            rating: true
          }
        },
        ride: true
      }
    });

    // Update ride status
    await prisma.ride.update({
      where: { id: data.rideId },
      data: { status: 'matched' }
    });

    // Emit socket event to both users
    io.emit(`match_created_${ride.userId}`, { match });
    io.emit(`match_created_${req.user.userId}`, { match });

    // Emit socket event to admin dashboard
    io.emit('new-match-created', {
      totalFare: ride.fare,
      splitAmount: ride.fare / 2,
      origin: ride.origin,
      destination: ride.destination,
      matchId: match.id,
      timestamp: new Date()
    });

    res.status(201).json({
      message: 'Match created successfully',
      match
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

/**
 * GET /api/matches/my
 * Get current user's matches
 */
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: req.user.userId },
          { user2Id: req.user.userId }
        ],
        status: 'active'
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            college: true,
            rating: true,
            lastSeen: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            college: true,
            rating: true,
            lastSeen: true
          }
        },
        ride: true,
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        matchedAt: 'desc'
      }
    });

    res.json({ matches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

/**
 * GET /api/matches/:id/messages
 * Get messages for a match
 */
router.get('/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string;

    // Verify user is part of this match
    const match = await prisma.match.findFirst({
      where: {
        id,
        OR: [
          { user1Id: req.user.userId },
          { user2Id: req.user.userId }
        ]
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found or unauthorized' });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        matchId: id,
        ...(before && {
          createdAt: {
            lt: new Date(before)
          }
        })
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        matchId: id,
        senderId: {
          not: req.user.userId
        },
        read: false
      },
      data: {
        read: true
      }
    });

    res.json({
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * PUT /api/matches/:id/complete
 * Mark match as completed
 */
router.put('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Verify user is part of this match
    const match = await prisma.match.findFirst({
      where: {
        id,
        OR: [
          { user1Id: req.user.userId },
          { user2Id: req.user.userId }
        ]
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found or unauthorized' });
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Update ride status
    await prisma.ride.update({
      where: { id: match.rideId },
      data: { status: 'completed' }
    });

    res.json({
      message: 'Match completed successfully',
      match: updatedMatch
    });
  } catch (error) {
    console.error('Complete match error:', error);
    res.status(500).json({ error: 'Failed to complete match' });
  }
});

export default router;
