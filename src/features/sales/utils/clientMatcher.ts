import Fuse, { IFuseOptions } from "fuse.js";

import { Client } from "@shared/types";
import { ClientMatchResult } from "@shared/types/bulkImport";

/**
 * Minimum confidence threshold for fuzzy name matching (0-1)
 * 0.8 = 80% match required
 */
const FUZZY_MATCH_THRESHOLD = 0.2; // Fuse.js uses distance, 0.2 = 80% match

/**
 * Fuse.js options for client name matching
 */
const FUSE_OPTIONS: IFuseOptions<Client> = {
  keys: ["name"],
  threshold: FUZZY_MATCH_THRESHOLD,
  includeScore: true,
  minMatchCharLength: 3,
};

/**
 * Matches a client by phone number (exact match).
 * Phone matching takes priority over name matching.
 *
 * @param phone - Phone number to match
 * @param clients - Array of existing clients
 * @returns Match result with client ID if found
 *
 * @example
 * ```typescript
 * const result = matchClientByPhone("1234567890", clients);
 * if (result.matched) {
 *   console.log("Found client:", result.clientId);
 * }
 * ```
 */
export function matchClientByPhone(phone: string, clients: Client[]): ClientMatchResult {
  if (!phone || phone.trim().length === 0) {
    return { matched: false, isNew: true };
  }

  // Normalize phone: remove all non-digit characters
  const normalizedPhone = phone.replace(/\D/g, "");

  if (normalizedPhone.length < 7) {
    return { matched: false, isNew: true };
  }

  // Look for exact match on normalized phone
  const matchedClient = clients.find((client) => {
    if (!client.phone) return false;
    const clientNormalizedPhone = client.phone.replace(/\D/g, "");

    return clientNormalizedPhone === normalizedPhone;
  });

  if (matchedClient) {
    return {
      matched: true,
      clientId: matchedClient._id,
      isNew: false,
      confidence: 1.0, // Exact match = 100% confidence
    };
  }

  return { matched: false, isNew: true };
}

/**
 * Performs fuzzy matching on client names.
 * Used when phone matching fails or no phone is provided.
 *
 * @param name - Client name to match
 * @param clients - Array of existing clients
 * @returns Match result with confidence score
 *
 * @example
 * ```typescript
 * const result = matchClientByName("Juan Perez", clients);
 * // Will match "Juan Pérez" with high confidence
 * ```
 */
export function matchClientByName(name: string, clients: Client[]): ClientMatchResult {
  if (!name || name.trim().length === 0) {
    return { matched: false, isNew: true };
  }

  const trimmedName = name.trim();

  // Don't match very short names (avoid false positives)
  if (trimmedName.length < 3) {
    return { matched: false, isNew: true };
  }

  // First try exact match (case-insensitive)
  const exactMatch = clients.find(
    (client) => client.name.toLowerCase() === trimmedName.toLowerCase(),
  );

  if (exactMatch) {
    return {
      matched: true,
      clientId: exactMatch._id,
      isNew: false,
      confidence: 1.0,
    };
  }

  // Use Fuse.js for fuzzy matching
  const fuse = new Fuse(clients, FUSE_OPTIONS);
  const results = fuse.search(trimmedName);

  if (results.length > 0) {
    const bestMatch = results[0];
    const score = bestMatch.score ?? 1; // Lower score = better match in Fuse.js

    // Convert Fuse score (0-1, lower is better) to confidence (0-1, higher is better)
    const confidence = 1 - score;

    // Only accept matches above threshold (0.8 confidence = 0.2 Fuse score)
    if (confidence >= 0.8) {
      return {
        matched: true,
        clientId: bestMatch.item._id,
        isNew: false,
        confidence,
      };
    }
  }

  return { matched: false, isNew: true };
}

/**
 * Attempts to match a client by phone first, then by name.
 * This is the main entry point for client matching.
 *
 * @param name - Client name
 * @param phone - Optional client phone
 * @param clients - Array of existing clients
 * @returns Match result
 *
 * @example
 * ```typescript
 * // With phone - tries phone first, then name
 * const result = matchClient("Juan Pérez", "1234567890", clients);
 *
 * // Without phone - only name matching
 * const result = matchClient("Juan Pérez", undefined, clients);
 * ```
 */
export function matchClient(
  name: string,
  phone: string | undefined,
  clients: Client[],
): ClientMatchResult {
  // Try phone matching first if phone is provided
  if (phone && phone.trim().length > 0) {
    const phoneResult = matchClientByPhone(phone, clients);

    if (phoneResult.matched) {
      return phoneResult;
    }
  }

  // Fall back to name matching
  return matchClientByName(name, clients);
}

/**
 * Creates a function that can be used as a findClient callback.
 * This curry function captures the clients array for reuse.
 *
 * @param clients - Array of existing clients
 * @returns Function matching the ValidationOptions.findClient signature
 *
 * @example
 * ```typescript
 * const findClient = createClientMatcher(existingClients);
 * const result = await findClient("Juan Pérez", "1234567890");
 * ```
 */
export function createClientMatcher(
  clients: Client[],
): (name: string, phone?: string) => ClientMatchResult {
  return (name: string, phone?: string) => matchClient(name, phone, clients);
}

/**
 * Normalizes a client name for comparison.
 * Removes accents and converts to lowercase.
 *
 * @param name - Name to normalize
 * @returns Normalized name
 */
export function normalizeClientName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents
}

/**
 * Calculates similarity between two strings (0-1).
 * Used for debugging or additional matching logic.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (0-1, where 1 is identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeClientName(str1);
  const normalized2 = normalizeClientName(str2);

  if (normalized1 === normalized2) return 1.0;

  // Simple Levenshtein-based similarity
  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(normalized1, normalized2);

  return 1 - distance / maxLength;
}

/**
 * Calculates Levenshtein distance between two strings.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Suggests similar client names for potential matches.
 * Useful for UI typeahead or "Did you mean?" suggestions.
 *
 * @param query - Search query
 * @param clients - Array of existing clients
 * @param limit - Maximum number of suggestions
 * @returns Array of suggested clients with confidence scores
 */
export function suggestSimilarClients(
  query: string,
  clients: Client[],
  limit: number = 3,
): Array<{ client: Client; confidence: number }> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const fuse = new Fuse(clients, {
    ...FUSE_OPTIONS,
    threshold: 0.4, // More lenient for suggestions
  });

  const results = fuse.search(query.trim());

  return results.slice(0, limit).map((result) => ({
    client: result.item,
    confidence: 1 - (result.score ?? 1),
  }));
}
