import EmailStatus from '../../models/emailStatus.js';
import Job from '../../models/job.js';
import { sendWhatsappMessage } from './whatsapp.service.js';
import { stripHtml } from '../../utils/htmlToText.js';

const FOLLOW_UP_INTERVAL = parseInt(process.env.WHATSAPP_INTERVAL) || 60000; 

export const startFollowUpService = () => {
    setInterval(async () => {
        try {
            const delayMinutes = parseInt(process.env.WHATSAPP_FOLLOW_UP_DELAY_MINUTES) || 30;
            const delayMs = delayMinutes * 60 * 1000;
            const cutoffTime = new Date(Date.now() - delayMs);

            const pendingFollowUps = await EmailStatus.find({
                phone: { $exists: true, $ne: "" },
                status: "sent",
                opened: false,
                whatsappStatus: "pending",
                lastUpdated: { $lt: cutoffTime }
            });

            if (pendingFollowUps.length === 0) return;

            for (const record of pendingFollowUps) {
                try {
                    const job = await Job.findById(record.jobId);
                    if (!job) continue;

                    const channels = job.selectedChannels || [];
                    if (!channels.includes('email') || !channels.includes('whatsapp')) {
                        await EmailStatus.updateOne({ _id: record._id }, { $set: { whatsappStatus: "skipped_channel_criteria" } });
                        continue;
                    }

                    const emailBody = job.content && job.content[0] ? job.content[0].body : "";
                    const message = stripHtml(emailBody) || "Following up on our recent email.";

                    const result = await sendWhatsappMessage({ to: record.phone, message });

                    if (result.success) {
                        await EmailStatus.updateOne(
                            { _id: record._id },
                            {
                                $set: {
                                    whatsappStatus: "sent",
                                    lastUpdated: new Date()
                                }
                            }
                        );
                    } else {
                        await EmailStatus.updateOne(
                            { _id: record._id },
                            {
                                $set: {
                                    whatsappStatus: "failed",
                                    error: result.error,
                                    lastUpdated: new Date()
                                }
                            }
                        );
                    }
                } catch (err) {
                    console.error(`[WHATSAPP-FOLLOWUP] Error processing record ${record._id}:`, err);
                }
            }
        } catch (error) {
            console.error('[WHATSAPP-FOLLOWUP] Error in follow-up interval:', error);
        }
    }, FOLLOW_UP_INTERVAL);
};
