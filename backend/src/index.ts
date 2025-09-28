import app from './app';
import connectDB from './config/database';
import { config } from './config';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`🚀 MuseMarket API running on port ${PORT}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
