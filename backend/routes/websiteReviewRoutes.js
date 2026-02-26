const express = require('express');
const router = express.Router();
const websiteReviewController = require('../controllers/websiteReviewController');

// @route   POST /api/website-reviews
// @desc    Submit a new review (Public)
router.post('/', websiteReviewController.createReview);

// @route   GET /api/website-reviews
// @desc    Get all APPROVED reviews (Public)
router.get('/', websiteReviewController.getApprovedReviews);

// @route   GET /api/website-reviews/admin
// @desc    Get ALL reviews for Admin panel (Admin only conceptually)
router.get('/admin', websiteReviewController.getAllReviewsForAdmin);

// @route   PATCH /api/website-reviews/:id/status
// @desc    Update a review's status (Approve/Reject)
router.patch('/:id/status', websiteReviewController.updateReviewStatus);

// @route   PATCH /api/website-reviews/:id/rate
// @desc    Add a 1-5 star rating to an existing review
router.patch('/:id/rate', websiteReviewController.rateReview);

// @route   DELETE /api/website-reviews/:id
// @desc    Permanently delete a review
router.delete('/:id', websiteReviewController.deleteReview);

module.exports = router;
