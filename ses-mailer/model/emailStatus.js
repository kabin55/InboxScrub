import mongoose from "mongoose";

const emailStatusSchema = new mongoose.Schema({
  jobId: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, default: "queued" }, // queued, sent, delivered, bounced, failed
  attempts: { type: Number, default: 0 },
  opened: { type: Boolean, default: false },
  messageId: { type: String },
  trackingId: { type: String, unique: true },
  error: { type: String },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

const EmailStatus = mongoose.model("EmailStatus", emailStatusSchema);
export default EmailStatus;
