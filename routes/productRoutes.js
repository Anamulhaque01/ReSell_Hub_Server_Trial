// routes/productRoutes.js or update within server.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Matches your model structure exactly

// @desc    Get all products with advanced search, sorting, filtering, and pagination
// @route   GET /api/products
router.get('/', async (req, res) => {
    try {
        // 1. Destructure query parameters with default fallbacks
        const { search, category, sort, page = 1, limit = 6 } = req.query;

        // 2. Build a dynamic MongoDB query object
        let query = { status: 'available' }; // Only show available items in discovery 

        // Challenge 1: Advanced Search by Name (Title) 
        if (search) {
            query.title = { $regex: search, $options: 'i' }; // Case-insensitive partial matching
        }

        // Challenge 1: Advanced Filter by Category 
        if (category && category !== 'All') {
            query.category = category;
        }

        // Challenge 1: Advanced Sorting 
        let sortOptions = {};
        if (sort === 'priceLowHigh') {
            sortOptions.price = 1; // Ascending 
        } else if (sort === 'priceHighLow') {
            sortOptions.price = -1; // Descending 
        } else {
            sortOptions.createdAt = -1; // Newest listings first by default
        }

        // Challenge 2: Pagination Calculations 
        const currentPage = parseInt(page);
        const resultsPerPage = parseInt(limit);
        const skip = (currentPage - 1) * resultsPerPage;

        // Execute queries in parallel for efficiency
        const [products, totalProducts] = await Promise.all([
            Product.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(resultsPerPage),
            Product.countDocuments(query)
        ]);

        // Send paginated payload response
        res.status(200).json({
            success: true,
            products,
            meta: {
                totalProducts,
                currentPage,
                totalPages: Math.ceil(totalProducts / resultsPerPage),
                resultsPerPage
            }
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, message: "Server error fetching products" });
    }
});

module.exports = router;