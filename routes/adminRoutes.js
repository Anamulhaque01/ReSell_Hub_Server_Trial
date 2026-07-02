import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = express.Router();

console.log("ADMIN ROUTES LOADED SUCCESSFULLY");

// ==========================================
// 1. MANAGE USERS ENDPOINTS
// ==========================================

// Get all users with search filtering by name or email
router.get('/users', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const users = await User.find(query).sort({ createdAt: -1 }).select('-password');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update User Status (Block/Unblock)
router.patch('/users/:id/status', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'blocked'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({ success: true, message: `User status updated to ${status}`, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete User Account
router.delete('/users/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, message: 'User permanent account removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add these routes to your existing adminRoutes.js file
router.get('/products', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};
        if (search) {
            query.$or = [{ title: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }];
        }
        if (status && status !== 'all') query.status = status;

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.patch('/products/:id/status', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const product = await Product.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/products/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;