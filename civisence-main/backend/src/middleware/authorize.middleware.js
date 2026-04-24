const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Access denied: insufficient permissions.' });
        }
        next();
    };
};

module.exports = authorizeRoles;
