import { createJob } from "../services/campaign.service.js";
import Batch from "../models/batchs.js";
import Job from "../models/job.js";
import EmailStatus from "../models/emailStatus.js";
import User from "../models/user.js";
import Credit from "../models/credits.js";
import Template from "../models/template.js";
import { getTemplateContentFromS3 } from "./template.controller.js";

export const createCampaign = async (req, res) => {
    try {
        const { source, batchId, fileName, emails, content, totalEmails, templateId } = req.body;
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

            // Find the user's batch document and specific batch subdocument
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
            // For file source, we expect emails to be passed in the body for now
            // In a real scenario, we might handle file upload here or refer to a stored file
            if (!emails || !Array.isArray(emails) || emails.length === 0) {
                return res.status(400).json({ success: false, message: "No emails provided for file source" });
            }
            campaignEmails = emails;
        } else {
            return res.status(400).json({ success: false, message: "Invalid source type" });
        }

        const requiredCredits = campaignEmails.length;

        if (requiredCredits === 0) {
            return res.status(400).json({ success: false, message: "No emails strictly found to send" });
        }

        // Verify Plan & Credits
        const user = await User.findById(userId);
        if (!user || user.plan === "Basic") {
            return res.status(403).json({ success: false, message: "Upgrade to Standard or Premium to use Mass Email Campaigns." });
        }

        const creditRecord = await Credit.findOne({ user_id: userId });
        if (!creditRecord) {
            return res.status(400).json({ success: false, message: "Credit record not found." });
        }

        if (creditRecord.massMalingCredits < requiredCredits) {
            return res.status(403).json({ success: false, message: `Insufficient mass mailing credits. You need ${requiredCredits} credits but have ${creditRecord.massMalingCredits}.` });
        }

        // Deduct credits
        creditRecord.massMalingCredits -= requiredCredits;
        await creditRecord.save();

        // Process Template if selected
        let finalSubject = content?.subject || "Mass Campaign";
        let finalSender = content?.sender || user.email;
        let baseHtmlBody = content?.body || "";

        if (templateId) {
            const template = await Template.findOne({ _id: templateId, isActive: true });
            if (!template) {
                // Refund credits on failure logic normally goes here if we threw, but we haven't created job yet
                return res.status(404).json({ success: false, message: "Template not found or inactive." });
            }
            try {
                baseHtmlBody = await getTemplateContentFromS3(template.s3Key);

                // console.log("baseHtmlBody", baseHtmlBody);

                // Extract title from HTML to use as subject if none provided
                const titleMatch = baseHtmlBody.match(/<title>([^<]*)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    finalSubject = titleMatch[1].trim();
                }
            } catch (err) {
                console.error("Failed to load template body from S3:", err);
                return res.status(500).json({ success: false, message: "Failed to read template from S3." });
            }
        }

        // Create the Job
        const newJob = await createJob({
            userId,
            fileName: campaignName,
            totalEmails: campaignEmails.length,
            status: "queued",
            emails: campaignEmails,
            content: [{
                subject: finalSubject,
                body: baseHtmlBody, // Store raw template here, worker can inject {{email}} later per recipient
                sender: finalSender,
                status: "queued"
            }]
        });

        res.status(201).json({
            success: true,
            message: "Campaign created successfully",
            jobId: newJob._id
        });

    } catch (error) {
        console.error("Error creating campaign:", error);
        console.error("Stack Trace:", error.stack);
        res.status(500).json({
            success: false,
            message: "Failed to create campaign",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

        // Aggregate stats for these campaigns
        const stats = await EmailStatus.aggregate([
            { $match: { jobId: { $in: campaignIds } } },
            {
                $group: {
                    _id: { jobId: "$jobId", status: "$status", opened: "$opened" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Process aggregation results into a map
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

        const job = await Job.findOne({ _id: jobId, userId }); // Ensure ownership
        if (!job) return res.status(404).json({ message: "Campaign not found" });

        // Aggregate status counts
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

        // Normalize summary for frontend
        const normalizedSummary = {
            sent: summary.sent + summary.delivered,
            failed: summary.failed + summary.bounced,
            queued: summary.queued
        };

        // Fetch emails associated with this job
        const emailDocs = await EmailStatus.find({ jobId: jobId }).sort({ createdAt: -1 });

        const emails = emailDocs.map(e => ({
            email: e.email,
            status: e.status,
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
