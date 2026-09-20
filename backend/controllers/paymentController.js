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
                select: 'vehicle service schedule garage'
            })
            .sort({ date: -1 });

        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all payments globally (Admin use)
// @route   GET /api/payments/all
// @access  Private
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find({})
            .populate('user', 'name email userId')
            .populate('business', 'name businessName email userId')
            .populate({
                path: 'booking',
                select: 'bookingId vehicle service status garage'
            })
            .sort({ date: -1 });

        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        console.error("Error fetching all payments:", error);
        res.status(500).json({ success: false, message: 'Server Error fetching payments' });
    }
};

const garagePaymentsInFlight = new Map();
const garagePaymentsCache = new Map();

// @desc    Get payments for a specific garage
// @route   GET /api/payments/garage/:garageId
exports.getGaragePayments = async (req, res) => {
    try {
        const garageId = String(req.params.garageId || '').trim();
        // Strict input validation to prevent injection or malformed parameters
        if (!garageId || garageId.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(garageId)) {
            return res.status(400).json({ success: false, message: 'Invalid garage identifier' });
        }

        const now = Date.now();

        // Bound cache size to prevent memory bloat
        if (garagePaymentsCache.size > 200) {
            for (const [k, v] of garagePaymentsCache.entries()) {
                if (now - v.timestamp >= 5000) garagePaymentsCache.delete(k);
            }
        }

        // 1. Check short-lived cache (5s) for instant response
        const cached = garagePaymentsCache.get(garageId);
        if (cached && (now - cached.timestamp < 5000)) {
            return res.status(200).json({ success: true, count: cached.data.length, data: cached.data });
        }

        // 2. Request coalescing (single-flight): share 1 DB query among concurrent users
        let queryPromise = garagePaymentsInFlight.get(garageId);
        if (!queryPromise) {
            queryPromise = Payment.find({ garageId })
                .populate('user', 'name email userId')
                .populate({
                    path: 'booking',
                    select: 'bookingId vehicle service status'
                })
                .sort({ date: -1 })
                .lean()
                .then(data => {
                    garagePaymentsCache.set(garageId, { data, timestamp: Date.now() });
                    garagePaymentsInFlight.delete(garageId);
                    return data;
                })
                .catch(err => {
                    garagePaymentsInFlight.delete(garageId);
                    throw err;
                });

            garagePaymentsInFlight.set(garageId, queryPromise);
        }

        const payments = await queryPromise;
        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        console.error("Error fetching garage payments:", error);
        res.status(500).json({ success: false, message: 'Server Error fetching garage payments' });
    }
};
