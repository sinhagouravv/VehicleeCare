const express = require('express');
const router = express.Router();
const {
    getDeveloperRequests,
    updateDeveloperRequestStatus
} = require('../controllers/developerRequestController');

router.get('/', getDeveloperRequests);
router.patch('/:category/:id/status', updateDeveloperRequestStatus);

module.exports = router;
