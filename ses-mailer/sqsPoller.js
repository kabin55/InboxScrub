import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { handler } from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const sqsClient = new SQSClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const QUEUE_URL = process.env.SQS_QUEUE_URL;

export const startPoller = async () => {
    if (!QUEUE_URL) {
        console.error("[SQS-POLLER] SQS_QUEUE_URL is not defined. Polling disabled.");
        return;
    }

    console.log(`[SQS-POLLER] Background poller started for queue: ${QUEUE_URL}`);

    while (true) {
        try {
            const receiveCommand = new ReceiveMessageCommand({
                QueueUrl: QUEUE_URL,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 20, // Long polling
                VisibilityTimeout: 60,
            });

            const { Messages } = await sqsClient.send(receiveCommand);

            if (Messages && Messages.length > 0) {
                console.log(`[SQS-POLLER] Received ${Messages.length} messages`);

                for (const message of Messages) {
                    try {
                        // Construct event object mimicing SQS trigger
                        const event = {
                            Records: [{
                                body: message.Body,
                                messageId: message.MessageId,
                                receiptHandle: message.ReceiptHandle
                            }]
                        };

                        // Process message using the same handler as Lambda
                        await handler(event);

                        // Delete message from queue after successful processing
                        const deleteCommand = new DeleteMessageCommand({
                            QueueUrl: QUEUE_URL,
                            ReceiptHandle: message.ReceiptHandle,
                        });
                        await sqsClient.send(deleteCommand);
                        console.log(`[SQS-POLLER] Successfully processed and deleted message: ${message.MessageId}`);

                    } catch (msgErr) {
                        console.error(`[SQS-POLLER] Error processing message ${message.MessageId}:`, msgErr.message);
                        // Message will stay in SQS and reappear after VisibilityTimeout for retry
                    }
                }
            }
        } catch (pollErr) {
            console.error("[SQS-POLLER] Polling error:", pollErr.message);
            // Wait a bit before retrying if there's a serious error
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};
