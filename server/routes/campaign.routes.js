import express from "express";
import { createCampaign, getMyCampaigns, getCampaignDetails } from "../controllers/campaign.controller.js";
import { requireAuth, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", requireAuth, requirePermission("Bulk Mailing"), createCampaign);
router.get("/history", requireAuth, requirePermission("Bulk Mailing"), getMyCampaigns);
router.get("/:jobId", requireAuth, requirePermission("Bulk Mailing"), getCampaignDetails);

export default router;
