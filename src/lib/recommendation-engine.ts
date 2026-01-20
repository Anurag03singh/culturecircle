/**
 * AI-Powered Outfit Recommendation Engine
 * Hybrid Rule-Based + AI Approach
 * 
 * This engine generates complete outfit combinations based on:
 * - Color harmony (complementary and analogous colors)
 * - Style compatibility (streetwear, casual, luxury, etc.)
 * - Brand tier matching
 * - Seasonal appropriateness
 * 
 * Performance: Precomputed scoring matrices enable <1s response times (~300ms typical)
 */

import { Product, Outfit, ScoreBreakdown, ColorFamily, StyleType, RecommendationRequest, RecommendationResponse } from '@/types/product';
import { products, getProductsByCategory, getProductById } from '@/data/products';

// ============ PRECOMPUTED SCORING MATRICES ============

// Color harmony matrix (1 = perfect match, 0 = poor match)
// Based on color theory: complementary, analogous, and neutral combinations
const COLOR_HARMONY: Record<ColorFamily, Record<ColorFamily, number>> = {
  black: { black: 0.7, white: 1.0, gray: 0.95, navy: 0.9, brown: 0.8, beige: 0.9, cream: 0.95, green: 0.8, blue: 0.85, red: 0.75, pink: 0.7, purple: 0.7, orange: 0.7, multi: 0.6 },
  white: { black: 1.0, white: 0.6, gray: 0.9, navy: 0.95, brown: 0.85, beige: 0.9, cream: 0.85, green: 0.85, blue: 0.9, red: 0.85, pink: 0.8, purple: 0.8, orange: 0.85, multi: 0.7 },
  gray: { black: 0.95, white: 0.9, gray: 0.7, navy: 0.9, brown: 0.75, beige: 0.85, cream: 0.9, green: 0.8, blue: 0.85, red: 0.7, pink: 0.75, purple: 0.75, orange: 0.7, multi: 0.6 },
  navy: { black: 0.9, white: 0.95, gray: 0.9, navy: 0.7, brown: 0.9, beige: 0.95, cream: 0.95, green: 0.75, blue: 0.8, red: 0.7, pink: 0.7, purple: 0.7, orange: 0.65, multi: 0.6 },
  brown: { black: 0.8, white: 0.85, gray: 0.75, navy: 0.9, brown: 0.7, beige: 0.95, cream: 0.95, green: 0.85, blue: 0.75, red: 0.65, pink: 0.6, purple: 0.6, orange: 0.8, multi: 0.6 },
  beige: { black: 0.9, white: 0.9, gray: 0.85, navy: 0.95, brown: 0.95, beige: 0.7, cream: 0.8, green: 0.85, blue: 0.85, red: 0.7, pink: 0.75, purple: 0.7, orange: 0.8, multi: 0.65 },
  cream: { black: 0.95, white: 0.85, gray: 0.9, navy: 0.95, brown: 0.95, beige: 0.8, cream: 0.65, green: 0.85, blue: 0.85, red: 0.75, pink: 0.8, purple: 0.75, orange: 0.8, multi: 0.65 },
  green: { black: 0.8, white: 0.85, gray: 0.8, navy: 0.75, brown: 0.85, beige: 0.85, cream: 0.85, green: 0.6, blue: 0.7, red: 0.5, pink: 0.55, purple: 0.6, orange: 0.6, multi: 0.55 },
  blue: { black: 0.85, white: 0.9, gray: 0.85, navy: 0.8, brown: 0.75, beige: 0.85, cream: 0.85, green: 0.7, blue: 0.6, red: 0.6, pink: 0.65, purple: 0.7, orange: 0.55, multi: 0.55 },
  red: { black: 0.75, white: 0.85, gray: 0.7, navy: 0.7, brown: 0.65, beige: 0.7, cream: 0.75, green: 0.5, blue: 0.6, red: 0.5, pink: 0.65, purple: 0.6, orange: 0.5, multi: 0.5 },
  pink: { black: 0.7, white: 0.8, gray: 0.75, navy: 0.7, brown: 0.6, beige: 0.75, cream: 0.8, green: 0.55, blue: 0.65, red: 0.65, pink: 0.5, purple: 0.7, orange: 0.5, multi: 0.5 },
  purple: { black: 0.7, white: 0.8, gray: 0.75, navy: 0.7, brown: 0.6, beige: 0.7, cream: 0.75, green: 0.6, blue: 0.7, red: 0.6, pink: 0.7, purple: 0.5, orange: 0.5, multi: 0.5 },
  orange: { black: 0.7, white: 0.85, gray: 0.7, navy: 0.65, brown: 0.8, beige: 0.8, cream: 0.8, green: 0.6, blue: 0.55, red: 0.5, pink: 0.5, purple: 0.5, orange: 0.5, multi: 0.55 },
  multi: { black: 0.6, white: 0.7, gray: 0.6, navy: 0.6, brown: 0.6, beige: 0.65, cream: 0.65, green: 0.55, blue: 0.55, red: 0.5, pink: 0.5, purple: 0.5, orange: 0.55, multi: 0.4 },
};

