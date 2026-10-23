
const express = require("express");
const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");
const { requireStaff } = require("../middleware/authMiddleware");

const router = express.Router();

// GET: All menu items
router.get("/", async (req, res) => {
    try {
        const items = await MenuItem.find().sort({ category: 1, name: 1 });
        res.json(items);
    } catch (error) {
        console.error("Fetch menu error:", error.message);
        res.status(500).json({ message: "Failed to fetch menu" });
    }
});

// GET: Available items only
router.get("/available", async (req, res) => {
    try {
        const items = await MenuItem.find({ isAvailable: true })
            .sort({ category: 1, name: 1 });

        res.json(items);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch available items"
        });
    }
});

// GET: Search food by name
router.get("/search", async (req, res) => {
    try {
        const search = String(req.query.q || "").trim();

        if (!search) {
            return res.status(400).json({
                message: "Enter a search term using ?q="
            });
        }

        if (search.length > 100) {
            return res.status(400).json({
                message: "Search term is too long"
            });
        }

        const items = await MenuItem.find({
            name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
            isAvailable: true
        });

        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Failed to search menu" });
    }
});

// GET: Items by category
router.get("/category/:category", async (req, res) => {
    try {
        const category = req.params.category.trim();

        const items = await MenuItem.find({
            category: {
                $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i"
            },
            isAvailable: true
        });

        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Failed to filter menu" });
    }
});

// GET: One item by ID
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid food item ID" });
        }

        const item = await MenuItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: "Food item not found" });
        }

        res.json(item);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch food item" });
    }
});

// POST: Add food item (staff/admin only)
router.post("/", requireStaff, async (req, res) => {
    try {
        const { name, description, price, category, image, label, isVegetarian, isAvailable } =
            req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof category !== "string" || !category.trim() ||
            price === undefined ||
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            return res.status(400).json({
                message: "Valid name, category and non-negative price are required"
            });
        }

        if (isVegetarian !== undefined && typeof isVegetarian !== "boolean") {
            return res.status(400).json({
                message: "isVegetarian must be true or false"
            });
        }

        if (isAvailable !== undefined && typeof isAvailable !== "boolean") {
            return res.status(400).json({
                message: "isAvailable must be true or false"
            });
        }

        const item = await MenuItem.create({
            name,
            description,
            price,
            category,
            image,
            label,
            isVegetarian,
            isAvailable
        });

        res.status(201).json({
            message: "Food item added successfully",
            item
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }

        console.error("Add menu item error:", error.message);
        res.status(500).json({ message: "Failed to add food item" });
    }
});

// PUT: Update a food item (staff/admin only)
router.put("/:id", requireStaff, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid food item ID" });
        }

        const allowedFields = [
            "name", "description", "price", "category",
            "image", "label", "isVegetarian", "isAvailable"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields supplied" });
        }

        if (
            updates.price !== undefined &&
            (typeof updates.price !== "number" ||
                !Number.isFinite(updates.price) || updates.price < 0)
        ) {
            return res.status(400).json({
                message: "Price must be a non-negative number"
            });
        }

        for (const field of ["isAvailable", "isVegetarian"]) {
            if (updates[field] !== undefined &&
                typeof updates[field] !== "boolean") {
                return res.status(400).json({
                    message: `${field} must be true or false`
                });
            }
        }

        const item = await MenuItem.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ message: "Food item not found" });
        }

        res.json({ message: "Food item updated successfully", item });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: "Failed to update food item" });
    }
});

// DELETE: Remove a food item (staff/admin only)
router.delete("/:id", requireStaff, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid food item ID" });
        }

        const item = await MenuItem.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({ message: "Food item not found" });
        }

        res.json({ message: "Food item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete food item" });
    }
});

module.exports = router;
