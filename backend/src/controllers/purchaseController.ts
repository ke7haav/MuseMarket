import { Request, Response, NextFunction } from 'express';
import Purchase from '@/models/Purchase';
import Content from '@/models/Content';
import User from '@/models/User';
import SharingRequest from '@/models/SharingRequest';
import PyusdVault from '@/models/PyusdVault';
import { sendSuccess, sendPaginated } from '@/utils/response';
import { getPaginationOptions } from '@/utils/pagination';
import { AppError } from '@/types';
import LighthouseService from '@/services/lighthouseService';

export const createPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId } = req.body;
    const buyerId = req.user?._id;

    if (!buyerId) {
      throw new AppError('User not authenticated', 401);
    }

    console.log('🔍 Purchase request:', { contentId, buyerId });

    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Check if user already purchased this content
    const existingPurchase = await Purchase.findOne({
      buyer: buyerId,
      content: contentId
    });

    if (existingPurchase) {
      throw new AppError('Content already purchased', 400);
    }

    // Create purchase record - NO VAULT LOGIC
    const purchase = new Purchase({
      buyer: buyerId,
      content: contentId,
      amount: content.price,
      transactionHash: `credit_${Date.now()}` // Credit transaction
    });

    await purchase.save();

    // Update content sales count
    await Content.findByIdAndUpdate(contentId, { $inc: { salesCount: 1 } });

    // Populate the purchase with content and buyer details
    await purchase.populate([
      { path: 'content', select: 'title type price creator fileUrl fileCid encryptedFileCid isEncrypted' },
      { path: 'buyer', select: 'username walletAddress' }
    ]);

    console.log('✅ Purchase created successfully:', purchase._id);

    sendSuccess(res, {
      id: purchase._id,
      buyer: purchase.buyer,
      content: purchase.content,
      amount: purchase.amount,
      transactionHash: purchase.transactionHash,
      status: purchase.status,
      createdAt: purchase.createdAt
    }, 'Purchase created successfully', 201);
  } catch (error) {
    console.error('❌ Purchase error:', error);
    next(error);
  }
};

