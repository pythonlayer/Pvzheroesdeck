/**
 * monte-carlo-simulator.js
 * Simulates actual games to evaluate deck quality.
 * Much more meaningful than just opening hand analysis.
 */

class MonteCarloSimulator {
    constructor(seeds, cardNormalizer) {
        this.seeds = seeds;
        this.cardNormalizer = cardNormalizer;
        this.buildDeck();
    }

    buildDeck() {
        this.fullDeck = [];
        for (const seed of this.seeds) {
            const card = this.cardNormalizer.getCard(seed.name);
            if (card) {
                for (let i = 0; i < seed.count; i++) {
                    this.fullDeck.push(seed.name);
                }
            }
        }
    }

    simulate(numGames = 1000) {
        const results = {
            playable_hands: 0,
            brick_hands: 0,
            average_board_presence: 0,
            average_damage: 0,
            average_resources_efficiency: 0,
            finisher_arrival_turn: 0,
            dead_cards: 0,
            curve_consistency: 0,
            win_rate_estimate: 0
        };
        
        const sims = [];
        
        for (let game = 0; game < numGames; game++) {
            const sim = this.simulateGame();
            sims.push(sim);
        }
        
        // Aggregate results
        results.playable_hands = sims.filter(s => s.had_play).length;
        results.brick_hands = sims.filter(s => s.brick).length;
        results.average_board_presence = sims.reduce((sum, s) => sum + s.board_presence, 0) / numGames;
        results.average_damage = sims.reduce((sum, s) => sum + s.damage, 0) / numGames;
        results.average_resources_efficiency = sims.reduce((sum, s) => sum + s.efficiency, 0) / numGames;
        results.finisher_arrival_turn = sims.reduce((sum, s) => sum + s.finisher_turn, 0) / numGames;
        results.dead_cards = sims.reduce((sum, s) => sum + s.dead_count, 0) / numGames;
        results.curve_consistency = this.calculateCurveConsistency(sims);
        
        // Rough win rate estimate based on metrics
        results.win_rate_estimate = this.estimateWinRate(results);
        
        return results;
    }

    simulateGame() {
        const deckCopy = [...this.fullDeck];
        const hand = this.drawCards(deckCopy, 7);
        const discardPile = [];
        
        let resources = 1; // Turn 1 resource
        let boardPresence = 0;
        let damage = 0;
        let playedCards = 0;
        let deadCards = 0;
        let finisherTurn = 0;
        let hasPlayableCard = false;
        let turnCount = 0;
        
        // Simulate turns 1-10
        for (let turn = 1; turn <= 10; turn++) {
            resources += 1; // Resource increment per turn
            
            // Play cards from hand
            const playable = this.getPlayableCards(hand, resources);
            hasPlayableCard = hasPlayableCard || playable.length > 0;
            
            for (const card of playable) {
                const cardData = this.cardNormalizer.getCard(card);
                if (!cardData) continue;
                
                resources -= cardData.cost;
                playedCards++;
                
                // Update metrics
                if (cardData.strength) boardPresence += cardData.strength;
                if (cardData.burn) damage += cardData.burn;
                if (cardData.tags.includes('large_finisher') && finisherTurn === 0) {
                    finisherTurn = turn;
                }
                
                // Remove from hand
                hand.splice(hand.indexOf(card), 1);
            }
            
            // Draw cards if deck available
            if (deckCopy.length > 0) {
                const drawn = this.drawCards(deckCopy, Math.min(3, deckCopy.length));
                hand.push(...drawn);
            }
            
            turnCount = turn;
        }
        
        // Count dead cards (unplayable throughout game)
        for (const card of hand) {
            const cardData = this.cardNormalizer.getCard(card);
            if (cardData && cardData.cost > 10) {
                deadCards++;
            }
        }
        
        return {
            had_play: hasPlayableCard,
            brick: !hasPlayableCard,
            board_presence: boardPresence,
            damage,
            efficiency: Math.min(100, (playedCards / turnCount) * 100),
            finisher_turn: finisherTurn || 12,
            dead_count: deadCards
        };
    }

    drawCards(deck, count) {
        const drawn = [];
        for (let i = 0; i < count && deck.length > 0; i++) {
            const idx = Math.floor(Math.random() * deck.length);
            drawn.push(deck[idx]);
            deck.splice(idx, 1);
        }
        return drawn;
    }

    getPlayableCards(hand, resources) {
        const playable = [];
        const copy = [...hand];
        
        // Greedy: play cheapest first to maximize plays
        copy.sort((a, b) => {
            const costA = this.cardNormalizer.getCard(a)?.cost || 0;
            const costB = this.cardNormalizer.getCard(b)?.cost || 0;
            return costA - costB;
        });
        
        for (const card of copy) {
            const cardData = this.cardNormalizer.getCard(card);
            if (cardData && cardData.cost <= resources) {
                playable.push(card);
                resources -= cardData.cost;
            }
        }
        
        return playable;
    }

    calculateCurveConsistency(sims) {
        // Standard deviation of resources used - lower is better (more consistent)
        const efficiencies = sims.map(s => s.efficiency);
        const mean = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
        const variance = efficiencies.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / efficiencies.length;
        const stdDev = Math.sqrt(variance);
        
        // Convert to 0-100 scale (lower stddev = higher score)
        return Math.max(0, 100 - stdDev);
    }

    estimateWinRate(results) {
        let estimate = 50; // Baseline
        
        // Playable hands increase win rate
        estimate += (results.playable_hands / 100) * 15;
        
        // Low brick rate is critical
        if (results.brick_hands < 10) estimate += 10;
        else if (results.brick_hands > 30) estimate -= 15;
        
        // Early finisher arrival is good
        if (results.finisher_arrival_turn <= 5) estimate += 10;
        else if (results.finisher_arrival_turn > 8) estimate -= 5;
        
        // Consistent curve
        estimate += results.curve_consistency / 10;
        
        return Math.max(25, Math.min(75, estimate));
    }
}

module.exports = MonteCarloSimulator;
