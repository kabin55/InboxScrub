import { queueTrackingUpdate, TRANSPARENT_GIF } from "./tracking.service.js";

export const trackEmailOpen = async (req, res) => {
    try {
        const { trackingId } = req.params;

        if (trackingId) {
            queueTrackingUpdate(trackingId);
        }

        res.setHeader("Content-Type", "image/gif");
        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        res.status(200).send(TRANSPARENT_GIF);

    } catch (error) {
        console.error("Tracking error:", error);

        res.setHeader("Content-Type", "image/gif");
        res.status(200).send(TRANSPARENT_GIF);
    }
};
