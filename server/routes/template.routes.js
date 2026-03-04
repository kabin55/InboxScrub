import express from "express";
import multer from "multer";
import {
    uploadTemplate,
    listTemplates,
    getTemplateById,
    deleteTemplate,
} from "../controllers/template.controller.js";
import { requireAuth, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit early check
});


router.post(
    "/upload",
    requireAuth,
    requirePermission("Upload Template"),
    upload.single("file"),
    uploadTemplate
);

router.get("/list", requireAuth, listTemplates);

router.get("/:id", requireAuth, getTemplateById);

router.delete("/:id", requireAuth, requirePermission("Upload Template"), deleteTemplate);

export default router;
