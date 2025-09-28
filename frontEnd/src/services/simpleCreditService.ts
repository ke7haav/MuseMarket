import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface SimpleCreditData {
  creditBalance: number;
  userId: string;
}

export interface SimplePurchase {
  _id: string;
  buyer: string;
  content: {
    _id: string;
    title: string;
    price: number;
    type: string;
    fileUrl: string;
    fileCid: string;
    thumbnailUrl: string;
  };
  amount: number;
  transactionHash: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimplePurchaseResponse {
  data: SimplePurchase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class SimpleCreditService {
  // Get credit balance
  async getCreditBalance(): Promise<{ data: SimpleCreditData }> {
    const response = await api.get('/simple-purchases/credit-balance');
    return response.data;
  }

  // Get user purchases (transactions)
  async getUserPurchases(params?: { page?: number; limit?: number }): Promise<SimplePurchaseResponse> {
    const response = await api.get('/simple-purchases/my-purchases', { params });
    return response.data;
  }

  // Create purchase
  async createPurchase(contentId: string): Promise<any> {
    const response = await api.post('/simple-purchases', { contentId });
    return response.data;
  }

  // Settle credit
  async settleCredit(transactionHash: string): Promise<any> {
    const response = await api.post('/simple-purchases/settle-credit', { transactionHash });
    return response.data;
  }

  // Get creator earnings
  async getCreatorEarnings(params?: { page?: number; limit?: number }): Promise<any> {
    const response = await api.get('/simple-purchases/creator-earnings', { params });
    return response.data;
  }

  // Claim earnings
  async claimEarnings(amount: number): Promise<any> {
    const response = await api.post('/simple-purchases/claim-earnings', { amount });
    return response.data;
  }
}

export default new SimpleCreditService();
