import { Product } from '@/types/product';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';

interface ProductSelectorProps {
  products: Product[];
  selectedId: string | null;
  onSelect: (product: Product) => void;
  category?: string;
}

export const ProductSelector = ({ 
  products, 
  selectedId, 
  onSelect,
  category 
}: ProductSelectorProps) => {
  // Group products by sub_category for better organization
  const groupedProducts = products.reduce((acc, product) => {
    const key = product.sub_category || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedProducts).map(([subCategory, items]) => (
        <div key={subCategory}>
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 capitalize">
            {subCategory.replace(/_/g, ' ')}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((product) => (
              <ProductCard
                key={product.sku_id}
                product={product}
                selected={selectedId === product.sku_id}
                onClick={() => onSelect(product)}
                size="md"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