export const getUserPurchases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const purchases = await Purchase.find({ buyer: userId })
      .populate('content', 'title type price fileUrl fileCid thumbnailUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Purchase.countDocuments({ buyer: userId });

    sendPaginated(res, purchases, page, limit, total, 'User purchases retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getPurchaseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const purchase = await Purchase.findOne({ _id: id, buyer: userId })
      .populate('content', 'title type price fileUrl fileCid thumbnailUrl creator')
      .populate('buyer', 'username walletAddress');

    if (!purchase) {
      throw new AppError('Purchase not found', 404);
    }

    sendSuccess(res, {
      id: purchase._id,
      buyer: purchase.buyer,
      content: purchase.content,
      amount: purchase.amount,
      transactionHash: purchase.transactionHash,
      status: purchase.status,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt
    }, 'Purchase retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const purchase = await Purchase.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate([
      { path: 'content', select: 'title type price' },
      { path: 'buyer', select: 'username walletAddress' }
    ]);

    if (!purchase) {
      throw new AppError('Purchase not found', 404);
    }

    sendSuccess(res, {
      id: purchase._id,
      buyer: purchase.buyer,
      content: purchase.content,
      amount: purchase.amount,
      transactionHash: purchase.transactionHash,
      status: purchase.status,
      updatedAt: purchase.updatedAt
    }, 'Purchase status updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getCreatorSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const userId = req.user?._id;

    // Get all content created by the user
    const userContent = await Content.find({ creator: userId }).select('_id');
    const contentIds = userContent.map(content => content._id);

    // Get purchases for user's content
    const purchases = await Purchase.find({ content: { $in: contentIds } })
      .populate('content', 'title type price')
      .populate('buyer', 'username walletAddress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Purchase.countDocuments({ content: { $in: contentIds } });

    sendPaginated(res, purchases, page, limit, total, 'Creator sales retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getPurchaseStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    // Get user's purchase statistics
    const totalPurchases = await Purchase.countDocuments({ buyer: userId });
    const totalSpent = await Purchase.aggregate([
      { $match: { buyer: userId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get user's sales statistics (if creator)
    const userContent = await Content.find({ creator: userId }).select('_id');
    const contentIds = userContent.map(content => content._id);

    const totalSales = await Purchase.countDocuments({ 
      content: { $in: contentIds },
      status: 'completed'
    });

    const totalEarnings = await Purchase.aggregate([
      { $match: { content: { $in: contentIds }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    sendSuccess(res, {
      purchases: {
        total: totalPurchases,
        totalSpent: totalSpent[0]?.total || 0
      },
      sales: {
        total: totalSales,
        totalEarnings: totalEarnings[0]?.total || 0
      }
    }, 'Purchase statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Sharing request endpoints
export const getSharingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const userId = req.user?._id;

    const sharingRequests = await SharingRequest.find({ owner: userId })
      .populate('content', 'title type price fileUrl fileCid encryptedFileCid isEncrypted')
      .populate('buyer', 'username walletAddress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SharingRequest.countDocuments({ owner: userId });

    sendPaginated(res, sharingRequests, page, limit, total, 'Sharing requests retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const approveSharingRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { signedMessage } = req.body;
    const userId = req.user?._id;

    const sharingRequest = await SharingRequest.findOne({ 
      _id: id, 
      owner: userId, 
      status: 'pending' 
    }).populate('content');

    if (!sharingRequest) {
      throw new AppError('Sharing request not found or already processed', 404);
    }

    if (!signedMessage) {
      throw new AppError('Signed message is required for approval', 400);
    }

    try {
      // Share the encrypted file with the buyer
      const shareResponse = await LighthouseService.shareEncryptedFile(
        sharingRequest.cid,
        sharingRequest.ownerWalletAddress,
        sharingRequest.buyerWalletAddress,
        signedMessage
      );

      console.log('✅ Content shared successfully:', shareResponse);

      // Update sharing request status
      sharingRequest.status = 'approved';
      await sharingRequest.save();

      sendSuccess(res, {
        id: sharingRequest._id,
        status: sharingRequest.status,
        approvedAt: sharingRequest.approvedAt,
        shareResponse
      }, 'Sharing request approved and content shared successfully');

    } catch (shareError: any) {
      console.error('❌ Error sharing content:', shareError);
      throw new AppError('Failed to share content with buyer', 500);
    }
  } catch (error) {
    next(error);
  }
};

export const rejectSharingRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const sharingRequest = await SharingRequest.findOne({ 
      _id: id, 
      owner: userId, 
      status: 'pending' 
    });

    if (!sharingRequest) {
      throw new AppError('Sharing request not found or already processed', 404);
    }

    sharingRequest.status = 'rejected';
    await sharingRequest.save();

    sendSuccess(res, {
      id: sharingRequest._id,
      status: sharingRequest.status,
      rejectedAt: sharingRequest.rejectedAt
    }, 'Sharing request rejected successfully');
  } catch (error) {
    next(error);
  }
};

// Settlement function - reset credit and handle real PYUSD transaction
export const settleCredit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { transactionHash } = req.body; // Real blockchain transaction hash

    // Get user's vault
    const userVault = await PyusdVault.findOne({ user: userId });
    if (!userVault) {
      throw new AppError('Vault not found', 404);
    }

    // Get all pending purchases (credit used)
    const pendingPurchases = await Purchase.find({ 
      buyer: userId,
      transactionHash: { $regex: /^credit_/ }
    }).populate('content', 'creator price');

    if (pendingPurchases.length === 0) {
      throw new AppError('No pending purchases to settle', 400);
    }

    // Calculate total amount to settle
    const totalAmount = pendingPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);

    // Reset credit (this simulates paying off the credit)
    userVault.creditUsed = 0;
    userVault.transactionHistory.push({
      type: 'monthly_payment',
      amount: totalAmount,
      description: `Settled credit with real PYUSD transaction: ${transactionHash}`,
      transactionHash: transactionHash,
      createdAt: new Date()
    });
    await userVault.save();

    // Update all pending purchases to show they're settled
    await Purchase.updateMany(
      { buyer: userId, transactionHash: { $regex: /^credit_/ } },
      { transactionHash: `settled_${transactionHash}` }
    );

    // TODO: Here you would implement the actual PYUSD transfer to content creators
    // For now, we'll just log it
    console.log(`💰 Settlement: ${totalAmount} PYUSD should be distributed to creators`);

    sendSuccess(res, {
      totalAmount,
      transactionHash,
      settledPurchases: pendingPurchases.length,
      newCreditAvailable: userVault.creditLimit
    }, 'Credit settled successfully');
  } catch (error) {
    next(error);
  }
};
