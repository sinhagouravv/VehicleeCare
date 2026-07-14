const Bug = require('../models/Bug');

// Helper: Generate unique 8-char Bug ID (BUG + 5 unique non-zero digits)
const generateBugId = async () => {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let isUnique = false;
    let newId = '';

    while (!isUnique) {
        newId = 'BUG';
        let tempDigits = [...digits];
        for (let i = 0; i < 5; i++) {
            const idx = Math.floor(Math.random() * tempDigits.length);
            newId += tempDigits[idx];
            tempDigits.splice(idx, 1);
        }
        const existing = await Bug.findOne({ bugId: newId });
        if (!existing) isUnique = true;
    }
    return newId;
};

// @desc    Report a bug
// @route   POST /api/bugs
exports.reportBug = async (req, res) => {
    try {
        const { reporterId, reporterName, portal, title, description, severity } = req.body;

        if (!reporterId || !reporterName || !portal || !title || !description) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const bugId = await generateBugId();

        const bug = await Bug.create({
            bugId,
            reporterId,
            reporterName,
            portal,
            title,
            description,
            severity: severity || 'Medium'
        });

        res.status(201).json({ success: true, data: bug });
    } catch (err) {
        console.error("Error reporting bug:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all bugs
// @route   GET /api/bugs
exports.getAllBugs = async (req, res) => {
    try {
        const bugs = await Bug.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: bugs });
    } catch (err) {
        console.error("Error getting bugs:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update bug status
// @route   PATCH /api/bugs/:id/status
exports.updateBugStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const bug = await Bug.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!bug) {
            return res.status(404).json({ success: false, message: 'Bug not found' });
        }

        res.status(200).json({ success: true, data: bug });
    } catch (err) {
        console.error("Error updating bug status:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a bug
// @route   DELETE /api/bugs/:id
exports.deleteBug = async (req, res) => {
    try {
        const bug = await Bug.findByIdAndDelete(req.params.id);
        if (!bug) {
            return res.status(404).json({ success: false, message: 'Bug not found' });
        }
        res.status(200).json({ success: true, message: 'Bug deleted successfully' });
    } catch (err) {
        console.error("Error deleting bug:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
