import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";
import connectDB from "./db.js";
import EmailStatus from "./model/emailStatus.js";
import crypto from "crypto";

dotenv.config();

const sesClient = new SESClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
});

const BATCH_SIZE = 50;

// Send email via SES
async function sendEmail({ to, from, subject, html, text }) {
    const command = new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: {
                Html: { Data: html, Charset: "UTF-8" },
                Text: { Data: text, Charset: "UTF-8" },
            },
        },
    });

    return sesClient.send(command);
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendEmailWithBackoff(params, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await sendEmail(params);
        } catch (error) {
            if (error.name === 'ThrottlingException' || error.name === 'TooManyRequestsException' || error.$metadata?.httpStatusCode === 429) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw error;
                }
                const baseDelay = Math.pow(2, attempt) * 100;
                const jitter = Math.random() * 100;
                await wait(baseDelay + jitter);
            } else {
                throw error;
            }
        }
    }
}

export const handler = async (event) => {
    console.log("Received event structure");
    try {
        await connectDB();

        // Support both SQS Records and backward-compatible direct invoke payload
        let records = [];
        if (event.Records) {
            records = event.Records;
        } else {
            const bodyStr = typeof event.body === "string" ? event.body : JSON.stringify(event.body || event);
            records = [{ body: bodyStr }];
        }

        const responses = [];

        for (const record of records) {
            const payload = typeof record.body === "string" ? JSON.parse(record.body) : record.body;

            const { emails, content } = payload;
            const jobId = payload.jobId || payload._id;

            if (!jobId) {
                console.error("jobId is required", payload);
                responses.push({ statusCode: 400, message: "jobId is required" });
                continue;
            }

            if (!emails || !content) {
                console.error("emails and content are required", payload);
                responses.push({ statusCode: 400, message: "emails and content are required" });
                continue;
            }

            const contentData = Array.isArray(content) ? content[0] : content;
            const { subject, body: emailBody, sender } = contentData;

            /* --------------------------------------------------
               1. Idempotency Check & Insert QUEUED records
            -------------------------------------------------- */
            let existingStatuses = await EmailStatus.find({ jobId });

            if (existingStatuses.length === 0) {
                const recipientList = emails.map((e) => {
                    const email = typeof e === "string" ? e : e.email;
                    const name = typeof e === "string" ? "" : (e.name || "");
                    const phone = typeof e === "string" ? "" : (e.phone || "");

                    return {
                        email,
                        name,
                        phone,
                        trackingId: crypto.randomBytes(16).toString("hex"),
                    };
                });

                const bulkInsert = recipientList.map((r) => ({
                    insertOne: {
                        document: {
                            jobId,
                            email: r.email,
                            name: r.name,
                            phone: r.phone,
                            trackingId: r.trackingId,
                            status: "queued",
                            whatsappStatus: "pending",
                            attempts: 0,
                            opened: false,
                            messageId: null,
                            error: null,
                            lastUpdated: new Date(),
                        },
                    },
                }));

                if (bulkInsert.length) {
                    await EmailStatus.bulkWrite(bulkInsert);
                }

                existingStatuses = await EmailStatus.find({ jobId });
            }

            /* --------------------------------------------------
               2. Filter emails pending delivery (Idempotency)
            -------------------------------------------------- */
            const pendingEmails = existingStatuses.filter(s => s.status === 'queued' || s.status === 'failed');

            if (pendingEmails.length === 0) {
                console.log(`Job ${jobId} already fully processed or no pending emails. Skipping.`);
                responses.push({ statusCode: 200, message: `Job ${jobId} already fully processed` });
                continue;
            }

            /* --------------------------------------------------
               3. Send Emails in batches
            -------------------------------------------------- */
            let successCount = 0;
            let failCount = 0;
            const results = [];

            for (let i = 0; i < pendingEmails.length; i += BATCH_SIZE) {
                const batch = pendingEmails.slice(i, i + BATCH_SIZE);

                const promises = batch.map(async (recipient) => {
                    const email = recipient.email;
                    const trackingId = recipient.trackingId;

                    // Construct Tracking Pixel (HTML only)
                    const trackingPixel = `<img src="${process.env.TRACKING_URL}/${trackingId}" width="1" height="1" style="display:none;" />`;
                    const htmlBodyWithTracking = emailBody + trackingPixel;

                    // Construct Clean Text Body (No HTML)
                    const textBody = emailBody
                        .replace(/<[^>]*>?/gm, '') // Strip HTML tags
                        .replace(/&nbsp;/g, ' '); // Clean entities

                    try {
                        const response = await sendEmailWithBackoff({
                            to: email,
                            from: sender,
                            subject,
                            html: htmlBodyWithTracking,
                            text: textBody,
                        });

                        // Update SUCCESS
                        await EmailStatus.updateOne(
                            { jobId, email },
                            {
                                $set: {
                                    status: "sent",
                                    messageId: response.MessageId,
                                    error: null,
                                    lastUpdated: new Date(),
                                },
                                $inc: { attempts: 1 },
                            }
                        );

                        successCount++;
                        console.log(`[SENT] Email: ${email} | Tracking: ${process.env.TRACKING_URL}/${trackingId}`);
                        results.push({ email, jobId, status: "sent", reason: null });
                    } catch (err) {
                        // Update FAILED
                        await EmailStatus.updateOne(
                            { jobId, email },
                            {
                                $set: {
                                    status: "failed",
                                    error: err.message,
                                    lastUpdated: new Date(),
                                },
                                $inc: { attempts: 1 },
                            }
                        );

                        failCount++;
                        console.error(`[FAILED] Email: ${email} | Error: ${err.message}`);
                        results.push({ email, jobId, status: "failed", reason: err.message });
                    }
                });

                await Promise.all(promises);
            }

            /* --------------------------------------------------
               4. Record response
            -------------------------------------------------- */
            console.log(`Job ${jobId} Processing Completed. Success: ${successCount}, Fail: ${failCount}`);
            console.log("results", results)

            // Note: If some failed, throw an error to trigger SQS auto-retry.
            // Since idempotency check explicitly targets 'queued' and 'failed', already 'sent' contacts will be skipped perfectly on retry!
            if (failCount > 0) {
                throw new Error(`${failCount} emails failed to send. Triggering retry for Job ${jobId}`);
            }

            responses.push({
                jobId,
                stats: {
                    total: pendingEmails.length,
                    sent: successCount,
                    failed: failCount,
                },
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify(responses.length === 1 ? responses[0] : responses),
        };

    } catch (error) {
        console.error("Lambda SQS Processing error:", error);
        // Throw the error so SQS knows the message processing failed entirely. SQS will retry.
        throw error;
    }
};
