const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingId: { type: String },
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userId: { type: String },
        name: { type: String },
        phone: { type: String },
        email: { type: String },
        notes: { type: String }
    },
    payment: {
        method: { type: String },
        status: { type: String, default: 'Pending' },
        transactionId: { type: String },
        paymentId: { type: String },
        amount: { type: Number }
    },
    vehicle: {
        year: { type: String },
        make: { type: String },
        model: { type: String },
        fuelType: { type: String },
        type: { type: String },
        transmission: { type: String },
        number: { type: String }
    },
    service: {
        id: { type: String },
        title: { type: String },
        price: { type: String }
    },
    schedule: {
        date: { type: String },
        time: { type: String }
    },
    garage: {
        id: { type: String },
        name: { type: String },
        state: { type: String },
        district: { type: String },
        pickupDrop: { type: String }
    },
    assignedEmployees: {
        technician: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
            employeeId: { type: String },
            name: { type: String }
        },
        support: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
            employeeId: { type: String },
            name: { type: String }
        },
        mechanic: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
            employeeId: { type: String },
            name: { type: String }
        }
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Confirmed', 'In Progress', 'In Service', 'Completed', 'Delivered', 'Cancelled']
    },
    isPickedUp: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false },
    serviceDuration: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
    remark: { type: String },
    remarks: { type: String },
    employeeRemark: { type: String }
}, { timestamps: true });

BookingSchema.index({ 'assignedEmployees.technician.id': 1 });
BookingSchema.index({ 'assignedEmployees.technician.employeeId': 1 });
BookingSchema.index({ 'assignedEmployees.support.id': 1 });
BookingSchema.index({ 'assignedEmployees.support.employeeId': 1 });
BookingSchema.index({ 'garage.id': 1 });

module.exports = mongoose.model('Booking', BookingSchema);
