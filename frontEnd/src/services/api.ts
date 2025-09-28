import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// User API
export const userAPI = {
  // Connect wallet (handles both login and registration)
  connectWallet: (data: { walletAddress: string; signedMessage: string }) =>
    api.post('/users/connect-wallet', data),

  // Register user
  register: (data: { walletAddress: string; username: string; email?: string; bio?: string }) =>
    api.post('/users/register', data),

  // Login user
  login: (data: { walletAddress: string }) =>
    api.post('/users/login', data),

  // Get user profile
  getProfile: () =>
    api.get('/users/profile'),

  // Update user profile
  updateProfile: (data: { username?: string; email?: string; bio?: string }) =>
    api.put('/users/profile', data),

  // Become creator
  becomeCreator: () =>
    api.post('/users/become-creator'),

  // Get Lighthouse API key
  getLighthouseKey: () =>
    api.get('/users/lighthouse-key'),

  // Generate Lighthouse API key
  generateLighthouseKey: (signer: any) =>
    api.post('/users/generate-lighthouse-key', { signer }),
};

// Content API
export const contentAPI = {
  // Get all content
  getContent: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string;
  }) =>
    api.get('/content', { params }),

  // Get content by ID
  getContentById: (id: string) =>
    api.get(`/content/${id}`),

  // Create content
  createContent: (formData: FormData) =>
    api.post('/content', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Update content
  updateContent: (id: string, data: any) =>
    api.put(`/content/${id}`, data),

  // Delete content
  deleteContent: (id: string) =>
    api.delete(`/content/${id}`),

  // Get user's content
  getUserContent: (params?: { page?: number; limit?: number }) =>
    api.get('/content/my/content', { params }),

  // Like content
  likeContent: (id: string) =>
    api.post(`/content/${id}/like`),

  // Get trending content
  getTrendingContent: (limit?: number) =>
    api.get('/content/trending', { params: { limit } }),

  // Share encrypted content with buyer
  shareContent: (data: { contentId: string; buyerWalletAddress: string; signedMessage: string }) =>
    api.post('/content/share', data),
};

// Purchase API
export const purchaseAPI = {
  // Create purchase
  createPurchase: (data: { contentId: string; amount: number; transactionHash: string }) =>
    api.post('/purchases', data),

  // Get user purchases
  getUserPurchases: (params?: { page?: number; limit?: number }) =>
    api.get('/purchases/my-purchases', { params }),

  // Get purchase by ID
  getPurchaseById: (id: string) =>
    api.get(`/purchases/${id}`),

  // Get purchase stats
  getPurchaseStats: () =>
    api.get('/purchases/stats'),

  // Get creator sales
  getCreatorSales: (params?: { page?: number; limit?: number }) =>
    api.get('/purchases/creator/sales', { params }),

  // Sharing request functions
  getSharingRequests: (params?: { page?: number; limit?: number }) =>
    api.get('/purchases/sharing-requests', { params }),

  approveSharingRequest: (id: string, signedMessage: string) =>
    api.post(`/purchases/sharing-requests/${id}/approve`, { signedMessage }),

  rejectSharingRequest: (id: string) =>
    api.post(`/purchases/sharing-requests/${id}/reject`),
};

// Simple Purchase API (new credit-based system)
export const simplePurchaseAPI = {
  // Create purchase with credit
  createPurchase: (data: { contentId: string }) =>
    api.post('/simple-purchases', data),

  // Get user purchases
  getUserPurchases: (params?: { page?: number; limit?: number }) =>
    api.get('/simple-purchases/my-purchases', { params }),

  // Get credit balance
  getCreditBalance: () =>
    api.get('/simple-purchases/credit-balance'),

  // Settle credit
  settleCredit: (data: { transactionHash: string }) =>
    api.post('/simple-purchases/settle-credit', data),
};

// Analytics API
export const analyticsAPI = {
  // Get user analytics
  getUserAnalytics: () =>
    api.get('/analytics/user'),

  // Get global analytics
  getGlobalAnalytics: () =>
    api.get('/analytics/global'),

  // Get content analytics
  getContentAnalytics: (id: string) =>
    api.get(`/analytics/content/${id}`),
};

export default api;
