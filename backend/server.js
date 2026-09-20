const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 5001;

const authRoutes = require('./routes/authRoutes');
const { initAttendanceCron } = require('./cron/attendanceCron');
const { checkGuestReadOnly } = require('./middleware/authMiddleware');
const { seedAllGuestAccounts } = require('./controllers/authController');

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl || req.url}`);
    next();
});
app.use(checkGuestReadOnly);

// MongoDB Connection with connection pooling for high concurrency
mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
})
    .then(() => {
        console.log('MongoDB connected successfully to:', mongoose.connection.name);
        initAttendanceCron();
        // Warm up and pre-seed guest accounts in background so the very first login is instantaneous
        seedAllGuestAccounts().catch(err => console.error('Error pre-seeding guest accounts:', err));
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/cars', require('./routes/carRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/garages', require('./routes/garageRoutes'));
app.use('/api/charging-stations', require('./routes/chargingStationRoutes'));
app.use('/api/website-reviews', require('./routes/websiteReviewRoutes'));
app.use('/api/business-reviews', require('./routes/businessReviewRoutes'));
app.use('/api/business-requests', require('./routes/businessRequestRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/overtime', require('./routes/overtimeRoutes'));
app.use('/api/bugs', require('./routes/bugRoutes'));
app.use('/api/remarks', require('./routes/remarkRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/developer-requests', require('./routes/developerRequestRoutes'));
app.use('/api/email-logs', require('./routes/emailLogRoutes'));

app.get('/', (req, res) => {
    res.send('VehicleeCare Backend API');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
