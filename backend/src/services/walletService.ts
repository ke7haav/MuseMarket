import { ethers } from 'ethers';
import { config } from '@/config';

class WalletService {
  private platformWallet: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;

  constructor() {
    this.initializeProvider();
    this.initializePlatformWallet();
  }

  private initializeProvider() {
    // Use Sepolia RPC endpoints
    const rpcUrls = [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://sepolia.gateway.tenderly.co',
      'https://rpc.sepolia.org'
    ];
    
    this.provider = new ethers.JsonRpcProvider(rpcUrls[0]);
  }

  private initializePlatformWallet() {
    try {
      // Get private key from environment variables
      const privateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;
      
      if (!privateKey) {
        console.warn('⚠️ PLATFORM_WALLET_PRIVATE_KEY not found in environment variables');
        console.warn('🔑 Generating a new wallet for development...');
        
        // Generate a new wallet for development
        const randomWallet = ethers.Wallet.createRandom();
        this.platformWallet = randomWallet.connect(this.provider!) as any;
        
        console.log('🔑 Generated platform wallet:');
        console.log('Address:', this.platformWallet?.address);
        console.log('Private Key:', this.platformWallet?.privateKey);
        console.log('⚠️ IMPORTANT: Add this private key to your .env file as PLATFORM_WALLET_PRIVATE_KEY');
        console.log('⚠️ IMPORTANT: Fund this wallet with Sepolia ETH for gas fees');
        return;
      }

      // Use the provided private key
      this.platformWallet = new ethers.Wallet(privateKey, this.provider!) as any;
      console.log('✅ Platform wallet initialized:', this.platformWallet?.address);
      
    } catch (error) {
      console.error('❌ Error initializing platform wallet:', error);
      throw new Error('Failed to initialize platform wallet');
    }
  }

  // Get platform wallet address
  getPlatformAddress(): string {
    if (!this.platformWallet) {
      throw new Error('Platform wallet not initialized');
    }
    return this.platformWallet.address;
  }

  // Get platform wallet instance
  getPlatformWallet(): ethers.Wallet {
    if (!this.platformWallet) {
      throw new Error('Platform wallet not initialized');
    }
    return this.platformWallet;
  }

  // Get provider
  getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return this.provider;
  }

  // Get platform wallet balance (in ETH)
  async getPlatformBalance(): Promise<string> {
    if (!this.platformWallet || !this.provider) {
      throw new Error('Platform wallet not initialized');
    }

    try {
      const balance = await this.provider.getBalance(this.platformWallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting platform balance:', error);
      throw new Error('Failed to get platform balance');
    }
  }

  // Check if platform wallet has enough ETH for gas
  async hasEnoughGas(minimumEth: string = '0.01'): Promise<boolean> {
    try {
      const balance = await this.getPlatformBalance();
      const balanceEth = parseFloat(balance);
      const minimumEthFloat = parseFloat(minimumEth);
      
      return balanceEth >= minimumEthFloat;
    } catch (error) {
      console.error('Error checking gas balance:', error);
      return false;
    }
  }

  // Generate a new wallet (for testing/development)
  generateNewWallet(): { address: string; privateKey: string; mnemonic: string } {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || ''
    };
  }

  // Validate wallet address
  isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  // Get wallet info
  getWalletInfo() {
    if (!this.platformWallet) {
      throw new Error('Platform wallet not initialized');
    }

    return {
      address: this.platformWallet.address,
      network: 'sepolia',
      provider: 'sepolia-rpc'
    };
  }

  // Transfer PYUSD to a recipient (Mock implementation for development)
  async transferPYUSD(recipientAddress: string, amount: number): Promise<{ transactionHash: string; success: boolean }> {
    if (!this.platformWallet || !this.provider) {
      throw new Error('Platform wallet not initialized');
    }

    // Validate recipient address
    if (!this.isValidAddress(recipientAddress)) {
      throw new Error('Invalid recipient address');
    }

    try {
      // For development/testing: Simulate a transfer without actual blockchain interaction
      // In production, this would interact with the real PYUSD contract
      
      console.log(`💰 Simulating PYUSD transfer: ${amount} PYUSD to ${recipientAddress}`);
      
      // Simulate transaction processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      console.log(`✅ Mock PYUSD transfer completed: ${mockTxHash}`);
      console.log(`📝 Note: This is a development simulation. In production, this would be a real blockchain transaction.`);
      
      return {
        transactionHash: mockTxHash,
        success: true
      };

      // TODO: Implement real PYUSD transfer when contract is available on Sepolia
      // The real implementation would look like this:
      /*
      const PYUSD_CONTRACT_ADDRESS = '0x6c3ea9036406852006290770bedfcaba0e23a0e5';
      const PYUSD_ABI = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function balanceOf(address account) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ];
      
      const pyusdContract = new ethers.Contract(PYUSD_CONTRACT_ADDRESS, PYUSD_ABI, this.platformWallet);
      const balance = await pyusdContract.balanceOf(this.platformWallet.address);
      const decimals = await pyusdContract.decimals();
      const balanceFormatted = ethers.formatUnits(balance, decimals);
      
      if (parseFloat(balanceFormatted) < amount) {
        throw new Error(`Insufficient PYUSD balance. Available: ${balanceFormatted} PYUSD, Required: ${amount} PYUSD`);
      }

      const amountWei = ethers.parseUnits(amount.toString(), decimals);
      const gasEstimate = await pyusdContract.transfer.estimateGas(recipientAddress, amountWei);
      const feeData = await this.provider.getFeeData();
      
      const tx = await pyusdContract.transfer(recipientAddress, amountWei, {
        gasLimit: gasEstimate * 120n / 100n,
        gasPrice: feeData.gasPrice
      });

      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        return {
          transactionHash: receipt.transactionHash,
          success: true
        };
      } else {
        throw new Error('Transaction failed');
      }
      */

    } catch (error: any) {
      console.error('❌ PYUSD transfer error:', error);
      throw new Error(`PYUSD transfer failed: ${error.message}`);
    }
  }
}

export default new WalletService();
