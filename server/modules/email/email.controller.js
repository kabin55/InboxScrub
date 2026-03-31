import { validateEmailDeliverability } from "./email.validation.service.js";
import { processSingleEmail, processBulkEmails } from "./email.processing.service.js";
import UsageHistory from "../../models/usageHistory.js";
import Credit from "../../models/credits.js";
import Batch from "../../models/batchs.js";
import ActivityLog from "../../models/activityLog.js";
import Job from "../../models/job.js";
import { v4 as uuidv4 } from "uuid";
import { parseEmailsFromBuffer } from "../../utils/emailParser.js";
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.resolve(__dirname, 'email.worker.js');

export const validateEmail = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email required' })
    }

    const { isCached, data: result } = await processSingleEmail(email);

    if (req.user && req.user.user_id) {
      try {
        let mappedResult = 'undeliverable';
        if (result.confidence === 'High') mappedResult = 'Deliverable';
        else if (result.confidence === 'Medium') mappedResult = 'risky';

        await UsageHistory.findOneAndUpdate(
          {
            user_id: req.user.user_id,
            email_checked: email,
            type: 'single'
          },
          {
            $set: {
              result: mappedResult,
              confidence: result.confidence,
              validation_details: result.results,
              created_at: new Date()
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await ActivityLog.create({
          user: req.user.user_id,
          action: "Single Verify",
          volume: 1,
          source: "Single Email Page",
          status: "Success"
        });
      } catch (saveErr) {
        console.error("Failed to save usage history:", saveErr);
      }
    }

    return res.json({ success: true, result, credits_used: req.creditsUsed });
  } catch (err) {
    return res.status(500).json({
      message: "Email validation failed",
    });
  }
}

export const preParseEmailCount = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const emails = parseEmailsFromBuffer(req.file.buffer);

    if (emails.length === 0) {
      return res.status(400).json({
        message: "No valid emails found in file",
      });
    }

    if (emails.length > 100000) {
      return res.status(400).json({
        message: "Maximum 100,000 emails allowed per upload",
      });
    }

    req.emailCount = emails.length;
    next();
  } catch (err) {
    console.error("Error parsing uploaded file:", err);
    return res.status(400).json({
      message: "Failed to parse uploaded file",
    });
  }
};

export const bulkValidate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const emails = parseEmailsFromBuffer(req.file.buffer);

    if (emails.length === 0) {
      return res.status(400).json({ message: "No valid emails found" });
    }

    const { existingEmails, newEmails: emailsToValidate } = await processBulkEmails(emails);

    const concurrency = Math.min(emailsToValidate.length, 10); 
    const queue = [...emailsToValidate];
    const newResults = [];
    const bulkId = uuidv4();

    if (queue.length > 0) {
        const workers = Array.from({ length: concurrency }, () => {
            return new Promise((resolve) => {
                const worker = new Worker(workerPath);
                
                const processNext = () => {
                    const emailObj = queue.pop();
                    if (!emailObj) {
                        worker.terminate();
                        return resolve();
                    }
                    
                    worker.postMessage({ email: emailObj.email, config: {} });
                    
                    worker.once('message', (msg) => {
                        if (msg.success) {
                            newResults.push({ ...msg.result, name: emailObj.name, phone: emailObj.phone });
                        } else {
                            newResults.push({
                                name: emailObj.name, 
                                phone: emailObj.phone, 
                                email: emailObj.email, 
                                confidence: "Low",
                                error: "Worker validation failed", 
                                errorMessage: msg.error
                            });
                        }
                        processNext();
                    });
                };
                
                processNext();
            });
        });

        await Promise.all(workers);
    }

    if (req.user && req.user.user_id && newResults.length > 0) {
      try {
        const newUsageItems = newResults.map(result => {
          let mappedResult = 'undeliverable';
          if (result.confidence === 'High') mappedResult = 'Deliverable';
          else if (result.confidence === 'Medium') mappedResult = 'risky';

          return {
            user_id: req.user.user_id,
            email_checked: result.email,
            type: 'bulk',
            bulk_id: bulkId,
            result: mappedResult,
            confidence: result.confidence,
            validation_details: result.results || {}
          };
        });
        await UsageHistory.insertMany(newUsageItems);
      } catch (saveErr) {
        console.error("Failed to save new bulk usage items:", saveErr);
      }
    }

    if (req.user && req.user.user_id && existingEmails.length > 0) {
      try {
        const usageItems = existingEmails.map(result => {
          let mappedResult = 'undeliverable';
          if (result.confidence === 'High') mappedResult = 'Deliverable';
          else if (result.confidence === 'Medium') mappedResult = 'risky';

          return {
            user_id: req.user.user_id,
            email_checked: result.email,
            type: 'bulk',
            bulk_id: bulkId,
            result: mappedResult,
            confidence: result.confidence,
            validation_details: result.results
          };
        });
        await UsageHistory.insertMany(usageItems);
      } catch (saveErr) {
        console.error("Failed to save existing bulk usage items:", saveErr);
      }
    }

    const allResults = [...existingEmails, ...newResults];

    const highConfidenceEmails = allResults.filter(r => r.confidence === 'High');
    const mediumConfidenceEmails = allResults.filter(r => r.confidence === 'Medium');
    const lowConfidenceEmails = allResults.filter(
      r => r.confidence !== 'High' && r.confidence !== 'Medium'
    );

    if (req.user && req.user.user_id && highConfidenceEmails.length > 0) {
      try {
        const validEmails = highConfidenceEmails.map(r => ({
           name: r.name || "",
           email: r.email,
           phone: r.phone || ""
        }));

        let userBatch = await Batch.findOne({ user_id: req.user.user_id });

        if (!userBatch) {
          userBatch = new Batch({ user_id: req.user.user_id, batches: [] });
        }

        userBatch.batches.push({
          emails: validEmails,
          batchName: `Batch ${new Date().toLocaleString()}`,
          createdAt: new Date()
        });

        userBatch.batches = userBatch.batches
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .slice(-5);

        await userBatch.save();
      } catch (batchErr) {
        console.error("Failed to save batch:", batchErr);
      }
    }

    if (req.user && req.user.user_id) {
      try {
        await ActivityLog.create({
          user: req.user.user_id,
          action: "Bulk Sanitization",
          volume: emails.length,
          source: req.file.originalname || "File Upload",
          status: "Success"
        });
      } catch (logErr) {
        console.error("Failed to save activity log:", logErr);
      }
    }

    res.json({
      success: true,
      total_emails: emails.length,
      credits_used: req.creditsUsed,
      existingEmails,
      newEmails: newResults,
      summary: {
        high: highConfidenceEmails.length,
        medium: mediumConfidenceEmails.length,
        low: lowConfidenceEmails.length,
      },
      results: {
        highConfidenceEmails,
        mediumConfidenceEmails,
        lowConfidenceEmails,
      },
    });

  } catch (err) {
    return res.status(500).json({
      message: "Bulk validation failed",
    });
  }
};

