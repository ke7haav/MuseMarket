# MuseMarket Backend API

A Node.js TypeScript backend API for the MuseMarket PYUSD Creator Marketplace, built for ETHGlobal New Delhi 2025.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Content Management**: Upload, manage, and publish digital content
- **Filecoin Integration**: Store content on decentralized Filecoin network via Lighthouse
- **PYUSD Payments**: Handle PYUSD transactions for content purchases
- **Analytics**: Comprehensive analytics for creators and platform
- **The Graph Integration**: Index and query blockchain data

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **File Storage**: Filecoin via Lighthouse API
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Lighthouse API key for Filecoin storage

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   mongod
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/musemarket

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Filecoin
LIGHTHOUSE_API_KEY=your-lighthouse-api-key
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Web3
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
PYUSD_CONTRACT_ADDRESS=0x6c3ea9036406852006290770BEdFcAbC0a3a5508

# The Graph
THE_GRAPH_API_URL=https://api.thegraph.com/subgraphs/name/your-subgraph
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

### Content Management
- `GET /api/v1/content` - Get all published content
- `POST /api/v1/content` - Create new content (Creator only)
- `GET /api/v1/content/:id` - Get content by ID
- `PUT /api/v1/content/:id` - Update content (Creator only)
- `DELETE /api/v1/content/:id` - Delete content (Creator only)

### Purchases
- `POST /api/v1/purchases` - Create new purchase
- `GET /api/v1/purchases/my-purchases` - Get user purchases
- `GET /api/v1/purchases/stats` - Get purchase statistics

### Analytics
- `GET /api/v1/analytics/my-analytics` - Get creator analytics
- `GET /api/v1/analytics/global` - Get global platform analytics

## 🗄️ Database Models

### User
- `walletAddress` - Ethereum wallet address
- `username` - Unique username
- `email` - Optional email
- `isCreator` - Creator status
- `totalEarnings` - Total earnings in PYUSD
- `totalSales` - Total sales count

### Content
- `title` - Content title
- `description` - Content description
- `creator` - Creator user ID
- `price` - Price in PYUSD
- `type` - Content type (music, ebook, video, course)
- `fileCid` - Filecoin CID
- `fileUrl` - IPFS URL
- `tags` - Content tags
- `isPublished` - Publication status

### Purchase
- `buyer` - Buyer user ID
- `content` - Content ID
- `amount` - Purchase amount in PYUSD
- `transactionHash` - Blockchain transaction hash
- `status` - Purchase status

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📁 File Upload

Content files are uploaded to Filecoin via Lighthouse API. Supported file types:
- Audio: MP3, WAV
- Video: MP4, MOV
- Documents: PDF
- Images: JPEG, PNG

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 API Documentation

For detailed API documentation, visit `/api/docs` when the server is running.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.
