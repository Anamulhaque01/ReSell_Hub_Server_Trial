import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    condition: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Used', 'Like New', 'Refurbished'],
        required: true
    },
    price: { type: Number, required: true },
    images: [{ type: String, required: true }],
    description: { type: String, required: true },
    sellerInfo: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: false, default: '' }
    },
    // Updated enum to support admin moderation flow
    status: {
        type: String,
        enum: ['available', 'sold', 'pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', productSchema);