import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validatePurchase } from '@/middleware/validation';
import {
  createPurchase,
  getUserPurchases,
  getCreditBalance,
  settleCredit,
  getCreatorEarnings,
  claimCreatorEarnings
} from '@/controllers/simplePurchaseController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Simple purchase routes
router.post('/', validatePurchase, createPurchase);
router.get('/my-purchases', getUserPurchases);
router.get('/credit-balance', getCreditBalance);
router.post('/settle-credit', settleCredit);
router.get('/creator-earnings', getCreatorEarnings);
router.post('/claim-earnings', claimCreatorEarnings);

export default router;
