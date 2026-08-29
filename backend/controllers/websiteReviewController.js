const WebsiteReview = require('../models/WebsiteReview');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createAdminNotification } = require('./notificationController');

// @desc    Create a new Website Review (Defaults to Pending)
// @route   POST /api/website-reviews
// @access  Public
exports.createReview = async (req, res) => {
    try {
        const { name, designation, text, user, rating, type, targetName } = req.body;
        console.log("Creating review payload:", req.body);

        const newReviewData = {
            name,
            designation: designation || 'Customer',
            text,
            type: type || 'website',
            targetName: targetName || null,
            ratings: rating ? [rating] : [],
            status: 'Pending'
        };

        if (user) {
            // If the user ID provided is not a valid MongoDB ObjectId, it might be the human-readable userId (e.g., 65...)
            if (!mongoose.Types.ObjectId.isValid(user)) {
                const foundUser = await User.findOne({ userId: user });
                if (foundUser) {
                    newReviewData.user = foundUser._id;
                }
            } else {
                newReviewData.user = user;
            }
        }

        const review = await WebsiteReview.create(newReviewData);

        // Notify Admin of new website review
        createAdminNotification({
            eventType: 'review_submitted',
            superCategory: 'adminNotification',
            title: 'New Review Submitted',
            message: `A new review "${text ? text.substring(0, 60) + (text.length > 60 ? '...' : '') : ''}" has been submitted by ${name || 'a customer'}.`,
            meta: {
                reviewId: review._id,
                customReviewId: review.reviewId,
                userName: name,
                displayUserId: review.reviewId || 'GUEST',
                reviewType: type || 'Website'
            }
        });

        res.status(201).json(review);
    } catch (error) {
        console.error("Error in createReview:", error);
        res.status(500).json({ message: 'Server Error in creating review', error: error.message });
    }
};

// @desc    Get all APPROVED Website Reviews (For Public Frontend)
// @route   GET /api/website-reviews
// @access  Public
exports.getApprovedReviews = async (req, res) => {
    try {
        // Only fetch reviews that an admin has approved
        const reviews = await WebsiteReview.find({ status: 'Approved' }).sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error in getApprovedReviews:", error);
        res.status(500).json({ message: 'Server Error fetching reviews' });
    }
};

// @desc    Get all Website Reviews (For Admin Panel to approve/reject)
// @route   GET /api/website-reviews/admin
// @access  Private/Admin (Assuming route middleware handles this later)
exports.getAllReviewsForAdmin = async (req, res) => {
    try {
        // Fetch all reviews sorted with Pending first, then by date created
        const reviews = await WebsiteReview.find().sort({ status: -1, createdAt: -1 }).populate('user', 'userId');
        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error in getAllReviewsForAdmin:", error);
        res.status(500).json({ message: 'Server Error fetching all reviews' });
    }
};

// @desc    Update a review's status (Approve or Reject)
// @route   PATCH /api/website-reviews/:id/status
// @access  Private/Admin
exports.updateReviewStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        const review = await WebsiteReview.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.status(200).json(review);
    } catch (error) {
        console.error("Error in updateReviewStatus:", error);
        res.status(500).json({ message: 'Server Error updating review status' });
    }
};

// @desc    Add a rating to an existing review
// @route   PATCH /api/website-reviews/:id/rate
// @access  Public
exports.rateReview = async (req, res) => {
    try {
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Please provide a valid rating between 1 and 5' });
        }

        const review = await WebsiteReview.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Add the new rating to the array
        review.ratings.push(rating);
        await review.save();

        res.status(200).json(review);
    } catch (error) {
        console.error("Error in rateReview:", error);
        res.status(500).json({ message: 'Server Error rating review' });
    }
};

// @desc    Delete a review permanently
// @route   DELETE /api/website-reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res) => {
    try {
        const review = await WebsiteReview.findByIdAndDelete(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.status(200).json({ message: 'Review removed effectively' });
    } catch (error) {
        console.error("Error in deleteReview:", error);
        res.status(500).json({ message: 'Server Error deleting review' });
    }
};
