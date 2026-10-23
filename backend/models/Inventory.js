const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 100
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        unit: {
            type: String,
            enum: ["kg", "L", "pcs"],
            required: true
        },
        lowStockAt: {
            type: Number,
            required: true,
            min: 0
        },
        area: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
