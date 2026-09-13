const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

            // Set user in request (supports 'user', 'business', 'garage', etc)
            // Depending on the payload from the login route. The login puts `user: { id: ... }`
            // Let's attach the whole payload or just user logic
            req.user = decoded.user || decoded.business || decoded.garage || decoded;

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

exports.checkGuestReadOnly = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const admin = decoded.admin;
            const garage = decoded.garage || decoded.user;
            
            if (admin && (admin.role === 'guest_admin' || admin.isGuest || admin.email === 'guestadmin@vehicleecare.com')) {
                return res.status(403).json({
                    success: false,
                    msg: 'The guest admin only has read rights.'
                });
            }

            if (garage && (garage.role === 'guest_garage' || garage.isGuest === true)) {
                return res.status(403).json({
                    success: false,
                    msg: 'The guest garage only has read rights.'
                });
            }
        } catch (e) {
            // let downstream handlers handle token errors
        }
    }

    next();
};
