import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../auth';

const router = Router();
const prisma = new PrismaClient();

// Get the current user's appeal
router.get('/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const appeal = await prisma.ownerAppeal.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(appeal);
  } catch (error) {
    console.error('Error fetching appeal:', error);
    res.status(500).json({ error: 'Server error fetching appeal' });
  }
});

// Submit a new appeal
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { message, image } = req.body;

    if (!message || !image) {
      return res.status(400).json({ error: 'Message and image are required.' });
    }

    // Check if there is already a pending appeal
    const existing = await prisma.ownerAppeal.findFirst({
      where: { userId, status: 'PENDING' }
    });

    if (existing) {
      return res.status(400).json({ error: 'You already have a pending appeal.' });
    }

    const appeal = await prisma.ownerAppeal.create({
      data: {
        userId,
        message,
        image,
        status: 'PENDING'
      }
    });

    res.json(appeal);
  } catch (error) {
    console.error('Error submitting appeal:', error);
    res.status(500).json({ error: 'Server error submitting appeal' });
  }
});

// Get all pending appeals (Admin only)
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const appeals = await prisma.ownerAppeal.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: { name: true, email: true, joinedDate: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(appeals);
  } catch (error) {
    console.error('Error fetching appeals:', error);
    res.status(500).json({ error: 'Server error fetching appeals' });
  }
});

// Approve or Reject an appeal (Admin only)
router.put('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const appealId = req.params.id;
    const { status, adminReply } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appeal = await prisma.ownerAppeal.findUnique({
      where: { id: appealId },
      include: { user: true }
    });

    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    const updatedAppeal = await prisma.ownerAppeal.update({
      where: { id: appealId },
      data: { status, adminReply }
    });

    res.json(updatedAppeal);
  } catch (error) {
    console.error('Error updating appeal:', error);
    res.status(500).json({ error: 'Server error updating appeal' });
  }
});

// Claim Owner Badge
router.post('/claim', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const appeal = await prisma.ownerAppeal.findFirst({
      where: { userId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' }
    });

    if (!appeal) {
      return res.status(400).json({ error: 'No approved appeal found.' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: 'OWNER' }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error claiming badge:', error);
    res.status(500).json({ error: 'Server error claiming badge' });
  }
});

export default router;
