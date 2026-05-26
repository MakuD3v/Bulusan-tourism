import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Email Validation ─────────────────────────────────────────────────────────
function verifyEmailExistence(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', registerLimiter, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const isAdmin = ['admin@bulusan.com'].includes(email.toLowerCase());

    if (!isAdmin) {
      const isEmailValid = verifyEmailExistence(email);
      if (!isEmailValid) {
        return res.status(400).json({ error: 'This email address appears to be invalid.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = isAdmin ? 'ADMIN' : 'USER'; // Everyone signs up as USER initially

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
        avatar: null,
        emailVerified: true, // Auto-verify
        approvalStatus: 'APPROVED',
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Account not found. Please check your email or sign up.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        itinerary: user.itinerary,
        history: user.history,
        approvalStatus: user.approvalStatus,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Me ──────────────────────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        itinerary: user.itinerary,
        history: user.history,
        approvalStatus: user.approvalStatus,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Get All Users (admin) ───────────────────────────────────────────────────
router.get('/users', authenticateToken, async (req: any, res: any) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, joinedDate: true, approvalStatus: true, emailVerified: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// ─── Promote to Admin ─────────────────────────────────────────────────────────
router.put('/promote', authenticateToken, async (req: any, res: any) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Target user ID is required' });

  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.email !== 'admin@bulusan.com') {
      return res.status(403).json({ error: 'Forbidden: Only the main administrator can promote users' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN', approvalStatus: 'APPROVED', emailVerified: true },
    });

    res.json({ success: true, message: `Successfully promoted ${targetUser.name} to ADMIN.` });
  } catch (error) {
    res.status(500).json({ error: 'Server error during promotion' });
  }
});

// ─── Demote from Admin ────────────────────────────────────────────────────────
router.put('/demote', authenticateToken, async (req: any, res: any) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Target user ID is required' });

  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.email !== 'admin@bulusan.com') {
      return res.status(403).json({ error: 'Forbidden: Only the main administrator can demote users' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.email === 'admin@bulusan.com') {
      return res.status(400).json({ error: 'Cannot demote the main administrator.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'USER' },
    });

    res.json({ success: true, message: `Successfully removed admin privileges from ${targetUser.name}.` });
  } catch (error) {
    res.status(500).json({ error: 'Server error during demotion' });
  }
});

export default router;
