
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { sendToSQS } from "../modules/email/sqs.service.js";

const contentSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    sender: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["queued", "sent", "failed"],
        default: "queued",
    },
    retryCount: {
        type: Number,
        default: 0,
    },
}, { _id: false });

const jobSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4,
    },
    userId: {
        type: String,
        ref: "User",
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    totalEmails: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["processing", "completed", "failed", "queued"], // Add typical statuses
        default: "processing",
        required: true
    },
    emails: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
    },
    content: {
        type: [contentSchema],
        default: [],
    },
    startedAt: {
        type: Date,
        default: Date.now,
    },
    scheduledAt: {
        type: Date,
    },
    attachments: {
        type: [String], // Array of URLs or file paths
        default: [],
    },
    notes: {
        type: String,
        default: "",
    },
    tags: {
        type: [String],
        default: [],
    },
    channel: {
        type: String,
        enum: ["email", "whatsapp", "message"],
        default: "email",
    },
    selectedChannels: {
        type: [String],
        default: ["email"],
    },
}, {
    timestamps: true // creates createdAt and updatedAt
});

/* Track if document is new */
jobSchema.pre("save", function () {
    this._wasNew = this.isNew;
});


jobSchema.post("save", async function (doc) {
    console.log(`Checking SQS trigger for Job ${doc._id}. wasNew: ${this._wasNew}, status: ${doc.status}, channel: ${doc.channel}`);
    if (this._wasNew && doc.status === "queued" && doc.channel === "email") {
        try {
            console.log(`Triggering SQS for job ${doc._id}`);
            await sendToSQS(doc);
        } catch (err) {
            console.error("SQS trigger error:", err.message);
        }
    }
});



export default mongoose.model("Job", jobSchema);
