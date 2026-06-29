import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to handle role protection inline based on your middleware rules
const isSeller = (req, res, next) => {
    if (!req.user || req.user.role !== 'seller') {
        return res.status(403).json({ message: 'Forbidden: Seller access only.' });
    }
    next();
};

// ==========================================
// 1. GET Seller Dashboard Performance Stats
// ==========================================
router.get('/stats', verifyToken, isSeller, async (req, res) => {
    try {
        const sellerId = req.user.id || req.user._id;

        // Fetch products owned by seller
        const products = await Product.find({ 'sellerInfo.userId': sellerId });
        const productIds = products.map(p => p._id.toString());

        // Aggregate orders matching seller's products
        const orders = await Order.find({ productId: { $in: productIds } });

        const totalProducts = products.length;
        const totalSales = orders.filter(o => o.paymentStatus === 'paid').length;

        // Calculate earnings from completed/paid transactions
        const totalRevenue = orders
            .filter(o => o.paymentStatus === 'paid')
            .reduce((sum, order) => sum + (order.amount || 0), 0);

        const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
        const activeListings = products.filter(p => p.status === 'available').length;

        // UI Verification Counters
        const approvedCount = products.filter(p => p.status === 'available' || p.status === 'sold').length;
        const pendingApprovalCount = products.filter(p => p.status === 'pending').length;
        const rejectedCount = products.filter(p => p.status === 'rejected').length;

        // Recent Orders Matrix
        const recentOrders = await Order.find({ productId: { $in: productIds } })
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            stats: {
                totalProducts,
                totalSales,
                totalRevenue,
                pendingOrders,
                activeListings,
                approvedCount,
                pendingApprovalCount,
                rejectedCount
            },
            recentOrders
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve stats tracking logs.', error: error.message });
    }
});

// ==========================================
// 2. POST Add Product (Fixed Mongoose Validation Support)
// ==========================================
router.post('/products', verifyToken, isSeller, async (req, res) => {
    try {
        const { title, category, condition, price, images, description } = req.body;

        // Strict incoming validation guard
        if (!title || !category || !condition || !price || !description) {
            return res.status(400).json({ message: 'Missing required product validation fields.' });
        }

        const newProduct = new Product({
            title,
            category,
            condition,
            price: Number(price),
            images: images || [],
            description,
            status: 'available',
            sellerInfo: {
                userId: req.user.id || req.user._id,
                name: req.user.name || 'Active Seller',
                email: req.user.email,
                phone: req.user.phone || 'No Phone Provided' // Secure fallback if phone context doesn't exist
            }
        });

        const savedProduct = await newProduct.save();
        return res.status(201).json({ message: 'Product listed in MongoDB successfully!', product: savedProduct });
    } catch (error) {
        console.error("MongoDB Save Error details:", error);
        return res.status(500).json({ message: 'Database transaction failure logged.', error: error.message });
    }
});

// ==========================================
// 3. GET Seller Inventory
// ==========================================
router.get('/products', verifyToken, isSeller, async (req, res) => {
    try {
        const sellerId = req.user.id || req.user._id;
        const products = await Product.find({ 'sellerInfo.userId': sellerId }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch seller inventory.', error: error.message });
    }
});

// ==========================================
// 4. PUT Update Product Details
// ==========================================
router.put('/products/:id', verifyToken, isSeller, async (req, res) => {
    try {
        const sellerId = req.user.id || req.user._id;
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: 'Product execution entry not found.' });
        if (product.sellerInfo.userId.toString() !== sellerId.toString()) {
            return res.status(401).json({ message: 'Unauthorized modification attempt.' });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json({ message: 'Product updated successfully!', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Update cycle crashed.', error: error.message });
    }
});

// ==========================================
// 5. DELETE Remove Product
// ==========================================
router.delete('/products/:id', verifyToken, isSeller, async (req, res) => {
    try {
        const sellerId = req.user.id || req.user._id;
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: 'Product entry missing.' });
        if (product.sellerInfo.userId.toString() !== sellerId.toString()) {
            return res.status(401).json({ message: 'Unauthorized deletion payload.' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Product successfully dropped from database.' });
    } catch (error) {
        res.status(500).json({ message: 'Delete operations error.', error: error.message });
    }
});

export default router;