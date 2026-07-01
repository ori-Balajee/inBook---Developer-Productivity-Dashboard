import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import projectRoutes from './routes/Projects.js';
import sessionRoutes from './routes/Sessions.js';
import logRoutes from './routes/Logs.js';
import snippetRoutes from './routes/Snippets.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devpulse';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📍 Database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('\n📋 To fix:');
    console.log('1. Create MongoDB Atlas cluster at https://cloud.mongodb.com');
    console.log('2. Add MONGODB_URI to backend/.env');
    console.log('3. Example: mongodb+srv://username:password@cluster.mongodb.net/devpulse?retryWrites=true&w=majority');
  });

// Connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

// Health check
app.get('/api/health', (req, res) => {
  const status = {
    status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json(status);
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/snippets', snippetRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 DevPulse API Server running`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
