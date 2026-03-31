import mongoose from "mongoose";

const emailStatusSchema = new mongoose.Schema({
    jobId: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    status: { type: String, default: "queued" }, // queued, sent, delivered, bounced, failed
    whatsappStatus: { type: String, enum: ["pending", "sent", "delivered", "failed"], default: "pending" },
    attempts: { type: Number, default: 0 },
    opened: { type: Boolean, default: false },
    messageId: { type: String },
    trackingId: { type: String, unique: true, sparse: true }, // sparse allows nulls if some records don't have it
    error: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    openedAt: { type: Date }, // Added to track when it was opened
}, { timestamps: true });

emailStatusSchema.index({ jobId: 1 });
emailStatusSchema.index({ status: 1 });

const EmailStatus = mongoose.model("EmailStatus", emailStatusSchema);
export default EmailStatus;
