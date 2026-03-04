import { validateEmailDeliverability } from "../services/emailValidation.service.js";
import { processSingleEmail, processBulkEmails } from "../services/allEmail.service.js";
import UsageHistory from "../models/usageHistory.js";
import Credit from "../models/credits.js";
import Batch from "../models/batchs.js";
import ActivityLog from "../models/activityLog.js";
import Job from "../models/job.js";
import { v4 as uuidv4 } from "uuid";
import { parseEmailsFromBuffer } from "../utils/emailParser.js";

export const validateEmail = async (req, res) => {
  try {
    const { email } = req.body
    console.log("email", email);
    if (!email) {
      return res.status(400).json({ error: 'Email required' })
    }

    const { isCached, data: result } = await processSingleEmail(email);

    // Persist result
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

        // Add Activity Log
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

    // CRITICAL: must match bulkValidate exactly
    req.emailCount = emails.length;

    next();
  } catch (err) {
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

    // Concurrency configuration
    const concurrency = 5; // adjust as needed
    const queue = [...emailsToValidate];
    const newResults = [];
    console.log(`Starting bulk validation. Cached: ${existingEmails.length}, Processing: ${emailsToValidate.length}`);

    const bulkId = uuidv4();

    // Worker function for concurrent validation ONLY on newEmails
    const workers = Array.from({ length: concurrency }, async () => {
      while (true) {
        let email;
        // Use atomic fetch from queue
        email = queue.pop();
        if (!email) break;
        try {
          const result = await validateEmailDeliverability(email, { /* config */ });
          newResults.push(result);

          // (Persistence moved to batch insertMany after all workers finish to reduce DB load)

        } catch (err) {
          // If validation crashes, treat as 'undeliverable' / 'Low' confidence or similar
          newResults.push({
            email, confidence: "Low",
            error: "Validation failed", errorMessage: err.message
          });
        }
      }
    });

    await Promise.all(workers);

    // Persist bulk result for new emails
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

    // Persist bulk result for existing emails to maintain accurate bulk summary
    if (req.user && req.user.user_id && existingEmails.length > 0) {
      try {
        const usageItems = existingEmails.map(result => {
          let mappedResult = 'undeliverable';
          // Using strict matching for confidence as before
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

    // Combine for Batch saving & Summary
    const allResults = [...existingEmails, ...newResults];

    // Separate by confidence using all results
    const highConfidenceEmails = allResults.filter(r => r.confidence === 'High');
    const mediumConfidenceEmails = allResults.filter(r => r.confidence === 'Medium');
    const lowConfidenceEmails = allResults.filter(
      r => r.confidence !== 'High' && r.confidence !== 'Medium'
    );

    // Save high confidence emails to Batch
    if (req.user && req.user.user_id && highConfidenceEmails.length > 0) {
      try {
        const validEmails = highConfidenceEmails.map(r => r.email);

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

    // Add Activity Log for Bulk
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

    // Output Behavior (Bulk) - Return existingEmails and newEmails
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

    // 0. Total Credits
    const creditDoc = await Credit.findOne({ user_id: userId });
    const totalCredits = creditDoc ? creditDoc.credits : 0;
    const massMalingCredits = creditDoc ? creditDoc.massMalingCredits : 0;

    // 1. Total Count of processed emails (all types)
    const totalEmail = await UsageHistory.countDocuments({ user_id: userId });

    // 2. Aggregated Counts (Overall)
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

    // 3. Single Email History (Recent validations, type='single')

    const singleEmailDocs = await UsageHistory.find({
      user_id: userId,
      type: 'single'
    })
      .sort({ created_at: -1 })
      .limit(20)
      .select('email_checked result confidence validation_details created_at');

    const FAILURE_PRIORITY = [
      'catchAll',
      'roleBased',
      'smtp',
      'mx',
      'domain',
      'syntax',
      'disposable'
    ];

    const singleEmail = singleEmailDocs.map(doc => {
      let reason = 'Valid email';

      // Normalize result to lowercase for consistency
      const result = doc.result?.toLowerCase();

      if (result !== 'deliverable' && doc.validation_details) {
        for (const key of FAILURE_PRIORITY) {
          const check = doc.validation_details[key];

          if (check && check.value === false && check.reason) {
            reason = check.reason;
            break;
          }
        }

        // Fallback if no explicit reason is found
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
        validation_details: doc.validation_details // Include details for frontend usage
      };
    });

    // 4. Bulk Email History
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

    // 5. Activity by Date (last 30 days)
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
          campaigns: { $sum: 0 } // Campaign feature not yet implemented
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

    // 6. Specific Validation Counts for Dashboard Table
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

    // Fetch Campaign Counts directly from Job model
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
      activity_data, // Note: Activity data for campaigns is still 0 in the chart as it requires joining collections or separate query
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

    // Format response as an array of batch objects
    const batches = userBatch.batches.map(batch => ({
      _id: batch._id,
      batchName: batch.batchName,
      emails: batch.emails,
      createdAt: batch.createdAt
    }));

    // Sort by newest first
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

    if (!userBatch) {
      return res.status(404).json({ message: "User batches not found" });
    }

    const batchToUpdate = userBatch.batches.id(batchId);

    if (!batchToUpdate) {
      return res.status(404).json({ message: "Batch not found" });
    }

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

    if (!bulkId) {
      return res.status(400).json({ message: "Bulk ID is required" });
    }

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
      } else if (result === 'risky' && doc.validation_details) {
        const reasons = Object.values(doc.validation_details)
          .filter(r => r.reason)
          .map(r => r.reason);
        if (reasons.length > 0) reason = reasons.join("\\n");
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

export const getBulkResults = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { bulkId } = req.params;

    if (!bulkId) {
      return res.status(400).json({ message: "Bulk ID is required" });
    }

    const results = await UsageHistory.find({
      user_id: userId,
      type: 'bulk',
      bulk_id: bulkId
    }).select('email_checked result confidence validation_details -_id');

    // Format the response to match the SanitizedEmail structure used by the frontend
    const formattedResults = results.map(doc => {
      let status = 'undeliverable';
      let score = 0;
      let reason = 'Verified';

      if (doc.confidence === 'High') {
        status = 'deliverable';
        score = 90;
        reason = 'Safe to send';
      } else if (doc.confidence === 'Medium') {
        status = 'risky';
        score = 70;
        reason = 'Risky email';
      } else {
        status = 'undeliverable';
        score = 0;
        reason = 'Validation failed';
      }

      // Check validation details for specific reasons if it's not High confidence
      if (doc.confidence !== 'High' && doc.validation_details) {
        const FAILURE_PRIORITY = ['catchAll', 'roleBased', 'smtp', 'mx', 'domain', 'syntax', 'disposable'];
        for (const key of FAILURE_PRIORITY) {
          const check = doc.validation_details[key];
          if (check && check.value === false && check.reason) {
            reason = check.reason;
            break;
          }
        }
      }

      return {
        email: doc.email_checked,
        status,
        score,
        reason
      };
    });

    res.json({ success: true, results: formattedResults });
  } catch (err) {
    console.error("Failed to fetch bulk results:", err);
    res.status(500).json({ message: "Failed to fetch bulk validation results" });
  }
};
