import { createJob } from "./campaign.service.js";
import Batch from "../../models/batchs.js";
import Job from "../../models/job.js";
import EmailStatus from "../../models/emailStatus.js";
import User from "../../models/user.js";
import Credit from "../../models/credits.js";
import Template from "../../models/template.js";
import { getTemplateContentFromS3 } from "../template/template.controller.js";
import { sendWhatsappMessage } from "../whatsapp/whatsapp.service.js";
import { sendMessage } from "./message.service.js";
import { v4 as uuidv4 } from "uuid";
import { stripHtml } from "../../utils/htmlToText.js";

const processDirectChannelCampaign = async (job, channel) => {
    try {
        console.log(`Starting direct processing for ${channel} job: ${job._id}`);
        // Create EmailStatus records
        const statusesToInsert = job.emails.map(emailObj => {
            const isObj = typeof emailObj === 'object' && emailObj !== null;
            return {
                jobId: job._id.toString(),
                email: isObj ? emailObj.email : emailObj,
                name: isObj ? (emailObj.name || "") : "",
                phone: isObj ? (emailObj.phone || "") : "",
                status: "pending",
                whatsappStatus: "pending",
                trackingId: uuidv4().replace(/-/g, ''),
            };
        });

        await EmailStatus.insertMany(statusesToInsert);

        job.status = "processing";
        await Job.updateOne({ _id: job._id }, { $set: { status: "processing" } });

        let successCount = 0;
        let failCount = 0;

        for (const contact of statusesToInsert) {
            try {
                if (!contact.phone) throw new Error("No phone number available");

                if (channel === 'whatsapp') {
                    const emailBody = job.content && job.content[0] ? job.content[0].body : "";
                    const message = stripHtml(emailBody) || `Hi ${contact.name || 'there'},\n\nWe recently sent you an email regarding "${job.fileName}". Please check it out!`;
                    await sendWhatsappMessage({ to: contact.phone, message });
                } else if (channel === 'message') {
                    const emailBody = job.content && job.content[0] ? job.content[0].body : "";
                    const message = stripHtml(emailBody) || `Hi ${contact.name || 'there'},\n\nWe recently sent you an email regarding "${job.fileName}". Please check it out!`;
                    await sendMessage({ phone: contact.phone, name: contact.name, message });
                }
                await EmailStatus.updateOne({ trackingId: contact.trackingId }, { $set: { whatsappStatus: 'sent', status: 'sent' } });
                successCount++;
            } catch (err) {
                await EmailStatus.updateOne({ trackingId: contact.trackingId }, { $set: { whatsappStatus: 'failed', status: 'failed', error: err.message } });
                failCount++;
            }
        }

        await Job.updateOne({ _id: job._id }, { $set: { status: "completed" } });
        console.log(`Direct processing finished. Success: ${successCount}, Fail: ${failCount}`);
    } catch (err) {
        console.error(`Direct channel processing failed for job ${job._id}:`, err);
        await Job.updateOne({ _id: job._id }, { $set: { status: "failed" } });
    }
};

export const sendWhatsappFollowup = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.user_id;

        const job = await Job.findOne({ _id: jobId, userId });
        if (!job) return res.status(404).json({ success: false, message: "Campaign not found" });

        const pendingContacts = await EmailStatus.find({
            jobId,
            opened: false,
            phone: { $exists: true, $ne: "" },
            whatsappStatus: { $in: ["pending", "failed"] } 
        });

        if (pendingContacts.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No eligible contacts found for follow-up (must be unopened with a valid phone number)."
            });
        }

        let successCount = 0;
        let failCount = 0;
        for (const contact of pendingContacts) {
            try {
                const message = `Hi ${contact.name || 'there'},\n\nFollowing up on "${job.fileName}". Please check your email for details.\n\nBest,\nThe Team`;
                await sendWhatsappMessage({
                    to: contact.phone,
                    message
                });

                contact.whatsappStatus = "sent";
                await contact.save();
                successCount++;

            } catch (err) {
                console.error(`WhatsApp send failed for ${contact.phone}:`, err);
                contact.whatsappStatus = "failed";
                await contact.save();
                failCount++;
            }
        }

        res.json({
            success: true,
            message: `Follow-up complete. Sent: ${successCount}. Failed: ${failCount}.`
        });

    } catch (error) {
        console.error("Error sending WhatsApp follow-ups:", error);
        res.status(500).json({
            success: false,
            message: "Failed to trigger follow-ups",
            error: error.message
        });
    }
};

