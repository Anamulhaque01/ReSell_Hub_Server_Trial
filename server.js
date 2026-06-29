import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import buyerRoutes from './routes/buyerRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Updated for flexible Vercel + Local CORS handling
app.use(
    cors({
        origin: function (origin, callback) {
            const allowedOrigins = [
                'http://localhost:3000',
                process.env.CLIENT_URL
            ];

            // Allow if it's local testing, matches CLIENT_URL, is a Vercel preview URL, or has no origin (like Postman)
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    })
);

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/admin/test', (req, res) => {
    res.json({
        message: "Admin route mounted"
    });
});

// Test route
app.get('/', (req, res) => {
    res.status(200).json({
        message: "ReSell Hub API Server Running Smoothly"
    });
});

// Database Connection (Runs asynchronously for Serverless environments)
connectDB()
    .catch((error) => {
        console.error("Database connection failed:", error);
    });

// Only run app.listen locally (Vercel manages ports automatically in production)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running locally on port ${PORT}`);
    });
}

// Export the app instance for Vercel's serverless handler
export default app;