import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['success', 'failed'], required: true }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);