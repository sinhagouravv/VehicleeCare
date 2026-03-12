const express = require('express');
const router = express.Router();
const { createBooking, getBookings, deleteBooking, getGarageBookings } = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/user/:userId', require('../controllers/bookingController').getUserBookings);
router.get('/garage/:garageId', getGarageBookings);
router.delete('/:id', deleteBooking);

module.exports = router;
