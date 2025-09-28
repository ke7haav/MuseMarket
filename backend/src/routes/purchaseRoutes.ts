import { Router } from 'express';
import {
  createPurchase,
  getUserPurchases,
  getPurchaseById,
  updatePurchaseStatus,
  getCreatorSales,
  getPurchaseStats,
  getSharingRequests,
  approveSharingRequest,
  rejectSharingRequest,
  settleCredit
} from '@/controllers/purchaseController';
import { authenticate, requireCreator } from '@/middleware/auth';
import {
  validatePurchase,
  validateMongoId
} from '@/middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Purchase routes
router.post('/', validatePurchase, createPurchase);
router.get('/my-purchases', getUserPurchases);
router.get('/stats', getPurchaseStats);
router.get('/:id', validateMongoId, getPurchaseById);
router.put('/:id/status', validateMongoId, updatePurchaseStatus);

// Settlement route
router.post('/settle-credit', settleCredit);

// Creator sales routes
router.get('/creator/sales', requireCreator, getCreatorSales);

// Sharing request routes
router.get('/sharing-requests', getSharingRequests);
router.post('/sharing-requests/:id/approve', validateMongoId, approveSharingRequest);
router.post('/sharing-requests/:id/reject', validateMongoId, rejectSharingRequest);

export default router;
