/**
 * Validation Result Cache
 * 
 * In-memory cache for email validation results with TTL-based expiration.
 * Ensures consistent results for the same email within the TTL window.
 */

const cache = new Map();

// Default TTL: 24 hours in milliseconds
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

// Cache statistics
const stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    expirations: 0
};

/**
 * Get cached validation result for an email
 * @param {string} email - Email address to check
 * @param {number} ttl - Time-to-live in milliseconds (optional)
 * @returns {Object|null} Cached result or null if not found/expired
 */
export function getCachedResult(email, ttl = DEFAULT_TTL) {
    const key = email.toLowerCase().trim();
    const entry = cache.get(key);

    if (!entry) {
        stats.misses++;
        return null;
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
        cache.delete(key);
        stats.expirations++;
        stats.misses++;
        return null;
    }

    stats.hits++;
    return entry.result;
}

/**
 * Store validation result in cache
 * @param {string} email - Email address
 * @param {Object} result - Validation result object
 */
export function setCachedResult(email, result) {
    const key = email.toLowerCase().trim();

    cache.set(key, {
        result: { ...result },
        timestamp: Date.now()
    });

    stats.sets++;
}

/**
 * Clear all cached results
 */
export function clearCache() {
    const size = cache.size;
    cache.clear();
    return size;
}

/**
 * Clear expired entries from cache
 * @param {number} ttl - Time-to-live in milliseconds
 * @returns {number} Number of entries cleared
 */
export function clearExpired(ttl = DEFAULT_TTL) {
    let cleared = 0;
    const now = Date.now();

    for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > ttl) {
            cache.delete(key);
            cleared++;
        }
    }

    stats.expirations += cleared;
    return cleared;
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
    const totalRequests = stats.hits + stats.misses;
    const hitRate = totalRequests > 0 ? (stats.hits / totalRequests * 100).toFixed(2) : 0;

    return {
        size: cache.size,
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        expirations: stats.expirations,
        hitRate: `${hitRate}%`
    };
}

/**
 * Reset cache statistics
 */
export function resetStats() {
    stats.hits = 0;
    stats.misses = 0;
    stats.sets = 0;
    stats.expirations = 0;
}

// Periodic cleanup of expired entries (every hour)
setInterval(() => {
    clearExpired(DEFAULT_TTL);
}, 60 * 60 * 1000);
