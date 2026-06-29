import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import buyerRoutes from './routes/buyerRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Main Authentication Enpoints Router Integration
app.use('/api/auth', authRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ message: "ReSell Hub API Server Running Smoothly" });
});

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server executing successfully on port ${PORT}`));
}).catch(err => console.error(err));