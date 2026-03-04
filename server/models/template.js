import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        s3Key: {
            type: String,
            required: true,
            unique: true,
        },
        createdBy: {
            type: String,
            ref: "User",
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Template = mongoose.model("Template", templateSchema);

export default Template;
