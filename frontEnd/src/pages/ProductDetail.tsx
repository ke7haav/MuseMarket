import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Download, Heart, Share2, Eye, Clock, Shield, Globe } from 'lucide-react';
import Card from '@/components/ui/CustomCard';

const ProductDetail = () => {
  const { id } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Mock product data
  const product = {
    id: id || '1',
    title: 'React Advanced Patterns & Best Practices',
    creator: 'Dev Academy',
    creatorAvatar: '',
    price: 89.99,
    originalPrice: 129.99,
    description: `Master advanced React patterns and best practices in this comprehensive course. Learn hooks, context, performance optimization, testing strategies, and modern development workflows.

This course includes:
• 8+ hours of video content
• 50+ practical exercises
• Source code and resources
• Certificate of completion
• Lifetime access`,
    type: 'course',
    duration: '8h 32m',
    size: '2.4 GB',
    students: 1247,
    rating: 4.9,
    reviews: 189,
    likes: 1205,
    createdAt: '2024-01-15',
    lastUpdated: '2024-01-20',
    tags: ['React', 'JavaScript', 'Frontend', 'Web Development'],
    features: [
      'Lifetime access',
      'Mobile and desktop',
      'Certificate of completion',
      'Direct creator support'
    ],
    requirements: [
      'Basic React knowledge',
      'JavaScript ES6+ familiarity',
      'Node.js installed'
    ],
    filecoinCid: 'bafybeihkoviema7g3gxyt6la7b7kbfd2bqgea',
  };

  const relatedProducts = [
    {
      id: '2',
      title: 'TypeScript Fundamentals',
      creator: 'Code Masters',
      price: 49.99,
      type: 'course',
    },
    {
      id: '3',
      title: 'Next.js Production Guide',
      creator: 'Full Stack Pro',
      price: 69.99,
      type: 'course',
    },
    {
      id: '4',
      title: 'React Testing Strategies',
      creator: 'Test Guru',
      price: 39.99,
      type: 'course',
    },
  ];

  const handlePurchase = () => {
    setShowWalletModal(true);
  };

  return (
    <div className="min-h-screen bg-background pt-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Product Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-8 mb-12"
        >
          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <Play className="w-16 h-16 text-primary mb-4 mx-auto" />
                <p className="text-lg font-medium">Course Preview</p>
              </div>
              {/* Preview overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors">
                  <Play className="w-8 h-8 text-primary" />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.title}</h1>
              <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                <span>by {product.creator}</span>
                <span>•</span>
                <span>{product.students} students</span>
                <span>•</span>
                <span>⭐ {product.rating} ({product.reviews} reviews)</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-primary">{product.price} PYUSD</span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {product.originalPrice} PYUSD
                  </span>
                )}
                <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm font-medium">
                  31% OFF
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Purchase Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {product.price} PYUSD
                </div>
                <p className="text-muted-foreground">One-time purchase</p>
              </div>

              <button 
                onClick={handlePurchase}
                className="btn-primary w-full mb-4"
              >
                Buy Now
              </button>

              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => setIsLiked(!isLiked)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isLiked ? 'bg-red-50 text-red-500' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{product.likes + (isLiked ? 1 : 0)}</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

              {/* Course Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{product.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">File Size</span>
                  <span className="font-medium">{product.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Students</span>
                  <span className="font-medium">{product.students.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">{new Date(product.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold mb-3">What's Included</h4>
                <div className="space-y-2">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-secondary" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Web3 Info */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Stored on Filecoin</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Content CID: {product.filecoinCid}
                </p>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Indexed by The Graph</span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid lg:grid-cols-3 gap-8 mb-12"
        >
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">About This Course</h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Requirements</h3>
              <div className="space-y-2">
                {product.requirements.map((req, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">{req}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Related Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Related Content</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((related) => (
              <Card key={related.id} className="p-4 cursor-pointer">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-3 flex items-center justify-center">
                  <Play className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{related.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">by {related.creator}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{related.price} PYUSD</span>
                  <span className="text-xs text-muted-foreground capitalize">{related.type}</span>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Wallet Connect Modal */}
        {showWalletModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold mb-6">Connect Wallet</h3>
              <div className="space-y-4">
                <button className="w-full p-4 border border-border rounded-xl hover:bg-muted transition-colors text-left">
                  <div className="font-semibold">MetaMask</div>
                  <div className="text-sm text-muted-foreground">Connect using MetaMask wallet</div>
                </button>
                <button className="w-full p-4 border border-border rounded-xl hover:bg-muted transition-colors text-left">
                  <div className="font-semibold">WalletConnect</div>
                  <div className="text-sm text-muted-foreground">Scan QR code with your wallet</div>
                </button>
              </div>
              <div className="flex space-x-4 mt-6">
                <button 
                  onClick={() => setShowWalletModal(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button className="btn-primary flex-1">
                  Connect
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;