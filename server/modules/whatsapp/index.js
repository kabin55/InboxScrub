import whatsappRoutes from "./whatsapp.routes.js";
import { startFollowUpService } from "./whatsapp.followup.service.js";
export * from "./whatsapp.service.js";

// Initialize the background follow-up service
startFollowUpService();

export { whatsappRoutes };
