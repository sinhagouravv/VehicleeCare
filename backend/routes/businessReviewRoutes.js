const express = require('express');
const router = express.Router();
const {
    submitReview,
    getApprovedReviews,
    getAllReviews,
    updateReviewStatus,
    deleteReview
} = require('../controllers/businessReviewController');

// Public/Business Portal routes
router.post('/submit', submitReview);
router.get('/approved', getApprovedReviews);

// Admin Portal routes
router.get('/all', getAllReviews);
router.put('/:id/status', updateReviewStatus);
router.delete('/:id', deleteReview);

module.exports = router;
