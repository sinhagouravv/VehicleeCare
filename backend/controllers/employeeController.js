const Employee = require('../models/Employee');

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

module.exports = {
    getEmployees
};
