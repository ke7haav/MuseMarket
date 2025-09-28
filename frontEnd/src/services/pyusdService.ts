import { ethers } from 'ethers';

// PYUSD Sepolia contract address
const PYUSD_CONTRACT_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';

// ERC20 ABI for PYUSD (minimal required functions)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// Platform wallet address will be fetched from backend
let PLATFORM_WALLET = '';

class PyusdService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contract: ethers.Contract | null = null;

  // Initialize with MetaMask provider
  async initialize() {
    if (typeof window.ethereum !== 'undefined') {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.contract = new ethers.Contract(PYUSD_CONTRACT_ADDRESS, ERC20_ABI, this.signer);
      
      // Fetch platform wallet address from backend
      if (!PLATFORM_WALLET) {
        await this.fetchPlatformWallet();
      }
    } else {
      throw new Error('MetaMask is not installed');
    }
  }

  // Fetch platform wallet address from backend
  async fetchPlatformWallet() {
    try {
      const response = await fetch('http://localhost:5000/api/v1/platform/wallet-info');
      const data = await response.json();
      
      if (data.success && data.data.address) {
        PLATFORM_WALLET = data.data.address;
        console.log('✅ Platform wallet address fetched:', PLATFORM_WALLET);
      } else {
        throw new Error('Failed to fetch platform wallet address');
      }
    } catch (error) {
      console.error('Error fetching platform wallet:', error);
      throw new Error('Failed to fetch platform wallet address');
    }
  }

  // Get PYUSD balance
  async getBalance(address: string): Promise<number> {
    if (!this.contract) {
      await this.initialize();
    }

    const balance = await this.contract!.balanceOf(address);
    const decimals = await this.contract!.decimals();
    return parseFloat(ethers.formatUnits(balance, decimals));
  }

  // Transfer PYUSD to platform wallet
  async transferToPlatform(amount: number): Promise<string> {
    if (!this.contract || !this.signer) {
      await this.initialize();
    }

    const decimals = await this.contract!.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    console.log('💰 Initiating PYUSD transfer:', {
      to: PLATFORM_WALLET,
      amount: amount,
      amountWei: amountWei.toString()
    });

    // Request MetaMask to sign and send transaction
    const tx = await this.contract!.transfer(PLATFORM_WALLET, amountWei);
    
    console.log('📝 Transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log('✅ Transaction confirmed:', {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });

    return receipt.hash;
  }

  // Check if user has enough PYUSD balance
  async hasEnoughBalance(address: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getBalance(address);
    return balance >= requiredAmount;
  }

  // Get contract info
  async getContractInfo() {
    if (!this.contract) {
      await this.initialize();
    }

    const [name, symbol, decimals] = await Promise.all([
      this.contract!.name(),
      this.contract!.symbol(),
      this.contract!.decimals()
    ]);

    return { name, symbol, decimals };
  }
}

export default new PyusdService();
