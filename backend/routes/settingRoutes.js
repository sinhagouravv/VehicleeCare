const express = require('express');
const router = express.Router();
const { getSettingByKey, updateSetting } = require('../controllers/settingController');

// Define routes
router.get('/:key', getSettingByKey);
router.post('/', updateSetting);

module.exports = router;
