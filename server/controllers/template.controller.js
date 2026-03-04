import multer from "multer";
import Template from "../models/template.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 Client Singleton (lazy load to ensure process.env is read after dotenv config)
let s3ClientInstance = null;
const getS3Client = () => {
    if (!s3ClientInstance) {
        s3ClientInstance = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    return s3ClientInstance;
};

// Configure Multer for processing multipart/form-data
const storage = multer.memoryStorage();
export const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Restrict uploads to only HTML files
        if (file.mimetype === 'text/html' || file.originalname.endsWith('.html')) {
            cb(null, true);
        } else {
            cb(new Error('Only .html files are allowed.'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

export const uploadTemplate = async (req, res) => {
    console.log("Template upload request received");
    console.log("req.body", req.body);
    console.log("req.file", req.file);
    try {
        const userId = req.user.user_id || req.user._id;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded or invalid file type. Only .html is allowed.' });
        }

        const { templateName, description } = req.body;
        if (!templateName) return res.status(400).json({ error: "Template name is required." });

        if (req.file.mimetype !== "text/html" && !req.file.originalname.endsWith(".html")) {
            return res.status(400).json({ error: "Only .html files are allowed." });
        }

        // Create a relatively unique object key
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;

        const uploadParams = {
            Bucket: bucketName,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: "text/html",
        };

        const command = new PutObjectCommand(uploadParams);
        const s3Client = getS3Client();
        await s3Client.send(command);
        console.log(`[Success] Uploaded ${fileName} to S3.`);

        const newTemplate = await Template.create({
            name: templateName,
            description,
            s3Key: fileName,
            createdBy: userId,
            isActive: true,
        });

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            fileName: fileName,
            template: newTemplate
        });
    } catch (error) {
        console.error('[Error] Uploading to S3:', error);
        return res.status(500).json({ error: `Failed to upload file to S3: ${error.message}`, stack: error.stack });
    }
};

export const listTemplates = async (req, res) => {
    try {
        const templates = await Template.find({ isActive: true }).sort({ createdAt: -1 }).select("-__v");
        res.json({ success: true, templates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch templates." });
    }
};

export const getTemplateById = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: "Template not found." });

        const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: template.s3Key,
        });

        // Generate pre-signed URL valid for 1 hour (3600 seconds)
        const s3Client = getS3Client();
        const previewUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        console.log(`[Success] Generated pre-signed URL for ${template.s3Key}. Valid for 1 hour.`);

        res.status(200).json({ success: true, url: previewUrl, previewUrl, template });
    } catch (error) {
        console.error(`[Error] Generating pre-signed URL for ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to generate pre-signed URL.' });
    }
};

export const deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: "Template not found." });

        template.isActive = false;
        await template.save();
        res.json({ success: true, message: "Template marked as deleted." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete template." });
    }
};

/**
 * Internal helper: Fetches the raw HTML template content from S3
 * @param {string} s3Key - S3 Object Key
 * @returns {Promise<string>} - HTML string content
 */
export const getTemplateContentFromS3 = async (s3Key) => {
    const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
    });

    const s3Client = getS3Client();
    const response = await s3Client.send(command);
    return await response.Body.transformToString();
};