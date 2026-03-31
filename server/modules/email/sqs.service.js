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
