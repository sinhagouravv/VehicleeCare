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

// Load Balancer Helper for Developers
const selectLeastLoadedDeveloper = async () => {
    try {
        const Employee = require('../models/Employee');
        const developers = await Employee.find({
            $or: [
                { category: { $regex: /^developer$/i } },
                { role: { $regex: /^developer$/i } }
            ]
        });

        if (!developers || developers.length === 0) return null;
        if (developers.length === 1) {
            return {
                id: developers[0]._id,
                employeeId: developers[0].employeeId,
                name: developers[0].name
            };
        }

        const counts = {};
        developers.forEach(d => {
            counts[String(d._id)] = 0;
        });

        const mongoIds = developers.map(d => d._id);
        const empIds = developers.map(d => d.employeeId).filter(Boolean);

        const aggResults = await Bug.aggregate([
            {
                $match: {
                    $or: [
                        { 'assignedDeveloper.id': { $in: mongoIds } },
                        { 'assignedDeveloper.employeeId': { $in: empIds } }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $ifNull: ['$assignedDeveloper.id', '$assignedDeveloper.employeeId']
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        aggResults.forEach(item => {
            const rawId = item._id ? String(item._id) : null;
            if (!rawId) return;

            const matchedDev = developers.find(d => 
                String(d._id) === rawId || d.employeeId === rawId
            );
            if (matchedDev) {
                counts[String(matchedDev._id)] = (counts[String(matchedDev._id)] || 0) + item.count;
            }
        });

        let minCount = Infinity;
        developers.forEach(d => {
            const c = counts[String(d._id)] || 0;
            if (c < minCount) minCount = c;
        });

        const minCandidates = developers.filter(d => (counts[String(d._id)] || 0) === minCount);
        const chosen = minCandidates[Math.floor(Math.random() * minCandidates.length)];

        console.log(`[BugLoadBalancer] Devs: ${developers.length} | MinCount: ${minCount} | Chosen: ${chosen.name} (${chosen.employeeId})`);

        return {
            id: chosen._id,
            employeeId: chosen.employeeId,
            name: chosen.name
        };
    } catch (err) {
        console.error('[BugLoadBalancer] Error:', err.message);
        return null;
    }
};

const ensureAssignedDeveloper = async (bug) => {
    if (!bug) return bug;
    if (!bug.assignedDeveloper || !bug.assignedDeveloper.name) {
        const assignedDev = await selectLeastLoadedDeveloper();
        if (assignedDev) {
            bug.assignedDeveloper = assignedDev;
            await Bug.updateOne({ _id: bug._id }, { $set: { assignedDeveloper: assignedDev } });
        }
    }
    return bug;
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
        const assignedDeveloper = await selectLeastLoadedDeveloper();

        const bug = await Bug.create({
            bugId,
            reporterId,
            reporterName,
            portal,
            title,
            description,
            severity: '',
            assignedDeveloper
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
                portal,
                assignedDeveloper
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
        const bugs = await Bug.find().sort({ createdAt: -1 }).lean();
        const enrichedBugs = await Promise.all(bugs.map(b => ensureAssignedDeveloper(b)));
        const sanitizedBugs = enrichedBugs.map(b => (b.status === 'Pending' ? { ...b, severity: '' } : b));
        res.status(200).json({ success: true, data: sanitizedBugs });
    } catch (err) {
        console.error("Error getting bugs:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get developer bugs
// @route   GET /api/bugs/developer/:empId
exports.getDeveloperBugs = async (req, res) => {
    try {
        const { empId } = req.params;
        const target = String(empId || '').trim().toLowerCase();

        const allBugs = await Bug.find().sort({ createdAt: -1 }).lean();
        const enrichedBugs = await Promise.all(allBugs.map(b => ensureAssignedDeveloper(b)));
        const sanitizedBugs = enrichedBugs.map(b => (b.status === 'Pending' ? { ...b, severity: '' } : b));

        const devBugs = sanitizedBugs.filter(b => {
            const devId = String(b.assignedDeveloper?.id || '').trim().toLowerCase();
            const devEmpId = String(b.assignedDeveloper?.employeeId || '').trim().toLowerCase();
            return devId === target || devEmpId === target;
        });

        res.status(200).json({ success: true, count: devBugs.length, data: devBugs });
    } catch (err) {
        console.error("Error getting developer bugs:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update bug status
// @route   PATCH /api/bugs/:id/status
exports.updateBugStatus = async (req, res) => {
    try {
        const { status, severity } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const updateData = { status };
        if (severity) updateData.severity = severity;

        const bug = await Bug.findByIdAndUpdate(
            req.params.id,
            updateData,
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
