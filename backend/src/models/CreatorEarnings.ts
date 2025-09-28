import mongoose, { Schema } from 'mongoose';

export interface ICreatorEarnings {
  _id: mongoose.Types.ObjectId;
  id?: string;
  creator: mongoose.Types.ObjectId; // Creator user ID
  content: mongoose.Types.ObjectId; // Content ID
  purchase: mongoose.Types.ObjectId; // Purchase ID
  amount: number; // Amount earned from this purchase
  status: 'pending' | 'claimed'; // Whether creator has claimed this earning
  claimedAt?: Date; // When it was claimed
  transactionHash?: string; // Settlement transaction hash
  createdAt: Date;
  updatedAt: Date;
}

const CreatorEarningsSchema = new Schema<ICreatorEarnings>({
  creator: {
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
  purchase: {
    type: Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'claimed'],
    default: 'pending',
    index: true
  },
  claimedAt: {
    type: Date
  },
  transactionHash: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      const { _id, __v, ...rest } = ret;
      return rest;
    }
  }
});

// Compound indexes for better query performance
CreatorEarningsSchema.index({ creator: 1, status: 1 });
CreatorEarningsSchema.index({ content: 1, status: 1 });
CreatorEarningsSchema.index({ purchase: 1 });
CreatorEarningsSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ICreatorEarnings>('CreatorEarnings', CreatorEarningsSchema);
