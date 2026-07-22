/**
 * deck-evaluator.js
 * Main evaluator that ties everything together.
 * API-compatible with getDeckVerdictFromCards(cards, hero)
 */

const CardNormalizer = require('./card-normalizer');
const MetaLearner = require('./meta-learner');
const SynergyGraphAdvanced = require('./synergy-graph-advanced');
const CardEmbeddings = require('./card-embeddings');
const MonteCarloSimulator = require('./monte-carlo-simulator');

class DeckEvaluator {
    constructor(cardDatabase, deckDatabase) {
        this.cardDatabase = cardDatabase;
        this.deckDatabase = deckDatabase;
        
        // Initialize subsystems
        this.cardNormalizer = new CardNormalizer(cardDatabase);
        this.metaLearner = new MetaLearner(deckDatabase, this.cardNormalizer);
        this.synergyGraph = new SynergyGraphAdvanced(this.cardNormalizer, this.metaLearner);
        this.embeddings = new CardEmbeddings(this.cardNormalizer, this.metaLearner, this.synergyGraph);
        
        this.cache = new Map();
        this.maxCacheSize = 5000;
    }

    evaluate(cards, hero = null) {
        const cacheKey = this.getCacheKey(cards, hero);
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const seeds = this.parseCards(cards);
        if (seeds.length === 0) {
            return this.getEmptyVerdict();
        }
        
        // Run complete analysis
        const analysis = {
            seeds,
            curve: this.analyzeCurve(seeds),
            removal: this.analyzeRemoval(seeds),
            finishers: this.analyzeFinishers(seeds),
            packages: this.detectPackages(seeds),
            roles: this.analyzeRoles(seeds),
            consistency: this.analyzeConsistency(seeds),
            synergy: this.synergyGraph.calculateSynergyScore(seeds.map(s => s.name)),
            monte_carlo: new MonteCarloSimulator(seeds, this.cardNormalizer).simulate(1000),
            archetypes: this.detectArchetypes(seeds),
            hero_fit: this.analyzeHeroFit(seeds, hero)
        };
        
        // Calculate scores
        const scores = this.calculateScores(analysis);
        
        // Generate verdict
        const verdict = this.generateVerdict(scores, analysis);
        
        // Add explanations
        verdict.explanation = this.generateExplanation(verdict, analysis, seeds);
        verdict.confidence = this.estimateConfidence(verdict, analysis);
        
        // Cache
        this.cacheVerdict(cacheKey, verdict);
        
        return verdict;
    }

    parseCards(cards) {
        const seedMap = new Map();
        
        for (const cardStr of cards || []) {
            const match = String(cardStr).match(/^(.+?)\s*(?:x(\d+))?$/);
            if (!match) continue;
            
            const name = match[1].trim();
            if (!this.cardNormalizer.getCard(name)) continue;
            
            const count = parseInt(match[2] || 1, 10);
            const existing = seedMap.get(name) || { name, count: 0 };
            existing.count += count;
            seedMap.set(name, existing);
        }
        
        return Array.from(seedMap.values());
    }

    analyzeCurve(seeds) {
        const curve = {};
        let total = 0;
        
        for (const seed of seeds) {
            const card = this.cardNormalizer.getCard(seed.name);
            if (!card) continue;
            
            const cost = Math.min(6, card.cost);
            curve[cost] = (curve[cost] || 0) + seed.count;
            total += seed.count;
        }
        
        // Score the curve
        let score = 50;
        for (let cost = 1; cost <= 3; cost++) {
            const pct = (curve[cost] || 0) / total;
            if (pct >= 0.15 && pct <= 0.25) score += 10;
        }
        
        return { distribution: curve, total, score: Math.min(100, score) };
    }

    analyzeRemoval(seeds) {
        const removal = { count: 0, quality: 0, types: {} };
        
        for (const seed of seeds) {
            const card = this.cardNormalizer.getCard(seed.name);
            if (!card || !card.removal) continue;
            
            removal.count += seed.count;
            
            const type = typeof card.removal === 'string' ? card.removal : card.removal.type;
            removal.types[type] = (removal.types[type] || 0) + seed.count;
        }
        
        removal.quality = removal.count >= 6 && removal.count <= 10 ? 80 : removal.count >= 4 ? 60 : 40;
        return removal;
    }

    analyzeFinishers(seeds) {
        const finishers = [];
        
        for (const seed of seeds) {
            const card = this.cardNormalizer.getCard(seed.name);
            if (!card) continue;
            
            const isFinisher = (card.cost >= 5 && card.strength >= 5) || card.tags.includes('large_finisher');
            if (isFinisher) finishers.push(seed.name);
        }
        
        return {
            count: finishers.length,
            cards: finishers,
            quality: finishers.length >= 3 && finishers.length <= 8 ? 'good' : finishers.length > 0 ? 'adequate' : 'weak'
        };
    }

