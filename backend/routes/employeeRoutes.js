const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure Multer memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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
    deleteIdCardRequest,
    uploadEmployeeAvatar
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
router.post('/:id/avatar', upload.single('avatar'), uploadEmployeeAvatar);

module.exports = router;
