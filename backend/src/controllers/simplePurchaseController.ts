import { Request, Response, NextFunction } from 'express';
import Purchase from '@/models/Purchase';
import Content from '@/models/Content';
import User from '@/models/User';
import SimpleCredit from '@/models/SimpleCredit';
import CreatorEarnings from '@/models/CreatorEarnings';
import { sendSuccess, sendPaginated } from '@/utils/response';
import { getPaginationOptions } from '@/utils/pagination';
import { AppError } from '@/types';
import WalletService from '@/services/walletService';

export const createPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId } = req.body;
    const buyerId = req.user?._id;

    console.log('🔍 Simple Purchase request:', { contentId, buyerId });

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

    // Get or create user's simple credit
    let userCredit = await SimpleCredit.findOne({ user: buyerId });
    if (!userCredit) {
      userCredit = new SimpleCredit({
        user: buyerId,
        creditBalance: 100 // Start with 100 credit
      });
      await userCredit.save();
    }

    // Check if user has enough credit
    if (userCredit.creditBalance < content.price) {
      throw new AppError('Insufficient credit', 400);
    }

    // Deduct from credit
    userCredit.creditBalance -= content.price;
    await userCredit.save();

    console.log('✅ Credit deducted:', {
      userId: buyerId,
      amount: content.price,
      remainingCredit: userCredit.creditBalance
    });

    // Create purchase record
    const purchase = new Purchase({
      buyer: buyerId,
      content: contentId,
      amount: content.price,
      transactionHash: `credit_${Date.now()}`,
      status: 'completed'
    });

    await purchase.save();

    // Update content sales count
    await Content.findByIdAndUpdate(contentId, { $inc: { salesCount: 1 } });

    // Create creator earnings record
    const creatorEarnings = new CreatorEarnings({
      creator: content.creator,
      content: contentId,
      purchase: purchase._id,
      amount: content.price,
      status: 'pending'
    });
    await creatorEarnings.save();

    console.log('💰 Creator earnings recorded:', {
      creator: content.creator,
      amount: content.price,
      contentId: contentId
    });

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
      createdAt: purchase.createdAt,
      remainingCredit: userCredit.creditBalance
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

export const getCreditBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    let userCredit = await SimpleCredit.findOne({ user: userId });
    if (!userCredit) {
      userCredit = new SimpleCredit({
        user: userId,
        creditBalance: 100
      });
      await userCredit.save();
    }

    sendSuccess(res, {
      creditBalance: userCredit.creditBalance,
      userId: userId
    }, 'Credit balance retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const settleCredit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { transactionHash } = req.body; // Real blockchain transaction hash

    // Get user's credit
    const userCredit = await SimpleCredit.findOne({ user: userId });
    if (!userCredit) {
      throw new AppError('Credit not found', 404);
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

    // Validate transaction hash format
    if (!transactionHash || typeof transactionHash !== 'string') {
      throw new AppError('Valid transaction hash is required', 400);
    }

    // Check if transaction hash is already used
    if (userCredit.settledTransactions.includes(transactionHash)) {
      throw new AppError('Transaction hash already used for settlement', 400);
    }

    // Reset credit to 100 (this simulates paying off the credit)
    userCredit.creditBalance = 100;
    userCredit.settledTransactions.push(transactionHash);
    await userCredit.save();

    // Update all pending purchases to show they're settled
    await Purchase.updateMany(
      { buyer: userId, transactionHash: { $regex: /^credit_/ } },
      { transactionHash: `settled_${transactionHash}` }
    );

        // Update creator earnings with settlement transaction hash but keep as pending
        // Creators still need to manually claim their earnings
        const purchaseIds = pendingPurchases.map(p => p._id);
        await CreatorEarnings.updateMany(
          { purchase: { $in: purchaseIds } },
          { 
            transactionHash: transactionHash
            // Note: NOT marking as claimed - creators must claim manually
          }
        );

    console.log(`💰 Settlement completed: ${totalAmount} PYUSD settled for transaction ${transactionHash}`);
    console.log(`📊 Updated ${purchaseIds.length} creator earnings with settlement transaction hash (still pending claim)`);

    sendSuccess(res, {
      totalAmount,
      transactionHash,
      settledPurchases: pendingPurchases.length,
      newCreditBalance: userCredit.creditBalance,
      message: 'Credit settled successfully. Creator earnings are now available for claiming.'
    }, 'Credit settled successfully');
  } catch (error) {
    next(error);
  }
};

