import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateToken } from './auth';
import multer from 'multer';

const router = Router();
const prisma = new PrismaClient();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// File Upload endpoint
router.post('/upload', authenticateToken, upload.single('file'), (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });

  const stream = cloudinary.uploader.upload_stream(
    { folder: 'bulusan-tourism', resource_type: 'auto' },
    (error: any, result: any) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ error: error.message });
      }
      res.json({ url: result.secure_url });
    }
  );

  stream.end(req.file.buffer);
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
  delete data.recordId;
  // Always strip frontend-sent date strings — DB @default(now()) handles creation timestamps
  delete data.date;

  return data;
}

const createCrudRoutes = (model: any, modelName: string, include?: any) => {
  const r = Router();
  r.get('/', async (req, res) => {
    try {
      // Determine default sorting field
      let orderBy: any = undefined;
      
      if (['Attraction', 'Enterprise', 'Tour'].includes(modelName)) {
        orderBy = { dateAdded: 'desc' };
      } else if (modelName === 'User') {
        orderBy = { joinedDate: 'desc' };
      } else if (['Review', 'Inquiry', 'BlogPost'].includes(modelName)) {
        orderBy = { date: 'desc' };
      } else if (modelName === 'CheckIn') {
        orderBy = { timestamp: 'desc' };
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
      const requesterRole = (req as any).user?.role;
      const requesterId = (req as any).user?.userId;
      
      if (requesterRole === 'USER') {
        // Standard users can only submit blog posts and contact inquiries
        if (modelName !== 'BlogPost' && modelName !== 'Inquiry') {
           return res.status(403).json({ error: 'Forbidden: Standard users cannot create data' });
        }
      } else if (requesterRole === 'OWNER') {
        // Owners can create their own Attractions, Enterprises, and also submit blogs/inquiries
        if (!['Attraction', 'Enterprise', 'BlogPost', 'Inquiry'].includes(modelName)) {
          return res.status(403).json({ error: 'Forbidden: Owners can only publish Attractions, Enterprises, Blogs, or Inquiries' });
        }
      } else if (requesterRole !== 'ADMIN') {
        // All other roles are rejected (unauthenticated users are blocked by authenticateToken middleware)
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      const payload = formatPrismaPayload(req.body);
      if (['Attraction', 'Enterprise'].includes(modelName)) {
        if (requesterRole === 'OWNER') {
          payload.ownerId = requesterId;
        } else if (requesterRole === 'ADMIN' && req.body.ownerId) {
          payload.ownerId = req.body.ownerId;
        }
      }

      const data = await model.create({ data: payload });
      res.json(data);
    } catch (e: any) {
      console.error('Create error:', e.message);
      res.status(500).json({ error: 'Error creating data', details: e.message });
    }
  });

  r.put('/:id', authenticateToken, async (req, res) => {
    try {
      const requesterRole = (req as any).user?.role;
      const requesterId = (req as any).user?.userId;

      const recordId = isNaN(Number(req.params.id)) ? req.params.id : Number(req.params.id);

      // Standard users: only allowed to post reviews/ratings
      if (requesterRole === 'USER') {
        const bodyKeys = Object.keys(req.body);
        const isOnlyReviewUpdate = bodyKeys.every(k => ['reviews', 'rating'].includes(k));
        if (!isOnlyReviewUpdate) {
          return res.status(403).json({ error: 'Forbidden: Standard users cannot edit data' });
        }
      }

      // OWNERs can edit their own Attraction or Enterprise
      if (requesterRole === 'OWNER') {
        if (!['Attraction', 'Enterprise'].includes(modelName)) {
          return res.status(403).json({ error: 'Forbidden: Owners can only edit their own Attractions or Enterprises' });
        }
        const record = await model.findUnique({ where: { id: recordId } });
        if (!record || record.ownerId !== requesterId) {
          return res.status(403).json({ error: 'Forbidden: You can only edit your own attraction/enterprise' });
        }
      }

      // Non-ADMIN, non-OWNER can only do review-only updates (handled above) or are blocked
      if (requesterRole !== 'ADMIN' && requesterRole !== 'OWNER' && requesterRole !== 'USER') {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }

      // Admins editing BlogPosts or other records — allow
      // But block non-ADMIN/OWNER from editing non-Attraction/Enterprise models (except review-only for USER)
      if (requesterRole === 'USER') {
        // Already validated as review-only update above — proceed
      } else if (requesterRole !== 'ADMIN' && requesterRole !== 'OWNER') {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }

      const payload = formatPrismaPayload(req.body, true);
      if (requesterRole === 'OWNER') {
        delete payload.ownerId;
      }

      const data = await model.update({ 
        where: { id: recordId },
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
      const requesterRole = (req as any).user?.role;
      const requesterId = (req as any).user?.userId;

      if (requesterRole === 'USER') {
        return res.status(403).json({ error: 'Forbidden: Standard users cannot delete data' });
      }

      if (!['Attraction', 'Enterprise'].includes(modelName) && requesterRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Access denied' });
      }

      const recordId = isNaN(Number(req.params.id)) ? req.params.id : Number(req.params.id);

      if (['Attraction', 'Enterprise'].includes(modelName) && requesterRole === 'OWNER') {
        const record = await model.findUnique({ where: { id: recordId } });
        if (!record || record.ownerId !== requesterId) {
          return res.status(403).json({ error: 'Forbidden: You can only delete your own attraction/enterprise' });
        }
      }

      await model.delete({ where: { id: recordId } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Error deleting data', details: e });
    }
  });
  return r;
}

// Owner-scoped: returns only the calling owner's attractions
router.get('/attractions/mine', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user?.role !== 'OWNER') {
      return res.status(403).json({ error: 'Forbidden: Owner access only' });
    }
    const data = await prisma.attraction.findMany({
      where: { ownerId: req.user.userId },
      include: { reviews: true, offers: true },
      orderBy: { dateAdded: 'desc' },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error fetching owner attractions', details: e });
  }
});

// Owner-scoped: returns only the calling owner's enterprises
router.get('/enterprises/mine', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user?.role !== 'OWNER') {
      return res.status(403).json({ error: 'Forbidden: Owner access only' });
    }
    const data = await prisma.enterprise.findMany({
      where: { ownerId: req.user.userId },
      include: { reviews: true, offers: true },
      orderBy: { dateAdded: 'desc' },
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error fetching owner enterprises', details: e });
  }
});

// Apply generic routes
router.use('/attractions', createCrudRoutes(prisma.attraction, 'Attraction', { reviews: true, offers: true }));
router.use('/enterprises', createCrudRoutes(prisma.enterprise, 'Enterprise', { reviews: true, offers: true }));
router.use('/heritage', createCrudRoutes(prisma.heritage, 'Heritage', { reviews: true }));
router.use('/tours', createCrudRoutes(prisma.tour, 'Tour', { routes: true }));
router.use('/blogs', createCrudRoutes(prisma.blogPost, 'BlogPost', { reviews: true }));
// Public endpoint for submitting inquiries
router.post('/inquiries', async (req, res) => {
  try {
    const payload = formatPrismaPayload(req.body);
    const data = await prisma.inquiry.create({ data: payload });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: 'Error creating inquiry', details: e.message });
  }
});
router.use('/inquiries', createCrudRoutes(prisma.inquiry, 'Inquiry'));
router.use('/users', createCrudRoutes(prisma.user, 'User', { checkIns: true, customTours: true }));

// ── Dedicated public review endpoints ───────────────────────────────────────
// These allow any logged-in user to post a review without hitting the ADMIN-only PUT restriction.
router.post('/reviews/attraction/:id', authenticateToken, async (req: any, res) => {
  try {
    const attractionId = Number(req.params.id);
    const { author, avatar, rating, comment } = req.body;
    const review = await prisma.review.create({
      data: { author: author || 'Anonymous', avatar: avatar || '', rating: Number(rating) || 0, comment: comment || '', attractionId }
    });
    // Update the attraction's average rating
    const allReviews = await prisma.review.findMany({ where: { attractionId } });
    const avg = Number((allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length).toFixed(1));
    await prisma.attraction.update({ where: { id: attractionId }, data: { rating: avg } });
    res.json(review);
  } catch (e: any) {
    res.status(500).json({ error: 'Error posting review', details: e.message });
  }
});

router.post('/reviews/enterprise/:id', authenticateToken, async (req: any, res) => {
  try {
    const enterpriseId = Number(req.params.id);
    const { author, avatar, rating, comment } = req.body;
    const review = await prisma.review.create({
      data: { author: author || 'Anonymous', avatar: avatar || '', rating: Number(rating) || 0, comment: comment || '', enterpriseId }
    });
    const allReviews = await prisma.review.findMany({ where: { enterpriseId } });
    const avg = Number((allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length).toFixed(1));
    await prisma.enterprise.update({ where: { id: enterpriseId }, data: { rating: avg } });
    res.json(review);
  } catch (e: any) {
    res.status(500).json({ error: 'Error posting review', details: e.message });
  }
});

router.post('/reviews/heritage/:id', authenticateToken, async (req: any, res) => {
  try {
    const heritageId = Number(req.params.id);
    const { author, avatar, rating, comment } = req.body;
    const review = await prisma.review.create({
      data: { author: author || 'Anonymous', avatar: avatar || '', rating: Number(rating) || 0, comment: comment || '', heritageId }
    });
    const allReviews = await prisma.review.findMany({ where: { heritageId } });
    const avg = Number((allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length).toFixed(1));
    await prisma.heritage.update({ where: { id: heritageId }, data: { rating: avg } });
    res.json(review);
  } catch (e: any) {
    res.status(500).json({ error: 'Error posting review', details: e.message });
  }
});

router.post('/reviews/blog/:id', authenticateToken, async (req: any, res) => {
  try {
    const blogPostId = Number(req.params.id);
    const { author, avatar, rating, comment } = req.body;
    const review = await prisma.review.create({
      data: { author: author || 'Anonymous', avatar: avatar || '', rating: Number(rating) || 0, comment: comment || '', blogPostId }
    });
    const allReviews = await prisma.review.findMany({ where: { blogPostId } });
    const avg = Number((allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length).toFixed(1));
    await prisma.blogPost.update({ where: { id: blogPostId }, data: { rating: avg } });
    res.json(review);
  } catch (e: any) {
    res.status(500).json({ error: 'Error posting blog review', details: e.message });
  }
});

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
