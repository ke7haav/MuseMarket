import mongoose, { Schema } from 'mongoose';
import { IPurchase } from '@/types';

const PurchaseSchema = new Schema<IPurchase>({
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true
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

// Compound indexes for better query performance
PurchaseSchema.index({ buyer: 1, createdAt: -1 });
PurchaseSchema.index({ content: 1, createdAt: -1 });
PurchaseSchema.index({ status: 1, createdAt: -1 });

// Virtual for purchase date
PurchaseSchema.virtual('purchaseDate').get(function() {
  return this.createdAt;
});

// Ensure virtual fields are serialized
PurchaseSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update content sales count and creator earnings
PurchaseSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    const Content = mongoose.model('Content');
    const User = mongoose.model('User');
    
    // Update content sales count
    await Content.findByIdAndUpdate(this.content, {
      $inc: { salesCount: 1 }
    });
    
    // Update creator's total earnings
    const content = await Content.findById(this.content).populate('creator');
    if (content) {
      await User.findByIdAndUpdate(content.creator, {
        $inc: { totalEarnings: this.amount }
      });
    }
  }
  next();
});

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);
