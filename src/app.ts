import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './services/dbService';
import authRoutes from './routes/authRoutes';
import automatonRoutes from './routes/automatonRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// CORS configuration for production
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Kết nối MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/automaton', automatonRoutes);

app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});