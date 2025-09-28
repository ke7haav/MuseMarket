import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export interface VaultTransaction {
  type: 'deposit' | 'withdrawal' | 'purchase' | 'earning' | 'refund' | 'credit_used' | 'monthly_payment' | 'credit_limit_increase';
  amount: number;
  description: string;
  contentId?: string;
  transactionHash?: string;
  createdAt: string;
}

export interface VaultData {
  id: string;
  user: {
    id: string;
    username: string;
    walletAddress: string;
  };
  walletAddress: string;
  balance: number;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  totalDeposited: number;
  totalSpent: number;
  monthlyBill: number;
  lastBillingDate: string;
  nextBillingDate: string;
  isCreditEnabled: boolean;
  transactionHistory: VaultTransaction[];
}

export interface PyusdInfo {
  name: string;
  symbol: string;
  decimals: number;
  contractAddress: string;
  network: string;
}

export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  blockNumber: number;
}

class VaultService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get vault data
  async getVault(): Promise<VaultData> {
    try {
      const response = await axios.get(`${API_BASE_URL}/vault`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting vault:', error);
      throw error;
    }
  }

  // Get vault balance
  async getVaultBalance(): Promise<{ balance: number; walletAddress: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/vault/balance`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting vault balance:', error);
      throw error;
    }
  }

  // Record a deposit
  async recordDeposit(transactionHash: string, amount: number, description?: string): Promise<{ id: string; balance: number; transactionHash: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/vault/deposit`, {
        transactionHash,
        amount,
        description
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error recording deposit:', error);
      throw error;
    }
  }

  // Record a purchase
  async recordPurchase(amount: number, contentId: string, description?: string): Promise<{ id: string; balance: number; amount: number }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/vault/purchase`, {
        amount,
        contentId,
        description
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error recording purchase:', error);
      throw error;
    }
  }

  // Record an earning
  async recordEarning(amount: number, contentId: string, description?: string): Promise<{ id: string; balance: number; amount: number }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/vault/earning`, {
        amount,
        contentId,
        description
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error recording earning:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactionHistory(page: number = 1, limit: number = 20, type?: string): Promise<{
    data: VaultTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (type) {
        params.append('type', type);
      }

      const response = await axios.get(`${API_BASE_URL}/vault/transactions?${params}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  // Get PYUSD contract info
  async getPyusdInfo(): Promise<PyusdInfo> {
    try {
      const response = await axios.get(`${API_BASE_URL}/vault/info`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting PYUSD info:', error);
      throw error;
    }
  }

  // Get blockchain transaction history
  async getBlockchainHistory(limit: number = 10): Promise<BlockchainTransaction[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/vault/blockchain-history?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting blockchain history:', error);
      throw error;
    }
  }

  // Purchase content using vault
  async purchaseContent(contentId: string): Promise<{ success: boolean; message: string; purchase?: any }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/purchases`, {
        contentId
      }, {
        headers: this.getAuthHeaders()
      });
      return {
        success: true,
        message: response.data.message,
        purchase: response.data.data
      };
    } catch (error: any) {
      console.error('Error purchasing content:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to purchase content'
      };
    }
  }

  // Pay monthly bill
  async payMonthlyBill(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/vault/pay-monthly-bill`, {}, {
        headers: this.getAuthHeaders()
      });
      return {
        success: true,
        message: response.data.message,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error paying monthly bill:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to pay monthly bill'
      };
    }
  }

  // Update credit limit
  async updateCreditLimit(creditLimit: number): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/vault/credit-limit`, {
        creditLimit
      }, {
        headers: this.getAuthHeaders()
      });
      return {
        success: true,
        message: response.data.message,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error updating credit limit:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update credit limit'
      };
    }
  }
}

export default new VaultService();