    detectPackages(seeds) {
        const seedSet = new Set(seeds.map(s => s.name));
        const packages = [];
        
        // Check detected communities from synergy graph
        for (const community of this.synergyGraph.getCommunities()) {
            const cardsInDeck = community.filter(c => seedSet.has(c)).length;
            if (cardsInDeck >= Math.ceil(community.length * 0.5)) {
                const synergy = this.synergyGraph.calculateSynergyScore(community.filter(c => seedSet.has(c)));
                packages.push({
                    cards: community.filter(c => seedSet.has(c)),
                    synergy,
                    coverage: cardsInDeck / community.length
                });
            }
        }
        
        return packages.sort((a, b) => b.synergy - a.synergy).slice(0, 5);
    }

    analyzeRoles(seeds) {
        const roles = {
            early_game: 0,
            mid_game: 0,
            late_game: 0,
            removal: 0,
            draw: 0,
            threats: 0
        };
        
        const total = seeds.reduce((sum, s) => sum + s.count, 0);
        
        for (const seed of seeds) {
            const card = this.cardNormalizer.getCard(seed.name);
            if (!card) continue;
            
            if (card.cost <= 2) roles.early_game += seed.count;
            if (card.cost >= 3 && card.cost <= 4) roles.mid_game += seed.count;
            if (card.cost >= 5) roles.late_game += seed.count;
            if (card.removal) roles.removal += seed.count;
            if (card.draw) roles.draw += seed.count;
            if (card.tags.includes('threat')) roles.threats += seed.count;
        }
        
        for (const role in roles) {
            roles[role] = Math.round((roles[role] / total) * 100);
        }
        
        return roles;
    }

    analyzeConsistency(seeds) {
        const singletons = seeds.filter(s => s.count === 1).length;
        const duplicates = seeds.filter(s => s.count === 2).length;
        const triplicates = seeds.filter(s => s.count >= 3).length;
        
        const singletonPct = singletons / seeds.length;
        
        const score = singletonPct <= 0.25 ? 90 :
                     singletonPct <= 0.40 ? 75 :
                     singletonPct <= 0.50 ? 60 : 40;
        
        return { singletons, duplicates, triplicates, score };
    }

    detectArchetypes(seeds) {
        const archetypes = {};
        
        for (const archProfile of this.metaLearner.getAllArchetypes()) {
            archetypes[archProfile.name] = this.scoreArchetypeMatch(seeds, archProfile);
        }
        
        return archetypes;
    }

    scoreArchetypeMatch(seeds, archProfile) {
        let score = 0;
        let matches = 0;
        
        // Check curve similarity
        const curve = this.analyzeCurve(seeds);
        const archCurve = archProfile.avg_curve;
        
        for (let i = 1; i <= 3; i++) {
            const deckEarly = (curve.distribution[i] || 0) / curve.total;
            const archEarly = (archCurve[i] || 0) / archProfile.count;
            if (Math.abs(deckEarly - archEarly) < 0.15) score += 20;
        }
        
        // Check removal
        const removalCount = this.analyzeRemoval(seeds).count;
        if (Math.abs(removalCount - archProfile.avg_removal) <= 2) score += 15;
        
        return Math.min(100, score);
    }

    analyzeHeroFit(seeds, hero) {
        if (!hero) return { score: 50, reason: 'No hero selected' };
        
        // Could be extended with hero-specific card pools
        return { score: 50, reason: 'Hero fit analysis not yet implemented' };
    }

    calculateScores(analysis) {
        return {
            curve: analysis.curve.score,
            removal: analysis.removal.quality,
            finishers: analysis.finishers.quality === 'good' ? 85 : analysis.finishers.quality === 'adequate' ? 60 : 30,
            synergy: analysis.synergy,
            consistency: analysis.consistency.score,
            packages: analysis.packages.length > 0 ? 80 : 50,
            playability: analysis.monte_carlo.win_rate_estimate,
            roles: this.scoreRoleBalance(analysis.roles)
        };
    }

    scoreRoleBalance(roles) {
        let score = 50;
        if (roles.early_game >= 25 && roles.early_game <= 40) score += 15;
        if (roles.removal >= 15) score += 10;
        if (roles.late_game >= 15 && roles.late_game <= 30) score += 10;
        return Math.min(100, score);
    }

    generateVerdict(scores, analysis) {
        const verdict = Math.round(
            (scores.curve * 0.12) +
            (scores.removal * 0.15) +
            (scores.finishers * 0.12) +
            (scores.synergy * 0.18) +
            (scores.consistency * 0.10) +
            (scores.packages * 0.10) +
            (scores.playability * 0.15) +
            (scores.roles * 0.08)
        );
        
        return {
            verdict,
            score: verdict,
            scores,
            analysis,
            packages: analysis.packages,
            archetypes: analysis.archetypes,
            roles: analysis.roles,
            monte_carlo: analysis.monte_carlo
        };
    }

