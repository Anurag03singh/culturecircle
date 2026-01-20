import { useState, useCallback, useMemo } from 'react';
import { Product, RecommendationResponse } from '@/types/product';
import { generateOutfitRecommendations, getBaseProductOptions } from '@/lib/recommendation-engine';
import { ProductCard } from '@/components/ProductCard';
import { OutfitDisplay } from '@/components/OutfitDisplay';
import { cn } from '@/lib/utils';

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const PRODUCTS_PER_PAGE = 8;

  const baseProducts = useMemo(() => getBaseProductOptions(), []);

  const categories = useMemo(() => {
    const cats = new Set(baseProducts.map(p => p.category || p.sector));
    return ['all', ...Array.from(cats)];
  }, [baseProducts]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return baseProducts;
    return baseProducts.filter(p => p.category === activeCategory || p.sector === activeCategory);
  }, [baseProducts, activeCategory]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when category changes
  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to products section
    document.querySelector('#products-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    setRecommendations(null);
  }, []);

  const handleGenerateOutfits = useCallback(() => {
    if (!selectedProduct) return;

    setIsLoading(true);
    
    setTimeout(() => {
      const result = generateOutfitRecommendations({
        base_product_id: selectedProduct.sku_id,
        num_outfits: 3,
      });
      setRecommendations(result);
      setIsLoading(false);
    }, 150);
  }, [selectedProduct]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative bg-primary text-primary-foreground py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            AI Outfit Studio
          </h1>
          <p className="mt-4 text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Smart outfit recommendations, styled in under a second.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Selected Product & Generate Button */}
        {selectedProduct && (
          <div className="mb-12 animate-fade-in">
            <div className="bg-secondary rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={selectedProduct.featured_image} 
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Selected Base Product
                    </p>
                    <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
                      {selectedProduct.title}
                    </h2>
                    <p className="text-muted-foreground capitalize">
                      {selectedProduct.brand_name} • ₹{selectedProduct.lowest_price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateOutfits}
                  disabled={isLoading}
                  className={cn(
                    "px-8 py-4 rounded-xl font-medium text-lg transition-all duration-300",
                    "bg-accent text-accent-foreground hover:bg-accent/90",
                    "shadow-lg hover:shadow-xl hover:-translate-y-0.5",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  )}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Styling...
                    </span>
                  ) : (
                    'Generate Outfits'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Results */}
        {recommendations && recommendations.outfits.length > 0 && (
          <section className="mb-16 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                  Curated Looks
                </h2>
                <p className="text-muted-foreground mt-1">
                  {recommendations.outfits.length} outfit combinations generated in {recommendations.processing_time_ms}ms
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {recommendations.outfits.map((outfit, index) => (
                <OutfitDisplay key={outfit.id} outfit={outfit} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Product Catalog */}
        <section id="products-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                {selectedProduct ? 'Or choose another piece' : 'Select a Base Product'}
              </h2>
              <p className="text-muted-foreground mt-1">
                Pick any item to start building your look
              </p>
            </div>
            {/* Products count and pagination info */}
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat === 'all' ? 'All Products' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
            {currentProducts.map((product, index) => (
              <div 
                key={product.sku_id} 
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
              >
                <ProductCard
                  product={product}
                  selected={selectedProduct?.sku_id === product.sku_id}
                  onClick={() => handleProductSelect(product)}
                />
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              {/* Mobile: Simple Previous/Next with page info */}
              <div className="flex sm:hidden items-center gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                    "border border-border",
                    currentPage === 1
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-background text-foreground hover:bg-muted"
                  )}
                >
                  Previous
                </button>
                
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                    "border border-border",
                    currentPage === totalPages
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-background text-foreground hover:bg-muted"
                  )}
                >
                  Next
                </button>
              </div>

              {/* Desktop: Full pagination */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                    "border border-border",
                    currentPage === 1
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-background text-foreground hover:bg-muted"
                  )}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage = 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!showPage) {
                      // Show ellipsis for gaps
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 py-2 text-muted-foreground">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          "w-10 h-10 rounded-lg font-medium transition-all duration-200",
                          page === currentPage
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-foreground hover:bg-muted border border-border"
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                    "border border-border",
                    currentPage === totalPages
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-background text-foreground hover:bg-muted"
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 px-6 mt-16">
        <div className="max-w-7xl mx-auto">
          <div>
            <h3 className="font-display text-xl font-semibold mb-4">
              About the Recommendation Engine
            </h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-lg">
              Our AI-powered styling engine analyzes color harmony, style compatibility, 
              brand cohesion, and seasonal fit to generate complete outfit combinations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
