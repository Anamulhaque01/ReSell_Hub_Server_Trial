import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // 👈 Added password string field here
    photo: { type: String, default: "" },
    role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);