// Get creator earnings (pending and claimed)
export const getCreatorEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const userId = req.user?._id;

    const earnings = await CreatorEarnings.find({ creator: userId })
      .populate('content', 'title type price')
      .populate('purchase', 'buyer amount createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CreatorEarnings.countDocuments({ creator: userId });

    // Calculate summary
    const summary = await CreatorEarnings.aggregate([
      { $match: { creator: userId } },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const summaryData = {
      pending: { amount: 0, count: 0 },
      claimed: { amount: 0, count: 0 }
    };

    summary.forEach(item => {
      summaryData[item._id as keyof typeof summaryData] = {
        amount: item.totalAmount,
        count: item.count
      };
    });

    sendSuccess(res, {
      earnings,
      summary: summaryData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Creator earnings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Claim creator earnings
export const claimCreatorEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError('Valid amount is required', 400);
    }

    // Get creator's wallet address
    const creator = await User.findById(userId).select('walletAddress');
    if (!creator || !creator.walletAddress) {
      throw new AppError('Creator wallet address not found. Please connect your wallet first.', 400);
    }

    // Get all pending earnings for the creator
    const pendingEarnings = await CreatorEarnings.find({ 
      creator: userId, 
      status: 'pending' 
    }).sort({ createdAt: 1 }); // Oldest first

    if (pendingEarnings.length === 0) {
      throw new AppError('No pending earnings to claim', 400);
    }

    // Calculate total pending amount
    const totalPendingAmount = pendingEarnings.reduce((sum, earning) => sum + earning.amount, 0);

    if (amount > totalPendingAmount) {
      throw new AppError(`Cannot claim more than available. Pending: ${totalPendingAmount} PYUSD`, 400);
    }

    console.log(`💰 Processing claim: ${amount} PYUSD to ${creator.walletAddress}`);

    // Perform actual PYUSD transfer
    let transferTransactionHash: string;
    try {
      const transferResult = await WalletService.transferPYUSD(
        creator.walletAddress,
        amount
      );
      transferTransactionHash = transferResult.transactionHash;
      console.log(`✅ PYUSD transfer successful: ${transferTransactionHash}`);
    } catch (transferError: any) {
      console.error('❌ PYUSD transfer failed:', transferError);
      throw new AppError(`Failed to transfer PYUSD: ${transferError.message}`, 500);
    }

    // Mark earnings as claimed (in order of oldest first)
    let remainingToClaim = amount;
    const claimedEarnings = [];

    for (const earning of pendingEarnings) {
      if (remainingToClaim <= 0) break;

      const claimAmount = Math.min(remainingToClaim, earning.amount);
      
      // Update the earning record
      earning.status = 'claimed';
      earning.claimedAt = new Date();
      earning.transactionHash = transferTransactionHash; // Use actual blockchain transaction hash
      await earning.save();

      claimedEarnings.push({
        id: earning._id,
        amount: claimAmount,
        content: earning.content,
        claimedAt: earning.claimedAt,
        transactionHash: transferTransactionHash
      });

      remainingToClaim -= claimAmount;
    }

    // Update creator's total earnings in User model
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        totalEarnings: amount,
        totalSales: claimedEarnings.length 
      }
    });

    console.log(`💰 Creator ${userId} claimed ${amount} PYUSD from ${claimedEarnings.length} earnings`);
    console.log(`🔗 Transaction hash: ${transferTransactionHash}`);

    sendSuccess(res, {
      claimedAmount: amount,
      claimedEarnings: claimedEarnings.length,
      remainingPending: totalPendingAmount - amount,
      transactionHash: transferTransactionHash,
      recipientWallet: creator.walletAddress,
      claimedAt: new Date()
    }, 'Earnings claimed and transferred successfully');
  } catch (error) {
    next(error);
  }
};
