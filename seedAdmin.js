import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js'; // Ensure the .js extension is included for ESM imports
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
    try {
        // 1. Connect to MongoDB Atlas using your environment variables
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MongoDB connection URI missing from .env file");
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB database successfully.');

        // 2. Define your Admin credentials
        const adminEmail = 'admin@resellhub.com';
        const rawPassword = 'adminPassword123';

        // Check if the admin account already exists to prevent duplicates
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin account already exists with this email address.');
            process.exit(0);
        }

        // 3. Hash the administrative password securely
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

        // 4. Build the user document following your strict data design rules
        const adminUser = new User({
            name: 'System Administrator',
            email: adminEmail,
            password: hashedPassword,
            photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
            role: 'admin',
            phone: '+8801700000000',
            location: 'Khulna, Bangladesh',
            status: 'active'
        });

        // 5. Commit to database storage
        await adminUser.save();
        console.log('===================================================');
        console.log('Admin Account Created Successfully!');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${rawPassword}`);
        console.log('===================================================');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin account:', error.message);
        process.exit(1);
    }
};

seedAdmin();