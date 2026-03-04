import mongoose from "mongoose";

const domainSchema = new mongoose.Schema({
    domain: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    isCatchAll: {
        type: Boolean,
        default: false,
    },
    validDomain: {
        type: Boolean,
        default: true,
    },
    mxRecord: {
        type: Boolean,
        default: false,
    },
    mxRecords: {
        type: [
            {
                exchange: String,
                priority: Number
            }
        ],
        default: []
    },
    disposableDomain: {
        type: Boolean,
        default: false,
    },
    smtpFailed: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d', // Automatically expire after 30 days
    },
});

const Domain = mongoose.model("Domain", domainSchema);

export default Domain;
