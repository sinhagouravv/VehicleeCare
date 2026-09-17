const User = require('../models/User');

let usersCache = null;
let usersCacheTime = 0;
let usersInFlight = null;

const invalidateUsersCache = () => {
    usersCache = null;
    usersCacheTime = 0;
};

exports.getAllUsers = async (req, res) => {
    try {
        const now = Date.now();
        if (usersCache && (now - usersCacheTime < 5000)) {
            return res.status(200).json({ success: true, count: usersCache.length, data: usersCache });
        }

        if (!usersInFlight) {
            usersInFlight = User.find()
                .select('-password')
                .sort({ createdAt: -1 })
                .lean()
                .then(data => {
                    usersCache = data;
                    usersCacheTime = Date.now();
                    usersInFlight = null;
                    return data;
                })
                .catch(err => {
                    usersInFlight = null;
                    throw err;
                });
        }

        const users = await usersInFlight;
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        invalidateUsersCache();
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        invalidateUsersCache();
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
