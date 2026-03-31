import User from "../../models/user.js";
import Credit from "../../models/credits.js";
import PaymentHistory from "../../models/paymentHistory.js";

/**
 * Get user profile
 * GET /api/user/profile
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const creditDoc = await Credit.findOne({ user_id: userId });

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                oauth_provider: user.oauth_provider,
                created_at: user.created_at,
            },
            credits: {
                balance: creditDoc?.credits || 0,
                total_purchased: creditDoc?.total_credits || 0,
                massMalingCredits: creditDoc?.massMalingCredits || 0,
            },
        });
    } catch (err) {
        console.error("Get profile failed:", err);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

/**
 * Get user credits balance only (for quick refresh)
 * GET /api/user/credits
 */
export const getCredits = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const creditDoc = await Credit.findOne({ user_id: userId });

        res.json({
            success: true,
            credits: creditDoc?.credits || 0,
            total_credits: creditDoc?.total_credits || 0,
            last_updated: creditDoc?.last_updated || null,
        });
    } catch (err) {
        console.error("Get credits failed:", err);
        res.status(500).json({ message: "Failed to fetch credits" });
    }
};

/**
 * Get payment/purchase history
 * GET /api/user/payments
 */
export const getPayments = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const payments = await PaymentHistory.find({ user_id: userId })
            .sort({ payment_date: -1 })
            .limit(50);

        const formattedPayments = payments.map((p) => ({
            id: p._id,
            transaction_id: p.transaction_id,
            credits_added: p.credits_added,
            amount_paid: parseFloat(p.amount_paid.toString()),
            payment_method: p.payment_method,
            payment_date: p.payment_date,
        }));

        res.json({
            success: true,
            payments: formattedPayments,
            total: formattedPayments.length,
        });
    } catch (err) {
        console.error("Get payments failed:", err);
        res.status(500).json({ message: "Failed to fetch payment history" });
    }
};

/**
 * Update user profile
 * PUT /api/user/profile
 */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { name } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Only allow name update for now
        if (name !== undefined) {
            user.name = name;
        }

        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                oauth_provider: user.oauth_provider,
            },
        });
    } catch (err) {
        console.error("Update profile failed:", err);
        res.status(500).json({ message: "Failed to update profile" });
    }
};
