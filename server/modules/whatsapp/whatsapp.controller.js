import * as whatsappService from './whatsapp.service.js';

export const sendMessage = async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Missing required fields: to, message' });
    }

    const recipients = Array.isArray(to) ? to : [to];
    const results = [];

    for (const recipient of recipients) {
        const result = await whatsappService.sendWhatsappMessage({ to: recipient, message });
        results.push({ recipient, ...result });
    }

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    if (failures.length === 0) {
        res.status(200).json({ success: true, results });
    } else if (successes.length > 0) {
        res.status(207).json({ success: true, partial: true, results });
    } else {
        res.status(500).json({ success: false, results });
    }
};

export const sendTemplate = async (req, res) => {
    const { to, templateName, languageCode = 'en_US' } = req.body;

    if (!to || !templateName) {
        return res.status(400).json({ error: 'Missing required fields: to, templateName' });
    }

    const recipients = Array.isArray(to) ? to : [to];
    const results = [];

    for (const recipient of recipients) {
        const result = await whatsappService.sendWhatsappTemplate({ to: recipient, templateName, languageCode });
        results.push({ recipient, ...result });
    }

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    if (failures.length === 0) {
        res.status(200).json({ success: true, results });
    } else if (successes.length > 0) {
        res.status(207).json({ success: true, partial: true, results });
    } else {
        res.status(500).json({ success: false, results });
    }
};

export const verifyWebhook = (req, res) => {
    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};

export const handleWebhook = (req, res) => {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
        return res.sendStatus(404);
    }

    const entries = body.entry || [];
    for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
            const value = change.value || {};
            const messages = value.messages || [];
            for (const msg of messages) {
                console.log(`[WHATSAPP] Incoming message from ${msg.from}: ${msg.text?.body || '[non-text]'}`);
            }
            const statuses = value.statuses || [];
            for (const status of statuses) {
                console.log(`[WHATSAPP] Message ${status.id} status update: ${status.status}`);
            }
        }
    }

    res.sendStatus(200);
};
