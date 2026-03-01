const express = require('express');
const router = express.Router();
const { createSubscriptionOrder, verifySubscriptionPayment } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/order', protect, createSubscriptionOrder);
router.post('/verify', protect, verifySubscriptionPayment);

module.exports = router;
