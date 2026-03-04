import mongoose from "mongoose";

const accessTokenSchema = new mongoose.Schema(
    {
        token_hash: {
            type: String,
            required: true,
            unique: true,
        },
        admin_uid: {
            type: String,
            required: true,
            ref: "User",
        },
        permissions: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ["Active", "Revoked", "Expired"],
            default: "Active",
        },
        expires_at: {
            type: Date,
            default: null,
        },
        note: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

// Index for fast lookups by admin uid
accessTokenSchema.index({ admin_uid: 1 });

export default mongoose.model("AccessToken", accessTokenSchema);
