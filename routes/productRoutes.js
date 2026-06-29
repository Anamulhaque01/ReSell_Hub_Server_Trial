// routes/productRoutes.js

import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();


// =====================================
// GET ALL PRODUCTS
// =====================================
router.get('/', async (req, res) => {

    try {

        const {
            search,
            category,
            condition,
            sort,
            minPrice,
            maxPrice,
            page = 1,
            limit = 8
        } = req.query;


        let query = {};


        // Search by title
        if (search && search.trim() !== '') {

            query.title = {
                $regex: search.trim(),
                $options: 'i'
            };

        }


        // Category filter
        if (
            category &&
            category !== 'All Categories' &&
            category !== 'All'
        ) {

            query.category = category;

        }


        // Condition filter
        if (
            condition &&
            condition !== 'All Conditions' &&
            condition !== 'All'
        ) {

            query.condition = condition;

        }


        // Price filter
        if (minPrice || maxPrice) {

            query.price = {};

            if (minPrice) {
                query.price.$gte = Number(minPrice);
            }

            if (maxPrice) {
                query.price.$lte = Number(maxPrice);
            }

        }



        // Sorting
        let sortOption = {
            createdAt: -1
        };


        if (sort === 'priceLowHigh') {

            sortOption = {
                price: 1
            };

        }


        if (sort === 'priceHighLow') {

            sortOption = {
                price: -1
            };

        }



        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        const skip =
            (pageNumber - 1) * limitNumber;



        const totalProducts =
            await Product.countDocuments(query);



        const products =
            await Product.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limitNumber);



        res.status(200).json({

            success: true,

            products,

            meta: {

                totalProducts,

                totalPages:
                    Math.ceil(totalProducts / limitNumber),

                currentPage: pageNumber

            }

        });



    } catch (error) {


        console.error(
            "Get products error:",
            error
        );


        res.status(500).json({

            success: false,

            message: error.message

        });


    }

});





// =====================================
// GET SINGLE PRODUCT DETAILS
// =====================================
router.get('/:id', async (req, res) => {


    try {


        const product =
            await Product.findById(req.params.id);



        if (!product) {


            return res.status(404).json({

                success: false,

                message: "Product not found"

            });


        }



        res.status(200).json({

            success: true,

            product

        });



    } catch (error) {


        console.error(
            "Single product error:",
            error
        );


        res.status(500).json({

            success: false,

            message: error.message

        });


    }


});





export default router;