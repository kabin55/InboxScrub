import express from "express";
import { requireAuth, authorize } from "../../middleware/authMiddleware.js";
import {
    getDashboardStats,
    getUsers,
    updateUser,
    getActivityLogs,
    getAllCampaigns,
    getCampaignDetails
} from "./admin.controller.js";
import {
    createToken,
    getTokens,
    updateToken,
    revokeToken
} from "./iam.controller.js";

const router = express.Router();

// General Admin Routes - Require Superadmin
const superAdminAuth = [requireAuth, authorize("Superadmin")];

router.get("/dashboard", superAdminAuth, getDashboardStats);
router.get("/users", superAdminAuth, getUsers);
router.put("/users/:id", superAdminAuth, updateUser);
router.get("/history", superAdminAuth, getActivityLogs);

// Campaign Monitoring Routes
router.get("/campaigns", superAdminAuth, getAllCampaigns);
router.get("/campaigns/:jobId", superAdminAuth, getCampaignDetails);

import rateLimit from "express-rate-limit";

const tokenCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: { message: "Too many tokens created, please try again later." }
});

// IAM Token Management Routes
router.post("/tokens", requireAuth, tokenCreationLimiter, createToken);
router.get("/tokens", requireAuth, getTokens);
router.patch("/tokens/:id", requireAuth, updateToken);
router.delete("/tokens/:id", requireAuth, revokeToken);

export default router;
