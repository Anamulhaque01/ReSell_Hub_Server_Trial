import express from 'express';
import User from '../models/User.js'; // Ensure your path to User model is correct
import { verifyToken } from '../middleware/auth.js'; // Must match your auth file name exactly

const router = express.Router();

// GET current profile data
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User profile not found.' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// PUT update profile data
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: req.body },
            { new: true, runValidators: true }
        ).select('-password');
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

export default router;