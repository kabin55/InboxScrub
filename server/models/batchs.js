import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const batchSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4,
    },
    user_id: {
        type: String,
        ref: "User",
        required: true,
        unique: true, // One-to-one relation with user
    },
    batches: [
        {
            _id: { type: String, default: uuidv4 }, // Unique ID for EACH batch
            batchName: { type: String, default: () => `Batch ${new Date().toISOString()}` },
            emails: [{
                name: { type: String, default: "" },
                email: { type: String, trim: true, lowercase: true, required: true },
                phone: { type: String, default: "" }
            }],
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});

// Expire after 30 days (30 * 24 * 60 * 60 = 2592000 seconds)
batchSchema.index({ created_at: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("Batch", batchSchema);