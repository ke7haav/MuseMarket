import { ethers } from 'ethers';
import { AppError } from '@/types';

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

class PyusdService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    // Use more reliable Sepolia RPC endpoints
    const rpcUrls = [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://sepolia.gateway.tenderly.co',
      'https://rpc.sepolia.org'
    ];
    this.provider = new ethers.JsonRpcProvider(rpcUrls[0]);
    this.contract = new ethers.Contract(PYUSD_CONTRACT_ADDRESS, ERC20_ABI, this.provider);
  }

  // Get PYUSD balance for a wallet address
  async getBalance(walletAddress: string): Promise<number> {
    try {
      const balance = await this.contract.balanceOf(walletAddress);
      // Convert from wei to PYUSD (6 decimals)
      return parseFloat(ethers.formatUnits(balance, 6));
    } catch (error) {
      console.error('Error getting PYUSD balance:', error);
      throw new AppError('Failed to get PYUSD balance', 500);
    }
  }

  // Get PYUSD contract info
  async getContractInfo(): Promise<{ name: string; symbol: string; decimals: number }> {
    try {
      const [name, symbol, decimals] = await Promise.all([
        this.contract.name(),
        this.contract.symbol(),
        this.contract.decimals()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('Error getting PYUSD contract info:', error);
      throw new AppError('Failed to get PYUSD contract info', 500);
    }
  }

  // Validate transaction hash and get transaction details
  async validateTransaction(transactionHash: string, expectedFrom: string, expectedTo: string, expectedAmount: number): Promise<boolean> {
    try {
      const tx = await this.provider.getTransaction(transactionHash);
      if (!tx) {
        throw new AppError('Transaction not found', 404);
      }

      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      if (!receipt || receipt.status !== 1) {
        throw new AppError('Transaction failed', 400);
      }

      // Parse logs to find Transfer event
      const transferLog = receipt.logs.find(log => {
        try {
          const parsedLog = this.contract.interface.parseLog(log);
          return parsedLog?.name === 'Transfer';
        } catch {
          return false;
        }
      });

      if (!transferLog) {
        throw new AppError('No transfer found in transaction', 400);
      }

      const parsedLog = this.contract.interface.parseLog(transferLog);
      const from = parsedLog?.args[0];
      const to = parsedLog?.args[1];
      const amount = parsedLog?.args[2];

      // Convert amount to PYUSD (6 decimals)
      const amountInPyusd = parseFloat(ethers.formatUnits(amount, 6));

      // Validate transaction details
      if (from.toLowerCase() !== expectedFrom.toLowerCase()) {
        throw new AppError('Invalid sender address', 400);
      }

      if (to.toLowerCase() !== expectedTo.toLowerCase()) {
        throw new AppError('Invalid recipient address', 400);
      }

      if (Math.abs(amountInPyusd - expectedAmount) > 0.000001) { // Allow small floating point differences
        throw new AppError('Invalid transfer amount', 400);
      }

      return true;
    } catch (error) {
      console.error('Error validating transaction:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to validate transaction', 500);
    }
  }

  // Create a transaction for PYUSD transfer (for frontend to sign)
  async createTransferTransaction(from: string, to: string, amount: number): Promise<{
    to: string;
    data: string;
    value: string;
  }> {
    try {
      // Convert amount to wei (6 decimals)
      const amountInWei = ethers.parseUnits(amount.toString(), 6);
      
      // Create transfer transaction data
      const transferData = this.contract.interface.encodeFunctionData('transfer', [to, amountInWei]);

      return {
        to: PYUSD_CONTRACT_ADDRESS,
        data: transferData,
        value: '0x0' // No ETH value for ERC20 transfer
      };
    } catch (error) {
      console.error('Error creating transfer transaction:', error);
      throw new AppError('Failed to create transfer transaction', 500);
    }
  }

  // Get transaction history for a wallet (recent transactions)
  async getTransactionHistory(walletAddress: string, limit: number = 10): Promise<Array<{
    hash: string;
    from: string;
    to: string;
    amount: number;
    timestamp: number;
    blockNumber: number;
  }>> {
    try {
      // Get recent blocks and filter for PYUSD transfers
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10000 blocks

      const filter = this.contract.filters.Transfer(walletAddress, null);
      const logs = await this.contract.queryFilter(filter, fromBlock, currentBlock);

      const transactions = await Promise.all(
        logs.slice(-limit).map(async (log) => {
          const parsedLog = this.contract.interface.parseLog(log);
          const block = await this.provider.getBlock(log.blockNumber);
          
          return {
            hash: log.transactionHash,
            from: parsedLog?.args[0] || '',
            to: parsedLog?.args[1] || '',
            amount: parseFloat(ethers.formatUnits(parsedLog?.args[2] || 0, 6)),
            timestamp: block?.timestamp || 0,
            blockNumber: log.blockNumber
          };
        })
      );

      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw new AppError('Failed to get transaction history', 500);
    }
  }
}

export default new PyusdService();
