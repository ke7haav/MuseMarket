import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { 
  validateRecordDeposit, 
  validateRecordPurchase, 
  validateRecordEarning 
} from '@/middleware/validation';
import {
  getVault,
  getVaultBalance,
  recordDeposit,
  recordPurchase,
  recordEarning,
  getTransactionHistory,
  getPyusdInfo,
  getBlockchainHistory,
  payMonthlyBill,
  updateCreditLimit
} from '@/controllers/vaultController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Vault management
router.get('/', getVault);
router.get('/balance', getVaultBalance);
router.get('/info', getPyusdInfo);
router.get('/blockchain-history', getBlockchainHistory);

// Transaction recording
router.post('/deposit', validateRecordDeposit, recordDeposit);
router.post('/purchase', validateRecordPurchase, recordPurchase);
router.post('/earning', validateRecordEarning, recordEarning);

// Transaction history
router.get('/transactions', getTransactionHistory);

// Credit management
router.post('/pay-monthly-bill', payMonthlyBill);
router.put('/credit-limit', updateCreditLimit);

export default router;
