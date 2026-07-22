/**
 * card-normalizer.js
 * Builds a canonical card database with structured tags.
 * Runs once at startup. Never re-parses descriptions.
 */

class CardNormalizer {
    constructor(cardDatabase) {
        this.cardDatabase = cardDatabase;
        this.normalizedCards = new Map();
        this.normalize();
    }

    normalize() {
        for (const [cardName, cardData] of Object.entries(this.cardDatabase)) {
            this.normalizedCards.set(cardName, this.normalizeCard(cardName, cardData));
        }
    }

    normalizeCard(cardName, cardData) {
        const desc = (cardData.Description || '').toLowerCase();
        const type = (cardData.Type || '').toLowerCase();
        const cost = cardData.Cost || 0;
        const strength = cardData.Strength || 0;
        const health = cardData.Health || 0;

        return {
            name: cardName,
            cost,
            strength,
            health,
            type: cardData.Type || '',
            
            // Removal capabilities
            removal: this.parseRemoval(desc),
            
            // Card advantage
            draw: this.parseDraw(desc),
            conjure: this.parseConjure(desc),
            tutoring: /search|fetch|tutor|get.*from/i.test(desc),
            
            // Damage
            burn: this.parseBurn(desc),
            direct_damage: /damage.*hero|strike.*hero/i.test(desc),
            
            // Token/Summon
            token: this.parseToken(desc),
            summon: /make\ a|create\ a|summon/i.test(desc),
            
            // Modification
            buff: this.parseBuff(desc, strength, health),
            debuff: this.parseDebuff(desc),
            
            // Mechanics
            evolution: /evolution:/i.test(desc),
            triggered: /when|play this|at the start/i.test(desc),
            combo: /combo/i.test(desc),
            
            // Resources
            cost_reduction: /cost.*less|reduce.*cost|free|costs nothing/i.test(desc),
            healing: /heal|gain.*health|restore/i.test(desc),
            
            // Tribes
            tribes: this.parseTribes(type),
            
            // Keywords
            keywords: this.parseKeywords(desc),
            
            // Role tags
            tags: this.generateTags(cardData),
            
            // Curve classification
            curve_tier: this.classifyCurve(cost),
            
            // Raw description for fallback
            description: cardData.Description || ''
        };
    }

    parseRemoval(desc) {
        const types = [];
        if (/destroy|eliminate|kill|sacrifice/i.test(desc)) types.push('hard');
        if (/bounce|return to hand|shuffle/i.test(desc)) types.push('soft');
        if (/freeze|stun|block|lock/i.test(desc)) types.push('freeze');
        if (/\-\d+\/\-\d+|weaken|reduce/i.test(desc)) types.push('debuff');
        
        if (types.length === 0) return null;
        if (types.length === 1) return { type: types[0], aoe: /all|every/i.test(desc) };
        return { types, aoe: /all|every/i.test(desc) };
    }

    parseDraw(desc) {
        if (!/draw|card advantage|peek|reveal/i.test(desc)) return false;
        const match = desc.match(/draw\s+(\d+)/);
        return match ? parseInt(match[1]) : true;
    }

    parseConjure(desc) {
        if (!/conjure/i.test(desc)) return false;
        const match = desc.match(/conjure\s+(.+?)(?:\.|,|$)/);
        return match ? match[1] : true;
    }

    parseBurn(desc) {
        const match = desc.match(/(\d+)\s+damage/);
        return match ? parseInt(match[1]) : 0;
    }

    parseToken(desc) {
        if (!/make|create|conjure|duplicate|copy|spawn/i.test(desc)) return false;
        const match = desc.match(/(\d+)\s+(?:token|copies?|plants?|zombies?)/);
        return match ? parseInt(match[1]) : true;
    }

    parseBuff(desc, strength, health) {
        const match = desc.match(/\+(\d+)\/\+(\d+)/);
        if (match) {
            return { strength: parseInt(match[1]), health: parseInt(match[2]), global: /all|team/i.test(desc) };
        }
        return null;
    }

    parseDebuff(desc) {
        const match = desc.match(/\-(\d+)\/\-(\d+)/);
        if (match) {
            return { strength: parseInt(match[1]), health: parseInt(match[2]) };
        }
        return null;
    }

    parseTribes(typeString) {
        const tribes = [];
        const tribeList = ['Bean', 'Mushroom', 'Nut', 'Fruit', 'Root', 'Flower',
                          'Zombie', 'Pirate', 'Sports', 'Science', 'Professional',
                          'Pet', 'Animal', 'Dancing', 'Gourmet', 'Imp', 'Flag', 'Robot'];
        
        for (const tribe of tribeList) {
            if (typeString.includes(tribe.toLowerCase())) tribes.push(tribe);
        }
        return tribes;
    }

    parseKeywords(desc) {
        const keywords = [];
        const keywordPatterns = {
            bullseye: /bullseye/i,
            strikethrough: /strikethrough/i,
            teamup: /team-up|team up/i,
            amphibious: /amphibious/i,
            splash: /splash|neighboring/i,
            frenzy: /frenzy/i,
            armored: /armor|protected/i,
            frozen: /frozen|stun/i,
            leafling: /leafling/i,
            mummy: /mummy/i,
            sneaky: /sneaky/i,
            guardian: /guardian/i
        };
        
        for (const [kw, pattern] of Object.entries(keywordPatterns)) {
            if (pattern.test(desc)) keywords.push(kw);
        }
        return keywords;
    }

    generateTags(cardData) {
        const tags = [];
        const desc = (cardData.Description || '').toLowerCase();
        const cost = cardData.Cost || 0;
        const strength = cardData.Strength || 0;
        const health = cardData.Health || 0;

        if (cost <= 1) tags.push('cheap');
        if (cost <= 2) tags.push('early_game');
        if (cost >= 6) tags.push('late_game');
        if (strength >= 5 && health >= 5) tags.push('large_finisher');
        if (strength >= 7 || health >= 7) tags.push('threat');
        if (/draw|conjure|trick/i.test(desc)) tags.push('card_advantage');
        if (/destroy|remove/i.test(desc)) tags.push('removal');
        if (/evolution:/i.test(desc)) tags.push('evolution_enabler');
        if (/make|create|token/i.test(desc)) tags.push('token_generator');
        if (/heal|gain.*health/i.test(desc)) tags.push('healing');

        return tags;
    }

    classifyCurve(cost) {
        if (cost <= 2) return 'early';
        if (cost <= 4) return 'mid';
        return 'late';
    }

    getCard(cardName) {
        return this.normalizedCards.get(cardName) || null;
    }

    getAllNormalized() {
        return new Map(this.normalizedCards);
    }

    findByTag(tag) {
        const matches = [];
        for (const [name, card] of this.normalizedCards.entries()) {
            if (card.tags.includes(tag)) matches.push(name);
        }
        return matches;
    }

    findByTribe(tribe) {
        const matches = [];
        for (const [name, card] of this.normalizedCards.entries()) {
            if (card.tribes.includes(tribe)) matches.push(name);
        }
        return matches;
    }

    findByAbility(abilityKey) {
        const matches = [];
        for (const [name, card] of this.normalizedCards.entries()) {
            if (card[abilityKey]) matches.push(name);
        }
        return matches;
    }
}

module.exports = CardNormalizer;
