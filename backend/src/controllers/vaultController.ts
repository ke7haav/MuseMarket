import { Request, Response, NextFunction } from 'express';
import PyusdVault from '@/models/PyusdVault';
import User from '@/models/User';
import { sendSuccess, sendPaginated } from '@/utils/response';
import { getPaginationOptions } from '@/utils/pagination';
import { AppError } from '@/types';
import PyusdService from '@/services/pyusdService';

// Get or create vault for user
export const getVault = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get or create vault
    let vault = await PyusdVault.findOne({ user: userId });
    
    if (!vault) {
      // Try to get current balance from blockchain, fallback to 0 if fails
      let blockchainBalance = 0;
      try {
        blockchainBalance = await PyusdService.getBalance(user.walletAddress);
      } catch (error) {
        console.log('⚠️ Could not fetch blockchain balance, using 0 as default');
        blockchainBalance = 0;
      }
      
      vault = new PyusdVault({
        user: userId,
        walletAddress: user.walletAddress,
        balance: blockchainBalance,
        creditLimit: 100, // Default credit limit
        creditUsed: 0,
        totalDeposited: blockchainBalance,
        totalSpent: 0,
        monthlyBill: 0,
        lastBillingDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isCreditEnabled: true,
        transactionHistory: blockchainBalance > 0 ? [{
          type: 'deposit',
          amount: blockchainBalance,
          description: 'Initial vault balance from blockchain',
          createdAt: new Date()
        }] : []
      });
      
      await vault.save();
    } else {
      // Try to update balance from blockchain, keep current if fails
      try {
        const blockchainBalance = await PyusdService.getBalance(user.walletAddress);
        vault.balance = blockchainBalance;
        await vault.save();
      } catch (error) {
        console.log('⚠️ Could not update blockchain balance, keeping current balance');
      }
    }

    // Populate user details
    await vault.populate('user', 'username walletAddress');

    sendSuccess(res, {
      id: vault._id,
      user: vault.user,
      walletAddress: vault.walletAddress,
      balance: vault.balance,
      creditLimit: vault.creditLimit,
      creditUsed: vault.creditUsed,
      creditAvailable: vault.creditLimit - vault.creditUsed,
      totalDeposited: vault.totalDeposited,
      totalSpent: vault.totalSpent,
      monthlyBill: vault.monthlyBill,
      lastBillingDate: vault.lastBillingDate,
      nextBillingDate: vault.nextBillingDate,
      isCreditEnabled: vault.isCreditEnabled,
      transactionHistory: vault.transactionHistory.slice(-10) // Last 10 transactions
    }, 'Vault retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get vault balance
export const getVaultBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Try to get current balance from blockchain, fallback to vault balance
    let balance = 0;
    try {
      balance = await PyusdService.getBalance(user.walletAddress);
    } catch (error) {
      console.log('⚠️ Could not fetch blockchain balance, using vault balance');
      const vault = await PyusdVault.findOne({ user: userId });
      balance = vault?.balance || 0;
    }

    // Update vault balance if we got a valid blockchain balance
    if (balance >= 0) {
      await PyusdVault.findOneAndUpdate(
        { user: userId },
        { balance },
        { upsert: true, new: true }
      );
    }

    sendSuccess(res, {
      balance,
      walletAddress: user.walletAddress
    }, 'Vault balance retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Record a deposit transaction
export const recordDeposit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionHash, amount, description } = req.body;
    const userId = req.user?._id;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Validate transaction
    const isValid = await PyusdService.validateTransaction(
      transactionHash,
      user.walletAddress, // From user's wallet
      user.walletAddress, // To user's wallet (deposit)
      amount
    );

    if (!isValid) {
      throw new AppError('Invalid transaction', 400);
    }

    // Update vault
    const vault = await PyusdVault.findOneAndUpdate(
      { user: userId },
      {
        $inc: { balance: amount },
        $push: {
          transactionHistory: {
            type: 'deposit',
            amount,
            description: description || 'PYUSD deposit',
            transactionHash,
            createdAt: new Date()
          }
        }
      },
      { upsert: true, new: true }
    );

    sendSuccess(res, {
      id: vault._id,
      balance: vault.balance,
      transactionHash
    }, 'Deposit recorded successfully');
  } catch (error) {
    next(error);
  }
};

// Record a purchase transaction
export const recordPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, contentId, description } = req.body;
    const userId = req.user?._id;
    
    const vault = await PyusdVault.findOne({ user: userId });
    if (!vault) {
      throw new AppError('Vault not found', 404);
    }

    if (vault.balance < amount) {
      throw new AppError('Insufficient vault balance', 400);
    }

    // Update vault
    vault.balance -= amount;
    vault.transactionHistory.push({
      type: 'purchase',
      amount,
      description: description || 'Content purchase',
      contentId,
      createdAt: new Date()
    });

    await vault.save();

    sendSuccess(res, {
      id: vault._id,
      balance: vault.balance,
      amount
    }, 'Purchase recorded successfully');
  } catch (error) {
    next(error);
  }
};

