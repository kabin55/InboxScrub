import express from "express";
import { googleAuth, getSession, logout, tokenLogin } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/google", googleAuth);
router.post("/token-login", tokenLogin);
router.get("/session", requireAuth, getSession);
router.post("/logout", logout);

export default router;
