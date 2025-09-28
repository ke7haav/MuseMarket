# MuseMarket - Decentralized Content Marketplace

A blockchain-based content marketplace built for EthGlobal hackathon, featuring encrypted content storage, credit-based payments, and creator earnings management.

## 🚀 Features

### Core Functionality
- **Decentralized Content Storage**: Uses Lighthouse Protocol for encrypted, decentralized file storage
- **Credit-Based Payment System**: Users can purchase content on credit and settle monthly
- **Creator Earnings Management**: Automated tracking and claiming of creator earnings
- **PYUSD Integration**: Real PayPal stablecoin payments on Sepolia testnet
- **MetaMask Integration**: Seamless wallet connection and transaction signing

### Technical Features
- **End-to-End Encryption**: Content is encrypted before storage and decrypted for authorized users
- **Smart Contract Integration**: PYUSD token transfers and wallet management
- **Real-time Updates**: Live credit balance and earnings tracking
- **Responsive Design**: Modern, mobile-friendly UI built with React and Tailwind CSS

## 🏗️ Architecture

### Backend (Node.js + Express)
- **API Server**: RESTful API with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based user authentication
- **File Storage**: Lighthouse Protocol for decentralized storage
- **Blockchain**: Ethereum Sepolia testnet integration

### Frontend (React + TypeScript)
- **UI Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context API
- **HTTP Client**: Axios for API communication
- **Wallet Integration**: MetaMask wallet connection

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Lighthouse Protocol
- ethers.js
- JWT

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Axios
- Framer Motion
- Lucide React
- MetaMask

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- MetaMask wallet
- Git

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontEnd
npm install
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/musemarket
JWT_SECRET=your_jwt_secret
LIGHTHOUSE_API_KEY=your_lighthouse_api_key
PLATFORM_WALLET_PRIVATE_KEY=your_platform_wallet_private_key
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_LIGHTHOUSE_API_KEY=your_lighthouse_api_key
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd EthGlobal
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontEnd && npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in both backend and frontEnd directories
   - Fill in your API keys and configuration

4. **Start the development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontEnd && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000

## 📱 Usage

### For Content Creators
1. Connect your MetaMask wallet
2. Upload encrypted content to the marketplace
3. Set pricing for your content
4. Track earnings and claim payments

### For Content Buyers
1. Connect your MetaMask wallet
2. Browse available content
3. Purchase content using credit system
4. Settle credit monthly with real PYUSD payments

## 🔐 Security Features

- **Encrypted Storage**: All content is encrypted before storage
- **Access Control**: Only authorized users can decrypt content
- **Secure Payments**: PYUSD transactions on Ethereum testnet
- **JWT Authentication**: Secure API access with token-based auth

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/connect-wallet` - Connect MetaMask wallet

### Content Management
- `GET /api/v1/content` - Get all content
- `POST /api/v1/content` - Upload new content
- `GET /api/v1/content/my/content` - Get user's content

### Purchase System
- `POST /api/v1/simple-purchases` - Create purchase
- `GET /api/v1/simple-purchases/my-purchases` - Get user purchases
- `POST /api/v1/simple-purchases/settle-credit` - Settle credit

### Creator Earnings
- `GET /api/v1/simple-purchases/creator-earnings` - Get creator earnings
- `POST /api/v1/simple-purchases/claim-earnings` - Claim earnings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏆 Hackathon

Built for EthGlobal hackathon with focus on:
- Decentralized storage solutions
- Blockchain payment integration
- Creator economy empowerment
- User experience optimization

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Note**: This is a hackathon project. For production use, additional security measures and testing would be required.
