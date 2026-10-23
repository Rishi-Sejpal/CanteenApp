const express = require("express");
const mongoose = require("mongoose");
const Inventory = require("../models/Inventory");
const { requireStaff } = require("../middleware/authMiddleware");

const router = express.Router();

// Kitchen inventory is staff/admin only.
router.use(requireStaff);

// GET: all stock records
router.get("/", async (req, res) => {
    try {
        const inventory = await Inventory.find().sort({ area: 1, name: 1 });
        res.json(inventory);
    } catch (error) {
        console.error("Fetch inventory error:", error.message);
        res.status(500).json({ message: "Failed to fetch inventory" });
    }
});

// POST: add a stock record
router.post("/", async (req, res) => {
    try {
        const { name, quantity, unit, lowStockAt, area } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof quantity !== "number" || !Number.isFinite(quantity) || quantity < 0 ||
            !["kg", "L", "pcs"].includes(unit) ||
            typeof lowStockAt !== "number" || !Number.isFinite(lowStockAt) || lowStockAt < 0 ||
            typeof area !== "string" || !area.trim()
        ) {
            return res.status(400).json({
                message: "Valid name, quantity, unit, lowStockAt and area are required"
            });
        }

        const item = await Inventory.create({
            name,
            quantity,
            unit,
            lowStockAt,
            area
        });

        res.status(201).json({ message: "Stock record added", item });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "A stock record with this name already exists"
            });
        }
        res.status(500).json({ message: "Failed to add stock record" });
    }
});

// PATCH: update stock levels or thresholds
router.patch("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid stock record ID" });
        }

        const allowedFields = ["name", "quantity", "unit", "lowStockAt", "area"];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields supplied" });
        }

        const item = await Inventory.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ message: "Stock record not found" });
        }

        res.json({ message: "Stock record updated", item });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Failed to update stock record" });
    }
});

// DELETE: remove a stock record
router.delete("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid stock record ID" });
        }

        const item = await Inventory.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({ message: "Stock record not found" });
        }

        res.json({ message: "Stock record removed" });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove stock record" });
    }
});

module.exports = router;
