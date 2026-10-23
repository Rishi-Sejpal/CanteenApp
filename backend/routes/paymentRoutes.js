
const express = require("express");
const crypto = require("crypto");

const Payment = require("../models/Payment");
const Order = require("../models/Order");
const { requireLogin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireLogin);

// ============================================
// Demo QR Code Configuration
// ============================================

// This is a visual placeholder, NOT a real UPI payment QR.
const DEMO_QR_CODE =
    "https://placehold.co/300x300/png?text=SybiEat+Demo+QR";

// ============================================
// Create a Demo Payment
// POST /api/payments
// ============================================

router.post("/", async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
            return res.status(400).json({
                message: "A valid orderId is required"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Students can only pay for their own orders.
        if (
            order.user.toString() !== req.session.user.id &&
            !["staff", "admin"].includes(req.session.user.role)
        ) {
            return res.status(403).json({
                message: "You can only pay for your own orders"
            });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({
                message: "Cancelled orders cannot be paid for"
            });
        }

        if (order.paymentStatus === "paid") {
            return res.status(409).json({
                message: "This order is already marked as paid"
            });
        }

        // Reuse an existing payment record instead of creating duplicates.
        let payment = await Payment.findOne({ order: order._id });

        if (payment && payment.status === "paid") {
            return res.status(409).json({
                message: "This order already has a successful payment"
            });
        }

        if (!payment) {
            payment = new Payment({
                order: order._id,
                user: order.user,
                amount: order.total,
                method: "demo_upi",
                status: "pending",
                qrCode: DEMO_QR_CODE
            });
        } else {
            // Refresh the amount and demo QR from server-side values.
            payment.amount = order.total;
            payment.status = "pending";
            payment.qrCode = DEMO_QR_CODE;
        }

        await payment.save();

        return res.status(201).json({
            message: "Demo payment created",
            demoOnly: true,
            payment: {
                id: payment._id,
                orderId: payment.order,
                amount: payment.amount,
                method: payment.method,
                status: payment.status,
                qrCode: payment.qrCode,
                qrPlaceholder: true,
                instructions:
                    "Demo only. This QR image does not accept real payments."
            }
        });
    } catch (error) {
        console.error("Create payment error:", error.message);

        return res.status(500).json({
            message: "Could not create payment"
        });
    }
});

// ============================================
// View Payment by Order ID
// GET /api/payments/order/:orderId
// ============================================

router.get("/order/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!/^[0-9a-fA-F]{24}$/.test(orderId)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (
            order.user.toString() !== req.session.user.id &&
            !["staff", "admin"].includes(req.session.user.role)
        ) {
            return res.status(403).json({
                message: "You cannot view this payment"
            });
        }

        const payment = await Payment.findOne({ order: order._id });

        if (!payment) {
            return res.status(404).json({
                message: "No payment has been created for this order"
            });
        }

        // Use the placeholder if an older payment has no QR URL.
        const qrCode = payment.qrCode || DEMO_QR_CODE;

        return res.json({
            payment: {
                id: payment._id,
                orderId: payment.order,
                amount: payment.amount,
                method: payment.method,
                status: payment.status,
                qrCode,
                qrPlaceholder: true,
                transactionId: payment.transactionId,
                paidAt: payment.paidAt,
                instructions:
                    "Demo only. This QR image does not accept real payments."
            }
        });
    } catch (error) {
        console.error("Get payment error:", error.message);

        return res.status(500).json({
            message: "Could not retrieve payment"
        });
    }
});

// ============================================
// Simulate Payment Result (Development Only)
// POST /api/payments/:paymentId/demo-result
// ============================================

router.post("/:paymentId/demo-result", async (req, res) => {
    try {
        if (process.env.NODE_ENV === "production") {
            return res.status(403).json({
                message: "Demo payments are disabled in production"
            });
        }

        const { paymentId } = req.params;
        const { result } = req.body;

        if (!/^[0-9a-fA-F]{24}$/.test(paymentId)) {
            return res.status(400).json({
                message: "Invalid payment ID"
            });
        }

        if (!["success", "failure"].includes(result)) {
            return res.status(400).json({
                message: "result must be success or failure"
            });
        }

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        const order = await Order.findById(payment.order);

        if (!order) {
            return res.status(404).json({
                message: "Associated order not found"
            });
        }

        if (
            payment.user.toString() !== req.session.user.id &&
            !["staff", "admin"].includes(req.session.user.role)
        ) {
            return res.status(403).json({
                message: "You cannot update this payment"
            });
        }

        if (payment.status === "paid" || order.paymentStatus === "paid") {
            return res.status(409).json({
                message: "Payment is already marked as paid"
            });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({
                message: "Cancelled orders cannot be paid for"
            });
        }

        if (payment.amount !== order.total) {
            return res.status(409).json({
                message: "Payment amount does not match the order total"
            });
        }

        if (result === "failure") {
            payment.status = "failed";
            await payment.save();

            return res.json({
                message: "Demo payment marked as failed",
                demoOnly: true,
                paymentStatus: payment.status
            });
        }

        payment.status = "paid";
        payment.paidAt = new Date();
        payment.transactionId = "DEMO-" + crypto.randomUUID();

        order.paymentStatus = "paid";

        await payment.save();
        await order.save();

        return res.json({
            message: "Demo payment successful",
            demoOnly: true,
            paymentStatus: payment.status,
            transactionId: payment.transactionId,
            orderPaymentStatus: order.paymentStatus
        });
    } catch (error) {
        console.error("Demo payment result error:", error.message);

        return res.status(500).json({
            message: "Could not update demo payment"
        });
    }
});

module.exports = router;
