/**
 * card-embeddings.js
 * Creates vector representations of cards for intelligent substitution.
 */

class CardEmbeddings {
    constructor(cardNormalizer, metaLearner, synergyGraph) {
        this.cardNormalizer = cardNormalizer;
        this.metaLearner = metaLearner;
        this.synergyGraph = synergyGraph;
        
        this.embeddings = new Map(); // card -> vector
        this.buildEmbeddings();
    }

    buildEmbeddings() {
        const allCards = this.cardNormalizer.getAllNormalized();
        
        for (const [cardName, cardData] of allCards.entries()) {
            const embedding = this.createEmbedding(cardName, cardData);
            this.embeddings.set(cardName, embedding);
        }
    }

    createEmbedding(cardName, cardData) {
        const vec = {};
        
        // Cost dimension (0-1)
        vec.cost = cardData.cost / 8;
        
        // Stats dimension
        vec.strength = cardData.strength / 12;
        vec.health = cardData.health / 12;
        
        // Tribe encoding (one-hot for primary tribe)
        for (const tribe of cardData.tribes) {
            vec[`tribe_${tribe}`] = 1;
        }
        
        // Ability encoding
        vec.removal = cardData.removal ? 1 : 0;
        vec.draw = cardData.draw ? 1 : 0;
        vec.token = cardData.token ? 1 : 0;
        vec.buff = cardData.buff ? 1 : 0;
        vec.healing = cardData.healing ? 1 : 0;
        vec.evolution = cardData.evolution ? 1 : 0;
        
        // Role encoding
        vec.early_game = cardData.tags.includes('early_game') ? 1 : 0;
        vec.late_game = cardData.tags.includes('late_game') ? 1 : 0;
        vec.threat = cardData.tags.includes('threat') ? 1 : 0;
        
        // Card strength from meta
        vec.strength_meta = this.metaLearner.getCardStrength(cardName) / 100;
        vec.usage = this.metaLearner.getCardUsage(cardName);
        
        // Synergy centrality (how connected in the synergy graph)
        const neighbors = this.synergyGraph.getNeighbors(cardName, 0.1);
        vec.centrality = Math.min(1, neighbors.length / 20);
        
        return vec;
    }

    similarity(card1, card2) {
        const v1 = this.embeddings.get(card1);
        const v2 = this.embeddings.get(card2);
        
        if (!v1 || !v2) return 0;
        
        return this.cosineSimilarity(v1, v2);
    }

    cosineSimilarity(v1, v2) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
        
        for (const key of allKeys) {
            const val1 = v1[key] || 0;
            const val2 = v2[key] || 0;
            
            dotProduct += val1 * val2;
            norm1 += val1 * val1;
            norm2 += val2 * val2;
        }
        
        const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }

    findSimilarCards(cardName, topN = 10) {
        const similarities = [];
        
        for (const [otherCard, _] of this.embeddings.entries()) {
            if (otherCard === cardName) continue;
            
            const sim = this.similarity(cardName, otherCard);
            similarities.push({ card: otherCard, similarity: sim });
        }
        
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topN);
    }

    getEmbedding(cardName) {
        return this.embeddings.get(cardName);
    }
}

module.exports = CardEmbeddings;
