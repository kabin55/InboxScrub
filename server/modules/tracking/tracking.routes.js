import express from "express";
import { trackEmailOpen } from "./tracking.controller.js";

const router = express.Router();

router.get("/:trackingId", trackEmailOpen);

export default router;
