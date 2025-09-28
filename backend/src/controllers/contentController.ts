import { Request, Response, NextFunction } from 'express';
import Content from '@/models/Content';
import User from '@/models/User';
import { sendSuccess, sendError, sendPaginated } from '@/utils/response';
import { getPaginationOptions, getSortOptions, getSearchQuery } from '@/utils/pagination';
import { AppError } from '@/types';
import LighthouseService from '@/services/lighthouseService';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB - Filecoin supports up to 24GB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'video/mp4', 'video/quicktime', 'application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export const createContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, price, type, signedMessage } = req.body;
    const creatorId = req.user?._id;

    if (!req.file) {
      throw new AppError('File is required', 400);
    }

    if (!signedMessage) {
      throw new AppError('Signed message is required for encrypted upload', 400);
    }

    // Get user's Lighthouse API key
    const user = await User.findById(creatorId);
    if (!user || !user.lighthouseApiKey) {
      throw new AppError('User does not have a Lighthouse API key. Please reconnect your wallet.', 400);
    }

    // Upload file with encryption to Filecoin via Lighthouse
    const encryptedUpload = await LighthouseService.uploadEncryptedFile(
      req.file,
      user.lighthouseApiKey,
      user.walletAddress,
      signedMessage,
      (progress) => {
        // Progress callback can be used for real-time updates
        console.log(`Encrypted upload progress: ${progress}%`);
      }
    );

    // Store the original message that was used for signing (for future sharing)
    // This message was used to create the signedMessage that we're storing
    // We need to store this exact message to use with the stored signature for sharing
    // Note: The signedMessage was created by signing this message with MetaMask
    // IMPORTANT: We need to store the SAME message that was used for signing during upload
    const originalMessage = await LighthouseService.getAuthMessage(user.walletAddress);

    // Create content record with encrypted file info
    const content = new Content({
      title,
      description,
      creator: creatorId,
      creatorWalletAddress: user.walletAddress,
      price: parseFloat(price),
      type,
      // Store both encrypted and regular file info
      fileUrl: `https://gateway.lighthouse.storage/ipfs/${encryptedUpload[0].Hash}`, // This will be encrypted
      fileCid: encryptedUpload[0].Hash,
      fileId: encryptedUpload[0].Id,
      // Encrypted file fields
      encryptedFileCid: encryptedUpload[0].Hash,
      encryptedFileId: encryptedUpload[0].Id,
      isEncrypted: true,
      encryptionSignature: signedMessage,
      encryptionMessage: originalMessage, // Store the original message for sharing
      fileSize: req.file.size,
      tags: [], // Default to empty array
      isPublished: true // Auto-publish content when uploaded
    });

    await content.save();

    // Clean up local file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    sendSuccess(res, {
      id: content._id,
      title: content.title,
      description: content.description,
      creator: content.creator,
      price: content.price,
      type: content.type,
      fileUrl: content.fileUrl, // This will be encrypted and not accessible without purchase
      fileCid: content.fileCid,
      encryptedFileCid: content.encryptedFileCid,
      isEncrypted: content.isEncrypted,
      fileSize: content.fileSize,
      tags: content.tags,
      isPublished: content.isPublished,
      salesCount: content.salesCount,
      viewCount: content.viewCount,
      likeCount: content.likeCount,
      createdAt: content.createdAt
    }, 'Encrypted content created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const { type, search, sortBy, minPrice, maxPrice } = req.query;
    const userWalletAddress = req.user?.walletAddress;

    let query: any = { 
      isPublished: true,
      deletedAt: null // Only show non-deleted content
    };

    // Exclude content from the currently connected wallet (for Browse section)
    if (userWalletAddress) {
      query.creatorWalletAddress = { $ne: userWalletAddress };
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Search query
    if (search) {
      query = { ...query, ...getSearchQuery(search as string) };
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
    }

    const sort = getSortOptions(sortBy as string);

    const content = await Content.find(query)
      .populate('creator', 'username avatar walletAddress')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Content.countDocuments(query);

    sendPaginated(res, content, page, limit, total, 'Content retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getContentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id)
      .populate('creator', 'username avatar walletAddress bio totalEarnings totalSales');

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Increment view count
    content.viewCount += 1;
    await content.save();

    sendSuccess(res, {
      id: content._id,
      title: content.title,
      description: content.description,
      creator: content.creator,
      price: content.price,
      type: content.type,
      fileUrl: content.fileUrl,
      fileCid: content.fileCid,
      thumbnailUrl: content.thumbnailUrl,
      thumbnailCid: content.thumbnailCid,
      fileSize: content.fileSize,
      duration: content.duration,
      tags: content.tags,
      isPublished: content.isPublished,
      salesCount: content.salesCount,
      viewCount: content.viewCount,
      likeCount: content.likeCount,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt
    }, 'Content retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, price, isPublished } = req.body;
    const userId = req.user?._id;

    const content = await Content.findOne({ _id: id, creator: userId });

    if (!content) {
      throw new AppError('Content not found or unauthorized', 404);
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (isPublished !== undefined) updateData.isPublished = isPublished === 'true';

    const updatedContent = await Content.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('creator', 'username avatar walletAddress');

    sendSuccess(res, {
      id: updatedContent!._id,
      title: updatedContent!.title,
      description: updatedContent!.description,
      creator: updatedContent!.creator,
      price: updatedContent!.price,
      type: updatedContent!.type,
      fileUrl: updatedContent!.fileUrl,
      fileCid: updatedContent!.fileCid,
      thumbnailUrl: updatedContent!.thumbnailUrl,
      thumbnailCid: updatedContent!.thumbnailCid,
      fileSize: updatedContent!.fileSize,
      duration: updatedContent!.duration,
      tags: updatedContent!.tags,
      isPublished: updatedContent!.isPublished,
      salesCount: updatedContent!.salesCount,
      viewCount: updatedContent!.viewCount,
      likeCount: updatedContent!.likeCount,
      updatedAt: updatedContent!.updatedAt
    }, 'Content updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      throw new AppError('User wallet address not found', 400);
    }

    const content = await Content.findOne({ _id: id, creatorWalletAddress: userWalletAddress });

    if (!content) {
      throw new AppError('Content not found or unauthorized', 404);
    }

    // Get user's Lighthouse API key for deletion
    const user = await User.findById(userId);
    if (!user || !user.lighthouseApiKey) {
      throw new AppError('User does not have a Lighthouse API key', 400);
    }

    // Delete from Lighthouse (if file exists)
    if (content.fileId) {
      try {
        await LighthouseService.deleteFile(content.fileId, user.lighthouseApiKey);
        console.log(`✅ File deleted from Lighthouse: ${content.fileId}`);
      } catch (lighthouseError) {
        console.error('⚠️ Failed to delete from Lighthouse:', lighthouseError);
        // Continue with DB deletion even if Lighthouse deletion fails
      }
    }

    // Soft delete from database - set deletedAt timestamp
    await Content.findByIdAndUpdate(id, { 
      deletedAt: new Date() 
    });

    sendSuccess(res, null, 'Content deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const userId = req.user?._id;
    const userWalletAddress = req.user?.walletAddress;

    if (!userWalletAddress) {
      throw new AppError('User wallet address not found', 400);
    }

    const content = await Content.find({ 
      creatorWalletAddress: userWalletAddress,
      deletedAt: null // Only show non-deleted content
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Content.countDocuments({ 
      creatorWalletAddress: userWalletAddress,
      deletedAt: null // Only count non-deleted content
    });

    sendPaginated(res, content, page, limit, total, 'User content retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const likeContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const content = await Content.findByIdAndUpdate(
      id,
      { $inc: { likeCount: 1 } },
      { new: true }
    );

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    sendSuccess(res, {
      likeCount: content.likeCount
    }, 'Content liked successfully');
  } catch (error) {
    next(error);
  }
};

export const getTrendingContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 10 } = req.query;

    const content = await Content.find({ isPublished: true })
      .populate('creator', 'username avatar walletAddress')
      .sort({ salesCount: -1, viewCount: -1, likeCount: -1 })
      .limit(parseInt(limit as string));

    sendSuccess(res, content, 'Trending content retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const shareContentWithBuyer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId, buyerWalletAddress, signedMessage } = req.body;
    const ownerId = req.user?._id;

    if (!contentId || !buyerWalletAddress || !signedMessage) {
      throw new AppError('Content ID, buyer wallet address, and signed message are required', 400);
    }

    // Get the content and verify ownership
    const content = await Content.findById(contentId);
    if (!content) {
      throw new AppError('Content not found', 404);
    }

    if (content.creator.toString() !== ownerId) {
      throw new AppError('Unauthorized: You are not the owner of this content', 403);
    }

    if (!content.isEncrypted || !content.encryptedFileCid) {
      throw new AppError('Content is not encrypted or missing encrypted file CID', 400);
    }

    // Get owner's Lighthouse API key
    const owner = await User.findById(ownerId);
    if (!owner || !owner.lighthouseApiKey) {
      throw new AppError('Owner does not have a Lighthouse API key', 400);
    }

    // Share the encrypted file with the buyer
    const shareResult = await LighthouseService.shareEncryptedFile(
      content.encryptedFileCid,
      owner.walletAddress,
      buyerWalletAddress,
      signedMessage
    );

    // Update content sales count
    content.salesCount += 1;
    await content.save();

    sendSuccess(res, {
      contentId: content._id,
      buyerWalletAddress,
      shareResult,
      salesCount: content.salesCount
    }, 'Content shared with buyer successfully');
  } catch (error) {
    next(error);
  }
};
