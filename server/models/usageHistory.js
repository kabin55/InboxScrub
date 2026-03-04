import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const usageHistorySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  email_checked: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  // 'single' or 'bulk'
  type: {
    type: String,
    enum: ["single", "bulk"],
    default: "single",
  },
  // If type='bulk', this ID groups them together
  bulk_id: {
    type: String,
    default: null,
  },
  result: {
    type: String,
    enum: ["Deliverable", "risky", "undeliverable"],
    required: true,
  },
  confidence: {
    type: String,
    enum: ["High", "Medium", "Low"],

  },
  // Store full JSON result from the validator
  validation_details: {
    type: Object,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7, // automatically deletes after 7 days
  },
});

usageHistorySchema.index({ user_id: 1, created_at: -1 });

// // Notify user on update/create
// import { notifyUser } from "../socket.js";
// usageHistorySchema.post('save', function (doc) {
//   if (doc.user_id) {
//     notifyUser(doc.user_id, 'email_validation_updated', doc);
//   }
// });

export default mongoose.model("UsageHistory", usageHistorySchema);