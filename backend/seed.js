/**
 * SymbiEat demo seed
 * ------------------------------------------------------------
 * Creates demo accounts, the full campus menu, kitchen inventory
 * and a lively set of sample orders for the Chef/Admin dashboards.
 *
 * Usage:
 *   npm run seed            # fill the database, keep existing orders
 *   npm run seed -- --reset # wipe orders/payments and reseed them
 *
 * Demo logins (login ID is the PRN):
 *   20240101001 / Student@123   (student)
 *   STAFF2026001 / Staff@1234   (chef / staff)
 *   ADMIN2026001 / Admin@1234   (admin)
 */

require("dotenv").config();

const mongoose = require("mongoose");
const crypto = require("crypto");

const User = require("./models/User");

// Server-side cryptography: salted SHA256 (must match backend/routes/authRoutes.js)
function saltedSha256(password) {
    const salt = crypto.createHash("sha256").update(String(password)).digest("hex").slice(0, 16);
    return crypto.createHash("sha256").update(salt + String(password)).digest("hex");
}

function hashPassword(password) {
    return saltedSha256(password);
}
const MenuItem = require("./models/MenuItem");
const Inventory = require("./models/Inventory");
const Order = require("./models/Order");
const Payment = require("./models/Payment");

const RESET = process.argv.includes("--reset");

const DEMO_USERS = [
    {
        prn: "20240101001",
        name: "Aarav Sharma",
        email: "aarav.sharma@sitpune.edu.in",
        password: "20240101001",
        role: "student"
    },
    {
        prn: "20240101002",
        name: "Diya Patel",
        email: "diya.patel@sitpune.edu.in",
        password: "20240101001",
        role: "student"
    },
    {
        prn: "20240101003",
        name: "Kabir Rao",
        email: "kabir.rao@sitpune.edu.in",
        password: "20240101001",
        role: "student"
    },
    {
        prn: "STAFF2026001",
        name: "Canteen Staff",
        email: "canteen.staff@sitpune.edu.in",
        password: "STAFF2026001",
        role: "staff"
    },
    {
        prn: "ADMIN2026001",
        name: "Canteen Admin",
        email: "admin@sitpune.edu.in",
        password: "ADMIN2026001",
        role: "admin"
    }
];

const MENU_ITEMS = [
    {
        name: "Mysore Masala Dosa",
        category: "South Indian",
        price: 95,
        description: "Crisp rice crepe, spiced potato, coconut chutney & sambar.",
        image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=900",
        label: "Canteen favourite",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Tandoori Paneer Roll",
        category: "Quick bites",
        price: 125,
        description: "Smoky paneer, crunchy kachumber and mint yoghurt in a rumali roti.",
        image: "https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg?auto=compress&cs=tinysrgb&w=900",
        label: "Ready in 8 min",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Rajma Chawal Bowl",
        category: "Rice & bowls",
        price: 110,
        description: "Slow-simmered kidney beans, steamed basmati and a little achaar.",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Rajma_Masala_%2832081557778%29.jpg/500px-Rajma_Masala_%2832081557778%29.jpg",
        label: "",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Chicken Dum Biryani",
        category: "Rice & bowls",
        price: 165,
        description: "Fragrant dum-cooked basmati, tender chicken and cooling raita.",
        image: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=900",
        label: "Lunch special",
        isVegetarian: false,
        isAvailable: true
    },
    {
        name: "Idli Sambar",
        category: "South Indian",
        price: 65,
        description: "Four pillowy idlis, ladled sambar and house-made podi.",
        image: "https://images.pexels.com/photos/4331489/pexels-photo-4331489.jpeg?auto=compress&cs=tinysrgb&w=900",
        label: "",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Amritsari Chole Kulche",
        category: "North Indian",
        price: 105,
        description: "Tangy chole with soft kulche, onion, lemon and green chutney.",
        image: "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=900",
        label: "",
        isVegetarian: true,
        isAvailable: false
    },
    {
        name: "Anda Bhurji Pav",
        category: "Quick bites",
        price: 85,
        description: "Street-style masala eggs with two buttered pav and chilli.",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Spicy_egg_bhurji_%40_the_eggfactory.jpg/500px-Spicy_egg_bhurji_%40_the_eggfactory.jpg",
        label: "",
        isVegetarian: false,
        isAvailable: true
    },
    {
        name: "Lemon Rice & Papad",
        category: "Rice & bowls",
        price: 75,
        description: "Tempered rice with curry leaves, peanuts and a crisp papad.",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Chitranna_and_Payasa.jpg/500px-Chitranna_and_Payasa.jpg",
        label: "",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Veg Thali",
        category: "North Indian",
        price: 120,
        description: "A traditional vegetarian meal with roti, rice, dal, seasonal sabzi, and salad.",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80",
        label: "Lunch special",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Veg Hakka Noodles",
        category: "Quick bites",
        price: 110,
        description: "Stir-fried noodles with mixed vegetables and Chinese-style seasoning.",
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80",
        label: "",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Veg Manchurian with Fried Rice",
        category: "Rice & bowls",
        price: 140,
        description: "Vegetable Manchurian balls served with vegetable fried rice.",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Gobi_Manchurian.jpg/500px-Gobi_Manchurian.jpg",
        label: "New on menu",
        isVegetarian: true,
        isAvailable: true
    }
];

