// re_sell_hub_server/seed.js
import mongoose from 'mongoose';
import Product from './models/Product.js'; // Note the explicit .js extension needed for ES Modules
import dotenv from 'dotenv';

dotenv.config();

const dummyProducts = [
    {
        title: "Mountain Bike Trek Marlin 7",
        category: "Vehicles",
        condition: "Like New", // Valid Enum[cite: 1]
        price: 950,
        images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80"],
        description: "High-performance mountain bike perfect for off-road trails and daily commuting.",
        sellerInfo: {
            userId: "64f1a2b3c4d5e6f7a8b9c011",
            name: "Alex Rivera",
            email: "alex@example.com",
            phone: "+8801700000000"
        },
        status: "available",
        views: 23,
        rating: 4.4,
        stock: 3,
        location: "New York, NY"
    },
    {
        title: "Nike Air Jordan 4 Retro",
        category: "Fashion",
        condition: "Used", // Valid Enum[cite: 1]
        price: 285,
        images: ["https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=80"],
        description: "Classic retro basketball sneakers. Heavy wear, but highly collectible item.",
        sellerInfo: {
            userId: "64f1a2b3c4d5e6f7a8b9c012",
            name: "Jordan Brooks",
            email: "jordan@example.com",
            phone: "+8801800000000"
        },
        status: "available",
        views: 490,
        rating: 4.5,
        stock: 4,
        location: "Phoenix, AZ"
    },
    {
        title: "Ergonomic Office Chair",
        category: "Furniture",
        condition: "Refurbished", // Valid Enum[cite: 1]
        price: 520,
        images: ["https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80"],
        description: "Fully adjustable lumbar support mesh chair, comfortable for long remote work setups.",
        sellerInfo: {
            userId: "64f1a2b3c4d5e6f7a8b9c013",
            name: "Sarah Jenkins",
            email: "sarah@example.com",
            phone: "+8801900000000"
        },
        status: "available",
        views: 59,
        rating: 4.9,
        stock: 2,
        location: "Houston, TX"
    },
    {
        title: "Vintage Leather Jacket",
        category: "Fashion",
        condition: "Used", // Valid Enum[cite: 1]
        price: 175,
        images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"],
        description: "Genuine brown cowhide leather jacket from the late 90s, broken-in feel.",
        sellerInfo: {
            userId: "64f1a2b3c4d5e6f7a8b9c014",
            name: "Marcus Cole",
            email: "marcus@example.com",
            phone: "+8801600000000"
        },
        status: "available",
        views: 227,
        rating: 4.1,
        stock: 3,
        location: "Chicago, IL"
    }
];
const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("Connected to MongoDB for data seeding...");

        await Product.deleteMany({ status: "available" });
        console.log("Cleared old available items.");

        await Product.insertMany(dummyProducts);
        console.log("Successfully seeded 4 custom mock marketplace items!");

        process.exit();
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedDB();