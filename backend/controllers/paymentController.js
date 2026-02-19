const Payment = require('../models/Payment');

const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay Order
// @route   POST /api/payments/order
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;
        const options = {
            amount: Math.round(amount * 100), // amount in lowest denomination (paise)
            currency,
            receipt,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ success: false, message: "Server error creating order" });
    }
};

// @desc    Verify Payment Signature
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.status(200).json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ success: false, message: "Server error verifying payment" });
    }
};

// @desc    Get user payments
// @route   GET /api/payments/:userId
// @access  Public (should be Private)
exports.getUserPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.params.userId })
            .populate({
                path: 'booking',
                select: 'vehicle service schedule garage',
                populate: { path: 'garage', select: 'name' } // If garage is a ref
            })
            .sort({ date: -1 });

        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