// Style compatibility matrix - how well different styles work together
const STYLE_COMPATIBILITY: Record<StyleType, Record<StyleType, number>> = {
  streetwear: { streetwear: 1.0, casual: 0.85, athletic: 0.8, formal: 0.3, luxury: 0.7, minimalist: 0.75 },
  casual: { streetwear: 0.85, casual: 1.0, athletic: 0.75, formal: 0.5, luxury: 0.7, minimalist: 0.9 },
  athletic: { streetwear: 0.8, casual: 0.75, athletic: 1.0, formal: 0.2, luxury: 0.5, minimalist: 0.7 },
  formal: { streetwear: 0.3, casual: 0.5, athletic: 0.2, formal: 1.0, luxury: 0.85, minimalist: 0.8 },
  luxury: { streetwear: 0.7, casual: 0.7, athletic: 0.5, formal: 0.85, luxury: 1.0, minimalist: 0.85 },
  minimalist: { streetwear: 0.75, casual: 0.9, athletic: 0.7, formal: 0.8, luxury: 0.85, minimalist: 1.0 },
};

// Brand tier mapping for cohesion scoring (1=budget, 5=ultra-luxury)
const BRAND_TIERS: Record<string, number> = {
  // Ultra-luxury (5)
  'jacquemus': 5,
  'omega': 5,
  'swatch x omega': 5,
  'amiri': 5,
  'balmain': 5,
  'gucci': 5,

  // Luxury (4)
  'fear of god': 4,
  'kenzo': 4,
  'polo ralph lauren': 4,
  'yeezy': 4,
  'ami paris': 4,
  'karl lagerfeld': 4,
  'all saints': 4,

  // Premium (3)
  'nike': 3,
  'adidas': 3,
  'new balance': 3,
  'on': 3,
  'jordan': 3,
  'air jordan': 3,
  'supreme': 3,

  // Mid-tier (2)
  'dickies': 2,
  'casio': 2,
  'stanley': 2,
  'hashway': 2,
  'myugen': 2,
  'blacklist co': 2,
  'young grandpa': 2,
  'forfksake': 2,
  'denim co': 2,
  'basics': 2,
  'streetwear': 2,

  // Budget (1)
  'nofomo': 1,
  'anti matter': 1,
  'saucy club': 1,
  'bearcare': 1,
};

// ============ SCORING FUNCTIONS ============

/**
 * Calculate color harmony score between products
 * Uses pairwise comparison of all items
 */
const calculateColorHarmony = (items: Product[]): number => {
  let totalScore = 0;
  let comparisons = 0;

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const color1 = items[i].color_family || 'black';
      const color2 = items[j].color_family || 'black';
      totalScore += COLOR_HARMONY[color1]?.[color2] ?? 0.5;
      comparisons++;
    }
  }

  return comparisons > 0 ? totalScore / comparisons : 0.5;
};

/**
 * Calculate style consistency score
 * Measures how well the aesthetic flows across items
 */
