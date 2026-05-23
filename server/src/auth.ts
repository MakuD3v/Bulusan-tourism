import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── Email Transporter ───────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(email: string, name: string, code: string) {
  await transporter.sendMail({
    from: `"Bulusan Tourism" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your Account — Bulusan Tourism',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #030a1c; color: #e2ecf7; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #2b6cb0, #1a365d); padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem; font-weight: 900; letter-spacing: -1px;">BULUSAN<span style="color: #90cdf4;">.</span></h1>
          <p style="margin: 8px 0 0; opacity: 0.8; font-size: 0.9rem;">Tourism Digital Gateway</p>
        </div>
        <div style="padding: 40px;">
          <h2 style="margin-top: 0;">Hi ${name} 👋</h2>
          <p style="color: #9faed4; line-height: 1.7;">Thank you for registering on Bulusan Tourism. Please verify your email address by entering the code below:</p>
          <div style="text-align: center; margin: 32px 0;">
            <div style="background: rgba(255, 255, 255, 0.05); border: 2px dashed #2b6cb0; display: inline-block; padding: 16px 40px; border-radius: 12px; font-weight: 800; font-size: 2rem; letter-spacing: 4px;">
              ${code}
            </div>
          </div>
          <p style="color: #7b8cbe; font-size: 0.85rem;">This code expires in 24 hours. If you did not register, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
}

async function sendApprovalEmail(email: string, name: string) {
  const dashboardUrl = `${CLIENT_URL}/owner-dashboard`;
  await transporter.sendMail({
    from: `"Bulusan Tourism" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Your Owner Account is Approved — Bulusan Tourism',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #030a1c; color: #e2ecf7; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #2b6cb0, #1a365d); padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem; font-weight: 900;">BULUSAN<span style="color: #90cdf4;">.</span></h1>
        </div>
        <div style="padding: 40px;">
          <h2 style="margin-top: 0;">Great news, ${name}! 🎉</h2>
          <p style="color: #9faed4; line-height: 1.7;">Your owner account has been <strong style="color: #68d391;">approved</strong> by our admin team. You can now log in and start managing your attractions and enterprises on Bulusan Tourism.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #2b6cb0, #1a365d); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 1rem; display: inline-block;">Go to My Dashboard</a>
          </div>
        </div>
      </div>
    `,
  });
}

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

// ─── Email Validation (simple, no external calls to prevent hangs) ────────────
function verifyEmailExistence(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Helper: send email with a hard timeout so it never blocks responses
function sendEmailWithTimeout(fn: () => Promise<void>, timeoutMs = 10000): Promise<void> {
  return Promise.race([
    fn(),
    new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Email send timeout')), timeoutMs)
    ),
  ]);
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
  const { name, email, password, role } = req.body;

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
    const assignedRole = isAdmin ? 'ADMIN' : (role === 'OWNER' ? 'OWNER' : 'USER');

    if (isAdmin) {
      // ADMIN: immediate activation
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: assignedRole,
          avatar: null,
          emailVerified: true,
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
    } else {
      // USER and OWNER: 6-digit code verification required
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: assignedRole,
          avatar: null,
          emailVerified: false,
          approvalStatus: assignedRole === 'OWNER' ? 'PENDING' : 'APPROVED',
          verificationToken,
          verificationTokenExpiry,
        },
      });

      // Send verification email (non-blocking with timeout — never stalls the response)
      sendEmailWithTimeout(() => sendVerificationEmail(email, name, verificationToken))
        .catch((emailErr: any) => console.error('Failed to send verification email:', emailErr));

      return res.json({
        success: true,
        requiresVerification: true,
        email: email,
        role: assignedRole,
        message: 'Account created. Please check your email for the verification code.',
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Verify Email Code ────────────────────────────────────────────────────────
router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        verificationToken: code,
        verificationTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Verification code is invalid or has expired.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // Generate token since user is now verified
    const token = jwt.sign({ userId: updatedUser.id, role: updatedUser.role }, JWT_SECRET, { expiresIn: '7d' });
    
    return res.json({
      success: true,
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        itinerary: updatedUser.itinerary,
        history: updatedUser.history,
        approvalStatus: updatedUser.approvalStatus,
        emailVerified: updatedUser.emailVerified,
      },
    });
  } catch (error) {
    console.error('Verify code error:', error);
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

    if (user.role === 'OWNER' && !user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email first. Check your inbox for the verification link.' });
    }

    if (user.role === 'OWNER' && user.approvalStatus === 'REJECTED') {
      return res.status(403).json({ error: 'Your owner account application has been rejected. Please contact the admin.' });
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

// ─── Pending Owners (admin) ──────────────────────────────────────────────────
router.get('/pending-owners', authenticateToken, async (req: any, res: any) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const pendingOwners = await prisma.user.findMany({
      where: { role: 'OWNER', approvalStatus: 'PENDING', emailVerified: true },
      select: { id: true, name: true, email: true, joinedDate: true, approvalStatus: true, emailVerified: true },
      orderBy: { joinedDate: 'asc' },
    });

    res.json(pendingOwners);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching pending owners' });
  }
});

// ─── Approve Owner (admin) ───────────────────────────────────────────────────
router.post('/approve-owner', authenticateToken, async (req: any, res: any) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role !== 'OWNER') return res.status(400).json({ error: 'User is not an owner' });

    await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: 'APPROVED' },
    });

    try {
      await sendApprovalEmail(target.email, target.name);
    } catch (emailErr) {
      console.error('Failed to send approval email:', emailErr);
    }

    res.json({ success: true, message: `${target.name}'s owner account has been approved.` });
  } catch (error) {
    res.status(500).json({ error: 'Server error during approval' });
  }
});

// ─── Reject Owner (admin) ────────────────────────────────────────────────────
router.post('/reject-owner', authenticateToken, async (req: any, res: any) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (requester?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: 'REJECTED' },
    });

    res.json({ success: true, message: `${target.name}'s owner account has been rejected.` });
  } catch (error) {
    res.status(500).json({ error: 'Server error during rejection' });
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
