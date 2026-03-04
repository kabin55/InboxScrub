import express from "express";
import EmailStatus from "../models/emailStatus.js";

const router = express.Router();

// 1x1 Transparent GIF Buffer
const TRANSPARENT_GIF_BUFFER = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

router.get("/:trackingId", async (req, res) => {
    console.log("Tracking hit");
    try {
        const { trackingId } = req.params;

        if (trackingId) {
            // Update DB to mark email as opened (fire and forget to not delay image load)
            // We use findOneAndUpdate to be atomic and efficient
            EmailStatus.findOneAndUpdate(
                { trackingId: trackingId, opened: false }, // Only update if not already opened
                {
                    $set: {
                        opened: true,
                        openedAt: new Date()
                    }
                }
            ).catch(err => console.error("Error updating tracking status:", err));
        }

        // Return 1x1 transparent pixel
        res.setHeader("Content-Type", "image/gif");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.status(200).send(TRANSPARENT_GIF_BUFFER);

    } catch (error) {
        console.error("Tracking route error:", error);
        // Even on error, try to return the image so we don't show a broken image icon to the user
        res.setHeader("Content-Type", "image/gif");
        res.status(200).send(TRANSPARENT_GIF_BUFFER);
    }
});

export default router;
