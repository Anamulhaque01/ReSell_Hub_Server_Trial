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
        phone: { type: String, required: false, default: '' } // Changed to false to prevent registration crashes
    },
    status: { type: String, enum: ['available', 'sold'], default: 'available' }
}, { timestamps: true });

// Check to see if model is already compiled to avoid Mongoose OverwriteModelError in server reloads
export default mongoose.models.Product || mongoose.model('Product', productSchema);