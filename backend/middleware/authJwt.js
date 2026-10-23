const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;

function signToken(user) {
    const payload = {
        sub: user._id.toString(),
        prn: user.prn,
        role: user.role,
        name: user.name
    };
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "2h",
        issuer: "symbieat",
        audience: "symbieat-users"
    });
}

function verifyToken(token) {
    if (!token || typeof token !== "string") return null;
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: "symbieat",
            audience: "symbieat-users"
        });
    } catch {
        return null;
    }
}

function requireAuthJwt(req, res, next) {
    const header = req.headers.authorization || "";
    let token = null;
    if (header.startsWith("Bearer ")) {
        token = header.slice(7).trim();
    } else if (req.cookies && req.cookies.symbieat_token) {
        token = req.cookies.symbieat_token;
    }
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = payload;
    req.authType = "jwt";
    return next();
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return next();
    };
}

module.exports = { signToken, verifyToken, requireAuthJwt, requireRole };
