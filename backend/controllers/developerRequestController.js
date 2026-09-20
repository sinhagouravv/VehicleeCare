const LeaveRequest = require('../models/LeaveRequest');
const IdCardRequest = require('../models/IdCardRequest');
const OvertimeRequest = require('../models/OvertimeRequest');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');

// Helper to format date cleanly
const formatDate = (dStr) => {
    if (!dStr) return '';
    const dStrTrim = String(dStr).trim();
    const parts = dStrTrim.split(/[-/]/);
    if (parts.length === 3 && parts[2].length === 4) {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
        }
    }
    const d = new Date(dStrTrim);
    if (isNaN(d.getTime())) return dStrTrim.toUpperCase();
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

// @desc    Get all developer requests (Leave, Meeting, Overtime)
// @route   GET /api/developer-requests
exports.getDeveloperRequests = async (req, res) => {
    try {
        // 1. Find all developer employees
        const devEmployees = await Employee.find({
            $or: [
                { category: { $regex: /^developer$/i } },
                { role: { $regex: /developer/i } }
            ]
        }).lean();

        const devEmpIds = devEmployees.map(e => String(e.employeeId)).filter(Boolean);
        const devMongoIds = devEmployees.map(e => String(e._id));
        const allTargetIds = [...new Set([...devEmpIds, ...devMongoIds])];
        const devEmails = devEmployees.map(e => (e.email || '').toLowerCase()).filter(Boolean);

        const empMap = new Map();
        for (const emp of devEmployees) {
            if (emp.employeeId) empMap.set(String(emp.employeeId), emp);
            if (emp._id) empMap.set(String(emp._id), emp);
            if (emp.email) empMap.set(emp.email.toLowerCase(), emp);
        }

        // 2. Query leaves, meetings (IdCardRequest), and overtimes for developer employees
        const [leaves, meetings, overtimes] = await Promise.all([
            LeaveRequest.find({
                $or: [
                    { employeeId: { $in: allTargetIds } },
                    { employeeEmail: { $in: devEmails } }
                ]
            }).sort({ createdAt: -1 }).lean(),
            IdCardRequest.find({
                $or: [
                    { employeeId: { $in: allTargetIds } },
                    { employeeEmail: { $in: devEmails } }
                ]
            }).sort({ createdAt: -1 }).lean(),
            OvertimeRequest.find({
                $or: [
                    { employeeId: { $in: allTargetIds } },
                    { employeeEmail: { $in: devEmails } }
                ]
            }).sort({ createdAt: -1 }).lean()
        ]);

        const unified = [];

        // Format Leaves
        for (const l of leaves) {
            const emp = empMap.get(String(l.employeeId)) || empMap.get((l.employeeEmail || '').toLowerCase()) || {};
            const totalDays = Number(l.totalDays) || 1;
            const startFormatted = formatDate(l.startDate);
            const endFormatted = formatDate(l.endDate);
            let dateRangeStr = startFormatted;
            if (startFormatted && endFormatted && startFormatted !== endFormatted) {
                dateRangeStr = `${startFormatted} - ${endFormatted}`;
            } else if (!dateRangeStr) {
                dateRangeStr = endFormatted || 'N/A';
            }
            const durationStr = `${totalDays} Day${totalDays > 1 ? 's' : ''}`;
            const refId = l.leaveId || `LA-${String(l._id).slice(-5).toUpperCase()}`;

            unified.push({
                _id: String(l._id),
                requestId: refId,
                referenceId: refId,
                category: 'Leave',
                type: l.type || 'General Leave',
                leaveTime: l.leaveTime || 'Full Day',
                developerId: emp.employeeId || l.employeeId,
                developerName: emp.name || l.employeeName || 'Developer',
                role: emp.role || 'Developer',
                developerEmail: emp.email || l.employeeEmail,
                developerPhone: emp.phone || l.employeePhone,
                requestDate: dateRangeStr,
                duration: durationStr,
                reason: l.reason || 'No reason specified',
                createdAt: l.createdAt || new Date().toISOString(),
                status: l.status || 'Pending',
                remarks: l.remarks || '',
                employeeRemark: l.employeeRemark || '',
                details: {
                    startDate: l.startDate,
                    startTime: l.startTime,
                    endDate: l.endDate,
                    endTime: l.endTime,
                    totalDays: l.totalDays,
                    leaveTime: l.leaveTime,
                    garageId: l.garageId,
                    approvedBy: l.approvedBy,
                    remarks: l.remarks
                }
            });
        }

        // Format Meetings (IdCardRequest)
        for (const m of meetings) {
            const emp = empMap.get(String(m.employeeId)) || empMap.get((m.employeeEmail || '').toLowerCase()) || {};
            const timeStr = m.appointmentTime || '';
            const dateStr = formatDate(m.appointmentDate) || 'N/A';
            const durationStr = timeStr || 'Scheduled Meeting';
            const refId = m.meetingId || `MEET-${String(m._id).slice(-5).toUpperCase()}`;

            unified.push({
                _id: String(m._id),
                requestId: refId,
                referenceId: refId,
                category: 'Meeting',
                type: m.purpose || 'Meeting',
                developerId: emp.employeeId || m.employeeId,
                developerName: emp.name || m.employeeName || 'Developer',
                role: emp.role || 'Developer',
                developerEmail: emp.email || m.employeeEmail,
                developerPhone: emp.phone || m.employeePhone,
                requestDate: dateStr,
                duration: durationStr,
                reason: m.reason || 'No reason specified',
                createdAt: m.createdAt || new Date().toISOString(),
                status: m.status || 'Pending',
                remarks: m.remarks || '',
                employeeRemark: m.employeeRemark || '',
                details: {
                    purpose: m.purpose,
                    appointmentDate: m.appointmentDate,
                    appointmentTime: m.appointmentTime,
                    garageId: m.garageId,
                    approvedBy: m.approvedBy,
                    remarks: m.remarks
                }
            });
        }

        // Format Overtimes
        for (const o of overtimes) {
            const emp = empMap.get(String(o.employeeId)) || empMap.get((o.employeeEmail || '').toLowerCase()) || {};
            const hrs = Number(o.hours) || 1;
            const dateStr = formatDate(o.date) || 'N/A';
            const durationStr = `${hrs} Hour${hrs > 1 ? 's' : ''}`;
            const refId = o.overtimeId || `OT-${String(o._id).slice(-5).toUpperCase()}`;

            unified.push({
                _id: String(o._id),
                requestId: refId,
                referenceId: refId,
                category: 'Overtime',
                type: `${hrs} Hours Overtime`,
                developerId: emp.employeeId || o.employeeId,
                developerName: emp.name || o.employeeName || 'Developer',
                role: emp.role || 'Developer',
                developerEmail: emp.email || o.employeeEmail,
                developerPhone: emp.phone || o.employeePhone,
                requestDate: dateStr,
                duration: durationStr,
                reason: o.reason || 'No reason specified',
                createdAt: o.createdAt || new Date().toISOString(),
                status: o.status || 'Pending',
                remarks: o.remarks || '',
                employeeRemark: o.employeeRemark || '',
                details: {
                    hours: o.hours,
                    date: o.date,
                    garageId: o.garageId,
                    approvedBy: o.approvedBy,
                    remarks: o.remarks
                }
            });
        }

        // Sort all by createdAt descending (latest first)
        unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.status(200).json({
            success: true,
            count: unified.length,
            data: unified
        });
    } catch (err) {
        console.error('[DeveloperRequests] Error:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Update developer request status (Approved / Rejected / Pending)
// @route   PATCH /api/developer-requests/:category/:id/status
exports.updateDeveloperRequestStatus = async (req, res) => {
    try {
        const { category, id } = req.params;
        const { status, remarks = '', reviewerName = 'Administrator' } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const cat = category.toLowerCase();
        let updatedDoc = null;

        if (cat === 'leave') {
            updatedDoc = await LeaveRequest.findByIdAndUpdate(
                id,
                {
                    status,
                    approvedBy: reviewerName,
                    actionBy: reviewerName,
                    approvedByRole: 'Admin',
                    actionByRole: 'Admin',
                    remarks: remarks || undefined
                },
                { new: true }
            );

            if (updatedDoc) {
                const msg = status === 'Approved'
                    ? `Dear Employee, Your leave request ${updatedDoc.leaveId} has been approved by ${reviewerName}.`
                    : `Dear Employee, Your leave request ${updatedDoc.leaveId} has been reviewed and rejected by ${reviewerName}.`;

                Notification.create({
                    eventType: 'leave',
                    superCategory: 'employees_notification',
                    title: `Leave Request ${status}`,
                    message: msg,
                    meta: {
                        leaveId: updatedDoc._id,
                        leaveCustomId: updatedDoc.leaveId,
                        employeeId: updatedDoc.employeeId,
                        status
                    }
                }).catch(() => {});
            }
        } else if (cat === 'meeting') {
            updatedDoc = await IdCardRequest.findByIdAndUpdate(
                id,
                {
                    status,
                    approvedBy: reviewerName,
                    approvedByRole: 'Admin',
                    remarks: remarks || undefined
                },
                { new: true }
            );

            if (updatedDoc) {
                const msg = status === 'Approved'
                    ? `Dear Employee, Your meeting request ${updatedDoc.meetingId} has been approved by ${reviewerName}.`
                    : `Dear Employee, Your meeting request ${updatedDoc.meetingId} has been rejected by ${reviewerName}.`;

                Notification.create({
                    eventType: 'meeting',
                    superCategory: 'employees_notification',
                    title: `Meeting Request ${status}`,
                    message: msg,
                    meta: {
                        meetingId: updatedDoc.meetingId,
                        requestId: updatedDoc._id,
                        employeeId: updatedDoc.employeeId,
                        status
                    }
                }).catch(() => {});
            }
        } else if (cat === 'overtime') {
            updatedDoc = await OvertimeRequest.findByIdAndUpdate(
                id,
                {
                    status,
                    approvedBy: reviewerName,
                    approvedByRole: 'Admin',
                    remarks: remarks || undefined
                },
                { new: true }
            );

            if (updatedDoc) {
                const msg = status === 'Approved'
                    ? `Dear Employee, Your overtime request ${updatedDoc.overtimeId} has been approved by ${reviewerName}.`
                    : `Dear Employee, Your overtime request ${updatedDoc.overtimeId} has been rejected by ${reviewerName}.`;

                Notification.create({
                    eventType: 'overtime',
                    superCategory: 'employees_notification',
                    title: `Overtime Request ${status}`,
                    message: msg,
                    meta: {
                        overtimeId: updatedDoc.overtimeId,
                        employeeId: updatedDoc.employeeId,
                        status
                    }
                }).catch(() => {});
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid request category' });
        }

        if (!updatedDoc) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.status(200).json({
            success: true,
            message: `Developer request ${status.toLowerCase()} successfully`,
            data: updatedDoc
        });
    } catch (err) {
        console.error('[UpdateDeveloperRequest] Error:', err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};
