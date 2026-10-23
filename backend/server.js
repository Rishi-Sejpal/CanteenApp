
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").MongoStore;
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Middleware
// ============================================

// Credentialed CORS is needed when the Vite dev server calls the API
// directly instead of using its /api proxy.
app.use(
    cors({
        origin: true,
        credentials: true
    })
);
app.use(express.json());

// ============================================
// Session Configuration
// ============================================

app.use(
    session({
        name: "symbieat.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: "sessions"
        }),

        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 2
        }
    })
);

// ============================================
// Home Route
// ============================================

const publicDir = path.join(__dirname, "public");
const frontendDist = path.join(publicDir, "dist");
const frontendIndex = path.join(frontendDist, "index.html");

app.get("/", (req, res) => {
    // When the frontend has been built, the backend doubles as the demo host.
    if (fs.existsSync(frontendIndex)) {
        return res.sendFile(frontendIndex);
    }

    return res.json({
        message: "Welcome to SybiEat Backend!",
        status: "Server is running",
        database:
            mongoose.connection.readyState === 1
                ? "Connected"
                : "Disconnected"
    });
});

// ============================================
// Test Route
// ============================================

app.get("/test", (req, res) => {
    res.send("SybiEat API is working!");
});

// ============================================
// Menu Routes
// ============================================

app.use("/api/menu", require("./routes/menuRoutes"));

// ============================================
// Authentication Routes
// ============================================

app.use("/api/auth", require("./routes/authRoutes"));

// ============================================
// Cart Routes
// ============================================

app.use("/api/cart", require("./routes/cartRoutes"));

// ============================================
// Orders Routes
// ============================================

app.use("/api/orders", require("./routes/orderRoutes"));

// ============================================
// Payment Routes
// ============================================

app.use("/api/payments", require("./routes/paymentRoutes"));

// ============================================
// Inventory Routes
// ============================================

app.use("/api/inventory", require("./routes/inventoryRoutes"));

// ============================================
// Serve the built frontend (optional, for one-command demos)
// ============================================

if (fs.existsSync(frontendIndex)) {
    app.use(express.static(frontendDist));

    // Default routing: serve index.html for any non-API GET route
    // (enables HTML5 mode / client-side routing)
    app.use((req, res, next) => {
        if (req.path.startsWith("/api")) {
            return next();
        }
        if (req.method !== "GET") {
            return next();
        }
        return res.sendFile(frontendIndex);
    });
}

// ============================================
// Handle Unknown Routes
// ============================================

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
        path: req.originalUrl
    });
});

// ============================================
// Connect to MongoDB and Start Server
// ============================================

async function startServer() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error(
                "MONGO_URI is missing from the .env file"
            );
        }

        if (!process.env.SESSION_SECRET) {
            throw new Error(
                "SESSION_SECRET is missing from the .env file"
            );
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(
                `SybiEat backend running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Backend startup failed:",
            error.message
        );

        process.exit(1);
    }
}

startServer();
