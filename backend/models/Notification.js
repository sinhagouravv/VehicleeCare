const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        enum: ['user_registered', 'booking_created', 'booking', 'message_received', 'review_submitted', 'garage_added', 'charging_station_added', 'employee_added', 'leave_updated', 'leave', 'overtime', 'meeting', 'id_card_requested', 'id_card_status_updated']
    },
    superCategory: {
        type: String,
        enum: ['employees_notification', 'garageNotification', 'garage_notification', 'admin_notification', 'user_notification', 'general'],
        default: 'general'
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
    isStarred: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);
