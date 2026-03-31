import UsageHistory from "../../models/usageHistory.js";
import { validateEmailDeliverability } from "./email.validation.service.js";

const emailMap = new Map();
let dbEmails = [];
let isInitialized = false;

export const loadDBEmails = async () => {
    if (isInitialized) return { emailMap, dbEmails };

    const records = await UsageHistory.find(
        {},
        {
            email_checked: 1,
            result: 1,
            confidence: 1,
            validation_details: 1
        }
    ).lean();

    for (const record of records) {
        const email = record.email_checked?.trim().toLowerCase();
        if (!email) continue;

        if (emailMap.has(email)) continue; 

        const validationDetails = record.validation_details || {
            syntax: { value: true, reason: null },
            domain: { value: true, reason: null },
            mx: { value: true, reason: null },
            disposable: { value: false, reason: null },
            roleBased: { value: true, reason: null },
            catchAll: { value: true, reason: null },
            smtp: { value: true, reason: null }
        };

        const emailObj = {
            email,
            result: record.result,
            confidence: record.confidence,
            reason: Object.values(validationDetails)
                .map(v => v.reason)
                .filter(Boolean)
                .slice(0, 3),
            results: validationDetails
        };

        emailMap.set(email, emailObj);
        dbEmails.push(emailObj);
    }

    isInitialized = true;
    return { emailMap, dbEmails };
};

export const processSingleEmail = async (rawEmail) => {
    if (!isInitialized) await loadDBEmails();
    const email = rawEmail.trim().toLowerCase();
    if (emailMap.has(email)) {
        return { isCached: true, data: emailMap.get(email) };
    }
    const validationResult = await validateEmailDeliverability(email);
    return { isCached: false, data: validationResult };
};

export const processBulkEmails = async (emailsArray) => {
    if (!isInitialized) await loadDBEmails();
    const existingEmails = [];
    const newEmails = [];
    for (const rawEmailObj of emailsArray) {
        const emailObj = typeof rawEmailObj === 'string' ? { email: rawEmailObj } : rawEmailObj;
        const email = emailObj.email.trim().toLowerCase();
        if (emailMap.has(email)) {
            existingEmails.push({ ...emailMap.get(email), name: emailObj.name, phone: emailObj.phone });
        } else {
            newEmails.push(emailObj);
        }
    }
    return { existingEmails, newEmails };
};
