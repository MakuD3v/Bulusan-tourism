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

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: 'makuyangsen@gmail.com',
  subject: 'Test Email for Maku',
  text: 'This is a test email to verify nodemailer configuration for your inbox.',
}).then(() => console.log('Email sent to makuyangsen@gmail.com successfully'))
  .catch(console.error);
