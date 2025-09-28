import { Request, Response, NextFunction } from 'express';
import walletService from '@/services/walletService';
import { sendSuccess } from '@/utils/response';
import { AppError } from '@/types';

// Get platform wallet information
export const getWalletInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const walletInfo = walletService.getWalletInfo();
    
    sendSuccess(res, walletInfo, 'Platform wallet information retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get platform wallet balance
export const getWalletBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const balance = await walletService.getPlatformBalance();
    const hasEnoughGas = await walletService.hasEnoughGas();
    
    sendSuccess(res, {
      balance: balance,
      balanceEth: parseFloat(balance).toFixed(6),
      hasEnoughGas: hasEnoughGas,
      address: walletService.getPlatformAddress()
    }, 'Platform wallet balance retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Generate a new wallet (for development/testing)
export const generateWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Wallet generation not allowed in production', 403);
    }

    const newWallet = walletService.generateNewWallet();
    
    sendSuccess(res, {
      address: newWallet.address,
      privateKey: newWallet.privateKey,
      mnemonic: newWallet.mnemonic,
      network: 'sepolia',
      message: 'Generated new wallet for development. Fund with Sepolia ETH for testing.'
    }, 'New wallet generated successfully');
  } catch (error) {
    next(error);
  }
};

// Validate an address
export const validateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      throw new AppError('Address is required', 400);
    }

    const isValid = walletService.isValidAddress(address);
    
    sendSuccess(res, {
      address: address,
      isValid: isValid
    }, 'Address validation completed');
  } catch (error) {
    next(error);
  }
};
