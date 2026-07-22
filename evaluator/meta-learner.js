/**
 * meta-learner.js
 * Learns card strength, archetypes, and packages from the deck database.
 * This is the "source of truth" for all deck analysis.
 */

class MetaLearner {
    constructor(deckDatabase, cardNormalizer) {
        this.deckDatabase = deckDatabase;
        this.cardNormalizer = cardNormalizer;
        
        // Learned data
        this.cardStrengths = new Map();
        this.cardUsage = new Map();
        this.archetypeProfiles = new Map();
        this.packageFrequency = new Map();
        this.packageSynergies = new Map();
        this.heroPreferences = new Map();
        
        this.learn();
    }

    learn() {
        this.learnCardStatistics();
        this.learnArchetypes();
        this.learnPackages();
        this.learnSynergies();
    }

    learnCardStatistics() {
        const cardStats = new Map();
        
        // Count card appearances and deck quality
        for (const [deckId, deckData] of Object.entries(this.deckDatabase)) {
            if (!Array.isArray(deckData.cards)) continue;
            
            const deckScore = deckData.estimated_score || 50; // From deck database
            const cardNames = new Set();
            
            for (const cardEntry of deckData.cards) {
                const parsed = this.parseCardEntry(cardEntry);
                if (!parsed) continue;
                
                cardNames.add(parsed.name);
                
                if (!cardStats.has(parsed.name)) {
                    cardStats.set(parsed.name, {
                        appearances: 0,
                        total_deck_score: 0,
                        decks: []
                    });
                }
                
                const stats = cardStats.get(parsed.name);
                stats.appearances++;
                stats.total_deck_score += deckScore;
                stats.decks.push(deckId);
            }
        }
        
        // Calculate card strength
        const totalDecks = Object.keys(this.deckDatabase).length;
        for (const [cardName, stats] of cardStats.entries()) {
            const avgDeckScore = stats.total_deck_score / stats.appearances;
            const usageRate = stats.appearances / totalDecks;
            
            this.cardStrengths.set(cardName, avgDeckScore);
            this.cardUsage.set(cardName, usageRate);
        }
    }

    learnArchetypes() {
        const archetypeCache = new Map();
        
        for (const [deckId, deckData] of Object.entries(this.deckDatabase)) {
            if (!Array.isArray(deckData.cards)) continue;
            
            // Detect archetype from deck composition
            const archetype = this.detectArchetype(deckData.cards);
            const deckScore = deckData.estimated_score || 50;
            
            if (!archetypeCache.has(archetype)) {
                archetypeCache.set(archetype, {
                    decks: [],
                    scores: [],
                    curves: [],
                    removals: [],
                    packages: []
                });
            }
            
            const profile = archetypeCache.get(archetype);
            profile.decks.push(deckId);
            profile.scores.push(deckScore);
            profile.curves.push(this.extractCurve(deckData.cards));
            profile.removals.push(this.countRemoval(deckData.cards));
            profile.packages.push(this.detectPackages(deckData.cards));
        }
        
        // Compute archetype profiles
        for (const [archetype, data] of archetypeCache.entries()) {
            this.archetypeProfiles.set(archetype, {
                name: archetype,
                count: data.decks.length,
                avg_score: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
                avg_curve: this.averageCurve(data.curves),
                avg_removal: data.removals.reduce((a, b) => a + b, 0) / data.removals.length,
                common_packages: this.findCommonPackages(data.packages),
                prevalence: data.decks.length / Object.keys(this.deckDatabase).length
            });
        }
    }

    learnPackages() {
        const packageFreq = new Map();
        
        for (const [deckId, deckData] of Object.entries(this.deckDatabase)) {
            if (!Array.isArray(deckData.cards)) continue;
            
            const packages = this.detectPackages(deckData.cards);
            
            for (const pkg of packages) {
                const pkgKey = JSON.stringify(pkg.cards.sort());
                if (!packageFreq.has(pkgKey)) {
                    packageFreq.set(pkgKey, { cards: pkg.cards, count: 0, decks: [] });
                }
                packageFreq.get(pkgKey).count++;
                packageFreq.get(pkgKey).decks.push(deckId);
            }
        }
        
        // Filter and store significant packages
        const minSupport = Math.ceil(Object.keys(this.deckDatabase).length * 0.03);
        for (const [pkgKey, data] of packageFreq.entries()) {
            if (data.count >= minSupport) {
                this.packageFrequency.set(pkgKey, {
                    cards: data.cards,
                    frequency: data.count,
                    prevalence: data.count / Object.keys(this.deckDatabase).length
                });
            }
        }
    }

