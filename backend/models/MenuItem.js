
const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },
        image: {
            type: String,
            default: ""
        },
        label: {
            type: String,
            default: "",
            trim: true,
            maxlength: 50
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        isVegetarian: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
