import User from "../models/user.js";
import ActivityLog from "../models/activityLog.js";
import UsageHistory from "../models/usageHistory.js";
import Credit from "../models/credits.js";
import Job from "../models/job.js";
import EmailStatus from "../models/emailStatus.js";

// GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        // 1. Growth
        const newUsersCount = await User.countDocuments({ created_at: { $gte: thirtyDaysAgo } });
        const prevUsersCount = await User.countDocuments({ created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

        let growthPercentage = 0;
        if (prevUsersCount > 0) {
            growthPercentage = ((newUsersCount - prevUsersCount) / prevUsersCount) * 100;
        } else if (newUsersCount > 0) {
            growthPercentage = 100;
        }

        const totalUsers = await User.countDocuments();

        // 2. Tier Distribution
        const tiers = await User.aggregate([
            { $group: { _id: "$plan", count: { $sum: 1 } } }
        ]);

        const tierMap = { Premium: 0, Standard: 0, Basic: 0 };
        tiers.forEach(t => { if (t._id in tierMap) tierMap[t._id] = t.count; });
        const totalForPie = Object.values(tierMap).reduce((a, b) => a + b, 0) || 1;

        const tierDistribution = [
            { name: "Premium", value: Math.round((tierMap.Premium / totalForPie) * 100) },
            { name: "Standard", value: Math.round((tierMap.Standard / totalForPie) * 100) },
            { name: "Basic", value: Math.round((tierMap.Basic / totalForPie) * 100) },
        ];

        // 3. Validation Activity (Last 7 days)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const usageStats = await UsageHistory.aggregate([
            { $match: { created_at: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: {
                        day: { $dayOfWeek: "$created_at" },
                        type: "$type"
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const validationActivity = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayIndex = d.getDay() + 1; // Sun=1
            const dayName = daysMap[d.getDay()];

            const singleStat = usageStats.find(s => s._id.day === dayIndex && s._id.type === 'single');
            const bulkStat = usageStats.find(s => s._id.day === dayIndex && s._id.type === 'bulk');

            validationActivity.push({
                name: dayName,
                single: singleStat ? singleStat.count : 0,
                bulk: bulkStat ? bulkStat.count : 0
            });
        }

        // 4. Campaign Flow (Last 7 days from EmailStatus model)
        const emailFlowStats = await EmailStatus.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: {
                        day: { $dayOfWeek: "$createdAt" },
                        status: "$status"
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const campaignFlow = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayIndex = d.getDay() + 1;
            const dayName = daysMap[d.getDay()];

            const filterStats = (status) => emailFlowStats.find(s => s._id.day === dayIndex && s._id.status === status);

            campaignFlow.push({
                name: dayName,
                sent: filterStats("sent")?.count || filterStats("delivered")?.count || 0,
                failed: filterStats("failed")?.count || filterStats("bounced")?.count || 0,
                queued: filterStats("queued")?.count || 0,
                processing: filterStats("processing")?.count || 0
            });
        }

        // 5. Overall Summary (Calculated from accurate EmailStatus collection)
        const totalCampaigns = await Job.countDocuments();
        const emailAgg = await EmailStatus.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    failed: { $sum: { $cond: [{ $in: ["$status", ["failed", "bounced"]] }, 1, 0] } },
                    queued: { $sum: { $cond: [{ $eq: ["$status", "queued"] }, 1, 0] } }
                }
            }
        ]);

        const totalEmails = emailAgg[0]?.total || 0;
        const failedEmailsCount = emailAgg[0]?.failed || 0;
        const queueCount = emailAgg[0]?.queued || 0;
        const failureRate = totalEmails > 0 ? (failedEmailsCount / totalEmails) * 100 : 0;

        // Fetch recent failed emails
        const failedDocs = await EmailStatus.find({
            status: { $in: ["failed", "bounced"] }
        })
            .sort({ updatedAt: -1 })
            .limit(50)
            .select("email error updatedAt");

        const failedList = failedDocs.map(d => ({
            email: d.email,
            reason: d.error || "Unknown error",
            timestamp: d.updatedAt
        }));

        res.json({
            performance: {
                growth: parseFloat(growthPercentage.toFixed(1)),
                totalUsers
            },
            tierDistribution,
            validationActivity,
            campaignFlow,
            summary: {
                totalCampaigns,
                totalEmails,
                failedEmailsCount,
                queueCount,
                failureRate: parseFloat(failureRate.toFixed(1)),
                failedList
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/users
export const getUsers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            };
        }

        // Include credits lookup?
        // Using aggregation to join with 'credits' collection
        const users = await User.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "credits", // collection name usually lowercase plural
                    localField: "_id",
                    foreignField: "user_id",
                    as: "creditInfo"
                }
            },
            {
                $project: {
                    id: "$_id",
                    name: "$name",
                    email: "$email",
                    plan: "$plan",
                    isBlocked: "$isBlocked",
                    avatar: "$avatar",
                    credits: { $ifNull: [{ $arrayElemAt: ["$creditInfo.credits", 0] }, 0] },
                    massMalingCredits: { $ifNull: [{ $arrayElemAt: ["$creditInfo.massMalingCredits", 0] }, 0] }
                }
            }
        ]);

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/admin/users/:id
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked, plan, credits, massMalingCredits } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (isBlocked !== undefined) user.isBlocked = isBlocked;
        if (plan !== undefined) user.plan = plan;

        await user.save();

        // Update credits if provided
        if (credits !== undefined || massMalingCredits !== undefined) {
            let creditRecord = await Credit.findOne({ user_id: id });

            const addCreditsAmount = credits !== undefined ? Number(credits) : 0;
            const addMassAmount = massMalingCredits !== undefined ? Number(massMalingCredits) : 0;

            if (!creditRecord) {
                // Create if not exists
                await Credit.create({
                    user_id: id,
                    credits: addCreditsAmount,
                    total_credits: addCreditsAmount,
                    massMalingCredits: addMassAmount
                });
            } else {
                if (addCreditsAmount > 0) {
                    creditRecord.credits += addCreditsAmount;
                    creditRecord.total_credits += addCreditsAmount;
                }
                if (addMassAmount > 0) {
                    creditRecord.massMalingCredits += addMassAmount;
                }
                await creditRecord.save();
            }
        }

        res.json({ message: "User updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Update failed" });
    }
};

