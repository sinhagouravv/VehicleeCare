const Garage = require('../models/Garage');
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

// Generate unique 9-digit garageId: starts with "66", no digit "0", no repeats
const generateGarageId = async () => {
    const digits = '123456789'; // no 0
    // already fixed: '6','6' — need 7 more unique digits
    const generate = () => {
        let chars = ['6', '6'];
        const used = new Set(['6']);       // '6' is already used twice but we allow it
        const pool = digits.split('');
        const available = pool.filter(d => d !== '6'); // remaining after '6'

        // Pick 7 more chars from digits (can repeat, just no 0; no-repeat per spec like bookingId)
        // Using same approach as bookingId: no repeating chars
        // But we need 7 unique from "123456789" minus '6' that we already have
        // pool has 8 remaining digits (1,2,3,4,5,7,8,9)
        const shuffled = available.sort(() => Math.random() - 0.5);
        for (let i = 0; i < 7; i++) {
            chars.push(shuffled[i]);
        }
        // Shuffle positions 2..8 so it looks random
        const fixed = chars.slice(0, 2);
        const rest = chars.slice(2).sort(() => Math.random() - 0.5);
        return [...fixed, ...rest].join('');
    };

    let id;
    let exists = true;
    while (exists) {
        id = generate();
        exists = await Garage.findOne({ garageId: id });
    }
    return id;
};

