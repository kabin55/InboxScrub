/**
 * Stub service for SMS/Internal messaging channel.
 */

export const sendMessage = async ({ phone, name, message, campaignName }) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const recipientName = name || 'Customer';
            const body = message || `Hi ${recipientName}, you have a new message regarding "${campaignName}". Please check your inbox.`;
            const logMessage = `[MESSAGE-STUB] Sending SMS to ${phone}: ${body}`;
            console.log(logMessage);
            resolve({ success: true, messageId: `msg_${Date.now()}` });
        }, 1000);
    });
};