    learnSynergies() {
        const cooccurrence = new Map();
        
        for (const [deckId, deckData] of Object.entries(this.deckDatabase)) {
            if (!Array.isArray(deckData.cards)) continue;
            
            const cardSet = new Set();
            for (const cardEntry of deckData.cards) {
                const parsed = this.parseCardEntry(cardEntry);
                if (parsed) cardSet.add(parsed.name);
            }
            
            const cards = Array.from(cardSet);
            for (let i = 0; i < cards.length; i++) {
                for (let j = i + 1; j < cards.length; j++) {
                    const key = [cards[i], cards[j]].sort().join('|');
                    cooccurrence.set(key, (cooccurrence.get(key) || 0) + 1);
                }
            }
        }
        
        // Store high-frequency synergies
        const minSynergy = 3;
        for (const [key, count] of cooccurrence.entries()) {
            if (count >= minSynergy) {
                const [card1, card2] = key.split('|');
                const strength = Math.min(1, count / 10);
                this.packageSynergies.set(key, strength);
            }
        }
    }

    detectArchetype(cards) {
        // Simple archetype detection based on card composition
        let earlyCount = 0, lateCount = 0, removalCount = 0, tokenCount = 0;
        
        for (const cardEntry of cards) {
            const parsed = this.parseCardEntry(cardEntry);
            if (!parsed) continue;
            
            const card = this.cardNormalizer.getCard(parsed.name);
            if (!card) continue;
            
            if (card.cost <= 2) earlyCount++;
            if (card.cost >= 5) lateCount++;
            if (card.removal) removalCount++;
            if (card.token) tokenCount++;
        }
        
        const total = cards.length;
        const earlyRatio = earlyCount / total;
        const lateRatio = lateCount / total;
        const removalRatio = removalCount / total;
        const tokenRatio = tokenCount / total;
        
        if (earlyRatio > 0.35) return 'Aggro';
        if (removalRatio > 0.25) return 'Control';
        if (tokenRatio > 0.20) return 'Swarm';
        if (lateRatio > 0.30) return 'Ramp';
        return 'Midrange';
    }

    detectPackages(cards) {
        const packages = [];
        const cardSet = new Set();
        const tribes = new Map();
        
        for (const cardEntry of cards) {
            const parsed = this.parseCardEntry(cardEntry);
            if (!parsed) continue;
            
            cardSet.add(parsed.name);
            const card = this.cardNormalizer.getCard(parsed.name);
            if (!card) continue;
            
            for (const tribe of card.tribes) {
                if (!tribes.has(tribe)) tribes.set(tribe, []);
                tribes.get(tribe).push(parsed.name);
            }
        }
        
        // Create packages for tribes with 3+ members
        for (const [tribe, members] of tribes.entries()) {
            if (members.length >= 3) {
                packages.push({ type: 'tribal', tribe, cards: members });
            }
        }
        
        return packages;
    }

    extractCurve(cards) {
        const curve = [0, 0, 0, 0, 0, 0, 0]; // costs 0-6
        
        for (const cardEntry of cards) {
            const parsed = this.parseCardEntry(cardEntry);
            if (!parsed) continue;
            
            const card = this.cardNormalizer.getCard(parsed.name);
            if (card) {
                const idx = Math.min(6, card.cost);
                curve[idx] += parsed.count;
            }
        }
        
        return curve;
    }

    averageCurve(curves) {
        const avg = [0, 0, 0, 0, 0, 0, 0];
        for (const curve of curves) {
            for (let i = 0; i < 7; i++) {
                avg[i] += (curve[i] || 0);
            }
        }
        return avg.map(v => Math.round(v / curves.length));
    }

    countRemoval(cards) {
        let count = 0;
        for (const cardEntry of cards) {
            const parsed = this.parseCardEntry(cardEntry);
            if (!parsed) continue;
            
            const card = this.cardNormalizer.getCard(parsed.name);
            if (card && card.removal) count += parsed.count;
        }
        return count;
    }

    findCommonPackages(packageLists) {
        const freq = new Map();
        for (const packages of packageLists) {
            for (const pkg of packages) {
                const key = pkg.tribe || pkg.type;
                freq.set(key, (freq.get(key) || 0) + 1);
            }
        }
        
        return Array.from(freq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([pkg, _]) => pkg);
    }

    parseCardEntry(cardEntry) {
        const match = String(cardEntry).match(/^(.+?)\s*(?:x(\d+))?$/);
        if (!match) return null;
        return { name: match[1].trim(), count: parseInt(match[2] || 1, 10) };
    }

    getCardStrength(cardName) {
        return this.cardStrengths.get(cardName) || 50;
    }

    getCardUsage(cardName) {
        return this.cardUsage.get(cardName) || 0;
    }

    getArchetypeProfile(archetype) {
        return this.archetypeProfiles.get(archetype);
    }

    getAllArchetypes() {
        return Array.from(this.archetypeProfiles.values());
    }
}

module.exports = MetaLearner;
