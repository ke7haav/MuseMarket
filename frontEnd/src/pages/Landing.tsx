import { motion } from 'framer-motion';
import { ArrowRight, Music, BookOpen, Video, GraduationCap, Zap, Shield, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-bg.jpg';
import ProductCard from '@/components/common/ProductCard';

const Landing = () => {
  // Mock sample products
  const sampleProducts = [
    {
      id: '1',
      title: 'Midnight Jazz Collection',
      creator: 'Luna Rodriguez',
      price: 15.99,
      image: '',
      type: 'music' as const,
      likes: 234,
    },
    {
      id: '2',
      title: 'React Mastery Course',
      creator: 'Dev Academy',
      price: 89.99,
      image: '',
      type: 'course' as const,
      likes: 1205,
    },
    {
      id: '3',
      title: 'Digital Art Fundamentals',
      creator: 'Sarah Chen',
      price: 24.99,
      image: '',
      type: 'ebook' as const,
      likes: 567,
    },
    {
      id: '4',
      title: 'Travel Photography Series',
      creator: 'Marcus Johnson',
      price: 45.00,
      image: '',
      type: 'video' as const,
      likes: 892,
    },
    {
      id: '5',
      title: 'Ambient Soundscapes',
      creator: 'Echo Studios',
      price: 12.99,
      image: '',
      type: 'music' as const,
      likes: 445,
    },
    {
      id: '6',
      title: 'Web3 Business Guide',
      creator: 'Crypto Insights',
      price: 34.99,
      image: '',
      type: 'ebook' as const,
      likes: 728,
    },
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant PYUSD Payments',
      description: 'Get paid instantly with PayPal\'s stablecoin. No waiting, no volatility.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Filecoin Storage',
      description: 'Your content is securely stored on decentralized Filecoin network.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'The Graph Analytics',
      description: 'Track sales and analytics with decentralized indexing.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-foreground">
              The Future of{' '}
              <span className="text-gradient">Digital Content</span>{' '}
              Monetization
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A decentralized marketplace powered by PYUSD, Filecoin, and The Graph. 
              Where creators earn instantly and buyers own forever.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/marketplace">
                <button className="btn-primary text-lg px-8 py-4">
                  Explore Marketplace
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </Link>
              <Link to="/dashboard">
                <button className="btn-outline text-lg px-8 py-4">
                  Start Selling
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Sponsor Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-8 left-0 right-0"
        >
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-center text-muted-foreground text-sm mb-4 font-medium">Powered by</p>
            <div className="flex items-center justify-center space-x-12 opacity-60">
              <div className="text-foreground font-bold text-lg">PayPal</div>
              <div className="text-foreground font-bold text-lg">Filecoin</div>
              <div className="text-foreground font-bold text-lg">The Graph</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="text-gradient">MuseMarket</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Built on cutting-edge Web3 infrastructure for creators and buyers.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card-feature text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center mx-auto mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Content */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Content</h2>
            <p className="text-xl text-muted-foreground">
              Discover amazing content from talented creators worldwide.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <ProductCard {...product} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link to="/marketplace">
              <button className="btn-primary text-lg px-8 py-4">
                View All Content
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of creators already monetizing their content on MuseMarket.
            </p>
            <Link to="/dashboard">
              <button className="bg-primary text-primary-foreground hover:bg-primary-dark font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-105">
                Get Started Today
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;