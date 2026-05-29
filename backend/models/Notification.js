const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        enum: ['user_registered', 'booking_created', 'message_received', 'review_submitted', 'garage_added', 'charging_station_added', 'employee_added', 'leave_updated', 'leave']
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    meta: {
        type: Object,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);
