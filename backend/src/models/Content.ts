import mongoose, { Schema } from 'mongoose';
import { IContent, ContentType } from '@/types';

const ContentSchema = new Schema<IContent>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  creatorWalletAddress: {
    type: String,
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    max: 10000 // Max 10,000 PYUSD
  },
  type: {
    type: String,
    enum: ['music', 'ebook', 'video', 'course'] as ContentType[],
    required: true,
    index: true
  },
  fileUrl: {
    type: String,
    default: ''
  },
  fileCid: {
    type: String,
    default: '',
    index: true
  },
  fileId: {
    type: String,
    default: '',
    index: true
  },
  // Encrypted file fields
  encryptedFileCid: {
    type: String,
    default: '',
    index: true
  },
  encryptedFileId: {
    type: String,
    default: '',
    index: true
  },
  isEncrypted: {
    type: Boolean,
    default: true,
    index: true
  },
  encryptionSignature: {
    type: String,
    default: ''
  },
  encryptionMessage: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  thumbnailCid: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  salesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      const { _id, __v, ...rest } = ret;
      return rest;
    }
  }
});

// Indexes for better query performance
ContentSchema.index({ creator: 1, isPublished: 1, deletedAt: 1 });
ContentSchema.index({ type: 1, isPublished: 1, deletedAt: 1 });
ContentSchema.index({ price: 1, isPublished: 1, deletedAt: 1 });
ContentSchema.index({ salesCount: -1 });
ContentSchema.index({ viewCount: -1 });
ContentSchema.index({ likeCount: -1 });
ContentSchema.index({ createdAt: -1 });
ContentSchema.index({ deletedAt: 1 }); // For soft delete queries
ContentSchema.index({ 
  title: 'text', 
  description: 'text'
}, {
  weights: {
    title: 10,
    description: 5
  }
});

// Virtual for total revenue
ContentSchema.virtual('totalRevenue').get(function(this: IContent) {
  return this.price * this.salesCount;
});

// Virtual for average rating (if we add ratings later)
ContentSchema.virtual('averageRating').get(function(this: IContent) {
  // This would be calculated from a separate ratings collection
  return 0;
});

// Ensure virtual fields are serialized
ContentSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update creator's total sales
ContentSchema.pre('save', async function(this: IContent, next) {
  if (this.isModified('salesCount')) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.creator, {
      $inc: { totalSales: this.salesCount }
    });
  }
  next();
});

export default mongoose.model<IContent>('Content', ContentSchema);
