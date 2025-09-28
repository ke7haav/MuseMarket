import { motion } from 'framer-motion';
import { Heart, Play, Download, Eye, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/CustomCard';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  id: string;
  title: string;
  creator: string;
  price: number;
  image: string;
  type: 'music' | 'ebook' | 'video' | 'course';
  likes?: number;
  purchased?: boolean;
  onClick?: () => void;
  onBuy?: (id: string, price: number) => void;
  showBuyButton?: boolean;
}

const ProductCard = ({ 
  id,
  title, 
  creator, 
  price, 
  image, 
  type, 
  likes = 0, 
  purchased = false,
  onClick,
  onBuy,
  showBuyButton = false
}: ProductCardProps) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'music': return <Play size={16} className="text-primary" />;
      case 'video': return <Play size={16} className="text-primary" />;
      case 'ebook': return <Download size={16} className="text-primary" />;
      case 'course': return <Eye size={16} className="text-primary" />;
      default: return <Download size={16} className="text-primary" />;
    }
  };

  const getTypeLabel = () => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const cardContent = (
    <Card variant="product" className="overflow-hidden group">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <div className="text-6xl text-primary/30">
            {getTypeIcon()}
          </div>
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="bg-white/90 dark:bg-black/90 rounded-full p-3"
          >
            {purchased ? <Download size={20} /> : <Play size={20} />}
          </motion.div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium flex items-center space-x-1">
          {getTypeIcon()}
          <span>{getTypeLabel()}</span>
        </div>

        {/* Like Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors"
        >
          <Heart size={16} className="text-muted-foreground hover:text-red-500" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">by {creator}</p>
        
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

        {purchased ? (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center space-x-2 text-sm text-secondary">
              <Download size={14} />
              <span>Owned</span>
            </div>
          </div>
        ) : showBuyButton && onBuy ? (
          <div className="mt-3">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBuy(id, price);
              }}
              className="w-full flex items-center justify-center space-x-2"
              size="sm"
            >
              <ShoppingCart size={16} />
              <span>Buy for {price} PYUSD</span>
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );

  if (onClick) {
    return <div onClick={onClick}>{cardContent}</div>;
  }

  return (
    <Link to={`/product/${id}`}>
      {cardContent}
    </Link>
  );
};

export default ProductCard;