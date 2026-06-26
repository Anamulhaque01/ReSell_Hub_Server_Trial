import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// 1. Traditional Registration Route
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, location, role, photo } = req.body;

        // Direct check for pre-existing records
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        // Save entity data to MongoDB Atlas via Mongoose
        const newUser = new User({
            name,
            email,
            phone,
            location, // Mandatory field per brief assignment constraints
            role: role || 'buyer',
            photo: photo || ''
        });

        const savedUser = await User.create(newUser);

        // Create custom JWT Token instantly upon registration completion
        const token = jwt.sign(
            { id: savedUser._id, email: savedUser.email, role: savedUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ token, user: savedUser });
    } catch (error) {
        res.status(500).json({ message: 'Registration failure', error: error.message });
    }
});

// 2. Traditional Login Route
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body; // Since this is a mock MERN app, we fetch directly by email

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User account not found' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Your account has been restricted by an administrator.' });
        }

        // Generate Verification Token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: 'Login execution failure', error: error.message });
    }
});

export default router;