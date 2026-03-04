import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const creditSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  credits: {
    type: Number,
    default: 0,
  },
  total_credits: {
    type: Number,
    default: 0,
  },
  massMalingCredits: {
    type: Number,
    default: 0,
  },
  last_updated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

creditSchema.index({ user_id: 1 });

export default mongoose.model("Credit", creditSchema);
