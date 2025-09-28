import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Play, Eye, Search, Filter } from 'lucide-react';
import ProductCard from '@/components/common/ProductCard';
import { useWallet } from '@/contexts/WalletContext';
import { simplePurchaseAPI } from '@/services/api';

const Library = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [purchasedContent, setPurchasedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, user } = useWallet();

  // Fetch user's purchased content
  const fetchPurchasedContent = async () => {
    if (!isConnected || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await simplePurchaseAPI.getUserPurchases();
      
      if (response.data.success) {
        // Transform the data to match the expected format
        const transformedContent = response.data.data.map((purchase: any) => ({
          id: purchase.content._id,
          title: purchase.content.title,
          creator: purchase.content.creator?.username || 'Unknown Creator',
          price: purchase.amount,
          image: purchase.content.thumbnailUrl || '',
          type: purchase.content.type,
          purchasedDate: purchase.createdAt,
          downloaded: false, // We can add download tracking later
          fileUrl: purchase.content.fileUrl,
          description: purchase.content.description,
          status: purchase.status
        }));
        
        setPurchasedContent(transformedContent);
      } else {
        setError('Failed to fetch purchased content');
      }
    } catch (err: any) {
      console.error('Error fetching purchased content:', err);
      setError(err.response?.data?.message || 'Failed to fetch purchased content');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or wallet connects
  useEffect(() => {
    fetchPurchasedContent();
  }, [isConnected, user]);

  const typeFilters = [
    { id: 'all', label: 'All Content', count: purchasedContent.length },
    { id: 'music', label: 'Music', count: purchasedContent.filter((p: any) => p.type === 'music').length },
    { id: 'course', label: 'Courses', count: purchasedContent.filter((p: any) => p.type === 'course').length },
    { id: 'ebook', label: 'eBooks', count: purchasedContent.filter((p: any) => p.type === 'ebook').length },
    { id: 'video', label: 'Videos', count: purchasedContent.filter((p: any) => p.type === 'video').length },
  ];

  const filteredContent = purchasedContent.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalSpent = purchasedContent.reduce((sum: number, item: any) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-background pt-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">My Library</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Access all your purchased content in one place
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-card rounded-xl p-8 shadow-[var(--shadow-card)] border border-border">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Total Items</h3>
            <p className="text-3xl font-bold text-primary">{purchasedContent.length}</p>
          </div>
          <div className="bg-card rounded-xl p-8 shadow-[var(--shadow-card)] border border-border">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Total Spent</h3>
            <p className="text-3xl font-bold text-primary">{totalSpent.toFixed(2)} PYUSD</p>
          </div>
          <div className="bg-card rounded-xl p-8 shadow-[var(--shadow-card)] border border-border">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Downloads Ready</h3>
            <p className="text-3xl font-bold text-secondary">
              {purchasedContent.filter(p => !p.downloaded).length}
            </p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-8 shadow-[var(--shadow-card)] border border-border mb-8"
        >
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-primary w-full pl-12 pr-4 text-lg"
            />
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedType(filter.id)}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  selectedType === filter.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-muted-foreground">
            Showing {filteredContent.length} items
            {selectedType !== 'all' && ` in ${typeFilters.find(f => f.id === selectedType)?.label}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-card rounded-2xl p-6 shadow-[var(--shadow-card)] border border-border">
                <div className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl p-8 text-center shadow-[var(--shadow-card)] border border-border mb-12"
          >
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-lg font-medium">Failed to load your library</p>
              <p className="text-muted-foreground">{error}</p>
              <button
                onClick={fetchPurchasedContent}
                className="btn-primary mt-4"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredContent.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl p-8 text-center shadow-[var(--shadow-card)] border border-border mb-12"
          >
            <div className="text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-lg font-medium">No purchased content yet</p>
              <p className="text-muted-foreground">
                {searchQuery || selectedType !== 'all' 
                  ? 'No content matches your current filters' 
                  : 'Start exploring the marketplace to build your library!'
                }
              </p>
              {(!searchQuery && selectedType === 'all') && (
                <button
                  onClick={() => window.location.href = '/marketplace'}
                  className="btn-primary mt-4"
                >
                  Browse Marketplace
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Content Grid */}
        {!loading && !error && filteredContent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
          >
            {filteredContent.map((item: any, index: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="relative"
            >
              <ProductCard 
                {...item} 
                purchased={true}
                onClick={() => console.log('Open content:', item.id)}
              />
              
              {/* Download/Access Actions */}
              <div className="absolute top-3 right-3 z-10">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors"
                  onClick={() => console.log('Download/Access:', item.id)}
                >
                  {item.type === 'music' || item.type === 'video' ? (
                    <Play size={16} />
                  ) : item.type === 'course' ? (
                    <Eye size={16} />
                  ) : (
                    <Download size={16} />
                  )}
                </motion.button>
              </div>

              {/* Purchase Date */}
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-muted-foreground">
                  Purchased {new Date(item.purchasedDate).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Library;