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

  const PRODUCTS_PER_PAGE = 10;

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
          <h1 className="ai-title text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            AI Outfit Studio
          </h1>
          <p className="mt-4 text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Build a complete outfit from just one item. Our AI stylist analyzes color harmony, style, season, occasion, and budget to create well-balanced outfit recommendations instantly
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

      {/* Global Brands Section */}
      <section className="bg-background py-12 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              SHOP FROM THE
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Global Brands at the Lowest Prices
            </h2>
          </div>

          {/* Brand Logos */}
          <div className="flex items-center justify-center">
            <img 
              src="/brands/logo.svg.png" 
              alt="Global Fashion Brands" 
              className="max-w-full h-auto grayscale hover:grayscale-0 transition-all duration-300"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 px-6 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - About */}
            <div>
              <h3 className="font-display text-xl font-semibold mb-4">
                About the Recommendation Engine
              </h3>
              <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-lg">
                Our AI-powered styling engine analyzes color harmony, style compatibility,
                brand cohesion, and seasonal fit to generate complete outfit combinations.
              </p>
            </div>

            {/* Right Column - Follow Us & Newsletter */}
            <div className="space-y-8">
              {/* Follow Us Section */}
              <div>
                <h3 className="font-display text-xl font-semibold mb-4">
                  Follow Us
                </h3>
                <div className="flex gap-4">
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full flex items-center justify-center transition-colors duration-200"
                    aria-label="Follow us on Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full flex items-center justify-center transition-colors duration-200"
                    aria-label="Follow us on Twitter"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full flex items-center justify-center transition-colors duration-200"
                    aria-label="Follow us on Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full flex items-center justify-center transition-colors duration-200"
                    aria-label="Follow us on LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Newsletter Section */}
              <div>
                <h3 className="font-display text-xl font-semibold mb-4">
                  Subscribe to Our Newsletter
                </h3>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  Get the latest fashion trends and outfit recommendations delivered to your inbox.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30 focus:border-transparent"
                  />
                  <button className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors duration-200">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