// Record an earning transaction
export const recordEarning = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, contentId, description } = req.body;
    const userId = req.user?._id;
    
    const vault = await PyusdVault.findOneAndUpdate(
      { user: userId },
      {
        $inc: { balance: amount },
        $push: {
          transactionHistory: {
            type: 'earning',
            amount,
            description: description || 'Content sale earning',
            contentId,
            createdAt: new Date()
          }
        }
      },
      { upsert: true, new: true }
    );

    sendSuccess(res, {
      id: vault._id,
      balance: vault.balance,
      amount
    }, 'Earning recorded successfully');
  } catch (error) {
    next(error);
  }
};

// Get transaction history
export const getTransactionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const userId = req.user?._id;
    const { type } = req.query;

    const vault = await PyusdVault.findOne({ user: userId });
    if (!vault) {
      throw new AppError('Vault not found', 404);
    }

    let transactions = vault.transactionHistory;

    // Filter by type if specified
    if (type && ['deposit', 'withdrawal', 'purchase', 'earning', 'refund'].includes(type as string)) {
      transactions = transactions.filter(tx => tx.type === type);
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate
    const paginatedTransactions = transactions.slice(skip, skip + limit);

    sendPaginated(res, paginatedTransactions, page, limit, transactions.length, 'Transaction history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get PYUSD contract info
export const getPyusdInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let contractInfo;
    try {
      contractInfo = await PyusdService.getContractInfo();
    } catch (error) {
      console.log('⚠️ Could not fetch contract info from blockchain, using defaults');
      contractInfo = {
        name: 'PayPal USD',
        symbol: 'PYUSD',
        decimals: 6
      };
    }
    
    sendSuccess(res, {
      ...contractInfo,
      contractAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
      network: 'Sepolia'
    }, 'PYUSD contract info retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get blockchain transaction history
export const getBlockchainHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { limit = 10 } = req.query;
    const history = await PyusdService.getTransactionHistory(user.walletAddress, Number(limit));

    sendSuccess(res, history, 'Blockchain transaction history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Pay monthly bill
export const payMonthlyBill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const userWalletAddress = req.user?.walletAddress;

    if (!userId || !userWalletAddress) {
      throw new AppError('User not authenticated or wallet address missing', 401);
    }

    const vault = await PyusdVault.findOne({ user: userId });
    if (!vault) {
      throw new AppError('Vault not found', 404);
    }

    if (vault.monthlyBill <= 0) {
      throw new AppError('No outstanding monthly bill', 400);
    }

    // Check if user has enough balance to pay the bill
    if (vault.balance < vault.monthlyBill) {
      throw new AppError('Insufficient balance to pay monthly bill', 400);
    }

    const billAmount = vault.monthlyBill;

    // Deduct the monthly bill from balance
    vault.balance -= billAmount;
    vault.creditUsed = 0; // Reset credit used
    vault.monthlyBill = 0; // Reset monthly bill
    vault.lastBillingDate = new Date();
    vault.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    vault.transactionHistory.push({
      type: 'monthly_payment',
      amount: billAmount,
      description: 'Monthly bill payment',
      createdAt: new Date()
    });

    await vault.save();

    sendSuccess(res, {
      id: vault._id,
      balance: vault.balance,
      creditUsed: vault.creditUsed,
      creditAvailable: vault.creditLimit - vault.creditUsed,
      monthlyBill: vault.monthlyBill,
      nextBillingDate: vault.nextBillingDate,
      transaction: vault.transactionHistory[vault.transactionHistory.length - 1]
    }, 'Monthly bill paid successfully');
  } catch (error) {
    next(error);
  }
};

// Update credit limit
export const updateCreditLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { creditLimit } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (creditLimit < 0 || creditLimit > 10000) {
      throw new AppError('Credit limit must be between 0 and 10,000 PYUSD', 400);
    }

    const vault = await PyusdVault.findOne({ user: userId });
    if (!vault) {
      throw new AppError('Vault not found', 404);
    }

    const oldLimit = vault.creditLimit;
    vault.creditLimit = creditLimit;

    vault.transactionHistory.push({
      type: 'credit_limit_increase',
      amount: creditLimit - oldLimit,
      description: `Credit limit updated from ${oldLimit} to ${creditLimit} PYUSD`,
      createdAt: new Date()
    });

    await vault.save();

    sendSuccess(res, {
      id: vault._id,
      creditLimit: vault.creditLimit,
      creditUsed: vault.creditUsed,
      creditAvailable: vault.creditLimit - vault.creditUsed,
      transaction: vault.transactionHistory[vault.transactionHistory.length - 1]
    }, 'Credit limit updated successfully');
  } catch (error) {
    next(error);
  }
};
