import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './services/dbService';
import authRoutes from './routes/authRoutes';
import automatonRoutes from './routes/automatonRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.vercel.app', 'https://your-frontend-domain.netlify.app']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Kết nối MongoDB
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Automaton Chatbot Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/automaton', automatonRoutes);

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});