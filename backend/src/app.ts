import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { errorHandler, notFound } from '@/middleware/errorHandler';

// Import routes
import userRoutes from '@/routes/userRoutes';
import contentRoutes from '@/routes/contentRoutes';
import purchaseRoutes from '@/routes/purchaseRoutes';
import analyticsRoutes from '@/routes/analyticsRoutes';
import vaultRoutes from '@/routes/vaultRoutes';
import simplePurchaseRoutes from '@/routes/simplePurchaseRoutes';
import platformRoutes from '@/routes/platformRoutes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const allowedOrigins = Array.isArray(config.corsOrigin) ? config.corsOrigin : [config.corsOrigin];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, allow any localhost origin
    if (config.nodeEnv === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MuseMarket API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/vault', vaultRoutes);
app.use('/api/v1/simple-purchases', simplePurchaseRoutes);
app.use('/api/v1/platform', platformRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to MuseMarket API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

export default app;