// GET all garages
exports.getGarages = async (req, res) => {
    try {
        const garages = await Garage.find().sort({ createdAt: -1 });
        res.json({ success: true, data: garages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST create garage
exports.createGarage = async (req, res) => {
    try {
        const garageId = await generateGarageId();

        // Hash temporary password Pass@1234
        const tempPassword = 'Pass@1234';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        const garage = await Garage.create({ ...req.body, garageId, password: hashedPassword, partner: false, isVerified: false, status: 'Pending' });

        // Fire admin notification
        createAdminNotification({
            eventType: 'garage_added',
            title: 'New Garage Added',
            message: `A new garage, ${garage.name}, has been added (ID: ${garage.garageId}).`,
            meta: { garageId: garage.garageId, name: garage.name, ownerEmail: garage.ownerEmail }
        });

        // Send Welcome Email if ownerEmail is provided
        if (req.body.ownerEmail) {
            const mailOptions = {
                from: `"VehicleeCare Admin" <${process.env.EMAIL_USER}>`,
                to: req.body.ownerEmail,
                subject: 'Welcome to VehicleeCare - Your Garage Portal Login',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #0f172a; text-transform: uppercase; margin-top: 0;">Welcome, ${req.body.name}!</h2>
                        <p style="color: #475569; font-size: 15px; line-height: 1.5;">Your garage has been successfully added to the <strong>VehicleeCare</strong> platform.</p>
                        
                        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 25px 0;">
                            <h3 style="color: #3b82f6; font-size: 14px; text-transform: uppercase; margin-top: 0; letter-spacing: 1px;">Your Login Credentials</h3>
                            <p style="margin: 10px 0; color: #334155;"><strong>Garage ID:</strong> <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 16px;">${garageId}</span></p>
                            <p style="margin: 10px 0; color: #334155;"><strong>Password:</strong> <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 16px;">${tempPassword}</span></p>
                        </div>
                        
                        <p style="color: #475569; font-size: 14px; margin-bottom: 25px;">Please log in to your Garage Portal to manage your services, bookings, and profile. We highly recommend changing your password immediately after your first login.</p>
                        
                        <a href="http://localhost:5175/login" style="display: inline-block; background-color: #052558; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">Access Garage Portal</a>

                        <p>Thank you for choosing VehicleeCare!</p>
                        <br>
                        <p>Best regards,</p>
                        <p>VehicleeCare Team</p>
                    </div>
                `
            };

            // Send async without blocking UI return
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.error("Failed to send Welcome Email to Garage:", error);
            });
        }

        res.status(201).json({ success: true, data: garage });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT update garage
exports.updateGarage = async (req, res) => {
    try {
        const { id } = req.params;
        let oldGarage;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            oldGarage = await Garage.findById(id);
        }
        if (!oldGarage) {
            oldGarage = await Garage.findOne({ garageId: id });
        }

        let garage;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            garage = await Garage.findByIdAndUpdate(id, req.body, { new: true });
        }

        if (!garage) {
            garage = await Garage.findOneAndUpdate({ garageId: id }, req.body, { new: true });
        }

        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });

        // Fire document notifications if any document status was changed
        try {
            const Notification = require('../models/Notification');
            const docFields = ['panCard', 'adharCard', 'aadhaarCard', 'voterId', 'gstCert', 'gstCertificate', 'canceledCheque', 'tradeLicense', 'addressProof', 'agreement', 'signature'];
            for (let docKey of docFields) {
                const statusKey = `${docKey}Status`;
                const remarkKey = `${docKey}Remark`;
                if (req.body[statusKey] && oldGarage && oldGarage[statusKey] !== req.body[statusKey]) {
                    const newStatus = req.body[statusKey];
                    const docId = garage[`${docKey}DocId`] || 'D0000000';
                    let docLabel = docKey.replace(/([A-Z])/g, ' $1').toUpperCase();
                    if (docKey === 'adharCard' || docKey === 'aadhaarCard') docLabel = 'AADHAR CARD';
                    if (docKey === 'panCard') docLabel = 'PAN CARD';
                    if (docKey === 'voterId') docLabel = 'VOTER CARD';
                    if (docKey === 'gstCert' || docKey === 'gstCertificate') docLabel = 'GST CERTIFICATE';
                    if (docKey === 'tradeLicense') docLabel = 'TRADE LICENSE';
                    if (docKey === 'canceledCheque') docLabel = 'CANCELLED CHEQUE';

                    const remark = req.body[remarkKey] || garage[remarkKey] || '';

                    if (newStatus === 'APPROVED' || newStatus === 'Approved' || newStatus === 'VERIFIED' || newStatus === 'Verified') {
                        await Notification.create({
                            eventType: 'document',
                            superCategory: 'garageNotification',
                            title: 'Document Approved',
                            message: `Dear ${garage.name || 'Garage'}, Your ${docLabel} (${docId}) has been approved.`,
                            meta: { garageId: garage.garageId || garage._id, garageName: garage.name, docLabel, documentType: docLabel, docId, status: 'Approved' }
                        });
                    } else if (newStatus === 'REJECTED' || newStatus === 'Rejected') {
                        await Notification.create({
                            eventType: 'document',
                            superCategory: 'garageNotification',
                            title: 'Document Rejected',
                            message: `Dear ${garage.name || 'Garage'}, Your ${docLabel} (${docId}) has been rejected. Kindly review the remarks provided by the administration and re-upload the document. Please ensure that you upload it correctly, as this is the final attempt to do so.`,
                            meta: { garageId: garage.garageId || garage._id, garageName: garage.name, docLabel, documentType: docLabel, docId, status: 'Rejected', remark }
                        });
                    }
                }
            }
        } catch (notifErr) {
            console.error('Error creating garage document update notification:', notifErr);
        }

        res.json({ success: true, data: garage });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE garage
exports.deleteGarage = async (req, res) => {
    try {
        const garage = await Garage.findByIdAndDelete(req.params.id);
        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });
        res.json({ success: true, message: 'Garage deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET single garage by ID
exports.getGarageById = async (req, res) => {
    try {
        let garage;
        const { id } = req.params;

        // Try searching by MongoDB _id if it's a valid ObjectId
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            garage = await Garage.findById(id);
        }

        // Fallback to custom 9-digit garageId
        if (!garage) {
            garage = await Garage.findOne({ garageId: id });
        }

        if (!garage) return res.status(404).json({ success: false, message: 'Garage not found' });
        res.json({ success: true, data: garage });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc Upload Garage Document to Cloudinary
// @route POST /api/garages/:id/document
exports.uploadGarageDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { documentType } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a document file.' });
        }

        const validDocumentTypes = ['adharCard', 'aadhaarCard', 'voterId', 'panCard', 'tradeLicense', 'agreement', 'signature', 'gstCert', 'gstCertificate', 'canceledCheque', 'addressProof'];
        if (!validDocumentTypes.includes(documentType)) {
            return res.status(400).json({ success: false, message: `Invalid document type. Allowed types: ${validDocumentTypes.join(', ')}` });
        }

        // Find garage first
        let garage;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            garage = await Garage.findById(id);
        }
        if (!garage) {
            garage = await Garage.findOne({ garageId: id });
        }

        if (!garage) {
            return res.status(404).json({ success: false, message: 'Garage not found' });
        }

        // Upload memory buffer to Cloudinary
        const { uploadStream } = require('../utils/cloudinary');
        const result = await uploadStream(req.file.buffer, 'garage_documents', req.file.mimetype);

        // Save secure url to the specified field in database
        const generateDocId = () => 'D' + Math.floor(1000000 + Math.random() * 9000000).toString();
        const currentStatus = (garage[`${documentType}Status`] || '').toUpperCase();

        if (currentStatus === 'REJECTED' && garage[documentType]) {
            if (!garage[`${documentType}History`]) {
                garage[`${documentType}History`] = [];
            }
            const historyId = garage[`${documentType}DocId`] || generateDocId();
            garage[`${documentType}History`].push({
                docId: historyId,
                fileUrl: garage[documentType],
                uploadedAt: garage[`${documentType}UploadedAt`] || new Date(),
                status: 'Rejected'
            });
            let newDocId = historyId.toUpperCase();
            if (!newDocId.endsWith('R')) {
                newDocId += 'R';
            }
            garage[`${documentType}DocId`] = newDocId;
        } else if (!garage[`${documentType}DocId`]) {
            garage[`${documentType}DocId`] = generateDocId();
        }

        garage[documentType] = result.secure_url;
        garage[`${documentType}UploadedAt`] = new Date();
        garage[`${documentType}Status`] = 'Pending';
        await garage.save();

        // Fire Notifications for Admin supercategory ONLY
        try {
            const Notification = require('../models/Notification');
            const docId = garage[`${documentType}DocId`];
            const uppercaseType = documentType.replace(/([A-Z])/g, ' $1').toUpperCase();

            await Notification.create({
                eventType: 'document',
                superCategory: 'adminNotification',
                title: 'Document Uploaded',
                message: `Garage ${garage.name || 'Garage'} (${garage.garageId || ''}) uploaded ${uppercaseType} (Doc ID: ${docId}).`,
                meta: {
                    garageId: garage.garageId || garage._id,
                    documentType: uppercaseType,
                    docId,
                    portal: 'garage'
                }
            });
        } catch (notifErr) {
            console.error('Error creating garage document upload notification:', notifErr);
        }

        res.status(200).json({
            success: true,
            message: `${documentType} uploaded successfully`,
            data: garage
        });
    } catch (err) {
        console.error('Error uploading garage document:', err);
        res.status(500).json({ success: false, message: err.message || 'Server Error' });
    }
};

// @desc Delete Garage Document
// @route DELETE /api/garages/:id/document/:documentType
exports.deleteGarageDocument = async (req, res) => {
    try {
        const { id, documentType } = req.params;
        let garage;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            garage = await Garage.findById(id);
        }
        if (!garage) {
            garage = await Garage.findOne({ garageId: id });
        }
        if (!garage) {
            return res.status(404).json({ success: false, message: 'Garage not found' });
        }

        const history = garage[`${documentType}History`] || [];
        const currentDocId = (garage[`${documentType}DocId`] || '').toUpperCase();
        const isReuploaded = currentDocId.endsWith('R') || history.length > 0;

        if (isReuploaded && (history.length > 0 || currentDocId.endsWith('R'))) {
            if (history.length > 0) {
                const prevDoc = history.pop();
                garage[documentType] = prevDoc.fileUrl;
                garage[`${documentType}UploadedAt`] = prevDoc.uploadedAt;
                garage[`${documentType}Status`] = prevDoc.status || 'Rejected';
                garage[`${documentType}DocId`] = prevDoc.docId || (currentDocId.endsWith('R') ? currentDocId.slice(0, -1) : currentDocId);
                garage[`${documentType}Remark`] = prevDoc.remark || '';
            } else if (currentDocId.endsWith('R')) {
                // Fallback for legacy test data without history array
                garage[`${documentType}DocId`] = currentDocId.slice(0, -1);
                garage[`${documentType}Status`] = 'Rejected';
            }
        } else {
            garage[documentType] = '';
            garage[`${documentType}UploadedAt`] = null;
            garage[`${documentType}DocId`] = '';
            garage[`${documentType}Status`] = 'Pending';
            garage[`${documentType}Remark`] = '';
            garage[`${documentType}History`] = [];
        }
        await garage.save();

        // Fire Notifications for Admin supercategory ONLY
        try {
            const Notification = require('../models/Notification');
            const uppercaseType = documentType.replace(/([A-Z])/g, ' $1').toUpperCase();

            await Notification.create({
                eventType: 'document',
                superCategory: 'adminNotification',
                title: 'Document Removed',
                message: `${uppercaseType} for Garage ${garage.name || 'Garage'} (${garage.garageId || ''}) was removed.`,
                meta: { garageId: garage.garageId || garage._id }
            });
        } catch (notifErr) {
            console.error('Error creating garage document delete notification:', notifErr);
        }

        res.status(200).json({
            success: true,
            message: `${documentType} deleted successfully`,
            data: garage
        });
    } catch (err) {
        console.error('Error deleting garage document:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


