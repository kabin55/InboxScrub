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

// IAM Token Management Routes
router.post("/tokens", requireAuth, createToken);
router.get("/tokens", requireAuth, getTokens);
router.patch("/tokens/:id", requireAuth, updateToken);
router.delete("/tokens/:id", requireAuth, revokeToken);

export default router;
