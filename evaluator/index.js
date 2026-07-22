/**
 * evaluator/index.js
 * Main entry point. Initializes the entire AI system.
 */

const CardNormalizer = require('./card-normalizer');
const MetaLearner = require('./meta-learner');
const SynergyGraphAdvanced = require('./synergy-graph-advanced');
const CardEmbeddings = require('./card-embeddings');
const MonteCarloSimulator = require('./monte-carlo-simulator');
const { DeckEvaluator, initializeEvaluator, getDeckVerdictFromCards } = require('./deck-evaluator');
const DeckGenerator = require('./deck-generator');
const CacheManager = require('./cache-manager');

let evaluator = null;
let generator = null;
let cache = null;

/**
 * Initialize the AI system with card and deck databases
 */
function initialize(cardDatabase, deckDatabase) {
    console.log('🚀 Initializing AI system...');
    
    const startTime = Date.now();
    
    // Initialize evaluator (which initializes all subsystems)
    initializeEvaluator(cardDatabase, deckDatabase);
    evaluator = new DeckEvaluator(cardDatabase, deckDatabase);
    
    // Initialize generator
    generator = new DeckGenerator(
        evaluator.cardNormalizer,
        evaluator.metaLearner,
        evaluator,
        evaluator.embeddings
    );
    
    // Initialize cache
    cache = new CacheManager();
    
    const elapsed = Date.now() - startTime;
    console.log(`✓ AI system ready in ${elapsed}ms`);
    console.log(`  - ${evaluator.cardNormalizer.getAllNormalized().size} cards normalized`);
    console.log(`  - ${evaluator.metaLearner.getAllArchetypes().length} archetypes detected`);
    console.log(`  - ${evaluator.synergyGraph.getCommunities().length} card communities found`);
}

/**
 * Evaluate a deck
 */
function evaluateDeck(cards, hero = null) {
    if (!evaluator) throw new Error('AI system not initialized');
    return evaluator.evaluate(cards, hero);
}

/**
 * Generate a deck for an archetype
 */
function generateDeck(archetype, hero = null) {
    if (!generator) throw new Error('AI system not initialized');
    return generator.generateForArchetype(archetype, hero);
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    if (!cache) return null;
    return cache.getStats();
}

/**
 * Get system info
 */
function getSystemInfo() {
    if (!evaluator) return { status: 'not initialized' };
    
    return {
        status: 'ready',
        cards: evaluator.cardNormalizer.getAllNormalized().size,
        archetypes: evaluator.metaLearner.getAllArchetypes().length,
        communities: evaluator.synergyGraph.getCommunities().length,
        cache: cache.getStats()
    };
}

module.exports = {
    initialize,
    evaluateDeck,
    generateDeck,
    getDeckVerdictFromCards, // Backward compatible API
    getCacheStats,
    getSystemInfo,
    // Direct access to subsystems for advanced use
    DeckEvaluator,
    DeckGenerator,
    CardNormalizer,
    MetaLearner,
    SynergyGraphAdvanced,
    CardEmbeddings,
    MonteCarloSimulator,
    CacheManager
};
