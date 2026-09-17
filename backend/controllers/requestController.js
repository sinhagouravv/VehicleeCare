const Request = require('../models/Request');
const Notification = require('../models/Notification');

// Helper to generate unique 8-character Request ID starting with RQ + 6 digits (e.g., RQ482910)
const generateUniqueRequestId = async () => {
    let isUnique = false;
    let newId = '';
    while (!isUnique) {
        const digits = Math.floor(100000 + Math.random() * 900000); // 6 digits
        newId = `RQ${digits}`;
        const existing = await Request.findOne({ $or: [{ requestId: newId }, { displayId: newId }] });
        if (!existing) {
            isUnique = true;
        }
    }
    return newId;
};

let requestsCache = null;
let requestsCacheTime = 0;
let requestsInFlight = null;

const invalidateRequestsCache = () => {
    requestsCache = null;
    requestsCacheTime = 0;
};

const getRequests = async (req, res) => {
    try {
        const now = Date.now();
        if (requestsCache && (now - requestsCacheTime < 5000)) {
            return res.json({ success: true, count: requestsCache.length, data: requestsCache });
        }

        if (!requestsInFlight) {
            requestsInFlight = Request.find()
                .sort({ createdAt: -1 })
                .lean()
                .then(data => {
                    requestsCache = data;
                    requestsCacheTime = Date.now();
                    requestsInFlight = null;
                    return data;
                })
                .catch(err => {
                    requestsInFlight = null;
                    throw err;
                });
        }

        const requests = await requestsInFlight;
        res.json({ success: true, count: requests.length, data: requests });
    } catch (err) {
        console.error('Error fetching requests:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const createRequest = async (req, res) => {
    try {
        const { employeeId, userId, portal, name, reason, explanation, description, tentativeTime } = req.body;
        
        const reqId = await generateUniqueRequestId();
        const effectiveEmployeeId = employeeId || userId || 'EMP-01';

        const newReq = await Request.create({
            requestId: reqId,
            displayId: reqId,
            employeeId: effectiveEmployeeId,
            portal: (portal || 'EMPLOYEE').toUpperCase(),
            name: name || 'User',
            reason: reason || 'Account Deletion Request',
            explanation: explanation || description || '',
            description: description || explanation || '',
            tentativeTime: tentativeTime || '1 Week',
            status: 'Pending'
        });

        invalidateRequestsCache();
        res.status(201).json({ success: true, data: newReq });
    } catch (err) {
        console.error('Error creating request:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remark } = req.body;

        const updated = await Request.findByIdAndUpdate(
            id,
            { status, remark },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Create notification targeting the specific garage or employee who submitted this deletion request
        try {
            const isGarage = (updated.portal || '').toUpperCase() === 'GARAGE';
            const targetSuperCategory = isGarage ? 'garageNotification' : 'employees_notification';
            const prefix = isGarage ? 'Dear Garage' : 'Dear Employee';
            const reqType = (updated.requestType || updated.type || updated.reason || 'account deletion').toLowerCase();
            const reqId = updated.requestId || updated.displayId;
            const statusMessage = `${prefix}, Your request for ${reqType} (${reqId}) has been updated to "${status}". Kindly follow the instructions carefully.${remark ? ` Remark: ${remark}` : ''}`;

            await Notification.create({
                eventType: 'account_deletion_request',
                superCategory: targetSuperCategory,
                title: `Account Deletion Request ${status}`,
                message: statusMessage,
                meta: {
                    requestId: updated.requestId || updated.displayId,
                    status: status,
                    remark: remark,
                    garageId: isGarage ? updated.employeeId : undefined,
                    employeeId: !isGarage ? updated.employeeId : undefined,
                    portal: updated.portal,
                    name: updated.name
                }
            });
        } catch (notifErr) {
            console.error('Error creating status update notification:', notifErr);
        }

        invalidateRequestsCache();
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('Error updating request status:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Request.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        invalidateRequestsCache();
        res.json({ success: true, message: 'Request deleted successfully' });
    } catch (err) {
        console.error('Error deleting request:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getRequests,
    createRequest,
    updateRequestStatus,
    deleteRequest
};
