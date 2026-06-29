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

/**
 * ==========================================
 * WISHLIST FUNCTIONALITY ENDPOINTS
 * ==========================================
 */

// @route   GET /api/buyer/wishlist
// @desc    Get all populated products in the logged-in buyer's wishlist
// @access  Private (Buyer Only)
router.get('/wishlist', verifyJWT, async (req, res) => {
    try {
        const buyerId = req.user._id;

        // Find user and populate their array of wishlist items
        const userProfile = await User.findById(buyerId).populate('wishlist');
        if (!userProfile) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json(userProfile.wishlist || []);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/buyer/wishlist/:productId
// @desc    Remove a product item from the user's wishlist array
// @access  Private (Buyer Only)
router.delete('/wishlist/:productId', verifyJWT, async (req, res) => {
    try {
        const buyerId = req.user._id;
        const { productId } = req.params;

        await User.findByIdAndUpdate(
            buyerId,
            { $pull: { wishlist: productId } }, // Removes the item from the reference array inside MongoDB
            { new: true }
        );

        res.status(200).json({ success: true, message: 'Item removed from wishlist.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


/**
 * ==========================================
 * PAYMENT HISTORY ENDPOINTS
 * ==========================================
 */

// @route   GET /api/buyer/payments
// @desc    Get all payment records matching orders made by this buyer
// @access  Private (Buyer Only)
router.get('/payments', verifyJWT, async (req, res) => {
    try {
        const buyerEmail = req.user.email;

        // 1. Find all orders matching this buyer's email address
        const buyerOrders = await Order.find({ 'buyerInfo.email': buyerEmail });
        const orderIds = buyerOrders.map(order => order._id);

        // 2. Fallback Generation for academic data demonstration: 
        // If your project doesn't have a distinct "Payment" collection yet, we can maps paid orders safely!
        const transactions = buyerOrders.map(order => ({
            _id: order._id,
            transactionId: `TXN-${order._id.toString().slice(-8).toUpperCase()}`,
            amount: order.productId?.price || 0,
            paymentStatus: order.paymentStatus === 'paid' ? 'success' : 'pending',
            createdAt: order.createdAt || new Date(),
            orderId: {
                title: order.productId?.title || 'Marketplace Item'
            }
        }));

        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


/**
 * ==========================================
 * PROFILE MANAGEMENT ENDPOINTS
 * ==========================================
 */

// @route   PUT /api/buyer/profile
// @desc    Update editable parameters of the buyer's account profile
// @access  Private (Buyer Only)
// @route   PUT /api/buyer/profile
// @desc    Update editable parameters of the buyer's account profile
// @access  Private (Buyer Only)
router.put('/profile', verifyJWT, async (req, res) => {
    try {
        // Fallback safety checks to capture how your JWT identifies the user
        const buyerId = req.user._id || req.user.id;
        const buyerEmail = req.user.email;

        const { name, phone, location, bio, photo } = req.body;

        const fieldsToUpdate = {};
        if (name) fieldsToUpdate.name = name;
        if (phone) fieldsToUpdate.phone = phone;
        if (location) fieldsToUpdate.location = location;
        if (bio) fieldsToUpdate.bio = bio;
        if (photo) fieldsToUpdate.photo = photo;

        // Use findOneAndUpdate with an OR condition ($or) to ensure a match by ID or Email
        const updatedUser = await User.findOneAndUpdate(
            {
                $or: [
                    { _id: buyerId },
                    { email: buyerEmail }
                ]
            },
            { $set: fieldsToUpdate },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User profile target not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'Profile parameters synced successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});