    generateExplanation(verdict, analysis, seeds) {
        const strengths = [];
        const weaknesses = [];
        
        // Analyze strengths
        if (verdict.scores.synergy >= 70) {
            strengths.push('Excellent card synergy and coherent strategy');
        }
        
        if (analysis.removal.count >= 8) {
            strengths.push(`Strong removal suite (${analysis.removal.count} removal cards)`);
        }
        
        if (analysis.finishers.quality === 'good') {
            strengths.push(`Reliable finishers (${analysis.finishers.count} cards)`);
        }
        
        if (analysis.packages.length >= 2) {
            strengths.push(`Multiple coherent packages detected`);
        }
        
        // Analyze weaknesses
        if (analysis.roles.early_game < 20) {
            weaknesses.push('Too few early plays - vulnerable to aggression');
        }
        
        if (analysis.consistency.singletons > 15) {
            weaknesses.push(`Too many singleton cards (${analysis.consistency.singletons}) - low consistency`);
        }
        
        if (analysis.removal.count < 4) {
            weaknesses.push('Insufficient removal - difficult against aggressive decks');
        }
        
        if (verdict.scores.synergy < 50) {
            weaknesses.push('Cards feel disconnected - consider focusing on 1-2 strategies');
        }
        
        return {
            summary: `${verdict.score >= 75 ? 'Strong' : verdict.score >= 60 ? 'Solid' : verdict.score >= 45 ? 'Playable' : 'Weak'} deck (${verdict.score}/100)`,
            strengths,
            weaknesses,
            detailed: this.generateDetailedAnalysis(verdict, analysis)
        };
    }

    generateDetailedAnalysis(verdict, analysis) {
        return [
            `**Curve Analysis**: ${this.describeCurve(analysis.curve)}`,
            `**Synergy**: ${verdict.scores.synergy}/100 - ${verdict.scores.synergy >= 70 ? 'Excellent' : verdict.scores.synergy >= 50 ? 'Good' : 'Needs work'}`,
            `**Playability**: ${Math.round(analysis.monte_carlo.average_board_presence)} avg board presence`,
            `**Brick Rate**: ${analysis.monte_carlo.brick_hands}% (${analysis.monte_carlo.brick_hands < 10 ? 'Excellent' : 'Concerning'})`,
            `**Finisher Consistency**: ${analysis.monte_carlo.finisher_arrival_turn.toFixed(1)} average turn`,
            `**Role Distribution**: ${analysis.roles.early_game}% early, ${analysis.roles.mid_game}% mid, ${analysis.roles.late_game}% late`
        ].join('\n');
    }

    describeCurve(curveAnalysis) {
        const dist = curveAnalysis.distribution;
        const early = (dist[1] || 0) + (dist[2] || 0);
        const mid = (dist[3] || 0) + (dist[4] || 0);
        const late = (dist[5] || 0) + (dist[6] || 0);
        const total = curveAnalysis.total;
        
        return `${((early/total)*100).toFixed(0)}% early, ${((mid/total)*100).toFixed(0)}% mid, ${((late/total)*100).toFixed(0)}% late`;
    }

    estimateConfidence(verdict, analysis) {
        let confidence = 70;
        
        if (verdict.scores.synergy >= 60 || verdict.scores.synergy <= 40) confidence += 10;
        if (analysis.packages.length >= 2) confidence += 10;
        if (analysis.finishers.quality !== 'weak') confidence += 5;
        
        return Math.max(40, Math.min(95, confidence));
    }

    getCacheKey(cards, hero) {
        return `${String(cards || []).split(',').sort().join('|')}:${hero || 'none'}`;
    }

    cacheVerdict(key, verdict) {
        this.cache.set(key, verdict);
        if (this.cache.size > this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    getEmptyVerdict() {
        return {
            verdict: 0,
            score: 0,
            error: 'Invalid deck',
            explanation: { summary: 'No valid cards', strengths: [], weaknesses: [] }
        };
    }
}

// Global instance
let evaluatorInstance = null;

function initializeEvaluator(cardDatabase, deckDatabase) {
    evaluatorInstance = new DeckEvaluator(cardDatabase, deckDatabase);
    console.log('✓ Evaluator initialized with card and deck databases');
}

function getDeckVerdictFromCards(cards, hero = null) {
    if (!evaluatorInstance) {
        console.warn('Evaluator not initialized - using fallback');
        return { verdict: 50, score: 50, error: 'Evaluator not initialized' };
    }
    
    const result = evaluatorInstance.evaluate(cards, hero);
    
    // Return ONLY the verdict for backward compatibility
    // But store full result in a property for advanced users
    return {
        verdict: result.verdict,
        score: result.verdict,
        _full: result // Advanced analysis available here
    };
}

module.exports = { getDeckVerdictFromCards, initializeEvaluator, DeckEvaluator };