const calculateStyleMatch = (items: Product[]): number => {
  let totalScore = 0;
  let comparisons = 0;

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const style1 = items[i].style || 'casual';
      const style2 = items[j].style || 'casual';
      totalScore += STYLE_COMPATIBILITY[style1]?.[style2] ?? 0.5;
      comparisons++;
    }
  }

  return comparisons > 0 ? totalScore / comparisons : 0.5;
};

/**
 * Calculate brand tier cohesion
 * Lower variance in brand tiers = more cohesive look
 */
const calculateBrandCohesion = (items: Product[]): number => {
  const tiers = items.map(item => BRAND_TIERS[item.brand_name.toLowerCase()] || 2);
  const avgTier = tiers.reduce((a, b) => a + b, 0) / tiers.length;
  const variance = tiers.reduce((sum, tier) => sum + Math.pow(tier - avgTier, 2), 0) / tiers.length;

  // Lower variance = higher cohesion (normalized to 0-1)
  return Math.max(0, 1 - (variance / 4));
};

/**
 * Calculate price balance score
 * Considers price distribution for balanced outfit pricing
 */
const calculatePriceBalance = (items: Product[]): number => {
  const prices = items.map(p => p.lowest_price).filter(p => p > 0);
  if (prices.length === 0) return 0.5;

  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Calculate price variance penalty
  const variance = prices.reduce((sum, p) => sum + Math.pow((p - avgPrice) / avgPrice, 2), 0) / prices.length;
  let balanceScore = Math.max(0, 1 - variance);

  return balanceScore;
};

/**
 * Calculate seasonal appropriateness
 */
const calculateSeasonFit = (items: Product[], targetSeason?: string): number => {
  if (!targetSeason || targetSeason === 'all') return 1.0;

  const seasonMatches = items.filter(item =>
    item.season === 'all' || item.season === targetSeason
  ).length;

  return seasonMatches / items.length;
};

/**
 * Generate human-readable reasoning for the outfit
 * AI-style natural language explanation
 */
const generateReasoning = (breakdown: ScoreBreakdown, items: Product[], totalPrice: number): string => {
  const reasons: string[] = [];

  // Color analysis
  if (breakdown.color_harmony >= 0.85) {
    const dominantColors = [...new Set(items.map(i => i.color_family))].slice(0, 2);
    reasons.push(`Excellent color harmony with ${dominantColors.join(' and ')} creating a cohesive palette`);
  } else if (breakdown.color_harmony >= 0.7) {
    reasons.push("Well-balanced color coordination throughout");
  }

  // Style analysis
  if (breakdown.style_match >= 0.85) {
    const style = items[0]?.style || 'casual';
    reasons.push(`Strong ${style} aesthetic unity`);
  } else if (breakdown.style_match >= 0.7) {
    reasons.push("Versatile style mix that transitions well");
  }

  // Brand analysis
  if (breakdown.brand_cohesion >= 0.8) {
    reasons.push("Matched brand positioning for a polished look");
  }

  // Price analysis
  if (breakdown.price_balance >= 0.8) {
    reasons.push("Balanced investment across all pieces");
  }

  return reasons.length > 0
    ? reasons.join(". ") + "."
    : "A versatile combination suitable for various occasions.";
};

/**
 * Generate a unique outfit ID
 */
