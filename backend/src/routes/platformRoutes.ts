import { Router } from 'express';
import {
  getWalletInfo,
  getWalletBalance,
  generateWallet,
  validateAddress
} from '@/controllers/platformController';

const router = Router();

// Platform wallet routes (public endpoints for wallet info)
router.get('/wallet-info', getWalletInfo);
router.get('/wallet-balance', getWalletBalance);
router.get('/validate-address/:address', validateAddress);

// Development only routes
router.post('/generate-wallet', generateWallet);

export default router;
