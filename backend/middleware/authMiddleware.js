
function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            message: "Please log in first"
        });
    }

    next();
}

function requireStaff(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            message: "Please log in first"
        });
    }

    if (!["staff", "admin"].includes(req.session.user.role)) {
        return res.status(403).json({
            message: "Staff or admin access required"
        });
    }

    next();
}

module.exports = { requireLogin, requireStaff };

