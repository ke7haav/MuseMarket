import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

interface WalletContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitializing: boolean;
  user: any | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToSepolia: () => Promise<void>;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

const API_BASE_URL = 'http://localhost:5000/api/v1';

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sepolia testnet configuration
  const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
  const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';

  // Initialize without auto-connecting wallet
  useEffect(() => {
    // Don't auto-connect on page load to prevent wallet popup
    setIsInitializing(false);
  }, []);

  const checkWalletConnection = async () => {
    // Only check for existing connections on desktop (where window.ethereum is available)
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          // Only set the account, don't auto-connect
          setAccount(accounts[0]);
          // Create provider and signer without triggering connection
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await web3Provider.getSigner();
          
          setProvider(web3Provider);
          setSigner(signer);
          setIsConnected(true);
          
          // Check if user exists in backend (pass signer explicitly)
          try {
            await checkOrCreateUser(accounts[0], signer);
          } catch (error) {
            console.error('Error in checkOrCreateUser (auto-connect):', error);
            setError('Failed to connect user account');
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
    // On mobile, we don't auto-connect to prevent issues
  };

  // Detect if we're on mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Check if MetaMask is available (desktop or mobile)
  const isMetaMaskAvailable = () => {
    // Desktop: check for window.ethereum
    if (typeof window.ethereum !== 'undefined') {
      return true;
    }
    
    // Mobile: check for MetaMask deep link capability
    if (isMobile()) {
      return true; // Assume MetaMask mobile app is available
    }
    
    return false;
  };

  const connectWallet = async () => {
    // Check if we're on mobile
    if (isMobile() && typeof window.ethereum === 'undefined') {
      // On mobile, provide better instructions
      setError('Mobile detected: Please open this website in MetaMask mobile browser or use the "Open in MetaMask" button below');
      
      // Show a more helpful message with action buttons
      const shouldOpenInMetaMask = confirm(
        'To connect your wallet on mobile:\n\n' +
        '1. Open MetaMask mobile app\n' +
        '2. Tap the browser icon\n' +
        '3. Navigate to this website\n' +
        '4. Tap "Connect Wallet"\n\n' +
        'Or click OK to try opening in MetaMask browser'
      );
      
      if (shouldOpenInMetaMask) {
        // Try to open in MetaMask browser
        const metamaskUrl = 'https://metamask.app.link/dapp/' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        window.location.href = metamaskUrl;
      }
      return;
    }

    if (!isMetaMaskAvailable()) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      setAccount(account);

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();
      
      setProvider(web3Provider);
      setSigner(signer);

      // Check if we're on Sepolia
      const network = await web3Provider.getNetwork();
      if (Number(network.chainId) !== 11155111) {
        await switchToSepolia();
      }

      setIsConnected(true);
      
      // Store connection state
      localStorage.setItem('walletConnected', 'true');

      // Check if user exists in backend (pass signer explicitly)
      try {
        await checkOrCreateUser(account, signer);
      } catch (error) {
        console.error('Error in checkOrCreateUser:', error);
        setError('Failed to connect user account');
      }

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Test Network',
                rpcUrls: [SEPOLIA_RPC_URL],
                nativeCurrency: {
                  name: 'Sepolia Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  const checkOrCreateUser = async (walletAddress: string, signerInstance?: ethers.JsonRpcSigner) => {
    console.log('🔍 Connecting wallet:', walletAddress);
    
    // First check if backend is running
    try {
      console.log('🔍 Checking backend health at: http://localhost:5000/health');
      const healthResponse = await axios.get('http://localhost:5000/health');
      console.log('✅ Backend health check successful:', healthResponse.data);
    } catch (backendError) {
      console.error('❌ Backend not available:', backendError);
      setError('Backend server is not running. Please start the backend first.');
      return;
    }
    
    // Use the passed signer or the state signer
    const currentSigner = signerInstance || signer;
    
    if (!currentSigner) {
      console.error('❌ No signer available for wallet connection');
      setError('No wallet signer available. Please ensure your wallet is connected.');
      return;
    }

    try {
      // First, try to login without signing (check if user already exists with API key)
      console.log('🔍 Checking if user already exists...');
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, {
          walletAddress
        });

        if (loginResponse.data.success && loginResponse.data.data.user.lighthouseApiKey) {
          console.log('✅ User found with existing API key, no need to sign again');
          setUser(loginResponse.data.data.user);
          localStorage.setItem('authToken', loginResponse.data.data.token);
          return;
        }
      } catch (loginError) {
        console.log('ℹ️ User not found or needs API key, proceeding with full connection...');
      }

      // If login failed or user doesn't have API key, proceed with full connection
      console.log('🔑 Getting auth message from Lighthouse...');
      console.log('🔗 Lighthouse API URL:', `https://api.lighthouse.storage/api/auth/get_message?publicKey=${walletAddress}`);
      
      const authMessageResponse = await axios.get(
        `https://api.lighthouse.storage/api/auth/get_message?publicKey=${walletAddress}`
      );
      const verificationMessage = authMessageResponse.data;
      console.log('📝 Verification message received:', verificationMessage);
      console.log('📝 Message type:', typeof verificationMessage);
      console.log('📝 Message length:', verificationMessage?.length);

      // Ensure the message is a string
      if (typeof verificationMessage !== 'string') {
        throw new Error(`Invalid verification message format. Expected string, got ${typeof verificationMessage}`);
      }

      if (!verificationMessage || verificationMessage.length === 0) {
        throw new Error('Empty verification message received from Lighthouse');
      }

      // Sign the message with user's wallet
      console.log('✍️ Signing message for wallet connection...');
      console.log('🔍 Signer details:', {
        address: await currentSigner.getAddress(),
        provider: currentSigner.provider
      });
      
      // Add timeout to prevent hanging
      const signPromise = currentSigner.signMessage(verificationMessage);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signing timeout - MetaMask may not be responding')), 30000)
      );
      
      const signedMessage = await Promise.race([signPromise, timeoutPromise]) as string;
      console.log('✅ Message signed successfully:', signedMessage.substring(0, 20) + '...');

      // Connect wallet (handles both login and registration)
      console.log('📡 Connecting wallet to backend...');
      const connectResponse = await axios.post(`${API_BASE_URL}/users/connect-wallet`, {
        walletAddress,
        signedMessage
      });

      if (connectResponse.data.success) {
        console.log('✅ Wallet connected successfully:', connectResponse.data.data.user);
        console.log('🔑 Lighthouse API key:', connectResponse.data.data.user.lighthouseApiKey ? 'Available' : 'Not available');
        setUser(connectResponse.data.data.user);
        localStorage.setItem('authToken', connectResponse.data.data.token);
        return;
      } else {
        throw new Error(connectResponse.data.message || 'Failed to connect wallet');
      }
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        stack: error.stack
      });
      setError(`Failed to connect wallet: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      throw new Error('Failed to connect wallet');
    }
  };


  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setUser(null);
    setError(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('walletConnected');
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          // Create new provider and signer for the new account
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await web3Provider.getSigner();
          setProvider(web3Provider);
          setSigner(signer);
          checkOrCreateUser(accounts[0], signer);
        }
      };

      const handleChainChanged = async (chainId: string) => {
        if (chainId !== SEPOLIA_CHAIN_ID) {
          setError('Please switch to Sepolia testnet');
        } else {
          setError(null);
        }
        // Re-initialize provider and signer on chain change
        if (window.ethereum) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await web3Provider.getSigner();
          setProvider(web3Provider);
          setSigner(signer);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  const value: WalletContextType = {
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    isInitializing,
    user,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    error
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
