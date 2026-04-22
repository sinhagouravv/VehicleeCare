const Employee = require('../models/Employee');
const { generateEmployeeId } = require('../utils/generateId');
const { createAdminNotification } = require('./notificationController');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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
        const plainPassword = 'Pass@1234';
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(plainPassword, salt);

        const employee = await Employee.create({ ...req.body, employeeId, password, isVerified: true });
        
        // Fetch garage name for better notification
        const Garage = require('../models/Garage'); // Ensure Garage is available
        const garage = await Garage.findOne({ garageId: employee.garageId });
        const garageName = garage ? garage.name : 'Unknown Garage';

        // Email the credentials
        try {
            await transporter.sendMail({
                from: `"VehicleeCare" <${process.env.EMAIL_USER}>`,
                to: employee.email,
                subject: 'Welcome to VehicleeCare Employee Portal',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f0f6ff; border-radius: 16px;">
                        <h2 style="color: #011023; margin-bottom: 4px;">VehicleeCare Employee Portal</h2>
                        <p style="color: #527FB0; font-size: 13px; margin-bottom: 24px;">Account Credentials</p>
                        <p style="color: #011023; font-size: 14px;">Hi <strong>${employee.name}</strong>, your account has been created. Use the credentials below to log in:</p>
                        <div style="background: #011023; color: #fff; text-align: left; padding: 20px; border-radius: 12px; margin: 20px 0; font-size: 14px;">
                            <p style="margin: 0 0 10px 0;"><strong>Employee ID:</strong> <span style="color: #C2E8FF;">${employee.employeeId}</span></p>
                            <p style="margin: 0;"><strong>Password:</strong> <span style="color: #C2E8FF;">${plainPassword}</span></p>
                        </div>
                        <p style="color: #888; font-size: 12px;">For security, please do not share these credentials with anyone.</p>
                    </div>
                `
            });
        } catch (mailErr) {
            console.error('Failed to send employee credentials email:', mailErr);
        }

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

// @desc    Get an employee by ID
// @route   GET /api/employees/:id
const getEmployeeById = async (req, res) => {
    try {
        let employee;
        const { id } = req.params;

        // Try searching by MongoDB _id (ObjectId)
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            employee = await Employee.findById(id);
        }

        // Fallback to custom numerical employeeId
        if (!employee) {
            employee = await Employee.findOne({ employeeId: id });
        }

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.status(200).json({ success: true, data: employee });
    } catch (err) {
        console.error("Error fetching employee:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {
    getEmployees,
    getEmployeeById,
    getGarageEmployees,
    createEmployee,
    deleteEmployee,
    updateEmployee
};

