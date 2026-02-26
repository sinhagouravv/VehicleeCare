const mongoose = require('mongoose');
require('dotenv').config();
const WebsiteReview = require('./models/WebsiteReview');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to DB...");
    const reviews = await WebsiteReview.find({ reviewId: { $exists: false } });
    console.log(`Found ${reviews.length} reviews without reviewId.`);
    
    for (let rev of reviews) {
        let isUnique = false;
        while (!isUnique) {
            let idNum = '';
            for (let i = 0; i < 5; i++) {
                idNum += Math.floor(Math.random() * 9) + 1;
            }
            const generatedId = `RE${idNum}`;
            const existing = await WebsiteReview.findOne({ reviewId: generatedId });
            if (!existing) {
                rev.reviewId = generatedId;
                await rev.save();
                isUnique = true;
                console.log(`Assigned ${generatedId} to ${rev._id}`);
            }
        }
    }
    console.log("Done!");
    process.exit(0);
});
