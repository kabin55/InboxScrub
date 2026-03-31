import EmailStatus from "../../models/emailStatus.js";

const pendingUpdates = new Map();
const requestCount = new Map();

const FLUSH_INTERVAL = parseInt(process.env.TRACKING_INTERVAL) || 30000;

export const startTrackingFlusher = () => {
    setInterval(async () => {
        if (pendingUpdates.size === 0) return;

        const entries = Array.from(pendingUpdates.entries());
        pendingUpdates.clear();

        try {
            const bulkOps = entries.map(([trackingId, openedAt]) => ({
                updateOne: {
                    filter: { trackingId, opened: false },
                    update: {
                        $set: {
                            opened: true,
                            openedAt: openedAt
                        }
                    }
                }
            }));

            if (bulkOps.length > 0) {
                await EmailStatus.bulkWrite(bulkOps);
                console.log(`[Tracking] Updated ${bulkOps.length} email records`);
            }

        } catch (err) {
            console.error("[Tracking] Bulk update failed:", err);
            for (const [id, date] of entries) {
                if (!pendingUpdates.has(id)) {
                    pendingUpdates.set(id, date);
                }
            }
        }
    }, FLUSH_INTERVAL);
};

export const queueTrackingUpdate = (trackingId) => {
    const count = (requestCount.get(trackingId) || 0) + 1;
    requestCount.set(trackingId, count);

    if (count === 2) {
        if (!pendingUpdates.has(trackingId)) {
            pendingUpdates.set(trackingId, new Date());
        }
    }
};

export const TRANSPARENT_GIF = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
);
