import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import { authenticateToken } from './auth';

const router = Router();
const prisma = new PrismaClient();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer config for Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bulusan-tourism',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4'],
    resource_type: 'auto'
  } as any
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// File Upload endpoint
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Cloudinary returns the full secure URL in path (or secure_url in some versions)
  const url = (req.file as any).path || (req.file as any).secure_url;
  res.json({ url });
});

// Generic CRUD factory
function formatPrismaPayload(body: any, isUpdate: boolean = false) {
  const data = { ...body };
  
  if (data.coordinates) {
    data.lat = Number(data.coordinates.lat) || 0;
    data.lng = Number(data.coordinates.lng) || 0;
    delete data.coordinates;
  }
  
  if (data.offers && Array.isArray(data.offers)) {
    const formattedOffers = data.offers.map((o: any) => ({ name: o.name, price: String(o.price), image: o.image || '' }));
    data.offers = isUpdate 
      ? { deleteMany: {}, create: formattedOffers }
      : { create: formattedOffers };
  }

  if (data.reviews && Array.isArray(data.reviews)) {
    const formattedReviews = data.reviews.map((r: any) => ({
      author: r.author || 'Anonymous',
      rating: Number(r.rating) || 0,
      comment: r.comment || '',
      avatar: r.avatar || '',
      date: String(r.date || new Date().toLocaleDateString())
    }));
    data.reviews = isUpdate 
      ? { deleteMany: {}, create: formattedReviews }
      : { create: formattedReviews };
  }

  if (data.routes && Array.isArray(data.routes)) {
    const formattedRoutes = data.routes.map((r: any) => ({ lat: Number(r.lat) || 0, lng: Number(r.lng) || 0, label: r.label || '', order: Number(r.order) || 0 }));
    data.routes = isUpdate 
      ? { deleteMany: {}, create: formattedRoutes }
      : { create: formattedRoutes };
  }

  delete data.pricingType;
  delete data.openingTime;
  delete data.closingTime;
  delete data.website;
  delete data.firebaseId;
  delete data.id;

  return data;
}

const createCrudRoutes = (model: any, include?: any) => {
  const r = Router();
  r.get('/', async (req, res) => {
    try {
      // Determine default sorting field
      let orderBy: any = undefined;
      const modelName = (model as any).name || '';
      
      if (['Attraction', 'Enterprise', 'Tour', 'BlogPost', 'Inquiry', 'CheckIn'].includes(modelName)) {
        orderBy = { dateAdded: 'desc' };
      } else if (modelName === 'User') {
        orderBy = { joinedDate: 'desc' };
      } else if (modelName === 'Review') {
        orderBy = { date: 'desc' };
      } else {
        orderBy = { id: 'desc' };
      }

      const data = await model.findMany({ include, orderBy });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Error fetching data', details: e });
    }
  });

  r.get('/:id', async (req, res) => {
    try {
      const data = await model.findUnique({ 
        where: { id: isNaN(Number(req.params.id)) ? req.params.id : Number(req.params.id) },
        include 
      });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Error fetching data', details: e });
    }
  });

  r.post('/', authenticateToken, async (req, res) => {
    try {
      const payload = formatPrismaPayload(req.body);
      const data = await model.create({ data: payload });
      res.json(data);
    } catch (e: any) {
      console.error('Create error:', e.message);
      res.status(500).json({ error: 'Error creating data', details: e.message });
    }
  });

  r.put('/:id', authenticateToken, async (req, res) => {
    try {
      const payload = formatPrismaPayload(req.body, true);
      const data = await model.update({ 
        where: { id: isNaN(Number(req.params.id)) ? req.params.id : Number(req.params.id) },
        data: payload
      });
      res.json(data);
    } catch (e: any) {
      console.error('Update error:', e.message);
      res.status(500).json({ error: 'Error updating data', details: e.message });
    }
  });

  r.delete('/:id', authenticateToken, async (req, res) => {
    try {
      await model.delete({ 
        where: { id: isNaN(Number(req.params.id)) ? req.params.id : Number(req.params.id) }
      });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Error deleting data', details: e });
    }
  });
  return r;
};

// Apply generic routes
router.use('/attractions', createCrudRoutes(prisma.attraction, { reviews: true, offers: true }));
router.use('/enterprises', createCrudRoutes(prisma.enterprise, { reviews: true, offers: true }));
router.use('/heritage', createCrudRoutes(prisma.heritage, { reviews: true }));
router.use('/tours', createCrudRoutes(prisma.tour, { routes: true }));
router.use('/blogs', createCrudRoutes(prisma.blogPost));
router.use('/inquiries', createCrudRoutes(prisma.inquiry));
router.use('/users', createCrudRoutes(prisma.user, { checkIns: true, customTours: true }));

// Specific logic
router.post('/interaction/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  try {
    const targetModel = (prisma as any)[collection];
    if (!targetModel) return res.status(404).json({ error: 'Invalid collection' });
    
    await targetModel.update({
      where: { id: isNaN(Number(id)) ? id : Number(id) },
      data: { visits: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Error tracking interaction' });
  }
});

router.get('/global-stats', async (req, res) => {
  try {
    const stat = await prisma.globalStat.findUnique({ where: { id: 1 } });
    res.json(stat ? [stat] : [{ id: 1, totalVisitors: 0 }]);
  } catch (e) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

router.post('/global-stats', async (req, res) => {
  try {
    const { incrementVisitors } = req.body;
    const stat = await prisma.globalStat.upsert({
      where: { id: 1 },
      update: incrementVisitors ? { totalVisitors: { increment: 1 } } : {},
      create: { id: 1, totalVisitors: incrementVisitors ? 1 : 0 }
    });
    res.json(stat);
  } catch (e) {
    res.status(500).json({ error: 'Error updating stats' });
  }
});

export default router;
