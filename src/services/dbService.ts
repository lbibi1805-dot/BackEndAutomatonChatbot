import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
        throw new Error('MONGODB_URI is not defined in .env');
        }
        console.log(`Connecting to MongoDB at ${uri}`);
        await mongoose.connect(uri, {
        dbName: 'automaton_chatbot',
        });
        console.log('Connected to MongoDB');
    } catch (error: any) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

export default connectDB;