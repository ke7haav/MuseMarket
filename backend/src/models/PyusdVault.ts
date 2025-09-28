import mongoose, { Schema } from 'mongoose';

export interface IPyusdVault {
  _id: mongoose.Types.ObjectId;
  id?: string; // Virtual field for JSON transformation
  user: mongoose.Types.ObjectId;
  walletAddress: string;
  balance: number; // PYUSD balance (6 decimals)
  creditLimit: number; // Credit limit for the user
  creditUsed: number; // Amount of credit currently used
  totalDeposited: number; // Total PYUSD ever deposited
  totalSpent: number; // Total PYUSD ever spent
  monthlyBill: number; // Current month's bill amount
  lastBillingDate: Date; // Last time monthly bill was generated
  nextBillingDate: Date; // Next billing date
  isCreditEnabled: boolean; // Whether user has opted for credit system
  transactionHistory: Array<{
    type: 'deposit' | 'withdrawal' | 'purchase' | 'earning' | 'refund' | 'credit_used' | 'monthly_payment' | 'credit_limit_increase';
    amount: number;
    description: string;
    contentId?: mongoose.Types.ObjectId;
    transactionHash?: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PyusdVaultSchema = new Schema<IPyusdVault>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  creditLimit: {
    type: Number,
    default: 100, // Default credit limit of 100 PYUSD
    min: 0
  },
  creditUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeposited: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyBill: {
    type: Number,
    default: 0,
    min: 0
  },
  lastBillingDate: {
    type: Date,
    default: Date.now
  },
  nextBillingDate: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  isCreditEnabled: {
    type: Boolean,
    default: true // Default to credit system
  },
  transactionHistory: [{
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'purchase', 'earning', 'refund', 'credit_used', 'monthly_payment', 'credit_limit_increase'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content'
    },
    transactionHash: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
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

// Indexes for better query performance
PyusdVaultSchema.index({ balance: -1 });
PyusdVaultSchema.index({ 'transactionHistory.createdAt': -1 });

// Pre-save middleware to update totals and credit calculations
PyusdVaultSchema.pre('save', function(next) {
  // Calculate totals from transaction history
  this.totalDeposited = this.transactionHistory
    .filter(tx => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  this.totalSpent = this.transactionHistory
    .filter(tx => ['purchase', 'withdrawal'].includes(tx.type))
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  // Calculate credit used (purchases made with credit)
  this.creditUsed = this.transactionHistory
    .filter(tx => tx.type === 'credit_used')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  // Calculate monthly bill (credit used since last billing date)
  const lastBilling = this.lastBillingDate || this.createdAt;
  this.monthlyBill = this.transactionHistory
    .filter(tx => tx.type === 'credit_used' && tx.createdAt >= lastBilling)
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  next();
});

export default mongoose.model<IPyusdVault>('PyusdVault', PyusdVaultSchema);
