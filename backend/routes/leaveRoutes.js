const express = require('express');
const router = express.Router();
const { requestLeave, getEmployeeLeaves, getAllLeaves, updateLeaveStatus } = require('../controllers/leaveController');

router.post('/request', requestLeave);
router.get('/employee/:employeeId', getEmployeeLeaves);
router.get('/', getAllLeaves);
router.patch('/:id/status', updateLeaveStatus);

module.exports = router;
