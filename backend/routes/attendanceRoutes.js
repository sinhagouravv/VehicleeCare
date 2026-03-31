const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getTodayStatus,
    getGarageAttendance,
    deleteRecord
} = require('../controllers/attendanceController');

router.post('/check-in', checkIn);
router.put('/check-out/:id', checkOut);
router.get('/status/:employeeId', getTodayStatus);
router.get('/garage/:garageId', getGarageAttendance);
router.delete('/:id', deleteRecord);

module.exports = router;
