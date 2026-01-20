import { Outfit } from '@/types/product';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';

interface OutfitDisplayProps {
  outfit: Outfit;
  index: number;
}

const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString('en-IN')}`;
};

const getScoreClass = (score: number): string => {
  if (score >= 0.85) return 'score-excellent';
  if (score >= 0.7) return 'score-good';
  return 'score-average';
};

const getScoreLabel = (score: number): string => {
  if (score >= 0.85) return 'Excellent Match';
  if (score >= 0.7) return 'Great Match';
  return 'Good Match';
};

export const OutfitDisplay = ({ outfit, index }: OutfitDisplayProps) => {
  const allItems = [outfit.top, outfit.bottom, outfit.footwear, ...outfit.accessories];

  return (
    <div 
      className="bg-card rounded-xl p-6 shadow-sm animate-slide-up border border-border"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Look {index + 1}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {outfit.reasoning}
          </p>
        </div>
        <div className="text-right">
          <span className={cn("score-badge", getScoreClass(outfit.match_score))}>
            {Math.round(outfit.match_score * 100)}% {getScoreLabel(outfit.match_score)}
          </span>
          <p className="text-lg font-semibold text-foreground mt-2">
            {formatPrice(outfit.total_price)}
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Top */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top</span>
          <ProductCard product={outfit.top} size="sm" />
        </div>

        {/* Bottom */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bottom</span>
          <ProductCard product={outfit.bottom} size="sm" />
        </div>

        {/* Footwear */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Footwear</span>
          <ProductCard product={outfit.footwear} size="sm" />
        </div>

        {/* Accessories */}
        {outfit.accessories.map((accessory, accIndex) => (
          <div key={accessory.sku_id} className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Accessory {outfit.accessories.length > 1 ? accIndex + 1 : ''}
            </span>
            <ProductCard product={accessory} size="sm" />
          </div>
        ))}
      </div>

      {/* Score Breakdown */}
      <div className="mt-6 pt-5 border-t border-border">
        <h4 className="text-sm font-medium text-foreground mb-2">Style Analysis</h4>
        <span className="text-sm font-medium text-foreground">
          {(outfit.score_breakdown.style_match).toFixed(2)}
        </span>
      </div>
    </div>
  );
};