const INVENTORY = [
    { name: "Dosa batter", quantity: 2.4, unit: "kg", lowStockAt: 3, area: "South Indian station" },
    { name: "Fresh paneer", quantity: 8, unit: "kg", lowStockAt: 4, area: "Cold storage" },
    { name: "Basmati rice", quantity: 5.2, unit: "kg", lowStockAt: 4, area: "Dry store" },
    { name: "Chicken", quantity: 1.8, unit: "kg", lowStockAt: 3, area: "Cold storage" },
    { name: "Coconut chutney", quantity: 1.2, unit: "L", lowStockAt: 1.5, area: "South Indian station" },
    { name: "Idli batter", quantity: 6, unit: "kg", lowStockAt: 3, area: "South Indian station" },
    { name: "Eggs", quantity: 36, unit: "pcs", lowStockAt: 24, area: "Cold storage" },
    { name: "Seasonal produce", quantity: 4.1, unit: "kg", lowStockAt: 2, area: "Prep counter" }
];

const SAMPLE_ORDERS = [
    { token: "SE-2041", prn: "20240101001", status: "placed", minutesAgo: 2, paymentStatus: "paid", items: [["Mysore Masala Dosa", 2], ["Idli Sambar", 1]] },
    { token: "SE-2042", prn: "20240101002", status: "placed", minutesAgo: 4, paymentStatus: "paid", items: [["Tandoori Paneer Roll", 1], ["Lemon Rice & Papad", 1]] },
    { token: "SE-2043", prn: "20240101003", status: "confirmed", minutesAgo: 7, paymentStatus: "paid", items: [["Amritsari Chole Kulche", 2], ["Veg Thali", 1]] },
    { token: "SE-2044", prn: "20240101001", status: "confirmed", minutesAgo: 9, paymentStatus: "paid", items: [["Chicken Dum Biryani", 1]] },
    { token: "SE-2045", prn: "20240101002", status: "preparing", minutesAgo: 12, paymentStatus: "paid", items: [["Rajma Chawal Bowl", 1], ["Mysore Masala Dosa", 1]] },
    { token: "SE-2046", prn: "20240101003", status: "preparing", minutesAgo: 15, paymentStatus: "paid", items: [["Veg Hakka Noodles", 1], ["Veg Manchurian with Fried Rice", 1]] },
    { token: "SE-2047", prn: "20240101001", status: "ready", minutesAgo: 20, paymentStatus: "paid", items: [["Idli Sambar", 2]] },
    { token: "SE-2048", prn: "20240101002", status: "ready", minutesAgo: 24, paymentStatus: "paid", items: [["Veg Thali", 1]] },
    { token: "SE-2049", prn: "20240101003", status: "ready", minutesAgo: 28, paymentStatus: "paid", items: [["Tandoori Paneer Roll", 2]] },
    { token: "SE-2050", prn: "20240101001", status: "completed", minutesAgo: 55, paymentStatus: "paid", items: [["Mysore Masala Dosa", 1]] },
    { token: "SE-2051", prn: "20240101002", status: "completed", minutesAgo: 70, paymentStatus: "paid", items: [["Rajma Chawal Bowl", 2]] },
    { token: "SE-2052", prn: "20240101003", status: "cancelled", minutesAgo: 35, paymentStatus: "refunded", items: [["Amritsari Chole Kulche", 1]] }
];

