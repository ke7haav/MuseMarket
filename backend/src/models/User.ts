import mongoose, { Schema } from 'mongoose';
import { IUser } from '@/types';

const UserSchema = new Schema<IUser>({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  isCreator: {
    type: Boolean,
    default: false
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSales: {
    type: Number,
    default: 0,
    min: 0
  },
  lighthouseApiKey: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      const { _id, __v, ...rest } = ret;
      return rest;
    }
  }
});

// Indexes for better query performance
UserSchema.index({ isCreator: 1 });
UserSchema.index({ totalEarnings: -1 });
UserSchema.index({ createdAt: -1 });

// Virtual for user's content count
UserSchema.virtual('contentCount', {
  ref: 'Content',
  localField: '_id',
  foreignField: 'creator',
  count: true
});

// Virtual for user's purchase count
UserSchema.virtual('purchaseCount', {
  ref: 'Purchase',
  localField: '_id',
  foreignField: 'buyer',
  count: true
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IUser>('User', UserSchema);
