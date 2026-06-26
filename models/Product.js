import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    condition: { type: String, enum: ['Used', 'Like New', 'Refurbished'], required: true },
    price: { type: Number, required: true },
    images: [{ type: String, required: true }],
    description: { type: String, required: true },
    sellerInfo: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true }
    },
    status: { type: String, enum: ['available', 'sold'], default: 'available' }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);