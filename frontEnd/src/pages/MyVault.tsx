import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  History, 
  QrCode, 
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  DollarSign,
  RefreshCw,
  Copy,
  CreditCard
} from 'lucide-react';
import simpleCreditService, { SimpleCreditData, SimplePurchase } from '@/services/simpleCreditService';
import pyusdService from '@/services/pyusdService';
import { useWallet } from '@/contexts/WalletContext';

const MyVault: React.FC = () => {
  const { account: walletAddress } = useWallet();
  const [creditData, setCreditData] = useState<SimpleCreditData | null>(null);
  const [transactions, setTransactions] = useState<SimplePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'deposit' | 'credit'>('overview');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const fetchVaultData = async () => {
    try {
      setLoading(true);
      const [creditData, transactionData] = await Promise.all([
        simpleCreditService.getCreditBalance(),
        simpleCreditService.getUserPurchases({ page: 1, limit: 10 })
      ]);
      
      setCreditData(creditData.data);
      setTransactions(transactionData.data);
    } catch (error) {
      console.error('Error fetching vault data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    try {
      setRefreshing(true);
      const creditData = await simpleCreditService.getCreditBalance();
      setCreditData(creditData.data);
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const generateQRCode = async (walletAddress: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(walletAddress, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleSettleCredit = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (!creditData) {
      alert('No credit data available');
      return;
    }

    const amountToSettle = 100 - creditData.creditBalance;
    if (amountToSettle <= 0) {
      alert('No credit to settle');
      return;
    }

    try {
      // Initialize PYUSD service
      await pyusdService.initialize();

      // Check if user has enough PYUSD balance
      const hasEnoughBalance = await pyusdService.hasEnoughBalance(walletAddress, amountToSettle);
      if (!hasEnoughBalance) {
        const balance = await pyusdService.getBalance(walletAddress);
        alert(`Insufficient PYUSD balance. You have ${balance.toFixed(2)} PYUSD but need ${amountToSettle} PYUSD.`);
        return;
      }

      // Confirm settlement
      const confirmed = window.confirm(
        `Settle ${amountToSettle} PYUSD credit?\n\n` +
        `This will trigger a MetaMask transaction to send ${amountToSettle} PYUSD to the platform wallet.\n\n` +
        `Your current PYUSD balance will be checked and the transaction will be processed.`
      );

      if (!confirmed) return;

      // Show loading state
      const settleButton = document.querySelector('[data-settle-button]') as HTMLButtonElement;
      if (settleButton) {
        settleButton.disabled = true;
        settleButton.textContent = 'Processing...';
      }

      // Transfer PYUSD to platform wallet
      console.log('🚀 Initiating PYUSD transfer...');
      const transactionHash = await pyusdService.transferToPlatform(amountToSettle);
      
      console.log('✅ PYUSD transfer completed:', transactionHash);

      // Settle credit with the transaction hash
      const result = await simpleCreditService.settleCredit(transactionHash);
      
      if (result.success) {
        alert(`Credit settled successfully!\n\nTransaction: ${transactionHash}\nAmount: ${amountToSettle} PYUSD`);
        await fetchVaultData();
      } else {
        alert(`Failed to settle credit: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error settling credit:', error);
      
      if (error.code === 4001) {
        alert('Transaction was rejected by user');
      } else if (error.message?.includes('insufficient funds')) {
        alert('Insufficient PYUSD balance for this transaction');
      } else {
        alert(`Failed to settle credit: ${error.message || 'Please try again.'}`);
      }
    } finally {
      // Reset button state
      const settleButton = document.querySelector('[data-settle-button]') as HTMLButtonElement;
      if (settleButton) {
        settleButton.disabled = false;
        settleButton.textContent = 'Settle Credit';
      }
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      generateQRCode(walletAddress);
    }
  }, [walletAddress]);

  const formatAmount = (amount: number) => {
    return amount.toFixed(6);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading credit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Vault</h1>
          <p className="text-xl text-muted-foreground">
            Manage your PYUSD credit and transaction history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-feature"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Credit Balance
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {creditData ? creditData.creditBalance : 0} PYUSD
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-feature"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Credit Used
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {creditData ? (100 - creditData.creditBalance) : 0} PYUSD
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-feature"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Credit Limit
                </p>
                <p className="text-2xl font-bold text-foreground">
                  100 PYUSD
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-feature"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Purchases
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {transactions.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-muted rounded-xl p-2 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 px-6 py-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'transactions'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 px-6 py-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'deposit'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`flex-1 px-6 py-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'credit'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Credit
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Credit Balance Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Credit Balance Card */}
              <div className="card-feature">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Credit Balance</h3>
                  <button
                    onClick={refreshBalance}
                    disabled={refreshing}
                    className="btn-outline flex items-center space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-5xl font-bold text-primary mb-2">
                    {creditData ? creditData.creditBalance : 0}
                  </p>
                  <p className="text-xl text-muted-foreground mb-4">PYUSD Credit</p>
                  <p className="text-sm text-muted-foreground">
                    Wallet: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
                  </p>
                </div>
              </div>

              {/* Credit Usage Card */}
              <div className="card-feature">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Credit Usage</h3>
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                
                <div className="text-center">
                  <p className="text-5xl font-bold text-orange-500 mb-2">
                    {creditData ? (100 - creditData.creditBalance) : 0}
                  </p>
                  <p className="text-xl text-muted-foreground mb-4">PYUSD Used</p>
                  <p className="text-sm text-muted-foreground">
                    {creditData ? `${100 - creditData.creditBalance} used of 100` : '0 used of 100'}
                  </p>
                </div>
              </div>
            </div>

            {/* Credit System Info */}
            <div className="card-feature">
              <h3 className="text-xl font-bold mb-4">Credit System</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="font-semibold">100 PYUSD</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credit Used</p>
                  <p className="font-semibold">{creditData ? (100 - creditData.creditBalance) : 0} PYUSD</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Credit</p>
                  <p className="font-semibold">{creditData ? creditData.creditBalance : 0} PYUSD</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">System</p>
                  <p className="font-semibold">Simple Credit</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {transactions.length === 0 ? (
              <div className="card-feature text-center py-12">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Purchases Yet</h3>
                <p className="text-muted-foreground">
                  Your purchase history will appear here once you start buying content.
                </p>
              </div>
            ) : (
              transactions.map((purchase, index) => (
                <motion.div
                  key={purchase._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-feature"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Purchase: {purchase.content.title}</p>
                        <p className="text-sm text-muted-foreground">Type: {purchase.content.type}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(purchase.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        -{purchase.amount} PYUSD
                      </p>
                      <p className="text-xs text-muted-foreground">Status: {purchase.status}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'deposit' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card-feature">
              <h3 className="text-2xl font-bold mb-6">Deposit PYUSD</h3>
              
              <div className="text-center mb-8">
                <div className="w-64 h-64 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 p-4">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Wallet QR Code" className="w-full h-full" />
                  ) : (
                    <QrCode className="w-32 h-32 text-muted-foreground" />
                  )}
                </div>
                <p className="text-muted-foreground mb-4">
                  Scan QR code or copy address to send PYUSD
                </p>
                {walletAddress && (
                  <div className="flex items-center justify-center space-x-2">
                    <code className="bg-muted px-3 py-2 rounded text-sm font-mono">
                      {walletAddress}
                    </code>
                    <button
                      onClick={() => copyToClipboard(walletAddress)}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                  How to Deposit:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>Send PYUSD to your wallet address above</li>
                  <li>Use Sepolia testnet for testing</li>
                  <li>Wait for transaction confirmation</li>
                  <li>Your balance will update automatically</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'credit' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Credit Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-feature">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Credit Limit</h3>
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  100 PYUSD
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum credit available
                </p>
              </div>

              <div className="card-feature">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Credit Used</h3>
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {creditData ? (100 - creditData.creditBalance) : 0} PYUSD
                </div>
                <p className="text-sm text-muted-foreground">
                  Currently used credit
                </p>
              </div>

              <div className="card-feature">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Available Credit</h3>
                  <TrendingDown className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {creditData ? creditData.creditBalance : 0} PYUSD
                </div>
                <p className="text-sm text-muted-foreground">
                  Credit available for use
                </p>
              </div>
            </div>

            {/* Settle Credit */}
            {creditData && creditData.creditBalance < 100 && (
              <div className="card-feature border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    Credit Used
                  </h3>
                  <DollarSign className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-4">
                  {100 - creditData.creditBalance} PYUSD
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  You have used {100 - creditData.creditBalance} PYUSD in credit
                </p>
                <button
                  onClick={handleSettleCredit}
                  data-settle-button
                  className="btn-primary w-full"
                >
                  Settle Credit
                </button>
              </div>
            )}

            {/* Credit Management */}
            <div className="card-feature">
              <h3 className="text-2xl font-bold mb-6">Credit System</h3>
              
              <div className="space-y-6">
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold mb-4">
                    How Credit Works:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>Start with 100 PYUSD credit limit</li>
                    <li>Make purchases using credit (no immediate payment)</li>
                    <li>Credit is deducted from your available balance</li>
                    <li>Settle your credit by sending PYUSD to content creators</li>
                    <li>Credit resets to 100 PYUSD after settlement</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyVault;