console.log("ADMIN ROUTES LOADED");
import express from 'express';
const router = express.Router();
// Changed verifyAdmin to your actual authorizeRoles helper
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// 1. MANAGE USERS ENDPOINTS
// Get all users with optional search
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

        const users = await User.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update User Status (Block/Unblock)
router.patch('/users/:id/status', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.body; // 'active' or 'blocked'
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
        res.status(200).json({ success: true, message: 'User account deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// 2. MANAGE PRODUCTS ENDPOINTS
// Get all products across the ecosystem
router.get('/products', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Moderate Product (Approve/Reject status update)
router.patch('/products/:id/status', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.body; // 'available', 'rejected', etc.
        const product = await Product.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        res.status(200).json({ success: true, message: `Product status updated to ${status}`, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete Product
router.delete('/products/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, message: 'Product removed from platform' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// 3. PLATFORM ANALYTICS ENDPOINT
router.get('/analytics', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Calculate Category Distribution Metrics
        const categoryData = await Product.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            stats: { totalUsers, totalProducts, totalOrders },
            categoryPerformance: categoryData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;