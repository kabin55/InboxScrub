import crypto from "crypto";
import { sendToSQS } from "../email/sqs.service.js";

/**
 * Sends an email from the admin to the user with their new token.
 * Uses the system's SQS -> SES mailer service instead of Nodemailer.
 */
export const sendTokenFromAdmin = async (adminEmail, adminOAuth, userEmail, token, action, note, expiresAt, trackEmail) => {
    const htmlBody = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px;">
            <h2>Welcome!</h2>
            <p>An administrator (${adminEmail}) has generated an access token for you to connect to the system.</p>
            <p><strong>Your Token:</strong> <code style="background: #eee; padding: 4px; border-radius: 4px;">${token}</code></p>
            <p><strong>Permissions:</strong> ${Array.isArray(action) ? action.join(', ') : action}</p>
            ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
            ${expiresAt ? `<p><em>Note: This token is valid until ${new Date(expiresAt).toLocaleDateString()}.</em></p>` : ''}
            <p>Please keep this token secure and do not share it.</p>
        </div>
    `;

    // For test purposes, log the email action and token explicitly to the terminal
    console.log(`\n[TESTING] Token generated. Sender (Admin): ${adminEmail} | Recipient (User): ${userEmail} | Token: ${token}\n`);

    const jobId = crypto.randomUUID();
    const jobPayload = {
        toObject: () => ({
            jobId: jobId,
            emails: [userEmail],
            content: [{
                subject: "Your System Access Token",
                sender: adminEmail, // Use the verified admin email as sender
                body: htmlBody
            }]
        })
    };

    try {
        await sendToSQS(jobPayload);
        console.log("Email job successfully enqueued to SQS for SES delivery:", jobId);
        return { success: true, jobId: trackEmail ? jobId : undefined };
    } catch (error) {
        console.error("SQS Enqueue Error, failed to send email via SES:", error.message);
        // Do not throw error for local testing, allow the token to be saved
        return { success: false, error: error.message };
    }
};
