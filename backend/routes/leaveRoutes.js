const express = require('express');
const router = express.Router();
const { requestLeave, getEmployeeLeaves, getAllLeaves, updateLeaveStatus, getGarageLeaves, deleteLeaveRequest } = require('../controllers/leaveController');

router.post('/request', requestLeave);
router.get('/employee/:employeeId', getEmployeeLeaves);
router.get('/garage/:garageId', getGarageLeaves);
router.get('/', getAllLeaves);
router.patch('/:id/status', updateLeaveStatus);
router.delete('/:id', deleteLeaveRequest);

module.exports = router;
