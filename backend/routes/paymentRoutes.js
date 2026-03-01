const express = require('express');
const router = express.Router();
const { getUserPayments, createOrder, verifyPayment, getAllPayments } = require('../controllers/paymentController');

router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.get('/user/:userId', getUserPayments);
router.get('/all', getAllPayments);

module.exports = router;
