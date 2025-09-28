import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  becomeCreator,
  getUsers,
  getUserById,
  generateLighthouseKey,
  connectWallet
} from '@/controllers/userController';
import { authenticate, optionalAuth } from '@/middleware/auth';
import {
  validateUserRegistration,
  validateUserUpdate,
  validateUserQuery,
  validateMongoId
} from '@/middleware/validation';

const router = Router();

// Public routes
router.post('/connect-wallet', connectWallet);
router.post('/register', validateUserRegistration, registerUser);
router.post('/login', loginUser);
router.get('/users', validateUserQuery, optionalAuth, getUsers);
router.get('/users/:id', validateMongoId, getUserById);

// Protected routes
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', validateUserUpdate, updateProfile);
router.post('/become-creator', becomeCreator);
router.post('/generate-lighthouse-key', generateLighthouseKey);

export default router;
