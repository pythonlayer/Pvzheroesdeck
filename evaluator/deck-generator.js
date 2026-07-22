/**
 * deck-generator.js
 * Intelligent deck generation using learned archetypes and packages.
 */

class DeckGenerator {
    constructor(cardNormalizer, metaLearner, evaluator, embeddings) {
        this.cardNormalizer = cardNormalizer;
        this.metaLearner = metaLearner;
        this.evaluator = evaluator;
        this.embeddings = embeddings;
    }

    /**
     * Generate a deck for a given archetype
     */
    generateForArchetype(archetype, hero = null) {
        const archProfile = this.metaLearner.getArchetypeProfile(archetype);
        if (!archProfile) {
            return this.generateRandom();
        }
        
        const deck = [];
        
        // Step 1: Build skeleton
        const skeleton = this.buildSkeleton(archProfile);
        
        // Step 2: Fill with strongest cards from archetype
        this.fillWithCards(deck, skeleton, archProfile);
        
        // Step 3: Optimize curve
        this.optimizeCurve(deck);
        
        // Step 4: Evaluate and improve
        return this.improveDecklist(deck, hero);
    }

    buildSkeleton(archProfile) {
        return {
            target_size: 40,
            early_game: Math.ceil(archProfile.avg_curve[1] + archProfile.avg_curve[2]),
            mid_game: Math.ceil(archProfile.avg_curve[3] + archProfile.avg_curve[4]),
            late_game: Math.ceil(archProfile.avg_curve[5] + archProfile.avg_curve[6]),
            removal_target: Math.ceil(archProfile.avg_removal),
            packages: archProfile.common_packages
        };
    }

    fillWithCards(deck, skeleton, archProfile) {
        const used = new Set();
        
        // Fill with cards from common packages
        for (const pkgName of skeleton.packages) {
            const pkgCards = this.cardNormalizer.findByTribe(pkgName);
            const strongest = pkgCards
                .sort((a, b) => this.metaLearner.getCardStrength(b) - this.metaLearner.getCardStrength(a))
                .slice(0, 5);
            
            for (const card of strongest) {
                if (!used.has(card)) {
                    deck.push({ name: card, count: 2 });
                    used.add(card);
                }
            }
        }
        
        // Fill remaining slots with strongest cards for archetype
        const allCards = Array.from(this.cardNormalizer.getAllNormalized().keys())
            .sort((a, b) => this.metaLearner.getCardStrength(b) - this.metaLearner.getCardStrength(a));
        
        for (const card of allCards) {
            if (used.has(card) || deck.length >= skeleton.target_size) break;
            
            const cardData = this.cardNormalizer.getCard(card);
            const count = cardData.cost <= 2 ? 3 : 2;
            
            deck.push({ name: card, count });
            used.add(card);
        }
    }

    optimizeCurve(deck) {
        // Adjust counts to optimize mana curve
        // Higher counts for cheap cards, lower for expensive
        for (let i = 0; i < deck.length; i++) {
            const card = this.cardNormalizer.getCard(deck[i].name);
            if (card) {
                if (card.cost <= 2) deck[i].count = 3;
                else if (card.cost <= 4) deck[i].count = 2;
                else deck[i].count = 1;
            }
        }
    }

    improveDecklist(deck, hero) {
        // Evaluate current deck
        const deckCards = this.flattenDeck(deck);
        let best = this.evaluator.evaluate(deckCards, hero);
        let bestDeck = [...deck];
        
        // Try local improvements (30 iterations)
        for (let iteration = 0; iteration < 30; iteration++) {
            // Find weakest card
            const weakest = this.findWeakestCard(deck);
            if (!weakest) break;
            
            // Try replacements
            const similar = this.embeddings.findSimilarCards(weakest, 5);
            
            for (const { card } of similar) {
                // Try replacement
                const testDeck = [...deck];
                const idx = testDeck.findIndex(c => c.name === weakest);
                if (idx >= 0) {
                    testDeck[idx].name = card;
                    const testVerdict = this.evaluator.evaluate(this.flattenDeck(testDeck), hero);
                    
                    if (testVerdict.verdict > best.verdict) {
                        best = testVerdict;
                        bestDeck = testDeck;
                    }
                }
            }
        }
        
        return {
            cards: bestDeck,
            verdict: best.verdict,
            explanation: best.explanation
        };
    }

    findWeakestCard(deck) {
        // Return card with lowest meta strength
        let weakest = null;
        let lowestStrength = 100;
        
        for (const entry of deck) {
            const strength = this.metaLearner.getCardStrength(entry.name);
            if (strength < lowestStrength) {
                lowestStrength = strength;
                weakest = entry.name;
            }
        }
        
        return weakest;
    }

    flattenDeck(deck) {
        return deck.flatMap(entry => {
            const result = [];
            for (let i = 0; i < entry.count; i++) {
                result.push(entry.name);
            }
            return result;
        });
    }

    generateRandom() {
        // Fallback: random decent deck
        const cards = Array.from(this.cardNormalizer.getAllNormalized().keys())
            .sort(() => Math.random() - 0.5)
            .slice(0, 20);
        
        return {
            cards: cards.map(c => ({ name: c, count: 2 })),
            verdict: 50,
            explanation: { summary: 'Random generation', strengths: [], weaknesses: [] }
        };
    }
}

module.exports = DeckGenerator;
