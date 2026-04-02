 import crypto from "crypto";
import AccessToken from "../../models/accessToken.js";
import User from "../../models/user.js";
import { sendTokenFromAdmin } from "./iam.mailer.js";

// @desc    Admin: Create an access token
// @route   POST /api/admin/tokens
// @access  Private (Admin/Superadmin)
export const createToken = async (req, res) => {
    try {
        const { email, permissions, expiresAt, note, trackEmail } = req.body;

        if (!email || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({ message: "Email and at least one permission are required." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid user email format." });
        }

        if (expiresAt) {
            const expDate = new Date(expiresAt);
            if (isNaN(expDate.getTime()) || expDate <= new Date()) {
                return res.status(400).json({ message: "Expiration date must be a valid future date." });
            }
        }

        const admin = await User.findById(req.user.user_id);
        if (!admin) {
            return res.status(401).json({ message: "Admin user not found." });
        }

        const plainToken = crypto.randomBytes(8).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
        
        let jobId;

        try {
            // Send email from admin BEFORE saving to DB (or after, depending on preference. Here after is safer for integrity if email fails, but we don't want a stranded token. Wait, if email fails we should not save token maybe? Or save token and try email? We'll try email and if it fails throw, so token isn't created.)
            // Actually, wait, job tracking generates ID. Let's create the job first.
            const mailRes = await sendTokenFromAdmin(
                admin.email, 
                null, // placeholder for admin OAuth credentials if implemented later
                email, 
                plainToken, 
                permissions, 
                note, 
                expiresAt, 
                trackEmail
            );
            if (mailRes && mailRes.jobId) {
                jobId = mailRes.jobId;
            }
        } catch (emailErr) {
            console.error("Failed to send token email:", emailErr);
            return res.status(500).json({ message: "Failed to securely email the token. The token was not generated." });
        }

        const newToken = new AccessToken({
            token_hash: tokenHash,
            admin_uid: req.user.user_id, 
            permissions: permissions,
            assigned_email: email,
            job_id: jobId,
            note: note || "", 
            expires_at: expiresAt ? new Date(expiresAt) : null,
            status: 'Active'
        });

        await newToken.save();
        
        return res.status(201).json({
            success: true,
            message: "Token generated and emailed to user.",
            token: {
                _id: newToken._id, 
                permissions: newToken.permissions,
                assignedEmail: newToken.assigned_email,
                jobId: newToken.job_id,
                note: newToken.note,
                expiresAt: newToken.expires_at,
                status: newToken.status,
                createdAt: newToken.created_at,
            }
        });
    } catch (error) {
        console.error("Error creating access token:", error);
        res.status(500).json({ message: "Failed to create token" });
    }
};

// @desc    Admin: Get all tokens created by admin
// @route   GET /api/admin/tokens
// @access  Private (Admin/Superadmin)
export const getTokens = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role !== 'Superadmin') {
            filter.admin_uid = req.user.user_id;
        }

        const tokens = await AccessToken.find(filter).sort({ created_at: -1 });

        const formattedTokens = tokens.map(t => ({
            _id: t._id,
            permissions: t.permissions,
            assignedEmail: t.assigned_email,
            jobId: t.job_id,
            note: t.note,
            expiresAt: t.expires_at,
            status: t.status,
            createdAt: t.created_at
        }));

        return res.status(200).json({
            success: true,
            tokens: formattedTokens
        });
    } catch (error) {
        console.error("Error fetching tokens:", error);
        res.status(500).json({ message: "Failed to fetch tokens" });
    }
};

// @desc    Admin: Update token permissions or expiration
// @route   PATCH /api/admin/tokens/:id
// @access  Private (Admin/Superadmin)
export const updateToken = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions, expiresAt, note } = req.body;

        const token = await AccessToken.findById(id);

        if (!token) {
            return res.status(404).json({ message: "Token not found" });
        }

        if (req.user.role !== 'Superadmin' && token.admin_uid !== req.user.user_id) {
            return res.status(403).json({ message: "Not authorized to update this token" });
        }

        if (permissions !== undefined) token.permissions = permissions;
        if (note !== undefined) token.note = note;
        if (expiresAt !== undefined) token.expires_at = expiresAt ? new Date(expiresAt) : null;

        await token.save();

        return res.status(200).json({
            success: true,
            token: {
                _id: token._id,
                permissions: token.permissions,
                assignedEmail: token.assigned_email,
                jobId: token.job_id,
                note: token.note,
                expiresAt: token.expires_at,
                status: token.status,
                createdAt: token.created_at
            }
        });
    } catch (error) {
        console.error("Error updating token:", error);
        res.status(500).json({ message: "Failed to update token" });
    }
};

// @desc    Admin: Revoke token
// @route   DELETE /api/admin/tokens/:id
// @access  Private (Admin/Superadmin)
export const revokeToken = async (req, res) => {
    try {
        const { id } = req.params;
        const token = await AccessToken.findById(id);

        if (!token) {
            return res.status(404).json({ message: "Token not found" });
        }

        if (req.user.role !== 'Superadmin' && token.admin_uid !== req.user.user_id) {
            return res.status(403).json({ message: "Not authorized to revoke this token" });
        }

        token.status = 'Revoked';
        await token.save();

        return res.status(200).json({
            success: true,
            message: "Token revoked"
        });
    } catch (error) {
        console.error("Error revoking token:", error);
        res.status(500).json({ message: "Failed to revoke token" });
    }
};
