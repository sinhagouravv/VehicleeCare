const express = require('express');
const router = express.Router();
const { getEmailLogs, getEmailLogById, forceSyncEmailLogs } = require('../controllers/emailLogController');

router.get('/', getEmailLogs);
router.post('/sync', forceSyncEmailLogs);
router.get('/:id', getEmailLogById);

module.exports = router;
