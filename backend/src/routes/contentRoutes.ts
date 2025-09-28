import { Router } from 'express';
import {
  createContent,
  getContent,
  getContentById,
  updateContent,
  deleteContent,
  getUserContent,
  likeContent,
  getTrendingContent,
  shareContentWithBuyer,
  upload
} from '@/controllers/contentController';
import { authenticate, optionalAuth, requireCreator } from '@/middleware/auth';
import {
  validateContentCreation,
  validateContentUpdate,
  validateContentQuery,
  validateMongoId
} from '@/middleware/validation';

const router = Router();

// Public routes
router.get('/', validateContentQuery, optionalAuth, getContent);
router.get('/trending', getTrendingContent);
router.get('/:id', validateMongoId, optionalAuth, getContentById);
router.post('/:id/like', validateMongoId, likeContent);

// Protected routes
router.use(authenticate);

// Creator routes
router.post('/', requireCreator, upload.single('file'), validateContentCreation, createContent);
router.get('/my/content', validateContentQuery, getUserContent);
router.put('/:id', requireCreator, validateMongoId, validateContentUpdate, updateContent);
router.delete('/:id', requireCreator, validateMongoId, deleteContent);
router.post('/share', requireCreator, shareContentWithBuyer);

export default router;
