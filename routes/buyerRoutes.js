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
        const buyerEmail = req.user?.email;
        // Safe check for both token schemas (_id vs id formats)
        const buyerId = req.user?._id || req.user?.id;

        if (!buyerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access: Invalid identity verification.' });
        }

        // 1. Fetch buyer orders using either their email string or object ID parameter
        const orders = await Order.find({
            $or: [
                { 'buyerInfo.email': buyerEmail },
                { buyerId: buyerId }
            ]
        })
            .populate('productId')
            .sort({ createdAt: -1 });

        // 2. Fetch the user document and ensure the deep population of the wishlist items array
        const userProfile = await User.findById(buyerId).populate('wishlist');

        const totalOrders = orders.length;
        const wishlistCount = userProfile?.wishlist?.length || 0;

        const totalSpent = orders
            .filter(order => order.paymentStatus === 'paid')
            .reduce((sum, order) => sum + (order.price || order.productId?.price || 0), 0);

        const completedOrders = orders.filter(order => order.orderStatus === 'delivered').length;

        res.status(200).json({
            success: true,
            stats: {
                totalOrders,
                wishlistCount,
                totalSpent,
                completedOrders
            },
            recentOrders: orders.slice(0, 5),
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
        const buyerId = req.user._id || req.user.id;

        const order = await Order.findOne({
            _id: orderId,
            $or: [
                { 'buyerInfo.email': buyerEmail },
                { buyerId: buyerId }
            ]
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order record not found.' });
        }

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

/**
 * @route   GET /api/buyer/wishlist
 * @desc    Get all populated products in the logged-in buyer's wishlist
 * @access  Private (Buyer Only)
 */
router.get('/wishlist', verifyJWT, async (req, res) => {
    try {
        const buyerId = req.user._id || req.user.id;

        const userProfile = await User.findById(buyerId).populate('wishlist');
        if (!userProfile) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json(userProfile.wishlist || []);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/buyer/wishlist
 * @desc    Add a product to the buyer's wishlist array
 * @access  Private (Buyer Only)
 */
router.post('/wishlist', verifyJWT, async (req, res) => {
    try {
        const buyerId = req.user._id || req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            buyerId,
            { $addToSet: { wishlist: productId } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'Product successfully saved to wishlist' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /api/buyer/wishlist/:productId
 * @desc    Remove a product item from the user's wishlist array
 * @access  Private (Buyer Only)
 */
router.delete('/wishlist/:productId', verifyJWT, async (req, res) => {
    try {
        const buyerId = req.user._id || req.user.id;
        const { productId } = req.params;

        await User.findByIdAndUpdate(
            buyerId,
            { $pull: { wishlist: productId } },
            { new: true }
        );

        res.status(200).json({ success: true, message: 'Item removed from wishlist.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/buyer/payments
 * @desc    Get all payment records matching orders made by this buyer
 * @access  Private (Buyer Only)
 */
router.get('/payments', verifyJWT, async (req, res) => {
    try {
        const buyerEmail = req.user.email;
        const buyerId = req.user._id || req.user.id;

        const buyerOrders = await Order.find({
            $or: [
                { 'buyerInfo.email': buyerEmail },
                { buyerId: buyerId }
            ]
        }).populate('productId');

        const transactions = buyerOrders.map(order => ({
            _id: order._id,
            transactionId: `TXN-${order._id.toString().slice(-8).toUpperCase()}`,
            amount: order.price || order.productId?.price || 0,
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
 * @route   PUT /api/buyer/profile
 * @desc    Update editable parameters of the buyer's account profile
 * @access  Private (Buyer Only)
 */
router.put('/profile', verifyJWT, async (req, res) => {
    try {
        const buyerId = req.user._id || req.user.id;
        const buyerEmail = req.user.email;

        const { name, phone, location, bio, photo } = req.body;

        const fieldsToUpdate = {};
        if (name) fieldsToUpdate.name = name;
        if (phone) fieldsToUpdate.phone = phone;
        if (location) fieldsToUpdate.location = location;
        if (bio) fieldsToUpdate.bio = bio;
        if (photo) fieldsToUpdate.photo = photo;

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

export default router;