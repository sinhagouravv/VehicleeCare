const express = require('express');
const router = express.Router();
const { requestOvertime, getEmployeeOvertimes, getAllOvertimes, updateOvertimeStatus, getGarageOvertimes, deleteOvertimeRequest } = require('../controllers/overtimeController');

router.post('/request', requestOvertime);
router.get('/employee/:employeeId', getEmployeeOvertimes);
router.get('/garage/:garageId', getGarageOvertimes);
router.get('/', getAllOvertimes);
router.patch('/:id/status', updateOvertimeStatus);
router.delete('/:id', deleteOvertimeRequest);

module.exports = router;
