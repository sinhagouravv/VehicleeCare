const mongoose = require('mongoose');
require('dotenv').config();
const UserNotification = require('./models/UserNotification');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const user = await User.findOne({ email: "gouravsinha993@gmail.com" }) || await User.findOne();
    if(user) {
        await UserNotification.create({
            userId: user._id,
            title: 'Welcome to VehicleeCare!',
            message: 'Your account has been successfully set up.',
            type: 'info'
        });
        console.log("Seeded user notification!");
    }
    process.exit(0);
});
