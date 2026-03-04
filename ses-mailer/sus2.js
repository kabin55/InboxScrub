import { SESClient, SendBulkTemplatedEmailCommand, CreateTemplateCommand, GetTemplateCommand, UpdateTemplateCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";
import connectDB from "./db.js";
import EmailStatus from "./model/emailStatus.js";

dotenv.config();

const sesClient = new SESClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
});

// Define the SES template content
const TEMPLATE_NAME = "GeneralTemplate";
const TEMPLATE_SUBJECT = "Welcome to Our Premium Service! ✨";
const TEMPLATE_HTML = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #334155; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff; padding: 40px 20px; text-align: center; }
    .content { padding: 40px; text-align: center; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 30px; background-color: #6366f1; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Welcome Aboard! 🚀</h1></div>
    <div class="content">
      <p>We're thrilled to have you here. This is a premium static email sent to verify your subscription.</p>
      <a href="#" class="btn">Explore Dashboard</a>
    </div>
    <div class="footer">&copy; 2026 Your Organization. All rights reserved.</div>
  </div>
</body>
</html>
`;
const TEMPLATE_TEXT = "Welcome! We're thrilled to have you here. This is a premium static email sent to verify your subscription.";

// Name of your SES Configuration Set for open/click tracking
const CONFIGURATION_SET = "ShivaratriTrackingSet";

// Function to create or update SES template
async function ensureTemplateExists() {
    try {
        await sesClient.send(new GetTemplateCommand({ TemplateName: TEMPLATE_NAME }));
        console.log(`Template "${TEMPLATE_NAME}" already exists. Updating...`);
        await sesClient.send(
            new UpdateTemplateCommand({
                Template: {
                    TemplateName: TEMPLATE_NAME,
                    SubjectPart: TEMPLATE_SUBJECT,
                    HtmlPart: TEMPLATE_HTML,
                    TextPart: TEMPLATE_TEXT,
                },
            })
        );
        console.log(`Template "${TEMPLATE_NAME}" updated successfully.`);
    } catch (err) {
        if (err.name === "TemplateDoesNotExist") {
            console.log(`Template "${TEMPLATE_NAME}" does not exist. Creating...`);
            await sesClient.send(
                new CreateTemplateCommand({
                    Template: {
                        TemplateName: TEMPLATE_NAME,
                        SubjectPart: TEMPLATE_SUBJECT,
                        HtmlPart: TEMPLATE_HTML,
                        TextPart: TEMPLATE_TEXT,
                    },
                })
            );
            console.log(`Template "${TEMPLATE_NAME}" created successfully.`);
        } else {
            console.error("Error checking/creating template:", err);
            throw err;
        }
    }
}

// Function to send bulk emails and track status in DB
async function sendBulkEmails(recipients) {
    try {
        const batchSize = 50; // SES max 50 per SendBulkTemplatedEmail
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            const destinations = batch.map((email) => ({
                Destination: { ToAddresses: [email] },
                ReplacementTemplateData: JSON.stringify({}), // No personalization
            }));

            const commandParams = {
                Source: process.env.SENDER_EMAIL,
                Template: TEMPLATE_NAME,
                DefaultTemplateData: JSON.stringify({}),
                Destinations: destinations,
                ConfigurationSetName: CONFIGURATION_SET,
            };

            const command = new SendBulkTemplatedEmailCommand(commandParams);
            const response = await sesClient.send(command);
            //mention email too
            console.log(batch, response);
            console.log(`Batch processed. Status count: ${response.Status.length}`);
            // Sync status to DB
            const dbUpdates = batch.map(async (email, index) => {
                const result = response.Status[index];
                const updateData = {
                    email: email,
                    lastUpdated: new Date(),
                };

                if (result.Status === "Success") {
                    updateData.status = "sent";
                    updateData.messageId = result.MessageId;
                    updateData.error = null;
                } else {
                    updateData.status = "failed";
                    updateData.error = result.Error || "Unknown SES error";
                }

                await EmailStatus.findOneAndUpdate(
                    { email: email },
                    { $set: updateData, $inc: { attempts: 1 } },
                    { upsert: true, returnDocument: 'after' }
                );
            });

            await Promise.all(dbUpdates);
            console.log(`Batch DB sync completed.`);
        }
    } catch (error) {
        console.error("Error sending bulk emails:", error);
    }
}

// Main function
(async () => {
    // Example recipient list
    const recipients = [
        "sushan22013217@iimscollege.edu.np",
        "kabin22013216@iimscollege.edu.np",
        "emailsanitization@gmail.com",
        "Shresthakabin46@gmail.com",
        "aryaladitya06@gmail.com",
        "xyza72004@gmail.com",
        "kaki61727gmail.com",
    ];

    try {
        await connectDB();
        await ensureTemplateExists();
        await sendBulkEmails(recipients);
        console.log("Process finished. Closing DB connection...");
        const mongoose = await import("mongoose");
        await mongoose.default.connection.close();
    } catch (err) {
        console.error("Error in bulk email process:", err);
        process.exit(1);
    }
})();