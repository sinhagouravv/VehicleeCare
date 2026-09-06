const Employee = require('../models/Employee');
const IdCardRequest = require('../models/IdCardRequest');
const Remark = require('../models/Remark');
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

        const employee = await Employee.create({ ...req.body, employeeId, password, isVerified: false, verificationStatus: 'Pending' });
        
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
        const { id } = req.params;
        let oldEmployee;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            oldEmployee = await Employee.findById(id);
        }
        if (!oldEmployee) {
            oldEmployee = await Employee.findOne({ employeeId: id });
        }

        const employee = oldEmployee
            ? await Employee.findByIdAndUpdate(oldEmployee._id, req.body, { new: true, runValidators: true })
            : null;

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Fire document notifications if any document status was changed
        try {
            const Notification = require('../models/Notification');
            const docFields = ['panCard', 'adharCard', 'aadhaarCard', 'voterId', 'drivingLicense', 'agreement', 'signature', 'bankDetails', 'experienceLetter'];
            for (let docKey of docFields) {
                const statusKey = `${docKey}Status`;
                const remarkKey = `${docKey}Remark`;
                if (req.body[statusKey]) {
                    const newStatus = req.body[statusKey];
                    const docId = employee[`${docKey}DocId`] || 'D0000000';
                    let docLabel = docKey.replace(/([A-Z])/g, ' $1').toUpperCase();
                    if (docKey === 'adharCard' || docKey === 'aadhaarCard') docLabel = 'AADHAR CARD';
                    if (docKey === 'panCard') docLabel = 'PAN CARD';
                    if (docKey === 'voterId') docLabel = 'VOTER CARD';
                    if (docKey === 'drivingLicense') docLabel = 'DRIVING LICENSE';
                    if (docKey === 'agreement') docLabel = 'EMPLOYMENT AGREEMENT';
                    if (docKey === 'signature') docLabel = 'SIGNATURE';

                    const remark = req.body[remarkKey] || employee[remarkKey] || '';

                    if (newStatus === 'APPROVED' || newStatus === 'Approved' || newStatus === 'VERIFIED' || newStatus === 'Verified') {
                        await Notification.create({
                            eventType: 'document',
                            superCategory: 'employees_notification',
                            title: 'Document Approved',
                            message: `Dear Employee, Your ${docLabel} (${docId}) has been approved.`,
                            meta: {
                                employeeId: employee.employeeId || employee._id,
                                employeeMongoId: employee._id,
                                employeeName: employee.name,
                                docLabel,
                                documentType: docLabel,
                                docId,
                                status: 'Approved'
                            }
                        });
                    } else if (newStatus === 'REJECTED' || newStatus === 'Rejected') {
                        await Notification.create({
                            eventType: 'document',
                            superCategory: 'employees_notification',
                            title: 'Document Rejected',
                            message: `Dear Employee, Your ${docLabel} (${docId}) has been rejected. Kindly review the remarks provided by the administration and re-upload the document. Please ensure that you upload it correctly, as this is the final attempt to do so.`,
                            meta: {
                                employeeId: employee.employeeId || employee._id,
                                employeeMongoId: employee._id,
                                employeeName: employee.name,
                                docLabel,
                                documentType: docLabel,
                                docId,
                                status: 'Rejected',
                                remark
                            }
                        });
                    }
                }
            }
        } catch (notifErr) {
            console.error('Error creating document update notification:', notifErr);
        }

        res.status(200).json({ success: true, data: employee });
    } catch (err) {
        console.error("Error updating employee:", err);
        res.status(500).json({ success: false, message: err.message || 'Server Error' });
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


// Helper: Generate unique 7-char Meeting ID (M + 6 unique non-zero digits)
const generateMeetingId = async () => {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let isUnique = false;
    let newId = '';

    while (!isUnique) {
        newId = 'M';
        let tempDigits = [...digits];
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * tempDigits.length);
            newId += tempDigits[randomIndex];
            tempDigits.splice(randomIndex, 1);
        }
        const existing = await IdCardRequest.findOne({ meetingId: newId });
        if (!existing) {
            isUnique = true;
        }
    }
    return newId;
};

