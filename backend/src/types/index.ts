import { Document } from 'mongoose';
import mongoose from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  walletAddress: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  isCreator: boolean;
  totalEarnings: number;
  totalSales: number;
  lighthouseApiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  walletAddress: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  isCreator: boolean;
  totalEarnings: number;
  totalSales: number;
}

// Content Types
export type ContentType = 'music' | 'ebook' | 'video' | 'course';

export interface IContent extends Document {
  _id: string;
  title: string;
  description: string;
  creator: mongoose.Types.ObjectId; // User ID
  creatorWalletAddress: string; // Wallet address of the creator
  price: number; // Price in PYUSD
  type: ContentType;
  fileUrl?: string; // IPFS/Filecoin URL
  fileCid?: string; // Filecoin CID
  fileId?: string; // Lighthouse file ID (UUID) for deletion
  // Encrypted file fields
  encryptedFileCid?: string; // Encrypted file CID
  encryptedFileId?: string; // Encrypted file ID
  isEncrypted?: boolean; // Whether the file is encrypted
  encryptionSignature?: string; // Signature for encryption operations
  encryptionMessage?: string; // Original message used for encryption
  thumbnailUrl?: string;
  thumbnailCid?: string;
  fileSize: number;
  duration?: number; // For audio/video content
  tags: string[];
  isPublished: boolean;
  salesCount: number;
  viewCount: number;
  likeCount: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContentCreate {
  title: string;
  description: string;
  price: number;
  type: ContentType;
  tags: string[];
  file?: Express.Multer.File;
  thumbnail?: Express.Multer.File;
}

export interface IContentUpdate {
  title?: string;
  description?: string;
  price?: number;
  tags?: string[];
  isPublished?: boolean;
}

// Purchase Types
export interface IPurchase extends Document {
  _id: string;
  buyer: mongoose.Types.ObjectId; // User ID
  content: mongoose.Types.ObjectId; // Content ID
  amount: number; // Amount in PYUSD
  transactionHash: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseCreate {
  contentId: string;
  amount: number;
  transactionHash: string;
}

// Analytics Types
export interface IAnalytics {
  totalRevenue: number;
  totalSales: number;
  uniqueCustomers: number;
  totalViews: number;
  conversionRate: number;
  avgOrderValue: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    sales: number;
  }>;
  topContent: Array<{
    contentId: string;
    title: string;
    sales: number;
    revenue: number;
    views: number;
  }>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query Types
export interface ContentQuery {
  page?: number;
  limit?: number;
  type?: ContentType;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'popular';
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  isCreator?: boolean;
}

// Web3 Types
export interface Web3Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  status: 'pending' | 'success' | 'failed';
  blockNumber?: number;
  timestamp: number;
}

export interface PYUSDTransfer {
  from: string;
  to: string;
  amount: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

// Filecoin Types
export interface FilecoinUpload {
  cid: string;
  size: number;
  url: string;
  gateway: string;
}

export interface LighthouseResponse {
  data: {
    Name: string;
    Hash: string;
    Size: string;
  };
}

// The Graph Types
export interface GraphQuery {
  query: string;
  variables?: Record<string, any>;
}

export interface GraphResponse<T = any> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
  }>;
}

// Error Types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  walletAddress: string;
  iat: number;
  exp: number;
}

// Request Extensions
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}