function minutesAgo(minutes) {
    return new Date(Date.now() - minutes * 60 * 1000);
}

async function seedUsers() {
    const users = new Map();

    for (const demo of DEMO_USERS) {
        const passwordHash = hashPassword(demo.prn);

        const user = await User.findOneAndUpdate(
            { prn: demo.prn },
            {
                $set: {
                    prn: demo.prn,
                    name: demo.name,
                    email: demo.email,
                    passwordHash,
                    role: demo.role
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        users.set(demo.prn, user);
    }

    return users;
}

async function seedMenu() {
    const dishes = new Map();

    for (const item of MENU_ITEMS) {
        const dish = await MenuItem.findOneAndUpdate(
            { name: item.name },
            { $set: item },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        dishes.set(dish.name, dish);
    }

    return dishes;
}

async function seedInventory() {
    for (const item of INVENTORY) {
        await Inventory.findOneAndUpdate(
            { name: item.name },
            { $set: item },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );
    }
}

async function seedOrders(users, dishes) {
    if (RESET) {
        await Payment.deleteMany({});
        await Order.deleteMany({});
        console.log("Cleared existing orders and payments (--reset).");
    }

    const existingCount = await Order.countDocuments();

    if (existingCount > 0 && !RESET) {
        console.log(`Skipped demo orders — ${existingCount} already exist. Use --reset to rebuild them.`);
        return;
    }

    for (const sample of SAMPLE_ORDERS) {
        const user = users.get(sample.prn);
        if (!user) throw new Error(`Missing demo student ${sample.prn}`);

        const items = sample.items.map(([name, quantity]) => {
            const dish = dishes.get(name);
            if (!dish) throw new Error(`Missing menu item ${name}`);
            return {
                menuItem: dish._id,
                name: dish.name,
                price: dish.price,
                quantity,
                subtotal: dish.price * quantity
            };
        });

        const total = items.reduce((sum, item) => sum + item.subtotal, 0);
        const placedAt = minutesAgo(sample.minutesAgo);

        const order = await Order.create({
            token: sample.token,
            user: user._id,
            items,
            total,
            status: sample.status,
            paymentStatus: sample.paymentStatus,
            paymentMethod: "demo_upi",
            estimatedReadyAt:
                sample.status === "preparing"
                    ? new Date(placedAt.getTime() + 15 * 60 * 1000)
                    : null,
            cancelledAt:
                sample.status === "cancelled"
                    ? new Date(placedAt.getTime() + 6 * 60 * 1000)
                    : null
        });

        // Keep the ledger looking realistic: orders happened over the shift.
        await Order.updateOne(
            { _id: order._id },
            { $set: { createdAt: placedAt, updatedAt: placedAt } },
            { timestamps: false }
        );

        if (sample.paymentStatus !== "pending") {
            await Payment.create({
                order: order._id,
                user: user._id,
                amount: total,
                method: "demo_upi",
                status: "paid",
                transactionId: `DEMO-SEED-${sample.token}`,
                paidAt: placedAt
            });
        }
    }

    console.log(`Seeded ${SAMPLE_ORDERS.length} demo orders.`);
}

async function main() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    const users = await seedUsers();
    const dishes = await seedMenu();
    await seedInventory();
    await seedOrders(users, dishes);

    console.log(`Seeded ${users.size} accounts, ${dishes.size} menu items and ${INVENTORY.length} inventory records.`);
    console.log("");
    console.log("Demo logins (login ID = PRN):");
    console.log("  Student  20240101001 / 20240101001");
    console.log("  Chef     STAFF2026001 / STAFF2026001");
    console.log("  Admin    ADMIN2026001 / ADMIN2026001");
}

main()
    .catch((error) => {
        console.error("Seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
