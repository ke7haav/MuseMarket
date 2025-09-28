import mongoose, { Schema } from 'mongoose';

export interface ISharingRequest {
  _id: mongoose.Types.ObjectId;
  id?: string; // Virtual field for JSON transformation
  content: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  buyerWalletAddress: string;
  ownerWalletAddress: string;
  cid: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  expiresAt: Date;
}

const SharingRequestSchema = new Schema<ISharingRequest>({
  content: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  buyerWalletAddress: {
    type: String,
    required: true,
    index: true
  },
  ownerWalletAddress: {
    type: String,
    required: true,
    index: true
  },
  cid: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
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
SharingRequestSchema.index({ content: 1, buyer: 1 });
SharingRequestSchema.index({ owner: 1, status: 1 });
SharingRequestSchema.index({ status: 1, createdAt: -1 });
SharingRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired requests

// Pre-save middleware to set expiration date (24 hours from now)
SharingRequestSchema.pre('save', function(next) {
  if (this.isNew) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  next();
});

// Pre-save middleware to set approval/rejection timestamps
SharingRequestSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'approved') {
      this.approvedAt = new Date();
    } else if (this.status === 'rejected') {
      this.rejectedAt = new Date();
    }
  }
  next();
});

export default mongoose.model<ISharingRequest>('SharingRequest', SharingRequestSchema);
