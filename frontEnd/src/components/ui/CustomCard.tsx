import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'product' | 'feature';
  children: React.ReactNode;
}

const Card = ({ className, variant = 'default', children, ...props }: CardProps) => {
  const variants = {
    default: 'bg-card rounded-2xl shadow-[var(--shadow-card)] border border-border',
    product: 'card-product',
    feature: 'card-feature',
  };

  return (
    <div
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;