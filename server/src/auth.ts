import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import rateLimit from 'express-rate-limit';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── SendGrid Setup ───────────────────────────────────────────────────────────
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
const FROM_EMAIL = process.env.FROM_EMAIL || 'bulusan.tourism.noreply@gmail.com';
sgMail.setApiKey(SENDGRID_API_KEY);

// ─── Generate Secure 8-char Alphanumeric Code (XXXX-XXXX format) ─────────────
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars like 0/O, 1/I
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${part1}-${part2}`;
}

async function sendVerificationEmail(email: string, name: string, code: string) {
  const year = new Date().getFullYear();
  await sgMail.send({
    from: { name: 'Bulusan Tourism', email: FROM_EMAIL },
    to: email,
    subject: `${code} is your Bulusan Tourism verification code`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verify Your Email</title></head>
<body style="margin:0;padding:0;background:#060e24;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#060e24;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;width:100%;">
        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#1a3a5c 0%,#0d2240 50%,#1a3a5c 100%);border-radius:20px 20px 0 0;padding:40px 48px;text-align:center;border-bottom:1px solid rgba(144,205,244,0.15);">
          <div style="display:inline-flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;background:linear-gradient(135deg,#4299e1,#2b6cb0);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;">🌊</div>
            <div style="text-align:left;">
              <div style="font-size:1.5rem;font-weight:900;color:#e2ecf7;letter-spacing:-0.5px;">BULUSAN<span style="color:#63b3ed;">.</span></div>
              <div style="font-size:0.72rem;color:#7b9fc4;letter-spacing:2px;text-transform:uppercase;">Tourism Digital Gateway</div>
            </div>
          </div>
        </td></tr>
        <!-- BODY -->
        <tr><td style="background:#0a1628;padding:48px;border-left:1px solid rgba(255,255,255,0.05);border-right:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0 0 8px;font-size:0.85rem;font-weight:600;color:#63b3ed;letter-spacing:1.5px;text-transform:uppercase;">Email Verification</p>
          <h1 style="margin:0 0 20px;font-size:1.8rem;font-weight:800;color:#e2ecf7;line-height:1.2;">Hi ${name}, verify your email ✉️</h1>
          <p style="margin:0 0 32px;font-size:0.98rem;color:#8faac8;line-height:1.75;">You're almost there! Enter the verification code below in the Bulusan Tourism app to confirm your email address and activate your account.</p>
          <!-- CODE BOX -->
          <div style="background:linear-gradient(135deg,rgba(43,108,176,0.12),rgba(26,54,93,0.2));border:1.5px solid rgba(99,179,237,0.3);border-radius:16px;padding:32px;text-align:center;margin:0 0 32px;">
            <p style="margin:0 0 12px;font-size:0.75rem;font-weight:700;color:#63b3ed;letter-spacing:3px;text-transform:uppercase;">Your verification code</p>
            <div style="font-family:'Courier New',Courier,monospace;font-size:2.8rem;font-weight:900;color:#e2ecf7;letter-spacing:8px;line-height:1;margin:0 0 16px;text-shadow:0 0 30px rgba(99,179,237,0.4);">${code}</div>
            <div style="display:inline-block;background:rgba(99,179,237,0.08);border:1px solid rgba(99,179,237,0.2);border-radius:20px;padding:6px 16px;font-size:0.78rem;color:#63b3ed;font-weight:600;">⏱ Expires in 24 hours</div>
          </div>
          <!-- SECURITY NOTICE -->
          <div style="background:rgba(245,158,11,0.06);border-left:3px solid rgba(245,158,11,0.5);border-radius:0 10px 10px 0;padding:16px 20px;margin:0 0 32px;">
            <p style="margin:0;font-size:0.83rem;color:#c4a05a;line-height:1.6;"><strong style="color:#f6ad55;">🔒 Security tip:</strong> Bulusan Tourism will never ask for this code over the phone or chat. Never share it with anyone.</p>
          </div>
          <p style="margin:0;font-size:0.83rem;color:#556080;line-height:1.6;">Didn't create an account? You can safely ignore this email. Someone may have typed your email by mistake.</p>
        </td></tr>
        <!-- FOOTER -->
        <tr><td style="background:#070f20;border-radius:0 0 20px 20px;padding:28px 48px;text-align:center;border-top:1px solid rgba(255,255,255,0.04);border-left:1px solid rgba(255,255,255,0.05);border-right:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0 0 8px;font-size:0.8rem;color:#3a4d6e;">© ${year} Bulusan Tourism. All rights reserved.</p>
          <p style="margin:0;font-size:0.78rem;color:#2a3a54;">Municipality of Bulusan, Sorsogon, Philippines</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}

async function sendApprovalEmail(email: string, name: string) {
  const dashboardUrl = `${CLIENT_URL}/owner-dashboard`;
  await sgMail.send({
    from: { name: 'Bulusan Tourism', email: FROM_EMAIL },
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
function sendEmailWithTimeout(fn: () => Promise<void>, timeoutMs = 30000): Promise<void> {
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

// ─── Test Email Setup ─────────────────────────────────────────────────────────
router.get('/test-email', async (req, res) => {
  const targetEmail = req.query.email as string;
  if (!targetEmail) return res.status(400).json({ error: 'Please provide an ?email= parameter' });

  try {
    await sgMail.send({
      from: { name: 'Bulusan Tourism', email: FROM_EMAIL },
      to: targetEmail,
      subject: 'Live Server Email Test — SendGrid',
      text: 'If you are receiving this, SendGrid is working perfectly on your live server!',
    });
    res.json({ success: true, message: `Test email sent via SendGrid to ${targetEmail}` });
  } catch (error: any) {
    console.error('SendGrid test failed:', error?.response?.body || error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error?.response?.body,
    });
  }
});

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
      const verificationToken = generateVerificationCode();
      
      const registrationToken = jwt.sign(
        { 
          name, 
          email, 
          password: hashedPassword, 
          role: assignedRole, 
          code: verificationToken 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );

      // Send verification email (non-blocking with timeout — never stalls the response)
      sendEmailWithTimeout(() => sendVerificationEmail(email, name, verificationToken))
        .catch((emailErr: any) => console.error('Failed to send verification email:', emailErr));

      return res.json({
        success: true,
        requiresVerification: true,
        email: email,
        role: assignedRole,
        registrationToken,
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
  const { email, code, registrationToken } = req.body;
  if (!email || !code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  if (registrationToken) {
    try {
      const decoded: any = jwt.verify(registrationToken, JWT_SECRET);
      if (decoded.email !== email || decoded.code !== code) {
        return res.status(400).json({ error: 'Verification code is invalid.' });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Account already exists.' });
      }

      const updatedUser = await prisma.user.create({
        data: {
          name: decoded.name,
          email: decoded.email,
          password: decoded.password,
          role: decoded.role,
          avatar: null,
          emailVerified: true,
          approvalStatus: decoded.role === 'OWNER' ? 'PENDING' : 'APPROVED',
        },
      });

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
    } catch (err) {
      return res.status(400).json({ error: 'Registration session expired or invalid. Please sign up again.' });
    }
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
