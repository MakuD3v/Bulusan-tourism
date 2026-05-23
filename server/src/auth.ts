import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

async function verifyEmailExistence(email: string): Promise<boolean> {
  const isGmail = email.toLowerCase().endsWith('@gmail.com');
  if (!isGmail) return true;

  try {
    const res = await fetch(`https://disify.com/api/email/${encodeURIComponent(email)}`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data && (data.format === false || data.dns === false)) {
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Disify email validation failed, falling back...', e);
  }

  if (process.env.HUNTER_API_KEY) {
    try {
      const res = await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${process.env.HUNTER_API_KEY}`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      if (data?.data?.result === 'undeliverable') {
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Hunter email validation failed, falling back...', e);
    }
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

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

router.post('/register', async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    role, 
    businessType, 
    businessName, 
    businessCategory, 
    businessDescription, 
    businessLocation, 
    businessContact 
  } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const isAdmin = ['admin@bulusan.com'].includes(email.toLowerCase());
    
    if (!isAdmin) {
      const isEmailValid = await verifyEmailExistence(email);
      if (!isEmailValid) {
        return res.status(400).json({ error: 'This email address appears to be invalid or does not exist.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = isAdmin ? 'ADMIN' : (role === 'OWNER' ? 'OWNER' : 'USER');
    
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword, 
        role: assignedRole, 
        avatar: null 
      }
    });

    let ownedAttraction = null;
    let ownedEnterprise = null;

    if (assignedRole === 'OWNER' && businessType && businessName) {
      if (businessType === 'attraction') {
        ownedAttraction = await prisma.attraction.create({
          data: {
            name: businessName,
            categories: businessCategory ? [businessCategory] : [],
            location: businessLocation || '',
            lat: 12.7667,
            lng: 124.1,
            img: '',
            description: businessDescription || '',
            contactInfo: businessContact || '',
            ownerId: user.id
          }
        });
      } else if (businessType === 'enterprise') {
        ownedEnterprise = await prisma.enterprise.create({
          data: {
            name: businessName,
            categories: businessCategory ? [businessCategory] : [],
            location: businessLocation || '',
            lat: 12.7667,
            lng: 124.1,
            img: '',
            description: businessDescription || '',
            contactInfo: businessContact || '',
            ownerId: user.id
          }
        });
      }
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        avatar: user.avatar,
        ownedAttraction,
        ownedEnterprise
      } 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { ownedAttraction: true, ownedEnterprise: true }
    });
    if (!user) {
      return res.status(401).json({ error: 'Account not found. Please check your email or sign up.' });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        avatar: user.avatar, 
        itinerary: user.itinerary, 
        history: user.history,
        ownedAttraction: user.ownedAttraction,
        ownedEnterprise: user.ownedEnterprise
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.userId },
      include: { ownedAttraction: true, ownedEnterprise: true }
    });
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
        ownedAttraction: user.ownedAttraction,
        ownedEnterprise: user.ownedEnterprise
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', authenticateToken, async (req: any, res: any) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, joinedDate: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

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
      data: { role: 'ADMIN' }
    });

    res.json({ success: true, message: `Successfully promoted ${targetUser.name} to ADMIN.` });
  } catch (error) {
    res.status(500).json({ error: 'Server error during promotion' });
  }
});

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
      data: { role: 'USER' }
    });

    res.json({ success: true, message: `Successfully removed admin privileges from ${targetUser.name}.` });
  } catch (error) {
    res.status(500).json({ error: 'Server error during demotion' });
  }
});

export default router;
