const express = require('express');
const router = express.Router();
const {
    getSettingByKey,
    updateSetting,
    incrementGuestCount,
    getGuestLoginCount,
    getGuestLoginStats,
    getGuestLogs,
    getGuestSessionDetails,
    updateGuestSessionStatus
} = require('../controllers/settingController');

// Guest login tracker routes (must be defined BEFORE /:key)
router.post('/increment-guest-count', incrementGuestCount);
router.post('/guest-session-status', updateGuestSessionStatus);
router.get('/guestLoginCount', getGuestLoginCount);
router.get('/guestLoginStats', getGuestLoginStats);
router.get('/guest-logs', getGuestLogs);
router.get('/guest-session/:sessionId', getGuestSessionDetails);

// Generic key-value settings routes
router.get('/:key', getSettingByKey);
router.post('/', updateSetting);

module.exports = router;
