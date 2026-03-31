import express from "express";
import { createCampaign, getMyCampaigns, getCampaignDetails, sendWhatsappFollowup } from "./campaign.controller.js";
import { requireAuth, requirePermission } from "../../middleware/authMiddleware.js";
import multer from "multer";
import { extractUnopenedNumbers } from "./numberExtractor.controller.js";

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post("/create", requireAuth, requirePermission("Bulk Mailing"), createCampaign);
router.get("/history", requireAuth, requirePermission("Bulk Mailing"), getMyCampaigns);
router.get("/:jobId", requireAuth, requirePermission("Bulk Mailing"), getCampaignDetails);
router.post("/:jobId/extract-numbers", requireAuth, upload.single('file'), extractUnopenedNumbers);
router.post("/:jobId/whatsapp-followup", requireAuth, requirePermission("Bulk Mailing"), sendWhatsappFollowup);

export default router;
