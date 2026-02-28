const express = require('express');
const router = express.Router();
const {
    submitRequest,
    getAllRequests,
    updateRequestStatus,
    deleteRequest
} = require('../controllers/businessRequestController');

router.route('/')
    .post(submitRequest)
    .get(getAllRequests); // Should technically be protected by admin middleware

router.route('/:id/status')
    .patch(updateRequestStatus);

router.route('/:id')
    .delete(deleteRequest);

module.exports = router;
