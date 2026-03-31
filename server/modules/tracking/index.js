import trackingRoutes from "./tracking.routes.js";
import { startTrackingFlusher } from "./tracking.service.js";

// Initialize the background flusher
startTrackingFlusher();

export { trackingRoutes };
