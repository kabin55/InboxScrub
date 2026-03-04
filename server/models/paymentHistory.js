import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const paymentHistorySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  transaction_id: {
    type: String,
    required: true,
    unique: true,
  },
  
  credits_added: {
    type: Number,
    required: true,
  },
  amount_paid: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  payment_method: {
    type: String,
    enum: ["stripe", "Esewa", "Khalti", "PayPal"],
    required: true,
  },
  payment_date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

paymentHistorySchema.index({ user_id: 1, payment_date: -1 });

export default mongoose.model("PaymentHistory", paymentHistorySchema);
 