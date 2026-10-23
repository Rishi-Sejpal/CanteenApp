
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        prn: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ["student", "staff", "admin"],
            default: "student"
        }
    },
    {
        timestamps: true
    }
);

// Create and export the User model
module.exports = mongoose.model("User", userSchema);
