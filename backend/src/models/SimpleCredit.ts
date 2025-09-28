import mongoose, { Schema } from 'mongoose';

export interface ISimpleCredit {
  _id: mongoose.Types.ObjectId;
  id?: string;
  user: mongoose.Types.ObjectId;
  creditBalance: number; // Simple credit balance (starts at 100)
  settledTransactions: string[]; // Array of settled transaction hashes
  createdAt: Date;
  updatedAt: Date;
}

const SimpleCreditSchema = new Schema<ISimpleCredit>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  creditBalance: {
    type: Number,
    default: 100,
    min: 0
  },
  settledTransactions: [{
    type: String,
    default: []
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

export default mongoose.model<ISimpleCredit>('SimpleCredit', SimpleCreditSchema);