// Helper: Ensure all fetched requests have a meetingId (backfills existing records if missing)
const ensureMeetingIds = async (requests) => {
    for (let req of requests) {
        if (!req.meetingId) {
            req.meetingId = await generateMeetingId();
            await req.save();
        }
    }
};

// @desc    Request a duplicate ID card
// @route   POST /api/employees/id-card-request
const requestIdCard = async (req, res) => {
    try {
        const { employeeId, purpose, reason, appointmentDate, appointmentTime } = req.body;
        
        // Find employee to populate other fields
        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Check if there is already a pending duplicate request for this employee
        const hasPending = await IdCardRequest.findOne({ employeeId, status: 'Pending' });
        if (hasPending) {
            return res.status(400).json({ success: false, message: 'You already have a pending duplicate ID card request.' });
        }

        const meetingId = await generateMeetingId();

        const idRequest = await IdCardRequest.create({
            meetingId,
            employeeId,
            employeeName: employee.name,
            employeePhone: employee.phone || '',
            employeeEmail: employee.email || '',
            purpose,
            reason,
            garageId: employee.garageId,
            appointmentDate: appointmentDate || '',
            appointmentTime: appointmentTime || ''
        });

        // Fire admin notification
        try {
            const Garage = require('../models/Garage');
            const garage = await Garage.findOne({ garageId: employee.garageId });
            const garageName = garage ? garage.name : 'Unknown Garage';

            let msg = `Dear ${garageName}, Your employee ${employee.name} ${employee.employeeId} had requested for a meeting. Kindly review the details of the meeting and approved or reject according.`;

            createAdminNotification({
                eventType: 'meeting',
                superCategory: 'garageNotification',
                title: 'New Meeting Request',
                message: msg,
                meta: { 
                    meetingId: meetingId,
                    requestId: idRequest._id,
                    employeeId: employee.employeeId, 
                    name: employee.name, 
                    garageId: employee.garageId,
                    garageName: garageName,
                    purpose: purpose,
                    reason: reason,
                    appointmentDate: appointmentDate || '',
                    appointmentTime: appointmentTime || '',
                    senderName: 'Administrator',
                    senderId: '184592037461'
                }
            });
        } catch (notifErr) {
            console.error('Failed to create admin notification for duplicate ID card:', notifErr);
        }

        res.status(201).json({ success: true, data: idRequest });
    } catch (err) {
        console.error("Error requesting duplicate ID card:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const enrichIdCardRequests = async (requests) => {
    await ensureMeetingIds(requests);
    const garageIds = [...new Set(requests.map(r => r.garageId).filter(Boolean))];
    const meetingIds = requests.map(r => r.meetingId || String(r._id));
    const mongoIds = requests.map(r => String(r._id));

    const [managers, existingRemarks] = await Promise.all([
        Employee.find({
            garageId: { $in: garageIds },
            role: { $in: ['Manager', 'Admin', 'manager', 'admin'] }
        }).lean(),
        Remark.find({
            $or: [
                { referenceId: { $in: meetingIds } },
                { bookingId: { $in: meetingIds } },
                { bookingMongoId: { $in: mongoIds } }
            ]
        }).lean()
    ]);

    const remarkMap = {};
    for (const r of existingRemarks) {
        const k1 = r.referenceId;
        const k2 = r.bookingId;
        const k3 = r.bookingMongoId ? String(r.bookingMongoId) : null;
        const info = { remark: r.remark, remarkId: r.remarkId };
        if (k1) remarkMap[k1] = info;
        if (k2) remarkMap[k2] = info;
        if (k3) remarkMap[k3] = info;
    }

    const managerMap = {};
    for (const m of managers) {
        if (!managerMap[m.garageId]) {
            managerMap[m.garageId] = m;
        }
    }

    return requests.map(r => {
        const doc = r.toObject ? r.toObject() : { ...r };
        const key1 = r.meetingId;
        const key2 = String(r._id);
        const info = remarkMap[key1] || remarkMap[key2];
        if (!doc.employeeRemark && info) {
            doc.employeeRemark = info.remark;
        }
        if (!doc.remarkId && info) {
            doc.remarkId = info.remarkId;
        }
        if (!doc.approvedBy && doc.status !== 'Pending' && doc.garageId && managerMap[doc.garageId]) {
            const m = managerMap[doc.garageId];
            doc.approvedBy = m.name;
            doc.approvedById = m.employeeId || m._id;
            doc.approvedByRole = m.role || 'Manager';
        }
        return doc;
    });
};

// @desc    Get all ID card requests for an employee
// @route   GET /api/employees/id-card-requests/employee/:employeeId
const getIdCardRequests = async (req, res) => {
    try {
        const requests = await IdCardRequest.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 });
        const enriched = await enrichIdCardRequests(requests);
        res.status(200).json({ success: true, data: enriched });
    } catch (err) {
        console.error("Error getting ID card requests:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all ID card requests for a garage
// @route   GET /api/employees/id-card-requests/garage/:garageId
const getGarageIdCardRequests = async (req, res) => {
    try {
        const requests = await IdCardRequest.find({ garageId: req.params.garageId }).sort({ createdAt: -1 });
        const enriched = await enrichIdCardRequests(requests);
        res.status(200).json({ success: true, data: enriched });
    } catch (err) {
        console.error("Error getting garage ID card requests:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update ID card request status
// @route   PATCH /api/employees/id-card-requests/:id/status
const updateIdCardRequestStatus = async (req, res) => {
    try {
        const { status, remarks, employeeId, employeeRemark } = req.body;
        
        // Find request
        const request = await IdCardRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (employeeRemark !== undefined) {
            request.employeeRemark = employeeRemark;
        }

        if (status) {
            // Verify that the status update is done by a verified Manager or Admin of this garage
            let garageAdmin = null;
            if (employeeId) {
                garageAdmin = await Employee.findOne({ 
                    employeeId: employeeId, 
                    garageId: request.garageId, 
                    role: { $in: ['Manager', 'Admin', 'manager', 'admin'] }, 
                    isVerified: true 
                });
                if (!garageAdmin) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Unauthorized: Invalid Employee ID or you do not have Manager/Admin permissions for this garage.' 
                    });
                }
            } else {
                // Fallback to finding any verified Manager/Admin in that garage (backward/test compatibility)
                garageAdmin = await Employee.findOne({ 
                    garageId: request.garageId, 
                    role: { $in: ['Manager', 'Admin', 'manager', 'admin'] }, 
                    isVerified: true 
                });
            }

            if (!garageAdmin) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Unauthorized: Only verified Manager/Admin employees of this garage can update request status.' 
                });
            }

            request.status = status;
            if (remarks !== undefined) {
                request.remarks = remarks;
            }

            if (garageAdmin) {
                request.approvedBy = garageAdmin.name || '';
                request.approvedById = garageAdmin.employeeId || garageAdmin._id || '';
                request.approvedByRole = garageAdmin.role || 'Manager';
            }

            await request.save();



            // Fire employee notification (type: 'meeting')
            try {
                const cleanRemarks = remarks || '';
                let msg = `Dear Employee, Your request for having a duplicate ID card has been ${status.toLowerCase()}`;
                if (status === 'Rejected') {
                    msg += ' at the moment.';
                } else {
                    msg += '.';
                }
                msg += ' ';

                if (status === 'Approved') {
                    msg += `Your appointment has been scheduled for ${request.appointmentDate} at ${request.appointmentTime}. Kindly be on time. `;
                }
                if (cleanRemarks) {
                    msg += `Remarks: ${cleanRemarks}`;
                }

                createAdminNotification({
                    eventType: 'meeting',
                    superCategory: 'employees_notification',
                    title: `Duplicate ID Request ${status}`,
                    message: msg,
                    meta: {
                        requestId: request._id,
                        employeeId: request.employeeId,
                        adminEmpId: garageAdmin.employeeId,
                        adminName: garageAdmin.name,
                        remarks: cleanRemarks,
                        status: status,
                        appointmentDate: request.appointmentDate,
                        appointmentTime: request.appointmentTime
                    }
                });
            } catch (notifErr) {
                console.error('Failed to create employee notification for duplicate ID card status update:', notifErr);
            }
        } else {
            await request.save();
        }

        res.status(200).json({ success: true, data: request });
    } catch (err) {
        console.error("Error updating ID card request status:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete an ID card request
// @route   DELETE /api/employees/id-card-requests/:id
const deleteIdCardRequest = async (req, res) => {
    try {
        const request = await IdCardRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        await IdCardRequest.deleteOne({ _id: req.params.id });
        res.status(200).json({ success: true, message: 'Request deleted successfully' });
    } catch (err) {
        console.error("Error deleting ID card request:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Upload employee profile avatar
// @route   POST /api/employees/:id/avatar
const uploadEmployeeAvatar = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image file.' });
        }

        // Find employee first
        let employee;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            employee = await Employee.findById(id);
        }
        if (!employee) {
            // Try numerical employeeId
            employee = await Employee.findOne({ employeeId: id });
        }

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Upload memory buffer to Cloudinary
        const { uploadStream } = require('../utils/cloudinary');
        const result = await uploadStream(req.file.buffer, 'employee_avatars');

        // Save secure url to database
        employee.avatar = result.secure_url;
        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: employee
        });
    } catch (err) {
        console.error('Error uploading employee avatar:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Upload employee document
// @route   POST /api/employees/:id/document
const uploadEmployeeDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { documentType } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a document file.' });
        }

        const validDocumentTypes = ['adharCard', 'aadhaarCard', 'voterId', 'panCard', 'drivingLicense', 'agreement', 'signature', 'bankDetails', 'experienceLetter'];
        if (!validDocumentTypes.includes(documentType)) {
            return res.status(400).json({ success: false, message: `Invalid document type. Allowed types: ${validDocumentTypes.join(', ')}` });
        }

        // Find employee first
        let employee;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            employee = await Employee.findById(id);
        }
        if (!employee) {
            employee = await Employee.findOne({ employeeId: id });
        }

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Upload memory buffer to Cloudinary
        const { uploadStream } = require('../utils/cloudinary');
        const result = await uploadStream(req.file.buffer, 'employee_documents', req.file.mimetype);

        // Save secure url to the specified field in database
        const generateDocId = () => 'D' + Math.floor(1000000 + Math.random() * 9000000).toString();
        const currentStatus = (employee[`${documentType}Status`] || '').toUpperCase();

        if (currentStatus === 'REJECTED' && employee[documentType]) {
            if (!employee[`${documentType}History`]) {
                employee[`${documentType}History`] = [];
            }
            const historyId = employee[`${documentType}DocId`] || generateDocId();
            employee[`${documentType}History`].push({
                docId: historyId,
                fileUrl: employee[documentType],
                uploadedAt: employee[`${documentType}UploadedAt`] || new Date(),
                status: 'Rejected'
            });
            let newDocId = historyId.toUpperCase();
            if (!newDocId.endsWith('R')) {
                newDocId += 'R';
            }
            employee[`${documentType}DocId`] = newDocId;
        } else if (!employee[`${documentType}DocId`]) {
            employee[`${documentType}DocId`] = generateDocId();
        }

        employee[documentType] = result.secure_url;
        employee[`${documentType}UploadedAt`] = new Date();
        employee[`${documentType}Status`] = 'Pending';
        await employee.save();

        // Fire Notifications for Admin supercategory
        try {
            const Notification = require('../models/Notification');
            const docId = employee[`${documentType}DocId`];
            const uppercaseType = documentType.replace(/([A-Z])/g, ' $1').toUpperCase();

            // Admin Notification ONLY
            await Notification.create({
                eventType: 'document',
                superCategory: 'adminNotification',
                title: 'Document Uploaded',
                message: `Employee ${employee.name || 'Employee'} (${employee.employeeId || ''}) uploaded ${uppercaseType} (Doc ID: ${docId}).`,
                meta: {
                    employeeId: employee.employeeId || employee._id,
                    documentType: uppercaseType,
                    docId,
                    portal: 'employee'
                }
            });
        } catch (notifErr) {
            console.error('Error creating document upload notification:', notifErr);
        }

        res.status(200).json({
            success: true,
            message: `${documentType} uploaded successfully`,
            data: employee
        });
    } catch (err) {
        console.error('Error uploading employee document:', err);
        res.status(500).json({ success: false, message: err.message || 'Server Error' });
    }
};

