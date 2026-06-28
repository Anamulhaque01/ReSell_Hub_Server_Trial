import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // 👈 Make sure to run 'npm install bcryptjs' in your backend folder
import User from '../models/User.js';

const router = express.Router();

// Secure Registration Route
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, location, role, password, photo } = req.body;

        // Validation check
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Name, email, and password are required fields.' });
        }

        // Check for existing records
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        // Hash the incoming password string (10 salt rounds)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save entry with the encrypted password field
        const newUser = new User({
            name,
            email,
            phone,
            location,
            role: role || 'buyer',
            password: hashedPassword, // 👈 Saves the hashed string to your new schema field
            photo: photo || ''
        });

        const savedUser = await User.create(newUser);

        // Sanitize response object to not send back the password hash
        const userResponse = savedUser.toObject();
        delete userResponse.password;

        // Generate custom JWT Token
        const token = jwt.sign(
            { id: savedUser._id, email: savedUser.email, role: savedUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ token, user: userResponse });
    } catch (error) {
        res.status(500).json({ message: 'Registration failure', error: error.message });
    }
});

// Secure Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide both email and password.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(444).json({ message: 'User account not found' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Your account has been restricted by an administrator.' });
        }

        // 👈 Compare the text password with the hashed database password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials. Please try again.' });
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({ token, user: userResponse });
    } catch (error) {
        res.status(500).json({ message: 'Login execution failure', error: error.message });
    }
});

export default router;