// GET /api/admin/history
export const getActivityLogs = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};

        if (status && status !== "All") {
            query.status = status;
        }

        // Search logic might be complex if searching by user name (which is in joined table)
        // For simplicity, let's allow search by source first.
        if (search) {
            query.source = { $regex: search, $options: "i" };
        }

        const logs = await ActivityLog.find(query)
            .populate("user", "name email")
            .sort({ timestamp: -1 })
            .limit(100); // limit to last 100 for now

        // Filter by user name/email if search provided (manual filter after populate since simple find logic)
        // OR better: use aggregate to lookup user and match

        let formattedLogs = logs.map(log => ({
            id: log._id,
            user: {
                name: log.user?.name || "Unknown",
                email: log.user?.email || "Unknown"
            },
            action: log.action,
            volume: log.volume,
            source: log.source,
            status: log.status,
            timestamp: log.timestamp
        }));

        if (search) {
            const lowerSearch = search.toLowerCase();
            formattedLogs = formattedLogs.filter(l =>
                l.user.name.toLowerCase().includes(lowerSearch) ||
                l.user.email.toLowerCase().includes(lowerSearch) ||
                l.source.toLowerCase().includes(lowerSearch)
            );
        }

        res.json(formattedLogs);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};



// GET /api/admin/campaigns
export const getAllCampaigns = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const campaigns = await Job.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Job.countDocuments();

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
            issuedBy: job.userId ? job.userId.name : "Unknown", // Keep for backward compatibility if needed
            issuer: {
                name: job.userId ? job.userId.name : "Unknown",
                email: job.userId ? job.userId.email : "Unknown"
            },
            totalEmails: job.totalEmails,
            jobStatus: job.status,
            createdAt: job.createdAt,
            stats: statsMap[job._id.toString()] || { sent: 0, failed: 0, opened: 0, not_opened: 0 }
        }));

        res.json({
            campaigns: formattedCampaigns,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page)
        });
    } catch (err) {
        console.error("Error fetching campaigns:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/campaigns/:jobId
export const getCampaignDetails = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId).populate("userId", "name email");
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
                // map processing to queued for simplicity or keep separate if needed
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
        // Optional: Pagination for emails can be added here if needed
        const emailDocs = await EmailStatus.find({ jobId: jobId }).sort({ createdAt: -1 });

        const emails = emailDocs.map(e => ({
            email: e.email,
            status: e.status,
            opened: e.opened || false,
            reason: e.error || (e.status === 'failed' ? "Unknown Error" : null),
            updatedAt: e.updatedAt || e.createdAt
        }));

        res.json({
            jobId: job._id,
            fileName: job.fileName,
            issuedBy: job.userId ? job.userId.name : "Unknown",
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
