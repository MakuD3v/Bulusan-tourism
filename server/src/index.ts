import express from 'express';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth';
import apiRoutes from './routes';
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

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
