import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    photo: { type: String, default: "" },
    role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    // 👈 CRITICAL: Added wishlist referencing your products
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);