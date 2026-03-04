
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { triggerJobProcessor } from "../services/lambda.service.js";

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
        type: [String],
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
}, {
    timestamps: true // creates createdAt and updatedAt
});

/* Track if document is new */
jobSchema.pre("save", function () {
    this._wasNew = this.isNew;
});


jobSchema.post("save", async function (doc) {
    if (this._wasNew && doc.status === "queued") {
        try {
            await triggerJobProcessor(doc);
        } catch (err) {
            console.error("Lambda trigger error:", err.message);
        }
    }
});



export default mongoose.model("Job", jobSchema);
