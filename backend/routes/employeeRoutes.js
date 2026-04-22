const express = require('express');
const router = express.Router();
const { getEmployees, getEmployeeById, getGarageEmployees, createEmployee, deleteEmployee, updateEmployee } = require('../controllers/employeeController');

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.get('/garage/:garageId', getGarageEmployees);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);


module.exports = router;
