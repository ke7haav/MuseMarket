import { Request, Response, NextFunction } from 'express';
import User from '@/models/User';
import { sendSuccess, sendError, sendPaginated } from '@/utils/response';
import { generateToken } from '@/middleware/auth';
import { getPaginationOptions } from '@/utils/pagination';
import { AppError } from '@/types';
import LighthouseService from '@/services/lighthouseService';

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletAddress, username, email, bio } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { walletAddress: walletAddress.toLowerCase() },
        { username }
      ]
    });

    if (existingUser) {
      if (existingUser.walletAddress === walletAddress.toLowerCase()) {
        throw new AppError('User with this wallet address already exists', 400);
      }
      if (existingUser.username === username) {
        throw new AppError('Username already taken', 400);
      }
    }

    const user = new User({
      walletAddress: walletAddress.toLowerCase(),
      username,
      email,
      bio
    });

    await user.save();

    const token = generateToken(user._id, user.walletAddress);

    sendSuccess(res, {
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isCreator: user.isCreator,
        totalEarnings: user.totalEarnings,
        totalSales: user.totalSales,
        lighthouseApiKey: user.lighthouseApiKey || null,
        createdAt: user.createdAt
      },
      token
    }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletAddress } = req.body;

    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const token = generateToken(user._id, user.walletAddress);

    sendSuccess(res, {
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isCreator: user.isCreator,
        totalEarnings: user.totalEarnings,
        totalSales: user.totalSales,
        lighthouseApiKey: user.lighthouseApiKey || null,
        createdAt: user.createdAt
      },
      token
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    sendSuccess(res, {
      id: user._id,
      walletAddress: user.walletAddress,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      isCreator: user.isCreator,
      totalEarnings: user.totalEarnings,
      totalSales: user.totalSales,
      createdAt: user.createdAt
    }, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, bio } = req.body;
    const userId = req.user?._id;

    // Check if username is taken by another user
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        throw new AppError('Username already taken', 400);
      }
    }

    // Check if email is taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        throw new AppError('Email already taken', 400);
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { username, email, bio },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    sendSuccess(res, {
      id: user._id,
      walletAddress: user.walletAddress,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      isCreator: user.isCreator,
      totalEarnings: user.totalEarnings,
      totalSales: user.totalSales,
      updatedAt: user.updatedAt
    }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const becomeCreator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { isCreator: true },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    sendSuccess(res, {
      id: user._id,
      isCreator: user.isCreator
    }, 'Successfully became a creator');
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const { search, isCreator } = req.query;

    let query: any = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (isCreator !== undefined) {
      query.isCreator = isCreator === 'true';
    }

    const users = await User.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    sendPaginated(res, users, page, limit, total, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-__v');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    sendSuccess(res, {
      id: user._id,
      walletAddress: user.walletAddress,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      isCreator: user.isCreator,
      totalEarnings: user.totalEarnings,
      totalSales: user.totalSales,
      createdAt: user.createdAt
    }, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const connectWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletAddress, signedMessage } = req.body;

    if (!walletAddress || !signedMessage) {
      throw new AppError('Wallet address and signed message are required', 400);
    }

    // Try to find existing user
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (user) {
      // User exists - login
      console.log('✅ User found, logging in...');
      
      // Generate Lighthouse API key if user doesn't have one
      if (!user.lighthouseApiKey) {
        console.log('🔑 Generating Lighthouse API key for existing user...');
        const apiKey = await LighthouseService.generateApiKey(walletAddress, signedMessage);
        user.lighthouseApiKey = apiKey;
        await user.save();
      }

      const token = generateToken(user._id, user.walletAddress);

      sendSuccess(res, {
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          isCreator: user.isCreator,
          totalEarnings: user.totalEarnings,
          totalSales: user.totalSales,
          lighthouseApiKey: user.lighthouseApiKey,
          createdAt: user.createdAt
        },
        token,
        isNewUser: false
      }, 'Login successful');
    } else {
      // User doesn't exist - register
      console.log('📝 User not found, creating new account...');
      
      const username = `user_${walletAddress.slice(0, 8)}`;
      
      // Create new user (make them a creator by default)
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        username,
        email: undefined, // Don't set email field, let it be undefined
        isCreator: true // Make users creators by default
      });

      await user.save();

      // Generate Lighthouse API key for new user
      console.log('🔑 Generating Lighthouse API key for new user...');
      const apiKey = await LighthouseService.generateApiKey(walletAddress, signedMessage);
      user.lighthouseApiKey = apiKey;
      await user.save();

      const token = generateToken(user._id, user.walletAddress);

      sendSuccess(res, {
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          isCreator: user.isCreator,
          totalEarnings: user.totalEarnings,
          totalSales: user.totalSales,
          lighthouseApiKey: user.lighthouseApiKey,
          createdAt: user.createdAt
        },
        token,
        isNewUser: true
      }, 'User registered successfully', 201);
    }
  } catch (error) {
    next(error);
  }
};

export const generateLighthouseKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletAddress, signedMessage } = req.body;
    const userId = req.user?._id;

    if (!walletAddress || !signedMessage) {
      throw new AppError('Wallet address and signed message are required', 400);
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify the wallet address matches
    if (user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new AppError('Wallet address does not match user account', 400);
    }

    // Generate Lighthouse API key
    const apiKey = await LighthouseService.generateApiKey(walletAddress, signedMessage);

    // Update user with the API key
    user.lighthouseApiKey = apiKey;
    await user.save();

    sendSuccess(res, {
      apiKey,
      message: 'Lighthouse API key generated successfully'
    }, 'API key generated successfully');
  } catch (error) {
    next(error);
  }
};
