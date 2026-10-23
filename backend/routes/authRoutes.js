const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const { signToken } = require("../middleware/authJwt");

const router = express.Router();

// Allow only college email addresses ending in @sitpune.edu.in
const COLLEGE_EMAIL_REGEX =
    /^[a-zA-Z0-9._%+-]+@sitpune\.edu\.in$/i;

const DEMO_ACCOUNTS = {
    student: process.env.DEMO_STUDENT_PRN || "20240101001",
    staff: process.env.DEMO_STAFF_PRN || "STAFF2026001",
    admin: process.env.DEMO_ADMIN_PRN || "ADMIN2026001"
};

function sanitizeInput(input) {
    if (typeof input !== "string") return input;
    // Basic NoSQL injection sanitization
    return input.replace(/\$|\{|\}|\[|\]/g, "");
}

function saltedSha256(password) {
    const salt = crypto.createHash("sha256").update(String(password)).digest("hex").slice(0, 16);
    return crypto.createHash("sha256").update(salt + String(password)).digest("hex");
}

function hashPassword(password) {
    // Server-side cryptography: salted SHA256
    return saltedSha256(password);
}

function startSession(req, res, user, successMessage) {
    return req.session.regenerate((error) => {
        if (error) {
            console.error("Session regeneration error:", error.message);
            return res.status(500).json({
                message: "Unable to start login session"
            });
        }

        req.session.user = {
            id: user._id.toString(),
            prn: user.prn,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const token = signToken(user);

        res.cookie("symbieat_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 2,
            path: "/"
        });

        return req.session.save((saveError) => {
            if (saveError) {
                console.error("Session save error:", saveError.message);
                return res.status(500).json({
                    message: "Unable to save login session"
                });
            }

            return res.status(200).json({
                message: successMessage,
                user: req.session.user,
                token
            });
        });
    });
}


// ============================================
// POST /api/auth/register
// Register a new student
// ============================================
router.post("/register", async (req, res) => {
    try {
        const { prn, name, email, password } = req.body;

        // Check required fields
        if (
            typeof prn !== "string" ||
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !prn.trim() ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "PRN, name, email and password are required"
            });
        }

        const normalizedPrn = prn.trim();
        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        // Validate college email
        if (!COLLEGE_EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({
                message:
                    "Use your college email ending with @sitpune.edu.in"
            });
        }

        // Validate password length
        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                message: "Password must be between 8 and 72 characters"
            });
        }

        // Check if PRN or email already exists
        const existingUser = await User.findOne({
            $or: [
                { prn: normalizedPrn },
                { email: normalizedEmail }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "PRN or email is already registered"
            });
        }

        // Hash password using salted SHA256 (server-side cryptography)
        const passwordHash = hashPassword(password);

        // Students cannot choose their own role
        const user = await User.create({
            prn: normalizedPrn,
            name: normalizedName,
            email: normalizedEmail,
            passwordHash,
            role: "student"
        });

        return res.status(201).json({
            message: "Student registered successfully",
            user: {
                id: user._id.toString(),
                prn: user.prn,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "PRN or email is already registered"
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Unable to register student"
        });
    }
});


// ============================================
// POST /api/auth/login
// Log in with PRN (login ID) and password
// Email login is still accepted for older clients.
// ============================================
// POST /api/auth/logout — Destroy the session
router.post("/logout", async (req, res) => {
    try {
        if (req.session) {
            req.session.destroy((destroyError) => {
                if (destroyError) {
                    console.error("Session destroy error:", destroyError.message);
                    return res.status(500).json({
                        message: "Unable to log out"
                    });
                }

                // Clear the session cookie by responding without it
                res.clearCookie("symbieat.sid", {
                    path: "/",
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production"
                });

                return res.status(200).json({
                    message: "Logged out successfully"
                });
            });
        } else {
            // No session to destroy, still clear the cookie
            res.clearCookie("symbieat.sid", {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production"
            });

            return res.status(200).json({
                message: "Logged out successfully"
            });
        }
    } catch (error) {
        console.error("Logout error:", error.message);
        return res.status(500).json({
            message: "Unable to log out"
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        let { prn, email, password } = req.body || {};

        prn = typeof prn === "string" ? sanitizeInput(prn).trim() : "";
        email = typeof email === "string" ? sanitizeInput(email).trim().toLowerCase() : "";
        password = typeof password === "string" ? password : "";

        if (!prn && !email) {
            return res.status(400).json({
                message: "PRN and password are required"
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "PRN and password are required"
            });
        }

        if (!req.session) {
            return res.status(500).json({
                message: "Session service is not configured"
            });
        }

        let user;

        if (prn) {
            user = await User.findOne({
                prn: prn
            }).select("+passwordHash");
        } else {
            if (!COLLEGE_EMAIL_REGEX.test(email)) {
                return res.status(401).json({
                    message: "Please use your @sitpune.edu.in college email"
                });
            }

            user = await User.findOne({
                email: email
            }).select("+passwordHash");
        }

        const candidate = hashPassword(password);
        const stored = user && user.passwordHash;

        if (
            !user ||
            !stored ||
            stored !== candidate
        ) {
            return res.status(401).json({
                message: "Invalid PRN or password"
            });
        }

        return startSession(req, res, user, "Login successful");
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Unable to log in"
        });
    }
});

module.exports = router;
