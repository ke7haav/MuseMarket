import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus, Edit3, Eye, Trash2, DollarSign, Users, TrendingUp, Play, Download } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { contentAPI, analyticsAPI, simplePurchaseAPI } from '@/services/api';
import simpleCreditService from '@/services/simpleCreditService';
import ContentUpload from '@/components/ContentUpload';
import Card from '@/components/ui/CustomCard';
import ProductCard from '@/components/common/ProductCard';
import MediaPlayer from '@/components/MediaPlayer';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [creatorStats, setCreatorStats] = useState({
    totalEarnings: 0,
    totalSales: 0,
    activeListings: 0,
    monthlyGrowth: 0,
  });
  const [userContent, setUserContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState({
    pending: { amount: 0, count: 0 },
    claimed: { amount: 0, count: 0 }
  });
  const [claimLoading, setClaimLoading] = useState(false);
  const { isConnected, user } = useWallet();

  // Fetch user data
  useEffect(() => {
    if (isConnected && user) {
      fetchUserData();
      fetchEarnings();
    }
  }, [isConnected, user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's content
      const contentResponse = await contentAPI.getUserContent();
      if (contentResponse.data.success) {
        setUserContent(contentResponse.data.data);
      }

      // Fetch analytics
      const analyticsResponse = await analyticsAPI.getUserAnalytics();
      if (analyticsResponse.data.success) {
        const analytics = analyticsResponse.data.data;
        setCreatorStats({
          totalEarnings: analytics.totalEarnings || 0,
          totalSales: analytics.totalSales || 0,
          activeListings: analytics.activeListings || 0,
          monthlyGrowth: analytics.monthlyGrowth || 0,
        });
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchUserData(); // Refresh data after successful upload
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      await contentAPI.deleteContent(contentId);
      alert('Content deleted successfully!');
      fetchUserData(); // Refresh the content list
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.response?.data?.message || 'Failed to delete content. Please try again.');
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await simpleCreditService.getCreatorEarnings();
      if (response.success) {
        setEarnings(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const handleClaimEarnings = async () => {
    if (earnings.pending.amount <= 0) {
      alert('No pending earnings to claim');
      return;
    }

    const amount = earnings.pending.amount;
    const confirmed = window.confirm(
      `Claim ${amount} PYUSD earnings?\n\n` +
      `This will mark your pending earnings as claimed and update your total earnings.`
    );

    if (!confirmed) return;

    try {
      setClaimLoading(true);
      const response = await simpleCreditService.claimEarnings(amount);
      
              if (response.success) {
                const txHash = response.data.transactionHash;
                const recipientWallet = response.data.recipientWallet;
                
                alert(
                  `Successfully claimed ${amount} PYUSD earnings!\n\n` +
                  `Transaction Hash: ${txHash}\n` +
                  `Recipient Wallet: ${recipientWallet}\n\n` +
                  `Note: This is a development simulation. In production, you would receive real PYUSD in your wallet.`
                );
                fetchEarnings(); // Refresh earnings data
                fetchUserData(); // Refresh user stats
              } else {
                alert(`Failed to claim earnings: ${response.message}`);
              }
    } catch (error: any) {
      console.error('Claim earnings error:', error);
      alert(error.response?.data?.message || 'Failed to claim earnings. Please try again.');
    } finally {
      setClaimLoading(false);
    }
  };

  const tabs = [
    { id: 'upload', label: 'Upload Content', icon: <Upload className="w-4 h-4" /> },
    { id: 'content', label: 'My Content', icon: <Eye className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background pt-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Creator Dashboard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Manage your content and track your earnings
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Total Earnings</p>
                <p className="text-3xl font-bold text-primary mt-2">{creatorStats.totalEarnings} PYUSD</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Total Sales</p>
                <p className="text-3xl font-bold mt-2">{creatorStats.totalSales}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-secondary to-primary text-white flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Active Listings</p>
                <p className="text-3xl font-bold mt-2">{creatorStats.activeListings}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center">
                <Eye className="w-8 h-8" />
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Monthly Growth</p>
                <p className="text-3xl font-bold text-secondary mt-2">+{creatorStats.monthlyGrowth}%</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-secondary to-primary text-white flex items-center justify-center">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Earnings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Creator Earnings</h3>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Pending Earnings</p>
                  <p className="text-2xl font-bold text-orange-500">{earnings.pending.amount} PYUSD</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Claimed Earnings</p>
                  <p className="text-2xl font-bold text-green-500">{earnings.claimed.amount} PYUSD</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Pending: {earnings.pending.amount} PYUSD</p>
                  <p className="text-sm text-muted-foreground">{earnings.pending.count} earnings waiting to be claimed</p>
                </div>
              </div>
              
              <button
                onClick={handleClaimEarnings}
                disabled={earnings.pending.amount <= 0 || claimLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {claimLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Claiming...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    <span>Claim {earnings.pending.amount} PYUSD</span>
                  </>
                )}
              </button>
            </div>
            
            {earnings.pending.amount > 0 && (
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  💡 <strong>Tip:</strong> You have {earnings.pending.amount} PYUSD in pending earnings. 
                  Click "Claim" to add them to your total earnings balance.
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex space-x-2 bg-muted rounded-xl p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'upload' && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Upload New Content</h2>
              <ContentUpload onUploadSuccess={handleUploadSuccess} />
            </Card>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Content</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {userContent.length} item{userContent.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {loading ? (
                // Loading state
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="animate-pulse">
                        <div className="aspect-square bg-muted"></div>
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-4 bg-muted rounded w-1/4"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card className="p-6 text-center">
                  <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-lg font-medium">Failed to load content</p>
                    <p className="text-muted-foreground">{error}</p>
                    <button
                      onClick={fetchUserData}
                      className="btn-primary mt-4"
                    >
                      Try Again
                    </button>
                  </div>
                </Card>
              ) : userContent.length === 0 ? (
                <Card className="p-6 text-center">
                  <div className="text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.57M15 6.334c2.33 0 4.29 1.009 5.824 2.57" />
                    </svg>
                    <p className="text-lg font-medium">No content uploaded yet</p>
                    <p className="text-muted-foreground">Start by uploading your first piece of content!</p>
                  </div>
                </Card>
              ) : (
                // Content Grid
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {userContent.map((item: any, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="relative"
                    >
                      <Card className="overflow-hidden group">
                        {/* Media Player */}
                        <div className="aspect-square">
                          <MediaPlayer
                            fileUrl={item.fileUrl}
                            type={item.type}
                            title={item.title}
                            className="w-full h-full"
                            isEncrypted={item.isEncrypted}
                            encryptedFileCid={item.encryptedFileCid}
                            creatorWalletAddress={item.creatorWalletAddress}
                            encryptionSignature={item.encryptionSignature}
                          />
                        </div>

                        {/* Content Details */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground line-clamp-2">{item.title}</h3>
                            <div className="flex items-center space-x-1">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                onClick={() => console.log('Edit content:', item.id)}
                              >
                                <Edit3 size={16} />
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="text-red-500 hover:text-red-600 transition-colors p-1"
                                onClick={() => handleDeleteContent(item.id)}
                              >
                                <Trash2 size={16} />
                              </motion.button>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-lg text-primary">{item.price}</span>
                              <span className="text-sm text-muted-foreground">PYUSD</span>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              {item.salesCount || 0} sales • {item.viewCount || 0} views
                            </div>
                          </div>

                          {/* Type Badge */}
                          <div className="mt-3 flex items-center justify-between">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">
                              {item.type}
                            </span>
                            
                            {item.isPublished && (
                              <span className="px-2 py-1 bg-secondary/20 text-secondary rounded-full text-xs font-medium">
                                Published
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}


          {activeTab === 'analytics' && (
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Analytics Overview</h2>
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Detailed analytics with charts and graphs will be available here.
                </p>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;