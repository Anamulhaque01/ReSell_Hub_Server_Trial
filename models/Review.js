import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    reviewerInfo: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true }
    },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);