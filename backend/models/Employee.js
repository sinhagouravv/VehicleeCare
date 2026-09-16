const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        default: 'Staff'
    },
    category: {
        type: String,
        default: ''
    },
    employmentType: {
        type: String,
        default: ''
    },
    garageId: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    dob: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    district: {
        type: String,
        default: ''
    },
    pincode: {
        type: String,
        default: ''
    },
    shift: {
        type: String,
        default: 'Morning'
    },
    panCard: {
        type: String,
        default: ''
    },
    adharCard: {
        type: String,
        default: ''
    },
    agreement: {
        type: String,
        default: ''
    },
    voterId: {
        type: String,
        default: ''
    },
    drivingLicense: {
        type: String,
        default: ''
    },
    signature: {
        type: String,
        default: ''
    },
    panCardUploadedAt: { type: Date },
    adharCardUploadedAt: { type: Date },
    voterIdUploadedAt: { type: Date },
    drivingLicenseUploadedAt: { type: Date },
    agreementUploadedAt: { type: Date },
    signatureUploadedAt: { type: Date },
    panCardDocId: { type: String, default: '' },
    adharCardDocId: { type: String, default: '' },
    voterIdDocId: { type: String, default: '' },
    drivingLicenseDocId: { type: String, default: '' },
    agreementDocId: { type: String, default: '' },
    signatureDocId: { type: String, default: '' },
    panCardStatus: { type: String, default: 'Pending' },
    adharCardStatus: { type: String, default: 'Pending' },
    voterIdStatus: { type: String, default: 'Pending' },
    drivingLicenseStatus: { type: String, default: 'Pending' },
    agreementStatus: { type: String, default: 'Pending' },
    signatureStatus: { type: String, default: 'Pending' },
    panCardHistory: { type: Array, default: [] },
    adharCardHistory: { type: Array, default: [] },
    voterIdHistory: { type: Array, default: [] },
    drivingLicenseHistory: { type: Array, default: [] },
    agreementHistory: { type: Array, default: [] },
    signatureHistory: { type: Array, default: [] },
    panCardRemark: { type: String, default: '' },
    adharCardRemark: { type: String, default: '' },
    voterIdRemark: { type: String, default: '' },
    drivingLicenseRemark: { type: String, default: '' },
    agreementRemark: { type: String, default: '' },
    signatureRemark: { type: String, default: '' },
    salaryType: {
        type: String,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        default: 'Pending'
    },
    password: {
        type: String,
        default: ''
    },
    resetPasswordOtp: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    emailOtp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    avatar: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Employee', employeeSchema);