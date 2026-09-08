const express = require('express');
const router = express.Router();
const { getRequests, createRequest, updateRequestStatus, deleteRequest } = require('../controllers/requestController');

router.get('/', getRequests);
router.post('/', createRequest);
router.patch('/:id/status', updateRequestStatus);
router.delete('/:id', deleteRequest);

module.exports = router;
