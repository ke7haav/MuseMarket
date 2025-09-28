import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '@/types';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400);
  }
  next();
};

// User validation rules
export const validateUserRegistration = [
  body('walletAddress')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum wallet address'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  handleValidationErrors
];

export const validateUserUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  handleValidationErrors
];

// Content validation rules
export const validateContentCreation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
  body('price')
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be between 0 and 10,000 PYUSD'),
  body('type')
    .isIn(['music', 'ebook', 'video', 'course'])
    .withMessage('Type must be one of: music, ebook, video, course'),
  handleValidationErrors
];

export const validateContentUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be between 0 and 10,000 PYUSD'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  handleValidationErrors
];

// Purchase validation rules
export const validatePurchase = [
  body('contentId')
    .isMongoId()
    .withMessage('Invalid content ID'),
  handleValidationErrors
];

// Query validation rules
export const validateContentQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['music', 'ebook', 'video', 'course'])
    .withMessage('Type must be one of: music, ebook, video, course'),
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'price-low', 'price-high', 'popular'])
    .withMessage('Invalid sort option'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
  handleValidationErrors
];

export const validateUserQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('isCreator')
    .optional()
    .isBoolean()
    .withMessage('isCreator must be a boolean'),
  handleValidationErrors
];

// Parameter validation
export const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Vault validation rules
export const validateRecordDeposit = [
  body('transactionHash')
    .isLength({ min: 66, max: 66 })
    .withMessage('Invalid transaction hash format'),
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be greater than 0.000001 PYUSD'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  handleValidationErrors
];

export const validateRecordPurchase = [
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be greater than 0.000001 PYUSD'),
  body('contentId')
    .isMongoId()
    .withMessage('Invalid content ID format'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  handleValidationErrors
];

export const validateRecordEarning = [
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be greater than 0.000001 PYUSD'),
  body('contentId')
    .isMongoId()
    .withMessage('Invalid content ID format'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  handleValidationErrors
];
