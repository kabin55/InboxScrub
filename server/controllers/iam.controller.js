import crypto from "crypto";
import AccessToken from "../models/accessToken.js";

// @desc    Admin: Create an access token
// @route   POST /api/admin/tokens
// @access  Private (Admin/Superadmin)
export const createToken = async (req, res) => {
    try {
        const { permissions, expiresAt, note } = req.body;

        // Ensure array format for permissions
        const perms = Array.isArray(permissions) ? permissions : [];

        // Generate random 8-byte token and format to hex (16 characters)
        const plainToken = crypto.randomBytes(8).toString('hex');

        // Hash the token using SHA-256 for fast lookups without needing a user identifier
        const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

        // Save mapping to DB
        const newToken = new AccessToken({
            token_hash: tokenHash,
            admin_uid: req.user.user_id, // Link to the admin creating it
            permissions: perms,
            note: note || "", // Save note
            expires_at: expiresAt ? new Date(expiresAt) : null,
            status: 'Active'
        });

        await newToken.save();
        console.log(newToken);
        // Respond with the token value ONCE
        return res.status(201).json({
            success: true,
            token: {
                _id: newToken._id, // the ID
                tokenValue: plainToken, // The plain value - never stored in plaintext
                permissions: newToken.permissions,
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
        // Admins and Users see the tokens they created. Superadmins see all.
        let filter = {};
        if (req.user.role !== 'Superadmin') {
            filter.admin_uid = req.user.user_id;
        }

        const tokens = await AccessToken.find(filter).sort({ created_at: -1 });

        const formattedTokens = tokens.map(t => ({
            _id: t._id,
            permissions: t.permissions,
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

        // Verify ownership or superadmin
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

        // Verify ownership or superadmin
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
