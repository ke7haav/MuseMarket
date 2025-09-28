import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, SortAsc } from 'lucide-react';
import ContentCard from '@/components/common/ContentCard';
import { contentAPI, simplePurchaseAPI } from '@/services/api';
import { useWallet } from '@/contexts/WalletContext';
import lighthouseService from '@/services/lighthouse';
import vaultService from '@/services/vaultService';

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    pages: 0
  });
  const { isConnected, user } = useWallet();

  // Fetch content from backend
  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        type: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        sortBy: sortBy
      };

      const response = await contentAPI.getContent(params);
      
      if (response.data.success) {
        setProducts(response.data.data);
        setPagination(response.data.pagination || pagination);
      } else {
        setError('Failed to fetch content');
      }
    } catch (err: any) {
      console.error('Error fetching content:', err);
      setError(err.response?.data?.message || 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  // Fetch content when component mounts or filters change
  useEffect(() => {
    fetchContent();
  }, [selectedCategory, sortBy, searchQuery, pagination.page]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        fetchContent();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle purchase using simple credit system
  const handlePurchase = async (contentId: string, price: number) => {
    if (!isConnected || !user) {
      alert('Please connect your wallet to purchase content');
      return;
    }

    try {
      // Check credit balance first
      const creditResponse = await simplePurchaseAPI.getCreditBalance();
      const creditBalance = creditResponse.data.data.creditBalance;
      
      if (creditBalance < price) {
        alert(`Insufficient credit. You have ${creditBalance} PYUSD credit but need ${price} PYUSD. Please settle your credit or contact support.`);
        return;
      }

      // Confirm purchase
      const confirmed = window.confirm(
        `Purchase this content for ${price} PYUSD credit?\n\n` +
        `Your credit balance: ${creditBalance} PYUSD\n` +
        `After purchase: ${creditBalance - price} PYUSD`
      );

      if (!confirmed) {
        return;
      }

      // Make purchase using simple credit system
      const result = await simplePurchaseAPI.createPurchase({ contentId });
      
      if (result.data.success) {
        console.log('✅ Purchase successful!', result.data);
        alert(`Purchase successful! Content added to your library.\nRemaining credit: ${result.data.data.remainingCredit} PYUSD`);
        // Refresh the content to show updated purchase status
        fetchContent();
      } else {
        alert(`Purchase failed: ${result.data.message}`);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(error.response?.data?.message || 'Purchase failed. Please try again.');
    }
  };

  const categories = [
    { id: 'all', label: 'All', count: 1247 },
    { id: 'music', label: 'Music', count: 456 },
    { id: 'ebook', label: 'eBooks', count: 298 },
    { id: 'video', label: 'Videos', count: 324 },
    { id: 'course', label: 'Courses', count: 169 },
  ];

  const sortOptions = [
    { id: 'popular', label: 'Most Popular' },
    { id: 'newest', label: 'Newest First' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
  ];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  return (
    <div className="min-h-screen bg-background pt-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Marketplace</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Discover and purchase premium content from creators worldwide
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-8 shadow-[var(--shadow-card)] border border-border mb-8"
        >
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search content, creators..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="input-primary w-full pl-12 pr-4 text-lg"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="input-primary text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `Showing ${pagination.total} results`}
            {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.label}`}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`grid gap-6 mb-12 ${
            viewMode === 'grid' 
              ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 max-w-4xl'
          }`}
        >
          {loading ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-muted rounded-2xl h-64 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-full text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-lg font-medium">Failed to load content</p>
                <p className="text-muted-foreground">{error}</p>
                <button
                  onClick={fetchContent}
                  className="btn-primary mt-4"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : products.length === 0 ? (
            // Empty state
            <div className="col-span-full text-center py-12">
              <div className="text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.57M15 6.334c2.33 0 4.29 1.009 5.824 2.57" />
                </svg>
                <p className="text-lg font-medium">No content found</p>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search terms' : 'Be the first to upload content!'}
                </p>
              </div>
            </div>
          ) : (
            // Products
            products.map((product: any, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <ContentCard 
                  id={product.id}
                  title={product.title}
                  creator={product.creator?.username || 'Unknown'}
                  price={product.price}
                  fileUrl={product.fileUrl}
                  type={product.type}
                  likes={product.likeCount || 0}
                  showBuyButton={true}
                  isEncrypted={product.isEncrypted || true}
                  encryptedFileCid={product.encryptedFileCid}
                  creatorWalletAddress={product.creatorWalletAddress}
                  encryptionSignature={product.encryptionSignature}
                  onBuy={handlePurchase}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Load More */}
        {!loading && products.length > 0 && pagination.page < pagination.pages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center pb-12"
          >
            <button 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="btn-outline"
            >
              Load More Content
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;