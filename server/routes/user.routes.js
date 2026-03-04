import express from "express";
import {
    getProfile,
    getCredits,
    getPayments,
    updateProfile,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// All user routes require authentication
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.get("/credits", requireAuth, getCredits);
router.get("/payments", requireAuth, getPayments);

export default router;
