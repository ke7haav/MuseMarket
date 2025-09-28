import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/musemarket',
  mongodbTestUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/musemarket_test',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Web3 Configuration
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
  pyusdContractAddress: process.env.PYUSD_CONTRACT_ADDRESS || '0x6c3ea9036406852006290770BEdFcAbC0a3a5508',
  privateKey: process.env.PRIVATE_KEY || '',
  
  // Filecoin & IPFS Configuration
  lighthouseApiKey: process.env.LIGHTHOUSE_API_KEY || '',
  ipfsGatewayUrl: process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/',
  filepinApiKey: process.env.FILEPIN_API_KEY || '',
  
  // The Graph Configuration
  theGraphApiUrl: process.env.THE_GRAPH_API_URL || 'https://api.thegraph.com/subgraphs/name/your-subgraph',
  theGraphApiKey: process.env.THE_GRAPH_API_KEY || '',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
  
  // File Upload Configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '2147483648'), // 2GB - Filecoin supports up to 24GB
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'audio/mpeg,audio/wav,video/mp4,video/quicktime,application/pdf,image/jpeg,image/png').split(','),
  
  // External APIs
  alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
  infuraApiKey: process.env.INFURA_API_KEY || '',
};

export default config;
