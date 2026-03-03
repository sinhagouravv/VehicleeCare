const BusinessReview = require('../models/BusinessReview');
const mongoose = require('mongoose');

exports.submitReview = async (req, res) => {
    try {
        const { name, role, review, businessUserId } = req.body;

        if (!name || !review) {
            return res.status(400).json({ success: false, message: 'Name and review are required' });
        }

        const newReviewData = {
            name,
            role: role || 'Vendor',
            review
        };

        if (businessUserId && businessUserId !== 'null' && businessUserId !== 'undefined') {
            if (mongoose.Types.ObjectId.isValid(businessUserId)) {
                newReviewData.businessUser = businessUserId;
            }
        }

        const newReview = await BusinessReview.create(newReviewData);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully and is pending approval.',
            data: newReview
        });
    } catch (error) {
        console.error('Submit Business Review Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
};

exports.getApprovedReviews = async (req, res) => {
    try {
        const reviews = await BusinessReview.find({ status: 'approved' }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error('Get Approved Business Reviews Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await BusinessReview.find().sort({ createdAt: -1 }).populate('businessUser', 'name email');
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error('Get All Business Reviews Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
};

exports.updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const review = await BusinessReview.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.status(200).json({ success: true, message: `Review ${status} successfully`, data: review });
    } catch (error) {
        console.error('Update Business Review Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update review status' });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await BusinessReview.findByIdAndDelete(id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete Business Review Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
};
