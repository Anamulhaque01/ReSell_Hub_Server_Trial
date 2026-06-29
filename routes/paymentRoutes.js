// re_sell_hub_server/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { verifyToken, verifyBuyer } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');

// 1. Create Payment Intent
router.post('/create-payment-intent', verifyToken, verifyBuyer, async (req, res) => {
    try {
        const { price } = req.body;
        if (!price) {
            return res.status(400).json({ message: 'Price is required' });
        }

        // Amount in cents
        const amount = parseInt(price * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'bdt',
            payment_method_types: ['card'],
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        res.status(500).json({ message: 'Stripe Intent Error', error: error.message });
    }
});

// 2. Store Successful Payment & Update Order Status
router.post('/store-payment', verifyToken, verifyBuyer, async (req, res) => {
    try {
        const { transactionId, buyerId, orderId, productId, amount, paymentMethod } = req.body;

        // Create Payment Record
        const newPayment = new Payment({
            orderId,
            transactionId,
            amount,
            paymentStatus: 'success', // Updates collection model per doc specs
            buyerId,
            paymentMethod,
            paymentDate: new Date()
        });
        const savedPayment = await newPayment.save();

        // Update Order Status to "paid" and "processing"
        await Order.findByIdAndUpdate(orderId, {
            paymentStatus: 'paid',
            orderStatus: 'processing'
        });

        // Update Product Status to "sold"
        await Product.findByIdAndUpdate(productId, { status: 'sold' });

        res.status(201).json({ success: true, payment: savedPayment });
    } catch (error) {
        res.status(500).json({ message: 'Database Update Error', error: error.message });
    }
});

module.exports = router;