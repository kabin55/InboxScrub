import UsageHistory from "../models/usageHistory.js";
import { validateEmailDeliverability } from "./emailValidation.service.js";

const emailMap = new Map();
let dbEmails = [];
let isInitialized = false;

/**
 * Load DB emails into Map and Array on initialization
 */
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

        if (emailMap.has(email)) continue; // avoid duplicates

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
    console.log(`Loaded ${emailMap.size} unique emails from DB on initialization`);
    return { emailMap, dbEmails };
};

/**
 * 2. Single Email Validation Flow
 */
export const processSingleEmail = async (rawEmail) => {
    if (!isInitialized) await loadDBEmails();

    const email = rawEmail.trim().toLowerCase();

    // Check if email exists in emailMap
    if (emailMap.has(email)) {
        return {
            isCached: true,
            data: emailMap.get(email)
        };
    }

    // If not found, run existing validation flow
    const validationResult = await validateEmailDeliverability(email);
    // console.log("validationResult", validationResult);
    return {
        isCached: false,
        data: validationResult
    };
};

/**
 * 3. Bulk Email Validation Flow
 */
export const processBulkEmails = async (emailsArray) => {
    if (!isInitialized) await loadDBEmails();

    const existingEmails = [];
    const newEmails = [];

    // Separate emails
    for (const rawEmail of emailsArray) {
        const email = rawEmail.trim().toLowerCase();

        if (emailMap.has(email)) {
            existingEmails.push(emailMap.get(email));
        } else {
            newEmails.push(rawEmail);
        }
    }
    // console.log("existingEmails", existingEmails);
    // console.log("newEmails", newEmails);
    return { existingEmails, newEmails };
};