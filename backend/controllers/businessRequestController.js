const BusinessRequest = require('../models/BusinessRequest');

// @desc    Submit a new business partnership request
// @route   POST /api/business-requests
// @access  Public
const submitRequest = async (req, res) => {
    try {
        const { businessCategory, businessName, ownerName, email, phone, state, district, address, taxId } = req.body;

        // Basic validation
        if (!businessCategory || !businessName || !ownerName || !email || !phone || !state || !district || !address) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const newRequest = await BusinessRequest.create({
            businessCategory,
            businessName,
            ownerName,
            email,
            phone,
            state,
            district,
            address,
            taxId
        });

        res.status(201).json({ success: true, data: newRequest });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all business requests
// @route   GET /api/business-requests
// @access  Admin
const getAllRequests = async (req, res) => {
    try {
        const requests = await BusinessRequest.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update request status (Approve/Reject)
// @route   PATCH /api/business-requests/:id/status
// @access  Admin
const updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const request = await BusinessRequest.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.status(200).json({ success: true, data: request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a business request
// @route   DELETE /api/business-requests/:id
// @access  Admin
const deleteRequest = async (req, res) => {
    try {
        const request = await BusinessRequest.findByIdAndDelete(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    submitRequest,
    getAllRequests,
    updateRequestStatus,
    deleteRequest
};
