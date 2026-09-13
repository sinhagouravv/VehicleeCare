const express = require('express');
const router = express.Router();
const { getSettingByKey, updateSetting, incrementGuestCount } = require('../controllers/settingController');

// Define routes
router.post('/increment-guest-count', incrementGuestCount);
router.get('/:key', getSettingByKey);
router.post('/', updateSetting);

module.exports = router;