export const createCampaign = async (req, res) => {
    try {
        const { source, batchId, fileName, emails, content, totalEmails, templateId, channels } = req.body;
        const userId = req.user.user_id;

        if (!templateId && (!content || !content.subject || !content.body || !content.sender)) {
            return res.status(400).json({
                success: false,
                message: "Missing campaign content (subject, body, sender) or template selection",
            });
        }

        let campaignEmails = [];
        let campaignName = fileName;

        if (source === 'batch') {
            if (!batchId) {
                return res.status(400).json({ success: false, message: "Batch ID is required for batch source" });
            }

            const userBatches = await Batch.findOne({ user_id: userId });

            if (!userBatches) {
                return res.status(404).json({ success: false, message: "No batches found for this user" });
            }

            const selectedBatch = userBatches.batches.find(b => b._id.toString() === batchId);

            if (!selectedBatch) {
                return res.status(404).json({ success: false, message: "Selected batch not found" });
            }

            campaignEmails = selectedBatch.emails;
            campaignName = selectedBatch.batchName;
        } else if (source === 'file') {
            if (!emails || !Array.isArray(emails) || emails.length === 0) {
                return res.status(400).json({ success: false, message: "No emails provided for file source" });
            }
            campaignEmails = emails;
        } else {
            return res.status(400).json({ success: false, message: "Invalid source type" });
        }

        const targetChannels = (channels && Array.isArray(channels) && channels.length > 0) ? channels : ["email"];
        const requiredCredits = campaignEmails.length * targetChannels.length;

        if (requiredCredits === 0) {
            return res.status(400).json({ success: false, message: "No emails strictly found to send" });
        }

        const user = await User.findById(userId);
        if (!user || user.plan === "Basic") {
            return res.status(403).json({ success: false, message: "Upgrade to Standard or Premium to use Mass Email Campaigns." });
        }

        const creditRecord = await Credit.findOne({ user_id: userId });
        if (!creditRecord) {
            return res.status(400).json({ success: false, message: "Credit record not found." });
        }

        if (creditRecord.massMalingCredits < requiredCredits) {
            return res.status(403).json({ success: false, message: `Insufficient credits. You need ${requiredCredits} credits but have ${creditRecord.massMalingCredits}.` });
        }

        creditRecord.massMalingCredits -= requiredCredits;
        await creditRecord.save();

        let finalSubject = content?.subject || "Mass Campaign";
        let finalSender = content?.sender || user.email;
        let baseHtmlBody = content?.body || "";

        if (templateId) {
            const template = await Template.findOne({ _id: templateId, isActive: true });
            if (!template) {
                return res.status(404).json({ success: false, message: "Template not found or inactive." });
            }
            try {
                baseHtmlBody = await getTemplateContentFromS3(template.s3Key);

                const titleMatch = baseHtmlBody.match(/<title>([^<]*)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    finalSubject = titleMatch[1].trim();
                }
            } catch (err) {
                console.error("Failed to load template body from S3:", err);
                return res.status(500).json({ success: false, message: "Failed to read template from S3." });
            }
        }

        const createdJobIds = [];

        for (const channelType of targetChannels) {
            const channelSuffix = channelType.charAt(0).toUpperCase() + channelType.slice(1);

            const newJob = await createJob({
                userId,
                fileName: targetChannels.length > 1 ? `${campaignName} (${channelSuffix})` : campaignName,
                totalEmails: campaignEmails.length,
                status: "queued",
                channel: channelType,
                emails: campaignEmails,
                content: [{
                    subject: finalSubject,
                    body: baseHtmlBody,
                    sender: finalSender,
                    status: "queued"
                }],
                selectedChannels: targetChannels
            });

            createdJobIds.push(newJob._id);

            if (channelType === "whatsapp" || channelType === "message") {
                processDirectChannelCampaign(newJob, channelType).catch(console.error);
            }
        }

        res.status(201).json({
            success: true,
            message: "Campaign(s) created successfully",
            jobIds: createdJobIds
        });

    } catch (error) {
        console.error("Error creating campaign:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create campaign",
            error: error.message
        });
    }
};

