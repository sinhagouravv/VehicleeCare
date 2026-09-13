const Setting = require('../models/Setting');

// @desc    Get a setting by key
// @route   GET /api/settings/:key
// @access  Public (for fetching config on frontend)
exports.getSettingByKey = async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: req.params.key });

        if (!setting) {
            // If setting doesn't exist, return empty data rather than error
            return res.status(200).json({
                success: true,
                data: null
            });
        }

        res.status(200).json({
            success: true,
            data: setting.value
        });
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Create or update a setting
// @route   POST /api/settings
// @access  Private/Admin
exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({
                success: false,
                message: 'Setting key is required'
            });
        }

        // Find and update, or create if it doesn't exist (upsert)
        const setting = await Setting.findOneAndUpdate(
            { key },
            { value, updatedAt: Date.now() },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: setting
        });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Increment guest login count
// @route   POST /api/settings/increment-guest-count
// @access  Public
exports.incrementGuestCount = async (req, res) => {
    try {
        const portal = req.body?.portal || 'admin';
        const setting = await Setting.findOneAndUpdate(
            { key: 'guestLoginCount' },
            { $inc: { value: 1 }, $set: { updatedAt: Date.now() } },
            { new: true, upsert: true }
        );

        // Also track portal breakdown in guestLoginStats
        try {
            await Setting.findOneAndUpdate(
                { key: 'guestLoginStats' },
                { 
                    $inc: { 
                        [`value.${portal}`]: 1,
                        'value.total': 1 
                    }, 
                    $set: { updatedAt: Date.now() } 
                },
                { new: true, upsert: true }
            );
        } catch (e) {
            // ignore stats breakdown error if schema mismatch
        }

        res.status(200).json({
            success: true,
            data: setting.value
        });
    } catch (error) {
        console.error('Error incrementing guest count:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
