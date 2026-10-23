
const express = require("express");
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");
const { requireLogin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireLogin);

// Helper: get the logged-in student's cart
async function getCart(userId) {
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
    }

    return cart;
}

// Helper: calculate current cart total
async function formatCart(cart) {
    await cart.populate("items.menuItem");

    let total = 0;

    const items = cart.items.map((item) => {
        const food = item.menuItem;

        if (!food) return null;

        const subtotal = food.price * item.quantity;
        total += subtotal;

        return {
            cartItemId: item._id,
            menuItemId: food._id,
            name: food.name,
            price: food.price,
            quantity: item.quantity,
            subtotal,
            isAvailable: food.isAvailable
        };
    }).filter(Boolean);

    return {
        items,
        total: Number(total.toFixed(2))
    };
}

// GET: View cart
router.get("/", async (req, res) => {
    try {
        const cart = await getCart(req.session.user.id);
        res.json(await formatCart(cart));
    } catch (error) {
        console.error("Get cart error:", error.message);
        res.status(500).json({ message: "Failed to fetch cart" });
    }
});

// POST: Add item to cart
router.post("/items", async (req, res) => {
    try {
        const { menuItemId, quantity } = req.body;

        if (!mongoose.isValidObjectId(menuItemId)) {
            return res.status(400).json({ message: "Valid menuItemId is required" });
        }

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
            return res.status(400).json({
                message: "Quantity must be a whole number from 1 to 50"
            });
        }

        const food = await MenuItem.findById(menuItemId);

        if (!food) {
            return res.status(404).json({ message: "Food item not found" });
        }

        if (!food.isAvailable) {
            return res.status(400).json({ message: "This food item is unavailable" });
        }

        const cart = await getCart(req.session.user.id);
        const existing = cart.items.find(
            (item) => item.menuItem.toString() === menuItemId
        );

        if (existing) {
            if (existing.quantity + quantity > 50) {
                return res.status(400).json({
                    message: "Maximum quantity per food item is 50"
                });
            }

            existing.quantity += quantity;
        } else {
            cart.items.push({ menuItem: menuItemId, quantity });
        }

        await cart.save();
        res.status(200).json({
            message: "Item added to cart",
            cart: await formatCart(cart)
        });
    } catch (error) {
        console.error("Add cart item error:", error.message);
        res.status(500).json({ message: "Failed to add item to cart" });
    }
});

// PUT: Set an item's quantity
router.put("/items/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid cart item ID" });
        }

        const { quantity } = req.body;

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
            return res.status(400).json({
                message: "Quantity must be a whole number from 1 to 50"
            });
        }

        const cart = await Cart.findOne({ user: req.session.user.id });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const item = cart.items.id(req.params.id);

        if (!item) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        const food = await MenuItem.findById(item.menuItem);

        if (!food || !food.isAvailable) {
            return res.status(400).json({ message: "Food item is unavailable" });
        }

        item.quantity = quantity;
        await cart.save();

        res.json({
            message: "Cart quantity updated",
            cart: await formatCart(cart)
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update cart" });
    }
});

// DELETE: Remove one item from cart
router.delete("/items/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid cart item ID" });
        }

        const cart = await Cart.findOne({ user: req.session.user.id });

        if (!cart || !cart.items.id(req.params.id)) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        cart.items.pull({ _id: req.params.id });
        await cart.save();

        res.json({
            message: "Item removed from cart",
            cart: await formatCart(cart)
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove cart item" });
    }
});

// DELETE: Clear the entire cart
router.delete("/", async (req, res) => {
    try {
        const cart = await getCart(req.session.user.id);
        cart.items = [];
        await cart.save();

        res.json({ message: "Cart cleared", cart: await formatCart(cart) });
    } catch (error) {
        res.status(500).json({ message: "Failed to clear cart" });
    }
});

module.exports = router;
