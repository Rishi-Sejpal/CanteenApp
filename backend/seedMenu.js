
require("dotenv").config();

const mongoose = require("mongoose");
const MenuItem = require("./models/MenuItem");

const menuItems = [
    {
        name: "Margherita Pizza",
        description: "Classic pizza with tomato sauce and mozzarella",
        price: 149,
        category: "Italian",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Paneer Tikka Sandwich",
        description: "Grilled sandwich filled with spicy paneer",
        price: 99,
        category: "Sandwich",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Veg Fried Rice",
        description: "Fried rice tossed with fresh vegetables",
        price: 89,
        category: "Chinese",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Masala Dosa",
        description: "Crispy dosa served with potato masala",
        price: 79,
        category: "South Indian",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Cold Coffee",
        description: "Chilled coffee with milk",
        price: 69,
        category: "Beverages",
        isVegetarian: true,
        isAvailable: true
    }
];

async function seedMenu() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Avoid duplicating these items if the script is run again.
        for (const item of menuItems) {
            await MenuItem.updateOne(
                { name: item.name },
                { $setOnInsert: item },
                { upsert: true }
            );
        }

        console.log("Sample menu items added successfully!");
        console.log(`Processed ${menuItems.length} sample items.`);
    } catch (error) {
        console.error("Menu seeding failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seedMenu();
