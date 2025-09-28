import { motion } from 'framer-motion';
import { Heart, ShoppingCart, ExternalLink, Video, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui/CustomCard';
import MediaPlayer from '@/components/MediaPlayer';

interface ContentCardProps {
  id: string;
  title: string;
  creator: string;
  price: number;
  fileUrl: string;
  type: 'music' | 'ebook' | 'video' | 'course';
  likes?: number;
  purchased?: boolean;
  showBuyButton?: boolean;
  isEncrypted?: boolean;
  encryptedFileCid?: string;
  creatorWalletAddress?: string;
  encryptionSignature?: string;
  onBuy?: (contentId: string, price: number) => void;
  className?: string;
}

const ContentCard = ({ 
  id,
  title, 
  creator, 
  price, 
  fileUrl,
  type, 
  likes = 0, 
  purchased = false,
  showBuyButton = false,
  isEncrypted = true,
  encryptedFileCid,
  creatorWalletAddress,
  encryptionSignature,
  onBuy,
  className = ''
}: ContentCardProps) => {
  const handleBuy = () => {
    if (onBuy) {
      onBuy(id, price);
    }
  };

  return (
    <Card className={`group overflow-hidden ${className}`}>
      <div className="relative">
        {/* Show actual media player only if purchased or not encrypted */}
        {(purchased || !isEncrypted) && (type === 'video' || type === 'music') ? (
          <MediaPlayer
            fileUrl={fileUrl}
            type={type}
            title={title}
            className="w-full h-48"
            isEncrypted={isEncrypted}
            encryptedFileCid={encryptedFileCid}
            creatorWalletAddress={creatorWalletAddress}
            encryptionSignature={encryptionSignature}
          />
        ) : (
          /* Show preview for encrypted content or static content */
          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center relative">
            {/* Lock overlay for encrypted content */}
            {isEncrypted && !purchased && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm font-medium">Encrypted Content</p>
                  <p className="text-xs opacity-75">Purchase to unlock</p>
                </div>
              </div>
            )}
            
            {/* Content type icons */}
            <div className="text-center">
              {type === 'video' ? (
                <div className="text-center">
                  <Video className="w-12 h-12 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Video Content</p>
                </div>
              ) : type === 'music' ? (
                <div className="text-center">
                  <Music className="w-12 h-12 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Audio Content</p>
                </div>
              ) : type === 'ebook' ? (
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-sm text-muted-foreground">PDF Document</p>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-sm text-muted-foreground">Course Material</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overlay for non-media content or purchased content */}
        {(type === 'ebook' || type === 'course') && (purchased || !isEncrypted) && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(fileUrl, '_blank')}
              className="flex items-center space-x-2"
            >
              <ExternalLink size={16} />
              <span>Open</span>
            </Button>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-foreground text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            by {creator}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-lg text-primary">{price}</span>
            <span className="text-sm text-muted-foreground">PYUSD</span>
          </div>
          
          {likes > 0 && (
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Heart size={14} />
              <span>{likes}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          {purchased ? (
            <div className="flex items-center justify-center space-x-2 text-sm text-secondary bg-secondary/10 py-2 px-4 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Owned</span>
            </div>
          ) : showBuyButton ? (
            <Button
              onClick={handleBuy}
              className="w-full flex items-center justify-center space-x-2"
              size="sm"
            >
              <ShoppingCart size={16} />
              <span>Buy Now</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => window.open(fileUrl, '_blank')}
              className="w-full flex items-center justify-center space-x-2"
              size="sm"
            >
              <ExternalLink size={16} />
              <span>View</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ContentCard;
