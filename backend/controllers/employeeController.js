const Employee = require('../models/Employee');
const { generateEmployeeId } = require('../utils/generateId');
const { createAdminNotification } = require('./notificationController');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Admin
const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: employees.length, data: employees });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get garage employees
// @route   GET /api/employees/garage/:garageId
const getGarageEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ garageId: req.params.garageId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: employees.length, data: employees });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete an employee
// @route   DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error("Error deleting employee:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create an employee
// @route   POST /api/employees
const createEmployee = async (req, res) => {
    try {
        const employeeId = generateEmployeeId();
        const employee = await Employee.create({ ...req.body, employeeId, isVerified: true });
        
        // Fetch garage name for better notification
        const garage = await Garage.findOne({ garageId: employee.garageId });
        const garageName = garage ? garage.name : 'Unknown Garage';

        // Fire admin notification
        createAdminNotification({
            eventType: 'employee_added',
            title: 'New Employee Added',
            message: `A new employee, ${employee.name}, has been added to the ${garageName} ${employee.garageId} for ${employee.role} role.`,
            meta: { 
                employeeId: employee.employeeId, 
                name: employee.name, 
                garageId: employee.garageId,
                garageName: garageName,
                role: employee.role 
            }
        });

        res.status(201).json({ success: true, data: employee });
    } catch (err) {
        console.error("Error creating employee:", err);
        res.status(500).json({ success: false, message: err.message || 'Server Error' });
    }
};

// @desc    Update an employee
// @route   PUT /api/employees/:id
const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.status(200).json({ success: true, data: employee });
    } catch (err) {
        console.error("Error updating employee:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getEmployees,
    getGarageEmployees,
    createEmployee,
    deleteEmployee,
    updateEmployee
};
