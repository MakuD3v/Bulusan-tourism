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

// ─── Account Recovery (Forgot Password) ───────────────────────────────────────
router.post('/recovery/request', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak if user exists or not
      return res.json({ success: true });
    }

    // Check for existing pending request
    const existing = await prisma.passwordRecovery.findUnique({ where: { email } });
    if (existing && existing.status === 'PENDING') {
      return res.json({ success: true });
    }

    await prisma.passwordRecovery.upsert({
      where: { email },
      update: { status: 'PENDING', token: null, createdAt: new Date() },
      create: { email, status: 'PENDING' }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error creating recovery request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/recovery/status/:email', async (req: any, res: any) => {
  try {
    const { email } = req.params;
    const recovery = await prisma.passwordRecovery.findUnique({ where: { email } });
    if (!recovery) return res.status(404).json({ error: 'No recovery request found' });

    if (recovery.status === 'APPROVED' && recovery.token) {
      // Decode the token to get the user data for the frontend
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return res.json({
          status: 'APPROVED',
          token: recovery.token,
          user: userWithoutPassword
        });
      }
    }

    res.json({ status: recovery.status });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin endpoints for recovery
router.get('/recovery/pending', authenticateToken, async (req: any, res: any) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const pending = await prisma.passwordRecovery.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' }
    });
    
    // Fetch user details for each request
    const pendingWithUsers = await Promise.all(pending.map(async (r) => {
      const user = await prisma.user.findUnique({ where: { email: r.email } });
      return { ...r, name: user?.name || 'Unknown' };
    }));

    res.json(pendingWithUsers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/recovery/approve', authenticateToken, async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Generate a new secure JWT for the user
    const newToken = jwt.sign(
      { userId: targetUser.id, email: targetUser.email, role: targetUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.passwordRecovery.update({
      where: { email },
      data: { status: 'APPROVED', token: newToken }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/recovery/reject', authenticateToken, async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    await prisma.passwordRecovery.update({
      where: { email },
      data: { status: 'REJECTED' }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