export const getValidationSummary = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const creditDoc = await Credit.findOne({ user_id: userId });
    const totalCredits = creditDoc ? creditDoc.credits : 0;
    const massMalingCredits = creditDoc ? creditDoc.massMalingCredits : 0;

    const totalEmail = await UsageHistory.countDocuments({ user_id: userId });

    const stats = await UsageHistory.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: "$result",
          count: { $sum: 1 }
        }
      }
    ]);

    const email_result_summary = {
      deliverable: 0,
      risky: 0,
      undeliverable: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'Deliverable') email_result_summary.deliverable = stat.count;
      else if (stat._id === 'risky') email_result_summary.risky = stat.count;
      else if (stat._id === 'undeliverable') email_result_summary.undeliverable = stat.count;
    });

    const singleEmailDocs = await UsageHistory.find({
      user_id: userId,
      type: 'single'
    })
      .sort({ created_at: -1 })
      .limit(20)
      .select('email_checked result confidence validation_details created_at');

    const FAILURE_PRIORITY = ['catchAll', 'roleBased', 'smtp', 'mx', 'domain', 'syntax', 'disposable'];

    const singleEmail = singleEmailDocs.map(doc => {
      let reason = 'Valid email';
      const result = doc.result?.toLowerCase();

      if (result !== 'deliverable' && doc.validation_details) {
        for (const key of FAILURE_PRIORITY) {
          const check = doc.validation_details[key];
          if (check && check.value === false && check.reason) {
            reason = check.reason;
            break;
          }
        }
        if (!reason || reason === 'Valid email') {
          reason = 'Validation failed (no reason provided)';
        }
      }

      return {
        _id: doc._id,
        email: doc.email_checked,
        outcome: result ? result.charAt(0).toUpperCase() + result.slice(1) : 'Unknown',
        confidence: doc.confidence,
        reason,
        validated_at: doc.created_at,
        validation_details: doc.validation_details 
      };
    });

    const bulkStats = await UsageHistory.aggregate([
      { $match: { user_id: userId, type: 'bulk' } },
      {
        $group: {
          _id: "$bulk_id",
          total: { $sum: 1 },
          deliverable: {
            $sum: { $cond: [{ $eq: ["$result", "Deliverable"] }, 1, 0] }
          },
          risky: {
            $sum: { $cond: [{ $eq: ["$result", "risky"] }, 1, 0] }
          },
          undeliverable: {
            $sum: { $cond: [{ $eq: ["$result", "undeliverable"] }, 1, 0] }
          },
          created_at: { $max: "$created_at" }
        }
      },
      { $sort: { created_at: -1 } },
      { $limit: 10 }
    ]);

    const bulkEmailHistory = bulkStats.map(stat => ({
      bulk_id: stat._id,
      total: stat.total,
      deliverable: stat.deliverable,
      risky: stat.risky,
      undeliverable: stat.undeliverable,
      created_at: stat.created_at
    }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityStats = await UsageHistory.aggregate([
      {
        $match: {
          user_id: userId,
          created_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          single: { $sum: { $cond: [{ $eq: ["$type", "single"] }, 1, 0] } },
          bulk: { $sum: { $cond: [{ $eq: ["$type", "bulk"] }, 1, 0] } },
          campaigns: { $sum: 0 } 
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const activity_data = activityStats.map(stat => ({
      date: stat._id,
      single: stat.single,
      bulk: stat.bulk,
      campaigns: stat.campaigns
    }));

    const countsAggregation = await UsageHistory.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: { type: "$type", bulk_id: "$bulk_id" },
          itemCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          singleCount: { $sum: { $cond: [{ $eq: ["$_id.type", "single"] }, "$itemCount", 0] } },
          tenEmailCount: { $sum: { $cond: [{ $and: [{ $eq: ["$_id.type", "bulk"] }, { $eq: ["$itemCount", 10] }] }, 1, 0] } },
          bulkCount: { $sum: { $cond: [{ $and: [{ $eq: ["$_id.type", "bulk"] }, { $ne: ["$itemCount", 10] }] }, 1, 0] } }
        }
      }
    ]);

    const campaignStats = await Job.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          totalCampaignEmails: { $sum: "$totalEmails" }
        }
      }
    ]);

    const campaignData = campaignStats[0] || { totalCampaigns: 0, totalCampaignEmails: 0 };
    const validation_counts = countsAggregation[0] || { singleCount: 0, tenEmailCount: 0, bulkCount: 0 };

    res.json({
      success: true,
      total_credits: totalCredits,
      massMalingCredits: massMalingCredits,
      totalEmail,
      email_result_summary,
      singleEmail,
      bulkEmailHistory,
      activity_data, 
      validation_counts: {
        single: validation_counts.singleCount,
        ten: validation_counts.tenEmailCount,
        bulk: validation_counts.bulkCount,
        campaigns: campaignData.totalCampaigns,
        totalCampaignEmails: campaignData.totalCampaignEmails
      }
    });

  } catch (err) {
    console.error("Summary fetch failed:", err);
    res.status(500).json({ message: "Failed to fetch validation summary" });
  }
};

