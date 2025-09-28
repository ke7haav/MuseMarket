import { Router } from 'express';
import {
  getAnalytics,
  getGlobalAnalytics,
  getContentAnalytics,
  getUserAnalytics
} from '@/controllers/analyticsController';
import { authenticate, requireCreator, optionalAuth } from '@/middleware/auth';
import { validateMongoId } from '@/middleware/validation';

const router = Router();

// Public routes
router.get('/global', optionalAuth, getGlobalAnalytics);

// Protected routes
router.use(authenticate);

// User analytics (no creator requirement)
router.get('/user', getUserAnalytics);

// Creator analytics
router.get('/my-analytics', requireCreator, getAnalytics);
router.get('/content/:id', requireCreator, validateMongoId, getContentAnalytics);

export default router;
