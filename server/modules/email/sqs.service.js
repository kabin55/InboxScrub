import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

let _sqsClient = null;

const getSQSClient = () => {
    if (!_sqsClient) {
        _sqsClient = new SQSClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    return _sqsClient;
};

export const sendToSQS = async (job) => {
    try {
        const queueUrl = process.env.SQS_QUEUE_URL;
        if (!queueUrl) {
            console.error("SQS_QUEUE_URL is not defined in environment variables.");
            return;
        }

        const messagePayload = {
            event: "job_created",
            ...job.toObject()
        };

        const messageBody = JSON.stringify(messagePayload);

        const command = new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: messageBody,
        });

        const response = await getSQSClient().send(command);
        return response;
    } catch (err) {
        console.error("Failed to send message to SQS:", err.message);
        throw err;
    }
};

export const sendDirectToSQS = async (job) => {
    try {
        const queueUrl = process.env.SQS_DIRECT_QUEUE_URL || process.env.SQS_QUEUE_URL;
        if (!queueUrl) {
            console.error("SQS_DIRECT_QUEUE_URL or SQS_QUEUE_URL is not defined in environment variables.");
            return;
        }

        const jobData = typeof job.toObject === 'function' ? job.toObject() : job;
        const { emails, content, _id, jobId: payloadJobId, channel, ...rest } = jobData;
        const jobId = _id || payloadJobId;

        if (!emails || emails.length === 0) return;

        const messages = emails.map(emailObj => {
            const emailAddr = typeof emailObj === 'object' ? emailObj.email : emailObj;
            return {
                Id: crypto.randomUUID(),
                MessageBody: JSON.stringify({
                    event: `${channel || 'message'}_queued`,
                    jobId,
                    email: emailAddr,
                    phone: typeof emailObj === 'object' ? emailObj.phone : "",
                    name: typeof emailObj === 'object' ? emailObj.name : "",
                    content,
                    channel: channel || 'message',
                    retryCount: 0,
                    ...rest
                })
            };
        });

        const responses = [];
        for (let i = 0; i < messages.length; i += 10) {
            const batch = messages.slice(i, i + 10);
            const command = new SendMessageBatchCommand({ QueueUrl: queueUrl, Entries: batch });
            const response = await getSQSClient().send(command);
            responses.push(response);
        }

        return responses;
    } catch (err) {
        console.error("Failed to send message to DIRECT SQS:", err.message);
        throw err;
    }
};
