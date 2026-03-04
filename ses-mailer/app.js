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
async function sendEmail({ to, from, subject, body }) {
    const command = new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: {
                Html: { Data: body, Charset: "UTF-8" },
                Text: { Data: body, Charset: "UTF-8" },
            },
        },
    });

    return sesClient.send(command);
}

export const handler = async (event) => {
    console.log(1)
    try {
        const payload =
            typeof event.body === "string" ? JSON.parse(event.body) : event.body;

        const { emails, content } = payload;
        const jobId = payload.jobId || payload._id;
        console.log(emails)
        if (!jobId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "jobId is required" }),
            };
        }

        if (!emails || !content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "emails and content are required" }),
            };
        }

        const contentData = Array.isArray(content) ? content[0] : content;
        const { subject, body: emailBody, sender } = contentData;

        await connectDB();

        // Normalize emails
        // Normalize emails and generate trackingId
        const recipientList = emails.map((e) => {
            const email = typeof e === "string" ? e : e.email;
            return {
                email,
                trackingId: crypto.randomBytes(16).toString("hex"),
            };
        });

        /* --------------------------------------------------
           1. Insert QUEUED records (bulk)
        -------------------------------------------------- */
        const bulkInsert = recipientList.map((r) => ({
            insertOne: {
                document: {
                    jobId,
                    email: r.email,
                    trackingId: r.trackingId,
                    status: "queued",
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

        /* --------------------------------------------------
           2. Send Emails in batches
        -------------------------------------------------- */
        let successCount = 0;
        let failCount = 0;
        const results = [];

        for (let i = 0; i < recipientList.length; i += BATCH_SIZE) {
            const batch = recipientList.slice(i, i + BATCH_SIZE);

            const promises = batch.map(async (recipient) => {
                const email = recipient.email;
                const trackingId = recipient.trackingId;
                const trackingPixel = `<img src="${process.env.TRACKING_URL}/${trackingId}" width="1" height="1" style="display:none;" />`;
                const bodyWithTracking = emailBody + trackingPixel;
                console.log("Email Pixel:", trackingPixel);
                try {
                    const response = await sendEmail({
                        to: email,
                        from: sender,
                        subject,
                        body: bodyWithTracking,
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
                    results.push({ email, jobId, status: "failed", reason: err.message });
                }
            });

            await Promise.all(promises);
        }

        /* --------------------------------------------------
           3. Final response
        -------------------------------------------------- */
        console.log("Email sent successfully", jobId, successCount, failCount);

        console.log("Detailed Results:");
        results.forEach(({ email, jobId, status, reason, trackingId }) => {
            console.log(
                `Email: ${email}, JobId: ${jobId},id:${trackingId} Status: ${status}${reason ? `, Reason: ${reason}` : ""
                }`
            );
        });
        // console.log("Email Body:", emailBody);


        console.log('-------------------------------------')
        return {
            statusCode: 200,
            body: JSON.stringify({
                jobId,
                stats: {
                    total: recipientList.length,
                    sent: successCount,
                    failed: failCount,
                },
            }),
        };
    } catch (error) {
        console.error("Lambda error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message }),
        };
    }
};
