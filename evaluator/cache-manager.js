/**
 * cache-manager.js
 * Intelligent multi-level caching for performance.
 */

class CacheManager {
    constructor() {
        this.cardTagCache = new Map();
        this.packageCache = new Map();
        this.archetypeCache = new Map();
        this.embedingCache = new Map();
        this.evaluationCache = new Map();
        
        this.stats = {
            hits: 0,
            misses: 0,
            clears: 0
        };
    }

    /**
     * Cache normalized card tags
     */
    cacheCardTags(cardName, tags) {
        this.cardTagCache.set(cardName, tags);
    }

    getCardTags(cardName) {
        if (this.cardTagCache.has(cardName)) {
            this.stats.hits++;
            return this.cardTagCache.get(cardName);
        }
        this.stats.misses++;
        return null;
    }

    /**
     * Cache package detection results
     */
    cachePackages(deckHash, packages) {
        this.packageCache.set(deckHash, packages);
        this.maintainSize(this.packageCache, 10000);
    }

    getPackages(deckHash) {
        if (this.packageCache.has(deckHash)) {
            this.stats.hits++;
            return this.packageCache.get(deckHash);
        }
        this.stats.misses++;
        return null;
    }

    /**
     * Cache archetype vectors
     */
    cacheArchetype(deckHash, archetype) {
        this.archetypeCache.set(deckHash, archetype);
        this.maintainSize(this.archetypeCache, 5000);
    }

    getArchetype(deckHash) {
        if (this.archetypeCache.has(deckHash)) {
            this.stats.hits++;
            return this.archetypeCache.get(deckHash);
        }
        this.stats.misses++;
        return null;
    }

    /**
     * Cache Monte Carlo results
     */
    cacheEvaluation(deckHash, evaluation) {
        this.evaluationCache.set(deckHash, evaluation);
        this.maintainSize(this.evaluationCache, 5000);
    }

    getEvaluation(deckHash) {
        if (this.evaluationCache.has(deckHash)) {
            this.stats.hits++;
            return this.evaluationCache.get(deckHash);
        }
        this.stats.misses++;
        return null;
    }

    /**
     * LRU cache maintenance
     */
    maintainSize(cache, maxSize) {
        if (cache.size > maxSize) {
            const toDelete = cache.size - maxSize + 100; // Clear 100 extra
            let count = 0;
            for (const key of cache.keys()) {
                if (count >= toDelete) break;
                cache.delete(key);
                count++;
            }
        }
    }

    /**
     * Generate deck hash for caching
     */
    hashDeck(cards) {
        const sorted = cards.map(c => typeof c === 'string' ? c : c.name).sort().join('|');
        let hash = 0;
        for (let i = 0; i < sorted.length; i++) {
            const char = sorted.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return String(Math.abs(hash));
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            hit_rate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : '0%',
            hits: this.stats.hits,
            misses: this.stats.misses,
            total: total,
            cache_sizes: {
                tags: this.cardTagCache.size,
                packages: this.packageCache.size,
                archetypes: this.archetypeCache.size,
                evaluations: this.evaluationCache.size
            }
        };
    }

    /**
     * Clear all caches
     */
    clearAll() {
        this.cardTagCache.clear();
        this.packageCache.clear();
        this.archetypeCache.clear();
        this.embedingCache.clear();
        this.evaluationCache.clear();
        this.stats.clears++;
    }
}

module.exports = CacheManager;
