const express = require('express');
const router = express.Router();
const { createBooking, getBookings, deleteBooking, getGarageBookings, updateBookingStatus } = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/user/:userId', require('../controllers/bookingController').getUserBookings);
router.get('/garage/:garageId', getGarageBookings);
router.get('/employee/:employeeId', require('../controllers/bookingController').getEmployeeBookings);
router.put('/:id/status', updateBookingStatus);
router.delete('/:id', deleteBooking);

module.exports = router;
