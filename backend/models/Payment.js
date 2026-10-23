
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        method: {
            type: String,
            enum: ["demo_upi"],
            default: "demo_upi"
        },

        // Stores a QR image URL or Base64 image data.
        // This is a placeholder for the demo payment screen.
        qrCode: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending"
        },

        transactionId: {
            type: String,
            unique: true,
            sparse: true,
            default: undefined
        },

        paidAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);
