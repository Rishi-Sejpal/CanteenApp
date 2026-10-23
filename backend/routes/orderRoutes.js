
const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { requireLogin, requireStaff } = require("../middleware/authMiddleware");

const router = express.Router();

// All order routes require login.
router.use(requireLogin);

async function createOrderWithToken(payload, attempts = 8) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const token = `SE-${crypto.randomInt(1000, 10000)}`;

        try {
            return await Order.create({ ...payload, token });
        } catch (error) {
            if (error.code !== 11000) throw error;
            // Token collision: try another four-digit token.
        }
    }

    throw new Error("Could not allocate a unique pickup token");
}

const orderUserFields = "name prn email role";

// ============================================
// POST /api/orders
// Place an order using the logged-in user's cart
// ============================================

router.post("/", async (req, res) => {
    try {
        const userId = req.session.user.id;

        const cart = await Cart.findOne({ user: userId })
            .populate("items.menuItem");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty"
            });
        }

        const orderItems = [];
        let total = 0;

        for (const cartItem of cart.items) {
            const menuItem = cartItem.menuItem;

            if (!menuItem || !menuItem.isAvailable) {
                return res.status(400).json({
                    message: "A cart item is no longer available"
                });
            }

            const price = menuItem.price;
            const quantity = cartItem.quantity;
            const subtotal = price * quantity;

            orderItems.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                price,
                quantity,
                subtotal
            });

            total += subtotal;
        }

        const order = await createOrderWithToken({
            user: userId,
            items: orderItems,
            total
        });

        cart.items = [];
        await cart.save();

        return res.status(201).json({
            message: "Order placed successfully",
            order
        });
    } catch (error) {
        console.error("Create order error:", error);

        return res.status(500).json({
            message: "Unable to place order"
        });
    }
});

// ============================================
// GET /api/orders
// Students see their own orders.
// Staff and admins see all orders.
// ============================================

router.get("/", async (req, res) => {
    try {
        const isStaff = ["staff", "admin"].includes(
            req.session.user.role
        );

        const filter = isStaff
            ? {}
            : { user: req.session.user.id };

        const orders = await Order.find(filter)
            .populate("user", orderUserFields)
            .sort({ createdAt: -1 });

        return res.json({ orders });
    } catch (error) {
        console.error("Order history error:", error);

        return res.status(500).json({
            message: "Unable to fetch orders"
        });
    }
});

// ============================================
// GET /api/orders/token/:token
// Look up an order by its pickup token
// ============================================

router.get("/token/:token", async (req, res) => {
    try {
        const token = String(req.params.token || "").trim().toUpperCase();

        if (!/^SE-\d{4}$/.test(token)) {
            return res.status(400).json({
                message: "Invalid pickup token"
            });
        }

        const isStaff = ["staff", "admin"].includes(
            req.session.user.role
        );

        const filter = isStaff
            ? { token }
            : { token, user: req.session.user.id };

        const order = await Order.findOne(filter)
            .populate("user", orderUserFields);

        if (!order) {
            return res.status(404).json({
                message: "Order not found for this token"
            });
        }

        return res.json({ order });
    } catch (error) {
        console.error("Order token lookup error:", error);

        return res.status(500).json({
            message: "Unable to fetch order"
        });
    }
});

// ============================================
// GET /api/orders/:id/tracking
// Track an order belonging to the logged-in user
// ============================================

router.get("/:id/tracking", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const isStaff = ["staff", "admin"].includes(
            req.session.user.role
        );

        const filter = isStaff
            ? { _id: req.params.id }
            : {
                _id: req.params.id,
                user: req.session.user.id
            };

        const order = await Order.findOne(filter).select(
            "status createdAt estimatedReadyAt cancelledAt"
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        return res.json({
            orderId: order._id,
            status: order.status,
            createdAt: order.createdAt,
            estimatedReadyAt: order.estimatedReadyAt,
            cancelledAt: order.cancelledAt
        });
    } catch (error) {
        console.error("Order tracking error:", error);

        return res.status(500).json({
            message: "Unable to fetch tracking information"
        });
    }
});

// ============================================
// POST /api/orders/:id/cancel
// Customers can cancel before preparation starts
// ============================================

router.post("/:id/cancel", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.user.id
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (!["placed", "confirmed"].includes(order.status)) {
            return res.status(400).json({
                message: "This order can no longer be cancelled"
            });
        }

        order.status = "cancelled";
        order.cancelledAt = new Date();

        await order.save();

        return res.json({
            message: "Order cancelled successfully",
            order
        });
    } catch (error) {
        console.error("Cancel order error:", error);

        return res.status(500).json({
            message: "Unable to cancel order"
        });
    }
});

// ============================================
// GET /api/orders/:id
// View a specific order
// ============================================

router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const isStaff = ["staff", "admin"].includes(
            req.session.user.role
        );

        const filter = isStaff
            ? { _id: req.params.id }
            : {
                _id: req.params.id,
                user: req.session.user.id
            };

        const order = await Order.findOne(filter)
            .populate("user", orderUserFields);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        return res.json({ order });
    } catch (error) {
        console.error("Get order error:", error);

        return res.status(500).json({
            message: "Unable to fetch order"
        });
    }
});

// ============================================
// PATCH /api/orders/:id/status
// Staff and admins update order status
// ============================================

router.patch("/:id/status", requireStaff, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const allowedStatuses = [
            "confirmed",
            "preparing",
            "ready",
            "completed",
            "cancelled"
        ];

        const { status } = req.body;

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status",
                allowedStatuses
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const transitions = {
            placed: ["confirmed", "cancelled"],
            confirmed: ["preparing", "cancelled"],
            preparing: ["ready"],
            ready: ["completed"],
            completed: [],
            cancelled: []
        };

        if (!transitions[order.status].includes(status)) {
            return res.status(400).json({
                message: `Cannot change status from ${order.status} to ${status}`
            });
        }

        order.status = status;

        // Estimate readiness as 15 minutes after preparation starts.
        if (status === "preparing") {
            order.estimatedReadyAt = new Date(
                Date.now() + 15 * 60 * 1000
            );
        }

        if (status === "cancelled") {
            order.cancelledAt = new Date();
        }

        await order.save();

        return res.json({
            message: "Order status updated successfully",
            order
        });
    } catch (error) {
        console.error("Update order status error:", error);

        return res.status(500).json({
            message: "Unable to update order status"
        });
    }
});

module.exports = router;
