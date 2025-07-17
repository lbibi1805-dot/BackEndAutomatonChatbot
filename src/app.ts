import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './services/dbService';
import authRoutes from './routes/authRoutes';
import automatonRoutes from './routes/automatonRoutes';

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Kết nối MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/automaton', automatonRoutes);

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});