// @desc Delete Employee Document
// @route DELETE /api/employees/:id/document/:documentType
const deleteEmployeeDocument = async (req, res) => {
    try {
        const { id, documentType } = req.params;
        let employee;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            employee = await Employee.findById(id);
        }
        if (!employee) {
            employee = await Employee.findOne({ employeeId: id });
        }
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const history = employee[`${documentType}History`] || [];
        const currentDocId = (employee[`${documentType}DocId`] || '').toUpperCase();
        const isReuploaded = currentDocId.endsWith('R') || history.length > 0;

        if (isReuploaded && (history.length > 0 || currentDocId.endsWith('R'))) {
            if (history.length > 0) {
                const prevDoc = history.pop();
                employee[documentType] = prevDoc.fileUrl;
                employee[`${documentType}UploadedAt`] = prevDoc.uploadedAt;
                employee[`${documentType}Status`] = prevDoc.status || 'Rejected';
                employee[`${documentType}DocId`] = prevDoc.docId || (currentDocId.endsWith('R') ? currentDocId.slice(0, -1) : currentDocId);
                employee[`${documentType}Remark`] = prevDoc.remark || '';
            } else if (currentDocId.endsWith('R')) {
                // Fallback for legacy test data without history array
                employee[`${documentType}DocId`] = currentDocId.slice(0, -1);
                employee[`${documentType}Status`] = 'Rejected';
            }
        } else {
            employee[documentType] = '';
            employee[`${documentType}UploadedAt`] = null;
            employee[`${documentType}DocId`] = '';
            employee[`${documentType}Status`] = 'Pending';
            employee[`${documentType}Remark`] = '';
            employee[`${documentType}History`] = [];
        }
        await employee.save();

        // Fire Notifications for Admin supercategory ONLY
        try {
            const Notification = require('../models/Notification');
            const uppercaseType = documentType.replace(/([A-Z])/g, ' $1').toUpperCase();

            await Notification.create({
                eventType: 'document',
                superCategory: 'adminNotification',
                title: 'Document Removed',
                message: `${uppercaseType} for Employee ${employee.name || 'Employee'} (${employee.employeeId || ''}) was removed.`,
                meta: { employeeId: employee.employeeId || employee._id }
            });
        } catch (notifErr) {
            console.error('Error creating document delete notification:', notifErr);
        }

        res.status(200).json({
            success: true,
            message: `${documentType} deleted successfully`,
            data: employee
        });
    } catch (err) {
        console.error('Error deleting employee document:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getEmployees,
    getEmployeeById,
    getGarageEmployees,
    createEmployee,
    deleteEmployee,
    updateEmployee,
    requestIdCard,
    getIdCardRequests,
    getGarageIdCardRequests,
    updateIdCardRequestStatus,
    deleteIdCardRequest,
    uploadEmployeeAvatar,
    uploadEmployeeDocument,
    deleteEmployeeDocument
};

