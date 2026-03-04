import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4, // UUID for PK
  },
  email: {
    type: String,
    required: true,
    // unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    default: "",
  },
  oauth_provider: {
    type: String,
    enum: ["google", "facebook", "none"],
    default: "none",
  },
  role: {
    type: String,
    enum: ["Superadmin", "Admin", "User"],
    default: "User",
  },
  plan: {
    type: String,
    enum: ["Basic", "Standard", "Premium"],
    default: "Basic"
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  token: {
    type: String,
    default: null, // Stores the hashed token if registered via token
  },
  permissions: {
    type: [String],
    default: [], // Stores capabilities array like ['Email Sanitization', 'Bulk Mailing']
  },
  last_login: {
    type: Date,
    default: null,
  }
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});

// Index for fast email lookups
userSchema.index({ email: 1 });

export default mongoose.model("User", userSchema);
