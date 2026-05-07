import { Product, PriceTier, PriceTiers } from "@shared/types";
import { formatCompactCurrency } from "@shared/utils/currency";

/**
 * Resolves the price for a product based on the specified tier.
 * Falls back through: tier price → retail price → legacy price → 0
 *
 * @param product - The product to resolve price for
 * @param tier - The price tier to use (retail, wholesale, distributor)
 * @returns The resolved price as a number
 */
export function resolveProductPrice(
  product: Product | null | undefined,
  tier: PriceTier = "retail"
): number {
  if (!product) {
    return 0;
  }

  // Check priceTiers first
  if (product.priceTiers) {
    const tierPrice = product.priceTiers[tier];
    if (tierPrice !== undefined && tierPrice > 0) {
      return tierPrice;
    }

    // Fallback to retail if requested tier is not available
    if (tier !== "retail") {
      const retailPrice = product.priceTiers.retail;
      if (retailPrice !== undefined && retailPrice > 0) {
        return retailPrice;
      }
    }
  }

  // Fallback to legacy price field
  if (product.price !== undefined && product.price > 0) {
    return product.price;
  }

  return 0;
}

/**
 * Formats a product price with currency based on the specified tier.
 *
 * @param product - The product to format price for
 * @param tier - The price tier to use
 * @param currency - The currency code (e.g., 'USD', 'ARS')
 * @returns Formatted price string with currency
 */
export function formatProductPrice(
  product: Product | null | undefined,
  tier: PriceTier = "retail",
  currency: string = "USD"
): string {
  const price = resolveProductPrice(product, tier);
  return formatCompactCurrency(price, currency);
}

/**
 * Calculates the margin percentage for a given tier price.
 * Formula: ((tierPrice - costPrice) / tierPrice) * 100
 *
 * @param tierPrice - The selling price for the tier
 * @param costPrice - The product cost price
 * @returns Margin percentage (can be negative if below cost)
 */
export function calculateMargin(tierPrice: number, costPrice: number): number {
  if (!tierPrice || tierPrice <= 0 || !costPrice || costPrice < 0) {
    return 0;
  }

  return ((tierPrice - costPrice) / tierPrice) * 100;
}

/**
 * Gets all available tier prices for a product.
 * Returns only tiers that have valid prices (> 0).
 *
 * @param product - The product to get tier prices for
 * @returns Object with tier names and their prices
 */
export function getAvailableTierPrices(
  product: Product | null | undefined
): Partial<PriceTiers> {
  if (!product?.priceTiers) {
    return {};
  }

  const available: Partial<PriceTiers> = {};

  (Object.keys(product.priceTiers) as PriceTier[]).forEach((tier) => {
    const price = product.priceTiers?.[tier];
    if (price !== undefined && price > 0) {
      available[tier] = price;
    }
  });

  return available;
}

/**
 * Checks if a product has any tier prices configured.
 *
 * @param product - The product to check
 * @returns True if at least one tier price is set
 */
export function hasTierPrices(product: Product | null | undefined): boolean {
  if (!product?.priceTiers) {
    return false;
  }

  return (Object.values(product.priceTiers) as number[]).some(
    (price) => price !== undefined && price > 0
  );
}

/**
 * Gets the default tier name from settings or falls back to defaults.
 *
 * @param tier - The tier key
 * @param config - Optional price tier configuration from settings
 * @returns Display name for the tier
 */
export function getTierDisplayName(
  tier: PriceTier,
  config?: { name?: string; enabled?: boolean }
): string {
  if (config?.name) {
    return config.name;
  }

  const defaultNames: Record<PriceTier, string> = {
    retail: "Minorista",
    wholesale: "Mayorista",
    distributor: "Distribuidor",
  };

  return defaultNames[tier];
}