export const getMyCampaigns = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const campaigns = await Job.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Job.countDocuments({ userId });

        const campaignIds = campaigns.map(c => c._id.toString());

        const stats = await EmailStatus.aggregate([
            { $match: { jobId: { $in: campaignIds } } },
            {
                $group: {
                    _id: { jobId: "$jobId", status: "$status", opened: "$opened" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const statsMap = {};
        campaignIds.forEach(id => {
            statsMap[id] = { sent: 0, failed: 0, opened: 0, not_opened: 0 };
        });

        stats.forEach(s => {
            const { jobId, status, opened } = s._id;
            if (statsMap[jobId]) {
                if (status === 'sent' || status === 'delivered') {
                    statsMap[jobId].sent += s.count;
                    if (opened) {
                        statsMap[jobId].opened += s.count;
                    } else {
                        statsMap[jobId].not_opened += s.count;
                    }
                } else if (status === 'failed' || status === 'bounced') {
                    statsMap[jobId].failed += s.count;
                }
            }
        });

        const formattedCampaigns = campaigns.map(job => ({
            jobId: job._id,
            fileName: job.fileName,
            totalEmails: job.totalEmails,
            jobStatus: job.status,
            createdAt: job.createdAt,
            stats: statsMap[job._id.toString()] || { sent: 0, failed: 0, opened: 0, not_opened: 0 }
        }));

        res.status(200).json({
            success: true,
            campaigns: formattedCampaigns,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error("Error fetching my campaigns:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch campaigns",
            error: error.message
        });
    }
};

export const getCampaignDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.user_id;

        const job = await Job.findOne({ _id: jobId, userId }); 
        if (!job) return res.status(404).json({ message: "Campaign not found" });

        const statusCounts = await EmailStatus.aggregate([
            { $match: { jobId: jobId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            sent: 0,
            failed: 0,
            queued: 0,
            delivered: 0,
            bounced: 0
        };

        statusCounts.forEach(s => {
            if (summary[s._id] !== undefined) {
                summary[s._id] = s.count;
            } else if (s._id === 'processing') {
                summary.queued += s.count;
            }
        });

        const normalizedSummary = {
            sent: summary.sent + summary.delivered,
            failed: summary.failed + summary.bounced,
            queued: summary.queued
        };

        const emailDocs = await EmailStatus.find({ jobId: jobId }).sort({ createdAt: -1 });

        const emails = emailDocs.map(e => ({
            email: e.email,
            name: e.name || "",
            phone: e.phone || "",
            status: e.status,
            whatsappStatus: e.whatsappStatus || "pending",
            opened: e.opened || false,
            reason: e.error || (e.status === 'failed' ? "Unknown Error" : null),
            updatedAt: e.updatedAt || e.createdAt
        }));

        res.json({
            jobId: job._id,
            fileName: job.fileName,
            totalEmails: job.totalEmails,
            status: job.status,
            createdAt: job.createdAt,
            summary: normalizedSummary,
            emails: emails
        });

    } catch (err) {
        console.error("Error fetching campaign details:", err);
        res.status(500).json({ message: "Server error" });
    }
};
