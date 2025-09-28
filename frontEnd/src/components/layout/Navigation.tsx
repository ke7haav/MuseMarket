import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, Moon, Sun, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { MobileWalletConnect } from '@/components/MobileWalletConnect';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const { 
    account, 
    isConnected, 
    isConnecting, 
    isInitializing,
    user, 
    connectWallet, 
    disconnectWallet, 
    error 
  } = useWallet();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Browse', path: '/marketplace' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Library', path: '/library' },
    { label: 'My Vault', path: '/vault' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Check if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <>
      {error && (
        <div className="bg-red-500 text-white text-center py-2 px-4 text-sm">
          {error}
        </div>
      )}
      
      {/* Show mobile wallet connect component when there's an error on mobile */}
      {error && isMobile && !isConnected && (
        <div className="p-4 bg-background">
          <MobileWalletConnect 
            onConnect={connectWallet}
            isConnecting={isConnecting}
            error={error}
          />
        </div>
      )}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[hsl(var(--primary-dark))] to-[hsl(var(--primary))] flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-gradient">MuseMarket</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <User size={16} />
                  <span className="text-sm font-medium">
                    {user?.username || `${account?.slice(0, 6)}...${account?.slice(-4)}`}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-muted-foreground border-b border-border">
                        {account}
                      </div>
                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={14} />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        to="/library"
                        className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={14} />
                        <span>My Library</span>
                      </Link>
                      <button
                        onClick={() => {
                          disconnectWallet();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left text-red-500"
                      >
                        <LogOut size={14} />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting || isInitializing}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet size={16} />
                <span>
                  {isInitializing ? 'Loading...' : isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  onClick={toggleTheme}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  <span className="text-sm">Theme</span>
                </button>
                
                {isConnected ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {user?.username || `${account?.slice(0, 6)}...${account?.slice(-4)}`}
                    </span>
                    <button
                      onClick={() => {
                        disconnectWallet();
                        setIsOpen(false);
                      }}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      connectWallet();
                      setIsOpen(false);
                    }}
                    disabled={isConnecting || isInitializing}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wallet size={16} />
                    <span>
                      {isInitializing ? 'Loading...' : isConnecting ? 'Connecting...' : 'Connect'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
};

export default Navigation;

