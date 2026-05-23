import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(email: string, name: string, code: string) {
  const year = new Date().getFullYear();
  await transporter.sendMail({
    from: \`"Bulusan Tourism" <\${process.env.EMAIL_USER}>\`,
    to: email,
    subject: \`\${code} is your Bulusan Tourism verification code\`,
    html: \`
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
          <h1 style="margin:0 0 20px;font-size:1.8rem;font-weight:800;color:#e2ecf7;line-height:1.2;">Hi \${name}, verify your email ✉️</h1>
          <p style="margin:0 0 32px;font-size:0.98rem;color:#8faac8;line-height:1.75;">You're almost there! Enter the verification code below in the Bulusan Tourism app to confirm your email address and activate your account.</p>
          <!-- CODE BOX -->
          <div style="background:linear-gradient(135deg,rgba(43,108,176,0.12),rgba(26,54,93,0.2));border:1.5px solid rgba(99,179,237,0.3);border-radius:16px;padding:32px;text-align:center;margin:0 0 32px;">
            <p style="margin:0 0 12px;font-size:0.75rem;font-weight:700;color:#63b3ed;letter-spacing:3px;text-transform:uppercase;">Your verification code</p>
            <div style="font-family:'Courier New',Courier,monospace;font-size:2.8rem;font-weight:900;color:#e2ecf7;letter-spacing:8px;line-height:1;margin:0 0 16px;text-shadow:0 0 30px rgba(99,179,237,0.4);">\${code}</div>
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
          <p style="margin:0 0 8px;font-size:0.8rem;color:#3a4d6e;">© \${year} Bulusan Tourism. All rights reserved.</p>
          <p style="margin:0;font-size:0.78rem;color:#2a3a54;">Municipality of Bulusan, Sorsogon, Philippines</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    \`,
  });
}

sendVerificationEmail(process.env.EMAIL_USER!, 'Test Owner', 'ABCD-1234')
  .then(() => console.log('HTML Email sent successfully'))
  .catch(console.error);
