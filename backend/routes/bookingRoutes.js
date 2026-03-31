const express = require('express');
const router = express.Router();
const { createBooking, getBookings, deleteBooking, getGarageBookings, updateBookingStatus, sendInServiceOTP, verifyInServiceOTP, sendDeliveryOTP, verifyDeliveryOTP } = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/user/:userId', require('../controllers/bookingController').getUserBookings);
router.get('/garage/:garageId', getGarageBookings);
router.get('/employee/:employeeId', require('../controllers/bookingController').getEmployeeBookings);
router.put('/:id/status', updateBookingStatus);
router.post('/:id/send-otp', sendInServiceOTP);
router.post('/:id/verify-otp', verifyInServiceOTP);
router.post('/:id/send-delivery-otp', sendDeliveryOTP);
router.post('/:id/verify-delivery-otp', verifyDeliveryOTP);
router.delete('/:id', deleteBooking);

module.exports = router;
