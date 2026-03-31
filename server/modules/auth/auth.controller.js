import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import Credit from "../../models/credits.js";
import User from "../../models/user.js";
import AccessToken from "../../models/accessToken.js";
import { verifyGoogleToken } from "../../utils/googleVerify.js";

// Generate JWT token
const generateJWT = (user) => {
  return jwt.sign(
    { user_id: user._id, role: user.role, permissions: user.permissions },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Google Auth Controller
export const googleAuth = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Google ID token missing" });
    }

    // 1. Verify Google token
    const payload = await verifyGoogleToken(token);
    const { email, name } = payload;

    if (!email) {
      throw new Error("Email not found in Google token");
    }

    // 2. Find user by email (inside transaction)
    let user = await User.findOne({ email }).session(session);

    // 3. If new user → create user + credit ONCE
    if (!user) {
      user = await User.create(
        [
          {
            email,
            name: name || "",
            oauth_provider: "google",
            role: "Admin",
            permissions: ["Email Sanitization", "Bulk Mailing", "Upload Template"],
          },
        ],
        { session }
      );

      user = user[0];

      const initialMassMailingCredits = user.plan === "Premium" ? 1000 : (user.plan === "Standard" ? 100 : 0);

      // Create initial credit record (ONLY ONCE)
      await Credit.create(
        [
          {
            user_id: user._id,
            credits: 100,
            total_credits: 100,
            massMalingCredits: initialMassMailingCredits,
          },
        ],
        { session }
      );
    } else {
      // 3b. For EXISTING users, ensure oauth_provider reflects latest login
      user.oauth_provider = "google";

      user.permissions = ["Email Sanitization", "Bulk Mailing", "Upload Template"];
      await user.save({ session });

      // Ensure they have a Credit record (in case it was deleted/missing)
      const existingCredit = await Credit.findOne({ user_id: user._id }).session(session);

      if (!existingCredit) {
        const initialMassMailingCredits = user.plan === "Premium" ? 1000 : (user.plan === "Standard" ? 100 : 0);

        await Credit.create(
          [
            {
              user_id: user._id,
              credits: 100, 
              total_credits: 100,
              massMalingCredits: initialMassMailingCredits,
            },
          ],
          { session }
        );
      }
    }

    // 4. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 5. Generate JWT
    const jwtToken = generateJWT(user);

    // 6. Store JWT in HTTP-only cookie
    res.cookie("session_token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Response
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        oauth_provider: user.oauth_provider,
        role: user.role,
        plan: user.plan,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.status(401).json({
      message: "Google authentication failed",
    });
  }
};

// Get Session
export const getSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        oauth_provider: user.oauth_provider,
        role: user.role,
        plan: user.plan,
        permissions: user.permissions,
      }
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid session" });
  }
};

// Logout
export const logout = async (req, res) => {
  res.clearCookie("session_token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ success: true });
};

// Token Login
export const tokenLogin = async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ message: "Email and token are required" });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const accessToken = await AccessToken.findOne({ token_hash: tokenHash, status: "Active" });
    if (!accessToken) {
      return res.status(401).json({ message: "Invalid or inactive token" });
    }

    if (accessToken.expires_at && new Date() > new Date(accessToken.expires_at)) {
      accessToken.status = 'Expired';
      await accessToken.save();
      return res.status(401).json({ message: "Token has expired" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let user = await User.findOne({ email }).session(session);

      if (!user) {
        user = await User.create(
          [
            {
              email,
              name: email.split("@")[0],
              oauth_provider: "none",
              role: "User",
            },
          ],
          { session }
        );

        user = user[0];

        const initialMassMailingCredits = user.plan === "Premium" ? 1000 : (user.plan === "Standard" ? 100 : 0);

        await Credit.create(
          [
            {
              user_id: user._id,
              credits: 100,
              total_credits: 100,
              massMalingCredits: initialMassMailingCredits,
            },
          ],
          { session }
        );
      } else {
        user.oauth_provider = "none";
        user.role = "User";

        const existingCredit = await Credit.findOne({ user_id: user._id }).session(session);
        if (!existingCredit) {
          const initialMassMailingCredits = user.plan === "Premium" ? 1000 : (user.plan === "Standard" ? 100 : 0);

          await Credit.create(
            [
              {
                user_id: user._id,
                credits: 100,
                total_credits: 100,
                massMalingCredits: initialMassMailingCredits,
              },
            ],
            { session }
          );
        }
      }

      user.permissions = accessToken.permissions;
      await user.save({ session });

      await session.commitTransaction();
      session.endSession();

      const jwtToken = generateJWT(user);

      res.cookie("session_token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          oauth_provider: user.oauth_provider,
          role: user.role,
          plan: user.plan,
          permissions: user.permissions,
        },
      });
    } catch (txError) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }
  } catch (error) {
    console.error("Token login error:", error);
    res.status(500).json({ message: "Token login failed" });
  }
};
