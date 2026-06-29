import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import * as authModule from '../middleware/authMiddleware.js';

const verifyJWT = authModule.verifyJWT || authModule.requireAuth || authModule.verifyToken || authModule.default;

const router = express.Router();

/**
 * @route   GET /api/buyer/overview
 * @desc    Get aggregated stats, recent orders, and wishlist contents for the dashboard
 * @access  Private (Buyer Only)
 */
router.get('/overview', verifyJWT, async (req, res) => {
    try {
        // Your Phase 2 authMiddleware should attach the authenticated user data to req.user
        const buyerEmail = req.user.email;
        const buyerId = req.user._id;

        // 1. Fetch orders placed by this buyer
        const orders = await Order.find({ 'buyerInfo.email': buyerEmail })
            .populate('productId')
            .sort({ createdAt: -1 }); // Get latest orders first

        // 2. Fetch buyer's fresh profile to get the up-to-date wishlist array
        const userProfile = await User.findById(buyerId).populate('wishlist');

        // 3. Compute Summary Statistics
        const totalOrders = orders.length;
        const wishlistCount = userProfile?.wishlist?.length || 0;

        // Calculate total spent from successfully paid orders
        const totalSpent = orders
            .filter(order => order.paymentStatus === 'paid')
            .reduce((sum, order) => sum + (order.price || 0), 0);

        // Filter out completed orders count
        const completedOrders = orders.filter(order => order.orderStatus === 'delivered').length;

        res.status(200).json({
            success: true,
            stats: {
                totalOrders,
                wishlistCount,
                totalSpent,
                completedOrders
            },
            recentOrders: orders.slice(0, 5), // Return last 5 orders for the overview dashboard section
            wishlist: userProfile?.wishlist || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to aggregate buyer dashboard metrics',
            error: error.message
        });
    }
});

/**
 * @route   PATCH /api/buyer/orders/:id/cancel
 * @desc    Cancel an order before it transitions out of processing/pending state
 * @access  Private (Buyer Only)
 */
router.patch('/orders/:id/cancel', verifyJWT, async (req, res) => {
    try {
        const orderId = req.params.id;
        const buyerEmail = req.user.email;

        // Ensure the order belongs to the requesting buyer
        const order = await Order.findOne({ _id: orderId, 'buyerInfo.email': buyerEmail });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order record not found.' });
        }

        // Strict Assignment Rule: Order can only be cancelled before shipment
        if (['shipped', 'delivered'].includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                message: 'This order has already been processed or shipped and cannot be cancelled.'
            });
        }

        order.orderStatus = 'cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully.',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error processing order cancellation',
            error: error.message
        });
    }
});

export default router;