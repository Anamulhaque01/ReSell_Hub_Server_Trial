import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Root Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ message: "ReSell Hub API Server Running Smoothly" });
});

// Database Connection & Server Listener
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server executing successfully on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to start application server:", err);
});