export const clearHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    await UsageHistory.deleteMany({ user_id: userId });
    res.json({ success: true, message: "History cleared successfully" });
  } catch (err) {
    console.error("Clear history failed:", err);
    res.status(500).json({ message: "Failed to clear history" });
  }
};

export const getUserBatches = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userBatch = await Batch.findOne({ user_id: userId });
    if (!userBatch || !userBatch.batches || userBatch.batches.length === 0) {
      return res.json({ success: true, batches: [] });
    }
    const batches = userBatch.batches.map(batch => ({
      _id: batch._id,
      batchName: batch.batchName,
      emails: batch.emails,
      createdAt: batch.createdAt
    }));
    batches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, batches });
  } catch (err) {
    console.error("Get batches failed:", err);
    res.status(500).json({ message: "Failed to fetch batches" });
  }
};

export const updateBatchName = async (req, res) => {
  try {
    const { batchId, newBatchName } = req.body;
    const userId = req.user.user_id;
    if (!batchId || !newBatchName) {
      return res.status(400).json({ message: "Batch ID and new name are required" });
    }
    const userBatch = await Batch.findOne({ user_id: userId });
    if (!userBatch) return res.status(404).json({ message: "User batches not found" });
    const batchToUpdate = userBatch.batches.id(batchId);
    if (!batchToUpdate) return res.status(404).json({ message: "Batch not found" });
    batchToUpdate.batchName = newBatchName;
    await userBatch.save();
    res.json({ success: true, message: "Batch name updated successfully", batch: batchToUpdate });
  } catch (err) {
    console.error("Update batch name failed:", err);
    res.status(500).json({ message: "Failed to update batch name" });
  }
};

export const getBulkDetails = async (req, res) => {
  try {
    const { bulkId } = req.params;
    const userId = req.user.user_id;
    if (!bulkId) return res.status(400).json({ message: "Bulk ID is required" });
    const items = await UsageHistory.find({
      user_id: userId,
      bulk_id: bulkId,
      type: 'bulk'
    }).select('email_checked result confidence validation_details');
    const results = items.map(doc => {
      let reason = 'Valid email';
      const result = doc.result?.toLowerCase();
      if (result !== 'deliverable' && doc.validation_details) {
        const FAILURE_PRIORITY = ['catchAll', 'roleBased', 'smtp', 'mx', 'domain', 'syntax', 'disposable'];
        for (const key of FAILURE_PRIORITY) {
          const check = doc.validation_details[key];
          if (check && check.value === false && check.reason) {
            reason = check.reason;
            break;
          }
        }
        if (!reason || reason === 'Valid email') {
          reason = 'Validation failed (no reason provided)';
        }
      }
      return {
        _id: doc._id,
        email: doc.email_checked,
        status: result ? result : 'undeliverable',
        score: doc.confidence === 'High' ? 90 : doc.confidence === 'Medium' ? 70 : 0,
        reason,
        confidence: doc.confidence
      };
    });
    res.json({ success: true, results });
  } catch (err) {
    console.error("Get bulk details failed:", err);
    res.status(500).json({ message: "Failed to fetch bulk details" });
  }
};
