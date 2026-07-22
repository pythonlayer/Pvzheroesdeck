/**
 * synergy-graph-advanced.js
 * Builds a weighted graph of card relationships.
 * Uses community detection to identify packages automatically.
 */

class SynergyGraphAdvanced {
    constructor(cardNormalizer, metaLearner) {
        this.cardNormalizer = cardNormalizer;
        this.metaLearner = metaLearner;
        
        this.nodes = new Map(); // card -> {strength, tags, degree}
        this.edges = new Map(); // "cardA|cardB" -> weight
        this.communities = [];
        
        this.buildGraph();
        this.detectCommunities();
    }

    buildGraph() {
        const allCards = this.cardNormalizer.getAllNormalized();
        
        // Add nodes
        for (const [cardName, cardData] of allCards.entries()) {
            this.nodes.set(cardName, {
                strength: this.metaLearner.getCardStrength(cardName),
                tags: cardData.tags,
                degree: 0,
                tribes: cardData.tribes
            });
        }
        
        // Add edges from synergies
        for (const [synergyKey, weight] of this.metaLearner.packageSynergies.entries()) {
            const [card1, card2] = synergyKey.split('|');
            
            if (this.nodes.has(card1) && this.nodes.has(card2)) {
                const edgeKey = [card1, card2].sort().join('|');
                this.edges.set(edgeKey, weight);
                
                this.nodes.get(card1).degree += weight;
                this.nodes.get(card2).degree += weight;
            }
        }
        
        // Add edges from shared mechanics
        for (const [cardName1, card1] of allCards.entries()) {
            for (const [cardName2, card2] of allCards.entries()) {
                if (cardName1 >= cardName2) continue; // Avoid duplicates
                
                const mechaWeight = this.calculateMechanicWeight(card1, card2);
                if (mechaWeight > 0.1) {
                    const edgeKey = [cardName1, cardName2].sort().join('|');
                    const existing = this.edges.get(edgeKey) || 0;
                    this.edges.set(edgeKey, Math.max(existing, mechaWeight));
                }
            }
        }
    }

    calculateMechanicWeight(card1, card2) {
        let weight = 0;
        
        // Shared tribes
        const sharedTribes = card1.tribes.filter(t => card2.tribes.includes(t)).length;
        weight += sharedTribes * 0.15;
        
        // Shared tags
        const sharedTags = card1.tags.filter(t => card2.tags.includes(t)).length;
        weight += sharedTags * 0.08;
        
        // Shared keywords
        const sharedKeywords = card1.keywords.filter(k => card2.keywords.includes(k)).length;
        weight += sharedKeywords * 0.10;
        
        // Complementary abilities
        if ((card1.token && card2.buff) || (card2.token && card1.buff)) weight += 0.20;
        if ((card1.removal && card2.threat) || (card2.removal && card1.threat)) weight += 0.15;
        if ((card1.draw && card2.cost_reduction) || (card2.draw && card1.cost_reduction)) weight += 0.15;
        
        return Math.min(1, weight);
    }

    detectCommunities() {
        const visited = new Set();
        
        // Sort nodes by degree (hub nodes first)
        const sortedNodes = Array.from(this.nodes.entries())
            .sort((a, b) => b[1].degree - a[1].degree);
        
        for (const [cardName, _] of sortedNodes) {
            if (visited.has(cardName)) continue;
            
            const community = this.expandCommunity(cardName, visited, 0.2);
            if (community.length >= 3) {
                this.communities.push(community);
            }
        }
    }

    expandCommunity(startCard, visited, threshold) {
        const community = new Set([startCard]);
        const queue = [startCard];
        visited.add(startCard);
        
        while (queue.length > 0) {
            const current = queue.shift();
            const neighbors = this.getNeighbors(current, threshold);
            
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    community.add(neighbor);
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        
        return Array.from(community);
    }

    getNeighbors(cardName, minWeight = 0.1) {
        const neighbors = [];
        
        for (const [edgeKey, weight] of this.edges.entries()) {
            if (weight < minWeight) continue;
            
            const [card1, card2] = edgeKey.split('|');
            if (card1 === cardName) {
                neighbors.push(card2);
            } else if (card2 === cardName) {
                neighbors.push(card1);
            }
        }
        
        return neighbors;
    }

    calculateSynergyScore(cardNames) {
        let totalWeight = 0;
        let edgeCount = 0;
        
        for (let i = 0; i < cardNames.length; i++) {
            for (let j = i + 1; j < cardNames.length; j++) {
                const edgeKey = [cardNames[i], cardNames[j]].sort().join('|');
                const weight = this.edges.get(edgeKey) || 0;
                
                if (weight > 0) {
                    totalWeight += weight;
                    edgeCount++;
                }
            }
        }
        
        if (edgeCount === 0) return 0;
        return Math.round((totalWeight / edgeCount) * 100);
    }

    getCommunities() {
        return this.communities;
    }

    findCommunityForCard(cardName) {
        for (const community of this.communities) {
            if (community.includes(cardName)) {
                return community;
            }
        }
        return [];
    }
}

module.exports = SynergyGraphAdvanced;
