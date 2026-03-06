/**
 * Role-based authorization middleware factory.
 * Usage: authorize('admin') or authorize('admin', 'student')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Requires role: ${roles.join(' or ')}`,
            });
        }
        next();
    };
};

module.exports = authorize;
