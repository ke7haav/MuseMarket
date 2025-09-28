import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@/types';
import User from '@/models/User';
import { JWTPayload } from '@/types';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new AppError('Invalid token. User not found.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token.', 401));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
    const decoded = jwt.verify(token, secret) as JWTPayload;
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};

export const requireCreator = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  
  if (!req.user.isCreator) {
    return next(new AppError('Creator access required.', 403));
  }
  
  next();
};

export const generateToken = (userId: string, walletAddress: string): string => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
  
  return jwt.sign(
    { userId, walletAddress, exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) },
    secret
  );
};
