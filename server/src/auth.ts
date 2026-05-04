import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const isAdmin = ['admin@bulusan.com'].includes(email.toLowerCase());
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: isAdmin ? 'ADMIN' : 'USER' }
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

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

router.put('/promote', authenticateToken, async (req: any, res: any) => {
  const { targetEmail } = req.body;
  if (!targetEmail) return res.status(400).json({ error: 'Target email is required' });

  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.email !== 'admin@bulusan.com') {
      return res.status(403).json({ error: 'Forbidden: Only admin@bulusan.com can promote users' });
    }

    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    await prisma.user.update({
      where: { email: targetEmail },
      data: { role: 'ADMIN' }
    });

    res.json({ success: true, message: `Successfully promoted ${targetEmail} to ADMIN.` });
  } catch (error) {
    res.status(500).json({ error: 'Server error during promotion' });
  }
});

export default router;
