const mongoose = require('mongoose');

const WebsiteReviewSchema = new mongoose.Schema({
    reviewId: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional, as guest users can leave reviews
    },
    name: {
        type: String,
        required: [true, 'Reviewer name is required'],
        trim: true
    },
    designation: {
        type: String,
        default: 'Customer',
        trim: true
    },
    text: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true
    },
    ratings: {
        type: [Number],
        default: [] // Array of numbers 1-5 to calculate average later
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    }
}, { timestamps: true });

// Auto-generate reviewId (RE + 5 digits without 0)
WebsiteReviewSchema.pre('save', async function (next) {
    if (this.isNew) {
        let isUnique = false;
        while (!isUnique) {
            let idNum = '';
            for (let i = 0; i < 5; i++) {
                idNum += Math.floor(Math.random() * 9) + 1; // 1-9 so no 0s
            }
            const generatedId = `RE${idNum}`;

            const existing = await mongoose.models.WebsiteReview.findOne({ reviewId: generatedId });
            if (!existing) {
                this.reviewId = generatedId;
                isUnique = true;
            }
        }
    }
    next();
});

// Virtual to calculate average rating (Optional if frontend does it, but useful for DB sorting)
WebsiteReviewSchema.virtual('averageRating').get(function () {
    if (this.ratings.length === 0) return 0;
    const sum = this.ratings.reduce((a, b) => a + b, 0);
    return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Ensure virtuals are included in JSON output
WebsiteReviewSchema.set('toJSON', { virtuals: true });
WebsiteReviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WebsiteReview', WebsiteReviewSchema);
