const Bug = require('../models/Bug');
const { createAdminNotification } = require('./notificationController');

// Helper to generate custom Bug ID (e.g. BUG1001)
const generateBugId = async () => {
    const lastBug = await Bug.findOne().sort({ createdAt: -1 });
    let nextNum = 1001;
    if (lastBug && lastBug.bugId) {
        const match = lastBug.bugId.match(/\d+/);
        if (match) {
            nextNum = parseInt(match[0], 10) + 1;
        }
    }
    const newId = `BUG${nextNum}`;
    const existing = await Bug.findOne({ bugId: newId });
    if (existing) {
        return `BUG${nextNum + Math.floor(Math.random() * 100) + 1}`;
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

        // Notify Admin of new bug report
        createAdminNotification({
            eventType: 'bug_reported',
            superCategory: 'adminNotification',
            title: 'New Bug Reported',
            message: `Bug "${title}" was reported by ${reporterName} (${reporterId}) on ${portal} portal.`,
            meta: {
                bugId: bug.bugId || bug._id,
                mongoBugId: bug._id,
                reporterId,
                reporterName,
                portal
            }
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
