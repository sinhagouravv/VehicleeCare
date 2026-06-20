const express = require('express');
const router = express.Router();
const { 
    getEmployees, 
    getEmployeeById, 
    getGarageEmployees, 
    createEmployee, 
    deleteEmployee, 
    updateEmployee,
    requestIdCard,
    getIdCardRequests,
    getGarageIdCardRequests,
    updateIdCardRequestStatus,
    deleteIdCardRequest
} = require('../controllers/employeeController');

router.get('/', getEmployees);
router.post('/id-card-request', requestIdCard);
router.get('/id-card-requests/employee/:employeeId', getIdCardRequests);
router.get('/id-card-requests/garage/:garageId', getGarageIdCardRequests);
router.patch('/id-card-requests/:id/status', updateIdCardRequestStatus);
router.delete('/id-card-requests/:id', deleteIdCardRequest);
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.get('/garage/:garageId', getGarageEmployees);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);


module.exports = router;
