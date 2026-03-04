import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const activityLogSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4,
    },
    user: {
        type: String, // Referencing user._id which is a String (UUID)
        ref: "User",
        required: true,
    },
    action: {
        type: String,
        enum: ["Bulk Sanitization", "Single Verify", "Mass Campaign"],
        required: true,
    },
    volume: {
        type: Number,
        required: true,
    },
    source: {
        type: String, // e.g., filename or "API"
        required: true,
    },
    status: {
        type: String,
        enum: ["Success", "Failed"],
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30, // 30 days retention
    },
});

activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ user: 1 });

export default mongoose.model("ActivityLog", activityLogSchema);
