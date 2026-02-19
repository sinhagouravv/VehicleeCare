const express = require('express');
const router = express.Router();
const { createBooking, getBookings } = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/user/:userId', require('../controllers/bookingController').getUserBookings);

module.exports = router;
