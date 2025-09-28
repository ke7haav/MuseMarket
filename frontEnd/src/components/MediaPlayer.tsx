import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import lighthouseService from '../services/lighthouse';
import { useWallet } from '../contexts/WalletContext';

interface MediaPlayerProps {
  fileUrl: string;
  type: 'video' | 'music' | 'ebook' | 'course';
  title: string;
  className?: string;
  isEncrypted?: boolean;
  encryptedFileCid?: string;
  creatorWalletAddress?: string;
  encryptionSignature?: string;
}

const MediaPlayer = ({ 
  fileUrl, 
  type, 
  title, 
  className = '', 
  isEncrypted = false, 
  encryptedFileCid, 
  creatorWalletAddress,
  encryptionSignature 
}: MediaPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useWallet();

  // Check if current user is the creator of this content
  const isOwner = user?.walletAddress?.toLowerCase() === creatorWalletAddress?.toLowerCase();

  // Manual decryption function - only called when user clicks "View Video"
  const handleDecryptVideo = async () => {
    if (!isEncrypted || !encryptedFileCid || !isOwner || !user?.walletAddress) {
      return;
    }

    try {
      setIsDecrypting(true);
      setError(null);
      
      console.log('🔓 Starting decryption process...', {
        encryptedFileCid,
        userWallet: user.walletAddress,
        isOwner
      });
      
      // Get authentication message
      console.log('🔐 Getting authentication message...');
      const authMessage = await lighthouseService.getSignedMessage(user.walletAddress);
      console.log('✅ Auth message received:', authMessage);
      
      // Sign the message with MetaMask
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }
      
      // Check if MetaMask is connected and has the correct account
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log('🔗 MetaMask accounts:', accounts);
      
      if (accounts.length === 0) {
        throw new Error('No MetaMask accounts found. Please connect your wallet.');
      }
      
      const currentAccount = accounts[0].toLowerCase();
      const expectedAccount = user.walletAddress.toLowerCase();
      
      if (currentAccount !== expectedAccount) {
        throw new Error(`Account mismatch. Expected: ${expectedAccount}, Got: ${currentAccount}`);
      }
      
      console.log('✍️ Requesting signature from MetaMask...');
      console.log('📝 Message to sign:', authMessage);
      console.log('👤 Wallet address:', user.walletAddress);
      
      // Add timeout for MetaMask signing
      const signingPromise = window.ethereum.request({
        method: 'personal_sign',
        params: [authMessage, user.walletAddress],
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MetaMask signing timeout after 30 seconds')), 30000)
      );
      
      const signedMessage = await Promise.race([signingPromise, timeoutPromise]);
      console.log('✅ Message signed:', signedMessage.substring(0, 20) + '...');

      // Test if we can access the file directly first
      console.log('🔍 Testing file access...');
      try {
        const fileInfo = await lighthouseService.getFileInfo(encryptedFileCid);
        console.log('📁 File info:', fileInfo);
      } catch (fileError) {
        console.log('❌ File info error:', fileError);
      }

      // Decrypt the file
      console.log('🔓 Decrypting file...');
      console.log('📊 Decryption params:', {
        cid: encryptedFileCid,
        publicKey: user.walletAddress,
        signature: signedMessage.substring(0, 20) + '...'
      });
      
      try {
        const decryptedFileUrl = await lighthouseService.decryptFile(
          encryptedFileCid,
          user.walletAddress,
          signedMessage
        );
        console.log('✅ File decrypted successfully!');
        setDecryptedUrl(decryptedFileUrl);
      } catch (decryptError) {
        console.log('❌ Lighthouse decryptFile failed:', decryptError);
        
        // Check if it's an address mismatch error
        if (decryptError.message && decryptError.message.includes('===')) {
          console.log('🔍 Address mismatch detected. This video was encrypted with a different wallet.');
          console.log('🔍 Error message:', decryptError.message);
          
          // Extract the actual wallet addresses from the error message
          const match = decryptError.message.match(/(0x[a-fA-F0-9]{40}) === (0x[a-fA-F0-9]{40})/);
          if (match) {
            const [_, currentWallet, encryptedWallet] = match;
            console.log('🔍 Current wallet:', currentWallet);
            console.log('🔍 Encrypted with wallet:', encryptedWallet);
            setError(`This video was encrypted with wallet ${encryptedWallet.substring(0, 10)}... but you're using ${currentWallet.substring(0, 10)}...`);
          } else {
            setError('This video was encrypted with a different wallet address. Only the original uploader can decrypt it.');
          }
          return;
        }
        
        // Fallback: Try using the encrypted file URL directly
        console.log('🔄 Trying fallback approach...');
        const fallbackUrl = `https://gateway.lighthouse.storage/ipfs/${encryptedFileCid}`;
        console.log('🔗 Fallback URL:', fallbackUrl);
        
        // Test if the fallback URL works
        try {
          const response = await fetch(fallbackUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log('✅ Fallback URL accessible');
            setDecryptedUrl(fallbackUrl);
          } else {
            throw new Error(`Fallback URL not accessible: ${response.status}`);
          }
        } catch (fallbackError) {
          console.log('❌ Fallback also failed:', fallbackError);
          throw decryptError; // Throw the original error
        }
      }
    } catch (err: any) {
      console.error('❌ Failed to decrypt file:', err);
      setError(err.message || 'Failed to decrypt file');
    } finally {
      setIsDecrypting(false);
    }
  };

  // Use decrypted URL if available, otherwise use original fileUrl
  const actualFileUrl = decryptedUrl || fileUrl;

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  if (type === 'video') {
    // Show loading state while decrypting
    if (isEncrypted && isDecrypting) {
      return (
        <div className={`relative bg-black rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Decrypting video...</p>
            <p className="text-xs text-gray-400 mt-2">Check console for details</p>
          </div>
        </div>
      );
    }

    // Show error state if decryption failed
    if (isEncrypted && error) {
      const isAddressMismatch = error.includes('different wallet address');
      
      return (
        <div className={`relative bg-black rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
          <div className="text-center text-white">
            <svg className="w-12 h-12 mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-red-400 mb-2">
              {isAddressMismatch ? 'Wallet Mismatch' : 'Failed to decrypt video'}
            </p>
            <p className="text-xs text-gray-400 mb-4 max-w-xs">
              {isAddressMismatch 
                ? 'This video was encrypted with a different wallet. Only the original uploader can decrypt it.'
                : error
              }
            </p>
            {!isAddressMismatch && (
              <button 
                onClick={handleDecryptVideo} 
                className="px-4 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    // Show "View Video" button for encrypted content that user owns (not yet decrypted)
    if (isEncrypted && isOwner && !decryptedUrl && !error) {
      return (
        <div className={`relative bg-black rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
          <div className="text-center text-white">
            <svg className="w-12 h-12 mx-auto mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-300 mb-2">Encrypted Video</p>
            <p className="text-xs text-gray-400 mb-4">Click to decrypt and view</p>
            <button 
              onClick={handleDecryptVideo}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              View Video
            </button>
          </div>
        </div>
      );
    }

    // Show lock for encrypted content that user doesn't own
    if (isEncrypted && !isOwner) {
      return (
        <div className={`relative bg-black rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
          <div className="text-center text-white">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm font-medium">Encrypted Video</p>
            <p className="text-xs opacity-75">Purchase to unlock</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        >
          <source src={actualFileUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Custom Controls Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              className="bg-white/90 hover:bg-white rounded-full p-4 transition-colors"
            >
              <Play size={32} className="text-black ml-1" />
            </motion.button>
          </div>
        )}

        {/* Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePlayPause}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleMute}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </motion.button>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleOpenInNewTab}
                className="text-white hover:text-gray-300 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'music') {
    // Show loading state while decrypting
    if (isEncrypted && isDecrypting) {
      return (
        <div className={`relative bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-6 flex items-center justify-center ${className}`}>
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Decrypting audio...</p>
          </div>
        </div>
      );
    }

    // Show error state if decryption failed
    if (isEncrypted && error) {
      return (
        <div className={`relative bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-6 flex items-center justify-center ${className}`}>
          <div className="text-center">
            <p className="text-sm text-red-400 mb-2">Failed to decrypt audio</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      );
    }

    // Show lock for encrypted content that user doesn't own
    if (isEncrypted && !isOwner) {
      return (
        <div className={`relative bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-6 flex items-center justify-center ${className}`}>
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm font-medium text-foreground">Encrypted Audio</p>
            <p className="text-xs text-muted-foreground">Purchase to unlock</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePlayPause}
            className="bg-primary text-primary-foreground rounded-full p-3 hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </motion.button>
          
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">Audio File</p>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMute}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleOpenInNewTab}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </motion.button>
          </div>
        </div>

        <audio
          className="hidden"
          controls
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        >
          <source src={actualFileUrl} type="audio/mpeg" />
          <source src={actualFileUrl} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  if (type === 'ebook') {
    return (
      <div className={`relative bg-muted rounded-lg p-6 text-center ${className}`}>
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        
        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">PDF Document</p>
        
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open(fileUrl, '_blank')}
            className="btn-primary flex items-center space-x-2"
          >
            <ExternalLink size={16} />
            <span>Open PDF</span>
          </motion.button>
        </div>
      </div>
    );
  }

  // Course type
  return (
    <div className={`relative bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-6 ${className}`}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        
        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">Course Material</p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.open(fileUrl, '_blank')}
          className="btn-primary flex items-center space-x-2 mx-auto"
        >
          <ExternalLink size={16} />
          <span>Open Course</span>
        </motion.button>
      </div>
    </div>
  );
};

export default MediaPlayer;
