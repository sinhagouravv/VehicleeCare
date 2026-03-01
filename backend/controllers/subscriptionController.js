const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { generatePaymentId } = require('../utils/generateId');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay Subscription Order
// @route   POST /api/subscriptions/order
// @access  Private (Vendor)
exports.createSubscriptionOrder = async (req, res) => {
    try {
        const { planId, amount, currency = 'INR' } = req.body;

        // Ensure user exists
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const options = {
            amount: Math.round(amount * 100), // amount in lowest denomination (paise)
            currency,
            receipt: `rcpt_${user._id}_${Date.now().toString().substring(0, 8)}`,
            payment_capture: 1,
            notes: {
                userId: user._id.toString(),
                planId
            }
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Razorpay Subscription Order Error:", error);
        res.status(500).json({ success: false, message: "Server error creating subscription order" });
    }
};

// @desc    Verify Subscription Payment
// @route   POST /api/subscriptions/verify
// @access  Private (Vendor)
exports.verifySubscriptionPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Find the user and update their subscription
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found to update subscription' });
            }

            // Calculate expiry (e.g., 30 days from now)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            user.subscriptionPlan = planId; // 'Premium' or 'Elite'
            user.subscriptionStatus = 'active';
            user.subscriptionExpiry = expiryDate;
            await user.save(); // Save the updated user data to DB

            // Create Payment tracking record
            const amountPaid = planId === 'Premium' ? 199 : (planId === 'Elite' ? 299 : 99);

            const paymentRecord = await Payment.create({
                paymentId: generatePaymentId(),
                type: 'Subscription',
                user: user.id,
                business: user.id,
                amount: amountPaid,
                method: 'Net Banking',
                status: 'Completed',
                transactionId: razorpay_payment_id
            });

            res.status(200).json({
                success: true,
                message: "Subscription verified and activated successfully",
                paymentId: paymentRecord.paymentId,
                subscription: {
                    plan: user.subscriptionPlan,
                    status: user.subscriptionStatus,
                    expiry: user.subscriptionExpiry
                }
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Subscription Verification Error:", error);
        res.status(500).json({ success: false, message: "Server error verifying subscription payment" });
    }
};
