// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Credit from "../models/credits.js";


import User from "../models/user.js";

export const requireAuth = async (req, res, next) => {
  let token = req.cookies?.session_token;

  // Fallback to Authorization header if no cookie is found (useful for curl/Postman)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists and is not blocked in DB
    const user = await User.findById(decoded.user_id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
    }

    req.user = {
      user_id: user._id,
      role: user.role,
      permissions: user.permissions,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid session" });
  }
};

export const requireCredits = (getRequiredCredits) => {
  return async (req, res, next) => {
    const requiredCredits = getRequiredCredits(req);

    if (!requiredCredits || requiredCredits <= 0) {
      return res.status(400).json({ message: "Invalid credit amount" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const credit = await Credit.findOne({
        user_id: req.user.user_id,
      }).session(session);

      if (!credit) {
        throw new Error("Credit record not found");
      }

      if (credit.credits < requiredCredits) {
        await session.abortTransaction();
        session.endSession();
        return res.status(402).json({
          message: "Insufficient credits",
        });
      }

      // Deduct credits
      credit.credits -= requiredCredits;
      credit.last_updated = new Date();

      await credit.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Attach info for controller
      req.creditsUsed = requiredCredits;
      next();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        message: "Credit processing failed",
      });
    }
  };
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Superadmin and Admin have full access
    if (["Superadmin", "Admin"].includes(req.user.role)) {
      return next();
    }

    // Check if user has specific permission
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden: Access denied. Missing required permission." });
  };
};