import { Product } from '@/types/product';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  selected?: boolean;
  showPrice?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const formatPrice = (price: number): string => {
  if (price === 0) return 'Sold Out';
  return `₹${price.toLocaleString('en-IN')}`;
};

export const ProductCard = ({ 
  product, 
  onClick, 
  selected = false,
  showPrice = true,
  size = 'md'
}: ProductCardProps) => {
  const sizeClasses = {
    sm: 'w-32',
    md: 'w-44',
    lg: 'w-56',
  };

  const imageSizeClasses = {
    sm: 'h-32',
    md: 'h-44',
    lg: 'h-56',
  };

  return (
    <div 
      className={cn(
        "product-card cursor-pointer group",
        sizeClasses[size],
        selected && "ring-2 ring-accent shadow-lg"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "relative bg-muted overflow-hidden",
        imageSizeClasses[size]
      )}>
        <img 
          src={product.featured_image} 
          alt={product.title}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-accent-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-body text-sm font-medium text-foreground line-clamp-2 leading-tight">
          {product.title}
        </h3>
        {showPrice && (
          <p className={cn(
            "mt-1 text-sm font-semibold",
            product.lowest_price === 0 ? "text-muted-foreground" : "text-foreground"
          )}>
            {formatPrice(product.lowest_price)}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground capitalize">
          {product.brand_name}
        </p>
      </div>
    </div>
  );
};
