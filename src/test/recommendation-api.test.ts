import { describe, it, expect, beforeAll } from "vitest";
import { generateOutfitRecommendations, getBaseProductOptions } from "@/lib/recommendation-engine";
import type { RecommendationRequest, RecommendationResponse } from "@/types/product";

describe("Recommendation API Interface", () => {
  let baseProducts: any[];
  let validProductId: string;

  beforeAll(() => {
    baseProducts = getBaseProductOptions();
    validProductId = baseProducts[0]?.sku_id || "TOP_001";
  });

  describe("API Interface Clarity", () => {
    it("should export clear function interfaces", () => {
      expect(typeof generateOutfitRecommendations).toBe("function");
      expect(typeof getBaseProductOptions).toBe("function");
    });

    it("should have well-defined TypeScript interfaces", () => {
      const request: RecommendationRequest = {
        base_product_id: validProductId,
        num_outfits: 3
      };
      
      const response = generateOutfitRecommendations(request);
      
      // Verify response structure
      expect(response).toHaveProperty("outfits");
      expect(response).toHaveProperty("base_product");
      expect(response).toHaveProperty("processing_time_ms");
      expect(response).toHaveProperty("cache_hit");
      expect(Array.isArray(response.outfits)).toBe(true);
    });
  });

  describe("Performance Requirements", () => {
    it("should consistently meet < 1 second response time", () => {
      const request: RecommendationRequest = {
        base_product_id: validProductId,
        num_outfits: 3
      };

      const response = generateOutfitRecommendations(request);
      
      expect(response.processing_time_ms).toBeLessThan(1000);
      expect(typeof response.processing_time_ms).toBe("number");
    });

    it("should meet performance target across multiple requests", () => {
      const requests = [
        { base_product_id: validProductId, num_outfits: 1 },
        { base_product_id: validProductId, num_outfits: 3 },
        { base_product_id: validProductId, num_outfits: 5 }
      ];

      requests.forEach((request) => {
        const response = generateOutfitRecommendations(request);
        expect(response.processing_time_ms).toBeLessThan(1000);
      });
    });

    it("should include performance monitoring in response", () => {
      const request: RecommendationRequest = {
        base_product_id: validProductId,
        num_outfits: 3
      };

      const response = generateOutfitRecommendations(request);
      
      expect(response.processing_time_ms).toBeGreaterThan(0);
      expect(typeof response.processing_time_ms).toBe("number");
    });
  });

  describe("API Functionality", () => {
    it("should generate recommendations for valid input", () => {
      const request: RecommendationRequest = {
        base_product_id: validProductId,
        num_outfits: 3
      };

      const response = generateOutfitRecommendations(request);
      
      expect(response.outfits.length).toBeGreaterThan(0);
      expect(response.outfits.length).toBeLessThanOrEqual(3);
      
      // Verify outfit structure
      response.outfits.forEach(outfit => {
        expect(outfit).toHaveProperty("id");
        expect(outfit).toHaveProperty("top");
        expect(outfit).toHaveProperty("bottom");
        expect(outfit).toHaveProperty("footwear");
        expect(outfit).toHaveProperty("accessories");
        expect(outfit).toHaveProperty("match_score");
        expect(outfit).toHaveProperty("score_breakdown");
        expect(outfit).toHaveProperty("reasoning");
        expect(outfit).toHaveProperty("total_price");
      });
    });

    it("should handle optional parameters", () => {
      const requestWithOptions: RecommendationRequest = {
        base_product_id: validProductId,
        preferred_style: "casual",
        season: "summer",
        num_outfits: 2
      };

      const response = generateOutfitRecommendations(requestWithOptions);
      
      expect(response.outfits.length).toBeGreaterThan(0);
      expect(response.outfits.length).toBeLessThanOrEqual(2);
    });

    it("should handle invalid product ID gracefully", () => {
      const invalidRequest: RecommendationRequest = {
        base_product_id: "INVALID_ID_12345",
        num_outfits: 3
      };

      const response = generateOutfitRecommendations(invalidRequest);
      
      expect(response.outfits).toEqual([]);
      expect(response.processing_time_ms).toBeGreaterThan(0);
      expect(response.cache_hit).toBe(false);
    });
  });

  describe("Data Consistency", () => {
    it("should return consistent data types", () => {
      const request: RecommendationRequest = {
        base_product_id: validProductId,
        num_outfits: 3
      };

      const response = generateOutfitRecommendations(request);
      
      expect(Array.isArray(response.outfits)).toBe(true);
      expect(typeof response.processing_time_ms).toBe("number");
      expect(typeof response.cache_hit).toBe("boolean");
      
      if (response.outfits.length > 0) {
        const outfit = response.outfits[0];
        expect(typeof outfit.match_score).toBe("number");
        expect(typeof outfit.total_price).toBe("number");
        expect(typeof outfit.reasoning).toBe("string");
        expect(Array.isArray(outfit.accessories)).toBe(true);
      }
    });

    it("should return scores in valid range (0-1)", () => {
      const request: RecommendationRequest = {
        base_product_id: validProductId,
        num_outfits: 3
      };

      const response = generateOutfitRecommendations(request);
      
      response.outfits.forEach(outfit => {
        expect(outfit.match_score).toBeGreaterThanOrEqual(0);
        expect(outfit.match_score).toBeLessThanOrEqual(1);
        
        const breakdown = outfit.score_breakdown;
        expect(breakdown.color_harmony).toBeGreaterThanOrEqual(0);
        expect(breakdown.color_harmony).toBeLessThanOrEqual(1);
        expect(breakdown.style_match).toBeGreaterThanOrEqual(0);
        expect(breakdown.style_match).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("Base Products API", () => {
    it("should return available products", () => {
      const products = getBaseProductOptions();
      
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      
      products.forEach(product => {
        expect(product).toHaveProperty("sku_id");
        expect(product).toHaveProperty("title");
        expect(product).toHaveProperty("lowest_price");
        expect(product.lowest_price).toBeGreaterThan(0);
      });
    });
  });
});