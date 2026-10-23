
require("dotenv").config();

const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("./models/User");

function saltedSha256(password) {
    const salt = crypto.createHash("sha256").update(String(password)).digest("hex").slice(0, 16);
    return crypto.createHash("sha256").update(salt + String(password)).digest("hex");
}

function hashPassword(password) {
    return saltedSha256(password);
}

async function createStaff() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env");
        }

        const prn = "STAFF2026001";
        const name = "SybiEat Canteen Staff";
        const email = "canteen.staff@sitpune.edu.in";

        // Set a temporary password using the environment.
        const password = process.env.STAFF_TEMP_PASSWORD;

        if (
            typeof password !== "string" ||
            password.length < 12 ||
            password.length > 72
        ) {
            throw new Error(
                "Set STAFF_TEMP_PASSWORD in .env to a password of 12–72 characters"
            );
        }

        await mongoose.connect(process.env.MONGO_URI);

        const passwordHash = hashPassword(password);

        const user = await User.findOneAndUpdate(
            { email },
            {
                $set: {
                    prn,
                    name,
                    passwordHash,
                    role: "staff"
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        console.log("Staff account ready:");
        console.log("Email:", user.email);
        console.log("Role:", user.role);
        console.log("Use your configured temporary password to log in.");
    } catch (error) {
        console.error("Could not create staff account:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

createStaff();
