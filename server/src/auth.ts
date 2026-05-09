import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
    
    if (!isAdmin) {
      if (email.toLowerCase().endsWith('@gmail.com') || process.env.HUNTER_API_KEY) {
        if (process.env.HUNTER_API_KEY) {
          try {
            const hunterRes = await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${process.env.HUNTER_API_KEY}`);
            const hunterData = await hunterRes.json();
            if (hunterData?.data?.result === 'undeliverable') {
              return res.status(400).json({ error: 'This email address appears to be invalid or does not exist.' });
            }
          } catch (e) {
            console.error('Email validation failed', e);
          }
        } else if (email.toLowerCase().includes('gmai.') || email.toLowerCase().includes('gmail.co') && !email.toLowerCase().endsWith('@gmail.com')) {
          // Simple fallback typo check if API key is not present
          return res.status(400).json({ error: 'Please enter a valid Gmail address (did you mean @gmail.com?).' });
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = `https://unavatar.io/${email.trim().toLowerCase()}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: isAdmin ? 'ADMIN' : 'USER', avatar }
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    console.error('Register error:', error);
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
    console.error('Login error:', error);
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

router.get('/me', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

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