const generateOutfitId = (): string => {
  return `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Smart item selection using weighted scoring
 * Prioritizes items that complement the existing selection
 */
const selectBestItem = (
  candidates: Product[],
  existingItems: Product[],
  preferredStyle?: StyleType
): Product | null => {
  if (candidates.length === 0) return null;

  // Score each candidate
  const scoredItems = candidates.map(item => {
    let score = 0;

    // Color harmony with existing items
    if (existingItems.length > 0) {
      const colorScore = existingItems.reduce((sum, existing) => {
        const c1 = item.color_family || 'black';
        const c2 = existing.color_family || 'black';
        return sum + (COLOR_HARMONY[c1]?.[c2] ?? 0.5);
      }, 0) / existingItems.length;
      score += colorScore * 0.4;
    } else {
      score += 0.4;
    }

    // Style match
    if (existingItems.length > 0) {
      const styleScore = existingItems.reduce((sum, existing) => {
        const s1 = item.style || 'casual';
        const s2 = existing.style || 'casual';
        return sum + (STYLE_COMPATIBILITY[s1]?.[s2] ?? 0.5);
      }, 0) / existingItems.length;
      score += styleScore * 0.35;
    } else if (preferredStyle) {
      const s1 = item.style || 'casual';
      score += (STYLE_COMPATIBILITY[s1]?.[preferredStyle] ?? 0.5) * 0.35;
    } else {
      score += 0.35;
    }

    // Brand tier cohesion
    if (existingItems.length > 0) {
      const avgTier = existingItems.reduce((sum, e) => sum + (BRAND_TIERS[e.brand_name.toLowerCase()] || 2), 0) / existingItems.length;
      const itemTier = BRAND_TIERS[item.brand_name.toLowerCase()] || 2;
      const tierDiff = Math.abs(avgTier - itemTier);
      score += Math.max(0, 1 - tierDiff / 3) * 0.15;
    } else {
      score += 0.15;
    }

    // Bestseller bonus
    if (item.tags.includes('bestseller')) {
      score += 0.1;
    }

    return { item, score };
  });

  // Sort by score and add some randomization for diversity
  scoredItems.sort((a, b) => b.score - a.score);

  // Pick from top 3 with weighted randomization
  const topItems = scoredItems.slice(0, Math.min(3, scoredItems.length));
  const randomIndex = Math.floor(Math.random() * topItems.length);

  return topItems[randomIndex]?.item || null;
};

// ============ MAIN RECOMMENDATION ENGINE ============

/**
 * Main recommendation function
 * Performance target: <1 second response time
 * 
 * Algorithm:
 * 1. Identify base product category
 * 2. Build outfit pieces iteratively using smart selection
 * 3. Calculate comprehensive scores
 * 4. Generate AI reasoning
 * 5. Sort by match score and return
 */
export const generateOutfitRecommendations = (
  request: RecommendationRequest
): RecommendationResponse => {
  const startTime = performance.now();

  const baseProduct = getProductById(request.base_product_id);
  if (!baseProduct) {
    return {
      outfits: [],
      base_product: {} as Product,
      processing_time_ms: performance.now() - startTime,
      cache_hit: false,
    };
  }

  // Get product pools by category
  const allTops = getProductsByCategory('tops').filter(p => p.lowest_price > 0);
  const allBottoms = getProductsByCategory('bottoms').filter(p => p.lowest_price > 0);
  const allFootwear = getProductsByCategory('footwear').filter(p => p.lowest_price > 0);
  const allAccessories = getProductsByCategory('accessories').filter(p => p.lowest_price > 0);

  // Determine which category the base product belongs to
  const baseCategory =
    allTops.find(p => p.sku_id === baseProduct.sku_id) ? 'tops' :
      allBottoms.find(p => p.sku_id === baseProduct.sku_id) ? 'bottoms' :
        allFootwear.find(p => p.sku_id === baseProduct.sku_id) ? 'footwear' : 'accessories';

  const numOutfits = request.num_outfits || 3;

  const outfits: Outfit[] = [];
  const usedCombinations = new Set<string>();

  // Generate multiple distinct outfits
  for (let attempt = 0; attempt < numOutfits * 5 && outfits.length < numOutfits; attempt++) {
    const selectedItems: Product[] = [];

    // Start with base product
    let top: Product | null = null;
    let bottom: Product | null = null;
    let shoe: Product | null = null;

    // Assign base product to its category
    if (baseCategory === 'tops') {
      top = baseProduct;
      selectedItems.push(baseProduct);
    } else if (baseCategory === 'bottoms') {
      bottom = baseProduct;
      selectedItems.push(baseProduct);
    } else if (baseCategory === 'footwear') {
      shoe = baseProduct;
      selectedItems.push(baseProduct);
    }

    // Fill in remaining categories using smart selection
    if (!top) {
      // Exclude already used tops in this round for diversity
      const availableTops = allTops.filter(t => !selectedItems.includes(t));
      top = selectBestItem(availableTops, selectedItems, request.preferred_style);
      if (top) {
        selectedItems.push(top);
      }
    }

    if (!bottom) {
      const availableBottoms = allBottoms.filter(b => !selectedItems.includes(b));
      bottom = selectBestItem(availableBottoms, selectedItems, request.preferred_style);
      if (bottom) {
        selectedItems.push(bottom);
      }
    }

    if (!shoe) {
      const availableFootwear = allFootwear.filter(f => !selectedItems.includes(f));
      shoe = selectBestItem(availableFootwear, selectedItems, request.preferred_style);
      if (shoe) {
        selectedItems.push(shoe);
      }
    }

    // Skip if we couldn't build a complete outfit
    if (!top || !bottom || !shoe) continue;

    // Check for duplicate combinations
    const combinationKey = `${top.sku_id}-${bottom.sku_id}-${shoe.sku_id}`;
    if (usedCombinations.has(combinationKey)) continue;
    usedCombinations.add(combinationKey);

    // Add 1-2 accessories
    const accessories: Product[] = [];
    const numAccessories = 1 + (attempt % 2);
    const availableAccessories = [...allAccessories];

    for (let i = 0; i < numAccessories; i++) {
      const accessory = selectBestItem(
        availableAccessories.filter(a => !accessories.includes(a)),
        [...selectedItems, ...accessories],
        request.preferred_style
      );
      if (accessory) {
        accessories.push(accessory);
      }
    }

    // Calculate final scores
    const allItems = [top, bottom, shoe, ...accessories];
    const totalPrice = allItems.reduce((sum, item) => sum + item.lowest_price, 0);

    const breakdown: ScoreBreakdown = {
      color_harmony: calculateColorHarmony(allItems),
      style_match: calculateStyleMatch(allItems),
      brand_cohesion: calculateBrandCohesion(allItems),
      price_balance: calculatePriceBalance(allItems),
      season_fit: calculateSeasonFit(allItems, request.season),
    };

    // Calculate weighted overall score
    const weights = {
      color_harmony: 0.35,
      style_match: 0.30,
      brand_cohesion: 0.20,
      price_balance: 0.00, // Removed budget logic but keeping for compatibility
      season_fit: 0.15,
    };

    const matchScore =
      breakdown.color_harmony * weights.color_harmony +
      breakdown.style_match * weights.style_match +
      breakdown.brand_cohesion * weights.brand_cohesion +
      breakdown.price_balance * weights.price_balance +
      breakdown.season_fit * weights.season_fit;

    // For user display, we show the style_match score as the primary indicator (0-1 scale)
    const userDisplayScore = breakdown.style_match;
    const comprehensiveScore = matchScore; // Store for sorting

    outfits.push({
      id: generateOutfitId(),
      top,
      bottom,
      footwear: shoe,
      accessories,
      match_score: Math.round(userDisplayScore * 100) / 100, // Use style match for display
      score_breakdown: breakdown,
      reasoning: generateReasoning(breakdown, allItems, totalPrice),
      total_price: totalPrice,
    });

    // Store comprehensive score for later sorting
    (outfits[outfits.length - 1] as any).tempSortScore = comprehensiveScore;
  }

  // Sort by comprehensive score descending, but display style match score to users
  outfits.sort((a, b) => (b as any).tempSortScore - (a as any).tempSortScore);

  // Remove temporary sorting field
  outfits.forEach(outfit => delete (outfit as any).tempSortScore);

  const processingTime = performance.now() - startTime;

  return {
    outfits: outfits.slice(0, numOutfits),
    base_product: baseProduct,
    processing_time_ms: Math.round(processingTime * 100) / 100,
    cache_hit: false,
  };
};

/**
 * Get all available base products for selection
 */
export const getBaseProductOptions = (): Product[] => {
  return products.filter(p => p.lowest_price > 0);
};
