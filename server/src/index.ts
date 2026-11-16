import express from 'express';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth';
import apiRoutes from './routes';
import appealsRoutes from './routes/appeals';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression());
app.use(cors());
app.use(express.json());

// Set up local file storage for uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/appeals', appealsRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/version', (req, res) => {
  res.json({ version: '1.0.5', timestamp: '2026-05-10T10:34:00Z' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('CRITICAL SERVER ERROR:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    stack: err.stack 
  });
});

// Cleanup duplicate inquiries on startup
async function cleanupDuplicateInquiries() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const inquiries = await prisma.inquiry.findMany({ orderBy: { id: 'asc' } });
    const seen = new Set<string>();
    const duplicateIds: number[] = [];

    for (const inq of inquiries) {
      const key = `${(inq.email || '').trim().toLowerCase()}|${(inq.message || '').trim()}`;
      if (seen.has(key)) {
        duplicateIds.push(inq.id);
      } else {
        seen.add(key);
      }
    }

    if (duplicateIds.length > 0) {
      console.log(`[Deduplication] Purging ${duplicateIds.length} duplicate inquiries from DB:`, duplicateIds);
      await prisma.inquiry.deleteMany({
        where: { id: { in: duplicateIds } }
      });
    }
    await prisma.$disconnect();
  } catch (err: any) {
    console.warn('[Deduplication] Startup cleanup skipped or failed:', err?.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  cleanupDuplicateInquiries();
});
