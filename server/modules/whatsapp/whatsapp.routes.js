import express from 'express';
import * as whatsappController from './whatsapp.controller.js';

const router = express.Router();

router.post('/send-message', whatsappController.sendMessage);
router.post('/send-template', whatsappController.sendTemplate);
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhook);

export default router;
