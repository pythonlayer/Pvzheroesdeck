// --- Global Variables ---
let fullDatabase = {};
let cardDatabase = {};

let charts = {
    topCards: null,
    deckPresence: null,
    timeline: null,
    pairs: null,        // NEW
    buzzwords: null     // NEW
};

const heroMap = {
    // Plants
    "Mega-Grow,Smarty": "Green Shadow",
    "Kabloom,Solar": "Solar Flare",
    "Guardian,Solar": "Wall-Knight",
    "Mega-Grow,Solar": "Chompzilla",
    "Guardian,Kabloom": "Spudow",
    "Guardian,Smarty": "Citron / Beta-Carrotina",
    "Guardian,Mega-Grow": "Grass Knuckles",
    "Kabloom,Smarty": "Nightcap",
    "Kabloom,Mega-Grow": "Captain Combustible",
    "Smarty,Solar": "Rose",

    // Zombies
    "Brainy,Sneaky": "Super Brainz / Huge-Gigantacus",
    "Beastly,Hearty": "The Smash",
    "Crazy,Sneaky": "Impfinity",
    "Brainy,Hearty": "Rustbolt",
    "Beastly,Crazy": "Electric Boogaloo",
    "Beastly,Sneaky": "Brain Freeze",
    "Brainy,Crazy": "Professor Brainstorm",
    "Beastly,Brainy": "Immorticia",
    "Crazy,Hearty": "Z-Mech",
    "Hearty,Sneaky": "Neptuna"
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Random Funny Adjectives ---
    const adjectives = [
        "glorious",
        "delicious",
        "unhinged",
        "questionable",
        "spicy",
        "illegal",
        "sweaty",
        "bricked",
        "starchy", // A little Starch Lord nod
        "absolutely stacked",
        "big brain",
        "toxic",
        "beautiful",
        "chaotic",
        "cursed",
        "devious",
        "high-rolling",
        "diabolical",
        "scrumptious",
        "Weenie Beanie approved",
        "legendary",
        "mildly infuriating",
        "tryhard",
        "S-tier",
        "Ra Zombie approved"
    ];

    // Pick a random adjective and inject it
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const adjElement = document.getElementById('randomAdjective');
    if (adjElement) {
        adjElement.textContent = randomAdj;
    }
    // --- DOM Elements ---
    const deckGrid = document.getElementById('deckGrid');
    const loadingEl = document.getElementById('loading');
    const deckCountEl = document.getElementById('deckCount');
    const searchInput = document.getElementById('searchInput');

    // Modal Elements
    const infoModal = document.getElementById('infoModal');
    
    const closeModal = document.getElementById('closeModal');

    // View/Tab Elements
    const deckView = document.getElementById('deckView');
    const statsView = document.getElementById('statsView');
    const guidesView = document.getElementById('guidesView');
    const tiersView = document.getElementById('tiersView');
    const moreMenu = document.querySelector('.home-menu-more');
    const searchWrapper = document.getElementById('searchWrapper');
    const statsBtn = document.getElementById('statsBtn');
    const guidesBtn = document.getElementById('guidesBtn');
    const moreBtn = document.getElementById('moreBtn');
    const tiersBtn = document.getElementById('tiersBtn');
    const backBtn = document.getElementById('backBtn');
    const crafterBtn = document.getElementById('crafterBtn');
    const finderBtn = document.getElementById('finderBtn');
    const crafterView = document.getElementById('crafterView');
    const finderView = document.getElementById('finderView');
    const gamesView = document.getElementById('gamesView');
    const gamesBtn = document.getElementById('gamesBtn');
    const synergyEasterEgg = document.getElementById('synergyEasterEgg');
    const synergyView = document.getElementById('synergyView');
    const collectionView = document.getElementById('collectionView');
    const collectionPageBtn = document.getElementById('collectionPageBtn');

    // --- Fetch Database ---
    // --- 1. SET UP A "DATA LOADED" FLAG ---
    let isDataLoaded = false;

    // --- 2. YOUR FETCH CALLS (Slightly updated) ---
    // We use Promise.all to wait for BOTH JSON files to finish downloading
    Promise.all([
        fetch('deck_database_final.json').then(res => {
            if (!res.ok) throw new Error("Could not load the database file.");
            return res.json();
        }),
        fetch('card_data.json').then(res => {
            if (!res.ok) throw new Error("Could not load the card data file.");
            return res.json();
        })
    ])
        .then(([deckData, cardData]) => {
            // Both files are successfully downloaded!
            fullDatabase = deckData;
            cardDatabase = cardData;

            loadingEl.style.display = 'none';
            const totalDecks = Object.keys(deckData).length;
            deckCountEl.textContent = totalDecks.toLocaleString();

            // We set our flag to true, meaning it is safe to draw charts now.
            isDataLoaded = true;

            // Kick off the initial render of the main deck list
            renderDecks(fullDatabase);

            // KICK OFF THE ROUTER NOW THAT WE HAVE DATA!
            handleRouting();
            renderSeeds(); // Initial render to show empty state
        })
        .catch(error => {
            loadingEl.textContent = `Error loading data: ${error.message}`;
            console.error("Fetch error:", error);
        });
    const gradeFilter = document.getElementById('gradeFilter');
    function handleRouting() {
        // IMPORTANT: If the data hasn't finished downloading yet, stop right here!
        if (!isDataLoaded) return;

        const hash = window.location.hash || '#home';

        // 1. Hide absolutely everything first
        if (moreMenu) moreMenu.classList.add('hidden');
        gradeFilter.classList.add('hidden');
        deckView.classList.add('hidden');
        statsView.classList.add('hidden');
        statsView.classList.remove('stats-visible');
        tiersView.classList.add('hidden');
        guidesView.classList.add('hidden');
        crafterView.classList.add('hidden');
        finderView.classList.add('hidden');
        gamesView.classList.add('hidden');
        searchWrapper.classList.add('hidden');
        statsBtn.classList.add('hidden');
        guidesBtn.classList.add('hidden');
        crafterBtn.classList.add('hidden');
        finderBtn.classList.add('hidden');
        gamesBtn.classList.add('hidden');
        tiersBtn.classList.add('hidden');
        synergyView.classList.add('hidden');
        if (collectionView) collectionView.classList.add('hidden');

        if (typeof backBtn !== 'undefined') backBtn.classList.add('hidden');

        // 2. Determine what to show based on the hash & Update Titles
        if (hash === '#stats') {
            statsView.classList.remove('hidden');
            if (typeof backBtn !== 'undefined') backBtn.classList.remove('hidden');

            const currentLimit = document.getElementById('deckLimitFilter') ? document.getElementById('deckLimitFilter').value : 'all';
            if (typeof renderStatsChart === 'function') renderStatsChart(currentLimit);

        } else if (hash === '#crafter') {
            crafterView.classList.remove('hidden');
            if (typeof backBtn !== 'undefined') backBtn.classList.remove('hidden');

        } else if (hash === '#games') {
            gamesView.classList.remove('hidden');
            if (typeof backBtn !== 'undefined') backBtn.classList.remove('hidden');
            if (typeof renderGames === 'function') renderGames();

        } else if (hash === '#synergy') {
            synergyView.classList.remove('hidden');
            if (typeof backBtn !== 'undefined') backBtn.classList.remove('hidden');
            if (typeof renderSynergyWeb === 'function') renderSynergyWeb();

        } else if (hash === '#tiers') {
            tiersView.classList.remove('hidden');
            if (typeof backBtn !== 'undefined') backBtn.classList.remove('hidden');
            if (typeof renderTiers === 'function') renderTiers();

        } else if (hash === '#guides') {
            guidesView.classList.remove('hidden');
            if (typeof backBtn !== 'undefined') backBtn.classList.remove('hidden');
        } 
        else if (hash === '#finder') {
            finderView.classList.remove('hidden');
            if (typeof backBtn !== 'undefined') backBtn.classList.remove('hidden');
            resetFinderDeckCache();
            queueFinderRecommendation(100);
        }
        else if (hash === '#collection') {
            if (collectionView) collectionView.classList.remove('hidden');
            if (typeof backBtn !== 'undefined') backBtn.classList.remove('hidden');
            if (typeof renderCollectionPage === 'function') renderCollectionPage();
        }
        else {
            // Default Home UI
            deckView.classList.remove('hidden');
            searchWrapper.classList.remove('hidden');
            statsBtn.classList.remove('hidden');
            guidesBtn.classList.remove('hidden');
            tiersBtn.classList.remove('hidden');
            crafterBtn.classList.remove('hidden');
            finderBtn.classList.remove('hidden');
            gamesBtn.classList.remove('hidden');
            gradeFilter.classList.remove('hidden');
            if (moreMenu) moreMenu.classList.remove('hidden');

        }

        // 3. CRITICAL CHANGE: Track the page view AFTER the DOM and titles have updated
        trackPageView(hash);
    }

    function trackPageView(hash) {
        if (!window.gtag) return;

        const pageSlug = (hash || '#home').replace('#', '');
        const cleanPath = '/' + pageSlug;

        // Construct a flawless virtual URL structure using the URL API
        const virtualLocation = new URL(window.location.href);
        virtualLocation.pathname = cleanPath; // Replaces the root path with the virtual one (e.g., /stats)
        virtualLocation.hash = '';            // Strips the hash entirely so GA4 doesn't get confused

        gtag('event', 'page_view', {
            page_path: cleanPath,
            page_title: document.title,
            page_location: virtualLocation.href // Sends: https://yourdomain.com/stats
        });
    }
    // --- Helper Functions ---
    function getYouTubeId(url) {
        if (!url) return null;
        const match = url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    function parseCardEntry(cardString) {
        if (!cardString || typeof cardString !== "string") return null;
        const parts = cardString.trim().split(/\s+/);
        if (parts.length === 0 || !parts[0]) return null;

        let count = 1;
        let nameParts = parts;
        const first = parts[0];
        const m1 = first.match(/^x(\d+)$/i);
        const m2 = first.match(/^(\d+)x$/i);
        const m3 = first.match(/^(\d+)$/);

        if (m1) { count = parseInt(m1[1], 10); nameParts = parts.slice(1); }
        else if (m2) { count = parseInt(m2[1], 10); nameParts = parts.slice(1); }
        else if (m3 && parts.length > 1) { count = parseInt(m3[1], 10); nameParts = parts.slice(1); }

        const rawName = nameParts.join(" ").trim();
        if (!rawName) return null;

        const name = rawName.replace(/_/g, " ").replace(/\s+/g, " ").trim();
        const key = name.replace(/ /g, "_");
        return { name, key, count: Number.isFinite(count) ? count : 1 };
    }

    let _verdictContext = null;
    let _verdictContextSource = null;

    function getVerdictContext() {
        if (_verdictContext && _verdictContextSource === fullDatabase) return _verdictContext;

        const ctx = { cardPopularity: {}, maxMetaCopies: 0, dbDecks: {} };
        if (typeof fullDatabase === "undefined") {
            _verdictContext = ctx;
            _verdictContextSource = fullDatabase;
            return ctx;
        }

        const now = Date.now();
        // Set your half-life here (in days). 
        // 365 means a deck from 1 year ago is worth half as much "Power" as a deck uploaded today.
        const HALF_LIFE_DAYS = 365;

        for (const deckKey in fullDatabase) {
            const dbDeck = fullDatabase[deckKey];
            if (!dbDeck || !Array.isArray(dbDeck.cards)) continue;

            // --- Time Decay Calculation ---
            let timeWeight = 1;
            if (dbDeck.upload_date) {
                const deckDate = new Date(dbDeck.upload_date).getTime();
                if (!isNaN(deckDate)) {
                    // Calculate days elapsed (Math.max caps it at 0 to avoid future-date timezone bugs)
                    const daysAgo = Math.max(0, (now - deckDate) / (1000 * 60 * 60 * 24));
                    timeWeight = Math.pow(0.5, daysAgo / HALF_LIFE_DAYS);
                }
            }

            const seedCounts = new Map(); // spaced name -> count (used for overlap)
            let dbTotalCards = 0;
            const dbCurve = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, "6+": 0 };

            for (const cardString of dbDeck.cards) {
                // EXACT live-builder parsing — do not "improve" this
                const parts = (cardString || "").split(" ");
                if (parts.length < 2) continue;

                const count = parseInt(parts[0].replace('x', '')) || 0;
                const copiesPower = parseInt(parts[0].replace('x', '')) || 1;
                const rawName = parts.slice(1).join(" ");
                const cleanName = rawName.replace(/_/g, ' ');

                seedCounts.set(cleanName, (seedCounts.get(cleanName) || 0) + count);
                dbTotalCards += count;

                // Multiply the raw copies by the timeWeight so old decks have less impact on the meta
                ctx.cardPopularity[cleanName] = (ctx.cardPopularity[cleanName] || 0) + (copiesPower * timeWeight);

                // Mirror the live builder's cost lookup EXACTLY, including the
                // "NaN cost falls to 6+" quirk. Do NOT normalize NaN to 1 here.
                const cardData = cardDatabase[cleanName] || cardDatabase[rawName];
                const cost = cardData ? parseInt(cardData.Cost) : 1;

                if (cost <= 1) dbCurve[1] += count;
                else if (cost === 2) dbCurve[2] += count;
                else if (cost === 3) dbCurve[3] += count;
                else if (cost === 4) dbCurve[4] += count;
                else if (cost === 5) dbCurve[5] += count;
                else dbCurve["6+"] += count;
            }

            if (dbTotalCards === 0) continue;

            ctx.dbDecks[deckKey] = {
                seedCounts,
                totalCards: dbTotalCards,
                shape: [
                    dbCurve[1] / dbTotalCards,
                    dbCurve[2] / dbTotalCards,
                    dbCurve[3] / dbTotalCards,
                    dbCurve[4] / dbTotalCards,
                    dbCurve[5] / dbTotalCards,
                    dbCurve["6+"] / dbTotalCards,
                ],
            };
        }

        const metaValues = Object.values(ctx.cardPopularity);
        ctx.maxMetaCopies = metaValues.length > 0 ? Math.max(...metaValues) : 0;

        _verdictContext = ctx;
        _verdictContextSource = fullDatabase;
        return ctx;
    }

    function getDeckVerdictFromCards(deckCards, selfDeckKey, ctx) {
        if (typeof initSynergyMatrix === "function") {
            initSynergyMatrix();
        }
        ctx = ctx || getVerdictContext();

        // --- Parse own deck ---
        const seedMap = new Map(); // name -> {name, key, count, cost}
        for (const cardString of deckCards || []) {
            const parsed = parseCardEntry(cardString);
            if (!parsed) continue;
            const { name, key, count } = parsed;

            const existing = seedMap.get(name) || { name, key, count: 0, cost: 1 };
            existing.count += count;
            const cardData = cardDatabase?.[key] || cardDatabase?.[name] || {};
            const parsedCost = parseInt(cardData.Cost, 10);
            existing.cost = Number.isFinite(parsedCost) ? parsedCost : 1;
            seedMap.set(name, existing);
        }
        const seeds = [...seedMap.values()];

        // --- Totals, curve, sparks, synergy ---
        let totalCards = 0, totalCost = 0, totalSparks = 0, totalConnection = 0, totalDepth = 0;
        const curve = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, "6+": 0 };
        const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

const seedKeys = seeds.map(s => s.key);

function getRawPairSynergy(cardA, cardB) {
    const coOccurrences = synergyMatrix?.[cardA]?.[cardB] || 0;
    if (coOccurrences <= 0) {
        return {
            cs: 0,
            coOccurrences: 0,
            freqA: 1,
            freqB: 1,
            minCardFreq: 1
        };
    }

    const freqA = cardFrequencies?.[cardA] || 1;
    const freqB = cardFrequencies?.[cardB] || 1;

    return {
        cs: coOccurrences / Math.sqrt(freqA * freqB),
        coOccurrences,
        freqA,
        freqB,
        minCardFreq: Math.min(freqA, freqB)
    };
}

function countSupportedPartners(card, deckKeys) {
    let supported = 0;

    deckKeys.forEach(other => {
        if (other === card) return;

        const data = getRawPairSynergy(card, other);

        // This is deliberately lenient.
        // A rare archetype should count as supported if its cards repeatedly appear together.
        if (data.coOccurrences >= 2 && data.cs >= 0.32) {
            supported++;
        }
    });

    return supported;
}

const deckKeys = seeds.map(s => s.key);

function getPairStats(cardA, cardB) {
    const coOccurrences = synergyMatrix?.[cardA]?.[cardB] || 0;

    const freqA = cardFrequencies?.[cardA] || 1;
    const freqB = cardFrequencies?.[cardB] || 1;

    const cs = coOccurrences > 0
        ? coOccurrences / Math.sqrt(freqA * freqB)
        : 0;

    return {
        cs,
        coOccurrences,
        freqA,
        freqB,
        minCardFreq: Math.min(freqA, freqB)
    };
}

function countRealPartners(card) {
    let partners = 0;

    deckKeys.forEach(other => {
        if (other === card) return;

        const p = getPairStats(card, other);

        // Lenient on purpose.
        // This allows legit rare packages to count as real strategies.
        if (p.coOccurrences >= 2 && p.cs >= 0.30) {
            partners++;
        }
    });

    return partners;
}

let suspiciousRareCopies = 0;
        seeds.forEach(seedA => {
            totalCards += seedA.count;
            const cost = seedA.cost || 1;
            totalCost += cost * seedA.count;

            const cardData = cardDatabase?.[seedA.key] || cardDatabase?.[seedA.name] || {};
            const rarity = cardData.Rarity || "Common";
            let sparks = 0;
            if (rarity === "Uncommon") sparks = 50;
            else if (rarity === "Rare") sparks = 250;
            else if (rarity === "Super-Rare" || rarity === "Event") sparks = 1000;
            else if (rarity === "Legendary") sparks = 4000;
            totalSparks += sparks * seedA.count;

            if (cost <= 1) curve[1] += seedA.count;
            else if (cost === 2) curve[2] += seedA.count;
            else if (cost === 3) curve[3] += seedA.count;
            else if (cost === 4) curve[4] += seedA.count;
            else if (cost === 5) curve[5] += seedA.count;
            else curve["6+"] += seedA.count;

          

            const partnerScores = [];
            seeds.forEach(seedB => {
                if (seedA.key === seedB.key) return;

                const pair = getPairStats(seedA.key, seedB.key);

partnerScores.push({
    key: seedB.key,
    cs: pair.cs,
    coOccurrences: pair.coOccurrences,
    minCardFreq: pair.minCardFreq
});
            });

            partnerScores.sort((a, b) => b.cs - a.cs);

            const best = partnerScores[0]?.cs || 0;
            const second = partnerScores[1]?.cs || 0;
            const freqA = cardFrequencies?.[seedA.key] || 1;
const realPartnersA = countRealPartners(seedA.key);
const bestPair = partnerScores[0];

const isIsolatedRareCard =
    freqA < 8 &&
    realPartnersA < 2 &&
    bestPair &&
    bestPair.coOccurrences <= 3 &&
    best > 0.65;

// Count copies, because 4x + 4x of fake rare cards should matter more than 1x.
if (isIsolatedRareCard) {
    suspiciousRareCopies += seedA.count;
}

            // tiny 3-card bonus
            let triadBonus = 0;
            if (partnerScores.length >= 2) {
                const k1 = partnerScores[0].key;
                const k2 = partnerScores[1].key;

                const cs12 = getPairStats(k1, k2).cs;

                triadBonus = 0.15 * Math.min(best, second, cs12);
            }

            // weighted local cluster score
            const localClusterScore = (0.7 * best) + (0.25 * second) + triadBonus;
            totalConnection += localClusterScore * seedA.count;

            // track how much the 2nd partner supports the 1st
            const depthRatio = best > 0 ? Math.min(1, second / best) : 0;
            totalDepth += depthRatio * seedA.count;
        });

        const avgCost = totalCards > 0 ? totalCost / totalCards : 0;
        const avgSparks = totalCards > 0 ? totalSparks / totalCards : 0;

        let costLabel = "Budget";
        if (avgSparks <= 250) costLabel = "Budget";
        else if (avgSparks <= 600) costLabel = "Moderate";
        else if (avgSparks <= 1400) costLabel = "Expensive";
        else costLabel = "P2W";

      // --- Synergy ---
let synergyScore = 0;
let synergyRaw = 0;
let synergyDepth = 0;

if (totalCards > 0 && seeds.length > 1) {
    const rawAvg = totalConnection / totalCards;
    const depthAvg = totalDepth / totalCards;

    synergyRaw = rawAvg;
    synergyDepth = depthAvg;

    const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

    /*
        Calibration after removing momentum from initSynergyMatrix:

        rawAvg around 0.35 = weak
        rawAvg around 0.50 = decent
        rawAvg around 0.60 = good
        rawAvg around 0.68+ = excellent
    */
    const connectionScore = clamp(
        ((rawAvg - 0.27) / (0.68 - 0.27)) * 100,
        0,
        100
    );

    /*
        Depth is secondary. It should help complete decks,
        but it should not completely carry a mediocre pile.
    */
    const depthScore = clamp(
        ((depthAvg - 0.35) / (0.85 - 0.35)) * 100,
        0,
        100
    );

    synergyScore = Math.round(
        (connectionScore * 0.82) +
        (depthScore * 0.18)
    );

    // Softer caps than the harsh version.
    // These prevent random piles from getting elite scores,
    // but they don't crush genuinely good decks.
    if (rawAvg < 0.35) {
        synergyScore = Math.min(synergyScore, 60);
    } else if (rawAvg < 0.45) {
        synergyScore = Math.min(synergyScore, 73);
    } else if (rawAvg < 0.55) {
        synergyScore = Math.min(synergyScore, 84);
    } else if (rawAvg < 0.62) {
        synergyScore = Math.min(synergyScore, 92);
    }

    // Shallow deck penalty, but not too brutal.
    if (depthAvg < 0.38) {
        synergyScore = Math.min(synergyScore, 75);
    } else if (depthAvg < 0.48) {
        synergyScore = Math.min(synergyScore, 86);
    }

    // Small elite bonus only when both pair strength and depth are good.
    if (rawAvg >= 0.62 && depthAvg >= 0.68) {
        synergyScore += 3;
    }
    const suspiciousRareRatio = totalCards > 0
    ? suspiciousRareCopies / totalCards
    : 0;

// Only cap when isolated rare cards are a meaningful part of the deck.
// This does NOT punish legit rare strategies with multiple internal partners.
if (suspiciousRareRatio >= 0.25) {
    synergyScore = Math.min(synergyScore, 72);
} else if (suspiciousRareRatio >= 0.15) {
    synergyScore = Math.min(synergyScore, 82);
} else if (suspiciousRareRatio >= 0.10) {
    synergyScore = Math.min(synergyScore, 88);
}

    synergyScore = clamp(Math.round(synergyScore), 0, 100);

    if (totalCards < 6) {
        synergyScore = Math.round(synergyScore * (totalCards / 6));
    }
} else if (totalCards === 1) {
    synergyScore = 5;
}

        // --- Consistency ---
        let consistencyScore = 0;
        if (totalCards > 0 && seeds.length > 0) {
            let pts = 0;
            seeds.forEach(s => {
                if (s.count === 1) pts += 0;
                else if (s.count === 2) pts += 50;
                else if (s.count === 3) pts += 80;
                else if (s.count >= 4) pts += 100;
            });
            consistencyScore = Math.round(pts / seeds.length);
        }

      // --- Power (uses precomputed popularity, with smarter weak-card penalty) ---
let powerScore = 0;

if (totalCards > 0 && ctx.maxMetaCopies > 0) {
    const curveFactor = 1;
    const scaleFactor = 2.7;

    const scoredCards = seeds.map(seed => {
        const metaCopies = ctx.cardPopularity[seed.name] || 0;
        const rawRatio = metaCopies / ctx.maxMetaCopies;

        return {
            name: seed.name,
            count: seed.count,
            score: Math.pow(rawRatio, curveFactor) * 100
        };
    });

    // Original mean-based score
    const averageRaw =
        scoredCards.reduce((sum, card) => sum + card.score * card.count, 0) / totalCards;

    const baseScore = Math.min(100, averageRaw * scaleFactor);

    // Only penalize cards that are truly weak relative to the deck
    // Example: if avg raw is 40, weak threshold is 16.
    const weakThreshold = averageRaw * 0.4;

    let badnessPoints = 0;

    scoredCards.forEach(card => {
        if (card.score < weakThreshold) {
            const badnessRatio = (weakThreshold - card.score) / weakThreshold;

            // Penalize by copies, but softly
            badnessPoints += badnessRatio * card.count;
        }
    });

    const badnessPerCard = badnessPoints / totalCards;

    // Mild penalty. Max usually around 0–8 points, not 20+.
    const weakCardPenalty = badnessPerCard * 15;

    powerScore = Math.round(
        Math.max(0, baseScore - weakCardPenalty)
    );
}

        // --- Curve health (full archetype envelope, like the live builder) ---
        let curveHealthText = "...";
        let curveNumeric = 55;

        if (totalCards >= 10) {
            const userShape = [
                curve[1] / totalCards, curve[2] / totalCards, curve[3] / totalCards,
                curve[4] / totalCards, curve[5] / totalCards, curve["6+"] / totalCards,
            ];

            const userSeedCounts = new Map();
            seeds.forEach(s => userSeedCounts.set(s.name, s.count));

            const dbComparisons = [];
            let exactCopyAdded = false; // Flag to track exact card-for-card matches

            for (const dbKey in ctx.dbDecks) {

                const db = ctx.dbDecks[dbKey];
                let overlap = 0;
                // iterate the smaller side
                const [a, b] = userSeedCounts.size < db.seedCounts.size
                    ? [userSeedCounts, db.seedCounts]
                    : [db.seedCounts, userSeedCounts];
                for (const [name, c] of a) {
                    const other = b.get(name);
                    if (other !== undefined) overlap += Math.min(c, other);
                }

                // EXACT CARD COPY RULE:
                // If the matched cards equal totalCards AND both decks have the exact same number of unique cards
                if (overlap === totalCards && userSeedCounts.size === db.seedCounts.size) {
                    if (exactCopyAdded) {
                        continue; // We already have our 1 exact copy, skip this one
                    }
                    exactCopyAdded = true;
                }

                if (overlap >= 6) dbComparisons.push({ overlap, shape: db.shape });
            }

            dbComparisons.sort((a, b) => b.overlap - a.overlap);

            let closestDecks = [];
            if (dbComparisons.length > 0) {
                const best = dbComparisons[0].overlap;
                closestDecks = dbComparisons.filter(d => d.overlap >= best * 0.85).slice(0, 10);
                if (closestDecks.length < 4 && dbComparisons.length >= 4) {
                    closestDecks = dbComparisons.slice(0, 4);
                }
            }

            if (closestDecks.length > 0) {
                let totalWeight = 0;
                closestDecks.forEach(d => totalWeight += d.overlap);

                const idealShape = [0, 0, 0, 0, 0, 0];
                closestDecks.forEach(d => {
                    const w = d.overlap / totalWeight;
                    for (let i = 0; i < 6; i++) idealShape[i] += d.shape[i] * w;
                });

                const tolerance = 0.05;
                let totalPenalty = 0;
                for (let i = 0; i < 6; i++) {
                    const diff = Math.abs(userShape[i] - idealShape[i]);
                    if (diff > tolerance) totalPenalty += diff - tolerance;
                }
                const deviationPercent = (totalPenalty / 6) * 100;

                if (deviationPercent <= 2.0) { curveHealthText = "Excellent"; curveNumeric = 100; }
                else if (deviationPercent <= 3.0) { curveHealthText = "Good"; curveNumeric = 80; }
                else if (deviationPercent <= 5.0) { curveHealthText = "Playable"; curveNumeric = 55; }
                else { curveHealthText = "Awkward"; curveNumeric = 20; }
            } else {
                curveHealthText = "Unique";
                curveNumeric = 65;
            }
        }

        // --- Verdict ---
        const base = (curveNumeric * 0.3) + (synergyScore * 0.375) + (powerScore * 0.275) + (consistencyScore * 0.05);
        const consistencyPenalty = consistencyScore < 70 ? (70 - consistencyScore) * 0.8 : 0;
        const powerPenalty = powerScore < 60 ? (60 - powerScore) * 0.2 : 0;
        const overallPercent = Math.max(0, base - consistencyPenalty - powerPenalty);
        const allTopTier = curveNumeric >= 87.5 && synergyScore >= 87.5 && consistencyScore >= 87.5 && powerScore >= 87.5;

        const { grade, gradeColor } = getVerdictGrade(overallPercent, allTopTier, totalCards);
        return { grade, gradeColor, score: overallPercent, costLabel, synergyScore, consistencyScore, powerScore, avgCost, curveHealthText, curve, avgSparks, curveNumeric };
    }


   /* ============================================================
   DECK FINDER — COMPLETE CONSOLIDATED BUILD (V4)
   ============================================================
   This file REPLACES your entire smart-search / finder script
   block (everything from "Deck Finder Smart Search" down to and
   including initDeckFinderSmartSearch(); keep getTopDecksByMonth
   if you use it — a copy is included at the bottom).

   Contains, deduplicated and merged:
   - Smart key search (v2 scoring + token-consuming parser)
   - Card/tribe/rarity/set/cost keys with database watcher +
     card_data.json fetch fallback (v2.1)
   - avgCost-anchored deck profiling + named packages (v2)
   - Intent-differentiated recommendation scoring (v2)
   - Inline always-open deck sheet renderer (v3.1) WITH all of
     its helper functions this time (finderBuildHeroes etc.)

   New in V4:
   - KEYWORD keys: search by card ability ("frenzy", "bounce",
     "deadly", "amphibious", "gravestone tricks"...)
   - AUTHOR keys: "FryEmUp decks" etc., built from fullDatabase
   - RECENCY key: "new" / "recent" / "latest" prefers fresh decks
   - Click a parsed term chip to REMOVE it from the search
   - Alias index: parsing is O(tokens) instead of O(all keys)
     per keystroke
   - Per-card search text is cached (big speedup for profiles)
   - compileFinderDeck now keeps verdict.gradeColor
   - Debug console tables only print when window.FINDER_DEBUG = true

   Removed dead code: submitFinderSearch, finderDeckMatchesTerm,
   estimateFinderDeckSpeed, getFinderReasons/displayFinderTerm
   (reasons are no longer rendered), the old result-element refs
   (finderResultName/Meta/Grade/Reasons, finderViewDeckBtn,
   finderOpenBuilderBtn, finderTryAgainBtn), and the duplicate
   copies of every function that had been patched over.
   ============================================================ */

/* ============================================================
   SECTION 1 — DOM refs & state
   ============================================================ */

const finderSearchInput = document.getElementById("finderSearchInput");
const finderSuggestions = document.getElementById("finderSuggestions");
const finderParsedTerms = document.getElementById("finderParsedTerms");
const finderResult = document.getElementById("finderResult");

let finderKeyIndex = [];
let finderAliasIndex = new Map();   // first token -> [{key, aliasTokens, chars}]
let finderSelectedKeys = [];

let finderDeckCache = null;
let finderRecommendTimer = null;
let finderCurrentResults = [];
let finderRerollIndex = 0;
let finderLastQuery = "";

let finderCardKeysLoaded = false;
let finderAuthorKeysLoaded = false;
let finderCardDataFetchStarted = false;

/* Override before this script if your JSON lives elsewhere:
   window.FINDER_CARD_DATA_URL = "/data/card_data.json"; */
const FINDER_CARD_DATA_URL_DEFAULT = "card_data.json";

const FINDER_HERO_MAP = {
    "Mega-Grow,Smarty": "Green Shadow",
    "Kabloom,Solar": "Solar Flare",
    "Guardian,Solar": "Wall-Knight",
    "Mega-Grow,Solar": "Chompzilla",
    "Guardian,Kabloom": "Spudow",
    "Guardian,Smarty": "Citron / Beta-Carrotina",
    "Guardian,Mega-Grow": "Grass Knuckles",
    "Kabloom,Smarty": "Nightcap",
    "Kabloom,Mega-Grow": "Captain Combustible",
    "Smarty,Solar": "Rose",

    "Brainy,Sneaky": "Super Brainz / Huge-Gigantacus",
    "Beastly,Hearty": "The Smash",
    "Crazy,Sneaky": "Impfinity",
    "Brainy,Hearty": "Rustbolt",
    "Beastly,Crazy": "Electric Boogaloo",
    "Beastly,Sneaky": "Brain Freeze",
    "Brainy,Crazy": "Professor Brainstorm",
    "Beastly,Brainy": "Immorticia",
    "Crazy,Hearty": "Z-Mech",
    "Hearty,Sneaky": "Neptuna"
};

const FINDER_SPARK_COSTS = {
    "common": 0,
    "basic": 0,
    "uncommon": 50,
    "rare": 250,
    "super rare": 1000,
    "super-rare": 1000,
    "event": 1000,
    "legendary": 4000
};

const FINDER_GRADE_COLORS = {
    "S": "#ffd54a", "A": "#7ddb63", "B": "#4dd0e1",
    "C": "#f0a24b", "D": "#f07f4b", "F": "#e05252", "?": "#9aa3ab"
};

/* ============================================================
   SECTION 2 — string helpers
   ============================================================ */

function normalizeSearch(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[_-]/g, " ")
        .replace(/['\u2019]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeKeyValue(value) {
    return normalizeSearch(value).replace(/\s+/g, "-");
}

function displayCardName(name) {
    return String(name || "")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function titleCase(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\b[a-z]/g, c => c.toUpperCase());
}

function pluralize(word) {
    const s = String(word || "").toLowerCase();
    if (s.endsWith("y")) return `${s.slice(0, -1)}ies`;
    if (s.endsWith("s")) return s;
    return `${s}s`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function clampFinder(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

function formatFinderSparks(value) {
    return Number(value || 0).toLocaleString();
}

function hasAny(text, terms) {
    return terms.some(term => text.includes(normalizeSearch(term)));
}

/* ============================================================
   SECTION 3 — static searchable keys
   ============================================================ */

const FINDER_STATIC_KEYS = [
    // Main intents
    { label: "Lawn Warz", type: "goal", value: "lawn-warz", aliases: ["lawn warz", "ranked", "climb", "ladder", "trophies", "grind"] },
    { label: "Strongest Deck", type: "goal", value: "strongest", aliases: ["best", "strongest", "meta", "top tier", "competitive", "s tier"] },
    { label: "Fun Deck", type: "goal", value: "fun", aliases: ["fun", "meme", "funny", "goofy", "silly", "random"] },

    // Budget
    { label: "Budget", type: "budget", value: "budget", aliases: ["budget", "cheap", "low cost", "low spark", "low sparks", "poor", "no legendary", "no legendaries"] },
    { label: "Super Budget", type: "budget", value: "super-budget", aliases: ["super budget", "very cheap", "starter", "beginner", "new player", "f2p", "free to play"] },
    { label: "P2W", type: "budget", value: "p2w", aliases: ["p2w", "expensive", "maxed", "high cost", "legendary", "legendaries", "crafted"] },

    // Recency
    { label: "New Decks", type: "recency", value: "new", aliases: ["new", "recent", "latest", "newest", "fresh", "this month"] },

    // Archetypes / playstyles
    { label: "Aggro", type: "archetype", value: "aggro", aliases: ["aggro", "rush", "fast", "quick", "early game", "smorc"] },
    { label: "Tempo", type: "archetype", value: "tempo", aliases: ["tempo", "midrange tempo", "pressure"] },
    { label: "Control", type: "archetype", value: "control", aliases: ["control", "late game", "slow", "defensive", "removal"] },
    { label: "Midrange", type: "archetype", value: "midrange", aliases: ["midrange", "balanced", "solid"] },
    { label: "Combo", type: "archetype", value: "combo", aliases: ["combo", "otk", "one turn kill", "setup"] },
    { label: "Swarm", type: "archetype", value: "swarm", aliases: ["swarm", "flood", "spam", "wide board", "many minions", "token", "tokens"] },
    { label: "Heal", type: "archetype", value: "heal", aliases: ["heal", "healing", "lifegain"] },
    { label: "Freeze", type: "archetype", value: "freeze", aliases: ["freeze", "frozen"] },
    { label: "Conjure", type: "archetype", value: "conjure", aliases: ["conjure", "random cards", "card generation"] },
    { label: "Ramp", type: "archetype", value: "ramp", aliases: ["ramp", "sun ramp", "more sun", "big cards"] },
    { label: "Tricks", type: "archetype", value: "tricks", aliases: ["tricks", "trick deck", "spell", "spells"] },
    { label: "Gravestone", type: "archetype", value: "gravestone", aliases: ["gravestone", "graves", "grave", "gravestones"] },
    { label: "Trickstache", type: "archetype", value: "trickstache", aliases: ["trickstache", "trick mustache", "mustache tricks"] },
    { label: "Cyclecap", type: "archetype", value: "cyclecap", aliases: ["cyclecap", "cycle cap", "cycle captain combustible", "cycle"] },

    // Extra static tribes (dynamic tribes also come from card Types)
    { label: "Science", type: "tribe", value: "science", aliases: ["science", "scientist"] },
    { label: "Pirate", type: "tribe", value: "pirate", aliases: ["pirate", "pirates"] },
    { label: "Sports", type: "tribe", value: "sports", aliases: ["sports", "sport"] },
    { label: "Dancing", type: "tribe", value: "dancing", aliases: ["dancing", "dance"] },
    { label: "Mustache", type: "tribe", value: "mustache", aliases: ["mustache", "moustache"] },
    { label: "Pet", type: "tribe", value: "pet", aliases: ["pet", "pets"] },
    { label: "Mushroom", type: "tribe", value: "mushroom", aliases: ["mushroom", "mushrooms", "shroom", "shrooms"] },
    { label: "Bean", type: "tribe", value: "bean", aliases: ["bean", "beans"] },
    { label: "Flower", type: "tribe", value: "flower", aliases: ["flower", "flowers"] },
    { label: "Nut", type: "tribe", value: "nut", aliases: ["nut", "nuts"] },
    { label: "Pea", type: "tribe", value: "pea", aliases: ["pea", "peas"] },
    { label: "Berry", type: "tribe", value: "berry", aliases: ["berry", "berries"] },
    { label: "Root", type: "tribe", value: "root", aliases: ["root", "roots"] },
    { label: "Animal", type: "tribe", value: "animal", aliases: ["animal", "animals"] },
    { label: "Imp", type: "tribe", value: "imp", aliases: ["imp", "imps"] },
    { label: "Gargantuar", type: "tribe", value: "gargantuar", aliases: ["gargantuar", "gargantuars", "garg", "gargs"] },

    // Sides / classes
    { label: "Plants", type: "side", value: "plant", aliases: ["plant", "plants"] },
    { label: "Zombies", type: "side", value: "zombie", aliases: ["zombie", "zombies"] },

    { label: "Guardian", type: "class", value: "guardian", aliases: ["guardian"] },
    { label: "Kabloom", type: "class", value: "kabloom", aliases: ["kabloom"] },
    { label: "Mega-Grow", type: "class", value: "mega-grow", aliases: ["mega grow", "megagrow", "mega-grow"] },
    { label: "Smarty", type: "class", value: "smarty", aliases: ["smarty"] },
    { label: "Solar", type: "class", value: "solar", aliases: ["solar"] },
    { label: "Beastly", type: "class", value: "beastly", aliases: ["beastly"] },
    { label: "Brainy", type: "class", value: "brainy", aliases: ["brainy"] },
    { label: "Crazy", type: "class", value: "crazy", aliases: ["crazy"] },
    { label: "Hearty", type: "class", value: "hearty", aliases: ["hearty"] },
    { label: "Sneaky", type: "class", value: "sneaky", aliases: ["sneaky"] },

    // Common shortcut cards
    { label: "BMR", type: "card-alias", value: "Bad_Moon_Rising", aliases: ["bmr", "bad moon", "bad moon rising"] },
    { label: "Trickster", type: "card-alias", value: "Trickster", aliases: ["trickster", "trickster deck", "trickster decks"] }
];

/* NEW: card-ability keywords. Matched against card text
   (Description + Type + Name), scored by copies in the deck. */
const FINDER_KEYWORD_KEYS = [
    { label: "Amphibious", value: "amphibious", aliases: ["amphibious", "water lane", "aquatic"] },
    { label: "Anti-Hero", value: "anti-hero", aliases: ["anti hero", "antihero"] },
    { label: "Armored", value: "armored", aliases: ["armored", "armor"] },
    { label: "Bullseye", value: "bullseye", aliases: ["bullseye"] },
    { label: "Deadly", value: "deadly", aliases: ["deadly", "poison"] },
    { label: "Double Strike", value: "double-strike", aliases: ["double strike", "doublestrike"] },
    { label: "Frenzy", value: "frenzy", aliases: ["frenzy"] },
    { label: "Overshoot", value: "overshoot", aliases: ["overshoot"] },
    { label: "Strikethrough", value: "strikethrough", aliases: ["strikethrough"] },
    { label: "Team-Up", value: "team-up", aliases: ["team up", "teamup"] },
    { label: "Untrickable", value: "untrickable", aliases: ["untrickable"] },
    { label: "Bounce", value: "bounce", aliases: ["bounce", "return to hand"] },
    { label: "Evolution", value: "evolution", aliases: ["evolution", "evolve", "fusion"] },
    { label: "Dino-Roar", value: "dino-roar", aliases: ["dino roar", "dino"] },
    { label: "Bonus Attack", value: "bonus-attack", aliases: ["bonus attack", "extra attack"] }
].map(k => ({ ...k, type: "keyword" }));

/* value -> normalized match terms, used by getFinderKeywordCopies */
const FINDER_KEYWORD_TERMS = {};
FINDER_KEYWORD_KEYS.forEach(k => {
    FINDER_KEYWORD_TERMS[k.value] = [...new Set(
        [k.label, ...k.aliases].map(normalizeSearch).filter(Boolean)
    )];
});

const FINDER_HERO_KEYS = [
    "Green Shadow", "Solar Flare", "Wall-Knight", "Chompzilla", "Spudow",
    "Citron", "Rose", "Nightcap", "Captain Combustible", "Grass Knuckles",
    "Super Brainz", "The Smash", "Impfinity", "Rustbolt", "Electric Boogaloo",
    "Brain Freeze", "Immorticia", "Professor Brainstorm", "Z-Mech", "Neptuna",
    "Huge-Gigantacus", "Beta-Carrotina"
].map(hero => ({
    label: hero,
    type: "hero",
    value: normalizeKeyValue(hero),
    aliases: [
        hero,
        hero.replace(/-/g, " "),
        hero.replace(/\s+/g, ""),
        hero.toLowerCase().replace(/[^a-z0-9]/g, "")
    ]
}));

/* ============================================================
   SECTION 4 — key construction
   ============================================================ */

function makeFinderKey(raw) {
    const aliases = Array.isArray(raw.aliases) ? raw.aliases : [];
    const label = String(raw.label || raw.value || "").trim();
    const value = raw.value ?? label;
    const type = raw.type || "term";

    const allAliases = [label, value, ...aliases].filter(Boolean).map(String);

    const normalizedAliases = [...new Set(
        allAliases
            .flatMap(alias => expandAliasForms(alias))
            .map(normalizeSearch)
            .filter(Boolean)
    )];

    return {
        id: `${type}:${normalizeKeyValue(value)}`,
        label,
        value,
        type,
        className: raw.className || "",
        aliases: allAliases,
        normalizedAliases
    };
}

function expandAliasForms(alias) {
    const s = String(alias);
    return [
        s,
        s.replace(/_/g, " "),
        s.replace(/-/g, " "),
        s.replace(/['\u2019]/g, ""),
        s.replace(/&/g, "and"),
        s.replace(/\s+/g, ""),
        s.toLowerCase()
    ];
}

function buildCardAliases(rawName, label) {
    const aliases = new Set();

    aliases.add(rawName);
    aliases.add(label);
    aliases.add(label.replace(/-/g, " "));
    aliases.add(label.replace(/'/g, ""));
    aliases.add(label.replace(/\s+/g, ""));
    aliases.add(rawName.replace(/_/g, " "));
    aliases.add(rawName.replace(/_/g, ""));

    // Abbreviations, e.g. Bad Moon Rising -> BMR
    const initials = label.split(/\s+/).map(w => w[0]).join("");
    if (initials.length >= 2) aliases.add(initials);

    return [...aliases];
}

function dedupeFinderKeys(keys) {
    const map = new Map();

    for (const key of keys) {
        if (!key.label) continue;

        const existing = map.get(key.id);
        if (!existing) {
            map.set(key.id, key);
            continue;
        }

        existing.aliases = [...new Set([...existing.aliases, ...key.aliases])];
        existing.normalizedAliases = [...new Set([...existing.normalizedAliases, ...key.normalizedAliases])];
    }

    return [...map.values()];
}

function findKeyByLabel(label) {
    const normalized = normalizeSearch(label);
    return finderKeyIndex.find(key => normalizeSearch(key.label) === normalized);
}

/* ============================================================
   SECTION 5 — dynamic keys from the databases
   ============================================================ */

function resolveFinderCardDatabase() {
    try {
        if (typeof cardDatabase !== "undefined" && cardDatabase &&
            typeof cardDatabase === "object" && Object.keys(cardDatabase).length) {
            return cardDatabase;
        }
    } catch (e) { /* not declared — fine */ }

    if (window.cardDatabase && typeof window.cardDatabase === "object" &&
        Object.keys(window.cardDatabase).length) {
        return window.cardDatabase;
    }

    return null;
}

function resolveFinderFullDatabase() {
    try {
        if (typeof fullDatabase !== "undefined" && fullDatabase &&
            typeof fullDatabase === "object" && Object.keys(fullDatabase).length) {
            return fullDatabase;
        }
    } catch (e) { /* fine */ }

    if (window.fullDatabase && typeof window.fullDatabase === "object" &&
        Object.keys(window.fullDatabase).length) {
        return window.fullDatabase;
    }

    return null;
}

function buildFinderKeyIndex() {
    const keys = [];

    for (const key of FINDER_STATIC_KEYS) keys.push(makeFinderKey(key));
    for (const key of FINDER_KEYWORD_KEYS) keys.push(makeFinderKey(key));
    for (const hero of FINDER_HERO_KEYS) keys.push(makeFinderKey(hero));

    addCardKeys(keys);
    addCardTypeKeys(keys);
    addCardRarityKeys(keys);
    addCardSetKeys(keys);
    addCostKeys(keys);
    addAuthorKeys(keys);

    return dedupeFinderKeys(keys);
}

function addCardKeys(keys) {
    const db = resolveFinderCardDatabase();
    if (!db) return;

    let added = 0;

    Object.entries(db).forEach(([dbKey, card]) => {
        if (!card) return;

        const rawName = String(card.Name || dbKey);
        if (!rawName) return;

        const label = displayCardName(rawName);

        keys.push(makeFinderKey({
            label,
            type: "card",
            value: rawName,
            className: card.Class || "",
            aliases: buildCardAliases(rawName, label)
        }));

        added++;
    });

    if (added > 0) {
        finderCardKeysLoaded = true;
        if (window.FINDER_DEBUG) console.log(`Deck Finder: indexed ${added} cards.`);
    }
}

function addCardTypeKeys(keys) {
    const db = resolveFinderCardDatabase();
    if (!db) return;

    const typeWords = new Set();

    Object.values(db).forEach(card => {
        if (!card || !card.Type) return;
        String(card.Type)
            .split(/[\s,/.-]+/)
            .map(w => w.trim())
            .filter(w => w.length >= 3)
            .forEach(w => typeWords.add(w));
    });

    typeWords.forEach(word => {
        keys.push(makeFinderKey({
            label: titleCase(word),
            type: "tribe",
            value: normalizeKeyValue(word),
            aliases: [word, pluralize(word)]
        }));
    });
}

function addCardRarityKeys(keys) {
    const db = resolveFinderCardDatabase();
    if (!db) return;

    const rarities = new Set();
    Object.values(db).forEach(card => {
        if (card?.Rarity) rarities.add(String(card.Rarity));
    });

    rarities.forEach(rarity => {
        keys.push(makeFinderKey({
            label: rarity,
            type: "rarity",
            value: normalizeKeyValue(rarity),
            aliases: [rarity, `${rarity} cards`, `${rarity} deck`]
        }));
    });
}

function addCardSetKeys(keys) {
    const db = resolveFinderCardDatabase();
    if (!db) return;

    const sets = new Set();
    Object.values(db).forEach(card => {
        if (card?.Set) sets.add(String(card.Set));
    });

    sets.forEach(setName => {
        keys.push(makeFinderKey({
            label: setName,
            type: "set",
            value: normalizeKeyValue(setName),
            aliases: [setName, `${setName} cards`]
        }));
    });
}

function addCostKeys(keys) {
    for (let cost = 0; cost <= 10; cost++) {
        keys.push(makeFinderKey({
            label: `${cost}-Cost Cards`,
            type: "cost",
            value: String(cost),
            aliases: [`${cost} cost`, `${cost}-cost`, `${cost} drops`, `${cost} drop`, `cost ${cost}`]
        }));
    }
}

/* NEW: deck creators become searchable ("fryemup decks"). */
function addAuthorKeys(keys) {
    const db = resolveFinderFullDatabase();
    if (!db) return;

    const authors = new Set();
    Object.values(db).forEach(deck => {
        const credit = String(deck?.credit || "").trim();
        if (credit && credit.toLowerCase() !== "unknown") authors.add(credit);
    });

    if (authors.size) finderAuthorKeysLoaded = true;

    authors.forEach(author => {
        keys.push(makeFinderKey({
            label: author,
            type: "author",
            value: normalizeKeyValue(author),
            aliases: [author, `${author} decks`, `by ${author}`, `${author} deck`]
        }));
    });
}

/* ============================================================
   SECTION 6 — alias index + rebuild machinery
   ============================================================ */

function buildFinderAliasIndex() {
    finderAliasIndex = new Map();

    for (const key of finderKeyIndex) {
        for (const alias of key.normalizedAliases) {
            if (!alias || alias.length < 2) continue;

            const aliasTokens = alias.split(" ").filter(Boolean);
            if (!aliasTokens.length) continue;

            // Bare digits only match through multiword aliases ("2 cost").
            if (aliasTokens.length === 1 && /^\d+$/.test(aliasTokens[0])) continue;

            const first = aliasTokens[0];
            if (!finderAliasIndex.has(first)) finderAliasIndex.set(first, []);
            finderAliasIndex.get(first).push({ key, aliasTokens, chars: alias.length });
        }
    }
}

function refreshFinderKeyIndex() {
    finderKeyIndex = buildFinderKeyIndex();
    buildFinderAliasIndex();

    // Card lookups changed -> cached deck profiles/verdicts may too.
    resetFinderDeckCache();

    if (finderSearchInput) {
        updateFinderParsedTerms(finderSearchInput.value);
        renderFinderSuggestions(finderSearchInput.value);
        if (finderSearchInput.value.trim()) queueFinderRecommendation(0);
    }
}

/* Rebuilds the index whenever a database appears. Cheap to call. */
function ensureFinderDynamicKeys() {
    const needCards = !finderCardKeysLoaded && !!resolveFinderCardDatabase();
    const needAuthors = !finderAuthorKeysLoaded && !!resolveFinderFullDatabase();

    if (!needCards && !needAuthors) {
        return finderCardKeysLoaded; // "ready enough" = cards indexed
    }

    // Expose the card db globally so the rest of the finder sees it.
    const cardDb = resolveFinderCardDatabase();
    if (cardDb && (!window.cardDatabase || !Object.keys(window.cardDatabase).length)) {
        window.cardDatabase = cardDb;
    }

    refreshFinderKeyIndex();
    return finderCardKeysLoaded;
}

async function loadFinderCardDataFallback() {
    if (finderCardDataFetchStarted || finderCardKeysLoaded) return;
    finderCardDataFetchStarted = true;

    const url = window.FINDER_CARD_DATA_URL || FINDER_CARD_DATA_URL_DEFAULT;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!json || typeof json !== "object" || !Object.keys(json).length) {
            throw new Error("Empty or invalid card data");
        }

        if (!window.cardDatabase || !Object.keys(window.cardDatabase).length) {
            window.cardDatabase = json;
        }

        ensureFinderDynamicKeys();
    } catch (err) {
        console.warn(
            `Deck Finder: card_data.json fallback failed (${err.message}). ` +
            `Set window.FINDER_CARD_DATA_URL or call refreshFinderKeyIndex() ` +
            `after your card data loads.`
        );
    }
}

(function watchForFinderDatabases() {
    // Immediate check, then poll. Fetch fallback kicks in after ~2.4s.
    if (ensureFinderDynamicKeys() && finderAuthorKeysLoaded) return;

    let attempts = 0;

    const timer = setInterval(() => {
        attempts++;

        const cardsReady = ensureFinderDynamicKeys();

        if (cardsReady && finderAuthorKeysLoaded) {
            clearInterval(timer);
            return;
        }

        if (attempts === 6 && !cardsReady) loadFinderCardDataFallback();

        if (attempts >= 75) {
            clearInterval(timer);
            if (!finderCardKeysLoaded) {
                console.warn("Deck Finder: gave up waiting for cardDatabase. Cards are not searchable.");
            }
        }
    }, 400);
})();

/* ============================================================
   SECTION 7 — query parsing (token-consuming, longest-first)
   ============================================================ */

function parseFinderQueryDetailed(query) {
    const clean = normalizeSearch(query);
    if (!clean) return { keys: [], matches: [], leftover: [], tokens: [] };

    const tokens = clean.split(" ").filter(Boolean);
    const used = new Array(tokens.length).fill(false);
    const candidates = [];

    // Alias index: only aliases whose FIRST token matches tokens[i]
    // are checked at position i. O(tokens) instead of O(all keys).
    for (let i = 0; i < tokens.length; i++) {
        const bucket = finderAliasIndex.get(tokens[i]);
        if (!bucket) continue;

        for (const cand of bucket) {
            const { aliasTokens } = cand;
            if (i + aliasTokens.length > tokens.length) continue;

            let ok = true;
            for (let j = 1; j < aliasTokens.length; j++) {
                if (tokens[i + j] !== aliasTokens[j]) { ok = false; break; }
            }

            if (ok) {
                candidates.push({
                    key: cand.key,
                    start: i,
                    len: aliasTokens.length,
                    chars: cand.chars,
                    priority: getTypePriorityBonus(cand.key.type)
                });
            }
        }
    }

    // Longest phrases first, then longer text, then type priority.
    candidates.sort((a, b) =>
        b.len - a.len || b.chars - a.chars || b.priority - a.priority
    );

    const chosen = [];
    const chosenIds = new Set();

    for (const c of candidates) {
        if (chosenIds.has(c.key.id)) continue;

        let free = true;
        for (let j = c.start; j < c.start + c.len; j++) {
            if (used[j]) { free = false; break; }
        }
        if (!free) continue;

        for (let j = c.start; j < c.start + c.len; j++) used[j] = true;
        chosen.push(c);
        chosenIds.add(c.key.id);
    }

    chosen.sort((a, b) => a.start - b.start);

    return {
        keys: chosen.map(c => c.key).slice(0, 8),
        matches: chosen,
        leftover: tokens.filter((t, i) => !used[i]),
        tokens
    };
}

function parseFinderQuery(query) {
    return parseFinderQueryDetailed(query).keys;
}

/* ============================================================
   SECTION 8 — suggestion scoring
   ============================================================ */

function getTypePriorityBonus(type) {
    const bonuses = {
        goal: 80,
        hero: 72,
        archetype: 68,
        budget: 64,
        recency: 60,
        card: 58,
        "card-alias": 58,
        keyword: 42,
        tribe: 38,
        class: 34,
        author: 30,
        side: 28,
        rarity: 18,
        set: 12,
        cost: 10
    };
    return bonuses[type] || 0;
}

function finderWordStartsWith(alias, chunk) {
    if (!chunk || chunk.length < 2) return false;
    return alias.split(" ").some(w => w.startsWith(chunk));
}

function scoreFinderKey(key, fullQuery, lastChunk) {
    let best = 0;
    let bestAlias = "";

    for (const alias of key.normalizedAliases) {
        if (!alias) continue;

        let m = 0;

        if (alias === fullQuery) m = 1000;
        else if (alias === lastChunk) m = 920;
        else if (fullQuery.length >= 2 && alias.startsWith(fullQuery)) m = 800;
        else if (lastChunk.length >= 2 && alias.startsWith(lastChunk)) m = 700;
        else if (finderWordStartsWith(alias, lastChunk)) m = 620;
        else if (fullQuery.length >= 3 && alias.includes(fullQuery)) m = 520;
        else if (lastChunk.length >= 3 && alias.includes(lastChunk)) m = 430;
        else m = fuzzyFinderScore(alias, fullQuery, lastChunk);

        if (m > best) { best = m; bestAlias = alias; }
    }

    // No match means NO score (the old unconditional type/length
    // bonuses were what froze the suggestion chips).
    if (best <= 0) return 0;

    let score = best;
    score += getTypePriorityBonus(key.type) * (best >= 600 ? 1 : 0.4);

    const q = lastChunk.length >= 2 ? lastChunk : fullQuery;
    score -= Math.min(30, Math.abs(bestAlias.length - q.length) * 1.5);

    return score;
}

function fuzzyFinderScore(alias, fullQuery, lastChunk) {
    const q = lastChunk.length >= 3 ? lastChunk : fullQuery;
    if (q.length < 3) return 0;

    let pos = 0, score = 0, streak = 0;

    for (const ch of q) {
        const found = alias.indexOf(ch, pos);
        if (found === -1) return 0;

        streak = (found === pos) ? streak + 1 : 1;
        score += 8 + streak * 6;
        pos = found + 1;
    }

    if (alias[0] !== q[0]) score -= 25;

    return score >= 45 ? Math.min(score, 380) : 0;
}

/* ============================================================
   SECTION 9 — suggestions
   ============================================================ */

function getFinderSuggestions(query, limit = 3) {
    ensureFinderDynamicKeys(); // no-op once loaded

    const cleanQuery = normalizeSearch(query);
    if (!cleanQuery) return getDefaultFinderSuggestions(limit);

    const parsed = parseFinderQueryDetailed(query);
    const selectedIds = new Set(parsed.keys.map(k => k.id));

    // Everything typed resolved into keys -> suggest complements.
    if (!parsed.leftover.length) {
        return getComplementFinderSuggestions(parsed.keys, limit);
    }

    // Only unconsumed words drive matching, so finished terms
    // stop polluting scores while the next word is typed.
    const searchText = parsed.leftover.join(" ");
    const lastToken = parsed.tokens[parsed.tokens.length - 1] || "";
    const activeChunk = parsed.leftover.includes(lastToken) ? lastToken : searchText;

    return finderKeyIndex
        .filter(key => !selectedIds.has(key.id))
        .map(key => ({ key, score: scoreFinderKey(key, searchText, activeChunk) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.key);
}

function getDefaultFinderSuggestions(limit = 3) {
    return [
        findKeyByLabel("Lawn Warz"),
        findKeyByLabel("Aggro"),
        findKeyByLabel("Budget"),
        findKeyByLabel("Strongest Deck")
    ].filter(Boolean).slice(0, limit);
}

function getComplementFinderSuggestions(selectedKeys, limit = 4) {
    const selectedIds = new Set(selectedKeys.map(k => k.id));
    const types = new Set(selectedKeys.map(k => k.type));

    const wants = [];
    if (!types.has("goal")) wants.push("Strongest Deck", "Lawn Warz");
    if (!types.has("budget")) wants.push("Budget");
    if (!types.has("archetype")) wants.push("Aggro", "Control");
    if (!types.has("side") && !types.has("hero") && !types.has("class")) {
        wants.push("Plants", "Zombies");
    }
    if (!types.has("recency")) wants.push("New Decks");
    wants.push("Fun Deck");

    const out = [];
    for (const label of wants) {
        const key = findKeyByLabel(label);
        if (key && !selectedIds.has(key.id) && !out.some(k => k.id === key.id)) {
            out.push(key);
        }
        if (out.length >= limit) break;
    }
    return out;
}

/* ============================================================
   SECTION 10 — chip / parsed-term rendering
   ============================================================ */

function renderFinderSuggestions(query) {
    if (!finderSuggestions) return;

    const suggestions = getFinderSuggestions(query, 3);

    finderSuggestions.innerHTML = suggestions.map(key => {
        const hint = getFinderKeyHint(key);
        const icon = getFinderKeySvg(key);
        const typeClass = `finder-type-${String(key.type || "term").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;

        return `
            <button class="finder-suggestion-chip ${typeClass}" type="button" data-key-id="${escapeHtml(key.id)}">
                <span class="finder-suggestion-icon" aria-hidden="true">${icon}</span>
                <span class="finder-suggestion-text">
                    <span class="finder-suggestion-title">${escapeHtml(key.label)}</span>
                    ${hint ? `<span class="finder-suggestion-hint">${escapeHtml(hint)}</span>` : ""}
                </span>
            </button>
        `;
    }).join("");
}

function updateFinderParsedTerms(query) {
    if (!finderParsedTerms) return;

    const parsed = parseFinderQuery(query);
    finderSelectedKeys = parsed;

    if (!parsed.length) {
        finderParsedTerms.hidden = true;
        finderParsedTerms.innerHTML = "";
        return;
    }

    finderParsedTerms.hidden = false;
    finderParsedTerms.innerHTML = parsed.map(key => `
        <span class="finder-term" data-key-id="${escapeHtml(key.id)}" role="button" tabindex="0" title="Remove ${escapeHtml(key.label)}">
            ${escapeHtml(key.label)}<span class="finder-term-x" aria-hidden="true">&times;</span>
        </span>
    `).join("");
}

/* NEW: click a parsed term to remove exactly its words from the input. */
function removeFinderKeyFromSearch(keyId) {
    if (!finderSearchInput) return;

    const detailed = parseFinderQueryDetailed(finderSearchInput.value);
    const match = detailed.matches.find(m => m.key.id === keyId);
    if (!match) return;

    const kept = detailed.tokens.filter(
        (t, i) => i < match.start || i >= match.start + match.len
    );

    finderSearchInput.value = kept.join(" ");
    finderSearchInput.focus();

    updateFinderParsedTerms(finderSearchInput.value);
    renderFinderSuggestions(finderSearchInput.value);
    queueFinderRecommendation(0);
}

function addFinderKeyToSearch(key) {
    const current = finderSearchInput.value.trim();
    const label = key.label;

    if (normalizeSearch(current).includes(normalizeSearch(label))) return;

    finderSearchInput.value = current ? `${current} ${label}` : label;
    finderSearchInput.focus();

    updateFinderParsedTerms(finderSearchInput.value);
    renderFinderSuggestions(finderSearchInput.value);
    queueFinderRecommendation(0);
}

function getFinderKeySvg(key) {
    const type = key.type;
    const value = key.value;

    if (type === "goal" && value === "lawn-warz") {
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M8 4h8v3a4 4 0 0 1-8 0V4Z"/><path d="M6 5H4v2a4 4 0 0 0 4 4"/><path d="M18 5h2v2a4 4 0 0 1-4 4"/><path d="M12 11v5"/><path d="M9 20h6"/><path d="M8 16h8"/></svg>`;
    }
    if (type === "goal" && value === "strongest") {
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>`;
    }
    if (type === "goal" && value === "fun") {
        return `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 9h.01"/><path d="M15 9h.01"/><path d="M9 15h.01"/><path d="M15 15h.01"/></svg>`;
    }
    if (type === "budget") {
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M7 7h10"/><path d="M8 7c0-2 1.5-3 4-3s4 1 4 3"/><path d="M6 10c-1 1-2 3-2 5 0 3 2.5 5 8 5s8-2 8-5c0-2-1-4-2-5H6Z"/><path d="M12 12v5"/><path d="M10 14h4"/></svg>`;
    }
    if (type === "hero") {
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4Z"/><path d="M9 11h6"/><path d="M10 15h4"/></svg>`;
    }
    if (type === "card" || type === "card-alias") {
        return `<svg viewBox="0 0 24 24" fill="none"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 7h4"/><path d="M10 11h4"/><path d="M10 15h2"/></svg>`;
    }
    if (type === "archetype") {
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h7l-1 8 10-13h-7l1-7Z"/></svg>`;
    }
    if (type === "keyword") {
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4L12 3Z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z"/></svg>`;
    }
    if (type === "author") {
        return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>`;
    }
    if (type === "recency") {
        return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>`;
    }
    if (type === "tribe") {
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/><path d="M16 20a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/><path d="M10.8 9.2l2.4 5.6"/></svg>`;
    }
    if (type === "class" || type === "side") {
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11Z"/><path d="M12 10v7"/><path d="M9 13h6"/></svg>`;
    }
    if (type === "cost") {
        return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7"/><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`;
}

function getFinderKeyHint(key) {
    if (key.type === "goal") {
        if (key.value === "lawn-warz") return "quick ranked wins";
        if (key.value === "strongest") return "best overall picks";
        if (key.value === "fun") return "meme / casual decks";
        return "deck goal";
    }
    if (key.type === "budget") {
        if (key.value === "budget") return "cheap but playable";
        if (key.value === "super-budget") return "very low spark cost";
        if (key.value === "p2w") return "maxed expensive decks";
        return "";
    }
    if (key.type === "hero") return "hero";
    if (key.type === "archetype") return "playstyle";
    if (key.type === "keyword") return "card ability";
    if (key.type === "author") return "deck creator";
    if (key.type === "recency") return "newest decks";
    if (key.type === "card" || key.type === "card-alias") {
        return key.className ? `${key.className} card` : "card";
    }
    if (key.type === "tribe") return "card type";
    if (key.type === "class") return "class";
    if (key.type === "side") return "side";
    if (key.type === "rarity") return "rarity";
    if (key.type === "set") return "set";
    if (key.type === "cost") return "cost";
    return "";
}

/* ============================================================
   SECTION 11 — deck cache & compilation
   ============================================================ */

function getFinderVerdictFn() {
    if (typeof getDeckVerdictFromCards === "function") return getDeckVerdictFromCards;
    if (typeof window.getDeckVerdictFromCards === "function") return window.getDeckVerdictFromCards;
    return null;
}

function getFinderActiveCtx() {
    if (typeof ctx !== "undefined") return ctx;
    if (window.ctx) return window.ctx;
    if (typeof getVerdictContext === "function") return getVerdictContext();
    if (typeof window.getVerdictContext === "function") return window.getVerdictContext();
    return undefined;
}

function resetFinderDeckCache() {
    finderDeckCache = null;
}

function getFinderDeckCache() {
    if (finderDeckCache) return finderDeckCache;

    const db = resolveFinderFullDatabase();
    const cardDb = resolveFinderCardDatabase();
    const verdictFn = getFinderVerdictFn();

    if (!db || !cardDb) {
        if (window.FINDER_DEBUG) console.warn("Deck Finder waiting: databases not ready.");
        finderDeckCache = [];
        return finderDeckCache;
    }

    if (!verdictFn) {
        console.error("Deck Finder error: getDeckVerdictFromCards is not available.");
        finderDeckCache = [];
        return finderDeckCache;
    }

    const compiled = [];
    const seen = new Set();
    const activeCtx = getFinderActiveCtx();

    for (const deckKey in db) {
        if (!Object.prototype.hasOwnProperty.call(db, deckKey)) continue;

        const deck = db[deckKey];
        if (!deck || !Array.isArray(deck.cards)) continue;

        const signature = getFinderDeckSignature(deck.cards);
        if (seen.has(signature)) continue;
        seen.add(signature);

        try {
            const meta = compileFinderDeck(deckKey, deck, cardDb, activeCtx, verdictFn);
            if (meta) compiled.push(meta);
        } catch (err) {
            console.warn(`Deck Finder skipped ${deckKey}:`, err);
        }
    }

    if (window.FINDER_DEBUG) {
        console.log(`Deck Finder compiled ${compiled.length} decks.`);
    }

    finderDeckCache = compiled;
    return finderDeckCache;
}

function compileFinderDeck(deckKey, deck, cardDb, activeCtx, verdictFn) {
    const cardEntries = [];
    const uniqueClasses = new Set();
    const cardNames = [];
    const cardKeys = [];
    const cardTypes = [];
    const rarities = [];
    const sets = [];
    const costs = [];

    let totalSparks = 0;
    let totalCards = 0;
    let totalCost = 0;

    for (const raw of deck.cards) {
        const parsed = parseFinderDeckCardEntry(raw);
        if (!parsed) continue;

        const cardData = getFinderCardData(parsed.name, cardDb);
        const key = getFinderCardKey(parsed.name, cardDb);

        const displayName = displayCardName(parsed.name);
        const type = cardData?.Type || "";
        const rarity = cardData?.Rarity || "";
        const setName = cardData?.Set || "";
        const className = cardData?.Class || "";
        const cost = Number(cardData?.Cost);
        const safeCost = Number.isFinite(cost) ? cost : 1;

        totalCards += parsed.count;
        totalCost += safeCost * parsed.count;

        cardNames.push(displayName);
        cardKeys.push(key || parsed.name);
        costs.push(String(safeCost));

        cardEntries.push({
            raw,
            name: displayName,
            key: key || parsed.name,
            count: parsed.count,
            type,
            rarity,
            set: setName,
            className,
            cost: safeCost
        });

        if (type) cardTypes.push(...normalizeSearch(type).split(" ").filter(Boolean));
        if (rarity) rarities.push(normalizeKeyValue(rarity));
        if (setName) sets.push(normalizeKeyValue(setName));
        if (className) uniqueClasses.add(className.trim());

        const rarityKey = String(rarity || "common").toLowerCase().trim();
        totalSparks += (FINDER_SPARK_COSTS[rarityKey] || 0) * parsed.count;
    }

    if (!totalCards) return null;

    const classes = [...uniqueClasses].sort();
    const hero = FINDER_HERO_MAP[classes.join(",")] || "Unknown Hero";

    const verdict = verdictFn(deck.cards, deckKey, activeCtx);

    if (!verdict || !Number.isFinite(Number(verdict.score))) {
        throw new Error("getDeckVerdictFromCards returned an invalid verdict.");
    }

    const score = Number(verdict.score);
    const avgCost = totalCost / totalCards;

    const searchText = normalizeSearch([
        deck.name || "",
        hero,
        classes.join(" "),
        cardNames.join(" "),
        cardTypes.join(" "),
        rarities.join(" "),
        sets.join(" "),
        deck.credit || "",
        deck.youtube_title || ""
    ].join(" "));

    return {
        id: deckKey,
        rawDeck: deck,
        name: deck.name || "Unnamed Deck",
        cards: deck.cards,
        cardEntries,
        cardNames,
        cardKeys,
        cardTypes: [...new Set(cardTypes)],
        rarities: [...new Set(rarities)],
        sets: [...new Set(sets)],
        costs: [...new Set(costs)],
        classes,
        hero,
        heroNorm: normalizeSearch(hero),
        side: getFinderDeckSide(classes),
        sparks: totalSparks,
        totalCards,
        avgCost,
        date: deck.upload_date || "Unknown Date",
        author: deck.credit || "Unknown",
        youtubeUrl: deck.youtube_url || "",
        searchText,

        score: parseFloat(score.toFixed(2)),
        grade: verdict.grade,
        gradeColor: verdict.gradeColor || "",
        synergy: Number(verdict.synergyScore || 0),
        power: Number(verdict.powerScore || 0),
        consistency: Number(verdict.consistencyScore || 0),
        curve: Number(verdict.curveNumeric || 0),
        costLabel: verdict.costLabel || getFinderCostLabel(totalSparks / totalCards)
    };
}

/* ============================================================
   SECTION 12 — parse / lookup helpers
   ============================================================ */

function parseFinderDeckCardEntry(cardRaw) {
    if (!cardRaw) return null;

    let text = String(cardRaw).trim();
    let count = 1;

    const match = text.match(/^(\d+x?|x\d+)\s+(.+)$/i);
    if (match) {
        count = parseInt(match[1].replace(/x/i, ""), 10) || 1;
        text = match[2].trim();
    }

    return { name: text, count };
}

function getFinderCardData(cardName, cardDb) {
    const direct = cardDb[cardName];
    if (direct) return direct;

    const underscore = cardName.replace(/\s+/g, "_");
    if (cardDb[underscore]) return cardDb[underscore];

    const spaces = cardName.replace(/_/g, " ");
    if (cardDb[spaces]) return cardDb[spaces];

    const normalized = normalizeSearch(cardName);

    for (const key in cardDb) {
        const card = cardDb[key];
        if (!card) continue;
        if (normalizeSearch(key) === normalized) return card;
        if (normalizeSearch(card.Name) === normalized) return card;
    }

    return null;
}

function getFinderCardKey(cardName, cardDb) {
    const underscore = cardName.replace(/\s+/g, "_");

    if (cardDb[cardName]) return cardName;
    if (cardDb[underscore]) return underscore;

    const normalized = normalizeSearch(cardName);

    for (const key in cardDb) {
        const card = cardDb[key];
        if (!card) continue;
        if (normalizeSearch(key) === normalized) return key;
        if (normalizeSearch(card.Name) === normalized) return key;
    }

    return cardName;
}

function getFinderDeckSignature(cards) {
    return [...cards]
        .map(c => String(c).trim().toLowerCase().replace(/\s+/g, " "))
        .sort()
        .join("|");
}

function getFinderDeckSide(classes) {
    const plantClasses = new Set(["Guardian", "Kabloom", "Mega-Grow", "Smarty", "Solar"]);
    const zombieClasses = new Set(["Beastly", "Brainy", "Crazy", "Hearty", "Sneaky"]);

    const plantCount = classes.filter(c => plantClasses.has(c)).length;
    const zombieCount = classes.filter(c => zombieClasses.has(c)).length;

    if (plantCount > zombieCount) return "plant";
    if (zombieCount > plantCount) return "zombie";
    return "";
}

function getFinderCostLabel(avgSparks) {
    if (avgSparks <= 250) return "Budget";
    if (avgSparks <= 600) return "Moderate";
    if (avgSparks <= 1400) return "Expensive";
    return "P2W";
}

/* Per-entry card text, cached on the entry (profiles + keyword
   matching hit this constantly). */
function getFinderCardSearchText(entry) {
    if (entry._finderText) return entry._finderText;

    const cardDb = resolveFinderCardDatabase() || {};
    const data =
        cardDb[entry.key] ||
        cardDb[entry.name] ||
        cardDb[String(entry.name || "").replace(/\s+/g, "_")] ||
        {};

    entry._finderText = normalizeSearch([
        entry.name || "",
        entry.key || "",
        entry.type || "",
        entry.rarity || "",
        entry.className || "",
        data.Name || "",
        data.Type || "",
        data.Description || "",
        data.Class || "",
        data.Rarity || ""
    ].join(" "));

    return entry._finderText;
}

/* ============================================================
   SECTION 13 — avg-cost bands & deck profiling
   avgCost <= 2.2 Aggro/Rush | 2.2–3.5 Midrange | >3.5 Control
   ============================================================ */

function getFinderSpeedLabel(avgCost) {
    if (avgCost <= 2.2) return "Aggro/Rush";
    if (avgCost <= 3.5) return "Midrange";
    return "Control/Late";
}

function getSpeedBandScore(avgCost, band) {
    if (band === "aggro") {
        if (avgCost <= 2.0) return 100;
        if (avgCost <= 2.2) return 90;
        if (avgCost <= 2.5) return 72;
        if (avgCost <= 2.8) return 52;
        if (avgCost <= 3.2) return 28;
        return 8;
    }
    if (band === "midrange") {
        if (avgCost > 2.2 && avgCost <= 3.5) {
            const d = Math.abs(avgCost - 2.85);
            return clampFinder(96 - d * 30, 62, 96);
        }
        if (avgCost <= 2.2) return 38;
        if (avgCost <= 3.9) return 48;
        return 20;
    }
    if (band === "control") {
        if (avgCost > 4.2) return 100;
        if (avgCost > 3.8) return 92;
        if (avgCost > 3.5) return 84;
        if (avgCost > 3.2) return 56;
        if (avgCost > 3.0) return 38;
        return 10;
    }
    return 0;
}

function getFinderDeckProfile(deck) {
    if (deck.finderProfile && deck.finderProfile.v === 2) return deck.finderProfile;

    const total = deck.totalCards || 40;

    let early = 0, mid = 0, late = 0, twoDrops = 0;
    let tricks = 0, units = 0;
    let removal = 0, directDamage = 0, heal = 0, freeze = 0;
    let conjure = 0, draw = 0, ramp = 0, gravestone = 0;
    let swarm = 0, buff = 0, combo = 0, fun = 0, cycle = 0;

    const tribeCounts = {};

    for (const entry of deck.cardEntries || []) {
        const count = entry.count || 1;
        const cost = Number(entry.cost || 1);
        const text = getFinderCardSearchText(entry);

        if (cost <= 2) { early += count; twoDrops += count; }
        else if (cost <= 4) mid += count;
        else late += count;

        if (text.includes("trick")) tricks += count;
        else units += count;

        if (hasAny(text, ["destroy", "bounce", "damage", "do 2 damage", "do 3 damage", "do 4 damage", "minus", "-1", "-2"])) removal += count;
        if (hasAny(text, ["damage the plant hero", "damage the zombie hero", "bullseye", "overshoot", "strikethrough", "anti hero", "anti-hero"])) directDamage += count;
        if (hasAny(text, ["heal", "heals", "healed"])) heal += count;
        if (hasAny(text, ["freeze", "frozen"])) freeze += count;
        if (hasAny(text, ["conjure", "conjures"])) conjure += count;
        if (hasAny(text, ["draw a card", "draw cards", "draw"])) draw += count;
        if (hasAny(text, ["you get +1 sun", "extra sun", "gain a brain", "get +1 brain", "ramp"])) ramp += count;
        if (hasAny(text, ["gravestone"])) gravestone += count;
        if (hasAny(text, ["make a", "make two", "make 2", "team-up", "team up", "when you play another", "all plants", "all zombies"])) swarm += count;
        if (hasAny(text, ["gets +", "get +", "+1/+1", "+2/+2", "all plants get", "all zombies get"])) buff += count;

        // Cheap tricks + draw = cycle engine (Cyclecap-style decks).
        if (cost <= 2 && (text.includes("trick") || hasAny(text, ["draw"]))) cycle += count;

        if (hasAny(text, ["bad moon rising", "trickster", "valkyrie", "molekale", "leap", "evolution", "transform", "otk", "bonus attack"])) combo += count;
        if (hasAny(text, ["bad moon rising", "conjure", "random", "transform", "leap", "molekale", "gargantuar", "zombot", "valkyrie"])) fun += count;

        const typeWords = normalizeSearch(entry.type || "").split(" ").filter(Boolean);
        for (const word of typeWords) {
            tribeCounts[word] = (tribeCounts[word] || 0) + count;
        }
    }

    const earlyShare = early / total;
    const midShare = mid / total;
    const lateShare = late / total;
    const trickShare = tricks / total;
    const unitShare = units / total;
    const removalShare = removal / total;
    const directDamageShare = directDamage / total;
    const healShare = heal / total;
    const freezeShare = freeze / total;
    const conjureShare = conjure / total;
    const drawShare = draw / total;
    const rampShare = ramp / total;
    const gravestoneShare = gravestone / total;
    const swarmShare = swarm / total;
    const buffShare = buff / total;
    const comboShare = combo / total;
    const funShare = fun / total;
    const cycleShare = cycle / total;

    const avgCost = Number(deck.avgCost || 3);
    const bandAggro = getSpeedBandScore(avgCost, "aggro");
    const bandMid = getSpeedBandScore(avgCost, "midrange");
    const bandControl = getSpeedBandScore(avgCost, "control");

    const speed = clampFinder(
        bandAggro * 0.62 + earlyShare * 34 + directDamageShare * 22 +
        swarmShare * 10 + (deck.consistency || 0) * 0.08 - lateShare * 20,
        0, 100
    );

    const aggro = clampFinder(
        bandAggro * 0.62 + earlyShare * 40 + directDamageShare * 28 +
        swarmShare * 10 + unitShare * 6 - lateShare * 22 - trickShare * 6,
        0, 100
    );

    const control = clampFinder(
        bandControl * 0.60 + removalShare * 42 + healShare * 26 +
        freezeShare * 20 + lateShare * 22 + drawShare * 10 - earlyShare * 14,
        0, 100
    );

    const midrange = clampFinder(
        bandMid * 0.70 + midShare * 34 + (deck.curve || 0) * 0.12 +
        (deck.power || 0) * 0.08 - trickShare * 8,
        0, 100
    );

    const tempoBand = (avgCost > 2.0 && avgCost <= 3.0) ? 78 : (avgCost <= 3.4 ? 55 : 22);
    const tempo = clampFinder(
        tempoBand * 0.60 + earlyShare * 22 + midShare * 22 + unitShare * 12 +
        buffShare * 16 + (deck.curve || 0) * 0.15 - lateShare * 14,
        0, 100
    );

    const comboScore = clampFinder(
        16 + comboShare * 78 + trickShare * 22 + drawShare * 26 + (deck.synergy || 0) * 0.28,
        0, 100
    );

    const swarmScore = clampFinder(
        18 + swarmShare * 64 + earlyShare * 24 + unitShare * 18 + buffShare * 22,
        0, 100
    );

    const tricksScore = clampFinder(
        14 + trickShare * 88 + drawShare * 20 + removalShare * 16,
        0, 100
    );

    const profile = {
        v: 2,
        speed, aggro, control, tempo, midrange,
        combo: comboScore,
        swarm: swarmScore,
        tricks: tricksScore,

        heal: clampFinder(healShare * 130 + control * 0.25, 0, 100),
        freeze: clampFinder(freezeShare * 140 + control * 0.20, 0, 100),
        conjure: clampFinder(conjureShare * 150 + funShare * 80, 0, 100),
        ramp: clampFinder(rampShare * 150 + lateShare * 35, 0, 100),
        gravestone: clampFinder(gravestoneShare * 135, 0, 100),
        fun: clampFinder(funShare * 95 + comboScore * 0.35 + conjureShare * 80, 0, 100),
        cycle: clampFinder(cycleShare * 150 + drawShare * 40 + trickShare * 25, 0, 100),

        tribeCounts,
        earlyShare, midShare, lateShare, trickShare, unitShare,
        removalShare, directDamageShare, healShare, freezeShare,
        conjureShare, drawShare, rampShare, gravestoneShare,
        swarmShare, buffShare, comboShare, funShare, cycleShare,

        avgCost,
        speedLabel: getFinderSpeedLabel(avgCost)
    };

    deck.finderProfile = profile;
    return profile;
}

/* ============================================================
   SECTION 14 — archetype / tribe / keyword matching
   ============================================================ */

function getProfileArchetypeScore(profile, arch) {
    const key = normalizeKeyValue(arch);

    const map = {
        "aggro": profile.aggro,
        "tempo": profile.tempo,
        "control": profile.control,
        "midrange": profile.midrange,
        "combo": profile.combo,
        "swarm": profile.swarm,
        "heal": profile.heal,
        "freeze": profile.freeze,
        "conjure": profile.conjure,
        "ramp": profile.ramp,
        "tricks": profile.tricks,
        "gravestone": profile.gravestone,
        "trickstache": Math.max(profile.tricks * 0.7, profile.combo * 0.5),
        "cyclecap": profile.cycle * 0.6
    };

    return map[key] || 0;
}

/* Deck-aware score: named packages match by NAME / hero first. */
function getDeckArchetypeScore(deck, arch) {
    const profile = getFinderDeckProfile(deck);
    const key = normalizeKeyValue(arch);
    const name = normalizeSearch(deck.name);

    if (key === "cyclecap") {
        if (name.includes("cyclecap") || name.includes("cycle cap")) return 100;
        if (deck.heroNorm.includes("captain combustible")) {
            return clampFinder(50 + profile.cycle * 0.45 + profile.combo * 0.15, 50, 96);
        }
        return clampFinder(profile.cycle * 0.35, 0, 40);
    }

    if (key === "trickstache") {
        if (name.includes("trickstache") || name.includes("stache")) return 100;
        const mustacheCopies = getProfileTribeScore(deck, "mustache");
        return clampFinder(mustacheCopies * 5 + profile.tricks * 0.45, 0, 96);
    }

    const base = getProfileArchetypeScore(profile, key);

    // Name bonus ONLY when the profile already agrees (stops
    // "Coffaggro" winning on name alone if it isn't really aggro).
    const nameTerm = key.replace(/-/g, " ");
    if (base >= 50 && nameTerm.length >= 4 && name.includes(nameTerm)) {
        return clampFinder(base + 10, 0, 100);
    }

    return base;
}

function getProfileTribeScore(deck, tribe) {
    const profile = getFinderDeckProfile(deck);
    return profile.tribeCounts[normalizeSearch(tribe)] || 0;
}

/* NEW: copies of cards whose text mentions a keyword ability. */
function getFinderKeywordCopies(deck, keyword) {
    const terms = FINDER_KEYWORD_TERMS[normalizeKeyValue(keyword)] ||
        [normalizeSearch(keyword)];

    let copies = 0;
    for (const entry of deck.cardEntries || []) {
        const text = getFinderCardSearchText(entry);
        if (terms.some(t => t && text.includes(t))) copies += entry.count || 1;
    }
    return copies;
}

function getDeckCostCopies(deck, targetCost) {
    let copies = 0;
    for (const entry of deck.cardEntries || []) {
        if (Number(entry.cost) === targetCost) copies += entry.count || 1;
    }
    return copies;
}

function finderDeckMatchesHero(deck, hero) {
    const h = normalizeSearch(hero);
    const deckHero = deck.heroNorm;

    if (deckHero.includes(h)) return true;

    return deckHero
        .split("/")
        .map(x => normalizeSearch(x))
        .some(part => part === h || part.includes(h));
}

function finderDeckContainsCard(deck, cardValue) {
    const target = normalizeSearch(cardValue);

    return deck.cardEntries.some(card => {
        const key = normalizeSearch(card.key);
        const name = normalizeSearch(card.name);
        return key === target || name === target || key.includes(target) || name.includes(target);
    });
}

function getFinderFunScore(deck) {
    const text = deck.searchText;
    let score = 0;

    if (text.includes("bmr") || text.includes("bad moon rising")) score += 35;
    if (text.includes("conjure")) score += 28;
    if (text.includes("random")) score += 20;
    if (text.includes("otk")) score += 18;
    if (text.includes("leap")) score += 16;
    if (text.includes("meme")) score += 15;
    if (text.includes("valkyrie")) score += 12;

    return score;
}

function getFinderRecencyScore(dateText) {
    if (!dateText || dateText === "Unknown Date") return 45;

    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return 45;

    const daysOld = (Date.now() - date.getTime()) / 86400000;

    if (daysOld <= 14) return 100;
    if (daysOld <= 45) return 86;
    if (daysOld <= 90) return 72;
    if (daysOld <= 180) return 58;
    if (daysOld <= 365) return 46;
    return 36;
}

/* ============================================================
   SECTION 15 — quality gates & intent
   ============================================================ */

function getFinderGradeRank(grade) {
    const g = String(grade || "").toUpperCase();
    if (g.includes("S")) return 5;
    if (g.includes("A")) return 4;
    if (g.includes("B")) return 3;
    if (g.includes("C")) return 2;
    if (g.includes("D")) return 1;
    if (g.includes("F")) return 0;
    return 2;
}

function isFinderQualityDeck(deck, intent) {
    const wantsStrongest = intent.goals.includes("strongest");
    const isEmptySearch = !intent.rawQuery && !intent.keys.length;

    if (wantsStrongest) return deck.score >= 72 && getFinderGradeRank(deck.grade) >= 3;
    if (isEmptySearch) return deck.score >= 74 && getFinderGradeRank(deck.grade) >= 3;
    return deck.score >= 68 && getFinderGradeRank(deck.grade) >= 3;
}

function isFinderBadDeck(deck) {
    return deck.score < 68 || getFinderGradeRank(deck.grade) <= 2;
}

function getFinderIntent(query) {
    const keys = parseFinderQuery(query);

    return {
        rawQuery: query.trim(),
        keys,

        goals: keys.filter(k => k.type === "goal").map(k => k.value),
        heroes: keys.filter(k => k.type === "hero").map(k => k.label),
        cards: keys.filter(k => k.type === "card" || k.type === "card-alias").map(k => k.value),
        archetypes: keys.filter(k => k.type === "archetype").map(k => k.value),
        keywords: keys.filter(k => k.type === "keyword").map(k => k.value),
        authors: keys.filter(k => k.type === "author").map(k => k.label),
        recency: keys.filter(k => k.type === "recency").map(k => k.value),
        budget: keys.filter(k => k.type === "budget").map(k => k.value),
        classes: keys.filter(k => k.type === "class").map(k => k.value),
        tribes: keys.filter(k => k.type === "tribe").map(k => k.value),
        side: keys.filter(k => k.type === "side").map(k => k.value),
        rarity: keys.filter(k => k.type === "rarity").map(k => k.value),
        set: keys.filter(k => k.type === "set").map(k => k.value),
        cost: keys.filter(k => k.type === "cost").map(k => k.value)
    };
}

/* ============================================================
   SECTION 16 — recommendation scoring & pipeline
   ============================================================ */

function scoreDeckForFinderIntent(deck, intent) {
    const profile = getFinderDeckProfile(deck);

    const isEmptySearch = !intent.rawQuery && !intent.keys.length;
    const wantsStrongest = intent.goals.includes("strongest");
    const wantsLawnWarz = intent.goals.includes("lawn-warz");
    const wantsFun = intent.goals.includes("fun");
    const hasArchetype = intent.archetypes.length > 0;
    const hasSpecific = hasArchetype || intent.cards.length || intent.heroes.length ||
        intent.tribes.length || intent.classes.length || intent.keywords.length ||
        intent.authors.length;

    /* Quality weight scales with intent:
       strongest / quick pick -> quality dominates
       specific searches      -> match dominates, quality = tiebreak */
    let qualityWeight = 2.2;
    if (wantsStrongest || isEmptySearch) qualityWeight = 3.6;
    else if (wantsLawnWarz) qualityWeight = 2.6;
    else if (hasSpecific) qualityWeight = 1.25;

    let score =
        deck.score * qualityWeight +
        deck.power * 0.45 +
        deck.synergy * 0.35 +
        deck.consistency * 0.30 +
        deck.curve * 0.20;

    if (wantsStrongest || isEmptySearch) {
        if (isFinderBadDeck(deck)) score -= 1400;
        else if (deck.score < 72) score -= 420;
        else if (deck.score < 78) score -= 120;
    }

    if (wantsStrongest) {
        score += deck.score * 1.2 + deck.power * 0.4;
        if (getFinderGradeRank(deck.grade) <= 2) score -= 1500;
    }

    if (wantsLawnWarz) {
        score += profile.speed * 0.9;
        score += deck.consistency * 0.4;
        score += getFinderRecencyScore(deck.date) * 0.15;

        if (profile.speed >= 70 && deck.score >= 74) score += 80;
        if (profile.speed < 40) score -= 60;
        if (deck.score < 66) score -= 220;
    }

    if (wantsFun) {
        score += profile.fun * 1.2 + getFinderFunScore(deck) * 0.8;
    }

    if (isEmptySearch) {
        score += profile.speed * 0.12;
        if (deck.sparks > 90000 && deck.score < 84) score -= 30;
    }

    /* Recency intent. */
    if (intent.recency.length) {
        score += getFinderRecencyScore(deck.date) * 1.6;
    }

    /* Budget intents. */
    if (intent.budget.includes("budget")) {
        if (deck.sparks <= 20000) score += 160;
        else if (deck.sparks <= 30000) score += 95;
        else if (deck.sparks <= 40000) score += 25;
        else score -= 180;
        score += deck.score * 0.55;
    }

    if (intent.budget.includes("super-budget")) {
        if (deck.sparks <= 10000) score += 190;
        else if (deck.sparks <= 16000) score += 105;
        else score -= 220;
        score += deck.score * 0.45;
    }

    if (intent.budget.includes("p2w")) {
        if (deck.sparks >= 65000) score += 75;
        else if (deck.sparks >= 45000) score += 45;
        else score -= 45;
        score += deck.power * 0.35;
    }

    /* Explicit constraints. */
    for (const hero of intent.heroes) {
        if (finderDeckMatchesHero(deck, hero)) score += 240;
        else score -= 400;
    }

    for (const card of intent.cards) {
        if (finderDeckContainsCard(deck, card)) score += 270;
        else score -= 420;
    }

    for (const author of intent.authors) {
        if (normalizeSearch(deck.author) === normalizeSearch(author)) score += 200;
        else score -= 300;
    }

    for (const cls of intent.classes) {
        if (deck.classes.some(c => normalizeKeyValue(c) === cls)) score += 100;
        else score -= 140;
    }

    for (const side of intent.side) {
        if (deck.side === side) score += 110;
        else score -= 240;
    }

    /* Archetypes: fit weight flips with the goal.
       Plain "aggro" -> fit dominates; "+strongest" -> quality does. */
    for (const arch of intent.archetypes) {
        const fit = getDeckArchetypeScore(deck, arch);
        const fitWeight = (wantsStrongest || wantsLawnWarz || isEmptySearch) ? 1.7 : 3.4;

        score += fit * fitWeight;

        if (fit < 45) score -= wantsStrongest ? 280 : 420;
        else if (fit >= 80) score += 60;
    }

    /* Keywords (card abilities), scored by copies. */
    for (const kw of intent.keywords) {
        const copies = getFinderKeywordCopies(deck, kw);

        if (copies >= 12) score += 130;
        else if (copies >= 7) score += 90;
        else if (copies >= 4) score += 50;
        else if (copies >= 2) score += 15;
        else score -= 90;
    }

    /* Tribes. */
    for (const tribe of intent.tribes) {
        const tribeCopies = getProfileTribeScore(deck, tribe);

        if (tribeCopies >= 14) score += 120;
        else if (tribeCopies >= 8) score += 80;
        else if (tribeCopies >= 4) score += 35;
        else score -= 60;
    }

    for (const rarity of intent.rarity) {
        if (deck.rarities.includes(rarity)) score += 25;
    }

    for (const setName of intent.set) {
        if (deck.sets.includes(setName)) score += 20;
    }

    for (const cost of intent.cost) {
        const costCopies = getDeckCostCopies(deck, Number(cost));
        if (costCopies >= 6) score += 42;
        else if (costCopies >= 3) score += 22;
    }

    /* Tiny raw-text fallback for exact deck-name searches. */
    if (intent.rawQuery) {
        const q = normalizeSearch(intent.rawQuery);
        if (normalizeSearch(deck.name) === q) score += 55;
        else if (normalizeSearch(deck.name).includes(q) && q.length >= 5) score += 25;
    }

    return Math.round(score * 100) / 100;
}

function applyFinderHardFilters(decks, intent) {
    let filtered = decks;

    if (intent.heroes.length) {
        const f = filtered.filter(deck =>
            intent.heroes.some(hero => finderDeckMatchesHero(deck, hero)));
        if (f.length) filtered = f;
    }

    if (intent.cards.length) {
        const f = filtered.filter(deck =>
            intent.cards.every(card => finderDeckContainsCard(deck, card)));
        if (f.length) filtered = f;
    }

    if (intent.authors.length) {
        const f = filtered.filter(deck =>
            intent.authors.some(a => normalizeSearch(deck.author) === normalizeSearch(a)));
        if (f.length) filtered = f;
    }

    if (intent.side.length) {
        const f = filtered.filter(deck =>
            intent.side.some(side => deck.side === side));
        if (f.length) filtered = f;
    }

    if (intent.classes.length) {
        const f = filtered.filter(deck =>
            intent.classes.every(cls =>
                deck.classes.some(deckClass => normalizeKeyValue(deckClass) === cls)));
        if (f.length) filtered = f;
    }

    if (intent.recency.length) {
        const f = filtered.filter(deck => getFinderRecencyScore(deck.date) >= 72); // ~90 days
        if (f.length >= 5) filtered = f;
    }

    if (intent.budget.includes("super-budget")) {
        const f = filtered.filter(deck => deck.sparks <= 12000);
        if (f.length) filtered = f;
    } else if (intent.budget.includes("budget")) {
        const f = filtered.filter(deck => deck.sparks <= 30000);
        if (f.length) filtered = f;
    } else if (intent.budget.includes("p2w")) {
        const f = filtered.filter(deck => deck.sparks >= 45000);
        if (f.length) filtered = f;
    }

    return filtered;
}

function recommendDecksForIntent(intent) {
    let decks = getFinderDeckCache();
    if (!decks.length) return [];

    decks = applyFinderHardFilters(decks, intent);

    const isEmptySearch = !intent.rawQuery && !intent.keys.length;
    const wantsStrongest = intent.goals.includes("strongest");
    const wantsQuality = wantsStrongest || isEmptySearch || intent.goals.includes("lawn-warz");

    if (intent.archetypes.length) {
        let pool = decks.filter(d =>
            intent.archetypes.every(a => getDeckArchetypeScore(d, a) >= 60));

        if (pool.length < 6) {
            pool = decks.filter(d =>
                intent.archetypes.every(a => getDeckArchetypeScore(d, a) >= 48));
        }

        if (pool.length >= 4) decks = pool;
    }

    if (wantsQuality) {
        const qualityFiltered = decks.filter(d => isFinderQualityDeck(d, intent));
        if (qualityFiltered.length >= 5) decks = qualityFiltered;
    }

    return decks
        .map(deck => ({
            ...deck,
            finderScore: scoreDeckForFinderIntent(deck, intent)
        }))
        .sort((a, b) => {
            if (b.finderScore !== a.finderScore) return b.finderScore - a.finderScore;
            return b.score - a.score;
        })
        .slice(0, 16);
}

function queueFinderRecommendation(delay = 140) {
    clearTimeout(finderRecommendTimer);
    finderRecommendTimer = setTimeout(updateFinderRecommendation, delay);
}

function updateFinderRecommendation() {
    const query = finderSearchInput?.value?.trim() || "";
    const intent = getFinderIntent(query);
    const results = recommendDecksForIntent(intent);

    finderCurrentResults = results;
    finderLastQuery = query;

    if (!results.length) {
        renderFinderNoResult(intent);
        return;
    }

    const isEmptySearch = !intent.rawQuery && !intent.keys.length;

    if (isEmptySearch) {
        finderRerollIndex = Math.floor(Math.random() * Math.min(5, results.length));
    } else {
        finderRerollIndex = 0;
    }

    renderFinderDeckResult(results[finderRerollIndex]);

    if (window.FINDER_DEBUG) {
        console.table(results.slice(0, 10).map((d, i) => ({
            Rank: i + 1,
            Name: d.name,
            Hero: d.hero,
            Grade: d.grade,
            Score: d.score,
            Finder: d.finderScore,
            Aggro: Math.round(getFinderDeckProfile(d).aggro),
            Control: Math.round(getFinderDeckProfile(d).control),
            AvgCost: d.avgCost.toFixed(2),
            Sparks: d.sparks
        })));
    }
}

/* ============================================================
   SECTION 17 — inline deck sheet renderer (always open)
   ============================================================ */

function finderGradeColor(deck) {
    return deck.gradeColor ||
        deck.rawDeck?.verdict?.gradeColor ||
        FINDER_GRADE_COLORS[String(deck.grade || "?").charAt(0).toUpperCase()] ||
        "#fff";
}

function finderBuildHeroes(deck) {
    if (deck.hero && deck.hero !== "Unknown Hero") {
        return deck.hero.split(/\s*\/\s*/).map(n => ({
            name: n.trim(),
            img: `hero_images/${n.trim().replace(/[\s-]+/g, "_")}.webp`
        }));
    }

    if (deck.classes?.length === 1) {
        const c = deck.classes[0];
        return [{
            name: c,
            img: `hero_images/${c.toLowerCase().replace(/[\s-]+/g, "_")}.webp`
        }];
    }

    return [];
}

function finderHeroPortraits(heroes) {
    if (typeof pvzHeroPortraits === "function") {
        return pvzHeroPortraits(heroes, true);
    }

    if (!heroes.length) {
        return `<div class="pvz-hero-portrait" aria-hidden="true">?</div>`;
    }

    return heroes.map(h => {
        const initials = h.name
            .split(/[\s-]+/)
            .map(w => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

        return `<div class="pvz-hero-portrait" title="${escapeHtml(h.name)}">
            <img src="${h.img}" alt="${escapeHtml(h.name)}" loading="eager" decoding="async" onerror="this.remove()">${initials}
        </div>`;
    }).join("");
}

function finderCardTilesHtml(deck) {
    return (deck.cards || []).map((cardString, i) => {
        const parsed = parseFinderDeckCardEntry(cardString);
        if (!parsed) return "";

        const display = displayCardName(parsed.name);
        const db = display.replace(/ /g, "_");

        return `<div class="pvz-card" style="--i:${i}">
            <img src="card_images/${db}.png" alt="${escapeHtml(display)}" title="${escapeHtml(display)}"
                 loading="lazy" decoding="async" fetchpriority="low"
                 onerror="this.onerror=null;this.src='card_images/${db}.webp'">
            <span class="pvz-card-qty">x${parsed.count}</span>
        </div>`;
    }).join("");
}

/* Deck code identical to the modal's Analyze format. */
function finderEncodeDeckCode(deck) {
    const cardDb = resolveFinderCardDatabase();
    if (!cardDb) return null;

    const dict = Object.keys(cardDb).sort();
    const indexMap = new Map();
    dict.forEach((name, i) => indexMap.set(name, i));

    const tokens = [];

    for (const entry of deck.cardEntries || []) {
        const idx = indexMap.get(entry.key) ?? indexMap.get(entry.name.replace(/ /g, "_"));
        if (idx === undefined) return null;

        const cardIndex = idx.toString(36);
        tokens.push(entry.count === 4 ? cardIndex : `${cardIndex}.${entry.count}`);
    }

    return tokens.length ? tokens.join("-") : null;
}

function finderFlashButton(btn, msg, ms = 1500) {
    const original = btn.innerHTML;
    btn.textContent = msg;
    btn.disabled = true;
    setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
    }, ms);
}

function finderCopyText(text, btn) {
    const fallbackCopy = () => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
        document.body.removeChild(ta);
        finderFlashButton(btn, ok ? "Copied!" : "Copy failed");
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => finderFlashButton(btn, "Copied!"))
            .catch(fallbackCopy);
    } else {
        fallbackCopy();
    }
}

function renderFinderDeckResult(deck) {
    if (!finderResult || !deck) return;

    finderResult.classList.remove("hidden");

    const heroes = finderBuildHeroes(deck);
    const factionClass = deck.side === "zombie" ? "zombie-deck" : "plant-deck";
    const gradeColor = finderGradeColor(deck);
    const creditIcon = deck.author === "FryEmUp" ? "fryemup.jpg" : "discord.webp";
    const dateStr = deck.date && deck.date !== "Unknown Date" ? deck.date : "Unknown Date";

    const videoId = (typeof getYouTubeId === "function" && deck.youtubeUrl)
        ? getYouTubeId(deck.youtubeUrl)
        : "";
    const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
    const ytTitle = deck.rawDeck?.youtube_title || "Watch on YouTube";

    const videoHtml = (deck.author === "FryEmUp" && deck.youtubeUrl && thumb) ? `
        <a class="pvz-sheet-video" href="${escapeHtml(deck.youtubeUrl)}" target="_blank" rel="noopener" title="${escapeHtml(ytTitle)}">
            <span class="pvz-video-thumb"><img src="${thumb}" alt="" loading="lazy" decoding="async"><span class="pvz-play"></span></span>
            <span class="pvz-video-title">${escapeHtml(ytTitle)}</span>
        </a>` : "";

    finderResult.innerHTML = `
        <div class="finder-sheet-wrap">
            <div class="pvz-sheet finder-sheet ${factionClass}" role="region" aria-label="${escapeHtml(deck.name)}">
                <div class="pvz-sheet-banner">
                    <div class="pvz-sheet-heroes ${heroes.length === 2 ? "two" : ""}">
                        ${finderHeroPortraits(heroes)}
                    </div>

                    <div class="pvz-sheet-titlewrap">
                        <h2 class="pvz-sheet-title">${escapeHtml(deck.name)}</h2>
                        <div class="pvz-sheet-meta">
                            <span class="pvz-meta-text">
                                <span class="pvz-meta-item">
                                    <img class="pvz-meta-credit" src="${creditIcon}" alt="">${escapeHtml(deck.author)}
                                </span>
                                <span class="pvz-meta-item">${escapeHtml(dateStr)}</span>
                                <span class="pvz-meta-item">${escapeHtml(deck.hero)}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div class="pvz-sheet-body">
                    <div class="pvz-card-grid">${finderCardTilesHtml(deck)}</div>

                    <div class="pvz-deck-side">
                        <div class="pvz-deck-rating" style="color:${gradeColor};">
                            <span class="pvz-rating-label">Rating</span>
                            <span class="pvz-rating-grade">${escapeHtml(deck.grade || "?")}</span>
                        </div>

                        <div class="pvz-deck-rating pvz-deck-sparks" style="color:#4dd0e1;">
                            <span class="pvz-rating-label">Sparks</span>
                            <span class="pvz-rating-grade">${formatFinderSparks(deck.sparks)}</span>
                        </div>

                        <button id="finderAnalyzeBtn" class="pvz-analyze-deck-btn" type="button">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>
                            </svg>
                            Analyze Deck
                        </button>

                        <button id="finderShareBtn" class="pvz-analyze-deck-btn" type="button">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                            </svg>
                            Share Link
                        </button>

                        <button id="finderTryAgainBtn" class="pvz-analyze-deck-btn finder-try-again" type="button">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/>
                            </svg>
                            Try Another
                        </button>
                    </div>

                    ${videoHtml}
                </div>
            </div>
        </div>`;

    finderBindResultActions(deck);
}

function renderFinderNoResult(intent) {
    if (!finderResult) return;

    finderResult.classList.remove("hidden");

    finderResult.innerHTML = `
        <div class="finder-sheet-wrap">
            <div class="finder-sheet finder-sheet-empty">
                <div class="finder-empty-grade">?</div>
                <h3>No good match found</h3>
                <p>Try a broader search like &ldquo;budget aggro&rdquo; or &ldquo;Rose control&rdquo;.</p>
            </div>
        </div>`;
}

function finderBindResultActions(deck) {
    const analyzeBtn = document.getElementById("finderAnalyzeBtn");
    const shareBtn = document.getElementById("finderShareBtn");
    const tryAgainBtn = document.getElementById("finderTryAgainBtn");

    if (analyzeBtn) {
        analyzeBtn.onclick = (e) => {
            e.stopPropagation();

            const code = finderEncodeDeckCode(deck);
            if (!code) {
                alert("Could not analyze this deck because one or more cards could not be found.");
                return;
            }

            const analyzeUrl = `${window.location.origin}${window.location.pathname}?deck=${code}#crafter`;
            const sameQuery = window.location.search === `?deck=${code}`;

            window.location.href = analyzeUrl;
            if (sameQuery) window.location.reload();
        };
    }

    if (shareBtn) {
        shareBtn.onclick = (e) => {
            e.stopPropagation();

            let shareUrl = null;

            if (typeof buildCurrentDeckShareUrl === "function") {
                const deckToShare = (typeof pvzBuildAnalyzeDeck === "function" && deck.rawDeck)
                    ? pvzBuildAnalyzeDeck(deck.rawDeck)
                    : (deck.cardEntries || []).map(en => ({ name: en.key, count: en.count }));

                shareUrl = buildCurrentDeckShareUrl(deckToShare);
            }

            if (!shareUrl) {
                const code = finderEncodeDeckCode(deck);
                if (code) shareUrl = `${window.location.origin}${window.location.pathname}?deck=${code}`;
            }

            if (!shareUrl) {
                alert("Could not share this deck because one or more cards could not be found.");
                return;
            }

            finderCopyText(shareUrl, shareBtn);
        };
    }

    if (tryAgainBtn) {
        tryAgainBtn.onclick = (e) => {
            e.stopPropagation();
            if (!finderCurrentResults.length) return;

            finderRerollIndex = (finderRerollIndex + 1) % Math.min(8, finderCurrentResults.length);
            renderFinderDeckResult(finderCurrentResults[finderRerollIndex]);
        };
    }
}

/* ============================================================
   SECTION 18 — init
   ============================================================ */

function initDeckFinderSmartSearch() {
    if (!finderSearchInput || !finderSuggestions) return;

    finderKeyIndex = buildFinderKeyIndex();
    buildFinderAliasIndex();

    renderFinderSuggestions("");
    updateFinderParsedTerms("");

    finderSearchInput.addEventListener("input", () => {
        finderRerollIndex = 0;
        const query = finderSearchInput.value;

        updateFinderParsedTerms(query);
        renderFinderSuggestions(query);
        queueFinderRecommendation();
    });

    finderSearchInput.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();

        const best = getFinderSuggestions(finderSearchInput.value, 1)[0];
        if (best) {
            addFinderKeyToSearch(best);
            queueFinderRecommendation(0);
        }
    });

    finderSuggestions.addEventListener("click", (e) => {
        const chip = e.target.closest(".finder-suggestion-chip");
        if (!chip) return;

        const key = finderKeyIndex.find(k => k.id === chip.dataset.keyId);
        if (!key) return;

        addFinderKeyToSearch(key);
        finderRerollIndex = 0;
        queueFinderRecommendation(0);
    });

    // Click (or Enter on) a parsed term chip to remove it.
    finderParsedTerms?.addEventListener("click", (e) => {
        const term = e.target.closest(".finder-term");
        if (!term) return;
        removeFinderKeyFromSearch(term.dataset.keyId);
    });

    finderParsedTerms?.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const term = e.target.closest(".finder-term");
        if (!term) return;
        e.preventDefault();
        removeFinderKeyFromSearch(term.dataset.keyId);
    });
}

initDeckFinderSmartSearch();

/* ============================================================
   SECTION 19 — console utility (unchanged behavior)
   ============================================================ */

window.getTopDecksByMonth = function (monthNumber, customCtx) {
    const db = resolveFinderFullDatabase();
    const cardDb = resolveFinderCardDatabase();

    if (!db) { console.error("Error: 'fullDatabase' could not be found."); return []; }
    if (!cardDb) { console.error("Error: 'cardDatabase' could not be found."); return []; }

    const monthNames = {
        1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
        7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"
    };

    const monthPatterns = {
        1: "jan(uary)?", 2: "feb(ruary)?", 3: "mar(ch)?", 4: "apr(il)?",
        5: "may", 6: "jun(e)?", 7: "jul(y)?", 8: "aug(ust)?",
        9: "sep(t(ember)?)?", 10: "oct(ober)?", 11: "nov(ember)?", 12: "dec(ember)?"
    };

    const targetMonthName = monthNames[monthNumber];
    const patternStr = monthPatterns[monthNumber];

    if (!targetMonthName) {
        console.error("Error: Invalid month number (1-12).");
        return [];
    }

    const dateRegex = new RegExp(`^${patternStr}\\s+\\d+,\\s+2026$`, "i");
    const compiledDecks = [];
    const seenDecks = new Set();

    function getHeroFromCards(cards) {
        const uniqueClasses = new Set();

        for (const cardRaw of cards) {
            const parsed = parseFinderDeckCardEntry(cardRaw);
            if (!parsed) continue;

            const cardData = getFinderCardData(parsed.name, cardDb);
            if (cardData?.Class) uniqueClasses.add(cardData.Class.trim());
        }

        return FINDER_HERO_MAP[[...uniqueClasses].sort().join(",")] || "Unknown Hero";
    }

    for (const deckKey in db) {
        if (!Object.prototype.hasOwnProperty.call(db, deckKey)) continue;

        const deck = db[deckKey];
        if (!deck.upload_date || !deck.cards) continue;
        if (!dateRegex.test(deck.upload_date.trim())) continue;

        try {
            const activeCtx = customCtx || getFinderActiveCtx();
            const deckSignature = getFinderDeckSignature(deck.cards);

            if (seenDecks.has(deckSignature)) continue;
            seenDecks.add(deckSignature);

            const verdict = getDeckVerdictFromCards(deck.cards, deckKey, activeCtx);

            compiledDecks.push({
                hero: getHeroFromCards(deck.cards),
                id: deckKey,
                name: deck.name || "Unnamed Deck",
                score: parseFloat(verdict.score.toFixed(2)),
                grade: verdict.grade,
                cost: verdict.costLabel,
                synergy: verdict.synergyScore,
                power: verdict.powerScore,
                consistency: verdict.consistencyScore,
                date: deck.upload_date,
                author: deck.credit || "Unknown",
                cards: deck.cards
            });
        } catch (error) {
            console.warn(`Skipping deck ${deckKey} due to evaluation error:`, error);
        }
    }

    const topDecksArray = compiledDecks.sort((a, b) => b.score - a.score).slice(0, 10);

    if (!topDecksArray.length) {
        console.log(`%c No decks found for ${targetMonthName} 2026.`, "color: #ff9900; font-weight: bold;");
    } else {
        console.log(
            `%c--- TOP ${topDecksArray.length} HIGHEST SCORING DECKS (${targetMonthName.toUpperCase()} 2026) ---`,
            "color: #00ffcc; font-weight: bold; font-size: 13px;"
        );

        console.table(topDecksArray.map((d, index) => ({
            Rank: index + 1,
            Hero: d.hero,
            "Deck Name": d.name,
            Score: d.score,
            Grade: d.grade,
            Cost: d.cost,
            Synergy: d.synergy,
            Power: d.power,
            Consistency: d.consistency,
            Date: d.date,
            Author: d.author
        })));

        console.log(`%c\n--- FULL DECKLIST BREAKDOWNS ---`, "color: #ffcc00; font-weight: bold; font-size: 13px;");

        topDecksArray.forEach((d, index) => {
            console.log(
                `%c#${index + 1}: ${d.name} | Hero: ${d.hero} (Score: ${d.score} | Grade: ${d.grade})`,
                "color: #ffffff; background: #1a2226; font-weight: bold; padding: 4px 8px; border-left: 4px solid #00ffcc; margin-top: 10px;"
            );
            console.log(Array.isArray(d.cards) ? d.cards.join("\n") : d.cards);
        });
    }

    return topDecksArray;
};
    window.getTopDecksForHero = function (targetHero, customCtx) {
        // Fallback lookups for databases in global scope
        const db = window.fullDatabase || (typeof fullDatabase !== 'undefined' ? fullDatabase : null);
        const cardDb = window.cardDatabase || (typeof cardDatabase !== 'undefined' ? cardDatabase : null);

        if (!db) {
            console.error("Error: 'fullDatabase' could not be found in the global scope.");
            return [];
        }
        if (!cardDb) {
            console.error("Error: 'cardDatabase' could not be found in the global scope.");
            return [];
        }
        if (!targetHero) {
            console.error("Error: You must provide a hero name (e.g., 'Rose', 'Rustbolt') as the first parameter.");
            return [];
        }

        const heroMap = {
            // Plants
            "Mega-Grow,Smarty": "Green Shadow",
            "Kabloom,Solar": "Solar Flare",
            "Guardian,Solar": "Wall-Knight",
            "Mega-Grow,Solar": "Chompzilla",
            "Guardian,Kabloom": "Spudow",
            "Guardian,Smarty": "Citron / Beta-Carrotina",
            "Guardian,Mega-Grow": "Grass Knuckles",
            "Kabloom,Smarty": "Nightcap",
            "Kabloom,Mega-Grow": "Captain Combustible",
            "Smarty,Solar": "Rose",

            // Zombies
            "Brainy,Sneaky": "Super Brainz / Huge-Gigantacus",
            "Beastly,Hearty": "The Smash",
            "Crazy,Sneaky": "Impfinity",
            "Brainy,Hearty": "Rustbolt",
            "Beastly,Crazy": "Electric Boogaloo",
            "Beastly,Sneaky": "Brain Freeze",
            "Brainy,Crazy": "Professor Brainstorm",
            "Beastly,Brainy": "Immorticia",
            "Crazy,Hearty": "Z-Mech",
            "Hearty,Sneaky": "Neptuna"
        };

        const normalizedTarget = targetHero.trim().toLowerCase();
        const matchingDecks = []; // Tracks all valid decks found for this hero
        const seenDecks = new Set(); // Tracks unique deck compositions

        for (const deckKey in db) {
            if (!Object.prototype.hasOwnProperty.call(db, deckKey)) continue;

            const deck = db[deckKey];
            if (!deck.upload_date || !deck.cards) continue;

            try {
                const activeCtx = customCtx || window.ctx || undefined;

                // Track unique classes found within this specific deck
                const uniqueClasses = new Set();

                for (const cardRaw of deck.cards) {
                    let parsedCardName = cardRaw.trim();

                    // Strip quantity prefix (e.g., "4x " or "x4 ")
                    const match = cardRaw.match(/^(\d+x?|x\d+)\s+(.+)$/i);
                    if (match) {
                        parsedCardName = match[2].trim();
                    }

                    // Create space and underscore variants to guarantee database hits
                    const keyWithUnderscores = parsedCardName.replace(/\s+/g, '_');
                    const keyWithSpaces = parsedCardName.replace(/_/g, ' ');

                    const cardData = cardDb[keyWithUnderscores] || cardDb[keyWithSpaces] || cardDb[parsedCardName];
                    if (cardData && cardData.Class) {
                        uniqueClasses.add(cardData.Class.trim());
                    }
                }

                // Alphabetize the unique classes found to flawlessly align with heroMap keys
                const classesArray = Array.from(uniqueClasses).sort();
                const classesKey = classesArray.join(',');

                const heroName = heroMap[classesKey];

                // If it doesn't match a valid two-class combo, skip it
                if (!heroName) continue;

                // Check if the current deck's hero matches the requested parameter
                if (!heroName.toLowerCase().includes(normalizedTarget)) continue;

                // Create a unique signature for the deck based on its cards
                const deckSignature = [...deck.cards]
                    .map(c => c.trim().toLowerCase().replace(/\s+/g, ' '))
                    .sort()
                    .join('|');

                // Prevent duplicate deck compositions from being evaluated
                if (seenDecks.has(deckSignature)) {
                    continue;
                }
                seenDecks.add(deckSignature);

                const verdict = getDeckVerdictFromCards(deck.cards, deckKey, activeCtx);
                const currentScore = parseFloat(verdict.score.toFixed(2));

                // Push every matching deck object into the list
                matchingDecks.push({
                    hero: heroName,
                    id: deckKey,
                    name: deck.name,
                    score: currentScore,
                    grade: verdict.grade,
                    cost: verdict.costLabel,
                    synergy: verdict.synergyScore,
                    power: verdict.powerScore,
                    consistency: verdict.consistencyScore,
                    date: deck.upload_date,
                    author: deck.credit || "Unknown",
                    cards: deck.cards
                });

            } catch (error) {
                console.warn(`Skipping deck ${deckKey} due to evaluation error:`, error);
            }
        }

        // Sort descending by score and slice the top 10 results
        const topDecksArray = matchingDecks
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        if (topDecksArray.length === 0) {
            console.log(`%c No valid decks found for hero: "${targetHero}".`, "color: #ff9900; font-weight: bold;");
        } else {
            console.log(`%c--- TOP ${topDecksArray.length} DECKS FOR ${targetHero.toUpperCase()} ---`, "color: #00ffcc; font-weight: bold; font-size: 13px;");

            // Map elements for console.table
            console.table(topDecksArray.map((d, index) => ({
                Rank: index + 1,
                Hero: d.hero,
                "Deck Name": d.name,
                Score: d.score,
                Grade: d.grade,
                Synergy: d.synergy,
                Power: d.power,
                Consistency: d.consistency,
                Author: d.author
            })));

            // Log out the full decklists with clean text separation
            console.log(`%c\n--- FULL DECKLIST BREAKDOWNS ---`, "color: #ffcc00; font-weight: bold; font-size: 13px;");

            topDecksArray.forEach((d, index) => {
                console.log(`%c#${index + 1} - ${d.hero}: ${d.name} (Score: ${d.score} | Grade: ${d.grade})`, "color: #ffffff; background: #1a2226; font-weight: bold; padding: 4px 8px; border-left: 4px solid #00ffcc; margin-top: 10px;");
                console.log(d.cards.join("\n"));
            });
        }

        return topDecksArray;
    };
    window.getTopZombieDecks = function (limit = 10, customCtx) {
    const db = resolveFinderFullDatabase();
    const cardDb = resolveFinderCardDatabase();

    if (!db) {
        console.error("Error: 'fullDatabase' could not be found.");
        return [];
    }

    if (!cardDb) {
        console.error("Error: 'cardDatabase' could not be found.");
        return [];
    }

    const parsedLimit = Math.max(1, Math.floor(Number(limit) || 10));
    const activeCtx = customCtx || getFinderActiveCtx();

    // Keys must remain alphabetized because detected classes are sorted below.
    const zombieHeroMap = {
        "Brainy,Sneaky": "Super Brainz / Huge-Gigantacus",
        "Beastly,Hearty": "The Smash",
        "Crazy,Sneaky": "Impfinity",
        "Brainy,Hearty": "Rustbolt",
        "Beastly,Crazy": "Electric Boogaloo",
        "Beastly,Sneaky": "Brain Freeze",
        "Brainy,Crazy": "Professor Brainstorm",
        "Beastly,Brainy": "Immorticia",
        "Crazy,Hearty": "Z-Mech",
        "Hearty,Sneaky": "Neptuna"
    };

    // Accepts full or abbreviated month names, such as:
    // "January 5, 2026", "Jan 5, 2026", "July 21, 2026", etc.
    const date2026Regex =
        /^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},\s+2026$/i;

    const matchingDecks = [];
    const seenDecks = new Set();

    function getZombieHeroFromCards(cards) {
        const uniqueClasses = new Set();

        for (const cardRaw of cards) {
            const parsed = parseFinderDeckCardEntry(cardRaw);
            if (!parsed) continue;

            const cardData = getFinderCardData(parsed.name, cardDb);

            if (cardData?.Class) {
                uniqueClasses.add(cardData.Class.trim());
            }
        }

        const classesKey = [...uniqueClasses]
            .sort()
            .join(",");

        return zombieHeroMap[classesKey] || null;
    }

    for (const deckKey in db) {
        if (!Object.prototype.hasOwnProperty.call(db, deckKey)) continue;

        const deck = db[deckKey];

        if (!deck?.upload_date || !Array.isArray(deck.cards)) continue;
        if (!date2026Regex.test(deck.upload_date.trim())) continue;

        try {
            const hero = getZombieHeroFromCards(deck.cards);

            // Skip Plant decks and decks whose hero cannot be identified.
            if (!hero) continue;

            const deckSignature = getFinderDeckSignature(deck.cards);

            if (seenDecks.has(deckSignature)) continue;
            seenDecks.add(deckSignature);

            const verdict = getDeckVerdictFromCards(
                deck.cards,
                deckKey,
                activeCtx
            );

            matchingDecks.push({
                hero,
                id: deckKey,
                name: deck.name || "Unnamed Deck",
                score: parseFloat(verdict.score.toFixed(2)),
                grade: verdict.grade,
                cost: verdict.costLabel,
                synergy: verdict.synergyScore,
                power: verdict.powerScore,
                consistency: verdict.consistencyScore,
                date: deck.upload_date,
                author: deck.credit || "Unknown",
                cards: deck.cards
            });
        } catch (error) {
            console.warn(
                `Skipping Zombie deck ${deckKey} due to evaluation error:`,
                error
            );
        }
    }

    const topDecksArray = matchingDecks
        .sort((a, b) => {
            // Primary ranking: overall score
            if (b.score !== a.score) return b.score - a.score;

            // Tiebreakers
            if (b.synergy !== a.synergy) return b.synergy - a.synergy;
            if (b.power !== a.power) return b.power - a.power;

            return b.consistency - a.consistency;
        })
        .slice(0, parsedLimit);

    if (!topDecksArray.length) {
        console.log(
            "%c No valid Zombie decks found from 2026.",
            "color: #ff9900; font-weight: bold;"
        );

        return [];
    }

    console.log(
        `%c--- TOP ${topDecksArray.length} ZOMBIE DECKS FROM 2026 ---`,
        "color: #00ffcc; font-weight: bold; font-size: 13px;"
    );

    console.table(
        topDecksArray.map((deck, index) => ({
            Rank: index + 1,
            Hero: deck.hero,
            "Deck Name": deck.name,
            Score: deck.score,
            Grade: deck.grade,
            Cost: deck.cost,
            Synergy: deck.synergy,
            Power: deck.power,
            Consistency: deck.consistency,
            Date: deck.date,
            Author: deck.author
        }))
    );

    console.log(
        "%c\n--- FULL DECKLIST BREAKDOWNS ---",
        "color: #ffcc00; font-weight: bold; font-size: 13px;"
    );

    topDecksArray.forEach((deck, index) => {
        console.log(
            `%c#${index + 1}: ${deck.name} | Hero: ${deck.hero} ` +
            `(Score: ${deck.score} | Grade: ${deck.grade})`,
            "color: #ffffff; background: #1a2226; font-weight: bold; " +
            "padding: 4px 8px; border-left: 4px solid #00ffcc; " +
            "margin-top: 10px;"
        );

        console.log(deck.cards.join("\n"));
    });

    return topDecksArray;
};
    window.getTop10DecksForCard = function (targetCard, customCtx) {
        if (!targetCard || typeof targetCard !== 'string') {
            console.error("Error: Please provide a target card name as the first parameter (e.g., 'Teleport').");
            return [];
        }

        // Direct scope lookups since they are not attached to window
        const db = typeof fullDatabase !== 'undefined' ? fullDatabase : null;
        const cardDb = typeof cardDatabase !== 'undefined' ? cardDatabase : null;

        if (!db) {
            console.error("Error: 'fullDatabase' could not be found in the accessible scope.");
            return [];
        }
        if (!cardDb) {
            console.error("Error: 'cardDatabase' could not be found in the accessible scope.");
            return [];
        }

        const heroMap = {
            // Plants
            "Mega-Grow,Smarty": "Green Shadow",
            "Kabloom,Solar": "Solar Flare",
            "Guardian,Solar": "Wall-Knight",
            "Mega-Grow,Solar": "Chompzilla",
            "Guardian,Kabloom": "Spudow",
            "Guardian,Smarty": "Citron / Beta-Carrotina",
            "Guardian,Mega-Grow": "Grass Knuckles",
            "Kabloom,Smarty": "Nightcap",
            "Kabloom,Mega-Grow": "Captain Combustible",
            "Smarty,Solar": "Rose",

            // Zombies
            "Brainy,Sneaky": "Super Brainz / Huge-Gigantacus",
            "Beastly,Hearty": "The Smash",
            "Crazy,Sneaky": "Impfinity",
            "Brainy,Hearty": "Rustbolt",
            "Beastly,Crazy": "Electric Boogaloo",
            "Beastly,Sneaky": "Brain Freeze",
            "Brainy,Crazy": "Professor Brainstorm",
            "Beastly,Brainy": "Immorticia",
            "Crazy,Hearty": "Z-Mech",
            "Hearty,Sneaky": "Neptuna"
        };

        const cardDecks = [];
        const seenDecks = new Set();

        for (const deckKey in db) {
            if (!Object.prototype.hasOwnProperty.call(db, deckKey)) continue;

            const deck = db[deckKey];
            if (!deck.cards) continue;

            try {
                // Safe evaluation of the local ctx variable
                const activeCtx = customCtx || (typeof ctx !== 'undefined' ? ctx : undefined);

                const uniqueClasses = new Set();
                let containsTargetCard = false;

                for (const cardRaw of deck.cards) {
                    let parsedCardName = cardRaw.trim();

                    const match = cardRaw.match(/^(\d+x?|x\d+)\s+(.+)$/i);
                    if (match) {
                        parsedCardName = match[2].trim();
                    }

                    if (parsedCardName.toLowerCase().includes(targetCard.toLowerCase().trim())) {
                        containsTargetCard = true;
                    }

                    const keyWithUnderscores = parsedCardName.replace(/\s+/g, '_');
                    const keyWithSpaces = parsedCardName.replace(/_/g, ' ');

                    const cardData = cardDb[keyWithUnderscores] || cardDb[keyWithSpaces] || cardDb[parsedCardName];
                    if (cardData && cardData.Class) {
                        uniqueClasses.add(cardData.Class.trim());
                    }
                }

                if (!containsTargetCard) {
                    continue;
                }

                const classesArray = Array.from(uniqueClasses).sort();
                const classesKey = classesArray.join(',');

                const heroName = heroMap[classesKey] || "Unknown Hero";

                const deckSignature = [...deck.cards]
                    .map(c => c.trim().toLowerCase().replace(/\s+/g, ' '))
                    .sort()
                    .join('|');

                if (seenDecks.has(deckSignature)) {
                    continue;
                }

                seenDecks.add(deckSignature);

                // Dynamically check for the function in the local scope, falling back to window if needed
                let verdict;
                if (typeof getDeckVerdictFromCards === 'function') {
                    verdict = getDeckVerdictFromCards(deck.cards, deckKey, activeCtx);
                } else {
                    throw new Error("getDeckVerdictFromCards could not be found in the current scope.");
                }

                const currentScore = verdict.score;

                cardDecks.push({
                    hero: heroName,
                    id: deckKey,
                    name: deck.name || "Unnamed Deck",
                    score: parseFloat(currentScore.toFixed(2)),
                    grade: verdict.grade,
                    cost: verdict.costLabel,
                    synergy: verdict.synergyScore,
                    power: verdict.powerScore,
                    consistency: verdict.consistencyScore,
                    date: deck.upload_date || "Unknown Date",
                    author: deck.credit || "Unknown",
                    cards: deck.cards
                });

            } catch (error) {
                console.warn(`Skipping deck ${deckKey} due to evaluation error:`, error);
            }
        }

        cardDecks.sort((a, b) => b.score - a.score);
        const top10Decks = cardDecks.slice(0, 10);

        if (top10Decks.length === 0) {
            console.log(`%c No valid decks found containing the card "${targetCard}".`, "color: #ff9900; font-weight: bold;");
        } else {
            console.log(`%c--- TOP ${top10Decks.length} DECKS CONTAINING "${targetCard.toUpperCase()}" (ALL TIME) ---`, "color: #00ffcc; font-weight: bold; font-size: 13px;");

            console.table(top10Decks.map(d => ({
                "Hero": d.hero,
                "Deck Name": d.name,
                "Score": d.score,
                "Grade": d.grade,
                "Synergy": d.synergy,
                "Power": d.power,
                "Consistency": d.consistency,
                "Year": d.date.split(' ').pop() || d.date,
                "Author": d.author
            })));

            console.log(`%c\n--- FULL DECKLIST BREAKDOWNS ---`, "color: #ffcc00; font-weight: bold; font-size: 13px;");

            top10Decks.forEach((d, index) => {
                console.log(`%c#${index + 1}: ${d.name} | Hero: ${d.hero} (Score: ${d.score} | Grade: ${d.grade})`, "color: #ffffff; background: #1a2226; font-weight: bold; padding: 4px 8px; border-left: 4px solid #00ffcc; margin-top: 10px;");
                console.log(d.cards.join("\n"));
            });
        }

        return top10Decks;
    };
    window.getTop10BudgetDecks = function (customCtx) {
        // Safe lookup for variables not explicitly attached to window
        const db = typeof fullDatabase !== 'undefined' ? fullDatabase : null;
        const cardDb = typeof cardDatabase !== 'undefined' ? cardDatabase : null;

        if (!db) {
            console.error("Error: 'fullDatabase' could not be found in the accessible scope.");
            return [];
        }
        if (!cardDb) {
            console.error("Error: 'cardDatabase' could not be found in the accessible scope.");
            return [];
        }

        const heroMap = {
            // Plants
            "Mega-Grow,Smarty": "Green Shadow",
            "Kabloom,Solar": "Solar Flare",
            "Guardian,Solar": "Wall-Knight",
            "Mega-Grow,Solar": "Chompzilla",
            "Guardian,Kabloom": "Spudow",
            "Guardian,Smarty": "Citron / Beta-Carrotina",
            "Guardian,Mega-Grow": "Grass Knuckles",
            "Kabloom,Smarty": "Nightcap",
            "Kabloom,Mega-Grow": "Captain Combustible",
            "Smarty,Solar": "Rose",

            // Zombies
            "Brainy,Sneaky": "Super Brainz / Huge-Gigantacus",
            "Beastly,Hearty": "The Smash",
            "Crazy,Sneaky": "Impfinity",
            "Brainy,Hearty": "Rustbolt",
            "Beastly,Crazy": "Electric Boogaloo",
            "Beastly,Sneaky": "Brain Freeze",
            "Brainy,Crazy": "Professor Brainstorm",
            "Beastly,Brainy": "Immorticia",
            "Crazy,Hearty": "Z-Mech",
            "Hearty,Sneaky": "Neptuna"
        };

        const sparkCosts = {
            "common": 0,
            "uncommon": 50,
            "rare": 250,
            "super rare": 1000,
            "super-rare": 1000,
            "event": 1000,
            "legendary": 4000
        };

        const compiledDecks = [];
        const seenDecks = new Set();

        for (const deckKey in db) {
            if (!Object.prototype.hasOwnProperty.call(db, deckKey)) continue;

            const deck = db[deckKey];
            if (!deck.cards || !Array.isArray(deck.cards)) continue;

            try {
                const activeCtx = customCtx || (typeof ctx !== 'undefined' ? ctx : undefined);
                const uniqueClasses = new Set();
                let totalSparks = 0;

                for (const cardRaw of deck.cards) {
                    let parsedCardName = cardRaw.trim();
                    let quantity = 1;

                    // Robust format checker matching your structural example: "4x", "4", or "x4"
                    const match = cardRaw.match(/^(\d+x?|x\d+)\s+(.+)$/i);
                    if (match) {
                        quantity = parseInt(match[1].replace(/x/i, ''), 10) || 1;
                        parsedCardName = match[2].trim();
                    }

                    // Database formatting clean-up keys
                    const keyWithUnderscores = parsedCardName.replace(/\s+/g, '_');
                    const keyWithSpaces = parsedCardName.replace(/_/g, ' ');

                    const cardData = cardDb[keyWithUnderscores] || cardDb[keyWithSpaces] || cardDb[parsedCardName];

                    if (cardData) {
                        if (cardData.Rarity) {
                            const rarity = cardData.Rarity.toLowerCase().trim();
                            totalSparks += (sparkCosts[rarity] || 0) * quantity;
                        }
                        if (cardData.Class) {
                            uniqueClasses.add(cardData.Class.trim());
                        }
                    }
                }

                // Filter: Enforce budget cutoff limit (< 40000 sparks)
                if (totalSparks >= 20000) {
                    continue;
                }

                // Unique deck deduplication signature logic
                const deckSignature = [...deck.cards]
                    .map(c => c.trim().toLowerCase().replace(/\s+/g, ' '))
                    .sort()
                    .join('|');

                if (seenDecks.has(deckSignature)) {
                    continue;
                }
                seenDecks.add(deckSignature);

                // Determine Hero via Classes mapping
                const classesArray = Array.from(uniqueClasses).sort();
                const classesKey = classesArray.join(',');
                const heroName = heroMap[classesKey] || "Unknown Hero";

                // Evaluate Deck Score
                let verdict;
                if (typeof getDeckVerdictFromCards === 'function') {
                    verdict = getDeckVerdictFromCards(deck.cards, deckKey, activeCtx);
                } else {
                    throw new Error("getDeckVerdictFromCards could not be found in the current scope.");
                }

                compiledDecks.push({
                    hero: heroName,
                    id: deckKey,
                    name: deck.name || "Unnamed Deck",
                    sparks: totalSparks,
                    score: parseFloat(verdict.score.toFixed(2)),
                    grade: verdict.grade,
                    cost: verdict.costLabel,
                    synergy: verdict.synergyScore,
                    power: verdict.powerScore,
                    consistency: verdict.consistencyScore,
                    date: deck.upload_date || "Unknown Date",
                    author: deck.credit || "Unknown",
                    cards: deck.cards
                });

            } catch (error) {
                console.warn(`Skipping deck ${deckKey} due to evaluation error:`, error);
            }
        }

        // Sort descending by score
        compiledDecks.sort((a, b) => b.score - a.score);
        const top10Budget = compiledDecks.slice(0, 10);

        // Logging output configurations
        if (top10Budget.length === 0) {
            console.log("%c No valid budget decks (under 40,000 sparks) found.", "color: #ff9900; font-weight: bold;");
        } else {
            console.log(`%c--- TOP ${top10Budget.length} HIGHEST SCORING BUDGET DECKS (ALL TIME) ---`, "color: #00ffcc; font-weight: bold; font-size: 13px;");

            // Clean high-level table rendering
            console.table(top10Budget.map(d => ({
                "Hero": d.hero,
                "Deck Name": d.name,
                "Sparks": d.sparks,
                "Score": d.score,
                "Grade": d.grade,
                "Synergy": d.synergy,
                "Power": d.power,
                "Consistency": d.consistency,
                "Year": d.date.split(' ').pop() || d.date,
                "Author": d.author
            })));

            // Print raw vertical decklist breakdown lists down the log stack
            console.log(`%c\n--- FULL DECKLIST BREAKDOWNS ---`, "color: #ffcc00; font-weight: bold; font-size: 13px;");

            top10Budget.forEach((d, index) => {
                console.log(`%c#${index + 1}: ${d.name} | Hero: ${d.hero} (Sparks: ${d.sparks} | Score: ${d.score} | Grade: ${d.grade})`, "color: #ffffff; background: #1a2226; font-weight: bold; padding: 4px 8px; border-left: 4px solid #00ffcc; margin-top: 10px;");
                console.log(d.cards.join("\n"));
            });
        }

        return top10Budget;
    };
    window.synthesizeSuperOriginalSTierDeck = async function (iterations = 50000, customCtx) {
        const db = typeof fullDatabase !== 'undefined' ? fullDatabase : null;
        const cardDb = typeof cardDatabase !== 'undefined' ? cardDatabase : null;

        if (!db || !cardDb) {
            console.error("Error: Missing database scope.");
            return;
        }

        const activeCtx = customCtx || (typeof ctx !== 'undefined' ? ctx : undefined);
        console.log(`%c[Initialization] Prepping high-speed evolutionary synthesizer for ${iterations} iterations...`, "color: #00ffcc");

        // --- STEP 1: Parse DB for Jaccard baselines ---
        const allDbSets = [];
        const seedDecks = [];

        const parseCardName = (raw) => {
            const match = raw.match(/^(\d+x?|x\d+)\s+(.+)$/i);
            return match ? match[2].trim() : raw.trim();
        };

        for (const key in db) {
            if (!db[key].cards) continue;
            const cardSet = new Set(db[key].cards.map(c => parseCardName(c).toLowerCase()));
            allDbSets.push(cardSet);

            try {
                const verdict = getDeckVerdictFromCards(db[key].cards, key, activeCtx);
                if (verdict.grade === 'S') seedDecks.push(db[key].cards);
            } catch (e) { }
        }

        const getSimilarity = (testSet) => {
            let maxSim = 0;
            for (const dbSet of allDbSets) {
                let intersection = 0;
                for (const item of testSet) {
                    // LOWERCASE the item before checking the set!
                    if (dbSet.has(item.toLowerCase())) intersection++;
                }
                const union = testSet.size + dbSet.size - intersection;
                const sim = union === 0 ? 0 : intersection / union;
                if (sim > maxSim) maxSim = sim;
            }
            return maxSim;
        };

        // --- STEP 2: Build Hero Pools ---
        const classPools = {};
        for (const key in cardDb) {
            const card = cardDb[key];
            if (!classPools[card.Class]) classPools[card.Class] = [];
            classPools[card.Class].push(card.Name);
        }

        const HERO_COMBOS = [
            "Mega-Grow,Smarty", "Kabloom,Solar", "Guardian,Solar", "Mega-Grow,Solar", "Guardian,Kabloom",
            "Guardian,Smarty", "Guardian,Mega-Grow", "Kabloom,Smarty", "Kabloom,Mega-Grow", "Smarty,Solar",
            "Brainy,Sneaky", "Beastly,Hearty", "Crazy,Sneaky", "Brainy,Hearty", "Beastly,Crazy",
            "Beastly,Sneaky", "Brainy,Crazy", "Beastly,Brainy", "Crazy,Hearty", "Hearty,Sneaky"
        ];

        const heroMap = {
            "Mega-Grow,Smarty": "Green Shadow", "Kabloom,Solar": "Solar Flare",
            "Guardian,Solar": "Wall-Knight", "Mega-Grow,Solar": "Chompzilla",
            "Guardian,Kabloom": "Spudow", "Guardian,Smarty": "Citron / Beta-Carrotina",
            "Guardian,Mega-Grow": "Grass Knuckles", "Kabloom,Smarty": "Nightcap",
            "Kabloom,Mega-Grow": "Captain Combustible", "Smarty,Solar": "Rose",
            "Brainy,Sneaky": "Super Brainz / Huge-Gigantacus", "Beastly,Hearty": "The Smash",
            "Crazy,Sneaky": "Impfinity", "Brainy,Hearty": "Rustbolt",
            "Beastly,Crazy": "Electric Boogaloo", "Beastly,Sneaky": "Brain Freeze",
            "Brainy,Crazy": "Professor Brainstorm", "Beastly,Brainy": "Immorticia",
            "Crazy,Hearty": "Z-Mech", "Hearty,Sneaky": "Neptuna"
        };

        const DISTRIBUTIONS = [
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3],
            [4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3],
            [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
        ];

        let globalBestDeck = null;
        let globalBestOriginality = -1;
        let globalBestScore = 0;
        let globalBestHero = "";

        const RUNS = Math.max(5, Math.floor(iterations / 2000));
        const STEPS_PER_RUN = Math.floor(iterations / RUNS);

        console.log(`%c[Search Config] Running ${RUNS} independent evolutionary branches. (${STEPS_PER_RUN} mutations per branch).`, "color: #ff9900");

        for (let run = 0; run < RUNS; run++) {
            await new Promise(r => setTimeout(r, 10)); // Keep UI responsive

            const heroCombo = HERO_COMBOS[Math.floor(Math.random() * HERO_COMBOS.length)];
            const classes = heroCombo.split(',');
            const validPool = [...new Set([...(classPools[classes[0]] || []), ...(classPools[classes[1]] || [])])];

            const dist = DISTRIBUTIONS[Math.floor(Math.random() * DISTRIBUTIONS.length)];
            if (validPool.length < dist.length) {
                console.log(`[Progress] Branch ${run + 1}/${RUNS} skipped (insufficient card pool)...`);
                continue;
            }

            let currentDeckSlots = [];
            let usedCards = new Set();

            let isSeeded = (Math.random() > 0.5 && seedDecks.length > 0);
            if (isSeeded) {
                const seed = seedDecks[Math.floor(Math.random() * seedDecks.length)];
                const seedUnique = seed.map(c => parseCardName(c));
                for (let i = 0; i < dist.length; i++) {
                    let cardName = seedUnique[i] && validPool.includes(seedUnique[i]) ? seedUnique[i] : null;
                    if (!cardName || usedCards.has(cardName)) {
                        const available = validPool.filter(c => !usedCards.has(c));
                        if (available.length === 0) break;
                        cardName = available[Math.floor(Math.random() * available.length)];
                    }
                    usedCards.add(cardName);
                    currentDeckSlots.push({ name: cardName, count: dist[i] });
                }
            } else {
                for (let count of dist) {
                    const available = validPool.filter(c => !usedCards.has(c));
                    if (available.length === 0) break;
                    let cardName = available[Math.floor(Math.random() * available.length)];
                    usedCards.add(cardName);
                    currentDeckSlots.push({ name: cardName, count: count });
                }
            }

            if (currentDeckSlots.length < dist.length) {
                console.log(`[Progress] Branch ${run + 1}/${RUNS} failed to build seed, skipping...`);
                continue;
            }

            let currentScore = 0;
            let isCurrentlySTier = false;
            let currentOriginality = -1;

            const initialArr = currentDeckSlots.map(s => `x${s.count} ${s.name}`);
            try {
                const verdict = getDeckVerdictFromCards(initialArr, "synth", activeCtx);
                currentScore = verdict.score;
                isCurrentlySTier = (verdict.grade === 'S');
                if (isCurrentlySTier) {
                    currentOriginality = 1 - getSimilarity(usedCards);
                }
            } catch (e) { }

            // --- The Climbing Loop ---
            for (let step = 0; step < STEPS_PER_RUN; step++) {
                if (step % 500 === 0) await new Promise(r => setTimeout(r, 0));

                const availableCards = validPool.filter(c => !usedCards.has(c));
                if (availableCards.length === 0) break;

                const swapIndex = Math.floor(Math.random() * currentDeckSlots.length);
                const oldCard = currentDeckSlots[swapIndex].name;
                const newCard = availableCards[Math.floor(Math.random() * availableCards.length)];

                currentDeckSlots[swapIndex].name = newCard;
                usedCards.delete(oldCard);
                usedCards.add(newCard);

                const testArr = currentDeckSlots.map(s => `x${s.count} ${s.name}`);
                try {
                    const verdict = getDeckVerdictFromCards(testArr, "synth", activeCtx);
                    const isTestSTier = (verdict.grade === 'S');
                    let keepMutation = false;

                    if (!isCurrentlySTier) {
                        if (verdict.score > currentScore) keepMutation = true;
                    } else {
                        if (isTestSTier) {
                            const testOriginality = 1 - getSimilarity(usedCards);

                            if (testOriginality > currentOriginality) {
                                keepMutation = true;
                            } else if (testOriginality === currentOriginality) {
                                // The missing logic! Climb score even if originality is maxed out.
                                if (verdict.score > currentScore) keepMutation = true;
                                else if (Math.random() < 0.5) keepMutation = true;
                            }
                        }
                    }

                    if (keepMutation) {
                        currentScore = verdict.score;
                        isCurrentlySTier = isTestSTier;
                        if (isCurrentlySTier) currentOriginality = 1 - getSimilarity(usedCards);

                        // Check for Global Record (Originality first, then Score tie-breaker)
                        let isNewRecord = false;
                        if (isCurrentlySTier) {
                            if (currentOriginality > globalBestOriginality) {
                                isNewRecord = true;
                            } else if (currentOriginality === globalBestOriginality && currentScore > globalBestScore) {
                                isNewRecord = true;
                            }
                        }

                        if (isNewRecord) {
                            globalBestOriginality = currentOriginality;
                            globalBestDeck = [...testArr];
                            globalBestScore = currentScore;
                            globalBestHero = heroMap[heroCombo];
                            console.log(`[New Record] Originality: ${(currentOriginality * 100).toFixed(1)}% | Score: ${globalBestScore.toFixed(2)} | Hero: ${globalBestHero}`);
                        }
                    } else {
                        currentDeckSlots[swapIndex].name = oldCard;
                        usedCards.delete(newCard);
                        usedCards.add(oldCard);
                    }
                } catch (e) {
                    currentDeckSlots[swapIndex].name = oldCard;
                    usedCards.delete(newCard);
                    usedCards.add(oldCard);
                }
            }
            console.log(`%c[Progress] Branch ${run + 1}/${RUNS} completed.`, "color: #888;");
        }

        if (!globalBestDeck) {
            console.error("Failed to synthesize an S-tier deck. Try increasing iterations.");
            return null;
        }

        console.log(`%c--- SYNTHESIS COMPLETE ---`, "color: #00ffcc; font-weight: bold; font-size: 14px;");
        console.log(`%cSUPER ORIGINAL S-TIER DECK FOUND!`, "color: #ffffff; background: #1a2226; padding: 4px; border-left: 4px solid #00ffcc;");
        console.log(`Originality Score: ${(globalBestOriginality * 100).toFixed(1)}%`);
        console.log(`Evaluation Score: ${globalBestScore.toFixed(2)}`);
        console.log(`Hero: ${globalBestHero}`);
        console.log(`\nDecklist:\n` + globalBestDeck.sort().join('\n'));

        return {
            cards: globalBestDeck,
            originalityScore: (globalBestOriginality * 100).toFixed(1),
            hero: globalBestHero
        };
    };

    function pvzBuildAnalyzeDeck(deckInfo) {
        return (deckInfo.cards || []).map(cardRaw => {
            const raw = String(cardRaw).trim();

            // Supports: "x4 Card Name", "4x Card Name", "4 Card Name", or just "Card Name"
            const countMatch = raw.match(/^\s*(?:x(\d+)|(\d+)x|(\d+))\s+/i);
            const count = countMatch
                ? Number(countMatch[1] || countMatch[2] || countMatch[3])
                : 4;

            const cleanName = raw
                .replace(/^[^a-zA-Z]*(x?\d+|\d+x|\d+)\s*/i, '')
                .trim();

            const underscoreName = cleanName.replace(/\s+/g, '_');
            const spaceName = cleanName.replace(/_/g, ' ');

            let finalName = underscoreName;

            if (cardDatabase[underscoreName]) {
                finalName = underscoreName;
            } else if (cardDatabase[cleanName]) {
                finalName = cleanName;
            } else if (cardDatabase[spaceName]) {
                finalName = spaceName;
            }

            return {
                name: finalName,
                count
            };
        });
    }
    let pvzAutoOpenDone = false;

    // Order-independent canonical form so card order in the code doesn't matter.
    function pvzCanonicalizeDeckCode(code) {
        if (!code) return '';
        return code.split('-').map(t => t.trim()).filter(Boolean).sort().join('-');
    }

    function pvzFindTileEl(deckKey, fallbackIndex) {
        const safe = (window.CSS && CSS.escape) ? CSS.escape(deckKey) : deckKey;
        const tile =
            deckGrid.querySelector(`[data-deck-key="${safe}"]`) ||
            deckGrid.querySelector(`[data-key="${safe}"]`) ||
            deckGrid.querySelector(`[data-deck="${safe}"]`);
        // Tiles are appended in pvzDeckCache key order, so position is a safe fallback.
        return tile || deckGrid.children[fallbackIndex] || null;
    }

    function pvzOpenDeckFromUrl() {
        const hash = (window.location.hash || '').replace(/^#/, '').trim();
        if (hash !== '') return;

        const targetCode = new URLSearchParams(window.location.search).get('deck');
        if (!targetCode) return;

        const target = pvzCanonicalizeDeckCode(targetCode);
        if (!target) return;

        if (typeof cardDatabase === 'undefined' || typeof pvzBuildAnalyzeDeck !== 'function') return;

        // Build the dictionary + lookup map ONCE (the analyze button rebuilds it per click).
        const cardDictionary = Object.keys(cardDatabase).sort();
        const indexMap = new Map();
        cardDictionary.forEach((name, i) => indexMap.set(name, i));

        const encode = (deckInfo) => {
            const deck = pvzBuildAnalyzeDeck(deckInfo);
            const tokens = [];
            for (const card of deck) {
                const index = indexMap.get(card.name);
                if (index === undefined) return null;            // unknown card -> can't match
                const cardIndex = index.toString(36);
                tokens.push(card.count === 4 ? cardIndex : `${cardIndex}.${card.count}`);
            }
            return tokens.join('-');
        };

        const keys = Object.keys(pvzDeckCache);
        let fallbackKey = null, fallbackIdx = -1;

        for (let i = 0; i < keys.length; i++) {
            const deckKey = keys[i];
            const rd = pvzDeckCache[deckKey];
            if (!rd || !rd.deckInfo) continue;

            const code = encode(rd.deckInfo);
            if (!code || pvzCanonicalizeDeckCode(code) !== target) continue;

            // Prefer the "real" deck if the same list exists more than once.
            if (!rd.isDup) {
                pvzOpenSheet(deckKey, pvzFindTileEl(deckKey, i));
                return;
            }
            if (fallbackKey === null) { fallbackKey = deckKey; fallbackIdx = i; }
        }

        if (fallbackKey !== null) {
            pvzOpenSheet(fallbackKey, pvzFindTileEl(fallbackKey, fallbackIdx));
        } else {
            console.warn('[pvz] No deck matched the URL deck code:', targetCode);
        }
    }
    let pvzDeckCache = {};     // deckKey -> data the sheet needs (rebuilt each render)
    let pvzActiveTile = null;  // the tile we opened from, so we can fly back on close
    const PVZ_TOUCH_DEVICE = window.matchMedia('(hover:none), (pointer:coarse)').matches;
    const PVZ_RENDER_BATCH_SIZE = PVZ_TOUCH_DEVICE ? 70 : 220;
    const PVZ_REVEAL_LIMIT = PVZ_TOUCH_DEVICE ? 48 : 120;

    let pvzRenderToken = 0;
    const pvzDeckRenderMetaCache = new Map();

    function pvzWaitFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    function pvzCleanCardName(cardRaw) {
        return cardRaw.replace(/^[^a-zA-Z]*(x?\d+|\d+x)\s*/i, '').trim();
    }

    function pvzDeckMetaCacheKey(deckInfo) {
        return [
            (deckInfo.cards || []).join('\u0001'),
            deckInfo.upload_date || '',
            deckInfo.credit || '',
            deckInfo.name || ''
        ].join('\u0002');
    }

    function pvzGetCachedDeckMeta(deckKey, deckInfo, ctx) {
        const cacheKey = pvzDeckMetaCacheKey(deckInfo);
        const cached = pvzDeckRenderMetaCache.get(deckKey);

        if (cached && cached.cacheKey === cacheKey) {
            return cached.meta;
        }

        const cards = deckInfo.cards || [];

        let factionClass = 'plant-deck';
        const uniqueClasses = new Set();
        let factionFound = false;

        for (const cardRaw of cards) {
            const parsed = pvzCleanCardName(cardRaw);
            const cardData =
                cardDatabase[parsed.replace(/ /g, '_')] ||
                cardDatabase[parsed.replace(/_/g, ' ')];

            if (!cardData) continue;

            const cls = cardData.Class || cardData.class;
            if (cls) uniqueClasses.add(cls);

            if (!factionFound && (cardData.Type || cardData.type)) {
                const t = (cardData.Type || cardData.type).toLowerCase();

                if (t.includes('zombie')) {
                    factionClass = 'zombie-deck';
                    factionFound = true;
                } else if (t.includes('plant')) {
                    factionClass = 'plant-deck';
                    factionFound = true;
                }
            }
        }

        let heroes = [];

        if (uniqueClasses.size === 2) {
            const ca = Array.from(uniqueClasses);
            const heroName = heroMap[`${ca[0]},${ca[1]}`] || heroMap[`${ca[1]},${ca[0]}`];

            if (heroName) {
                heroes = heroName.split(/\s*\/\s*/).map(n => ({
                    name: n,
                    img: `hero_images/${n.replace(/[\s-]+/g, '_')}.webp`
                }));
            }
        } else if (uniqueClasses.size === 1) {
            const singleClass = Array.from(uniqueClasses)[0];

            heroes = [{
                name: singleClass,
                img: `hero_images/${singleClass.toLowerCase().replace(/[\s-]+/g, '_')}.webp`
            }];
        }

        const verdict =
            deckInfo.verdict ||
            (deckInfo.verdict = getDeckVerdictFromCards(cards, deckKey, ctx));

        deckInfo.verdict = verdict;

        const dateStr =
            deckInfo.upload_date && deckInfo.upload_date !== "UNKNOWN_DATE"
                ? deckInfo.upload_date
                : "Unknown Date";

        const creditStr = deckInfo.credit || "Unknown";
        const creditIcon = creditStr === "FryEmUp" ? "fryemup.jpg" : "discord.webp";

        let dateVal = 0;
        if (deckInfo.upload_date && deckInfo.upload_date !== "UNKNOWN_DATE") {
            const parsed = Date.parse(deckInfo.upload_date);
            if (!isNaN(parsed)) dateVal = parsed;
        }

        const signature = cards
            .map(c => c.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase())
            .sort()
            .join('|');

        const meta = {
            deckInfo,
            factionClass,
            heroes,
            verdict,
            dateStr,
            creditStr,
            creditIcon,
            dateVal,
            signature
        };

        pvzDeckRenderMetaCache.set(deckKey, { cacheKey, meta });
        return meta;
    }
    const PVZ_FEATURED_RARITY_RANK = Object.freeze({
    basic: 0,
    common: 1,
    uncommon: 2,
    rare: 3,
    "super rare": 4,
    event: 4,
    legendary: 5
});

function pvzGetNewestDeckKeys(database, limit = 2) {
    return new Set(
        Object.entries(database || {})
            .map(([deckKey, deckInfo], order) => {
                const parsedDate = Date.parse(deckInfo?.upload_date);

                return {
                    deckKey,
                    order,
                    dateVal: Number.isFinite(parsedDate) ? parsedDate : 0
                };
            })
            .filter(deck => deck.dateVal > 0)
            .sort((a, b) =>
                b.dateVal - a.dateVal ||
                a.order - b.order
            )
            .slice(0, limit)
            .map(deck => deck.deckKey)
    );
}

function pvzGetFeaturedCard(deckInfo) {
    const cards = Array.isArray(deckInfo?.cards)
        ? deckInfo.cards
        : [];

    let bestCard = null;

    for (let order = 0; order < cards.length; order++) {
        const cardString = String(cards[order] || "").trim();
        if (!cardString) continue;

        const match = cardString.match(/^x(\d+)\s+(.+)$/i);

        const count = match
            ? parseInt(match[1], 10)
            : 1;

        const rawName = match
            ? match[2]
            : cardString;

        const displayName = rawName
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const dbKey = displayName.replace(/ /g, "_");

        const cardData =
            cardDatabase[dbKey] ||
            cardDatabase[displayName];

        if (!cardData) continue;

        const rarityKey = String(cardData.Rarity || "Common")
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const rarityRank =
            PVZ_FEATURED_RARITY_RANK[rarityKey] ?? 0;

        let frequency = Number.POSITIVE_INFINITY;

        if (typeof cardFrequencies !== "undefined") {
            const rawFrequency =
                cardFrequencies[dbKey] ??
                cardFrequencies[displayName];

            const parsedFrequency = Number(rawFrequency);

            if (Number.isFinite(parsedFrequency)) {
                frequency = parsedFrequency;
            }
        }

        const parsedCost = Number(cardData.Cost);
        const cost = Number.isFinite(parsedCost) ? parsedCost : 0;

        const candidate = {
            name: displayName,
            dbKey,
            count,
            rarityRank,
            frequency,
            cost,
            order
        };

        const isBetter =
            !bestCard ||
            candidate.rarityRank > bestCard.rarityRank ||
            (
                candidate.rarityRank === bestCard.rarityRank &&
                candidate.count > bestCard.count
            ) ||
            (
                candidate.rarityRank === bestCard.rarityRank &&
                candidate.count === bestCard.count &&
                candidate.frequency < bestCard.frequency
            ) ||
            (
                candidate.rarityRank === bestCard.rarityRank &&
                candidate.count === bestCard.count &&
                candidate.frequency === bestCard.frequency &&
                candidate.cost > bestCard.cost
            );

        if (isBetter) {
            bestCard = candidate;
        }
    }

    return bestCard;
}
    function pvzCreateDeckTile(
    deckKey,
    rd,
    isDup,
    isStarred,
    cardIndex,
    featuredCard = null
) {
    const {
        deckInfo,
        factionClass,
        heroes,
        verdict,
        creditStr,
        creditIcon
    } = rd;

    const hasFeaturedCard = Boolean(featuredCard);

    const tile = document.createElement('div');
    tile.className = `deck-card ${factionClass}${hasFeaturedCard ? ' has-featured-card' : ''}`;
    tile.dataset.deckKey = deckKey;
    tile.tabIndex = 0;
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', `Open ${deckInfo.name}`);

    const revealDelay = cardIndex < PVZ_REVEAL_LIMIT
        ? Math.min(cardIndex * 8, 600)
        : 0;

    tile.style.setProperty('--reveal-delay', `${revealDelay}ms`);

    const featuredCardHtml = hasFeaturedCard
        ? `
        <div class="pvz-featured-card-float" aria-hidden="true" title="${featuredCard.name}">
          <img
            src="card_images/${featuredCard.dbKey}.png"
            alt=""
            loading="eager"
            decoding="async"
            fetchpriority="high"
            onerror="
              if (this.dataset.fallback !== '1') {
                this.dataset.fallback = '1';
                this.src = 'card_images/${featuredCard.dbKey}.webp';
              } else {
                this.closest('.pvz-featured-card-float')?.remove();
              }
            "
          >
        </div>
      `
        : '';

    tile.innerHTML = `
    <div class="pvz-tile-inner">
      <div class="pvz-tile-wash"></div>

      <div class="pvz-tile-heroes ${heroes.length === 2 ? 'two' : ''}${hasFeaturedCard ? ' with-featured-card' : ''}">
        ${pvzHeroPortraits(heroes, hasFeaturedCard)}
        ${featuredCardHtml}
      </div>

      <div class="pvz-grade-seal" style="color:${verdict.gradeColor || '#15140d'}">
        ${verdict.grade || '?'}
      </div>

      ${isDup ? `<span class="deck-duplicate-badge" title="Older duplicate">Dup</span>` : ''}

      <button class="deck-star-btn ${isStarred ? 'starred' : ''}" data-deck="${deckKey}" aria-label="Star deck">
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </button>

      <div class="pvz-tile-foot">
        <p class="pvz-tile-name">${deckInfo.name}</p>
        <span class="pvz-tile-credit">
          <img src="${creditIcon}" alt="" loading="lazy" decoding="async" fetchpriority="low">${creditStr}
        </span>
      </div>
    </div>`;

    return tile;
}
    function renderDecks(data) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const thisRenderToken = ++pvzRenderToken;

        if (loadingIndicator) loadingIndicator.classList.remove('hidden');

        deckGrid.classList.add('hidden');

        if (statsBtn) statsBtn.disabled = true;
        if (guidesBtn) guidesBtn.disabled = true;
        if (crafterBtn) crafterBtn.disabled = true;
        if (finderBtn) finderBtn.disabled = true;
        if (gamesBtn) gamesBtn.disabled = true;
        if (tiersBtn) tiersBtn.disabled = true;
        if (moreBtn) moreBtn.disabled = true;

        setTimeout(async () => {
            if (thisRenderToken !== pvzRenderToken) return;

            deckGrid.innerHTML = '';
            pvzDeckCache = {};

            const ctx = getVerdictContext();
            const starredDecks = JSON.parse(localStorage.getItem('pvz_starred_decks') || '{}');

            const entries = Object.entries(data);
const prepared = [];

const newestDeckSource =
    typeof fullDatabase !== "undefined" && fullDatabase
        ? fullDatabase
        : data;

const newestDeckKeys = pvzGetNewestDeckKeys(
    newestDeckSource,
    2
);

            const signatureMap = new Map();

            for (const [deckKey, deckInfo] of entries) {
                const rd = pvzGetCachedDeckMeta(deckKey, deckInfo, ctx);
                prepared.push([deckKey, rd]);

                if (!signatureMap.has(rd.signature)) {
                    signatureMap.set(rd.signature, []);
                }

                signatureMap.get(rd.signature).push({
                    key: deckKey,
                    dateVal: rd.dateVal
                });
            }

            const duplicateKeys = new Set();

            for (const decks of signatureMap.values()) {
                if (decks.length > 1) {
                    decks.sort((a, b) => b.dateVal - a.dateVal);

                    for (let i = 1; i < decks.length; i++) {
                        duplicateKeys.add(decks[i].key);
                    }
                }
            }

            let cardIndex = 0;

            for (let start = 0; start < prepared.length; start += PVZ_RENDER_BATCH_SIZE) {
                if (thisRenderToken !== pvzRenderToken) return;

                const fragment = document.createDocumentFragment();
                const end = Math.min(start + PVZ_RENDER_BATCH_SIZE, prepared.length);

                for (let i = start; i < end; i++) {
                    const [deckKey, rd] = prepared[i];

                    const isDup = duplicateKeys.has(deckKey);
const isStarred = starredDecks[deckKey] === true;

const featuredCard = newestDeckKeys.has(deckKey)
    ? pvzGetFeaturedCard(rd.deckInfo)
    : null;

pvzDeckCache[deckKey] = {
    ...rd,
    isDup
};

fragment.appendChild(
    pvzCreateDeckTile(
        deckKey,
        rd,
        isDup,
        isStarred,
        cardIndex,
        featuredCard
    )
);

                    cardIndex++;
                }

                deckGrid.appendChild(fragment);

                // Yield to the browser so phones do not freeze during huge renders.
                await pvzWaitFrame();
            }

            if (thisRenderToken !== pvzRenderToken) return;

            if (loadingIndicator) loadingIndicator.classList.add('hidden');

            deckGrid.classList.remove('hidden');

            if (statsBtn) statsBtn.disabled = false;
            if (guidesBtn) guidesBtn.disabled = false;
            if (tiersBtn) tiersBtn.disabled = false;
            if (crafterBtn) crafterBtn.disabled = false;
            if (finderBtn) finderBtn.disabled = false;
            if (gamesBtn) gamesBtn.disabled = false;
            if (moreBtn) moreBtn.disabled = false;
            pvzBindGrid();
            // Auto-open a deck when the page is loaded with ?deck=... and NOT #crafter
            if (!pvzAutoOpenDone) {
                pvzAutoOpenDone = true;
                pvzOpenDeckFromUrl();
            }
        }, 50);
    }

    function pvzHeroPortraits(heroes, eager = false) {
        if (!heroes.length) {
            return `<div class="pvz-hero-portrait" aria-hidden="true">?</div>`;
        }

        const loading = eager ? 'eager' : 'lazy';
        const priority = eager ? 'high' : 'low';

        return heroes.map(h => {
            const initials = h.name
                .split(/[\s-]+/)
                .map(w => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

            return `<div class="pvz-hero-portrait" title="${h.name}">
        <img src="${h.img}" alt="${h.name}" loading="${loading}" decoding="async" fetchpriority="${priority}" onerror="this.remove()">${initials}
      </div>`;
        }).join('');
    }

    /* one delegated handler for opening the sheet — bound once */
    function pvzBindGrid() {
        const grid = document.getElementById('deckGrid');
        if (grid.dataset.pvzBound) return;     // don't double-bind on re-render
        grid.dataset.pvzBound = '1';

        grid.addEventListener('click', (e) => {
            // let your existing star handler deal with stars; ignore them here
            if (e.target.closest('.deck-star-btn')) return;
            const tile = e.target.closest('.deck-card');
            if (tile) pvzOpenSheet(tile.dataset.deckKey, tile);
        });

        grid.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            if (e.target.closest('.deck-star-btn')) return;
            const tile = e.target.closest('.deck-card');
            if (tile) { e.preventDefault(); pvzOpenSheet(tile.dataset.deckKey, tile); }
        });
    }
    /* ---------- OPEN: fly from the tile to center, then the deck unfolds ---------- */
    function pvzOpenSheet(deckKey, tileEl) {
        const rd = pvzDeckCache[deckKey];
        if (!rd) return;
        pvzActiveTile = tileEl;
        const { deckInfo, factionClass, heroes, verdict, dateStr, creditStr, creditIcon, isDup } = rd;

        // 1. Setup Sparks Map & Tracker.
        // "sparksToCraft" only counts copies you don't already own, using your saved collection.
        let totalSparks = 0;
        let sparksToCraft = 0;
        const rarityCosts = RARITY_SPARKS;

        // real card images, using YOUR card_images path + png→webp fallback
        const cardsHtml = (deckInfo.cards || []).map((cardString, i) => {
            const m = cardString.trim().match(/^x(\d+)\s+(.+)$/i);
            let count = 1, raw = cardString;
            if (m) { count = parseInt(m[1], 10); raw = m[2]; }
            const display = raw.replace(/_/g, ' ');
            const db = display.replace(/ /g, '_');

            // 2. Look up the card, add to full Spark Total, and figure out what's still missing
            let each = 0;
            let missing = count;
            if (typeof cardDatabase !== 'undefined' && cardDatabase[db]) {
                const rarity = (cardDatabase[db].Rarity || '').toLowerCase();
                each = rarityCosts[rarity] || 0;
                totalSparks += each * count;
                const owned = ownedCollection[db] || 0;
                missing = Math.max(0, count - owned);
                sparksToCraft += each * missing;
            }
            const fullyOwned = missing === 0;
            const costTag = (!fullyOwned && each > 0)
                ? `<span class="pvz-card-missing-cost">${(each * missing).toLocaleString()}<img src="PvZH_Spark_Icon.webp" alt="Sparks" class="spark-icon"></span>`
                : '';

            return `<div class="pvz-card ${fullyOwned ? 'pvz-card-owned' : 'pvz-card-missing'}" style="--i:${i}">
        <img src="card_images/${db}.png" alt="${display}" title="${display}" loading="lazy" decoding="async" fetchpriority="low"
     onerror="this.onerror=null;this.src='card_images/${db}.webp'">
        <span class="pvz-card-qty">x${count}</span>
        ${costTag}
      </div>`;
        }).join('');

        // 3. Format sparks strings — show cost-to-complete when you own at least one card here,
        // otherwise fall back to the full craft cost so the number stays meaningful.
        const haveAnyOwned = Object.keys(ownedCollection).length > 0;
        const formattedSparks = (haveAnyOwned ? sparksToCraft : totalSparks).toLocaleString();
        const sparksLabel = haveAnyOwned ? 'Sparks to complete' : 'Sparks';

        const videoId = getYouTubeId(deckInfo.youtube_url);
        const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
        const videoHtml = (creditStr === "FryEmUp" && deckInfo.youtube_url && thumb) ? `
      <a class="pvz-sheet-video" href="${deckInfo.youtube_url}" target="_blank" rel="noopener" title="${deckInfo.youtube_title || ''}">
        <span class="pvz-video-thumb"><img src="${thumb}" alt="" loading="lazy" decoding="async" fetchpriority="low"><span class="pvz-play"></span></span>
        <span class="pvz-video-title">${deckInfo.youtube_title || 'Watch on YouTube'}</span>
      </a>` : '';

        const overlay = document.createElement('div');
        overlay.className = 'pvz-sheet-overlay';

        // 4. Moved Sparks UI under Analyze button, reusing the Rating CSS classes
        overlay.innerHTML = `
  <div class="pvz-sheet ${factionClass}" role="dialog" aria-modal="true" aria-label="${deckInfo.name}">
    <button class="pvz-sheet-close" aria-label="Close">&times;</button>

    <div class="pvz-sheet-banner">
      <div class="pvz-sheet-heroes ${heroes.length === 2 ? 'two' : ''}">
        ${pvzHeroPortraits(heroes, true)}
      </div>

      <div class="pvz-sheet-titlewrap">
        <h2 class="pvz-sheet-title">${deckInfo.name}</h2>

        <div class="pvz-sheet-meta">
          <span class="pvz-meta-text">
            <span class="pvz-meta-item">
              <img class="pvz-meta-credit" src="${creditIcon}" alt="">${creditStr}
            </span>
            <span class="pvz-meta-item">${dateStr}</span>
            ${isDup ? `<span class="pvz-meta-item pvz-meta-dup">older dup</span>` : ''}
          </span>
        </div>
      </div>
    </div>

    <div class="pvz-sheet-body">
      <div class="pvz-card-grid">${cardsHtml}</div>

      <div class="pvz-deck-side" style="display: flex; flex-direction: column; gap: 12px; align-items: flex-end;">
        
        <div class="pvz-deck-rating" style="color:${verdict.gradeColor || '#fff'}; margin-bottom: 0 !important;">
          <span class="pvz-rating-label">Rating</span>
          <span class="pvz-rating-grade">${verdict.grade || '?'}</span>
        </div>

        <div class="pvz-deck-rating pvz-deck-sparks" style="color: #4dd0e1; margin-bottom: 0 !important;">
          <span class="pvz-rating-label">${sparksLabel}</span>
          <span class="pvz-rating-grade">${formattedSparks}</span>
        </div>

        <button id="pvzAnalyzeDeckBtn" class="pvz-analyze-deck-btn" type="button" style="margin-top: 6px;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0;">
    <path d="m12 14 4-4"/>
    <path d="M3.34 19a10 10 0 1 1 17.32 0"/>
  </svg>
  Analyze Deck
</button>

<button id="pvzShareDeckBtn" class="pvz-analyze-deck-btn" type="button" style="margin-top: 6px;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0;">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
  Share Link
</button>

      </div>

      ${videoHtml}
    </div>
  </div>`;

        const analyzeBtn = overlay.querySelector('#pvzAnalyzeDeckBtn');

        if (analyzeBtn) {
            analyzeBtn.onclick = function (e) {
                e.stopPropagation();

                const deckToAnalyze = pvzBuildAnalyzeDeck(deckInfo);
                const cardDictionary = Object.keys(cardDatabase).sort();

                const encodedCards = deckToAnalyze.map(card => {
                    const index = cardDictionary.indexOf(card.name);

                    if (index === -1) {
                        console.error(`🚨 Could not find card in dictionary: ${card.name}`);
                        return null;
                    }

                    const cardIndex = index.toString(36);

                    return card.count === 4 ? cardIndex : `${cardIndex}.${card.count}`;
                });

                if (encodedCards.includes(null)) {
                    alert("Could not analyze this deck because one or more cards could not be found.");
                    return;
                }

                const minimalDeckString = encodedCards.join('-');
                const analyzeUrl = `${window.location.origin}${window.location.pathname}?deck=${minimalDeckString}#crafter`;

                console.log("Encoding complete. Target URL:", analyzeUrl);
                const sameQuery = window.location.search === `?deck=${minimalDeckString}`;

                window.location.href = analyzeUrl;

                if (sameQuery) {
                    window.location.reload();
                }
            };
        }
        const shareBtn = overlay.querySelector('#pvzShareDeckBtn');

        if (shareBtn) {
            shareBtn.onclick = function (e) {
                e.stopPropagation();

                const deckToShare = pvzBuildAnalyzeDeck(deckInfo);
const shareUrl = buildCurrentDeckShareUrl(deckToShare);

if (!shareUrl) {
    alert("Could not share this deck because one or more cards could not be found.");
    return;
}
                const originalText = shareBtn.textContent;
                const flash = (msg) => {
                    shareBtn.textContent = msg;
                    shareBtn.disabled = true;
                    setTimeout(() => {
                        shareBtn.textContent = originalText;
                        shareBtn.disabled = false;
                    }, 1500);
                };

                const fallbackCopy = () => {
                    const ta = document.createElement('textarea');
                    ta.value = shareUrl;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    let ok = false;
                    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
                    document.body.removeChild(ta);
                    flash(ok ? 'Copied!' : 'Copy failed');
                };

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareUrl)
                        .then(() => flash('Copied!'))
                        .catch(fallbackCopy);
                } else {
                    fallbackCopy();
                }
            };
        }
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const sheet = overlay.querySelector('.pvz-sheet');
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!reduce && tileEl) {
            const t = tileEl.getBoundingClientRect();
            const p = sheet.getBoundingClientRect();
            const dx = (t.left + t.width / 2) - (p.left + p.width / 2);
            const dy = (t.top + t.height / 2) - (p.top + p.height / 2);
            const scale = Math.max(t.width / p.width, t.height / p.height);
            sheet.style.setProperty('transform', `translate(${dx}px,${dy}px) scale(${scale})`, 'important');
            sheet.style.setProperty('opacity', '0', 'important');
            overlay.style.setProperty('opacity', '0', 'important');
            sheet.getBoundingClientRect(); // reflow
            requestAnimationFrame(() => {
                overlay.style.setProperty('transition', 'opacity .3s ease', 'important');
                overlay.style.setProperty('opacity', '1', 'important');
                sheet.style.setProperty('transition', 'transform .55s cubic-bezier(.16,1,.3,1), opacity .4s ease', 'important');
                sheet.style.setProperty('transform', 'translate(0,0) scale(1)', 'important');
                sheet.style.setProperty('opacity', '1', 'important');
            });
        }
        requestAnimationFrame(() => overlay.classList.add('open'));

        const close = () => pvzCloseSheet(overlay);
        overlay.querySelector('.pvz-sheet-close').addEventListener('click', close);
        overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
        overlay._esc = (e) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', overlay._esc);

        overlay.querySelector('.pvz-sheet-close').focus();
    }
    window.calculateDeckSparkStats = function () {
        if (typeof pvzDeckCache === 'undefined' || typeof cardDatabase === 'undefined') {
            console.error("🚨 pvzDeckCache or cardDatabase is not available.");
            return null;
        }

        const rarityCosts = {
            'common': 0,
            'basic': 0,
            'uncommon': 50,
            'rare': 250,
            'super rare': 1000,
            'super-rare': 1000,
            'event': 1000,
            'legendary': 4000
        };

        const sparkTotals = [];

        // 1. Calculate sparks for every deck in the cache
        for (const rd of Object.values(pvzDeckCache)) {
            if (!rd.deckInfo || !rd.deckInfo.cards) continue;

            let totalSparks = 0;

            for (const cardString of rd.deckInfo.cards) {
                const m = cardString.trim().match(/^x(\d+)\s+(.+)$/i);
                let count = 1, raw = cardString;
                if (m) { count = parseInt(m[1], 10); raw = m[2]; }
                const db = raw.replace(/ /g, '_');

                if (cardDatabase[db]) {
                    const rarity = (cardDatabase[db].Rarity || '').toLowerCase();
                    totalSparks += (rarityCosts[rarity] || 0) * count;
                }
            }

            sparkTotals.push(totalSparks);
        }

        if (sparkTotals.length === 0) {
            console.warn("No decks found to calculate.");
            return null;
        }

        // 2. Sort the array numerically to calculate stats
        sparkTotals.sort((a, b) => a - b);

        // Helper function to find the median of an array
        const getMedian = (arr) => {
            if (arr.length === 0) return 0;
            const mid = Math.floor(arr.length / 2);
            return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
        };

        // 3. Calculate statistics
        const totalDecks = sparkTotals.length;
        const mean = sparkTotals.reduce((sum, val) => sum + val, 0) / totalDecks;
        const median = getMedian(sparkTotals);

        // To find Q1 and Q3, split the array in half
        const midIndex = Math.floor(totalDecks / 2);
        const lowerHalf = sparkTotals.slice(0, midIndex);

        // If odd, exclude the exact middle value from both halves
        const upperHalf = totalDecks % 2 === 0
            ? sparkTotals.slice(midIndex)
            : sparkTotals.slice(midIndex + 1);

        const q1 = getMedian(lowerHalf);
        const q3 = getMedian(upperHalf);

        // 4. Format the final output
        const stats = {
            "Total Decks": totalDecks,
            "Min Sparks": sparkTotals[0],
            "Q1 (25th %)": q1,
            "Median (50th %)": median,
            "Mean (Average)": Math.round(mean),
            "Q3 (75th %)": q3,
            "Max Sparks": sparkTotals[totalDecks - 1]
        };

        // Log as a clean visual table in the console
        console.table(stats);

        return stats;
    };
    function pvzCloseSheet(overlay) {
        const sheet = overlay.querySelector('.pvz-sheet');
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.removeEventListener('keydown', overlay._esc);
        const done = () => { overlay.remove(); document.body.style.overflow = ''; };

        if (reduce || !pvzActiveTile || !document.body.contains(pvzActiveTile)) {
            overlay.style.setProperty('transition', 'opacity .25s ease', 'important');
            overlay.style.setProperty('opacity', '0', 'important');
            setTimeout(done, 250); return;
        }
        const t = pvzActiveTile.getBoundingClientRect();
        const p = sheet.getBoundingClientRect();
        const dx = (t.left + t.width / 2) - (p.left + p.width / 2);
        const dy = (t.top + t.height / 2) - (p.top + p.height / 2);
        const scale = Math.max(t.width / p.width, t.height / p.height);
        overlay.style.setProperty('transition', 'opacity .35s ease', 'important');
        overlay.style.setProperty('opacity', '0', 'important');
        sheet.style.setProperty('transition', 'transform .4s cubic-bezier(.16,1,.3,1), opacity .35s ease', 'important');
        sheet.style.setProperty('transform', `translate(${dx}px,${dy}px) scale(${scale})`, 'important');
        sheet.style.setProperty('opacity', '0', 'important');
        setTimeout(done, 400);
    }

    // 2. Global Event Listener for Star Buttons (Put this outside renderDecks so it runs once)
    document.getElementById('deckGrid').addEventListener('click', (e) => {
        const starBtn = e.target.closest('.deck-star-btn');
        if (!starBtn) return;

        const deckKey = starBtn.getAttribute('data-deck');
        const starredDecks = JSON.parse(localStorage.getItem('pvz_starred_decks') || '{}');

        if (starBtn.classList.contains('starred')) {
            // Unstar
            starBtn.classList.remove('starred');
            delete starredDecks[deckKey];
        } else {
            // Star! (Triggers CSS animation)
            starBtn.classList.add('starred');
            starredDecks[deckKey] = true;
        }

        localStorage.setItem('pvz_starred_decks', JSON.stringify(starredDecks));
    });

    // --- Combined Search + Grade Filter ---

    let currentSearchTerm = "";
    let currentGradeFilter = "";


   const gradeButtons = document.querySelectorAll(".grade-chip");
const budgetBtn = document.getElementById("budgetBtn");

let currentBudgetOnly = false;
const BUDGET_SPARK_LIMIT = 20000;
function getDeckSparkCost(deckInfo) {
    const rarityCosts = {
        'common': 0,
        'basic': 0,
        'uncommon': 50,
        'rare': 250,
        'super rare': 1000,
        'super-rare': 1000,
        'event': 1000,
        'legendary': 4000
    };

    let totalSparks = 0;

    if (!deckInfo || !Array.isArray(deckInfo.cards)) return 0;

    for (const cardString of deckInfo.cards) {
        const m = cardString.trim().match(/^x(\d+)\s+(.+)$/i);

        let count = 1;
        let raw = cardString;

        if (m) {
            count = parseInt(m[1], 10);
            raw = m[2];
        }

        const display = raw.replace(/_/g, ' ');
        const db = display.replace(/ /g, '_');

        const cardData =
            cardDatabase[db] ||
            cardDatabase[display] ||
            cardDatabase[raw];

        if (cardData) {
            const rarity = (cardData.Rarity || '').toLowerCase();
            totalSparks += (rarityCosts[rarity] || 0) * count;
        }
    }

    return totalSparks;
}

    function matchesSearch(deckInfo, searchRegex) {
        const deckName = deckInfo.name || "";
        const ytTitle = deckInfo.youtube_title || "";
        const credit = deckInfo.credit || "";

        // --- NEW: LAZY-CACHE HERO NAME FOR SEARCHING ---
        if (deckInfo.heroName === undefined) {
            deckInfo.heroName = ""; // Default fallback if it doesn't meet the 2-class rule

            if (Array.isArray(deckInfo.cards) && deckInfo.cards.length > 0) {
                const uniqueClasses = new Set();

                for (const cardRaw of deckInfo.cards) {
                    let parsedCardName = cardRaw.replace(/^[^a-zA-Z]*(x?\d+|\d+x)\s*/i, '').trim();
                    const nameWithSpaces = parsedCardName.replace(/_/g, ' ');
                    const nameWithUnderscores = parsedCardName.replace(/ /g, '_');

                    const cardData = cardDatabase[nameWithUnderscores] || cardDatabase[nameWithSpaces];
                    if (cardData) {
                        const cls = cardData.Class || cardData.class;
                        if (cls) uniqueClasses.add(cls);
                    }
                }

                // Only map to a hero if it has exactly 2 classes
                if (uniqueClasses.size === 2) {
                    const classesArray = Array.from(uniqueClasses);
                    const comboA = `${classesArray[0]},${classesArray[1]}`;
                    const comboB = `${classesArray[1]},${classesArray[0]}`;
                    deckInfo.heroName = heroMap[comboA] || heroMap[comboB] || "";
                }
            }
        }
        // -----------------------------------------------

        const creditMatches = credit
            .split(",")
            .some(author => searchRegex.test(author.trim()));

        const hasMatchingCard = Array.isArray(deckInfo.cards) && deckInfo.cards.some(card => {
            const cleanName = card.replace(/_/g, " ");
            return searchRegex.test(cleanName);
        });

        return (
            searchRegex.test(deckName) ||
            searchRegex.test(ytTitle) ||
            searchRegex.test(deckInfo.heroName) || // <-- NEW: Matches against the resolved Hero Name(s)
            creditMatches ||
            hasMatchingCard
        );
    }

    function applyFilters() {
    const filteredData = {};

    const searchRegex = currentSearchTerm
        ? new RegExp("\\b" + escapeRegExp(currentSearchTerm), "i")
        : null;

    const starredDecks = JSON.parse(localStorage.getItem('pvz_starred_decks') || '{}');

    for (const [deckKey, deckInfo] of Object.entries(fullDatabase)) {
        const grade = deckInfo.verdict?.grade || "—";

        // Starred filter
        if (currentGradeFilter === "STARRED") {
            if (!starredDecks[deckKey]) continue;
        }

        // Budget filter
        else if (currentGradeFilter === "BUDGET") {
            if (getDeckSparkCost(deckInfo) > 20000) continue;
        }

        // Normal grade filter
        else if (currentGradeFilter && grade !== currentGradeFilter) {
            continue;
        }

        // Search filter
        if (searchRegex && !matchesSearch(deckInfo, searchRegex)) continue;

        filteredData[deckKey] = deckInfo;
    }

    renderDecks(filteredData);
}

    // --- Search input ---
    searchInput.addEventListener("input", (e) => {
        currentSearchTerm = e.target.value.trim();
        applyFilters();
    });
   const gradesBtn = document.getElementById("gradesBtn");
const gradesDropdown = document.getElementById("gradesDropdown");

const dropdownGrades = new Set(["S", "A", "B", "C", "D", "F"]);

gradesBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const open = !gradesDropdown.hidden;
    gradesDropdown.hidden = open;

    gradesBtn.setAttribute("aria-expanded", String(!open));
});

document.addEventListener("click", () => {
    gradesDropdown.hidden = true;
    gradesBtn.setAttribute("aria-expanded", "false");
});

// --- Grade buttons ---
gradeButtons.forEach(button => {
    button.addEventListener("click", (e) => {
        e.stopPropagation();

        gradeButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        currentGradeFilter = button.dataset.grade; // "", STARRED, BUDGET, S, A, B, etc.

        gradesBtn.classList.toggle(
            "active",
            dropdownGrades.has(currentGradeFilter)
        );

        gradesDropdown.hidden = true;
        gradesBtn.setAttribute("aria-expanded", "false");

        applyFilters();
    });
});


    // NEW: Listen for when the user changes the dropdown
    const filterDropdown = document.getElementById('deckLimitFilter');
    if (filterDropdown) {
        filterDropdown.addEventListener('change', (e) => {
            renderStatsChart(e.target.value);
        });
    }

    backBtn.addEventListener('click', () => {
        // Hide BOTH secondary views and the back button
        statsView.classList.add('hidden');
        tiersView.classList.add('hidden');
        guidesView.classList.add('hidden');
        crafterView.classList.add('hidden'); // Hide the new view
        finderView.classList.add('hidden');
        backBtn.classList.add('hidden');

        // Restore Main UI
        deckView.classList.remove('hidden');
        searchWrapper.classList.remove('hidden');
        statsBtn.classList.remove('hidden');
        guidesBtn.classList.remove('hidden');
        tiersBtn.classList.remove('hidden');
        crafterBtn.classList.remove('hidden'); // Restore the new button
        finderBtn.classList.remove('hidden');
        gamesBtn.classList.remove('hidden'); // Restore the games button


    });
    function animateStatsPanels() {
    const statsView = document.getElementById("statsView");
    if (!statsView) return;

    const panels = statsView.querySelectorAll(".stat-card, .chart-box");

    statsView.classList.remove("stats-visible");

    panels.forEach((panel, index) => {
        panel.style.setProperty("--panel-delay", `${index * 80}ms`);
    });

    // Force reset
    void statsView.offsetWidth;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            statsView.classList.add("stats-visible");
        });
    });
}
    // --- Stats Rendering Logic ---
    function renderStatsChart(limit = 'all') {
        // --- NEW: Hero Deduction Matrix ---
        const heroCounts = {};
        const heroMatrix = {
            // Plants (Alphabetical order of classes)
            "Mega-Grow,Smarty": "Green Shadow",
            "Kabloom,Solar": "Solar Flare",
            "Guardian,Solar": "Wall-Knight",
            "Mega-Grow,Solar": "Chompzilla",
            "Guardian,Kabloom": "Spudow",
            "Guardian,Smarty": "Citron / Beta-Carrotina",
            "Guardian,Mega-Grow": "Grass Knuckles",
            "Kabloom,Smarty": "Nightcap",
            "Smarty,Solar": "Rose",
            "Kabloom,Mega-Grow": "Captain Combustible",

            // Zombies (Alphabetical order of classes)
            "Beastly,Hearty": "The Smash",
            "Crazy,Sneaky": "Impfinity",
            "Brainy,Hearty": "Rustbolt",
            "Beastly,Crazy": "Electric Boogaloo",
            "Beastly,Sneaky": "Brain Freeze",
            "Brainy,Crazy": "Professor Brainstorm",
            "Beastly,Brainy": "Immorticia",
            "Crazy,Hearty": "Z-Mech",
            "Hearty,Sneaky": "Neptuna",
            "Brainy,Sneaky": "Super Brainz / HG"
        };
        // Existing Data Accumulators
        const cardCopies = {};
        const deckPresence = {};
        const uploadsByYear = {};
        const dailyUploads = {};
        const pairCounts = {};
        const wordCounts = {};
        const stopWords = [
            // Standard English fluff
            "the", "in", "a", "of", "and", "to", "is", "for", "with", "this", "on", "most", "ever",
            "one", "when", "vs", "are", "that", "my", "i", "but", "it", "at", "an", "how", "why", "what", "you", "your", "can", "out",

            // YouTube / Gaming Fluff
            "part", "gameplay", "highlights", "guide", "guides", "video", "new", "best", "top",
            "update", "play", "playing", "wins", "win", "stream", "ep", "episode", "season", "let", "lets",

            // PvZ Heroes Specific Boilerplate
            "pvz", "pvzh", "plants", "zombies", "heroes", "hero", "deck", "decks", "game", "cards", "card", "zombie", "plant"
        ];

        // NEW Data Accumulators for card_data
        const costCurve = {};
        const classCounts = {};
        const rarityCounts = {};
        const typeCounts = {};
        const statsByCost = {};
        const cardPresenceByYear = {};

        // --- NEW: Pay-to-Win Tracking Variables ---
        let maxSparkCost = -1;
        let minSparkCost = Infinity;
        let mostExpensiveDeck = null;
        let leastExpensiveDeck = null;
        let maxAvgCost = -1;
        let minAvgCost = Infinity;
        let heaviestDeck = null;
        let lightestDeck = null;
        let numDecks = Object.keys(fullDatabase).length;
        let totalUniqueCardSlots = 0;
        const allSparkCosts = [];
        const allAvgCosts = [];

        // --- NEW: Trending Data Variables ---
        const RECENT_DECK_COUNT = 100;
        const recentCardFreq = {};

        // --- FIX: Safely sort allDecks from newest to oldest ---
        let allDecks = Object.values(fullDatabase).sort((a, b) => {
            const dateA = a.upload_date && a.upload_date !== "UNKNOWN_DATE" ? new Date(a.upload_date).getTime() : 0;
            const dateB = b.upload_date && b.upload_date !== "UNKNOWN_DATE" ? new Date(b.upload_date).getTime() : 0;
            return dateB - dateA;
        });

        // --- Apply the timeframe filter! ---
        if (limit !== 'all') {
            // Split the value (e.g., "latest_500") into direction ("latest") and amount ("500")
            const [direction, amountStr] = limit.split('_');
            const sliceAmount = parseInt(amountStr, 10);

            if (direction === 'latest') {
                // Since newest are at the front (index 0), grab from 0 up to the sliceAmount
                allDecks = allDecks.slice(0, sliceAmount);
            } else if (direction === 'oldest') {
                // Grab the last 'sliceAmount' of elements from the end of the array
                allDecks = allDecks.slice(-sliceAmount);
            }
        }

        const totalDecks = allDecks.length;

        // Process the database
        allDecks.forEach((deck, index) => {
            let uniqueInThisDeck = 0;
            const deckCardNames = [];
            let currentDeckSparkCost = 0;
            let currentDeckTotalMana = 0;
            const currentDeckClasses = new Set();

            // 1. Process Timeline
            let deckYear = null;
            if (deck.upload_date && deck.upload_date !== "UNKNOWN_DATE") {
                const yearMatch = deck.upload_date.match(/\b(20\d{2})\b/);
                if (yearMatch) {
                    deckYear = yearMatch[1];
                    const year = yearMatch[1];
                    uploadsByYear[year] = (uploadsByYear[year] || 0) + 1;
                }
            }
            if (deck.upload_date && deck.upload_date !== "UNKNOWN_DATE") {
                const parsedDate = new Date(deck.upload_date);

                if (!isNaN(parsedDate)) {
                    const dateKey = parsedDate.toISOString().split('T')[0];
                    dailyUploads[dateKey] = (dailyUploads[dateKey] || 0) + 1;
                }
            }

            // 2. Process Title Buzzwords
            if (deck.youtube_title) {
                // Lowercase -> Strip punctuation & underscores -> Strip numbers -> Split by spaces
                const words = deck.youtube_title.toLowerCase()
                    .replace(/[^\w\s]|_/g, '')
                    .replace(/\d+/g, '')
                    .split(/\s+/);

                words.forEach(w => {
                    // I increased the minimum length to > 3 to filter out random 3-letter junk
                    if (w.length > 3 && !stopWords.includes(w)) {

                        // Optional: Naively group some common plural/singular words together 
                        // so "garg" and "gargs" count as the same buzzword
                        let normalizedWord = w;
                        if (w === "gargs") normalizedWord = "garg";
                        if (w === "otks") normalizedWord = "otk";

                        wordCounts[normalizedWord] = (wordCounts[normalizedWord] || 0) + 1;
                    }
                });
            }

            // 3. Process Cards & Metadata
            deck.cards.forEach(card => {
                const match = card.match(/^x(\d+)\s+(.+)$/);
                if (match) {
                    const count = parseInt(match[1]);
                    const rawName = match[2];
                    const name = rawName.replace(/_/g, ' ');

                    // Basic Stats
                    cardCopies[name] = (cardCopies[name] || 0) + count;
                    deckPresence[name] = (deckPresence[name] || 0) + 1;
                    deckCardNames.push(name);
                    uniqueInThisDeck++;

                    // If this deck is one of the 50 newest, tally it for the recent pool
                    if (index < RECENT_DECK_COUNT) {
                        recentCardFreq[name] = (recentCardFreq[name] || 0) + count;
                    }
                    if (deckYear) {
                        if (!cardPresenceByYear[name]) cardPresenceByYear[name] = {};
                        cardPresenceByYear[name][deckYear] = (cardPresenceByYear[name][deckYear] || 0) + 1;
                    }
                    // Process Extended Card Data
                    if (typeof cardDatabase !== 'undefined' && cardDatabase[rawName]) {
                        const info = cardDatabase[rawName];

                        // Calculate Sparks
                        if (info.Rarity) {
                            const rarity = info.Rarity.toLowerCase();
                            let sparkCost = 0;
                            if (rarity.includes('uncommon')) sparkCost = 50;
                            else if (rarity.includes('rare') && !rarity.includes('super')) sparkCost = 250;
                            else if (rarity.includes('super') || rarity.includes('event')) sparkCost = 1000;
                            else if (rarity.includes('legendary')) sparkCost = 4000;

                            currentDeckSparkCost += (sparkCost * count);
                            rarityCounts[info.Rarity] = (rarityCounts[info.Rarity] || 0) + count;
                        }

                        if (info.Cost !== null && info.Cost !== undefined) {
                            currentDeckTotalMana += (info.Cost * count);
                            costCurve[info.Cost] = (costCurve[info.Cost] || 0) + count;

                        }
                        if (info.Class) {
                            classCounts[info.Class] = (classCounts[info.Class] || 0) + count;
                            currentDeckClasses.add(info.Class);
                        }

                        if (info.Type) {
                            let broadType = "Fighter / Minion";
                            if (info.Type.includes("Trick")) broadType = "Trick";
                            else if (info.Type.includes("Environment")) broadType = "Environment";
                            typeCounts[broadType] = (typeCounts[broadType] || 0) + count;
                        }

                        if (info.Strength !== null && info.Health !== null) {
                            if (!statsByCost[info.Cost]) {
                                statsByCost[info.Cost] = { str: [], hp: [] };
                            }
                            for (let i = 0; i < count; i++) {
                                statsByCost[info.Cost].str.push(info.Strength);
                                statsByCost[info.Cost].hp.push(info.Health);
                            }
                        }
                    }
                }
            });
            const sortedClasses = Array.from(currentDeckClasses).sort().join(",");

            // If it finds a match, use it. If a deck is somehow mono-class, label it as such.
            const heroName = heroMatrix[sortedClasses] || (sortedClasses ? `Mono: ${sortedClasses}` : "Unknown");
            heroCounts[heroName] = (heroCounts[heroName] || 0) + 1;

            totalUniqueCardSlots += uniqueInThisDeck;
            allSparkCosts.push(currentDeckSparkCost);

            if (currentDeckSparkCost >= 0) {
                if (currentDeckSparkCost > maxSparkCost) {
                    maxSparkCost = currentDeckSparkCost;
                    mostExpensiveDeck = deck;
                }
                if (currentDeckSparkCost < minSparkCost) {
                    minSparkCost = currentDeckSparkCost;
                    leastExpensiveDeck = deck;
                }
            }
            if (currentDeckTotalMana > 0) {
                // Since decks are strictly 40 cards, we can hardcode the divisor
                const avgCost = currentDeckTotalMana / 40;
                allAvgCosts.push(avgCost);

                if (avgCost > maxAvgCost) {
                    maxAvgCost = avgCost;
                    heaviestDeck = deck;
                }
                if (avgCost < minAvgCost) {
                    minAvgCost = avgCost;
                    lightestDeck = deck;
                }
            }

            // 4. Calculate Synergies
            for (let i = 0; i < deckCardNames.length; i++) {
                for (let j = i + 1; j < deckCardNames.length; j++) {
                    const pair = [deckCardNames[i], deckCardNames[j]].sort();
                    const pairStr = `${pair[0]} + ${pair[1]}`;
                    pairCounts[pairStr] = (pairCounts[pairStr] || 0) + 1;
                }
            }




        });

        const MIN_PAIR_APPEARANCES = 5;
        const normalizedPairsObj = {};

        for (const [pairStr, count] of Object.entries(pairCounts)) {
            if (count >= MIN_PAIR_APPEARANCES) {
                const [cardA, cardB] = pairStr.split(' + ');
                const presenceA = deckPresence[cardA] || 0;
                const presenceB = deckPresence[cardB] || 0;

                const union = presenceA + presenceB - count;
                const jaccardScore = union > 0 ? (count / union) : 0;

                normalizedPairsObj[pairStr] = parseFloat((jaccardScore * 100).toFixed(1));
            }
        }

        // Update Quick Stats DOM
        document.getElementById('statTotalDecks').innerText = totalDecks;
        document.getElementById('statUniqueCards').innerText = Object.keys(cardCopies).length;
        document.getElementById('statAvgVariety').innerText = totalDecks ? (totalUniqueCardSlots / totalDecks).toFixed(1) : 0;

        function getYouTubeId(url) {
            if (!url) return null;
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            return match ? match[1] : null;
        }

        function setExtremeCard({
            linkId,
            imgId,
            nameId,
            costId,
            deck,
            costText,
            youtubeId
        }) {
            const linkEl = document.getElementById(linkId);
            const imgEl = document.getElementById(imgId);
            const nameEl = document.getElementById(nameId);
            const costEl = document.getElementById(costId);

            if (!linkEl || !imgEl || !nameEl || !costEl) return;

            nameEl.innerText = deck.name || deck.youtube_title || '-';
            costEl.innerText = costText;

            if (youtubeId) {
                imgEl.src = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
            } else {
                imgEl.removeAttribute('src');
            }

            imgEl.alt = `${deck.name || deck.youtube_title || 'Deck'} thumbnail`;
            linkEl.href = deck.youtube_url || "#";
        }


        // Prepare Data for Charts 
        const topCopied = Object.entries(cardCopies).sort((a, b) => b[1] - a[1]);
        const topCopiedSliced = topCopied.slice(0, 15);
        const topPresence = Object.entries(deckPresence).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const yearsSorted = Object.keys(uploadsByYear).sort();
        const sortedDates = Object.keys(dailyUploads).sort();
        const cumulativeData = [];
        let runningTotal = 0;

        sortedDates.forEach(dateStr => {
            runningTotal += dailyUploads[dateStr];

            // Convert date to a pure numeric timestamp (milliseconds) for linear spacing
            const timestamp = new Date(dateStr + 'T12:00:00Z').getTime();

            // Store as an x/y coordinate pair
            cumulativeData.push({ x: timestamp, y: runningTotal });
        });
        const topRawPairs = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const topNormalizedPairs = Object.entries(normalizedPairsObj).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const topWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const costsSorted = Object.keys(costCurve).sort((a, b) => parseInt(a) - parseInt(b));

        // Destroy existing charts AND clear their references
        Object.keys(charts).forEach(key => {
            if (charts[key]) {
                charts[key].destroy();
                delete charts[key]; // <--- This is the magic fix
            }
        });

        const gridColor = '#30363d';
        const textColor = '#8b949e';
        const standardColors = ['#ff7b72', '#79c0ff', '#d2a8ff', '#a5d6ff', '#ffa657', '#3fb950', '#f85149', '#8957e5', '#2f81f7', '#d4ed31'];
        // --- 1. SET UP THE PAST BASELINE ---
        const dropCount = Math.min(100, Math.floor(totalDecks * 0.5));
        const safeDropCount = Math.max(1, dropCount);
        const pastDecks = allDecks.slice(safeDropCount);

        // --- 2. DYNAMIC RANKING FUNCTIONS ---
        // Helper function to extract a sorted array of card names, WITH filtering logic included
        function getRankedCards(deckArray, filterValue = 'all') {
            const counts = {};

            deckArray.forEach(deck => {
                deck.cards.forEach(cardString => {
                    const match = cardString.match(/^x(\d+)\s+(.+)$/);

                    if (match) {
                        const count = parseInt(match[1], 10);
                        const cardName = match[2].replace(/_/g, ' ');

                        // --- Apply the filter check ---
                        let keep = true;
                        if (filterValue !== 'all') {
                            const dbKey = cardName.replace(/ /g, '_');
                            const info = cardDatabase[dbKey] || {};

                            const typeStr = info.Type ? info.Type.toLowerCase() : "";
                            const isTrick = typeStr.includes("trick");
                            const isEnv = typeStr.includes("environment");
                            const isMinion = info.Type && !isTrick && !isEnv;
                            const cost = parseInt(info.Cost, 10) || 0;

                            keep = false;
                            if (filterValue === "minion" && isMinion) keep = true;
                            else if (filterValue === "trick" && isTrick) keep = true;
                            else if (filterValue === "environment" && isEnv) keep = true;
                            else if (filterValue === "wincon" && cost >= 5) keep = true;
                        }

                        if (keep) {
                            counts[cardName] = (counts[cardName] || 0) + count;
                        }
                    }
                });
            });

            // Sort by total copies (highest first) and return just an array of the names
            return Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);
        }

        // Function to generate the dictionary of text arrows based on a specific category
        function generateRankChanges(filterValue) {
            const currentList = getRankedCards(allDecks, filterValue);
            const pastList = getRankedCards(pastDecks, filterValue);

            const changes = {};
            currentList.forEach((card, currentIndex) => {
                const pastIndex = pastList.indexOf(card);

                if (pastIndex === -1) {
                    changes[card] = '  (NEW)';
                } else {
                    const change = pastIndex - currentIndex;
                    if (change > 0) changes[card] = `  (+${change} ▲)`;
                    else if (change < 0) changes[card] = `  (-${Math.abs(change)} ▼)`;
                    else changes[card] = `  (--)`;
                }
            });
            return changes;
        }

        // Initialize the global rankings for the default 'all' view when page loads
        let currentRankChanges = generateRankChanges('all');


        // --- 3. CHART 1: Total Copies ---
        const ctx1 = document.getElementById('topCardsChart').getContext('2d');
        charts.topCards = new Chart(ctx1, {
            type: 'bar',
            data: {
                // Use currentRankChanges to map the initial labels
                labels: topCopiedSliced.map(i => `${i[0]}${currentRankChanges[i[0]] || ''}`),
                datasets: [{ label: 'Total Copies', data: topCopiedSliced.map(i => i[1]), backgroundColor: '#238636', borderRadius: 4, hoverBackgroundColor: '#2ea043' }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { ticks: { color: '#c9d1d9' }, grid: { display: false } } },
                plugins: { legend: { display: false }, tooltip: { callbacks: { footer: () => '👉 Click to search for this card' } } },
                onClick: (e, activeElements) => {
                    if (activeElements.length > 0) {
                        const clickedCard = charts.topCards.data.labels[activeElements[0].index];

                        window.location.hash = '#';

                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                const searchInput = document.getElementById('searchInput');
                                if (searchInput) {
                                    const cleanCardName = clickedCard.split(/  \(/)[0];
                                    searchInput.value = cleanCardName;
                                    searchInput.dispatchEvent(new Event('input'));
                                }
                            });
                        });
                    }
                },
                onHover: (e, activeElements) => { e.native.target.style.cursor = activeElements.length ? 'pointer' : 'default'; }
            }
        });


        // --- 4. TOP CARDS FILTER LOGIC ---
        window.applyTopCardsFilter = function (filterValue) {
            if (!charts.topCards) return;

            let filteredArray = [];

            Object.entries(cardCopies).forEach(([cardName, count]) => {
                if (count === 0) return;

                const dbKey = cardName.replace(/ /g, '_');
                const info = cardDatabase[dbKey] || {};

                const typeStr = info.Type ? info.Type.toLowerCase() : "";
                const isTrick = typeStr.includes("trick");
                const isEnv = typeStr.includes("environment");
                const isMinion = info.Type && !isTrick && !isEnv;
                const cost = parseInt(info.Cost, 10) || 0;

                let keep = false;
                if (filterValue === "all") keep = true;
                else if (filterValue === "minion" && isMinion) keep = true;
                else if (filterValue === "trick" && isTrick) keep = true;
                else if (filterValue === "environment" && isEnv) keep = true;
                else if (filterValue === "wincon" && cost >= 5) keep = true;

                if (keep) {
                    filteredArray.push([cardName, count]);
                }
            });

            // Sort by count (highest first) and slice the top 15
            filteredArray.sort((a, b) => b[1] - a[1]);
            const newTopSliced = filteredArray.slice(0, 15);

            // --- THE FIX: Recalculate rank changes for this specific category ---
            currentRankChanges = generateRankChanges(filterValue);

            charts.topCards.data.labels = newTopSliced.map(i => {
                const cleanName = i[0];
                // Use the freshly generated context-aware arrows
                return `${cleanName}${currentRankChanges[cleanName] || ''}`;
            });

            charts.topCards.data.datasets[0].data = newTopSliced.map(i => i[1]);

            // Update Colors based on filter
            let newColor = '#238636';
            let hoverColor = '#2ea043';

            if (filterValue === 'trick') { newColor = '#8957e5'; hoverColor = '#a371f7'; }
            else if (filterValue === 'environment') { newColor = '#58a6ff'; hoverColor = '#79c0ff'; }
            else if (filterValue === 'wincon') { newColor = '#f85149'; hoverColor = '#ff7b72'; }

            charts.topCards.data.datasets[0].backgroundColor = newColor;
            charts.topCards.data.datasets[0].hoverBackgroundColor = hoverColor;

            // Redraw smoothly
            charts.topCards.update();
        };

        const currentTopCardsFilter = document.getElementById('topCardsFilter').value;
        if (currentTopCardsFilter !== 'all') {
            window.applyTopCardsFilter(currentTopCardsFilter);
        }
        // --- CHART 2: Deck Presence ---
        const ctx2 = document.getElementById('deckPresenceChart').getContext('2d');
        charts.deckPresence = new Chart(ctx2, {
            type: 'doughnut',
            data: { labels: topPresence.map(i => i[0]), datasets: [{ data: topPresence.map(i => i[1]), backgroundColor: standardColors, borderColor: '#161b22', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#c9d1d9', font: { size: 10 } } } } }
        });

        // --- CHART 3: Cumulative Upload Timeline ---
        const ctx3 = document.getElementById('timelineChart').getContext('2d');
        charts.timeline = new Chart(ctx3, {
            type: 'line',
            data: {
                // Notice we removed the "labels" array entirely!
                datasets: [{
                    label: 'Total Decks',
                    data: cumulativeData, // Now contains {x, y} coordinate objects
                    borderColor: '#58a6ff',
                    backgroundColor: 'rgba(88, 166, 255, 0.2)',
                    borderWidth: 3,
                    tension: 0.1,
                    fill: true,
                    pointBackgroundColor: '#1f6feb',
                    pointRadius: 1,
                    pointHitRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear', // CRITICAL: This mathematically spaces out the dates!
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            maxTicksLimit: 8,
                            // Convert the raw timestamp back into a readable Date string
                            callback: function (value) {
                                return new Date(value).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric'
                                });
                            }
                        }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, precision: 0 }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            // Make the tooltip show the exact date when you hover over a point
                            title: function (tooltipItems) {
                                const rawTimestamp = tooltipItems[0].parsed.x;
                                return new Date(rawTimestamp).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                });
                            }
                        }
                    }
                }
            }
        });

        // --- CHART 4: Ultimate Synergies ---
        const ctx4 = document.getElementById('pairsChart').getContext('2d');
        charts.pairs = new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: topRawPairs.map(i => i[0]),
                datasets: [{
                    label: 'Raw Count',
                    data: topRawPairs.map(i => i[1]),
                    backgroundColor: '#8957e5',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: textColor } },
                    y: { ticks: { color: '#c9d1d9', font: { size: 10 } }, grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // --- FIX: The Toggle Logic ---
        // Attach to 'window' so the HTML <input onchange="..."> can find it
        window.toggleSynergyChart = function (mode) {
            if (!charts.pairs) return; // Safety check

            if (mode === 'normalized') {
                charts.pairs.data.labels = topNormalizedPairs.map(i => i[0]);
                charts.pairs.data.datasets[0].data = topNormalizedPairs.map(i => i[1]);
                charts.pairs.data.datasets[0].label = 'Overlap %';
                charts.pairs.data.datasets[0].backgroundColor = '#d2a8ff'; // Lighter purple for visual change
            } else {
                charts.pairs.data.labels = topRawPairs.map(i => i[0]);
                charts.pairs.data.datasets[0].data = topRawPairs.map(i => i[1]);
                charts.pairs.data.datasets[0].label = 'Raw Count';
                charts.pairs.data.datasets[0].backgroundColor = '#8957e5'; // Original purple
            }
            charts.pairs.update(); // Redraw the chart
        };

        // Reset the HTML toggle to "Raw" every time we re-render the dashboard (like when changing timeframes)
        const rawToggle = document.getElementById('synergyRaw');
        if (rawToggle) rawToggle.checked = true;

        // --- POPULATE HISTORICAL AUTOCOMPLETE DATALIST ---
        const historicalDataList = document.getElementById('historicalOptions');
        if (historicalDataList && historicalDataList.options.length === 0 && typeof cardDatabase !== 'undefined') {
            Object.keys(cardDatabase).forEach(rawName => {
                const cleanName = rawName.replace(/_/g, ' ');
                const option = document.createElement('option');
                option.value = cleanName;
                historicalDataList.appendChild(option);
            });
        }

        // --- NEW CHART: Historical Card Tracker ---
        const historicalCtx = document.getElementById('historicalCardChart');

        window.updateHistoricalChart = function () {
            if (!historicalCtx) return; // Safety check

            // Grab both inputs (Assuming you rename the first to '1' and add a '2')
            const input1 = document.getElementById('historicalSearchInput1');
            const input2 = document.getElementById('historicalSearchInput2');

            const searchInput1 = input1 ? input1.value.trim() : '';
            const searchInput2 = input2 ? input2.value.trim() : '';

            const emptyMsg = document.getElementById('historicalEmptyMsg');
            const canvas = document.getElementById('historicalCardChart');

            // Check if inputs are valid and exist in our filtered data
            const valid1 = searchInput1 && cardPresenceByYear[searchInput1];
            const valid2 = searchInput2 && cardPresenceByYear[searchInput2];

            // If NEITHER input is valid, hide the chart
            if (!valid1 && !valid2) {
                canvas.style.display = 'none';
                emptyMsg.style.display = 'flex';
                return;
            }

            canvas.style.display = 'block';
            emptyMsg.style.display = 'none';

            const years = Object.keys(uploadsByYear).sort();
            const activeDatasets = [];

            // Helper function to generate percentage arrays
            const getPercentages = (cardName) => {
                return years.map(year => {
                    const totalDecksThisYear = uploadsByYear[year] || 1;
                    const cardDecksThisYear = cardPresenceByYear[cardName]?.[year] || 0;
                    return ((cardDecksThisYear / totalDecksThisYear) * 100).toFixed(1);
                });
            };

            // Build dataset for Card 1 (Blue)
            if (valid1) {
                activeDatasets.push({
                    label: `${searchInput1} Usage (%)`,
                    data: getPercentages(searchInput1),
                    borderColor: '#79c0ff',
                    backgroundColor: 'rgba(121, 192, 255, 0.2)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#2f81f7',
                    pointRadius: 4,
                    pointHoverRadius: 6
                });
            }

            // Build dataset for Card 2 (Coral/Red for contrast)
            if (valid2) {
                activeDatasets.push({
                    label: `${searchInput2} Usage (%)`,
                    data: getPercentages(searchInput2),
                    borderColor: '#ff7b72',
                    backgroundColor: 'rgba(255, 123, 114, 0.2)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#f85149',
                    pointRadius: 4,
                    pointHoverRadius: 6
                });
            }

            // Update existing chart or create a new one
            if (charts.historical) {
                charts.historical.data.labels = years;
                charts.historical.data.datasets = activeDatasets; // Swap in the new array
                charts.historical.update();
            } else {
                charts.historical = new Chart(historicalCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: years,
                        datasets: activeDatasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { grid: { color: gridColor }, ticks: { color: textColor } },
                            y: {
                                grid: { color: gridColor },
                                ticks: { color: textColor },
                                beginAtZero: true,
                                title: { display: true, text: '% of Decks that year', color: textColor }
                            }
                        },
                        plugins: {
                            // Make sure legend is visible now that we have multiple lines
                            legend: { display: true, labels: { color: textColor } },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => ` ${ctx.dataset.label.replace(' Usage (%)', '')}: ${ctx.parsed.y}%`
                                }
                            }
                        }
                    }
                });
            }
        };

        // Initialize the chart with the top 2 most popular cards on first load
        const historicalInput1 = document.getElementById('historicalSearchInput1');
        const historicalInput2 = document.getElementById('historicalSearchInput2');

        if (historicalInput1) {
            const defaultCard1 = topCopiedSliced.length > 0 ? topCopiedSliced[0][0] : null;
            const defaultCard2 = topCopiedSliced.length > 1 ? topCopiedSliced[1][0] : null;

            if (defaultCard1) {
                historicalInput1.value = defaultCard1;

                // Populate the second input if the element and data exist
                if (historicalInput2 && defaultCard2) {
                    historicalInput2.value = defaultCard2;
                }

                // Call the update function once both inputs are populated
                window.updateHistoricalChart();
            } else {
                document.getElementById('historicalCardChart').style.display = 'none';
                document.getElementById('historicalEmptyMsg').style.display = 'flex';
            }
        }

        // --- CHART 5: Title Buzzwords (Word Cloud) ---
        const ctx5 = document.getElementById('buzzwordChart').getContext('2d');

        // If you want more words in the cloud, change your topWords slice from (0, 10) to (0, 30) or more!
        charts.buzzwords = new Chart(ctx5, {
            type: 'wordCloud',
            data: {
                labels: topWords.map(i => i[0].toUpperCase()),
                datasets: [{
                    data: topWords.map(i => i[1]),
                    // Randomize colors for a cool visual effect, or keep it to your theme
                    color: () => {
                        const colors = ['#58a6ff', '#f85149', '#3fb950', '#d2a8ff', '#e3b341'];
                        return colors[Math.floor(Math.random() * colors.length)];
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            // Make the tooltip say "GARG: 42 uses" instead of just "42"
                            label: (context) => `${context.parsed.y} uses`
                        }
                    }
                },
                elements: {
                    wordText: {
                        fontFamily: 'sans-serif',
                        fontStyle: 'bold',
                        // Keep the words mostly horizontal or slightly tilted for readability
                        minRotation: -15,
                        maxRotation: 15,
                    }
                }
            }
        });

        // --- CHART 6: Cost Curve ---
        const ctx6 = document.getElementById('costCurveChart').getContext('2d');
        charts.costCurve = new Chart(ctx6, {
            type: 'bar',
            data: {
                labels: costsSorted.map(cost => `Cost ${cost}`),
                datasets: [{ label: 'Total Copies Across Decks', data: costsSorted.map(cost => costCurve[cost]), backgroundColor: '#3fb950', borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor } } }, plugins: { legend: { display: false } } }
        });

        // --- Spark Cost Distribution (smooth KDE over all decks) ---
        const sparkCanvas = document.getElementById('sparkDistributionChart');
        if (sparkCanvas && allSparkCosts.length > 1) {
            const data = allSparkCosts;
            const n = data.length;
            const minVal = Math.min(...data);
            const maxVal = Math.max(...data);

            // Spread stats for an automatic bandwidth (Silverman's rule of thumb)
            const mean = data.reduce((a, b) => a + b, 0) / n;
            const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / n);

            const sorted = [...data].sort((a, b) => a - b);
            const quantile = (q) => {
                const pos = (sorted.length - 1) * q;
                const base = Math.floor(pos);
                const rest = pos - base;
                return sorted[base + 1] !== undefined
                    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
                    : sorted[base];
            };
            const iqr = quantile(0.75) - quantile(0.25);

            const spread = iqr > 0 ? Math.min(std, iqr / 1.34) : std;
            let bandwidth = 1.06 * spread * Math.pow(n, -1 / 5);
            if (!bandwidth || bandwidth <= 0) bandwidth = (maxVal - minVal) / 20 || 50;

            // Reference window keeps the y-axis on the same "# of decks" scale as before
            const refWindow = Math.max(50, Math.round(bandwidth / 50) * 50);
            const invH = 1 / bandwidth;

            // Evaluate the curve across a fine grid (200 points = visually smooth)
            const STEPS = 200;
            const pad = bandwidth * 3;
            const lo = Math.max(0, minVal - pad);
            const hi = maxVal + pad;
            const step = (hi - lo) / STEPS;

            const sparkPoints = [];
            for (let i = 0; i <= STEPS; i++) {
                const x = lo + i * step;
                let sum = 0;
                for (let j = 0; j < n; j++) {
                    const u = (x - data[j]) * invH;
                    sum += Math.exp(-0.5 * u * u);
                }
                // density * N * window  ≈  expected # of decks in a window that wide
                const y = (sum / n) / (Math.sqrt(2 * Math.PI) * bandwidth) * n * refWindow;
                sparkPoints.push({ x, y });
            }

            const avgSpark = mean;

            charts.sparkDistribution = new Chart(sparkCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Decks',
                        data: sparkPoints,
                        borderColor: '#d2a8ff',
                        backgroundColor: 'rgba(210, 168, 255, 0.2)',
                        borderWidth: 3,
                        tension: 0,        // points are dense, so straight segments already look smooth
                        fill: true,
                        pointRadius: 0,    // no dots — it's a continuous curve now
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: '#a371f7'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: {
                            type: 'linear',
                            grid: { color: gridColor },
                            ticks: {
                                color: textColor,
                                maxTicksLimit: 8,
                                callback: (value) => Math.round(value).toLocaleString()
                            },
                            title: { display: true, text: 'Total Spark Cost', color: textColor }
                        },
                        y: {
                            grid: { color: gridColor },
                            ticks: { color: textColor, precision: 0 },
                            beginAtZero: true,
                            title: { display: true, text: '# of Decks', color: textColor }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                title: (items) => `${Math.round(items[0].parsed.x).toLocaleString()} Sparks`,
                                label: (ctx) => ` ~${Math.round(ctx.parsed.y)} decks nearby`,
                                footer: () => `Avg: ${Math.round(avgSpark).toLocaleString()} Sparks`
                            }
                        }
                    }
                }
            });
            // --- Mana Cost Distribution (smooth KDE over all decks) ---
            const manaCanvas = document.getElementById('manaDistributionChart');
            if (manaCanvas && allAvgCosts.length > 1) {
                const data = allAvgCosts;
                const n = data.length;
                const minVal = Math.min(...data);
                const maxVal = Math.max(...data);

                const mean = data.reduce((a, b) => a + b, 0) / n;
                const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / n);

                const sorted = [...data].sort((a, b) => a - b);
                const quantile = (q) => {
                    const pos = (sorted.length - 1) * q;
                    const base = Math.floor(pos);
                    const rest = pos - base;
                    return sorted[base + 1] !== undefined
                        ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
                        : sorted[base];
                };
                const iqr = quantile(0.75) - quantile(0.25);

                const spread = iqr > 0 ? Math.min(std, iqr / 1.34) : std;
                let bandwidth = 1.06 * spread * Math.pow(n, -1 / 5);
                if (!bandwidth || bandwidth <= 0) bandwidth = (maxVal - minVal) / 20 || 0.1;

                // Reference window = histogram-style bin width (scale-independent → clean "# of decks" axis)
                const numBins = Math.min(30, Math.max(10, Math.round(Math.sqrt(n))));
                const refWindow = (maxVal - minVal) > 0 ? (maxVal - minVal) / numBins : bandwidth;
                const invH = 1 / bandwidth;

                const STEPS = 200;
                const pad = bandwidth * 3;
                const lo = Math.max(0, minVal - pad);
                const hi = maxVal + pad;
                const step = (hi - lo) / STEPS;

                const manaPoints = [];
                for (let i = 0; i <= STEPS; i++) {
                    const x = lo + i * step;
                    let sum = 0;
                    for (let j = 0; j < n; j++) {
                        const u = (x - data[j]) * invH;
                        sum += Math.exp(-0.5 * u * u);
                    }
                    const y = (sum / n) / (Math.sqrt(2 * Math.PI) * bandwidth) * n * refWindow;
                    manaPoints.push({ x, y });
                }

                const avgMana = mean;

                charts.manaDistribution = new Chart(manaCanvas.getContext('2d'), {
                    type: 'line',
                    data: {
                        datasets: [{
                            label: 'Decks',
                            data: manaPoints,
                            borderColor: '#3fb950',
                            backgroundColor: 'rgba(63, 185, 80, 0.2)',
                            borderWidth: 3,
                            tension: 0,
                            fill: true,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            pointHoverBackgroundColor: '#2ea043'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        scales: {
                            x: {
                                type: 'linear',
                                grid: { color: gridColor },
                                ticks: {
                                    color: textColor,
                                    maxTicksLimit: 8,
                                    callback: (value) => value.toFixed(2)
                                },
                                title: { display: true, text: 'Average Mana Cost', color: textColor }
                            },
                            y: {
                                grid: { color: gridColor },
                                ticks: { color: textColor, precision: 0 },
                                beginAtZero: true,
                                title: { display: true, text: '# of Decks', color: textColor }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    title: (items) => `${items[0].parsed.x.toFixed(2)} avg mana`,
                                    label: (ctx) => ` ~${Math.round(ctx.parsed.y)} decks nearby`,
                                    footer: () => `Avg: ${avgMana.toFixed(2)} mana`
                                }
                            }
                        }
                    }
                });
            }
        }
        // --- CHART 6.5: Hot & Cold Trending Cards ---
        const trendingCanvas = document.getElementById('trendingCardsChart');
        const trendingEmptyMsg = document.getElementById('trendingEmptyMsg');

        if (trendingCanvas) {
            // If we are looking at 50 or fewer decks, trends don't make mathematical sense
            if (totalDecks <= RECENT_DECK_COUNT) {
                trendingCanvas.style.display = 'none';
                if (trendingEmptyMsg) {
                    // Remove the inline display:none and use flex to center it
                    trendingEmptyMsg.style.display = 'flex';
                }
            } else {
                // We have enough data! Show the canvas, hide the message
                trendingCanvas.style.display = 'block';
                if (trendingEmptyMsg) {
                    trendingEmptyMsg.style.display = 'none';
                }

                const trendingScores = [];
                // Use cardCopies instead of allTimeCardFreq since it holds the exact same data
                Object.keys(cardCopies).forEach(card => {
                    const allTimeAvg = cardCopies[card] / totalDecks;
                    const recentAvg = (recentCardFreq[card] || 0) / RECENT_DECK_COUNT;
                    const delta = recentAvg - allTimeAvg;

                    if (cardCopies[card] >= 10 || (recentCardFreq[card] || 0) >= 4) {
                        trendingScores.push({ name: card, delta: delta });
                    }
                });

                trendingScores.sort((a, b) => b.delta - a.delta);

                const hottest = trendingScores.slice(0, 5);
                const coldest = trendingScores.slice(-5);
                const hotAndCold = [...hottest, ...coldest];

                const ctx10 = trendingCanvas.getContext('2d');
                charts.trending = new Chart(ctx10, {
                    type: 'bar',
                    data: {
                        labels: hotAndCold.map(item => item.name),
                        datasets: [{
                            label: 'Usage Change',
                            data: hotAndCold.map(item => item.delta.toFixed(2)),
                            backgroundColor: hotAndCold.map(item => item.delta > 0 ? '#ff7b72' : '#58a6ff'),
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const val = context.raw;
                                        return val > 0 ? `🔥 Trending Up: +${val} copies/deck` : `🧊 Trending Down: ${val} copies/deck`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { grid: { color: gridColor }, ticks: { color: textColor } },
                            y: { ticks: { color: '#c9d1d9', font: { weight: 'bold' } }, grid: { display: false } }
                        }
                    }
                });
            }
        }

        // --- CHART 7: Class Dominance ---
        const ctx7 = document.getElementById('classRadarChart').getContext('2d');

        // Sort the classes by count (highest to lowest) to create a smooth shape
        const sortedClassEntries = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);
        const sortedClassLabels = sortedClassEntries.map(e => e[0]);
        const sortedClassData = sortedClassEntries.map(e => e[1]);

        charts.classDominance = new Chart(ctx7, {
            type: 'radar',
            data: {
                labels: sortedClassLabels,
                datasets: [{
                    label: 'Total Copies Across Decks',
                    data: sortedClassData,
                    backgroundColor: 'rgba(210, 168, 255, 0.4)',
                    borderColor: '#d2a8ff',
                    pointBackgroundColor: '#a371f7',
                    borderWidth: 2,
                    tension: 0.3 // NEW: Curves the lines between points to reduce jaggedness
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true, // NEW: Keeps the center anchored
                        grid: { color: gridColor },
                        angleLines: { color: gridColor },
                        ticks: { display: false },
                        pointLabels: { color: '#c9d1d9', font: { size: 12 } }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // --- CHART 10: Hero Playrates (Toggleable Radar) ---

        // 1. Define the base lists to determine who belongs to which faction
        const plantHeroes = [
            "Captain Combustible", "Chompzilla", "Citron / Beta-Carrotina",
            "Grass Knuckles", "Green Shadow", "Nightcap", "Rose",
            "Solar Flare", "Spudow", "Wall-Knight"
        ];
        const zombieHeroes = [
            "Brain Freeze", "Electric Boogaloo", "Immorticia", "Impfinity",
            "Neptuna", "Professor Brainstorm", "Rustbolt", "Super Brainz / HG",
            "The Smash", "Z-Mech"
        ];

        // NEW: Helper function to map counts AND sort them from highest to lowest
        const getSortedHeroData = (heroList) => {
            // Pair the heroes with their counts
            const paired = heroList.map(hero => ({
                name: hero,
                count: heroCounts[hero] || 0
            }));

            // Sort descending by count
            paired.sort((a, b) => b.count - a.count);

            // Return separated arrays for Chart.js
            return {
                labels: paired.map(item => item.name),
                data: paired.map(item => item.count)
            };
        };

        // 2. Initialize the chart with sorted Plant data
        const initialPlantData = getSortedHeroData(plantHeroes);

        const ctx10 = document.getElementById('heroChart').getContext('2d');
        charts.heroPlayrates = new Chart(ctx10, {
            type: 'radar',
            data: {
                labels: initialPlantData.labels,
                datasets: [{
                    label: 'Decks Played',
                    data: initialPlantData.data,
                    backgroundColor: 'rgba(63, 185, 80, 0.3)', // Green for plants
                    borderColor: '#3fb950',
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#3fb950',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#3fb950',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    tension: 0.3 // Keeps the lines between points curved
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#c9d1d9', font: { size: 11 } },
                        ticks: { display: false, backdropColor: 'transparent' },
                        beginAtZero: true // Anchors the center smoothly
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(22, 27, 34, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#c9d1d9',
                        borderColor: '#30363d',
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                return ` ${context.raw} Decks`;
                            }
                        }
                    }
                }
            }
        });

        // 3. Tab Click Event Listeners to swap data smoothly
        document.querySelectorAll('.hero-tab').forEach(tab => {
            tab.onclick = (e) => {
                // Remove active class from all tabs, add to clicked tab
                document.querySelectorAll('.hero-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                const faction = e.target.getAttribute('data-faction');
                const dataset = charts.heroPlayrates.data.datasets[0];

                if (faction === 'plants') {
                    const sortedPlants = getSortedHeroData(plantHeroes);
                    charts.heroPlayrates.data.labels = sortedPlants.labels;
                    dataset.data = sortedPlants.data;

                    dataset.backgroundColor = 'rgba(63, 185, 80, 0.3)'; // Plant Green
                    dataset.borderColor = '#3fb950';
                    dataset.pointBorderColor = '#3fb950';
                } else {
                    const sortedZombies = getSortedHeroData(zombieHeroes);
                    charts.heroPlayrates.data.labels = sortedZombies.labels;
                    dataset.data = sortedZombies.data;

                    dataset.backgroundColor = 'rgba(137, 87, 229, 0.3)'; // Zombie Purple
                    dataset.borderColor = '#8957e5';
                    dataset.pointBorderColor = '#8957e5';
                }

                // Animate the transition
                charts.heroPlayrates.update();
            };
        });

        // --- CHART 9: Average Deck Composition (Card Types) ---
        // Ensure typeCounts has fallback values to prevent undefined errors
        const minions = typeCounts["Fighter / Minion"] || 0;
        const tricks = typeCounts["Trick"] || 0;
        const environments = typeCounts["Environment"] || 0;

        const avgMinions = allDecks.length ? (minions / allDecks.length).toFixed(1) : 0;
        const avgTricks = allDecks.length ? (tricks / allDecks.length).toFixed(1) : 0;
        const avgEnvironments = allDecks.length ? (environments / allDecks.length).toFixed(1) : 0;

        const ctx9 = document.getElementById('averageDeckChart').getContext('2d');
        charts.averageDeck = new Chart(ctx9, {
            type: 'doughnut',
            data: {
                labels: ['Minions', 'Tricks', 'Environments'],
                datasets: [{
                    data: [avgMinions, avgTricks, avgEnvironments],
                    // Green for Minions, Purple for Tricks, Blue for Environments
                    backgroundColor: ['#3fb950', '#8957e5', '#58a6ff'],
                    borderColor: '#161b22',
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#c9d1d9' } },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return ` ${context.raw} cards per deck`;
                            }
                        }
                    }
                }
            }
        });

    animateStatsPanels();
    }
    function resetStatsAnimation() {
  const statsView = document.getElementById("statsView");
  if (!statsView) return;

  statsView.classList.remove("stats-visible");

  const panels = statsView.querySelectorAll(".stat-card, .chart-box");
  panels.forEach(panel => {
    panel.style.opacity = "";
    panel.style.transform = "";
  });
}

    // --- AI DECK BUILDER: SMART SEED MANAGEMENT ---

    const plantClasses = new Set(["Mega-Grow", "Kabloom", "Smarty", "Guardian", "Solar"]);
    let currentSeeds = [];
    // True right after "build from collection" finishes, so the automatic
    // swap-idea popup doesn't immediately turn around and suggest scrapping
    // for a card outside the collection it was just built from. Any manual
    // edit to the deck clears it, since at that point normal suggestions
    // (including ones that need crafting) make sense again.
    let deckBuiltFromCollection = false;
    let heroAnnounced = false;
    let currentFaction = null;
    let activeClasses = new Set();
    let deckHeroLock = null; // { name, faction, classes } when "Build for hero" has a hero picked
    let currentClipboardText = "";
    let lastAddedCard = null; // Memory for AI context
    let ownedCollection = {}; // cardName -> owned copies (1-4), for "Build From My Collection"

    // --- Collection persistence (localStorage) ---
    const OWNED_COLLECTION_KEY = 'pvz_owned_collection_v1';
    function loadOwnedCollection() {
        try {
            const raw = localStorage.getItem(OWNED_COLLECTION_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') ownedCollection = parsed;
            }
        } catch (e) { /* ignore corrupt storage */ }
    }
    function saveOwnedCollection() {
        try {
            localStorage.setItem(OWNED_COLLECTION_KEY, JSON.stringify(ownedCollection));
        } catch (e) { /* storage full/unavailable, ignore */ }
    }
    loadOwnedCollection();

    // Central rarity -> spark cost map, reused everywhere collection cost is shown.
    const RARITY_SPARKS = {
        'common': 0,
        'basic': 0,
        'uncommon': 50,
        'rare': 250,
        'super rare': 1000,
        'super-rare': 1000,
        'event': 1000,
        'legendary': 4000
    };
    function sparkCostFor(rawName) {
        const info = (typeof cardDatabase !== 'undefined') ? cardDatabase[rawName] : null;
        const rarity = (info?.Rarity || '').toLowerCase();
        return RARITY_SPARKS[rarity] || 0;
    }

    // Recycle (scrap) value - what you get back for destroying a copy. Always
    // less than the craft cost above.
    const RECYCLE_SPARKS = {
        'common': 0,
        'basic': 0,
        'uncommon': 15,
        'rare': 50,
        'super rare': 250,
        'super-rare': 250,
        'event': 250,
        'legendary': 1000
    };
    function recycleValueFor(rawName) {
        const info = (typeof cardDatabase !== 'undefined') ? cardDatabase[rawName] : null;
        const rarity = (info?.Rarity || '').toLowerCase();
        return RECYCLE_SPARKS[rarity] || 0;
    }

    /*
     * Given a spark shortfall and a set of card names to leave alone (things
     * already in the deck we're building), pick owned cards to scrap to
     * cover it. Prefers cards that barely show up in strong decks (using the
     * same cardFrequencies data the synergy engine already computes), so we
     * scrap clutter rather than anything actually good. May suggest scrapping
     * from more than one card if that's what it takes.
     */
    function findScrapSuggestions(sparksNeeded, protectedNames) {
        const candidates = [];

        Object.keys(ownedCollection).forEach(name => {
            if (protectedNames && protectedNames.has(name)) return;

            const owned = ownedCollection[name] || 0;
            if (owned <= 0) return;

            const info = cardDatabase?.[name];
            if (!info) return;
            // Basic cards come free with every hero and can't be scrapped.
            if (info.Set === 'Basic') return;

            const perCopyValue = recycleValueFor(name);
            if (perCopyValue <= 0) return;

            const usage = (typeof cardFrequencies === 'object' && cardFrequencies)
                ? (cardFrequencies[name] || 0)
                : 0;

            candidates.push({ name, owned, usage, perCopyValue });
        });

        // Least-used cards in strong decks first (best scrap fodder); among
        // equally-unused cards, prefer higher recycle value so fewer cards
        // need to be broken down.
        candidates.sort((a, b) => (a.usage - b.usage) || (b.perCopyValue - a.perCopyValue));

        const picks = [];
        let gathered = 0;

        for (const c of candidates) {
            if (gathered >= sparksNeeded) break;

            const stillNeeded = sparksNeeded - gathered;
            const copiesToScrap = Math.min(c.owned, Math.ceil(stillNeeded / c.perCopyValue));
            if (copiesToScrap <= 0) continue;

            const sparksFromThis = copiesToScrap * c.perCopyValue;
            picks.push({ name: c.name, copies: copiesToScrap, sparks: sparksFromThis });
            gathered += sparksFromThis;
        }

        return { picks, gathered, stillShort: Math.max(0, sparksNeeded - gathered) };
    }

    // --- Owned Sparks (user-entered balance, same persistence pattern as the collection) ---
    let ownedSparks = 0;
    const OWNED_SPARKS_KEY = 'pvz_owned_sparks_v1';
    function loadOwnedSparks() {
        try {
            const raw = localStorage.getItem(OWNED_SPARKS_KEY);
            const n = parseInt(raw, 10);
            if (!isNaN(n) && n >= 0) ownedSparks = n;
        } catch (e) { /* ignore corrupt storage */ }
    }
    function saveOwnedSparks() {
        try {
            localStorage.setItem(OWNED_SPARKS_KEY, String(ownedSparks));
        } catch (e) { /* storage full/unavailable, ignore */ }
    }
    loadOwnedSparks();
    // Whether the user has ever actually told us a spark balance. Without
    // this, a fresh 0 (nobody's typed anything into "My Sparks" yet) looks
    // identical to a real 0, and we'd nag people to scrap cards just because
    // we assumed they're broke.
    function hasEnteredSparks() {
        try {
            return localStorage.getItem(OWNED_SPARKS_KEY) !== null;
        } catch (e) {
            return ownedSparks > 0;
        }
    }

    // --- Hero ownership (separate from card ownership, same persistence pattern) ---
    let ownedHeroes = {}; // heroName -> true
    const OWNED_HEROES_KEY = 'pvz_owned_heroes_v1';
    function loadOwnedHeroes() {
        try {
            const raw = localStorage.getItem(OWNED_HEROES_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') ownedHeroes = parsed;
            }
        } catch (e) { /* ignore corrupt storage */ }
    }
    function saveOwnedHeroes() {
        try {
            localStorage.setItem(OWNED_HEROES_KEY, JSON.stringify(ownedHeroes));
        } catch (e) { /* storage full/unavailable, ignore */ }
    }
    loadOwnedHeroes();

    // UI Elements
    const seedInput = document.getElementById('seedSearchInput');
    const suggestionsBox = document.getElementById('smartSuggestions');
    const generateDeckBtn = document.getElementById('generateDeckBtn');
    const clearSeedsBtn = document.getElementById('clearSeedsBtn');
    const budgetToggle = document.getElementById('budgetToggle');
    const superBudgetToggle = document.getElementById('superBudgetToggle');

    // Toggles Logic
    if (budgetToggle && superBudgetToggle) {
        budgetToggle.addEventListener('change', function () {
            if (this.checked) superBudgetToggle.checked = false;
        });
        superBudgetToggle.addEventListener('change', function () {
            if (this.checked) budgetToggle.checked = false;
        });
    }

    // --- My Collection (Build Best Deck From What I Own) ---
    const collectionToggleBtn = document.getElementById('collectionToggleBtn');
    const collectionPanel = document.getElementById('collectionPanel');
    const collectionSearch = document.getElementById('collectionSearch');
    const collectionList = document.getElementById('collectionList');
    const collectionFactionSelect = document.getElementById('collectionFactionSelect');
    const buildFromCollectionBtn = document.getElementById('buildFromCollectionBtn');
    const collectionOwnedCount = document.getElementById('collectionOwnedCount');
    const ownedSparksInput = document.getElementById('ownedSparksInput');

    if (ownedSparksInput) {
        ownedSparksInput.value = ownedSparks > 0 ? String(ownedSparks) : '';
        ownedSparksInput.addEventListener('input', () => {
            const n = parseInt(ownedSparksInput.value, 10);
            ownedSparks = (!isNaN(n) && n >= 0) ? n : 0;
            saveOwnedSparks();
        });
    }

    let collectionDefaultsSeeded = false;

    function seedDefaultCollection() {
        if (collectionDefaultsSeeded) return;
        Object.keys(cardDatabase || {}).forEach(rawName => {
            const cardInfo = cardDatabase[rawName];
            // "Basic" set cards come free with every hero and can't be scraped
            // from a collection screenshot/export, so assume they're owned.
            if (cardInfo?.Set === 'Basic' && ownedCollection[rawName] === undefined) {
                ownedCollection[rawName] = 4;
            }
        });
        collectionDefaultsSeeded = true;
        saveOwnedCollection();
    }

    function renderCollectionList(filter = '') {
        if (!collectionList) return;
        collectionList.innerHTML = '';
        const q = filter.toLowerCase().trim();
        const wantedFaction = collectionFactionSelect ? collectionFactionSelect.value : 'Plant';

        let shown = 0;
        Object.keys(cardDatabase || {}).forEach(rawName => {
            const cardInfo = cardDatabase[rawName];
            const cardClass = cardInfo?.Class;
            const cardFaction = plantClasses.has(cardClass) ? 'Plant' : 'Zombie';
            if (cardFaction !== wantedFaction) return;

            const cleanName = rawName.replace(/_/g, ' ');
            if (q && !cleanName.toLowerCase().includes(q)) return;
            if (shown >= 200) return; // keep the list light

            const owned = ownedCollection[rawName] || 0;
            const isDefault = cardInfo?.Set === 'Basic';
            const row = document.createElement('div');
            row.className = 'collection-card' + (owned > 0 ? ' owned' : '');

            const countBtns = [1, 2, 3, 4].map(n =>
                `<button type="button" class="collection-count-btn${owned === n ? ' active' : ''}" data-name="${rawName}" data-n="${n}">${n}</button>`
            ).join('');

            row.innerHTML = `
                <span class="collection-card-name">${cleanName}${isDefault ? ' <span class="collection-default-tag">auto</span>' : ''}</span>
                <div class="collection-count-group">
                    ${countBtns}
                    <button type="button" class="collection-count-btn collection-clear-btn" data-name="${rawName}" data-n="0">✕</button>
                </div>`;
            collectionList.appendChild(row);
            shown++;
        });

        if (collectionOwnedCount) {
            collectionOwnedCount.innerText = Object.keys(ownedCollection).length;
        }
    }

    if (collectionToggleBtn && collectionPanel) {
        collectionToggleBtn.addEventListener('click', () => {
            collectionPanel.classList.toggle('hidden');
            if (!collectionPanel.classList.contains('hidden')) {
                seedDefaultCollection();
                renderCollectionList(collectionSearch ? collectionSearch.value : '');
            }
        });
    }

    const collectionPanelClose = document.getElementById('collectionPanelClose');
    if (collectionPanelClose && collectionPanel) {
        collectionPanelClose.addEventListener('click', () => {
            collectionPanel.classList.add('hidden');
        });
    }
    if (collectionPanel) {
        // Clicking the dark backdrop (not the inner box) closes the panel.
        collectionPanel.addEventListener('click', (e) => {
            if (e.target === collectionPanel) collectionPanel.classList.add('hidden');
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && collectionPanel && !collectionPanel.classList.contains('hidden')) {
            collectionPanel.classList.add('hidden');
        }
    });

    if (collectionSearch) {
        collectionSearch.addEventListener('input', () => {
            renderCollectionList(collectionSearch.value);
        });
    }

    if (collectionFactionSelect) {
        collectionFactionSelect.addEventListener('change', () => {
            renderCollectionList(collectionSearch ? collectionSearch.value : '');
        });
    }

    if (collectionList) {
        collectionList.addEventListener('click', (e) => {
            const btn = e.target.closest('.collection-count-btn');
            if (!btn) return;
            const name = btn.dataset.name;
            const n = parseInt(btn.dataset.n, 10);
            if (n === 0) {
                delete ownedCollection[name];
            } else {
                ownedCollection[name] = n;
            }
            saveOwnedCollection();
            renderCollectionList(collectionSearch ? collectionSearch.value : '');
            if (typeof updateDeckSparkCost === 'function') updateDeckSparkCost();
        });
    }

    if (buildFromCollectionBtn) {
        buildFromCollectionBtn.addEventListener('click', () => {
            seedDefaultCollection();
            if (Object.keys(ownedCollection).length === 0) {
                alert('Mark at least one card as owned first.');
                return;
            }

            buildFromCollectionBtn.disabled = true;

            setTimeout(() => {
                try {
                    buildDeckFromCollection();
                } finally {
                    buildFromCollectionBtn.disabled = false;
                }
            }, 50);
        });
    }

    // --- Quick "build from collection" folder button, sitting right next to
    // the finish-deck wand and the image-import button so people don't have
    // to open the collection panel just to build a deck from what they own ---
    const buildFromCollectionQuickBtn = document.getElementById('buildFromCollectionQuickBtn');
    if (buildFromCollectionQuickBtn) {
        buildFromCollectionQuickBtn.addEventListener('click', () => {
            seedDefaultCollection();
            if (Object.keys(ownedCollection).length === 0) {
                alert('Mark at least one card as owned first (open My Collection).');
                return;
            }

            // If a hero is already selected up top, build for that hero.
            // Otherwise pick a random hero - prefer one the user actually
            // owns, since building for a hero they don't have is pointless.
            if (!deckHeroLock) {
                const ownedHeroNames = [...PLANT_HEROES, ...ZOMBIE_HEROES].filter(h => ownedHeroes[h]);
                const pool = ownedHeroNames.length ? ownedHeroNames : [...PLANT_HEROES, ...ZOMBIE_HEROES];
                const randomHero = pool[Math.floor(Math.random() * pool.length)];

                const deckHeroSelectEl = document.getElementById('deckHeroSelect');
                if (deckHeroSelectEl) {
                    deckHeroSelectEl.value = randomHero;
                    deckHeroSelectEl.dispatchEvent(new Event('change'));
                }
            }

            buildFromCollectionQuickBtn.disabled = true;
            setTimeout(() => {
                try {
                    buildDeckFromCollection();
                } finally {
                    buildFromCollectionQuickBtn.disabled = false;
                }
            }, 50);
        });
    }

    // --- My Collection PAGE (full view, reachable from More > My Collection) ---
    const PLANT_HEROES = ["Green Shadow", "Solar Flare", "Wall-Knight", "Chompzilla", "Spudow", "Citron", "Beta-Carrotina", "Grass Knuckles", "Nightcap", "Captain Combustible", "Rose"];
    const ZOMBIE_HEROES = ["Super Brainz", "Huge-Gigantacus", "The Smash", "Impfinity", "Rustbolt", "Electric Boogaloo", "Brain Freeze", "Professor Brainstorm", "Immorticia", "Z-Mech", "Neptuna"];

    // Each hero leads two classes; used to color-split their collection portrait.
    const PLANT_HERO_CLASSES = {
        "Green Shadow": ["Mega-Grow", "Smarty"],
        "Solar Flare": ["Kabloom", "Solar"],
        "Wall-Knight": ["Guardian", "Solar"],
        "Chompzilla": ["Mega-Grow", "Solar"],
        "Spudow": ["Kabloom", "Guardian"],
        "Citron": ["Guardian", "Smarty"],
        "Beta-Carrotina": ["Guardian", "Smarty"],
        "Grass Knuckles": ["Mega-Grow", "Guardian"],
        "Nightcap": ["Kabloom", "Smarty"],
        "Captain Combustible": ["Kabloom", "Mega-Grow"],
        "Rose": ["Smarty", "Solar"]
    };
    const ZOMBIE_HERO_CLASSES = {
        "Super Brainz": ["Brainy", "Sneaky"],
        "Huge-Gigantacus": ["Brainy", "Sneaky"],
        "The Smash": ["Hearty", "Beastly"],
        "Impfinity": ["Sneaky", "Crazy"],
        "Rustbolt": ["Brainy", "Hearty"],
        "Electric Boogaloo": ["Beastly", "Crazy"],
        "Brain Freeze": ["Sneaky", "Beastly"],
        "Professor Brainstorm": ["Brainy", "Crazy"],
        "Immorticia": ["Brainy", "Beastly"],
        "Z-Mech": ["Hearty", "Crazy"],
        "Neptuna": ["Hearty", "Sneaky"]
    };

    // Class -> accent color, reused for hero portrait split-borders and card class headers.
    const CLASS_COLORS = {
        "Guardian": "#3B82F6",
        "Kabloom": "#F97316",
        "Mega-Grow": "#22C55E",
        "Smarty": "#A855F7",
        "Solar": "#FACC15",
        "Beastly": "#92400E",
        "Brainy": "#EC4899",
        "Crazy": "#06B6D4",
        "Hearty": "#EF4444",
        "Sneaky": "#4B5563"
    };
    // Class icon images live in class_icons/<ClassName>.webp (e.g. class_icons/Beastly.webp).

    function heroImgBase(name) {
        return name.replace(/[\s-]+/g, '_');
    }

    function getCollectionPageFaction() {
        const el = document.getElementById('collectionPageFaction');
        return el ? el.value : 'Plant';
    }

    function computeBuildableDecks() {
        const result = { buildable: 0, total: 0 };
        if (typeof fullDatabase !== 'object' || !fullDatabase) return result;
        Object.values(fullDatabase).forEach(deckInfo => {
            const cards = deckInfo.cards || [];
            if (!cards.length) return;
            result.total++;
            const ok = cards.every(cardString => {
                const m = cardString.trim().match(/^x(\d+)\s+(.+)$/i);
                let count = 1, raw = cardString;
                if (m) { count = parseInt(m[1], 10); raw = m[2]; }
                const db = raw.replace(/ /g, '_');
                return (ownedCollection[db] || 0) >= count;
            });
            if (ok) result.buildable++;
        });
        return result;
    }

    function renderCollectionPageStats() {
        const box = document.getElementById('collectionPageStats');
        if (!box) return;

        let totalValue = 0;
        let uniqueOwned = 0;
        Object.keys(ownedCollection).forEach(rawName => {
            const owned = ownedCollection[rawName] || 0;
            if (owned <= 0) return;
            uniqueOwned++;
            totalValue += sparkCostFor(rawName) * owned;
        });

        const heroesOwnedCount = Object.values(ownedHeroes).filter(Boolean).length;
        const { buildable, total } = computeBuildableDecks();

        box.innerHTML = `
            <div class="collection-stat-card">
                <span class="collection-stat-num">${totalValue.toLocaleString()}<img src="PvZH_Spark_Icon.webp" alt="Sparks" class="spark-icon"></span>
                <span class="collection-stat-label">Collection value</span>
            </div>
            <div class="collection-stat-card">
                <span class="collection-stat-num">${uniqueOwned}</span>
                <span class="collection-stat-label">Unique cards owned</span>
            </div>
            <div class="collection-stat-card">
                <span class="collection-stat-num">${heroesOwnedCount}/22</span>
                <span class="collection-stat-label">Heroes owned</span>
            </div>
            <div class="collection-stat-card">
                <span class="collection-stat-num">${buildable}/${total}</span>
                <span class="collection-stat-label">Curated decks you can build right now</span>
            </div>`;
    }

    function renderCollectionHeroGrid() {
        const grid = document.getElementById('collectionHeroGrid');
        if (!grid) return;

        const wantedFaction = getCollectionPageFaction();
        const heroList = wantedFaction === 'Plant' ? PLANT_HEROES : ZOMBIE_HEROES;
        const classMap = wantedFaction === 'Plant' ? PLANT_HERO_CLASSES : ZOMBIE_HERO_CLASSES;
        const ownedCount = heroList.filter(h => ownedHeroes[h]).length;

        const heroTile = (name) => {
            const owned = !!ownedHeroes[name];
            const base = heroImgBase(name);
            const classes = classMap[name] || [];
            const colorA = CLASS_COLORS[classes[0]] || '#888';
            const colorB = CLASS_COLORS[classes[1]] || '#555';
            const classLabel = classes.join(' / ');
            return `
                <button type="button" class="collection-hero-tile${owned ? ' owned' : ' not-owned'}" data-hero="${name}" title="${name} — ${classLabel}">
                    <span class="collection-hero-ring" style="background:linear-gradient(90deg, ${colorA} 50%, ${colorB} 50%);">
                        <img src="hero_images/${base}.webp" alt="${name}" loading="lazy" decoding="async"
                             onerror="this.onerror=null;this.src='hero_images/${base}.png'">
                    </span>
                    ${!owned ? '<span class="collection-hero-lock">🔒</span>' : ''}
                    <span class="collection-hero-name">${name}</span>
                    <span class="collection-hero-classes">${classLabel}</span>
                </button>`;
        };

        grid.innerHTML = `
            <div class="collection-hero-count-label">Heroes <strong>${ownedCount}/${heroList.length}</strong></div>
            <div class="collection-hero-row">${heroList.map(heroTile).join('')}</div>`;
    }

    if (document.getElementById('collectionHeroGrid')) {
        document.getElementById('collectionHeroGrid').addEventListener('click', (e) => {
            const tile = e.target.closest('.collection-hero-tile');
            if (!tile) return;
            const name = tile.dataset.hero;
            if (ownedHeroes[name]) {
                delete ownedHeroes[name];
            } else {
                ownedHeroes[name] = true;
            }
            saveOwnedHeroes();
            renderCollectionHeroGrid();
            renderCollectionPageStats();
        });
    }

    function renderCollectionPageGrid(filter = '') {
        const grid = document.getElementById('collectionPageGrid');
        if (!grid) return;
        const wantedFaction = getCollectionPageFaction();
        const q = filter.toLowerCase().trim();

        // Group cards by their class, owned copies first within each class.
        const groups = {}; // class -> { owned: [rawName...], unowned: [rawName...] }
        let totalCount = 0;

        Object.keys(cardDatabase || {}).forEach(rawName => {
            const cardInfo = cardDatabase[rawName];
            const cardClass = cardInfo?.Class;
            if (!cardClass) return;
            const cardFaction = plantClasses.has(cardClass) ? 'Plant' : 'Zombie';
            if (cardFaction !== wantedFaction) return;

            const cleanName = rawName.replace(/_/g, ' ');
            if (q && !cleanName.toLowerCase().includes(q)) return;

            totalCount++;
            if (!groups[cardClass]) groups[cardClass] = { owned: [], unowned: [] };
            const owned = ownedCollection[rawName] || 0;
            (owned > 0 ? groups[cardClass].owned : groups[cardClass].unowned).push(rawName);
        });

        const cardTile = (rawName) => {
            const cleanName = rawName.replace(/_/g, ' ');
            const owned = ownedCollection[rawName] || 0;

            return `
                <div role="button" tabindex="0" class="collection-card-tile${owned > 0 ? ' owned' : ' not-owned'}" data-name="${rawName}" title="${cleanName}${owned > 0 ? ' — owned x' + owned : ' — not owned'}">
                    ${owned > 0 ? `<button type="button" class="collection-card-clear" data-name="${rawName}" aria-label="Clear ${cleanName}" title="Set to 0">✕</button>` : ''}
                    <img src="card_images/${rawName}.png" alt="${cleanName}" loading="lazy" decoding="async"
                         onerror="this.onerror=null;this.src='card_images/${rawName}.webp'">
                    <span class="collection-card-name">${cleanName}</span>
                    <div class="collection-card-footer">
                        <span class="collection-card-owned-badge">${owned > 0 ? 'x' + owned : ''}</span>
                    </div>
                </div>`;
        };

        const classOrder = Object.keys(groups).sort((a, b) => a.localeCompare(b));

        let html = '';
        classOrder.forEach(cls => {
            const list = [...groups[cls].owned, ...groups[cls].unowned];
            if (!list.length) return;
            const color = CLASS_COLORS[cls] || '#4dd0e1';
            html += `
                <div class="collection-class-header" style="border-color:${color}">
                    <img class="collection-class-icon" src="class_icons/${cls}.webp" alt="${cls}" onerror="this.style.display='none'">
                    <span class="collection-class-name" style="color:${color}">${cls}</span>
                    <span class="collection-class-count">${groups[cls].owned.length}/${list.length}</span>
                </div>
                <div class="collection-class-grid">${list.map(cardTile).join('')}</div>`;
        });

        grid.innerHTML = html || `<div class="collection-value-empty">No cards match your search.</div>`;

        const countLabel = document.getElementById('collectionPageCardCount');
        if (countLabel) countLabel.textContent = totalCount.toLocaleString();
    }

    const collectionPageGridEl = document.getElementById('collectionPageGrid');
    if (collectionPageGridEl) {
        collectionPageGridEl.addEventListener('click', (e) => {
            const tile = e.target.closest('.collection-card-tile');
            if (!tile) return;
            const name = tile.dataset.name;
            if (e.target.closest('.collection-card-clear')) {
                // One tap straight to 0 — no need to cycle through 1-2-3-4 first.
                delete ownedCollection[name];
            } else {
                // Tap the card itself cycles 0 -> 1 -> 2 -> 3 -> 4 -> 0 owned copies.
                const current = ownedCollection[name] || 0;
                const next = (current + 1) % 5;
                if (next === 0) {
                    delete ownedCollection[name];
                } else {
                    ownedCollection[name] = next;
                }
            }
            saveOwnedCollection();
            const searchVal = document.getElementById('collectionPageSearch')?.value || '';
            renderCollectionPageGrid(searchVal);
            renderCollectionPageStats();
            // keep the slide-out panel in sync if it's open
            if (typeof renderCollectionList === 'function') renderCollectionList(collectionSearch ? collectionSearch.value : '');
            if (typeof updateDeckSparkCost === 'function') updateDeckSparkCost();
        });
    }

    const collectionPageSearchEl = document.getElementById('collectionPageSearch');
    if (collectionPageSearchEl) {
        collectionPageSearchEl.addEventListener('input', () => {
            renderCollectionPageGrid(collectionPageSearchEl.value);
        });
    }

    const collectionPageFactionEl = document.getElementById('collectionPageFaction');
    if (collectionPageFactionEl) {
        collectionPageFactionEl.addEventListener('change', () => {
            renderCollectionHeroGrid();
            renderCollectionPageGrid(collectionPageSearchEl ? collectionPageSearchEl.value : '');
        });
    }

    function renderCollectionPage() {
        seedDefaultCollection();
        renderCollectionPageStats();
        renderCollectionHeroGrid();
        renderCollectionPageGrid(collectionPageSearchEl ? collectionPageSearchEl.value : '');
    }

    function buildDeckFromCollection() {
        currentFaction = deckHeroLock
            ? deckHeroLock.faction
            : (collectionFactionSelect ? collectionFactionSelect.value : 'Plant');
        currentSeeds = [];
        lastAddedCard = null;

        const verdictCtx =
            typeof getVerdictContext === 'function'
                ? getVerdictContext()
                : undefined;

        const idealCurve = getFinishIdealCurve([], verdictCtx);

        const profiles = [
            { synergy: 0.42, power: 0.275, curve: 0.255, consistency: 0.05 },
            { synergy: 0.50, power: 0.25, curve: 0.20, consistency: 0.05 },
            { synergy: 0.36, power: 0.34, curve: 0.25, consistency: 0.05 }
        ];

        // If "Build for hero" has a hero locked in, only build for that
        // hero's two classes. Otherwise, search every class pair (plus
        // single-class decks) available to owned cards in this faction and
        // keep whichever combo actually produces the strongest deck, instead
        // of just locking onto whatever classes the first couple of greedy
        // picks happened to belong to.
        let classCombos;
        let heroName = null;
        if (deckHeroLock && deckHeroLock.faction === currentFaction) {
            classCombos = [deckHeroLock.classes];
            heroName = deckHeroLock.name;
        } else {
            const factionClasses = currentFaction === 'Plant'
                ? ["Guardian", "Kabloom", "Mega-Grow", "Smarty", "Solar"]
                : ["Beastly", "Brainy", "Crazy", "Hearty", "Sneaky"];

            classCombos = [];
            for (let i = 0; i < factionClasses.length; i++) {
                for (let j = i + 1; j < factionClasses.length; j++) {
                    classCombos.push([factionClasses[i], factionClasses[j]]);
                }
            }
        }

        let bestDeck = null;
        let bestScore = -Infinity;

        for (const combo of classCombos) {
            activeClasses = new Set(combo);

            for (const profile of profiles) {
                const completedDeck = buildFastCompletion(
                    [],
                    profile,
                    idealCurve,
                    verdictCtx,
                    false,
                    false,
                    true, // ownedOnly
                    heroName
                );

                // Skip combos that can't actually fill a real deck from the
                // owned collection so a thin, half-empty deck never wins out
                // over a full one.
                if (getFinishDeckCount(completedDeck) < 40 && classCombos.length > 1) {
                    continue;
                }

                const score = getExactFinishScore(completedDeck, verdictCtx);

                if (score > bestScore) {
                    bestScore = score;
                    bestDeck = completedDeck;
                    activeClasses = new Set(combo);
                }
            }
        }

        // Nothing hit a full 40 in any combo (very sparse collection) - fall
        // back to whichever combo got closest instead of leaving the deck empty.
        if (!bestDeck) {
            for (const combo of classCombos) {
                activeClasses = new Set(combo);
                for (const profile of profiles) {
                    const completedDeck = buildFastCompletion(
                        [],
                        profile,
                        idealCurve,
                        verdictCtx,
                        false,
                        false,
                        true,
                        heroName
                    );
                    const score = getExactFinishScore(completedDeck, verdictCtx);
                    if (score > bestScore) {
                        bestScore = score;
                        bestDeck = completedDeck;
                        activeClasses = new Set(combo);
                    }
                }
            }
        }

        if (!bestDeck) bestDeck = [];

        // If even the "closest we got" pass came up short (not enough owned,
        // playable cards for these classes to reach 40), don't just hand
        // back a half-empty deck - fill the rest with the strongest
        // available cards, same as "Finish deck for me" would, and be
        // upfront that some of it will need crafting.
        const ownedCount = getFinishDeckCount(bestDeck);
        let neededCraftTopUp = false;
        if (ownedCount < 40) {
            neededCraftTopUp = true;
            bestDeck = buildFastCompletion(
                bestDeck,
                profiles[0],
                idealCurve,
                verdictCtx,
                false,
                false,
                false, // ownedOnly off for this pass, so it can actually finish
                heroName
            );
        }

        bestDeck = polishFinishedDeck(
            bestDeck,
            new Map(), // nothing locked, everything came from the collection filter
            idealCurve,
            verdictCtx,
            false,
            false,
            { maxMilliseconds: 350, maxEvaluations: 140, maxPasses: 2 },
            true // ownedOnly
        );

        currentSeeds = bestDeck;
        deckBuiltFromCollection = true;

        if (collectionPanel) collectionPanel.classList.add('hidden');
        renderSeeds();

        if (neededCraftTopUp) {
            const finalCount = getFinishDeckCount(bestDeck);
            const message = ownedCount > 0
                ? `Your collection only had ${ownedCount} playable card${ownedCount === 1 ? '' : 's'} for this hero, so I filled the remaining ${finalCount - ownedCount} slots with the strongest cards available — you'll need to craft those.`
                : `Your collection didn't have enough playable cards for this hero, so this deck is built from the strongest cards available — you'll need to craft most of it.`;
            if (typeof daveSay === 'function') {
                daveSay(message);
            } else {
                console.warn(message);
            }
        }
    }

    const getTotalCards = () => currentSeeds.reduce((sum, seed) => {
        const type = String(cardDatabase?.[seed.name]?.Type || '').toLowerCase();
        if (type.includes('superpower')) return sum;
        return sum + seed.count;
    }, 0);


    // --- 1. Smart Autocomplete ---
    seedInput.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        suggestionsBox.innerHTML = '';

        if (getTotalCards() >= 40) {
            suggestionsBox.innerHTML = '<li style="color: #ff7b72; justify-content: center;">Deck is full! (40 cards)</li>';
            suggestionsBox.style.display = 'block';
            return;
        }

        if (query.length < 2) {
            suggestionsBox.style.display = 'none';
            return;
        }

        let matches = 0;
        Object.keys(cardDatabase).forEach(rawName => {
            if (matches >= 15) return;

            const cleanName = rawName.replace(/_/g, ' ');
            if (cleanName.toLowerCase().includes(query)) {
                const cardInfo = cardDatabase[rawName];
                const cardType = String(cardInfo.Type || '').toLowerCase();
                if (cardType.includes('superpower')) return;
                const cardClass = cardInfo.Class;
                const cardFaction = plantClasses.has(cardClass) ? "Plant" : "Zombie";

                if (currentFaction !== null && currentFaction !== cardFaction) return;
                if (!activeClasses.has(cardClass) && activeClasses.size >= 2) return;

                const existing = currentSeeds.find(s => s.name === rawName);
                if (existing && existing.count >= 4) return;

                const li = document.createElement('li');
                li.innerHTML = `<span>${cleanName}</span> <span class="suggestion-class">${cardClass}</span>`;
                // Add via autocomplete defaults to 4 copies
                li.onclick = () => addSeed(rawName, cardClass, cardFaction, 4);
                suggestionsBox.appendChild(li);
                matches++;
            }
        });

        suggestionsBox.style.display = matches > 0 ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
        if (e.target !== seedInput && e.target !== suggestionsBox) {
            suggestionsBox.style.display = 'none';
        }
    });

    function addSeed(rawName, cardClass, cardFaction, requestedAmount = 4) {
        deckBuiltFromCollection = false;
        const spaceLeft = 40 - getTotalCards();
        if (spaceLeft <= 0) return;

        const existing = currentSeeds.find(s => s.name === rawName);
        const currentCount = existing ? existing.count : 0;
        const roomForThisCard = 4 - currentCount;

        // Automatically calculate how many we can actually add
        let amountToAdd = Math.min(requestedAmount, spaceLeft, roomForThisCard);
        if (amountToAdd <= 0) return;

        if (existing) {
            existing.count += amountToAdd;
        } else {
            currentSeeds.push({
                name: rawName,
                count: amountToAdd,
                class: cardClass,
                faction: cardFaction,
                cost: cardDatabase[rawName].Cost
            });
        }

        lastAddedCard = rawName; // Update AI memory
        currentFaction = cardFaction;
        activeClasses.add(cardClass);

        seedInput.value = '';
        suggestionsBox.style.display = 'none';
        renderSeeds();
    }

    // --- 2. Unified Visual Rendering ---
    function renderSeeds() {
        const resultsContainer = document.getElementById('generatedDeckList');
        const tracker = document.getElementById('cardCountTracker');
        const title = document.getElementById('generatedDeckTitle');
        const actionContainer = document.getElementById('deckActionContainer');
        const clearSeedsBtn = document.getElementById('clearSeedsBtn');
        const totalCards = getTotalCards();
        const isDeckComplete = totalCards === 40;
        syncDeckIdentityFromSeeds();

        // A hero picked from "Build for hero" stays locked in even before any
        // cards are added, so Finish-For-Me knows which two classes to use.
        if (deckHeroLock && activeClasses.size === 0) {
            currentFaction = deckHeroLock.faction;
            activeClasses = new Set(deckHeroLock.classes);
        }

        resultsContainer.innerHTML = '';
        resultsContainer.className = 'visual-deck-grid';

        if (tracker) tracker.innerText = `${totalCards}/40`;
        if (clearSeedsBtn) {
    clearSeedsBtn.disabled = totalCards === 0;
}
        if (actionContainer) {
    actionContainer.classList.toggle('hidden', !isDeckComplete);
    actionContainer.style.display = isDeckComplete ? 'flex' : 'none';
}

        if (currentSeeds.length === 0) {
            manualDeckName = "";
            resultsContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">No cards added yet. Search above to begin!</div>';
            generateDeckBtn.disabled = !deckHeroLock;
            if (title) title.classList.add('hidden');
            if (actionContainer) actionContainer.style.display = 'none';
            if (!deckHeroLock) {
                currentFaction = null;
                activeClasses.clear();
            }
            lastAddedCard = null;
            triggerAICoPilot();
            if (typeof updateDeckSparkCost === 'function') updateDeckSparkCost();
            return;
        }

        generateDeckBtn.disabled = totalCards >= 40;

        if (totalCards >= 40) {
            const classArray = Array.from(activeClasses).sort();
            let heroName = "";
            let heroesData = [];

            // Handle single vs multiple classes
            if (classArray.length === 1) {
                const singleClass = classArray[0];
                heroName = `Any ${singleClass} Hero`; // Used for clipboard
                heroesData = [{
                    name: singleClass, // Used for the label under the avatar
                    imgFilename: `${singleClass.toLowerCase().replace(/[\s-]+/g, '_')}.webp`
                }];
            } else {
                heroName = heroMap[classArray.join(',')] || `Any ${classArray.join(' / ')} Hero`;
                heroesData = heroName.split(/\s*\/\s*/).map(name => ({
                    name: name,
                    imgFilename: `${name.replace(/[\s-]+/g, '_')}.webp`
                }));
            }

            const autoDeckName = getAutoDeckName();
            const deckName = getCurrentDeckName();

            if (title) {
    title.classList.remove('hidden');

    const heroAvatarsHtml = heroesData.slice(0, 3).map((hero, i) => {
        const base = hero.imgFilename.replace(/\.(webp|png)$/i, '');

        return `
            <img 
                src="hero_images/${base}.webp" 
                onerror="this.onerror=null; this.src='hero_images/${base}.png';"
                alt="${hero.name}" 
                class="export-header-avatar"
                style="left: ${i * 34}px;"
            >
        `;
    }).join('');

    title.innerHTML = `
        <div class="export-style-header">
            <div class="export-header-avatars ${heroesData.length > 1 ? 'multi' : ''}">
                ${heroAvatarsHtml}
            </div>

            <div class="export-header-text">
                <input 
                    id="manualDeckNameInput"
                    class="export-deck-name-input"
                    type="text"
                    maxlength="${DECK_NAME_MAX_CHARS}"
                    placeholder="${escapeHtml(autoDeckName)}"
                    value="${manualDeckName ? escapeHtml(manualDeckName) : ''}"
                    aria-label="Deck name"
                >

                <div class="export-hero-name">
                    ${escapeHtml(heroName)}
                </div>
            </div>
        </div>
    `;

    const deckNameInput = document.getElementById("manualDeckNameInput");

    if (deckNameInput) {
        deckNameInput.addEventListener("input", () => {
            manualDeckName = sanitizeDeckName(deckNameInput.value);

            currentClipboardText = `Deck: ${getCurrentDeckName()}\nHero: ${heroName}\n\n`;

            const sortedSeeds = [...currentSeeds].sort((a, b) => {
                const costA = cardDatabase[a.name]?.Cost || 0;
                const costB = cardDatabase[b.name]?.Cost || 0;
                if (costA !== costB) return costA - costB;
                return a.name.localeCompare(b.name);
            });

            sortedSeeds.forEach(seed => {
                currentClipboardText += `${seed.count}x ${seed.name.replace(/_/g, ' ')}\n`;
            });
        });
    }
}

            currentClipboardText = `Deck: ${deckName}\nHero: ${heroName}\n\n`;
            if (actionContainer) {
                actionContainer.classList.remove('hidden');
                actionContainer.style.display = 'flex';
            }
        } else {
            if (title) title.classList.add('hidden');
            if (actionContainer) actionContainer.style.display = 'none';
        }

        let displaySeeds = [...currentSeeds].sort((a, b) => {
            const costA = cardDatabase[a.name]?.Cost || 0;
            const costB = cardDatabase[b.name]?.Cost || 0;
            if (costA !== costB) return costA - costB;
            return a.name.localeCompare(b.name);
        });

        displaySeeds.forEach((seed, index) => {
            const displayName = seed.name.replace(/_/g, ' ');
            const dbName = displayName.replace(/ /g, '_');
            const disablePlus = seed.count >= 4 || totalCards >= 40;

            const cardDiv = document.createElement('div');
            // 2. ADD THE ANIMATION CLASS AND DYNAMIC DELAY
            cardDiv.className = 'visual-card pop-animate';
            cardDiv.style.animationDelay = `${index * 35}ms`;

            const img = document.createElement('img');
            img.src = `card_images/${dbName}.png`;
            img.alt = displayName;
            img.title = displayName;
            img.onerror = function () { this.onerror = null; this.src = `card_images/${dbName}.webp`; };

            const badge = document.createElement('div');
            badge.className = 'card-quantity';
            badge.textContent = `x${seed.count}`;

            const controls = document.createElement('div');
            controls.className = 'visual-card-controls';
           controls.innerHTML = `
    <button
        type="button"
        class="seed-btn minus-btn"
        data-name="${seed.name}"
        aria-label="Remove one ${displayName}"
        title="Remove one"
    >−</button>

    <button
        type="button"
        class="seed-btn swap-btn"
        data-name="${seed.name}"
        aria-label="Swap ${displayName}"
        title="Swap card"
    >Swap</button>

    <button
        type="button"
        class="seed-btn plus-btn"
        data-name="${seed.name}"
        aria-label="Add one ${displayName}"
        title="Add one"
        ${disablePlus ? 'disabled' : ''}
    >+</button>
`;

            const artWrap = document.createElement('div');
artWrap.className = 'visual-card-art';

artWrap.appendChild(img);
artWrap.appendChild(badge);

cardDiv.appendChild(artWrap);
cardDiv.appendChild(controls);
resultsContainer.appendChild(cardDiv);

            cardDiv.addEventListener('click', () => {
                const isOpen = cardDiv.classList.contains('show-controls');
                document.querySelectorAll('.visual-card.show-controls').forEach(el => el.classList.remove('show-controls'));
                if (!isOpen) cardDiv.classList.add('show-controls');
            });

            controls.addEventListener('click', e => {
                e.stopPropagation();
            });

            if (totalCards >= 40) {
                currentClipboardText += `${seed.count}x ${displayName}\n`;
            }
        });

        attachQuantityListeners();
        triggerAICoPilot();
        updateDeckStats();
        if (typeof updateDeckSparkCost === 'function') updateDeckSparkCost();
    }
    const PLANT_CARD_CLASSES = new Set([
    "Guardian",
    "Kabloom",
    "Mega-Grow",
    "Smarty",
    "Solar"
]);

const ZOMBIE_CARD_CLASSES = new Set([
    "Beastly",
    "Brainy",
    "Crazy",
    "Hearty",
    "Sneaky"
]);

function syncDeckIdentityFromSeeds() {
    activeClasses.clear();

    let detectedFaction = null;

    for (const seed of currentSeeds) {
        const card = cardDatabase[seed.name];
        const cardClass = card?.Class;

        if (!cardClass) {
            console.warn(
                `Could not determine class for ${seed.name}`
            );
            continue;
        }

        activeClasses.add(cardClass);

        let cardFaction = null;

        if (PLANT_CARD_CLASSES.has(cardClass)) {
            cardFaction = "Plant";
        } else if (ZOMBIE_CARD_CLASSES.has(cardClass)) {
            cardFaction = "Zombie";
        }

        if (!cardFaction) {
            console.warn(
                `Could not determine faction for ${seed.name} (${cardClass})`
            );
            continue;
        }

        if (
            detectedFaction &&
            detectedFaction !== cardFaction
        ) {
            console.warn(
                "Deck unexpectedly contains both Plant and Zombie cards."
            );
        }

        detectedFaction = cardFaction;
    }

    currentFaction = detectedFaction;

    console.log("Deck state synchronized:", {
        currentFaction,
        activeClasses: Array.from(activeClasses)
    });
}
    function initializeDeckImageUpload() {
    const uploadButton = document.getElementById(
        "deckImageUploadBtn"
    );

    const fileInput = document.getElementById(
        "deckImageInput"
    );

    const API_URL =
        "https://pvzh-deck-api.onrender.com/api/recognize-deck";

    if (!uploadButton || !fileInput) {
        console.error(
            "Deck image upload elements could not be found."
        );

        return;
    }

    const errorBanner = document.getElementById("deckImageUploadError");
    let errorHideTimer = null;

    function showUploadError(message) {
        console.error("Deck recognition failed:", message);
        if (!errorBanner) return;
        errorBanner.textContent = message;
        errorBanner.classList.remove("hidden");
        clearTimeout(errorHideTimer);
        errorHideTimer = setTimeout(() => {
            errorBanner.classList.add("hidden");
        }, 10000);
    }

    function clearUploadError() {
        if (!errorBanner) return;
        clearTimeout(errorHideTimer);
        errorBanner.classList.add("hidden");
    }

    let recognitionInProgress = false;

    function setUploadLoading(isLoading) {
        recognitionInProgress = isLoading;
        uploadButton.disabled = isLoading;

        uploadButton.classList.toggle(
            "is-loading",
            isLoading
        );

        uploadButton.setAttribute(
            "aria-busy",
            String(isLoading)
        );

        uploadButton.setAttribute(
            "aria-label",
            isLoading
                ? "Recognizing deck image"
                : "Upload deck image"
        );

        uploadButton.title = isLoading
            ? "Recognizing deck..."
            : "Upload deck image";
    }

    uploadButton.addEventListener(
        "click",
        () => {
            if (recognitionInProgress) {
                return;
            }

            /*
             * Resetting this allows the user to select
             * the same image again.
             */
            fileInput.value = "";
            fileInput.click();
        }
    );

    fileInput.addEventListener(
        "change",
        async () => {
            const file =
                fileInput.files?.[0];

            if (!file) {
                return;
            }

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {
                console.error(
                    "Please choose an image file."
                );

                fileInput.value = "";
                return;
            }

            const maximumFileSize =
                15 * 1024 * 1024;

            if (
                file.size >
                maximumFileSize
            ) {
                console.error(
                    "The selected image is larger than 15 MB."
                );

                fileInput.value = "";
                return;
            }

            const formData =
                new FormData();

            /*
             * This field name must match:
             * upload.single("deckImage")
             * in server.js.
             */
            formData.append(
                "deckImage",
                file,
                file.name
            );

            setUploadLoading(true);
            clearUploadError();

            console.log(
                "Uploading deck image and running recognition..."
            );

            // Free-tier Render services spin down after inactivity and can
            // take 30-60s to wake back up on the first request. Give it a
            // generous window, but don't let it hang forever with no
            // feedback.
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                60000
            );

            try {
                const response = await fetch(
                    API_URL,
                    {
                        method: "POST",
                        body: formData,
                        signal: controller.signal,
                    }
                );

                const responseText =
                    await response.text();

                let result;

                try {
                    result =
                        JSON.parse(
                            responseText
                        );
                } catch {
                    throw new Error(
                        "The recognition server returned an invalid response."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        result.error ||
                        `Recognition failed with status ${response.status}.`
                    );
                }

                setDeckFromRecognition(result);
            } catch (error) {
                if (error.name === "AbortError") {
                    showUploadError(
                        "The recognition server didn't respond in time. It may be waking up from sleep (free hosting) - try again in a moment."
                    );
                } else if (error instanceof TypeError) {
                    // fetch() throws a bare TypeError for network failures
                    // and CORS blocks alike, with no further detail exposed
                    // to JS.
                    showUploadError(
                        "Couldn't reach the recognition server. It may be offline, or blocking requests from this page (CORS)."
                    );
                } else {
                    showUploadError(
                        error.message || "Deck recognition failed for an unknown reason."
                    );
                }
            } finally {
                clearTimeout(timeoutId);
                setUploadLoading(false);
                fileInput.value = "";
            }
        }
    );
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeDeckImageUpload
    );
} else {
    initializeDeckImageUpload();
}
    function setDeckFromRecognition(result) {
    if (!result || !Array.isArray(result.cards)) {
        throw new Error(
            "The recognition result does not contain a card list."
        );
    }

    function resolveCardId(recognizedCard) {
        const possibleIds = [
            recognizedCard.cardId,
            recognizedCard.name,
            String(recognizedCard.name || "")
                .trim()
                .replace(/\s+/g, "_"),
        ].filter(Boolean);

        for (const possibleId of possibleIds) {
            if (cardDatabase[possibleId]) {
                return possibleId;
            }
        }

        /*
         * Last-resort normalized lookup in case capitalization,
         * spaces, punctuation, or underscores differ.
         */
        const normalizedTarget = String(
            recognizedCard.cardId ||
            recognizedCard.name ||
            ""
        )
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

        return (
            Object.keys(cardDatabase).find(cardId => {
                const normalizedCardId = cardId
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "");

                const normalizedDatabaseName = String(
                    cardDatabase[cardId]?.Name || ""
                )
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "");

                return (
                    normalizedCardId === normalizedTarget ||
                    normalizedDatabaseName === normalizedTarget
                );
            }) || null
        );
    }

    const recognizedCardsById = new Map();
    const missingCards = [];

    for (const recognizedCard of result.cards) {
        const cardId = resolveCardId(recognizedCard);
        const copies = Number(recognizedCard.copies);

        if (!cardId) {
            missingCards.push(
                recognizedCard.name ||
                recognizedCard.cardId ||
                "Unknown card"
            );

            continue;
        }

        if (
            !Number.isInteger(copies) ||
            copies < 1 ||
            copies > 4
        ) {
            throw new Error(
                `Invalid copy count for ${cardId}: ${recognizedCard.copies}`
            );
        }

        recognizedCardsById.set(
            cardId,
            (recognizedCardsById.get(cardId) || 0) +
            copies
        );
    }

    if (missingCards.length > 0) {
        throw new Error(
            `These recognized cards were not found in cardDatabase: ${missingCards.join(
                ", "
            )}`
        );
    }

    const recognizedSeeds = Array.from(
    recognizedCardsById,
    ([name, count]) => ({
        name,
        count,
        class:
            cardDatabase[name]?.Class ||
            null
    })
);

    const totalCards = recognizedSeeds.reduce(
        (total, seed) => total + seed.count,
        0
    );

    if (totalCards !== 40) {
        throw new Error(
            `The recognized deck contains ${totalCards} cards instead of 40.`
        );
    }

    const invalidCard = recognizedSeeds.find(
        seed => seed.count > 4
    );

    if (invalidCard) {
        throw new Error(
            `${invalidCard.name} was recognized with ${invalidCard.count} copies.`
        );
    }

    /*
     * Mutate the existing array instead of reassigning it.
     * This works whether currentSeeds was declared with let or const.
     */
    currentSeeds.splice(
        0,
        currentSeeds.length,
        ...recognizedSeeds
    );

    manualDeckName = sanitizeDeckName(
        result.deckName || ""
    );

    lastAddedCard = null;

    renderSeeds();

    const reviewCards = result.cards.filter(
        card => card.needsReview
    );

    if (reviewCards.length > 0) {
        console.warn(
            "Deck loaded, but these cards were marked for review:",
            reviewCards.map(card => ({
                card:
                    card.name ||
                    card.cardId,
                score:
                    card.matchScore,
                alternatives:
                    card.alternatives,
            }))
        );
    }

    console.log(
        `Loaded recognized deck "${result.deckName || "Unnamed Deck"}" with ${totalCards} cards.`
    );
}

    function attachQuantityListeners() {
        document.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.target.getAttribute('data-name');
                const seed = currentSeeds.find(s => s.name === name);
                if (seed) {
                    deckBuiltFromCollection = false;
                    seed.count--;
                    if (seed.count <= 0) {
                        currentSeeds = currentSeeds.filter(s => s.name !== name);
                        activeClasses.clear();
                        currentSeeds.forEach(s => activeClasses.add(s.class));
                        if (lastAddedCard === name) lastAddedCard = null;
                        if (activeClasses.size < 2) heroAnnounced = false;
                    }
                    renderSeeds();
                }
            });
        });

        document.querySelectorAll('.plus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.target.getAttribute('data-name');
                const seed = currentSeeds.find(s => s.name === name);
                if (seed && seed.count < 4 && getTotalCards() < 40) {
                    deckBuiltFromCollection = false;
                    seed.count++;
                    lastAddedCard = name; // Update context to the card they modified
                    renderSeeds();
                }
            });
        });
        document.querySelectorAll('.swap-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.target.getAttribute('data-name');
                showSwapSuggestions(name);
            });
        });
    }

    if (clearSeedsBtn) {
        clearSeedsBtn.addEventListener('click', () => {
            currentSeeds = [];
            currentFaction = null;
            activeClasses.clear();
            deckHeroLock = null;
            const deckHeroSelectEl = document.getElementById('deckHeroSelect');
            if (deckHeroSelectEl) deckHeroSelectEl.value = '';
            lastAddedCard = null;
            heroAnnounced = false;
            seedInput.value = '';
            renderSeeds();
            if (typeof updateDeckStats === 'function') updateDeckStats();
        });
    }

    // --- Build for a specific hero: locks the deck to that hero's 2 classes ---
    const deckHeroSelect = document.getElementById('deckHeroSelect');
    if (deckHeroSelect && !deckHeroSelect.dataset.populated) {
        deckHeroSelect.dataset.populated = '1';

        const plantGroup = document.createElement('optgroup');
        plantGroup.label = 'Plants';
        PLANT_HEROES.forEach(h => plantGroup.appendChild(new Option(h, h)));

        const zombieGroup = document.createElement('optgroup');
        zombieGroup.label = 'Zombies';
        ZOMBIE_HEROES.forEach(h => zombieGroup.appendChild(new Option(h, h)));

        deckHeroSelect.appendChild(plantGroup);
        deckHeroSelect.appendChild(zombieGroup);

        deckHeroSelect.addEventListener('change', () => {
            const heroName = deckHeroSelect.value;

            if (!heroName) {
                deckHeroLock = null;
            } else {
                const isPlant = PLANT_HEROES.includes(heroName);
                const classes = isPlant ? PLANT_HERO_CLASSES[heroName] : ZOMBIE_HERO_CLASSES[heroName];
                deckHeroLock = {
                    name: heroName,
                    faction: isPlant ? 'Plant' : 'Zombie',
                    classes: classes || []
                };
            }

            // Starting a fresh hero means starting a fresh deck — the old
            // cards may belong to different classes entirely.
            currentSeeds = [];
            lastAddedCard = null;
            heroAnnounced = false;
            seedInput.value = '';
            renderSeeds();
            if (typeof updateDeckStats === 'function') updateDeckStats();
        });
    }

    // --- Sparks needed to build the current deck, with/without owned copies ---
    function updateDeckSparkCost() {
        const row = document.getElementById('deckSparkCostRow');
        const valueEl = document.getElementById('deckSparkCostValue');
        const labelEl = document.getElementById('deckSparkCostLabel');
        if (!row || !valueEl) return;

        if (!currentSeeds.length) {
            row.style.display = 'none';
            return;
        }
        row.style.display = '';

        const includeToggle = document.getElementById('deckSparkIncludeOwned');
        const useCollection = includeToggle ? includeToggle.checked : true;

        let total = 0;
        currentSeeds.forEach(seed => {
            const each = typeof sparkCostFor === 'function' ? sparkCostFor(seed.name) : 0;
            const owned = useCollection ? (ownedCollection[seed.name] || 0) : 0;
            const missing = Math.max(0, seed.count - owned);
            total += each * missing;
        });

        valueEl.textContent = total.toLocaleString();
        if (labelEl) labelEl.textContent = useCollection ? 'Sparks to complete' : 'Sparks to build';
    }

    const deckSparkIncludeOwned = document.getElementById('deckSparkIncludeOwned');
    if (deckSparkIncludeOwned) {
        deckSparkIncludeOwned.addEventListener('change', updateDeckSparkCost);
    }

    // --- SPECIFIC COMBO CALLOUTS ---
    const comboDictionary = [
        {
            // Pogo + MUG
            cards: ["Pogo_Zombie", "Mixed-Up_Gravedigger"],
            message: "**Pogo Zombie** clears a lane, and **Mixed-Up Gravedigger** resets him into a gravestone to do it all over again. Brutal!"
        },
        {
            // Pineclone + Swarm
            cards: ["Pineclone", "Shroom_For_Two"],
            message: "**Shroom for Two** gives you two bodies for 1 sun, perfectly setting up a massive board-wide **Pineclone** transformation."
        },
        {
            // Valkyrie + Mustache Monument
            cards: ["Valkyrie", "Mustache_Monument"],
            message: "Grow her massive in your hand, then drop her on the **Mustache Monument** for a devastating bonus attack."
        },
        {
            // Hearty Coach + Sports
            cards: ["Zombie_Coach", "Team_Mascot"],
            message: "**Team Mascot** buffs your team, and **Zombie Coach** makes them completely invincible. Unstoppable!"
        },
        {
            // Barrel + Mission
            cards: ["Barrel_Of_Deadbeards", "Final_Mission"],
            message: "**Final Mission** destroys your **Barrel of Deadbeards** to deal 4 damage, which triggers the Barrel to wipe out 1-health plants and spawn a 4/3 pirate. Pure value!"
        },
        {
            // Buddy + Pepper
            cards: ["Li'l_Buddy", "Pepper_M.D."],
            message: "A 0-cost **Lil Buddy** instantly heals you, immediately triggering **Pepper M.D.**'s ability to give it a massive growth spurt on the exact same turn!"
        },
        {
            // ANB + Jelly
            cards: ["Admiral_Navy_Bean", "Jelly_Bean"],
            message: "**Admiral Navy Bean** continuously chips away at the Zombie Hero, and makes the perfect Bean evolution target for **Jelly Bean** to bounce massive threats away!"
        },
        {
            // Photosynthesizer + Tricarrotops
            cards: ["Photosynthesizer", "Tricarrotops"],
            message: "**Photosynthesizer** beefs up your **Tricarrotops**'s health, and the card it conjures instantly triggers its Dino-Roar! A massive dino for super cheap."
        },
        {
            // Spinach + Beanstalk
            cards: ["Savage_Spinach", "Typical_Beanstalk"],
            message: "Evolving **Savage Spinach** off your Leafy **Typical Beanstalk** gives every Plant in your hand a massive +2/+2 boost."
        },
        {
            // Imp-Throwing + Toxic
            cards: ["Imp_Throwing_Imp", "Toxic_Waste_Imp"],
            message: "**Toxic Waste Imp** gives all Imps Deadly, turning the tiny Swabbies thrown by your **Imp-Throwing Imp** into lethal, guaranteed removal tools!"
        },
        {
            // Commander + Imp-Throwing
            cards: ["Imp_Commander", "Imp_Throwing_Imp"],
            message: "When **Imp-Throwing Imp** tosses buddies into empty water lanes, **Imp Commander** ensures they draw you cards every time they hit the hero. Incredible draw engine!"
        },
        {
            // Pea Patch + Spinach
            cards: ["Pea_Patch", "Savage_Spinach"],
            message: "**Pea Patch** is the perfect Leafy target for **Savage Spinach**. Your hand gets the +2/+2 evolution buff, and the Spinach itself gets the Pea Patch stats!"
        },
        {
            // Flag + Manager
            cards: ["Flag_Zombie", "Middle_Manager"],
            message: "**Flag Zombie** makes your swarms cheap, and since he's a Professional, he permanently buffs your **Middle Manager** whenever he takes a hit. Synergistic synergy!"
        },
        {
            // Heartichoke + Flytraplanet
            cards: ["Heartichoke", "Venus_Flytraplanet"],
            message: "When **Heartichoke** damages the Zombie Hero on a **Venus Flytraplanet**, it heals you. That heal triggers the Heartichoke to deal damage again, creating an endless cycle of healing and pain!"
        },
        {
            // Snowdrop + Winter Squash
            cards: ["Snowdrop", "Winter_Squash"],
            message: "**Winter Squash** instantly shatters any Zombie that gets frozen, while **Snowdrop** simultaneously absorbs that freeze to gain a massive +2/+2. Cold and calculated!"
        },
        {
            // Goat + Hover-Goat
            cards: ["Goat", "Hover-Goat_3000"],
            message: "**Hover-Goat_3000** gives your regular **Goat** a beefy +2/+2 stats boost, and whenever a Goat takes damage, it just keeps growing stronger!"
        },
        {
            // Fig (Transfiguration) + Imitater
            cards: ["Fig", "Imitater"], // Change "Transfiguration" to "Fig" if that's how it is named in your cardDatabase!
            message: "Playing **Transfiguration** into an **Imitater** gives you TWO massive bodies that will both mutate into more expensive, game-ending threats at the end of the turn!"
        },
        {
            // CycleCap
            cards: ["Astro_Shroom", "Planet_of_the_Grapes"],
            message: "**Astro-Shroom** deals damage when you play a plant, triggering **Planet of the Grapes** to draw a card, which lets you play MORE plants!"
        },
        {
            // Con Man + Regifter
            cards: ["Quickdraw_Con_Man", "Regifting_Zombie"],
            message: "**Regifting Zombie** forces both players to draw cards, instantly triggering **Quickdraw Con Man**'s ability to burn the Plant Hero's health. Aggressive draw!"
        },
        {
            // Teacher + Going Viral
            cards: ["Teacher", "Going_Viral"],
            message: "**Zombology Teacher** reduces the cost of tricks, making **Going Viral** incredibly cheap to play and shuffle, easily swarming the board with Frenzy-fueled zombies."
        },
        {
            // Three-Nut + Garlic
            cards: ["Three-Nut", "Garlic"],
            message: "**Three-Nut** instantly sets any plant's attack to 3. Combine this with the massive 5-health of a 1-cost **Garlic** to create an aggressively cheap and beefy front line."
        },
        {
            // Onion Rings + Lil Buddy
            cards: ["Onion_Rings", "Li'l_Buddy"],
            message: "**Onion Rings** turns every plant in your hand into a 4/4. Suddenly, your free **Lil Buddy** becomes a 0-cost 4/4 that still heals you. Insane value!"
        },
        {
            // Cob Cannon + Lil Buddy
            cards: ["Cob_Cannon", "Li'l_Buddy"],
            message: "Need instant removal? Drop a 0-cost **Lil Buddy**, then immediately evolve your **Cob Cannon** on it to destroy a Zombie and leave behind a 4/6 body."
        },
        {
            // Warlord + MUG
            cards: ["Intergalactic_Warlord", "Mixed-Up_Gravedigger"],
            message: "**Intergalactic Warlord** buffs your entire board permanently. Use **Mixed-Up Gravedigger** to hide him, and when he pops back out, he triggers his massive team-buff all over again!"
        },
        {
            // Briar Rose + Poppin' Poppies
            cards: ["Briar_Rose", "Poppin'_Poppies"],
            message: "**Poppin' Poppies** floods the board with 1-health Lil' Buddies. With **Briar Rose** on the field, every single one of those tiny flowers becomes a lethal, zombie-destroying trap!"
        },
        {
            // GTI + Fireworks
            cards: ["Gargantuar-Throwing_Imp", "Fireworks_Zombie"],
            message: "**Fireworks Zombie** deals 1 damage to everything, which instantly pokes your **Gargantuar-Throwing Imp** and causes him to immediately throw a massive Gargantuar onto the board!"
        },
        {
            // Dr. Spacetime + Buried Treasure
            cards: ["Dr._Spacetime", "Buried_Treasure"],
            message: "Play **Buried Treasure** with **Dr. Spacetime** on the board. The Treasure conjures a Legendary, and Spacetime makes it cheaper. You're swimming in discounted, high-tier cards!"
        },
        {
            // Galacta-Cactus + Pear Cub
            cards: ["Galacta-Cactus", "Pear_Cub"],
            message: "When **Galacta-Cactus** gets destroyed, its 1-damage explosion is the perfect trigger to crack open your **Pear Cub** and unleash the massive Grizzly Pear inside."
        },
        {
    // Pair Pearadise + Molekale
    cards: ["Pair_Pearadise", "Molekale"],
    message: "Play **Molekale** on **Pair Pearadise** and the copied Molekale transforms your board a second time. Most of your Plants jump two entire cost levels at once!"
},
{
    // Medulla Nebula + Brain Vendor
    cards: ["Medulla_Nebula", "Brain_Vendor"],
    message: "Playing **Brain Vendor** inside **Medulla Nebula** refunds its entire cost and produces two extra Brains, opening the door to huge plays far earlier than normal."
},
{
    // Brain Vendor + Zom-Blob
    cards: ["Brain_Vendor", "Zom-Blob"],
    message: "**Brain Vendor** generates three Brains, then becomes the perfect Evolution target for **Zom-Blob**, converting that burst of resources into a massive attacker."
},
{
    // Pecanolith + Wall-Nut
    cards: ["Pecanolith", "Wall-Nut"],
    message: "**Pecanolith** makes Plants attack using their Health, transforming your 1-cost **Wall-Nut** into an absurd 6/6 attacker with Team-Up."
},
{
    // Mirror-Nut + Wall-Nut
    cards: ["Mirror-Nut", "Wall-Nut"],
    message: "**Wall-Nut** absorbs hit after hit, while **Mirror-Nut** punishes every bit of damage by firing it back at the Zombie Hero."
},
{
    // Secret Agent + Goat
    cards: ["Secret_Agent", "Goat"],
    message: "**Secret Agent** returns your free **Goat** to your hand with +3/+3, letting you immediately replay it as a 0-cost 4/4. An outrageous turn-one power play!"
},
{
    // Sergeant Strongberry + Electric Blueberry
    cards: ["Sergeant_Strongberry", "Electric_Blueberry"],
    message: "**Electric Blueberry** strikes a random target for 6 damage, and **Sergeant Strongberry** follows it with another 2. That is 8 surprise damage from a single lightning bolt!"
},
{
    // Health-Nut + Photosynthesizer
    cards: ["Health-Nut", "Photosynthesizer"],
    message: "**Health-Nut** attacks using its Health, so **Photosynthesizer** effectively gives it +2/+2 while also conjuring another card."
},
{
    // Pear Cub + Hot Lava
    cards: ["Pear_Cub", "Hot_Lava"],
    message: "**Hot Lava** immediately cracks open your **Pear Cub** before combat, replacing the tiny Cub with a massive Grizzly Pear right away."
},
{
    // Mustache Waxer + Duckstache
    cards: ["Mustache_Waxer", "Duckstache"],
    message: "Playing **Duckstache** grows **Mustache Waxer** and refunds a Brain. Every Mustache Duckstache later conjures keeps feeding that engine!"
},
{
    // Barrel + Fireworks
    cards: ["Barrel_Of_Deadbeards", "Fireworks_Zombie"],
    message: "**Fireworks Zombie** immediately destroys your **Barrel of Deadbeards**, triggering its board-wide explosion and leaving a powerful Captain Deadbeard behind."
},
{
    // Pair Pearadise + Astro Vera
    cards: ["Pair_Pearadise", "Astro_Vera"],
    message: "Playing **Astro Vera** on **Pair Pearadise** creates two copies, increasing your maximum Health by 20 and healing you for 20 in one enormous swing."
}
    ];
    function parseCardList(cardList) {
        const map = {};
        (cardList || []).forEach(entry => {
            const firstSpace = entry.indexOf(' ');
            const countStr = entry.substring(0, firstSpace).replace(/x/i, '');
            const count = parseInt(countStr) || 1;
            const cardName = entry.substring(firstSpace + 1).trim();
            map[cardName] = (map[cardName] || 0) + count;
        });
        return map;
    }

    function getClosestDeckMatch() {
        if (!fullDatabase) return null;

        const currentMap = {};
        currentSeeds.forEach(seed => {
            currentMap[seed.name] = seed.count;
        });

        let bestDeck = null;
        let bestScore = -1;

        Object.values(fullDatabase).forEach(deck => {
            const deckMap = parseCardList(deck.cards);

            let overlap = 0;
            for (const cardName in currentMap) {
                overlap += Math.min(currentMap[cardName] || 0, deckMap[cardName] || 0);
            }

            if (overlap > bestScore) {
                bestScore = overlap;
                bestDeck = deck;
            }
        });

        return bestDeck;
    }
    function getVerdictGrade(overallPercent, allTopTier, totalCards) {
        let grade, gradeColor;

        if (totalCards <= 8) {
            grade = "—";
            gradeColor = "rgba(255,255,255,0.3)";
        } else if (overallPercent >= 95) {
            grade = "S";
            gradeColor = "#00E5FF";
        } else if (overallPercent >= 85) {
            grade = "A";
            gradeColor = "#4CAF50";
        } else if (overallPercent >= 75) {
            grade = "B";
            gradeColor = "#8BC34A";
        } else if (overallPercent >= 65) {
            grade = "C";
            gradeColor = "#ffb300";
        } else if (overallPercent >= 40) {
            grade = "D";
            gradeColor = "#ff8800";
        } else {
            grade = "F";
            gradeColor = "#ff4b4b";
        }

        return { grade, gradeColor };
    }
    // --- LIVE DECK ANALYTICS ENGINE ---

    
    window.addEventListener('DOMContentLoaded', () => {
        const deckCode = new URLSearchParams(window.location.search).get('deck');
        const isCrafterHash = window.location.hash === '#crafter';
        if (!deckCode || !isCrafterHash) return;

        let attempts = 0;
        const dataWatcher = setInterval(() => {
            attempts++;

            // CHECK ALL REQUIRED DATA, NOT JUST cardDatabase
            const isDatabaseReady = typeof cardDatabase !== 'undefined' && cardDatabase && Object.keys(cardDatabase).length > 0;
            const isFullDatabaseReady = typeof fullDatabase !== 'undefined' && fullDatabase && Object.keys(fullDatabase).length > 0;
            // Add checks for cardAverageCopies or comboDictionary if they load asynchronously too

            // Only proceed if ALL dependencies are locked and loaded
            if (isDatabaseReady && isFullDatabaseReady) {
                clearInterval(dataWatcher);
                if (typeof initSynergyMatrix === 'function') initSynergyMatrix();

                try {
                    // ... [Rest of your URL parsing logic stays exactly the same]
                    const cardDictionary = Object.keys(cardDatabase).sort();

                    // Set up validation trackers
                    let totalCards = 0;
                    let isDeckValid = true;
                    const parsedSeeds = [];
                    const seenCards = new Set(); // Tracks unique cards

                    const pairs = deckCode.split('-');

                    for (const pair of pairs) {
                        const [indexStr, countStr] = pair.split('.');
                        const cardIndex = parseInt(indexStr, 36);

                        // Rule 3: Reject if we have already seen this card
                        if (seenCards.has(cardIndex)) {
                            isDeckValid = false;
                            break; // Stop parsing immediately
                        }
                        seenCards.add(cardIndex);

                        const cardName = cardDictionary[cardIndex];
                        const fullCardData = cardDatabase[cardName];

                        if (fullCardData) {
                            const count = countStr ? parseInt(countStr, 10) : 4;

                            // Rule 1: Reject if any card count is not 1, 2, 3, or 4
                            if (isNaN(count) || count < 1 || count > 4) {
                                isDeckValid = false;
                                break; // Stop parsing immediately
                            }

                            totalCards += count;

                            // Rule 2: Reject if total deck size exceeds 40
                            if (totalCards > 40) {
                                isDeckValid = false;
                                break; // Stop parsing immediately
                            }

                            if (!currentFaction) {
                                currentFaction = plantClasses.has(fullCardData.Class) ? "Plant" : "Zombie";
                            }

                            parsedSeeds.push({
                                ...fullCardData,
                                name: cardName,
                                count: count,
                                class: fullCardData.Class,
                                cost: fullCardData.Cost
                            });
                        }
                    }

                    // If validation failed, silently exit and do nothing to the UI
                    if (!isDeckValid) return;

                    // If we get here, the URL is safe and valid. Apply it.
                    currentSeeds = parsedSeeds;

                    const crafterView = document.getElementById('crafterView');
                    if (crafterView) crafterView.classList.remove('hidden');

                    if (typeof updateDeckStats === 'function') updateDeckStats();
                    if (typeof renderSeeds === 'function') renderSeeds();

                } catch (error) {
                    // Silently catch manual URL tampering
                }
            } else if (attempts > 50) {
                clearInterval(dataWatcher);
            }
        }, 100);
    });


    function getTopThreeRecommendations(baseCardName = null) {
    const scoredCandidates = [];

    const baseSeed = baseCardName
        ? currentSeeds.find(
              card => card.name === baseCardName
          )
        : null;

    const baseCount =
        baseSeed ? baseSeed.count : 0;

    const spaceLeft =
        Math.max(0, 40 - getTotalCards());

    /*
     * Classes remaining after the card being swapped
     * is removed.
     */
    const postSwapClasses = new Set();

    for (const seed of currentSeeds) {
        if (
            baseCardName &&
            seed.name === baseCardName
        ) {
            continue;
        }

        const seedClass =
            cardDatabase[seed.name]?.Class;

        if (seedClass) {
            postSwapClasses.add(seedClass);
        }
    }

    const ctx =
        typeof getVerdictContext === "function"
            ? getVerdictContext()
            : {};

    for (
        const candidateName of
        Object.keys(cardDatabase)
    ) {
        if (
            baseCardName &&
            candidateName === baseCardName
        ) {
            continue;
        }

        const candidateData =
            cardDatabase[candidateName];

        const candidateClass =
            candidateData?.Class;

        if (!candidateClass) {
            continue;
        }

        const candidateFaction =
            plantClasses.has(candidateClass)
                ? "Plant"
                : "Zombie";

        if (
            candidateFaction !== currentFaction
        ) {
            continue;
        }

        const trialClasses =
            new Set(postSwapClasses);

        trialClasses.add(candidateClass);

        if (trialClasses.size > 2) {
            continue;
        }

        const existingSeed =
            currentSeeds.find(
                card =>
                    card.name === candidateName
            );

        const existingCount =
            existingSeed
                ? existingSeed.count
                : 0;

        if (baseCardName) {
            /*
             * Replacing the full old stack must
             * still obey the four-copy limit.
             */
            if (
                existingCount + baseCount > 4
            ) {
                continue;
            }
        } else {
            if (
                spaceLeft <= 0 ||
                existingCount >= 4
            ) {
                continue;
            }

            if (
                !activeClasses.has(
                    candidateClass
                ) &&
                activeClasses.size >= 2
            ) {
                continue;
            }
        }

        const simulatedStrings = [];

        for (const deckCard of currentSeeds) {
            if (
                baseCardName &&
                deckCard.name === baseCardName
            ) {
                continue;
            }

            /*
             * Candidate copies are merged back
             * into one entry below.
             */
            if (
                deckCard.name === candidateName
            ) {
                continue;
            }

            simulatedStrings.push(
                `${deckCard.count}x ${deckCard.name}`
            );
        }

        /*
         * For ordinary recommendations, compare the
         * value of adding the NEXT single copy.
         *
         * This makes:
         *
         * +1 fourth copy
         *
         * directly comparable with:
         *
         * +1 copy of a completely new card.
         */
        const simulatedAddCount =
            baseCardName
                ? baseCount
                : 1;

        simulatedStrings.push(
            `${
                existingCount +
                simulatedAddCount
            }x ${candidateName}`
        );

        const simVerdict =
            getDeckVerdictFromCards(
                simulatedStrings,
                null,
                ctx
            );

        if (!(simVerdict.score > 0)) {
            continue;
        }

        /*
         * cardAverageCopies represents the preferred
         * TOTAL number of copies, not the number that
         * should be added.
         */
        let desiredTotal = 3;

        const averageData =
            typeof cardAverageCopies !==
            "undefined"
                ? cardAverageCopies?.[
                      candidateName
                  ]
                : null;

        if (
            averageData?.appearances > 0
        ) {
            desiredTotal = Math.round(
                averageData.total /
                averageData.appearances
            );
        }

        desiredTotal = Math.max(
            1,
            Math.min(desiredTotal, 4)
        );

        /*
         * Once a card is already part of the deck,
         * prefer bringing it to a consistent three
         * or four copies.
         */
        if (
            !baseCardName &&
            existingCount > 0
        ) {
            desiredTotal = Math.max(
                desiredTotal,
                existingCount === 3
                    ? 4
                    : 3
            );
        }

        const remainingCapacity =
            Math.max(
                0,
                4 - existingCount
            );

        const suggestedAmount =
            baseCardName
                ? baseCount
                : Math.max(
                      1,
                      Math.min(
                          desiredTotal -
                              existingCount,

                          remainingCapacity,
                          spaceLeft
                      )
                  );

        scoredCandidates.push({
            name: candidateName,

            score:
                Number(simVerdict.score) || 0,

            synergy:
                Number(
                    simVerdict.synergyScore
                ) || 0,

            power:
                Number(
                    simVerdict.powerScore
                ) || 0,

            existingCount,
            remainingCapacity,
            desiredTotal,
            suggestedAmount,

            isConsistencyPick:
                !baseCardName &&
                existingCount > 0
        });
    }

    scoredCandidates.sort(
        (first, second) =>
            (
                second.score -
                first.score
            ) ||
            (
                second.synergy -
                first.synergy
            ) ||
            (
                second.power -
                first.power
            )
    );

    /*
     * Swap recommendations should remain purely
     * score-ranked.
     */
    if (baseCardName) {
        return scoredCandidates.slice(0, 3);
    }

    /*
     * Consistency picks are still allowed, but they
     * should not dominate all three recommendation
     * slots.
     *
     * A top-off remains the first choice only when
     * it beats the best new card by at least one
     * full score point.
     */
    const TOP_OFF_FIRST_MARGIN = 1;

    const bestOverall =
        scoredCandidates[0];

    const bestNewCard =
        scoredCandidates.find(
            candidate =>
                !candidate.isConsistencyPick
        );

    const selected = [];

    if (
        bestOverall?.isConsistencyPick &&
        bestNewCard &&
        bestOverall.score -
            bestNewCard.score <
            TOP_OFF_FIRST_MARGIN
    ) {
        /*
         * Scores are close, so present the more
         * interesting new option first.
         */
        selected.push(bestNewCard);
    } else if (bestOverall) {
        /*
         * The top-off is clearly the strongest move,
         * or the best card is already a new option.
         */
        selected.push(bestOverall);
    }

    /*
     * Include no more than one consistency/top-off
     * recommendation unless there are not enough
     * valid new cards.
     */
    for (
        const candidate of
        scoredCandidates
    ) {
        if (selected.length >= 3) {
            break;
        }

        if (
            selected.some(
                chosen =>
                    chosen.name ===
                    candidate.name
            )
        ) {
            continue;
        }

        const alreadyHasConsistencyPick =
            selected.some(
                chosen =>
                    chosen.isConsistencyPick
            );

        if (
            candidate.isConsistencyPick &&
            alreadyHasConsistencyPick
        ) {
            continue;
        }

        selected.push(candidate);
    }

    /*
     * Rare fallback when fewer than three new-card
     * options exist.
     */
    for (
        const candidate of
        scoredCandidates
    ) {
        if (selected.length >= 3) {
            break;
        }

        if (
            selected.some(
                chosen =>
                    chosen.name ===
                    candidate.name
            )
        ) {
            continue;
        }

        selected.push(candidate);
    }

    return selected;
}
    // ============================================================
    // PvZ HEROES DECK BUILDER — VISUAL UPGRADE (JS)
    // Replaces: updateDeckStats(), triggerAICoPilot(), showSwapSuggestions()
    // All scoring / recommendation / simulation logic is untouched —
    // only the rendering changed. Requires deck-builder-visuals.css
    // and the new ai-pane HTML.
    // ============================================================

    // ------------------------------------------------------------
    // Shared helpers (new — rendering only)
    // ------------------------------------------------------------

    // Grade cutoffs — the gauge (zones, letters, marker mapping) is built
    // entirely from this constant, so editing it here is all you need to do.
    // `label` is the plain-language meaning shown instead of a raw /100 score.
    const GRADE_CUTOFFS = [
        { letter: 'S', min: 95, label: 'Excellent' },
        { letter: 'A', min: 85, label: 'Good' },
        { letter: 'B', min: 75, label: 'Average' },
        { letter: 'C', min: 65, label: 'Weak' },
        { letter: 'D', min: 40, label: 'Bad' },
        { letter: 'F', min: 0, label: 'Awful' },
    ];

    const GRADE_COLORS = {
        F: 'var(--grade-f)', D: 'var(--grade-d)', C: 'var(--grade-c)',
        B: 'var(--grade-b)', A: 'var(--grade-a)', S: 'var(--grade-s)',
    };

    // Ascending bands with explicit [min, max) ranges, derived once
    const GRADE_BANDS = [...GRADE_CUTOFFS]
        .sort((a, b) => a.min - b.min)
        .map((g, i, arr) => ({
            letter: g.letter,
            label: g.label,
            min: g.min,
            max: i < arr.length - 1 ? arr[i + 1].min : 100,
        }));

    // Maps a raw 0–100 score to a visual % on the gauge.
    // Each grade occupies an equal-width zone; the score is interpolated
    // within its own band. So mid-B (81 of 75–87.5) sits mid-way through
    // the B segment — F no longer hogs half the bar, S isn't a sliver.
    function scoreToGaugePercent(score) {
        const s = Math.max(0, Math.min(100, score));
        const bandWidth = 100 / GRADE_BANDS.length;
        const i = GRADE_BANDS.findIndex(b => s >= b.min && s < b.max);
        const idx = i === -1 ? GRADE_BANDS.length - 1 : i;   // score === 100
        const band = GRADE_BANDS[idx];
        const frac = band.max > band.min ? (s - band.min) / (band.max - band.min) : 1;
        return idx * bandWidth + frac * bandWidth;
    }

    // Builds the gauge zones + letters from GRADE_CUTOFFS (runs once, lazily)
    let _gaugeBuilt = false;
    function buildPowerGauge() {
        const zonesHost = document.getElementById('pmZones');
        const lettersHost = document.getElementById('pmLetters');
        if (!zonesHost || !lettersHost || _gaugeBuilt) return;

        const bandWidth = 100 / GRADE_BANDS.length;

        zonesHost.innerHTML = GRADE_BANDS.map(b =>
            `<div class="pm-zone" data-g="${b.letter}" title="${b.letter} · ${b.min}–${b.max}"></div>`
        ).join('');

        lettersHost.innerHTML = GRADE_BANDS.map((b, i) =>
            `<span class="pm-letter" data-g="${b.letter}" style="left: ${(i + 0.5) * bandWidth}%; --g: ${GRADE_COLORS[b.letter] || '#fff'};">${b.letter}</span>`
        ).join('');

        _gaugeBuilt = true;
    }

    // Wraps a message in Dave's speech bubble (mini avatar + tail + pop animation)
    function daveSay(innerHtml) {
        return `
    <div class="dave-msg">
        <img src="crazydave.webp" alt="" class="dave-msg-avatar">
        <div class="speech-bubble">${innerHtml}</div>
    </div>`;
    }

    // Dave "thinking" bubble with bouncing dots
    function daveThinking(text) {
        return daveSay(`
        <span style="display:inline-flex; align-items:center; gap:8px;">
            <span class="typing-dots"><span></span><span></span><span></span></span>
            <em style="opacity:0.8;">${text}</em>
        </span>`);
    }

    // Smoothly counts the "pts to next grade" number toward its new value
    let _pmTweenRaf = null;
    function tweenNumber(el, target, suffix = '') {
        if (!el) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            el.innerText = Math.round(target * 10) / 10 + suffix;
            return;
        }
        cancelAnimationFrame(_pmTweenRaf);
        const start = parseFloat(el.innerText) || 0;
        const t0 = performance.now();
        const dur = 700;
        const step = (now) => {
            const p = Math.min((now - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
            el.innerText = Math.round((start + (target - start) * eased) * 10) / 10 + suffix;
            if (p < 1) _pmTweenRaf = requestAnimationFrame(step);
        };
        _pmTweenRaf = requestAnimationFrame(step);
    }
const crazyDavePanel = document.getElementById("crazyDavePanel");
const toggleDavePanelBtn = document.getElementById("toggleDavePanelBtn");
const DAVE_PANEL_ANIMATION_MS = 420;
let davePanelHideTimer = null;

function setDavePanelVisible(isVisible) {
    clearTimeout(davePanelHideTimer);

    if (isVisible) {
        /*
         * Put Dave back into the layout before starting the opening
         * animation.
         */
        crazyDavePanel.classList.remove("dave-panel-fully-hidden");

        // Force the browser to register the visible panel first.
        crazyDavePanel.getBoundingClientRect();

        requestAnimationFrame(() => {
            crafterView.classList.remove("dave-panel-hidden");
        });
    } else {
        /*
         * First run the opacity/slide/grid animation.
         */
        crafterView.classList.add("dave-panel-hidden");

        /*
         * Then remove Dave completely from layout so its content
         * cannot create extra document height.
         */
        davePanelHideTimer = setTimeout(() => {
            if (crafterView.classList.contains("dave-panel-hidden")) {
                crazyDavePanel.classList.add("dave-panel-fully-hidden");
            }
        }, DAVE_PANEL_ANIMATION_MS);
    }

    toggleDavePanelBtn.classList.toggle("is-closed", !isVisible);
    toggleDavePanelBtn.setAttribute("aria-expanded", String(isVisible));

    toggleDavePanelBtn.setAttribute(
        "aria-label",
        isVisible
            ? "Hide Crazy Dave panel"
            : "Show Crazy Dave panel"
    );

    toggleDavePanelBtn.title = isVisible
        ? "Hide Crazy Dave"
        : "Show Crazy Dave";
}

toggleDavePanelBtn.addEventListener("click", () => {
    const isCurrentlyVisible =
        !crafterView.classList.contains("dave-panel-hidden");

    setDavePanelVisible(!isCurrentlyVisible);
});
    // ------------------------------------------------------------
    // LIVE DECK ANALYTICS — Power Meter edition
    // ------------------------------------------------------------
    function updateDeckStats() {
        const SHOW_DEBUG_SCORES = false; // set false before release
        const hud = document.getElementById('deckStatsHud');
        const totalCards = getTotalCards();

        if (!hud || totalCards === 0) {
            if (hud) hud.style.display = 'none';
            return;
        }

        hud.style.display = 'block';

        // 1. Format the current seeds into the string array getDeckVerdictFromCards expects
        const deckCards = currentSeeds.map(s => `${s.count}x ${s.name}`);

        // 2. Delegate all heavy lifting to the verdict function (unchanged)
        const stats = getDeckVerdictFromCards(deckCards);

        // ==========================================
        // UI 1: Score gauge — marker mapped piecewise through grade zones
        // ==========================================
        buildPowerGauge();

        const score = Math.max(0, Math.min(100, stats.score || 0));

        const marker = document.getElementById('pmMarker');
        if (marker) marker.style.left = `${scoreToGaugePercent(score)}%`;

        // Light up the active grade zone + letter
        const activeBand = GRADE_BANDS.find(b => score >= b.min && score < b.max)
            || GRADE_BANDS[GRADE_BANDS.length - 1];
        const activeLetter = activeBand.letter;

        // Plain-language verdict ("Average") instead of a misleading /100 number,
        // plus a "pts to next grade" countdown for live feedback
        const qualityEl = document.getElementById('pmQualityWord');
        const nextEl = document.getElementById('pmNextGrade');
        if (qualityEl) {
            qualityEl.innerText = activeBand.label;
            qualityEl.style.color = stats.gradeColor;
        }
        if (nextEl) {
            const bandIdx = GRADE_BANDS.indexOf(activeBand);
            const nextBand = GRADE_BANDS[bandIdx + 1];
            if (nextBand) {
                const ptsToNext = Math.max(nextBand.min - score, 0);
                nextEl.style.display = '';
                // tween the number, keep the static text outside the tween target
                nextEl.innerHTML = `<span id="pmNextPts">${nextEl.querySelector('#pmNextPts')?.innerText || 0}</span> pts to ${nextBand.letter}`;
                tweenNumber(document.getElementById('pmNextPts'), Math.round(ptsToNext * 10) / 10);
            } else {
                nextEl.style.display = '';
                nextEl.innerText = 'Top grade!';
            }
        }
        document.querySelectorAll('.pm-zone').forEach(z =>
            z.classList.toggle('active', z.dataset.g === activeLetter));
        document.querySelectorAll('.pm-letter').forEach(l =>
            l.classList.toggle('active', l.dataset.g === activeLetter));

        // Big grade letter (uses the verdict's own grade + color)
        const gradeEl = document.getElementById('verdictGrade');
        gradeEl.innerText = stats.grade;
        gradeEl.style.color = stats.gradeColor;

        // ==========================================
        // UI 2: Mana Curve Chart (SVG — unchanged renderer)
        // ==========================================
        const chart = document.getElementById('manaCurveChart');
        const counts = [stats.curve[1], stats.curve[2], stats.curve[3], stats.curve[4], stats.curve[5], stats.curve["6+"]];
        const maxCurveVal = Math.max(...counts, 1);

        const width = chart.clientWidth > 0 ? chart.clientWidth : 300;
        const height = 40;
        const xStep = width / (counts.length - 1);

        let pathD = `M 0,${height} `;
        const points = [];

        counts.forEach((count, i) => {
            const x = i * xStep;
            const y = height - ((count / maxCurveVal) * (height - 4)) - 2;
            points.push({ x, y });
            pathD += `L ${x},${y} `;
        });

        pathD += `L ${width},${height} Z`;

        chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible; display: block;">
        <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4CAF50" stop-opacity="0.5"/>
                <stop offset="100%" stop-color="#4CAF50" stop-opacity="0.0"/>
            </linearGradient>
        </defs>
        <path d="${pathD}" fill="url(#curveGradient)" stroke="#4CAF50" stroke-width="2" stroke-linejoin="round" />
        ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#1e1e24" stroke="#4CAF50" stroke-width="1.5" />`).join('')}
    </svg>
`;

        // ==========================================
        // UI 3: Speed / cost computations (unchanged math — feeds subtitle)
        // ==========================================
        let speedLabel = "Midrange";

        if (stats.avgCost <= 2.2) {
            speedLabel = "Aggro/Rush";
        } else if (stats.avgCost > 2.2 && stats.avgCost <= 3.5) {
            speedLabel = "Midrange";
        } else {
            speedLabel = "Control/Late";
        }

        const archetype = speedLabel.split('/')[0];
        document.getElementById('verdictArchetype').innerText = archetype;
        document.getElementById('verdictSubtitle').innerText =
            `${totalCards} cards · avg cost ${stats.avgCost.toFixed(1)} · ${stats.costLabel.toLowerCase()}`;

        // ==========================================
// UI 4: Callouts
// ==========================================
const callouts = [];

if (totalCards >= 6) {
    // Synergy
    if (stats.synergyScore >= 88) {
        callouts.push({ dir: 'up', text: 'Deck pieces fit well', pri: 5 });
    } else if (stats.synergyScore >= 75) {
        callouts.push({ dir: 'up', text: 'Good card synergy', pri: 3 });
    } else if (stats.synergyScore < 50) {
        callouts.push({ dir: 'down', text: 'Cards feel disconnected', pri: 5 });
    } else if (stats.synergyScore < 65) {
        callouts.push({ dir: 'down', text: 'Needs more synergy', pri: 3 });
    }

    // Consistency
    if (stats.consistencyScore >= 85) {
        callouts.push({ dir: 'up', text: 'Reliable game plan', pri: 4 });
    } else if (stats.consistencyScore < 40) {
        callouts.push({ dir: 'down', text: 'May draw awkwardly', pri: 5 });
    } else if (stats.consistencyScore < 65) {
        callouts.push({ dir: 'down', text: 'Could be smoother', pri: 3 });
    }

    // Power
    if (stats.powerScore >= 85) {
        callouts.push({ dir: 'up', text: 'High-power cards', pri: 4 });
    } else if (stats.powerScore < 50) {
        callouts.push({ dir: 'down', text: 'Low overall power', pri: 2 });
    }

    // Curve
    if (stats.curveHealthText === "Excellent") {
        callouts.push({ dir: 'up', text: 'Smooth curve', pri: 4 });
    } else if (stats.curveHealthText === "Awkward") {
        callouts.push({ dir: 'down', text: 'Awkward curve', pri: 5 });
    }

    // Cost
    if (stats.costLabel === "P2W") {
        callouts.push({ dir: 'down', text: 'Expensive deck', pri: 2 });
    } else if (stats.costLabel === "Budget" && stats.powerScore >= 60) {
        callouts.push({ dir: 'up', text: 'Strong for budget', pri: 3 });
    }
}

callouts.sort((a, b) => b.pri - a.pri);

const top = callouts.slice(0, 2);
const calloutHost = document.getElementById('verdictCallouts');

function debugDir(score) {
    if (score >= 80) return "up";
    if (score < 60) return "down";
    return "";
}

const debugChips = SHOW_DEBUG_SCORES ? [
    {
        dir: debugDir(stats.synergyScore),
        text: `Synergy ${Math.round(stats.synergyScore)}%`
    },
    {
        dir: debugDir(stats.powerScore),
        text: `Power ${Math.round(stats.powerScore)}%`
    },
    {
        dir: debugDir(stats.consistencyScore),
        text: `Consistency ${Math.round(stats.consistencyScore)}%`
    },
    {
        dir: debugDir(stats.curveNumeric),
        text: `Curve ${Math.round(stats.curveNumeric)}%`
    },
    {
        dir: debugDir(stats.score),
        text: `Overall ${Math.round(stats.score)}%`
    }
] : [];

const normalChips = top.map((c, i) => `
    <span class="pm-chip ${c.dir}" style="animation-delay:${i * 70}ms;">
        ${c.text}
    </span>
`);

const scoreChips = debugChips.map((c, i) => `
    <span class="pm-chip ${c.dir}" style="animation-delay:${(i + normalChips.length) * 70}ms;">
        ${c.text}
    </span>
`);

calloutHost.innerHTML = [...normalChips, ...scoreChips].join('');
    }
    let manualDeckName = "";
const DECK_NAME_MAX_CHARS = 24;
function sanitizeDeckName(name) {
    return (name || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, DECK_NAME_MAX_CHARS);
}

function escapeHtml(str) {
    return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function getAutoDeckName() {
    const isPlant = currentFaction === "Plant";

    return typeof generateDeckName === "function"
        ? generateDeckName(currentSeeds, isPlant)
        : "Custom Deck";
}

function getCurrentDeckName() {
    return sanitizeDeckName(manualDeckName) || getAutoDeckName();
}
    function buildCurrentDeckShareUrl(deckToShare = currentSeeds) {
    const cardDictionary = Object.keys(cardDatabase).sort();

    const encodedCards = deckToShare.map(card => {
        const index = cardDictionary.indexOf(card.name);

        if (index === -1) {
            console.error(`🚨 Could not find card in dictionary: ${card.name}`);
            return null;
        }

        const cardIndex = index.toString(36);
        return card.count === 4 ? cardIndex : `${cardIndex}.${card.count}`;
    });

    if (encodedCards.includes(null)) {
        return null;
    }

    const minimalDeckString = encodedCards.join('-');

    // No #crafter — bare link so it auto-opens the panel on the home screen.
    return `${window.location.origin}${window.location.pathname}?deck=${minimalDeckString}`;
}
function getMainSwapImprovement(oldVerdict, newVerdict) {
    const improvements = [
        {
            key: "synergy",
            label: "better card synergy",
            delta: newVerdict.synergyScore - oldVerdict.synergyScore
        },
        {
            key: "consistency",
            label: "a more reliable game plan",
            delta: newVerdict.consistencyScore - oldVerdict.consistencyScore
        },
        {
            key: "power",
            label: "higher card quality",
            delta: newVerdict.powerScore - oldVerdict.powerScore
        },
        {
            key: "curve",
            label: "a smoother curve",
            delta: newVerdict.curveNumeric - oldVerdict.curveNumeric
        }
    ];

    improvements.sort((a, b) => b.delta - a.delta);

    const best = improvements[0];

    if (!best || best.delta <= 0) {
        return "a stronger overall deck";
    }

    return best.label;
}
    // ------------------------------------------------------------
    // CONVERSATIONAL AI CO-PILOT — speech bubble edition
    // ------------------------------------------------------------
    /* ==============================================================
   SMART "WHY THIS CARD?" EXPLANATIONS
   Paste this entire block ABOVE triggerAICoPilot().
   ============================================================== */

const SmartRecWhy = (() => {
    const GENERIC_TYPES = new Set([
        'plant',
        'zombie',
        'trick',
        'environment',
        'superpower',
        'token',
        'event',
        'fighter',
        'hero'
    ]);

    const MECHANICS = {
        draw: /\bdraw\b/i,
        conjure: /\bconjure\b/i,

        ramp:
            /\bextra sun\b|\bgain(?:s)? \+?\d+ sun\b|\bcosts? less\b/i,

        removal:
            /\bdestroy\b|\bbounce\b|\btransform\b|\bdo(?:es)? \d+ damage\b/i,

        freeze: /\bfreeze\b/i,
        heal: /\bheal\b/i,

        buff:
            /\bget(?:s)? \+\d+|\ball .* get \+\d+|\bdouble .* strength\b/i,

        swarm:
            /\bmake (?:a|an|another|\d+)\b|\bcreate (?:a|an|another|\d+)\b/i,

        reach:
            /\b(?:plant|zombie) hero\b.*\bdamage\b|\bdamage\b.*\b(?:plant|zombie) hero\b/i,

        protection:
            /\buntrickable\b|\barmored\b|\bteam-up\b|\bcan't be hurt\b/i,

        tempo:
            /\bbounce\b|\bfreeze\b|\bmove (?:a|an|the|another)\b/i,

        finisher:
            /\bstrikethrough\b|\bdouble strike\b|\bfrenzy\b|\ball .* get \+\d+/i
    };

    const ROLE_TEXT = {
        draw:
            'It adds card draw, something the current list does not have yet.',

        conjure:
            'It adds card generation, giving the deck more resources in longer games.',

        ramp:
            'It adds resource acceleration, helping the deck reach expensive cards sooner.',

        removal:
            'It gives the deck a real removal option instead of relying only on combat.',

        freeze:
            'It adds a Freeze tool, buying tempo and enabling Freeze payoffs.',

        heal:
            'It adds healing, giving the deck more room against aggressive starts.',

        reach:
            'It adds direct Hero damage, giving the deck reach when the board stalls.',

        protection:
            'It adds protection, making an important board harder to answer.',

        tempo:
            'It adds disruption without forcing the deck to abandon its own game plan.'
    };

    let tribeCache = null;
    let tribeCacheSize = -1;

    function displayName(name) {
        return String(name || '').replace(/_/g, ' ');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getCardData(name) {
        if (!name || typeof cardDatabase === 'undefined') {
            return null;
        }

        return (
            cardDatabase[name] ||
            cardDatabase[String(name).replace(/ /g, '_')] ||
            cardDatabase[String(name).replace(/_/g, ' ')] ||
            null
        );
    }

    function normalize(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[’‘]/g, "'")
            .replace(/[^a-z0-9+'/-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function mentions(text, term) {
        const haystack = ` ${normalize(text)} `;
        const base = normalize(term);

        if (!base) {
            return false;
        }

        const forms = [base];

        if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
            forms.push(`${base.slice(0, -1)}ies`);
        } else if (/(s|x|z|ch|sh)$/.test(base)) {
            forms.push(`${base}es`);
        } else {
            forms.push(`${base}s`);
        }

        return forms.some(form => haystack.includes(` ${form} `));
    }

    /*
     * Builds the tribe list automatically from card_data.json.
     *
     * For:
     * "Pet Professional Zombie"
     *
     * it treats Pet and Professional as tribes,
     * while ignoring Zombie.
     */
    function getKnownTribes() {
        const database =
            typeof cardDatabase !== 'undefined'
                ? cardDatabase
                : {};

        const databaseSize = Object.keys(database).length;

        if (
            tribeCache &&
            tribeCacheSize === databaseSize
        ) {
            return tribeCache;
        }

        const tribes = new Set();

        Object.values(database).forEach(card => {
            String(card?.Type || '')
                .split(/\s+/)
                .forEach(word => {
                    const clean = word.trim();

                    if (
                        clean &&
                        !GENERIC_TYPES.has(clean.toLowerCase())
                    ) {
                        tribes.add(clean);
                    }
                });
        });

        tribeCache = [...tribes].sort(
            (a, b) => b.length - a.length
        );

        tribeCacheSize = databaseSize;

        return tribeCache;
    }

    function getCardTribes(card) {
        const knownTribes = new Set(
            getKnownTribes().map(tribe => tribe.toLowerCase())
        );

        return String(card?.Type || '')
            .split(/\s+/)
            .map(word => word.trim())
            .filter(word =>
                knownTribes.has(word.toLowerCase())
            );
    }

    function getCardMechanics(card) {
        const searchableText =
            `${card?.Description || ''} ${card?.Type || ''}`;

        return Object.entries(MECHANICS)
            .filter(([, regex]) =>
                regex.test(searchableText)
            )
            .map(([mechanic]) => mechanic);
    }

    /*
     * Converts the current deck into useful information:
     *
     * - number of each tribe
     * - number of each mechanic
     * - mana curve
     * - average cost
     * - likely archetype
     */
    function buildDeckContext() {
        const cards = (
            Array.isArray(currentSeeds)
                ? currentSeeds
                : []
        ).map(seed => {
            const data = getCardData(seed.name) || {};

            return {
                name: seed.name,
                displayName: displayName(seed.name),
                count: Number(seed.count) || 0,
                data,
                description: String(data.Description || ''),
                tribes: getCardTribes(data),
                mechanics: getCardMechanics(data),
                cost: Number(data.Cost)
            };
        });

        const context = {
            cards,

            totalCards: 0,

            curve: {},

            tribeCopies: {},

            mechanicCopies: {},

            weightedCost: 0,
            costedCopies: 0,

            lowCostCopies: 0,
            highCostCopies: 0,
            oneCostCopies: 0,

            archetype: 'developing'
        };

        cards.forEach(card => {
            context.totalCards += card.count;

            if (Number.isFinite(card.cost)) {
                context.curve[card.cost] =
                    (context.curve[card.cost] || 0) +
                    card.count;

                context.weightedCost +=
                    card.cost * card.count;

                context.costedCopies += card.count;

                if (card.cost <= 2) {
                    context.lowCostCopies += card.count;
                }

                if (card.cost === 1) {
                    context.oneCostCopies =
                        (context.oneCostCopies || 0) +
                        card.count;
                }

                if (card.cost >= 6) {
                    context.highCostCopies += card.count;
                }
            }

            card.tribes.forEach(tribe => {
                context.tribeCopies[tribe] =
                    (context.tribeCopies[tribe] || 0) +
                    card.count;
            });

            card.mechanics.forEach(mechanic => {
                context.mechanicCopies[mechanic] =
                    (context.mechanicCopies[mechanic] || 0) +
                    card.count;
            });
        });

        const averageCost =
            context.costedCopies > 0
                ? context.weightedCost /
                  context.costedCopies
                : 0;

        const lowCostShare =
            context.costedCopies > 0
                ? context.lowCostCopies /
                  context.costedCopies
                : 0;

        const controlTools = [
            'removal',
            'draw',
            'heal',
            'tempo'
        ].reduce(
            (total, mechanic) =>
                total +
                (context.mechanicCopies[mechanic] || 0),
            0
        );

        /*
         * Guide section 1 ("Curve") ties archetype to one-cost count as
         * much as average cost: Aggro runs roughly 11-14x one-costs,
         * Control roughly 4-8x. Treat that as a signal alongside the
         * existing average-cost/control-tools checks rather than
         * replacing them.
         */
        if (
            context.totalCards >= 6 &&
            (
                (averageCost <= 2.8 && lowCostShare >= 0.45) ||
                context.oneCostCopies >= 11
            )
        ) {
            context.archetype = 'fast';
        } else if (
            context.totalCards >= 6 &&
            (
                averageCost >= 3.7 ||
                controlTools >= Math.max(
                    4,
                    context.totalCards * 0.25
                ) ||
                (
                    context.oneCostCopies <= 8 &&
                    averageCost >= 3.2
                )
            )
        ) {
            context.archetype = 'control';
        } else if (context.totalCards >= 6) {
            context.archetype = 'midrange';
        }

        return context;
    }

    function addReason(
        reasons,
        category,
        score,
        text
    ) {
        const cleanedText = String(text || '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanedText) {
            return;
        }

        if (
            reasons.some(
                reason => reason.text === cleanedText
            )
        ) {
            return;
        }

        reasons.push({
            category,
            score,
            text: cleanedText
        });
    }

    function formatCardNames(cards) {
        const names = [
            ...new Set(
                cards.map(card => card.displayName)
            )
        ].slice(0, 2);

        if (names.length === 0) {
            return '';
        }

        if (names.length === 1) {
            return names[0];
        }

        return `${names[0]} and ${names[1]}`;
    }

    /*
     * Checks your hand-written comboDictionary first.
     * A known combo is stronger evidence than generic analysis.
     */
    function findComboReason(
        candidateName,
        context
    ) {
        if (
            typeof comboDictionary === 'undefined' ||
            !Array.isArray(comboDictionary)
        ) {
            return null;
        }

        const deckNames = new Set(
            context.cards.map(card => card.name)
        );

        const matchingCombo = comboDictionary.find(
            combo => {
                if (
                    !Array.isArray(combo?.cards) ||
                    !combo.cards.includes(candidateName)
                ) {
                    return false;
                }

                const requiredPartners =
                    combo.cards.filter(
                        name => name !== candidateName
                    );

                return (
                    requiredPartners.length > 0 &&
                    requiredPartners.every(name =>
                        deckNames.has(name)
                    )
                );
            }
        );

        if (!matchingCombo?.message) {
            return null;
        }

        return String(matchingCombo.message)
            .replace(/<[^>]*>/g, ' ')
            .replace(/\*+/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getTribePayoffText(
        description,
        tribe
    ) {
        if (
            /all .* get \+\d+ strength/i.test(
                description
            )
        ) {
            return (
                `its board-wide ${tribe} Strength ` +
                `buff has plenty of targets`
            );
        }

        if (
            /all .* get \+\d+ health/i.test(
                description
            )
        ) {
            return (
                `its board-wide ${tribe} Health ` +
                `buff has plenty of targets`
            );
        }

        if (/\bdraw\b/i.test(description)) {
            return (
                `its ${tribe}-based draw effect ` +
                `should be easy to activate`
            );
        }

        if (/\bdamage\b/i.test(description)) {
            return (
                `its ${tribe}-based damage effect ` +
                `should trigger consistently`
            );
        }

        return (
            `its ${tribe} payoff should ` +
            `trigger consistently`
        );
    }

    function explainRecommendation(
        recommendation,
        context,
        rank = 0
    ) {
        const candidateName =
            recommendation?.name ||
            recommendation;

        const data =
            getCardData(candidateName) || {};

        const candidateDisplayName =
            displayName(candidateName);

        const description =
            String(data.Description || '').trim();

        const candidateTribes =
            getCardTribes(data);

        const candidateMechanics =
            getCardMechanics(data);

        const candidateCost =
            Number(data.Cost);

        const reasons = [];
        /*
 * Consistency explanation when the recommended
 * card is already present in the deck.
 */
const existingDeckCard =
    context.cards.find(
        card =>
            card.name === candidateName
    );

const existingCount =
    Number.isFinite(
        Number(
            recommendation?.existingCount
        )
    )
        ? Number(
              recommendation.existingCount
          )
        : existingDeckCard?.count || 0;

const suggestedAmount =
    Number.isFinite(
        Number(
            recommendation?.suggestedAmount
        )
    )
        ? Number(
              recommendation.suggestedAmount
          )
        : 1;

const finalCount =
    Math.min(
        4,
        existingCount +
            suggestedAmount
    );

if (existingCount > 0) {
    let consistencyText = "";

    if (
        existingCount === 3 &&
        suggestedAmount === 1
    ) {
        consistencyText =
            `You already have 3 copies. ` +
            `Adding the fourth completes the playset, ` +
            `making this one of your most reliable draws.`;
    } else if (finalCount === 4) {
        consistencyText =
            `You already run ${existingCount} ` +
            `${existingCount === 1 ? "copy" : "copies"}. ` +
            `Adding ${suggestedAmount} more completes the ` +
            `four-copy playset and makes the deck much more consistent.`;
    } else if (finalCount === 3) {
        consistencyText =
            `This takes you from ${existingCount} to 3 copies, ` +
            `turning it from an occasional draw into a consistent ` +
            `part of the deck's game plan.`;
    } else {
        consistencyText =
            `Adding another copy makes this card show up more ` +
            `reliably without fully committing to a playset.`;
    }

    addReason(
        reasons,
        "consistency",
        220,
        consistencyText
    );
}

        /*
         * 1. Known comboDictionary interaction.
         */
        const comboReason = findComboReason(
            candidateName,
            context
        );

        if (comboReason) {
            addReason(
                reasons,
                'known-combo',
                160,
                comboReason
            );
        }

        /*
         * 2. The recommended card rewards tribes
         *    already present in the deck.
         *
         * Example:
         * Zookeeper says "When you play a Pet..."
         * and the deck already has 8 Pets.
         */
        getKnownTribes().forEach(tribe => {
            const supportedCopies =
                context.tribeCopies[tribe] || 0;

            if (
                supportedCopies === 0 ||
                !mentions(description, tribe)
            ) {
                return;
            }

            addReason(
                reasons,
                'candidate-tribe-payoff',
                140 +
                    Math.min(
                        supportedCopies,
                        20
                    ),

                `You already have ${supportedCopies} ` +
                `${tribe} ` +
                `${supportedCopies === 1 ? 'card' : 'cards'}, ` +
                `so ${getTribePayoffText(description, tribe)}.`
            );
        });

        /*
         * 3. Existing cards reward this candidate's tribe.
         *
         * Example:
         * Existing Zookeeper rewards Pets,
         * and the recommended card is a Pet.
         */
        candidateTribes.forEach(tribe => {
            const payoffCards =
                context.cards.filter(card =>
                    mentions(
                        card.description,
                        tribe
                    )
                );

            if (payoffCards.length === 0) {
                return;
            }

            addReason(
                reasons,
                'existing-tribe-payoff',
                135 +
                    Math.min(
                        payoffCards.length * 4,
                        16
                    ),

                `As a ${tribe}, it gives ` +
                `${formatCardNames(payoffCards)} ` +
                `another useful trigger.`
            );
        });

        /*
         * 4. Direct relationship with the
         *    most recently added card.
         */
        if (
            typeof lastAddedCard !== 'undefined' &&
            lastAddedCard
        ) {
            const lastData =
                getCardData(lastAddedCard) || {};

            const lastTribes =
                getCardTribes(lastData);

            const lastDescription =
                String(lastData.Description || '');

            const candidateRewardsLast =
                lastTribes.find(tribe =>
                    mentions(description, tribe)
                );

            const lastRewardsCandidate =
                candidateTribes.find(tribe =>
                    mentions(
                        lastDescription,
                        tribe
                    )
                );

            if (candidateRewardsLast) {
                addReason(
                    reasons,
                    'last-card',
                    150,

                    `It directly builds on ` +
                    `${displayName(lastAddedCard)}: ` +
                    `that card is a ${candidateRewardsLast}, ` +
                    `which this ability rewards.`
                );
            } else if (lastRewardsCandidate) {
                addReason(
                    reasons,
                    'last-card',
                    150,

                    `${displayName(lastAddedCard)} ` +
                    `already rewards ${lastRewardsCandidate} cards, ` +
                    `and ${candidateDisplayName} gives it another target.`
                );
            }
        }

        /*
         * 5. Fill a missing deck role.
         */
        candidateMechanics.forEach(mechanic => {
            const currentCopies =
                context.mechanicCopies[mechanic] || 0;

            if (currentCopies !== 0 || !ROLE_TEXT[mechanic]) {
                return;
            }

            /*
             * Removal is reactive by nature: it answers what the
             * opponent already played rather than advancing your own
             * plan, so it suits control/midrange far more naturally
             * than a fast deck (guide section 4). Say so instead of
             * using the same generic line for every archetype.
             */
            if (mechanic === 'removal' && context.archetype === 'fast') {
                addReason(
                    reasons,
                    `role-${mechanic}`,
                    90,
                    'It gives the deck a removal option, but since removal is ' +
                    'reactive, keep it as backup rather than a mainstay in a ' +
                    'deck that wants to be proactive.'
                );

                return;
            }

            addReason(
                reasons,
                `role-${mechanic}`,
                100,
                ROLE_TEXT[mechanic]
            );
        });

        /*
         * 6. Curve reasoning.
         */
        if (Number.isFinite(candidateCost)) {
            const copiesAtCost =
                context.curve[candidateCost] || 0;

            if (
                context.totalCards >= 5 &&
                copiesAtCost === 0 &&
                candidateCost <= 5
            ) {
                addReason(
                    reasons,
                    'curve',
                    94,

                    `It fills your empty ` +
                    `${candidateCost}-cost slot, ` +
                    `making the deck's curve smoother.`
                );
            } else if (
                context.totalCards >= 10 &&
                copiesAtCost <= 1 &&
                candidateCost <= 3
            ) {
                addReason(
                    reasons,
                    'curve',
                    88,

                    `Your ${candidateCost}-cost slot is thin, ` +
                    `so this makes your early turns more consistent.`
                );
            }

            if (
                context.totalCards >= 10 &&
                candidateCost >= 6 &&
                context.highCostCopies === 0
            ) {
                addReason(
                    reasons,
                    'late-game',
                    92,

                    'It gives the deck a real late-game payoff, ' +
                    'which the current list is missing.'
                );
            }
        }

        /*
         * 7. Archetype reasoning.
         */
        if (
            context.archetype === 'fast' &&
            Number.isFinite(candidateCost) &&
            candidateCost <= 3 &&
            candidateMechanics.some(
                mechanic =>
                    [
                        'buff',
                        'swarm',
                        'reach',
                        'tempo'
                    ].includes(mechanic)
            )
        ) {
            addReason(
                reasons,
                'archetype',
                84,

                'It keeps the curve low while adding pressure, ' +
                'matching the fast direction of this deck.'
            );
        }

        if (
            context.archetype === 'control' &&
            candidateMechanics.some(
                mechanic =>
                    [
                        'draw',
                        'conjure',
                        'removal',
                        'heal',
                        'tempo',
                        'finisher'
                    ].includes(mechanic)
            )
        ) {
            addReason(
                reasons,
                'archetype',
                84,

                'Its long-game value fits the control ' +
                'direction of the deck.'
            );
        }

        /*
         * 8. Efficient raw stats.
         */
        const strength =
            Number(data.Strength);

        const health =
            Number(data.Health);

        const isUnit =
            /\b(?:Plant|Zombie)\b/i.test(
                String(data.Type || '')
            );

        if (
            isUnit &&
            Number.isFinite(candidateCost) &&
            candidateCost > 0 &&
            Number.isFinite(strength) &&
            Number.isFinite(health) &&
            (
                (strength + health) /
                candidateCost
            ) >= 2.5
        ) {
            addReason(
                reasons,
                'stats',
                76,

                `Its ${strength}/${health} body is efficient ` +
                `for ${candidateCost}, so the synergy ` +
                `does not cost much tempo.`
            );
        }

        /*
         * 9. Use the recommendation algorithm's
         *    actual scoring evidence when available.
         *
         * Your getTopThreeRecommendations() can return:
         *
         * {
         *   name: "Zookeeper",
         *   breakdown: {
         *      pairSynergy: 25,
         *      curveFit: 10,
         *      popularity: 6
         *   }
         * }
         */
        const scoreBreakdown =
            recommendation?.breakdown ||
            recommendation?.scoreBreakdown ||
            recommendation?.components;

        if (
            scoreBreakdown &&
            typeof scoreBreakdown === 'object'
        ) {
            const strongestComponent =
                Object.entries(scoreBreakdown)
                    .filter(([, value]) =>
                        Number.isFinite(
                            Number(value)
                        ) &&
                        Number(value) > 0
                    )
                    .sort(
                        (a, b) =>
                            Number(b[1]) -
                            Number(a[1])
                    )[0];

            if (strongestComponent) {
                const componentName =
                    String(
                        strongestComponent[0]
                    ).toLowerCase();

                if (
                    /pair|synergy|core/.test(
                        componentName
                    )
                ) {
                    addReason(
                        reasons,
                        'score-evidence',
                        130,

                        'It has the strongest measured synergy ' +
                        'with the core already in your deck.'
                    );
                } else if (
                    /curve|cost/.test(
                        componentName
                    )
                ) {
                    addReason(
                        reasons,
                        'score-evidence',
                        98,

                        'Its cost is one of the best fits ' +
                        'for the deck’s current curve.'
                    );
                } else if (
                    /popular|frequency|usage/.test(
                        componentName
                    )
                ) {
                    addReason(
                        reasons,
                        'score-evidence',
                        82,

                        'It is a proven partner for cards ' +
                        'like the ones already in this list.'
                    );
                }
            }
        }

        /*
         * 10. Grounded fallback.
         *
         * Use the actual card text instead of
         * inventing a fake interaction.
         */
        if (
            reasons.length === 0 &&
            description
        ) {
            const compactDescription =
                description.length > 145
                    ? `${description
                        .slice(0, 142)
                        .trim()}…`
                    : description;

            addReason(
                reasons,
                'ability',
                50,

                `Its ability — “${compactDescription}” — ` +
                `gives the deck another useful line of play.`
            );
        }

        if (reasons.length === 0) {
            addReason(
                reasons,
                'fallback',
                10,

                rank === 0
                    ? 'It has the strongest overall fit with the cards currently in your deck.'
                    : 'It scores well with the cards already in your deck while keeping the list flexible.'
            );
        }

        reasons.sort(
            (a, b) => b.score - a.score
        );

        /*
         * Return at most two reasons,
         * avoiding repeated categories.
         */
        const selectedReasons = [];
        const usedCategories = new Set();

        for (const reason of reasons) {
            if (selectedReasons.length >= 2) {
                break;
            }

            if (
                usedCategories.has(
                    reason.category
                )
            ) {
                continue;
            }

            usedCategories.add(
                reason.category
            );

            selectedReasons.push(
                reason.text
            );
        }

        return selectedReasons.join(' ');
    }

    function buildHtml(recData) {
        const labels = [
            'Best fit',
            'Great alternative',
            'Also consider'
        ];

        return `
            <div class="rec-why-list">
                ${recData
                    .map(
                        (rec, index) => `
                            <div class="rec-why-item">
                                <strong>
    ${labels[index] || 'Option'}:
    ${escapeHtml(rec.displayName)}.
</strong>

${escapeHtml(rec.why)}
                            </div>
                        `
                    )
                    .join('')}
            </div>
        `;
    }

    return {
        buildDeckContext,
        explainRecommendation,
        buildHtml
    };
})();

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getStarterCardReason(cardName) {
    const data = (cardDatabase && cardDatabase[cardName]) || {};
    const displayName = String(cardName || '').replace(/_/g, ' ');
    const desc = String(data.Description || '').trim();
    const type = String(data.Type || '').trim();
    const cardClass = String(data.Class || '').trim();

    const cost = Number(data.Cost);
    const strength = Number(data.Strength);
    const health = Number(data.Health);

    const reasons = [];

    // 1. Strongest reason: what direction the card suggests
    if (/when you play a /i.test(desc) || /all .* get \+\d+/i.test(desc)) {
        reasons.push(
            "It gives the deck a clear synergy direction right away, so the next recommendations can be much smarter."
        );
    } else if (/draw|conjure/i.test(desc)) {
        reasons.push(
            "It helps generate extra resources, which makes it a flexible card to start building around."
        );
    } else if (/destroy|bounce|transform|do \d+ damage|damage a plant|damage a zombie/i.test(desc)) {
        reasons.push(
            "It gives you interaction from the start, which can lead naturally into a strong control shell."
        );
    } else if (/heal/i.test(desc)) {
        reasons.push(
            "It points toward a slower, more survivable game plan with room for value and payoff cards."
        );
    } else if (/freeze/i.test(desc)) {
        reasons.push(
            "It opens a Freeze direction immediately, which gives the deck some very natural synergy follow-ups."
        );
    } else if (/strikethrough|double strike|frenzy/i.test(desc)) {
        reasons.push(
            "It gives the deck an aggressive angle immediately, which makes it easier to build pressure from turn one."
        );
    } else if (/make |create |another /i.test(desc)) {
        reasons.push(
            "It helps build board presence quickly, which is a strong foundation for a lot of decks."
        );
    }

    // 2. Curve-based reason
    if (Number.isFinite(cost)) {
        if (cost <= 2) {
            reasons.push(
                `At ${cost} cost, it’s easy to build your early curve around.`
            );
        } else if (cost <= 4) {
            reasons.push(
                `At ${cost} cost, it’s a nice mid-curve card that keeps your opening options flexible.`
            );
        } else {
            reasons.push(
                `At ${cost} cost, it suggests a bigger payoff deck, so the rest of the list can be built to support it.`
            );
        }
    }

    // 3. Stat efficiency fallback
    if (
        Number.isFinite(cost) &&
        cost > 0 &&
        Number.isFinite(strength) &&
        Number.isFinite(health) &&
        (strength + health) / cost >= 2.5
    ) {
        reasons.push(
            `Its ${strength}/${health} body is efficient for ${cost}, so you aren’t sacrificing tempo to start with it.`
        );
    }

    // 4. Description fallback
    if (reasons.length === 0 && desc) {
        const shortDesc =
            desc.length > 135 ? `${desc.slice(0, 132).trim()}…` : desc;

        reasons.push(
            `Its ability — “${shortDesc}” — gives the deck a clear identity from the very first pick.`
        );
    }

    // 5. Final fallback
    if (reasons.length === 0) {
        reasons.push(
            `${displayName} is a solid starting point for a ${cardClass || 'PvZ Heroes'} deck.`
        );
    }

    // Keep it concise
    return reasons.slice(0, 2).join(' ');
}

function buildStarterSuggestion(cardName) {
    const data = (cardDatabase && cardDatabase[cardName]) || {};
    const displayName = String(cardName || '').replace(/_/g, ' ');
    const why = getStarterCardReason(cardName);

    let targetCopies = 2;

    if (
        typeof cardAverageCopies !== 'undefined' &&
        cardAverageCopies &&
        cardAverageCopies[cardName] &&
        cardAverageCopies[cardName].appearances > 0
    ) {
        targetCopies = Math.round(
            cardAverageCopies[cardName].total /
            cardAverageCopies[cardName].appearances
        );
    }

    targetCopies = Math.max(1, Math.min(targetCopies, 4));

    const html = `
        <div class="starter-suggestion-wrap">
            <div class="rec-row starter-rec-row">
                <div class="rec-card starter-rec-card" style="--d: 0ms;">
                    <span class="rec-badge gold">Starter</span>

                    <img
                        src="card_images/${cardName}.png"
                        alt="${escapeHtml(displayName)}"
                        title="${escapeHtml(displayName)}"
                        onerror="this.onerror=null; this.src='card_images/${cardName}.webp';"
                    >

                    <button
                        class="add-rec-btn generate-btn starter-add-btn"
                        data-name="${cardName}"
                        data-class="${escapeHtml(data.Class || '')}"
                        data-amount="${targetCopies}"
>
    +${targetCopies}
                    </button>
                </div>
            </div>

            <div class="starter-why">
                <strong>Maybe start with ${escapeHtml(displayName)}.</strong>
                ${escapeHtml(why)}
            </div>
        </div>
    `;

    return {
        html,
        name: cardName,
        cardClass: data.Class || '',
        targetCopies
    };
}
/* ==============================================================
   COMPLETED DECK GAME-PLAN ANALYSIS
   Paste below SmartRecWhy and above triggerAICoPilot().
   ============================================================== */

const SmartDeckPlan = (() => {
    const ROLE_PATTERNS = {
        draw:
            /\bdraw\b|\bconjure\b/i,

        removal:
            /\bdestroy\b|\bbounce\b|\btransform\b|\bdo(?:es)? \d+ damage\b|\bgets? -\d+/i,

        tempo:
            /\bfreeze\b|\bbounce\b|\bmove (?:a|an|the|another)\b/i,

        heal:
            /\bheal\b/i,

        ramp:
            /\bextra sun\b|\bgain(?:s)? \+?\d+ sun\b|\bcosts? less\b/i,

        buff:
            /\bget(?:s)? \+\d+|\ball .* get \+\d+|\bdouble .* strength\b/i,

        swarm:
            /\bmake (?:a|an|another|\d+)\b|\bcreate (?:a|an|another|\d+)\b/i,

        reach:
            /\bstrikethrough\b|\bovershoot\b|\bdouble strike\b|\bfrenzy\b|\bhero\b.*\bdamage\b|\bdamage\b.*\bhero\b/i,

        protection:
            /\buntrickable\b|\barmored\b|\bteam-up\b|\bcan't be hurt\b/i
    };

    /*
     * Text-level tell for a conditionally-worded card ("if you have...",
     * "as long as...", etc.). A card can share a tag/tribe with the rest
     * of the deck and still be dead unless its condition is met, which a
     * simple tag-overlap count won't catch on its own.
     */
    const SITUATIONAL_PATTERN =
        /\bif you have\b|\bonly if\b|\bas long as\b|\brequires?\b|\bif this is\b|\bif there (?:is|are)\b/i;

    function getSituationalCards(cards) {
        return cards.filter(card =>
            SITUATIONAL_PATTERN.test(card.description || '')
        );
    }

    function safe(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function displayName(name) {
        return String(name || '').replace(/_/g, ' ');
    }

    function normalize(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[’‘]/g, "'")
            .replace(/[^a-z0-9+'/-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function mentions(text, term) {
        const source = ` ${normalize(text)} `;
        const word = normalize(term);

        if (!word) {
            return false;
        }

        const forms = [word];

        if (
            word.endsWith('y') &&
            !/[aeiou]y$/.test(word)
        ) {
            forms.push(`${word.slice(0, -1)}ies`);
        } else if (
            /(s|x|z|ch|sh)$/.test(word)
        ) {
            forms.push(`${word}es`);
        } else {
            forms.push(`${word}s`);
        }

        return forms.some(
            form => source.includes(` ${form} `)
        );
    }

    function formatNames(cards, limit = 2) {
        const names = [
            ...new Set(
                cards
                    .filter(Boolean)
                    .map(card =>
                        typeof card === 'string'
                            ? displayName(card)
                            : card.displayName
                    )
            )
        ].slice(0, limit);

        if (names.length === 0) {
            return '';
        }

        if (names.length === 1) {
            return `<strong>${safe(names[0])}</strong>`;
        }

        return (
            `<strong>${safe(names[0])}</strong> and ` +
            `<strong>${safe(names[1])}</strong>`
        );
    }

    function sortUsefulCards(cards) {
        return [...cards].sort((a, b) => {
            /*
             * Prefer cards with more copies.
             * Break ties by preferring the cheaper card.
             */
            const copyDifference =
                (b.count || 0) - (a.count || 0);

            if (copyDifference !== 0) {
                return copyDifference;
            }

            return (
                (Number(a.cost) || 99) -
                (Number(b.cost) || 99)
            );
        });
    }

    function cardsWithRole(cards, role) {
        const pattern =
            ROLE_PATTERNS[role];

        if (!pattern) {
            return [];
        }

        return sortUsefulCards(
            cards.filter(card => {
                const searchable =
                    `${card.description || ''} ` +
                    `${card.data?.Type || ''}`;

                return pattern.test(searchable);
            })
        );
    }

    /*
     * Guide-derived one-cost targets by archetype.
     * (r/PvZH deck building guidelines, section 1 "Curve":
     * Aggro 11-14x, Midrange 6-10x, Control 4-8x one-cost cards.)
     */
    const ONE_COST_BAND_BY_ARCHETYPE = {
        aggro: { min: 11, max: 14 },
        midrange: { min: 6, max: 10 },
        control: { min: 4, max: 8 },
        tempo: { min: 6, max: 10 },
        synergy: { min: 6, max: 10 }
    };

    const plantClasses = new Set(
        ['Guardian', 'Kabloom', 'Mega-Grow', 'Smarty', 'Solar']
    );

    function getOneCostCount(cards) {
        return cards.reduce(
            (total, card) =>
                card.cost === 1
                    ? total + (card.count || 0)
                    : total,
            0
        );
    }

    /*
     * Best-effort faction read from the cards actually in the deck,
     * since tricks-vs-one-drops guidance (guide section 1) differs
     * for Zombies vs Plants.
     */
    function getFaction(cards) {
        let plantCopies = 0;
        let zombieCopies = 0;

        cards.forEach(card => {
            const cardClass = card.data?.Class;

            if (!cardClass) {
                return;
            }

            if (plantClasses.has(cardClass)) {
                plantCopies += card.count || 0;
            } else {
                zombieCopies += card.count || 0;
            }
        });

        if (plantCopies === 0 && zombieCopies === 0) {
            return null;
        }

        return plantCopies >= zombieCopies ? 'Plant' : 'Zombie';
    }

    function getCurveGaps(cards, upTo = 4) {
        const counts = {};

        cards.forEach(card => {
            if (Number.isFinite(card.cost)) {
                counts[card.cost] =
                    (counts[card.cost] || 0) +
                    (card.count || 0);
            }
        });

        const gaps = [];

        for (let cost = 1; cost <= upTo; cost++) {
            if (!counts[cost]) {
                gaps.push(cost);
            }
        }

        return gaps;
    }

    /*
     * Trick-type cards (instant-speed answers), which Zombies can lean
     * on in place of one-drops per guide section 1.
     */
    function getTrickCards(cards) {
        return cards.filter(card =>
            /\btrick\b/i.test(card.data?.Type || '')
        );
    }

    /*
     * Grounded, guide-based concerns instead of unconditional praise.
     * Returns at most 3 notes so the review stays scannable.
     */
    function buildWeaknesses({
        archetype,
        cards,
        totalCards,
        oneCostCount,
        faction,
        curveGaps,
        finisherCards,
        removalCards,
        stallCards,
        situationalCoreCards
    }) {
        const notes = [];
        const safeStallCards = stallCards || [];
        const safeSituationalCoreCards = situationalCoreCards || [];

        if (totalCards < 20) {
            return notes;
        }

        /*
         * 1. Curve: one-cost count vs. the guide's band for this archetype.
         */
        const band = ONE_COST_BAND_BY_ARCHETYPE[archetype];

        if (band && oneCostCount < band.min) {
            const trickCount = getTrickCards(cards)
                .reduce((sum, card) => sum + (card.count || 0), 0);

            if (faction === 'Zombie' && trickCount >= 4) {
                notes.push(
                    `Only ${oneCostCount} one-cost cards, under the ` +
                    `${band.min}-${band.max} a ${archetype} deck usually wants. ` +
                    `${trickCount} tricks help cover early plays instead, which is a ` +
                    `normal Zombie trade-off, but double check it's actually enough.`
                );
            } else if (faction === 'Zombie') {
                notes.push(
                    `Only ${oneCostCount} one-cost cards and not many tricks either. ` +
                    `Zombies can answer the early game with either, but running short ` +
                    `on both risks losing to an early Lima, Cliques or Sun-Shroom.`
                );
            } else {
                notes.push(
                    `Only ${oneCostCount} one-cost cards, under the ` +
                    `${band.min}-${band.max} that usually works for a ${archetype} deck. ` +
                    `That can make the first couple of turns inconsistent.`
                );
            }
        } else if (band && oneCostCount > band.max + 3) {
            notes.push(
                `${oneCostCount} one-cost cards is well above the ` +
                `${band.min}-${band.max} a ${archetype} deck typically needs. ` +
                `Not automatically a problem, but worth checking those extra copies ` +
                `still do something once the game goes long.`
            );
        }

        if (curveGaps.length > 0) {
            notes.push(
                `No cards at ${curveGaps.map(c => `${c}-cost`).join(' or ')} right now, ` +
                `which can leave a hole in the curve for the opponent to play into.`
            );
        }

        /*
         * 2. Finishing power: guide section 3 expects 2-4 finishers,
         *    matched to the deck's pace.
         */
        if (finisherCards.length === 0) {
            notes.push(
                `No card stands out as a finisher yet. Most decks want 2-4 cards that ` +
                `can reliably close the game once the board stalls.`
            );
        } else if (
            (archetype === 'aggro' || archetype === 'tempo') &&
            finisherCards.every(card => Number(card.cost) >= 6)
        ) {
            notes.push(
                `${formatNames(finisherCards)} ` +
                `${finisherCards.length === 1 ? 'is' : 'are'} the only real finisher${
                    finisherCards.length === 1 ? '' : 's'
                }, and ${finisherCards.length === 1 ? 'it costs' : 'they cost'} 6 or more. ` +
                `That's a slow finisher for a ${archetype} deck; it often arrives after ` +
                `the game is already decided.`
            );
        }

        /*
         * 3. Removal is reactive by nature (guide section 4) and suits
         *    control/midrange decks, which usually want some on hand.
         */
        if (
            (archetype === 'control' || archetype === 'midrange') &&
            removalCards.length === 0
        ) {
            notes.push(
                `No clear removal or answers yet. ${
                    archetype === 'control' ? 'Control' : 'Midrange'
                } decks generally win by surviving to a payoff, so some way to deal ` +
                `with the opponent's best play is usually worth the slot.`
            );
        }

        /*
         * 4. Stall capacity: if the deck's closing power is slow
         *    (finisherCards skew expensive, per the check above) and
         *    there is no removal, freeze/bounce, or reach to slow the
         *    opponent down, the deck has no way to safely wait for
         *    "the right turn" to close. That's a different problem
         *    than not having a finisher at all, so it needs its own note.
         */
        const hasSlowFinisher =
            finisherCards.length > 0 &&
            finisherCards.every(card => Number(card.cost) >= 6);

        if (
            (archetype === 'aggro' || archetype === 'tempo') &&
            safeStallCards.length === 0 &&
            finisherCards.length > 0 &&
            !hasSlowFinisher
        ) {
            notes.push(
                `${formatNames(finisherCards)} ${
                    finisherCards.length === 1 ? 'is' : 'are'
                } the closing power, but there's no removal, freeze/bounce or reach ` +
                `to slow the opponent down while you wait for a good turn to play ` +
                `${finisherCards.length === 1 ? 'it' : 'them'}. In an ${archetype} deck ` +
                `with no way to stall, that usually means closing as soon as the curve ` +
                `allows rather than sitting on it.`
            );
        }

        /*
         * 5. Narrow/situational cards counted as "core": a card can share
         *    a tag or tribe with the rest of the deck and still be a dead
         *    draw if its condition isn't met on the turns a fast curve
         *    wants to play it. Tag overlap alone won't catch that.
         */
        const situationalCopies =
            safeSituationalCoreCards.reduce(
                (sum, card) => sum + (card.count || 0),
                0
            );

        if (
            (archetype === 'aggro' || archetype === 'tempo') &&
            situationalCopies >= 4
        ) {
            notes.push(
                `${formatNames(safeSituationalCoreCards)} ${
                    safeSituationalCoreCards.length === 1 ? 'is' : 'are'
                } counted toward the deck's synergy, but ${
                    safeSituationalCoreCards.length === 1 ? 'its' : 'their'
                } text is conditional. Worth checking that condition is actually met ` +
                `on the turn an ${archetype} curve wants to play ${
                    safeSituationalCoreCards.length === 1 ? 'it' : 'them'
                }, not just that ${
                    safeSituationalCoreCards.length === 1 ? 'it shares' : 'they share'
                } a tag with the rest of the list.`
            );
        }

        return notes.slice(0, 3);
    }

    function getCompletedCombos(cards) {
        if (
            typeof comboDictionary === 'undefined' ||
            !Array.isArray(comboDictionary)
        ) {
            return [];
        }

        const deckNames = new Set(
            cards.map(card => card.name)
        );

        return comboDictionary.filter(combo => {
            return (
                Array.isArray(combo?.cards) &&
                combo.cards.length >= 2 &&
                combo.cards.every(name =>
                    deckNames.has(name)
                )
            );
        });
    }

    function getCoreCards(
        cards,
        dominantTribe,
        completedCombos
    ) {
        const comboCards = new Set();

        completedCombos.forEach(combo => {
            combo.cards.forEach(name =>
                comboCards.add(name)
            );
        });

        return [...cards]
            .map(card => {
                let score = 0;

                if (comboCards.has(card.name)) {
                    score += 35;
                }

                if (
                    dominantTribe &&
                    mentions(
                        card.description,
                        dominantTribe.name
                    )
                ) {
                    score += 30;
                }

                if (
                    card.mechanics?.includes('draw') ||
                    card.mechanics?.includes('conjure')
                ) {
                    score += 10;
                }

                if (
                    card.mechanics?.includes('buff')
                ) {
                    score += 10;
                }

                score += Math.min(
                    card.count || 0,
                    4
                );

                return {
                    ...card,
                    planScore: score
                };
            })
            .filter(card =>
                card.planScore > 5
            )
            .sort(
                (a, b) =>
                    b.planScore -
                    a.planScore
            );
    }

    function getFinisherCards(cards) {
        return [...cards]
            .filter(card => {
                const description =
                    card.description || '';

                const expensive =
                    Number.isFinite(card.cost) &&
                    card.cost >= 6;

                const finishingAbility =
                    ROLE_PATTERNS.reach.test(description) ||
                    /\ball .* get \+\d+/i.test(description) ||
                    /\bdouble .* strength\b/i.test(description);

                return expensive || finishingAbility;
            })
            .sort((a, b) => {
                const costDifference =
                    (Number(b.cost) || 0) -
                    (Number(a.cost) || 0);

                if (costDifference !== 0) {
                    return costDifference;
                }

                return (
                    (b.count || 0) -
                    (a.count || 0)
                );
            });
    }

    function determineArchetype(
        context,
        completedCombos,
        dominantTribe,
        payoffCards
    ) {
        const cards =
            context.cards || [];

        const averageCost =
            context.costedCopies > 0
                ? context.weightedCost /
                  context.costedCopies
                : 0;

        const tempoCount =
            cardsWithRole(cards, 'tempo')
                .reduce(
                    (sum, card) =>
                        sum + card.count,
                    0
                );

        /*
         * A coherent tribal package or complete known combo
         * deserves to be described as a synergy deck.
         */
        if (
            completedCombos.length > 0 ||
            (
                dominantTribe &&
                payoffCards.length >= 2
            )
        ) {
            return 'synergy';
        }

        if (context.archetype === 'fast') {
            return 'aggro';
        }

        if (context.archetype === 'control') {
            return 'control';
        }

        if (
            tempoCount >= 5 &&
            averageCost <= 3.6
        ) {
            return 'tempo';
        }

        return 'midrange';
    }

    function buildIdentity({
        archetype,
        averageCost,
        dominantTribe,
        completedCombos,
        coreCards
    }) {
        const averageText =
            averageCost > 0
                ? averageCost.toFixed(1)
                : null;

        if (
            archetype === 'synergy' &&
            dominantTribe
        ) {
            return (
                `This is a polished ` +
                `<strong>${safe(dominantTribe.name)} synergy deck</strong>. ` +
                `It runs ${dominantTribe.count} ` +
                `${safe(dominantTribe.name)} cards, so its payoffs ` +
                `are supported by real deck density rather than isolated combos.`
            );
        }

        if (
            archetype === 'synergy' &&
            completedCombos.length > 0
        ) {
            return (
                `This is a polished <strong>synergy deck</strong> ` +
                `built around ${formatNames(coreCards)}. ` +
                `The important pieces reinforce one another instead of ` +
                `functioning as unrelated good cards.`
            );
        }

        if (archetype === 'aggro') {
            return (
                `This is a polished <strong>aggro deck</strong>` +
                (
                    averageText
                        ? ` with a ${averageText} average cost`
                        : ''
                ) +
                `. The curve is low enough to apply pressure immediately ` +
                `without running out of meaningful plays.`
            );
        }

        if (archetype === 'control') {
            return (
                `This is a polished <strong>control deck</strong>` +
                (
                    averageText
                        ? ` with a ${averageText} average cost`
                        : ''
                ) +
                `. It is built to absorb the opponent's strongest turns, ` +
                `trade efficiently and take over once resources begin to run low.`
            );
        }

        if (archetype === 'tempo') {
            return (
                `This is a polished <strong>tempo deck</strong>. ` +
                `It develops its own board while repeatedly disrupting ` +
                `the opponent's lanes, allowing a small advantage to keep growing.`
            );
        }

        return (
            `This is a polished <strong>midrange deck</strong>` +
            (
                averageText
                    ? ` with a ${averageText} average cost`
                    : ''
            ) +
            `. It can contest the early board, make strong plays on curve ` +
            `and still carry enough power to win longer games.`
        );
    }

    function buildGamePlan({
        archetype,
        cards,
        dominantTribe,
        payoffCards,
        coreCards
    }) {
        const earlyCards =
            sortUsefulCards(
                cards.filter(card =>
                    Number.isFinite(card.cost) &&
                    card.cost <= 2
                )
            );

        const removalCards =
            cardsWithRole(cards, 'removal');

        const tempoCards =
            cardsWithRole(cards, 'tempo');

        const buffCards =
            cardsWithRole(cards, 'buff');

        const usefulEarlyNames =
            formatNames(earlyCards);

        if (
            archetype === 'synergy' &&
            dominantTribe
        ) {
            const payoffPool =
                payoffCards.length
                    ? payoffCards
                    : coreCards;

            /*
             * formatNames only ever names the first two cards in the
             * pool, so sequencing advice has to match THOSE cards, not
             * the pool's theme in the abstract. A cheap payoff (e.g. a
             * 1-2 cost card) is a curve-filler you play early and grow
             * into, not a card you hold back for a built board.
             */
            const namedPayoffs =
                payoffPool.slice(0, 2);

            const namedPayoffsAreCheap =
                namedPayoffs.length > 0 &&
                namedPayoffs.every(card =>
                    Number.isFinite(card.cost) &&
                    card.cost <= 2
                );

            const payoffNames =
                formatNames(payoffPool);

            if (namedPayoffsAreCheap) {
                return (
                    `Play ${payoffNames || 'your payoff cards'} on curve as one of ` +
                    `your first plays rather than holding it back. At that cost it ` +
                    `works as a curve-filler that gets better as your ` +
                    `${safe(dominantTribe.name)} count grows, not a card that needs ` +
                    `an established board to be worth playing. Keep adding ` +
                    `${safe(dominantTribe.name)} cards behind it to raise its value ` +
                    `over the course of the game.`
                );
            }

            return (
                `Develop your ${safe(dominantTribe.name)} cards first, ` +
                `then play ${payoffNames || 'your payoff cards'} ` +
                `when they can immediately reward an established board. ` +
                `You do not need to rush the payoff onto an empty field.`
            );
        }

        if (archetype === 'synergy') {
            return (
                `Prioritize the pieces that establish the deck's engine, ` +
                `especially ${formatNames(coreCards)}. ` +
                `Once the core interaction is online, use the rest of the list ` +
                `to protect that advantage rather than forcing unnecessary trades.`
            );
        }

        if (archetype === 'aggro') {
            const pressureCards =
                buffCards.length
                    ? formatNames(buffCards)
                    : usefulEarlyNames;

            return (
                `Lead with ${usefulEarlyNames || 'your cheapest threats'}, ` +
                `keep more than one lane under pressure and use ` +
                `${pressureCards || 'your pressure tools'} ` +
                `to turn an ordinary board into a threatening one.`
            );
        }

        if (archetype === 'control') {
            const answerCards =
                removalCards.length
                    ? formatNames(removalCards)
                    : formatNames(tempoCards);

            return (
                `Do not race unless the opening demands it. ` +
                `Use ${answerCards || 'your interaction'} ` +
                `to answer the opponent's most important threats, ` +
                `preserve your life total and force them to run out of pressure first.`
            );
        }

        if (archetype === 'tempo') {
            const disruption =
                formatNames(
                    tempoCards.length
                        ? tempoCards
                        : removalCards
                );

            return (
                `Establish a threat, then use ` +
                `${disruption || 'your disruption cards'} ` +
                `to interfere with the opponent while your existing board keeps attacking. ` +
                `The goal is to stay one turn ahead, not to answer everything forever.`
            );
        }

        return (
            `Contest the board with ${usefulEarlyNames || 'your early cards'}, ` +
            `take favorable trades and continue adding stronger threats on curve. ` +
            `The deck is at its best when it makes the opponent answer you ` +
            `without giving up control of the lanes.`
        );
    }

    function buildWinCondition({
        archetype,
        cards,
        finisherCards
    }) {
        const reachCards =
            cardsWithRole(cards, 'reach');

        const buffCards =
            cardsWithRole(cards, 'buff');

        if (finisherCards.length > 0) {
            return (
                `Your closing power comes from ` +
                `${formatNames(finisherCards)}. ` +
                `Save those cards for a turn where they create immediate pressure ` +
                `or punish an opponent who has already spent their best answers.`
            );
        }

        if (reachCards.length > 0) {
            return (
                `Once the opponent is low, ` +
                `${formatNames(reachCards)} ` +
                `lets you finish through a stalled board. ` +
                `Count that damage before committing to another trade.`
            );
        }

        if (buffCards.length > 0) {
            return (
                `The deck usually closes by building a wide board and turning it into ` +
                `lethal pressure with ${formatNames(buffCards)}. ` +
                `Protecting several modest threats is often better than relying on one large card.`
            );
        }

        if (archetype === 'control') {
            return (
                `The win condition is resource advantage. ` +
                `Once the opponent has fewer useful cards and fewer developed lanes, ` +
                `almost any surviving threat can finish the game.`
            );
        }

        return (
            `The deck wins by maintaining board control until repeated favorable trades ` +
            `leave the opponent unable to recover.`
        );
    }

    function buildStrength({
        cards,
        dominantTribe,
        payoffCards,
        completedCombos
    }) {
        const drawCards =
            cardsWithRole(cards, 'draw');

        const removalCards =
            cardsWithRole(cards, 'removal');

        if (
            dominantTribe &&
            payoffCards.length > 0
        ) {
            return (
                `The list is especially coherent because ` +
                `${dominantTribe.count} ${safe(dominantTribe.name)} cards support ` +
                `${formatNames(payoffCards)}. ` +
                `That makes the deck's main synergy reliable from game to game.`
            );
        }

        if (completedCombos.length > 0) {
            const comboNames =
                completedCombos[0].cards
                    .map(displayName)
                    .map(safe);

            return (
                `Its strongest interaction is ` +
                `<strong>${comboNames.join(' plus ')}</strong>. ` +
                `Because every piece is already useful on its own, ` +
                `the deck does not collapse when the full combination is not drawn.`
            );
        }

        if (
            drawCards.length > 0 &&
            removalCards.length > 0
        ) {
            return (
                `The deck has a complete support package. ` +
                `${formatNames(drawCards)} keeps cards flowing, while ` +
                `${formatNames(removalCards)} prevents opposing swing turns.`
            );
        }

        if (drawCards.length > 0) {
            return (
                `${formatNames(drawCards)} gives the deck enough resource generation ` +
                `to keep making meaningful plays after the opening hand is gone.`
            );
        }

        if (removalCards.length > 0) {
            return (
                `${formatNames(removalCards)} gives the deck reliable answers ` +
                `without distracting from its main game plan.`
            );
        }

        return (
            `The list is focused. Most cards contribute directly to the same plan, ` +
            `so there are very few draws that feel disconnected from the rest of the deck.`
        );
    }

    function buildHtml() {
        if (
            typeof SmartRecWhy === 'undefined' ||
            typeof SmartRecWhy.buildDeckContext !== 'function'
        ) {
            return `
                <strong>I would keep this list exactly as it is.</strong>
                The deck has a focused curve, a clear game plan and no obvious weak link.
            `;
        }

        const context =
            SmartRecWhy.buildDeckContext();

        const cards =
            context.cards || [];

        if (cards.length === 0) {
            return `
                <strong>I would keep this list exactly as it is.</strong>
                The deck has a clear plan and no obvious weak link.
            `;
        }

        const averageCost =
            context.costedCopies > 0
                ? context.weightedCost /
                  context.costedCopies
                : 0;

        const tribeEntries =
            Object.entries(
                context.tribeCopies || {}
            )
                .map(([name, count]) => ({
                    name,
                    count
                }))
                .sort(
                    (a, b) =>
                        b.count - a.count
                );

        /*
         * Only call something a dominant tribe if it
         * occupies a meaningful part of the 40-card deck.
         */
        const dominantTribe =
            tribeEntries.find(
                tribe =>
                    tribe.count >= 6
            ) || null;

        const completedCombos =
            getCompletedCombos(cards);

        const payoffCards =
            dominantTribe
                ? sortUsefulCards(
                    cards.filter(card =>
                        mentions(
                            card.description,
                            dominantTribe.name
                        )
                    )
                )
                : [];

        const coreCards =
            getCoreCards(
                cards,
                dominantTribe,
                completedCombos
            );

        const finisherCards =
            getFinisherCards(cards);

        const archetype =
            determineArchetype(
                context,
                completedCombos,
                dominantTribe,
                payoffCards
            );

        const identity =
            buildIdentity({
                archetype,
                averageCost,
                dominantTribe,
                completedCombos,
                coreCards
            });

        const gamePlan =
            buildGamePlan({
                archetype,
                cards,
                dominantTribe,
                payoffCards,
                coreCards
            });

        const winCondition =
            buildWinCondition({
                archetype,
                cards,
                finisherCards
            });

        const strength =
            buildStrength({
                cards,
                dominantTribe,
                payoffCards,
                completedCombos
            });

        const removalCards =
            cardsWithRole(cards, 'removal');

        const tempoCardsForStall =
            cardsWithRole(cards, 'tempo');

        const reachCardsForStall =
            cardsWithRole(cards, 'reach');

        /*
         * Anything that can slow the opponent down or race through a
         * stalled board — dedup by name since a card can match more
         * than one role pattern.
         */
        const stallCards =
            [...new Map(
                [
                    ...removalCards,
                    ...tempoCardsForStall,
                    ...reachCardsForStall
                ].map(card => [card.name, card])
            ).values()];

        const corePool =
            [...new Map(
                [...coreCards, ...payoffCards]
                    .map(card => [card.name, card])
            ).values()];

        const situationalCoreCards =
            getSituationalCards(corePool);

        const weaknesses =
            buildWeaknesses({
                archetype,
                cards,
                totalCards: context.totalCards,
                oneCostCount: getOneCostCount(cards),
                faction: getFaction(cards),
                curveGaps: getCurveGaps(cards),
                finisherCards,
                removalCards,
                stallCards,
                situationalCoreCards
            });

        const headline =
            weaknesses.length === 0
                ? `<strong>I would keep this list exactly as it is.</strong>`
                : `<strong>The core plan is solid, but a few things are worth double-checking.</strong>`;

        const weaknessSection =
            weaknesses.length > 0
                ? `
                <div class="deck-plan-section">
                    <strong>Worth reconsidering:</strong>
                    <ul class="deck-plan-weakness-list">
                        ${weaknesses
                            .map(note => `<li>${note}</li>`)
                            .join('')}
                    </ul>
                </div>
                `
                : '';

        return `
            ${headline}

            <div class="deck-plan-summary">
                <div class="deck-plan-intro">
                    ${identity}
                </div>

                <div class="deck-plan-section">
                    <strong>Game plan:</strong>
                    ${gamePlan}
                </div>

                <div class="deck-plan-section">
                    <strong>How it wins:</strong>
                    ${winCondition}
                </div>

                <div class="deck-plan-section">
                    <strong>Why it works:</strong>
                    ${strength}
                </div>
                ${weaknessSection}
            </div>
        `;
    }

    return {
        buildHtml
    };
})();
    function triggerAICoPilot() {
        window.activeSwapTarget = null;
        const chatFeed = document.getElementById('aiChatFeed');
        if (!chatFeed) return;

       if (currentSeeds.length === 0) {
    const cardNames = Object.keys(cardDatabase || {});

    if (cardNames.length === 0) {
        chatFeed.innerHTML = daveSay(`
            Heey I'm Craaaazy Dave! I'm the best at creating amazing PvZ Heroes decks!
            Pick any card to get started.
        `);

        return;
    }

    /*
     * Keep the real database key here.
     * Only remove underscores for display.
     */
    const randomCard =
        cardNames[Math.floor(Math.random() * cardNames.length)];

    const data =
        cardDatabase[randomCard] || {};

    const displayName =
        randomCard.replace(/_/g, ' ');

    const why =
        getStarterCardReason(randomCard);

    let starterTargetCopies = 3;

const starterAverageData =
    typeof cardAverageCopies !== "undefined"
        ? cardAverageCopies?.[randomCard]
        : null;

if (starterAverageData?.appearances > 0) {
    starterTargetCopies = Math.round(
        starterAverageData.total /
        starterAverageData.appearances
    );
}

starterTargetCopies = Math.max(
    1,
    Math.min(starterTargetCopies, 4)
);

    

    /*
     * Same speech-bubble presentation as the
     * normal top-three recommendation explanations.
     */
    const dialogue = `
        Heey I'm Craaaazy Dave! I'm the best at creating amazing PvZ Heroes decks!
        Pick any card to get started, or try this one.

        <div class="rec-why-list starter-why-list">
            <div class="rec-why-item">
                <strong>
                    Starter pick: ${escapeHtml(displayName)}
                </strong>

                <div class="rec-why-text">
                    ${escapeHtml(why)}
                </div>
            </div>
        </div>
    `;

    let htmlString =
        daveSay(dialogue);

    /*
     * Use the exact same card-row structure as
     * the normal top-three recommendations.
     */
    htmlString += `
        <div class="rec-row starter-rec-row">
            <div class="rec-card starter-rec-card" style="--d: 0ms;">
                <span class="rec-badge gold">
                    Starter
                </span>

                <img
                    src="card_images/${randomCard}.png"
                    alt="${escapeHtml(displayName)}"
                    title="${escapeHtml(displayName)}"
                    onerror="this.onerror=null; this.src='card_images/${randomCard}.webp';"
                >

                <button
                    class="add-rec-btn generate-btn"
                    data-name="${randomCard}"
                    data-class="${escapeHtml(data.Class || '')}"
                    data-amount="${starterTargetCopies}"
>
    +${starterTargetCopies}
                </button>
            </div>
        </div>
    `;

    chatFeed.innerHTML =
        htmlString;

    const starterButton =
        chatFeed.querySelector(
            '.starter-rec-row .add-rec-btn'
        );

    if (starterButton) {
        starterButton.addEventListener(
            'click',
            event => {
                const button =
                    event.currentTarget;

                const amount =
                    parseInt(
                        button.getAttribute('data-amount'),
                        10
                    ) || 1;

                addSeed(
                    button.getAttribute('data-name'),
                    button.getAttribute('data-class'),
                    currentFaction,
                    amount
                );
            }
        );
    }

    return;
}

        if (getTotalCards() >= 40) {
            const closestDeck = getClosestDeckMatch();
            let baseHtml = "";

            if (!closestDeck) {
                baseHtml = daveSay(`Your deck is complete! I could not find a close match in the deck database.`);
            } else {
                const deckName = (closestDeck.name || "").trim();
                const uploadDate = closestDeck.upload_date || "Unknown date";

                if (closestDeck.youtube_url) {
                    baseHtml = daveSay(`
                    Your deck is complete! Your deck is closest to
                    <a href="${closestDeck.youtube_url}" target="_blank" rel="noopener noreferrer">${deckName}</a>
                    from ${uploadDate}
                    <span class="bubble-sub">Video: ${closestDeck.youtube_title || "YouTube deck video"}</span>
                `);
                } else {
                    baseHtml = daveSay(`
                    Your deck is complete! Your deck is closest to
                    <strong style="color: var(--accent, #4CAF50);">${deckName}</strong>
                    (from ${uploadDate}).
                `);
                }
            }

            // Show thinking bubble immediately so the UI doesn't feel frozen
            chatFeed.innerHTML = baseHtml + daveThinking("Hmm, let me study this deck...");

            // Yield the main thread so the browser paints the thinking bubble
            setTimeout(() => {
                initSynergyMatrix();

                const ctx = typeof getVerdictContext === "function" ? getVerdictContext() : {};

                const currentDeckStrings = currentSeeds.map(s => `${s.count}x ${s.name}`);
                const baselineVerdict = getDeckVerdictFromCards(currentDeckStrings, null, ctx);
                const baselineScore = baselineVerdict.score;

                let bestSwapIdea = null;
                let maxImprovement = 0;

                currentSeeds.forEach(seed => {
                    const recommendations = getTopThreeRecommendations(seed.name);

                    recommendations.forEach(rec => {
                        // If this deck was just built from the user's
                        // collection, don't turn around and suggest a card
                        // they don't own - that directly contradicts what
                        // "build from collection" is supposed to mean. Only
                        // suggest swaps to cards they already have enough
                        // copies of.
                        if (deckBuiltFromCollection) {
                            const neededCopies = rec.suggestedAmount || seed.count;
                            const owned = (typeof ownedCollection === 'object' && ownedCollection)
                                ? (ownedCollection[rec.name] || 0)
                                : 0;
                            if (owned < neededCopies) return;
                        }

                        const simulatedStrings = currentSeeds.map(s => {
                            if (s.name === seed.name) return `${s.count}x ${rec.name}`;
                            return `${s.count}x ${s.name}`;
                        });

                        const simVerdict = getDeckVerdictFromCards(simulatedStrings, null, ctx);
                        const simScore = simVerdict.score;
                        const improvement = simScore - baselineScore;

                        if (improvement > maxImprovement) {
                            maxImprovement = improvement;
                            bestSwapIdea = {
    removeCard: seed.name,
    addCard: rec.name,
    neededCopies: rec.suggestedAmount || seed.count,
    oldScore: baselineScore,
    newScore: simScore,
    improvementText: getMainSwapImprovement(baselineVerdict, simVerdict)
};
                        }
                    });
                });

                // --- Spark/crafting awareness for the winning swap idea ---
                let craftInfo = null;
                if (bestSwapIdea) {
                    const addName = bestSwapIdea.addCard;
                    const neededCopies = bestSwapIdea.neededCopies;
                    const owned = (typeof ownedCollection === 'object' && ownedCollection) ? (ownedCollection[addName] || 0) : 0;
                    const missing = Math.max(0, neededCopies - owned);

                    if (missing > 0) {
                        const perCopyCraftCost = sparkCostFor(addName);
                        const craftCost = perCopyCraftCost * missing;
                        const knowsBalance = hasEnteredSparks();
                        const shortfall = knowsBalance ? Math.max(0, craftCost - ownedSparks) : craftCost;

                        craftInfo = {
                            craftCost,
                            missing,
                            affordable: knowsBalance && shortfall === 0,
                            knowsBalance,
                            scrapPlan: null
                        };

                        // Whether or not we know the user's balance, work out
                        // what it'd take to scrap-fund the gap, so we can
                        // actually answer "is this worth it" instead of just
                        // pointing at a cost number.
                        if (craftCost > 0 && shortfall > 0) {
                            const protectedNames = new Set(currentSeeds.map(s => s.name));
                            protectedNames.add(addName);
                            craftInfo.scrapPlan = findScrapSuggestions(shortfall, protectedNames);
                        }

                        // Worth-it read: how many sparks this swap costs per
                        // point of rating gained. Cheap-and-strong swaps are
                        // clearly worth it; expensive swaps for a small bump
                        // usually aren't, especially if they cost real
                        // collection value (not just banked sparks) to fund.
                        if (craftCost > 0 && maxImprovement > 0) {
                            const costPerPoint = craftCost / maxImprovement;
                            if (costPerPoint <= 150) {
                                craftInfo.verdict = 'good';
                                craftInfo.verdictText = 'Worth it — solid gain for the cost.';
                            } else if (costPerPoint <= 400) {
                                craftInfo.verdict = 'fair';
                                craftInfo.verdictText = "Fair trade, but not a slam dunk.";
                            } else {
                                craftInfo.verdict = 'steep';
                                craftInfo.verdictText = "Steep price for a gain this small — probably not worth scrapping for.";
                            }
                        }
                    }
                }

                let swapHtml = "";

                if (bestSwapIdea) {
                    const weakName = bestSwapIdea.removeCard.replace(/_/g, ' ');
                    const topName = bestSwapIdea.addCard.replace(/_/g, ' ');
                    const boostText = `+${Math.round(maxImprovement)}% rating`;

                    swapHtml = daveSay(`
    I found something! Swapping out
    <strong class="card-name-accent">${escapeHtml(weakName)}</strong>
    for
    <strong class="card-name-accent">${escapeHtml(topName)}</strong>
    should give you ${bestSwapIdea.improvementText}.
`) + `
                <div class="swap-duel">
                    <div class="swap-duel-label">Top swap idea · ${boostText}</div>
                    <div class="swap-duel-cards">
                        <div class="swap-card out">
                            <img src="card_images/${bestSwapIdea.removeCard}.png" alt="${weakName}" title="${weakName}"
                                onerror="this.onerror=null; this.src='card_images/${bestSwapIdea.removeCard}.webp';">
                            <span class="swap-tag">Out</span>
                        </div>
                        <span class="swap-arrow">➜</span>
                        <div class="swap-card in">
                            <img src="card_images/${bestSwapIdea.addCard}.png" alt="${topName}" title="${topName}"
                                onerror="this.onerror=null; this.src='card_images/${bestSwapIdea.addCard}.webp';">
                            <span class="swap-tag">In</span>
                        </div>
                    </div>
                    <button class="add-rec-btn generate-btn" data-remove="${bestSwapIdea.removeCard}" data-add="${bestSwapIdea.addCard}" data-craft-needed="${craftInfo ? '1' : '0'}">
                        ${craftInfo ? 'Review & swap' : 'Make the swap'}
                    </button>
                </div>`;

                    if (craftInfo) {
                        const verdictHtml = craftInfo.verdictText
                            ? `<div class="craft-suggestion-verdict craft-verdict-${craftInfo.verdict}">${escapeHtml(craftInfo.verdictText)}</div>`
                            : '';

                        if (craftInfo.affordable) {
                            swapHtml += `
                <div class="craft-suggestion craft-affordable">
                    <div class="craft-suggestion-label">You can craft this now</div>
                    <div class="craft-suggestion-body">
                        ${escapeHtml(topName)} costs <strong>${craftInfo.craftCost.toLocaleString()}</strong>
                        <img src="PvZH_Spark_Icon.webp" alt="Sparks" class="spark-icon"> to craft
                        (you have ${ownedSparks.toLocaleString()}).
                    </div>
                    ${verdictHtml}
                </div>`;
                        } else if (craftInfo.scrapPlan) {
                            const plan = craftInfo.scrapPlan;
                            const shortfall = craftInfo.knowsBalance
                                ? craftInfo.craftCost - ownedSparks
                                : craftInfo.craftCost;
                            const balanceLine = craftInfo.knowsBalance
                                ? `You have ${ownedSparks.toLocaleString()} sparks — short by ${shortfall.toLocaleString()}.`
                                : `You haven't told me your Sparks balance, so here's what it'd take to craft this from scratch:`;

                            if (plan.picks.length > 0) {
                                const rows = plan.picks.map(p => {
                                    const displayName = p.name.replace(/_/g, ' ');
                                    return `<li><strong>${escapeHtml(displayName)}</strong> × ${p.copies} <span class="craft-scrap-value">(+${p.sparks.toLocaleString()} <img src="PvZH_Spark_Icon.webp" alt="Sparks" class="spark-icon">)</span></li>`;
                                }).join('');

                                swapHtml += `
                <div class="craft-suggestion craft-needs-scrap">
                    <div class="craft-suggestion-label">Craft needed: ${craftInfo.craftCost.toLocaleString()} <img src="PvZH_Spark_Icon.webp" alt="Sparks" class="spark-icon"></div>
                    <div class="craft-suggestion-body">
                        ${balanceLine}
                        These barely see play, so scrap them to cover it:
                    </div>
                    <ul class="craft-scrap-list">${rows}</ul>
                    ${plan.stillShort > 0
                        ? `<div class="craft-suggestion-warning">Still short ${plan.stillShort.toLocaleString()} sparks even after scrapping everything unused in your collection.</div>`
                        : ''}
                    ${verdictHtml}
                </div>`;
                            } else {
                                swapHtml += `
                <div class="craft-suggestion craft-needs-scrap">
                    <div class="craft-suggestion-label">Craft needed: ${craftInfo.craftCost.toLocaleString()} <img src="PvZH_Spark_Icon.webp" alt="Sparks" class="spark-icon"></div>
                    <div class="craft-suggestion-body">
                        ${balanceLine}
                        Nothing obvious in your collection is worth scrapping for it yet.
                    </div>
                    ${verdictHtml}
                </div>`;
                            }
                        }
                    }
                } else {
    swapHtml = daveSay(
        SmartDeckPlan.buildHtml()
    );
}

                const baseDeckShareUrl = buildCurrentDeckShareUrl();

const deckShareUrl = baseDeckShareUrl
    ? `${baseDeckShareUrl}#crafter`
    : null;

const classArray = Array.from(activeClasses).sort();
const heroName = heroMap[classArray.join(',')] || `Unknown Hero`;

const deckLinkHtml = deckShareUrl
    ? daveSay(`
        <strong>Share this ${heroName} deck:</strong><br><br>
        <a href="${deckShareUrl}" target="_blank" rel="noopener noreferrer">${deckShareUrl}</a>
    `)
    : daveSay(`Your Deck Link could not be generated because one or more cards could not be found.`);

chatFeed.innerHTML = baseHtml + swapHtml + deckLinkHtml;

                const swapBtn = chatFeed.querySelector('.add-rec-btn[data-remove]');
                if (swapBtn) {
                    swapBtn.addEventListener('click', (e) => {
                        const removeName = e.target.getAttribute('data-remove');
                        const addName = e.target.getAttribute('data-add');

                        if (e.target.getAttribute('data-craft-needed') === '1' && craftInfo) {
                            const addDisplay = addName.replace(/_/g, ' ');
                            const lines = [`You don't have enough copies of ${addDisplay} for this swap.`];
                            lines.push(`Crafting it costs ${craftInfo.craftCost.toLocaleString()} sparks.`);

                            if (craftInfo.scrapPlan && craftInfo.scrapPlan.picks.length > 0) {
                                const scrapList = craftInfo.scrapPlan.picks
                                    .map(p => `${p.copies}x ${p.name.replace(/_/g, ' ')}`)
                                    .join(', ');
                                lines.push(`To cover it, you'd scrap: ${scrapList}.`);
                            }
                            if (craftInfo.verdictText) {
                                lines.push(craftInfo.verdictText);
                            }
                            lines.push('Make this swap anyway?');

                            if (!confirm(lines.join('\n'))) {
                                return;
                            }
                        }

                        applyFullSwap(removeName, addName);
                    });
                }
            }, 50);

            return;
        }

        // --- Deck NOT complete: greeting + 3 recommendations ---
        initSynergyMatrix();
        chatFeed.innerHTML = daveThinking("Analyzing synergies...");

        setTimeout(() => {
            const recommendations = getTopThreeRecommendations();

            if (recommendations.length === 0) {
                chatFeed.innerHTML = daveSay(`I can't find any more valid cards for this combination! Try removing a card.`);
                return;
            }

            const spaceLeft = 40 - getTotalCards();
const classArray = Array.from(activeClasses).sort();
const heroName =
    heroMap[classArray.join(',')] ||
    `a ${classArray.join(' / ')} Hero`;

/*
 * Analyze the current deck once, then use that same
 * context for all three recommendations.
 */
const recommendationContext =
    SmartRecWhy.buildDeckContext();

const recData = recommendations.map((rec, index) => {
                const displayName =
    rec.name.replace(/_/g, ' ');

const data =
    cardDatabase[rec.name];

const existingSeed =
    currentSeeds.find(
        seed => seed.name === rec.name
    );

const existingCount =
    Number.isFinite(
        Number(rec.existingCount)
    )
        ? Number(rec.existingCount)
        : existingSeed?.count || 0;

const maximumAdd =
    Math.min(
        4 - existingCount,
        spaceLeft
    );

/*
 * getTopThreeRecommendations has already decided
 * the appropriate amount.
 */
const targetCopies =
    Math.max(
        1,
        Math.min(
            rec.suggestedAmount || 1,
            maximumAdd
        )
    );

return {
    name: rec.name,
    displayName,
    data,
    targetCopies,

    existingCount,
    desiredTotal:
        rec.desiredTotal,

    why:
        SmartRecWhy.explainRecommendation(
            rec,
            recommendationContext,
            index
        )
};
            });

            // 1. Average play frequency → smart adjectives (unchanged)
            let avgFreq = 1;
            if (Object.keys(cardFrequencies).length > 0) {
                const sumFreq = Object.values(cardFrequencies).reduce((a, b) => a + b, 0);
                avgFreq = sumFreq / Object.keys(cardFrequencies).length;
            }

            let aiDialogue = "";

            // 2. Contextual greeting based on last action (unchanged)
            let comboTriggered = false;

            if (lastAddedCard) {
                const triggeredCombo = comboDictionary.find(combo =>
                    combo.cards.includes(lastAddedCard) &&
                    combo.cards.every(c => currentSeeds.some(s => s.name === c))
                );

                if (triggeredCombo) {
                    let formattedMessage = triggeredCombo.message
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>');

                    aiDialogue = formattedMessage + "<br><br>";
                    comboTriggered = true;
                }

                if (!comboTriggered) {
                    const lastNameClean = lastAddedCard.replace(/_/g, ' ');
                    const lastCardData = cardDatabase[lastAddedCard];
                    const lastClass = lastCardData ? lastCardData.Class : "Unknown";

                    const myFreq = cardFrequencies[lastAddedCard] || 0;
                    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

                    let popAdj = "";

                    if (myFreq > avgFreq * 3.0) {
                        popAdj = pickRandom([
                            "an absolute powerhouse",
                            "a ridiculously popular",
                            "an everywhere-all-at-once",
                            "a top-tier, essential"
                        ]);
                    } else if (myFreq > avgFreq * 1.8) {
                        popAdj = pickRandom([
                            "a super reliable",
                            "a heavy-hitting, competitive",
                            "a widely-used",
                            "a trusty, go-to"
                        ]);
                    } else if (myFreq > avgFreq * 0.8) {
                        popAdj = pickRandom([
                            "a solid, standard",
                            "a completely reasonable",
                            "a fair, middle-of-the-road",
                            "an okay, everyday"
                        ]);
                    } else if (myFreq > avgFreq * 0.3) {
                        popAdj = pickRandom([
                            "a pretty clunky, situational",
                            "a definitely off-meta (and maybe a bit weak)",
                            "a rarely played",
                            "a somewhat questionable"
                        ]);
                    } else {
                        popAdj = pickRandom([
                            "a bottom-of-the-barrel",
                            "a straight-up desperate",
                            "a very, uh... *brave*",
                            "a highly unpopular (probably for a good reason)"
                        ]);
                    }

                    if (currentSeeds.length === 1 && currentSeeds[0].count === getTotalCards()) {
                        aiDialogue = `<strong>${lastNameClean}</strong> is ${popAdj} ${lastClass} card! <br><br>`;
                    } else if (activeClasses.size === 2 && !heroAnnounced) {
                        aiDialogue = `This is now officially a <strong>${heroName}</strong> deck! <strong>${lastNameClean}</strong> adds some great synergy. <br><br>`;
                        heroAnnounced = true;
                    } else {
                        aiDialogue = `Adding <strong>${lastNameClean}</strong> gives us a great direction! <br><br>`;
                    }
                }
            } else {
                if (activeClasses.size === 2) {
                    aiDialogue = `This is a <strong>${heroName}</strong> deck! You have some great options from here.<br><br>`;
                } else {
                    aiDialogue = `You have some great options for this <strong>${currentFaction}</strong> deck! <br><br>`;
                }
            }

            // 3. Suggestion sentence (unchanged)
          if (recData.length > 0) {
    aiDialogue +=
        SmartRecWhy.buildHtml(recData);
}

            // 4. Render: speech bubble + staggered recommendation cards
            let htmlString = daveSay(aiDialogue);

            htmlString += `<div class="rec-row">`;

            recData.forEach((rec, index) => {
                const badgeText = index === 0 ? "1st" : (index === 1 ? "2nd" : "3rd");

                htmlString += `
            <div class="rec-card" style="--d: ${index * 70}ms;">
                <span class="rec-badge ${index === 0 ? 'gold' : ''}">${badgeText}</span>
                <img src="card_images/${rec.name}.png" alt="${rec.displayName}" title="${rec.displayName}"
                    onerror="this.onerror=null; this.src='card_images/${rec.name}.webp';">
                <button class="add-rec-btn generate-btn" data-name="${rec.name}" data-class="${rec.data.Class}" data-amount="${rec.targetCopies}">
                    +${rec.targetCopies}
                </button>
            </div>`;
            });

            htmlString += `</div>`;

            chatFeed.innerHTML = htmlString;

            chatFeed.querySelectorAll('.add-rec-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const amount = parseInt(e.target.getAttribute('data-amount')) || 1;
                    addSeed(e.target.getAttribute('data-name'), e.target.getAttribute('data-class'), currentFaction, amount);
                });
            });

        }, 50);
    }

    // ------------------------------------------------------------
    // SWAP SUGGESTIONS — speech bubble edition
    // ------------------------------------------------------------
    function showSwapSuggestions(baseCardName) {
        const chatFeed = document.getElementById('aiChatFeed');
        if (!chatFeed) return;
        syncDeckIdentityFromSeeds();
        // QoL toggle (unchanged)
        if (window.activeSwapTarget === baseCardName) {
            window.activeSwapTarget = null;
            triggerAICoPilot();
            return;
        }
        window.activeSwapTarget = baseCardName;

        const baseSeed = currentSeeds.find(c => c.name === baseCardName);
        if (!baseSeed) return;

        const displayName = baseCardName.replace(/_/g, ' ');
        initSynergyMatrix();

        chatFeed.innerHTML = daveThinking(`Finding the best replacements for ${displayName}...`);

        setTimeout(() => {
            const replacements = getTopThreeRecommendations(baseCardName);

            if (replacements.length === 0) {
                chatFeed.innerHTML = daveSay(`I could not find any good replacements for <strong>${displayName}</strong>.`);
                return;
            }

            // True baseline score of the current deck (unchanged)
            const ctx = typeof getVerdictContext === "function" ? getVerdictContext() : {};
            const currentDeckStrings = currentSeeds.map(s => `${s.count}x ${s.name}`);
            const baselineVerdict = getDeckVerdictFromCards(currentDeckStrings, null, ctx);
            const baselineScore = baselineVerdict.score;

            let html = daveSay(`Here are the top alternatives for <strong>${displayName}</strong>:`);
            html += `<div class="rec-row">`;

            replacements.forEach((rec, index) => {
                const cardName = rec.name.replace(/_/g, ' ');
                const badgeText = index === 0 ? "1st" : (index === 1 ? "2nd" : "3rd");

                // Compare true percentage scores (unchanged)
                const scoreDiff = Math.round(rec.score - baselineScore);

                let comparisonColor = "#9e9e9e";

                let comparisonText = "±0%";
let comparisonClass = "same";
let comparisonLabel = "No score change";

if (scoreDiff > 0) {
    comparisonText = `+${scoreDiff}%`;
    comparisonClass = "better";
    comparisonLabel = `Improves deck score by ${scoreDiff}%`;
} else if (scoreDiff < 0) {
    comparisonText = `−${Math.abs(scoreDiff)}%`;
    comparisonClass = "worse";
    comparisonLabel = `Lowers deck score by ${Math.abs(scoreDiff)}%`;
}

                html += `
            <div class="rec-card" style="--d: ${index * 70}ms;">
                <span class="rec-badge ${index === 0 ? 'gold' : ''}">${badgeText}</span>
                <img src="card_images/${rec.name}.png" alt="${cardName}" title="${cardName}"
                    onerror="this.onerror=null; this.src='card_images/${rec.name}.webp';">
                <button class="add-rec-btn generate-btn" data-remove="${baseCardName}" data-add="${rec.name}">
                    Swap
                </button>
               <div
    class="rec-compare ${comparisonClass}"
    title="${comparisonLabel}"
    aria-label="${comparisonLabel}"
>
    ${comparisonText}
</div>
            </div>`;
            });

            html += `</div>`;
            chatFeed.innerHTML = html;

            chatFeed.querySelectorAll('.add-rec-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const removeName = e.target.getAttribute('data-remove');
                    const addName = e.target.getAttribute('data-add');
                    applyFullSwap(removeName, addName);
                });
            });

        }, 50);
    }
    function applyFullSwap(removeName, addName) {
        deckBuiltFromCollection = false;
        const removeSeed = currentSeeds.find(s => s.name === removeName);
        const addData = cardDatabase[addName];
        if (!removeSeed || !addData) return;

        const removeCount = removeSeed.count;
        const existingAdd = currentSeeds.find(s => s.name === addName);

        // If the replacement would exceed 4 copies, do nothing.
        if (existingAdd && existingAdd.count + removeCount > 4) return;

        // Remove all copies of the chosen card
        currentSeeds = currentSeeds.filter(s => s.name !== removeName);

        // Add the same number of copies of the replacement
        if (existingAdd) {
            existingAdd.count += removeCount;
        } else {
            currentSeeds.push({
                name: addName,
                count: removeCount,
                class: addData.Class,
                faction: plantClasses.has(addData.Class) ? "Plant" : "Zombie",
                cost: addData.Cost
            });
        }

        activeClasses.clear();
        currentSeeds.forEach(s => activeClasses.add(s.class));
        if (activeClasses.size < 2) heroAnnounced = false;

        lastAddedCard = addName;
        renderSeeds();
    }

    // --- 4. SYNERGY ENGINE (Background Math) ---
    let synergyMatrix = null;
    let cardFrequencies = null;
    let cardAverageCopies = null;
    // How often a card shows up specifically in decks for ONE hero, vs. the
    // overall rate for its class pair. This is our stand-in for "synergy with
    // the hero's kit/signature superpower" - we don't have superpower effect
    // text to reason about directly, but real deck-builders already bake
    // that synergy into which cards they pick for a given hero, so we can
    // recover it from deck.hero + deck.cards.
    let heroCardWeight = null;   // { heroName: { cardName: weight } }
    let heroTotalWeight = null;  // { heroName: totalWeight }

   function initSynergyMatrix() {
    if (synergyMatrix) return;

    synergyMatrix = {};
    cardFrequencies = {};
    cardAverageCopies = {};
    heroCardWeight = {};
    heroTotalWeight = {};

    const rawDecks = Object.values(fullDatabase || {});
    const seenSignatures = new Set();

    // Same idea as your power score: newer decks matter more,
    // but old decks are not completely deleted.
    const now = Date.now();
    const SYNERGY_HALF_LIFE_DAYS = 365;

    function parseDeckCard(c) {
        const firstSpace = c.indexOf(' ');
        if (firstSpace === -1) return null;

        const countStr = c.substring(0, firstSpace).replace(/x/i, '');
        const count = parseInt(countStr, 10) || 1;
        const name = c.substring(firstSpace + 1).trim();

        if (!name) return null;
        return { name, count };
    }

    const decks = rawDecks.map(deck => {
        if (!deck.cards || deck.cards.length === 0) {
            return { ...deck, weight: 1.0 };
        }

        const parsedCards = deck.cards
            .map(parseDeckCard)
            .filter(Boolean);

        const signature = parsedCards
            .map(c => `${c.count}x ${c.name.toLowerCase()}`)
            .sort()
            .join('|');

        let duplicateWeight = 1.0;

        if (seenSignatures.has(signature)) {
            duplicateWeight = 0.5;
        } else {
            seenSignatures.add(signature);
        }

        let timeWeight = 1.0;

        if (deck.upload_date) {
            const deckTime = new Date(deck.upload_date).getTime();

            if (!isNaN(deckTime)) {
                const daysAgo = Math.max(0, (now - deckTime) / (1000 * 60 * 60 * 24));
                timeWeight = Math.pow(0.5, daysAgo / SYNERGY_HALF_LIFE_DAYS);
            }
        }

        return {
            ...deck,
            parsedCards,
            weight: duplicateWeight * timeWeight
        };
    });

    decks.forEach(deck => {
        const parsedCards = deck.parsedCards || [];
        if (parsedCards.length === 0) return;

        const cleanCards = parsedCards.map(pc => pc.name);
        const deckWeight = deck.weight || 1.0;

        parsedCards.forEach(card => {
            cardFrequencies[card.name] =
                (cardFrequencies[card.name] || 0) + deckWeight;

            if (!cardAverageCopies[card.name]) {
                cardAverageCopies[card.name] = { total: 0, appearances: 0 };
            }

            cardAverageCopies[card.name].total += card.count * deckWeight;
            cardAverageCopies[card.name].appearances += deckWeight;
        });

        const heroName = deck.hero;
        if (heroName) {
            if (!heroCardWeight[heroName]) heroCardWeight[heroName] = {};
            heroTotalWeight[heroName] = (heroTotalWeight[heroName] || 0) + deckWeight;

            parsedCards.forEach(card => {
                heroCardWeight[heroName][card.name] =
                    (heroCardWeight[heroName][card.name] || 0) + deckWeight;
            });
        }

        for (let i = 0; i < cleanCards.length; i++) {
            const cardA = cleanCards[i];

            if (!synergyMatrix[cardA]) synergyMatrix[cardA] = {};

            for (let j = 0; j < cleanCards.length; j++) {
                if (i === j) continue;

                const cardB = cleanCards[j];

                synergyMatrix[cardA][cardB] =
                    (synergyMatrix[cardA][cardB] || 0) + deckWeight;
            }
        }
    });
}

/*
 * Proxy for "does this card synergize with this hero's kit / signature
 * superpower?" We don't have superpower effect text to reason about
 * directly, so instead we look at how disproportionately often expert
 * players actually run this card specifically on this hero (as opposed to
 * just anywhere in that class pair). Returns a small bonus, 0 when there's
 * no hero context or no data yet.
 */
function getHeroAffinityBonus(cardName, heroName) {
    if (!heroName || !heroCardWeight || !heroCardWeight[heroName]) return 0;

    const heroWeight = heroTotalWeight[heroName] || 0;
    if (heroWeight <= 0) return 0;

    const pickRate = (heroCardWeight[heroName][cardName] || 0) / heroWeight;

    // pickRate is roughly 0..1 (how often this exact card shows up in this
    // hero's decks). Scale modestly so it nudges scoring without dominating
    // the existing synergy/power/curve terms.
    return Math.min(pickRate * 40, 12);
}

    // --- 5. FINISH FOR ME (Auto-Generate Remaining) ---
    generateDeckBtn.addEventListener('click', () => {
        initSynergyMatrix();
        generateDeckBtn.disabled = true;

        setTimeout(() => {
            currentSeeds = buildOptimizedDeck();
            deckBuiltFromCollection = false;
            lastAddedCard = null; // Clear context so AI summarizes full deck
            renderSeeds();
        }, 50);
    });

    function buildOptimizedDeck() {
    const originalDeck = currentSeeds.map(card => ({ ...card }));
    const lockedCounts = new Map(
        originalDeck.map(card => [card.name, card.count])
    );

    const isBudget = Boolean(budgetToggle?.checked);
    const isSuperBudget = Boolean(superBudgetToggle?.checked);

    const verdictCtx =
        typeof getVerdictContext === "function"
            ? getVerdictContext()
            : undefined;

    const idealCurve = getFinishIdealCurve(originalDeck, verdictCtx);
    const heroName = deckHeroLock?.name || null;

    /*
     * A few fast deterministic approaches are better than one randomized
     * approach. Only the finished decks receive the expensive real score.
     */
    const profiles = [
        {
            synergy: 0.42,
            power: 0.275,
            curve: 0.255,
            consistency: 0.05
        },
        {
            synergy: 0.50,
            power: 0.25,
            curve: 0.20,
            consistency: 0.05
        },
        {
            synergy: 0.36,
            power: 0.34,
            curve: 0.25,
            consistency: 0.05
        }
    ];

    let bestDeck = null;
    let bestScore = -Infinity;

    for (const profile of profiles) {
        const completedDeck = buildFastCompletion(
            originalDeck,
            profile,
            idealCurve,
            verdictCtx,
            isBudget,
            isSuperBudget,
            false,
            heroName
        );

        const score = getExactFinishScore(completedDeck, verdictCtx);

        if (score > bestScore) {
            bestScore = score;
            bestDeck = completedDeck;
        }
    }

    if (!bestDeck) {
        bestDeck = originalDeck;
    }

    /*
     * Use the real scoring function for a limited number of final swaps.
     * The user's original cards are locked and will never be removed.
     */
    bestDeck = polishFinishedDeck(
        bestDeck,
        lockedCounts,
        idealCurve,
        verdictCtx,
        isBudget,
        isSuperBudget,
        {
            maxMilliseconds: 350,
            maxEvaluations: 140,
            maxPasses: 2
        }
    );

    const finalVerdict = getExactFinishVerdict(bestDeck, verdictCtx);

    if (finalVerdict) {
        console.log(
            `%cFinish For Me created a ${finalVerdict.score.toFixed(2)} deck`,
            "color:#00d9ff;font-weight:800;"
        );

        console.table({
            Score: finalVerdict.score.toFixed(2),
            Grade: finalVerdict.grade,
            Synergy: finalVerdict.synergyScore,
            Power: finalVerdict.powerScore,
            Consistency: finalVerdict.consistencyScore,
            Curve: finalVerdict.curveHealthText
        });
    }

    return bestDeck;
}
function buildFastCompletion(
    startingDeck,
    profile,
    idealCurve,
    verdictCtx,
    isBudget,
    isSuperBudget,
    ownedOnly,
    heroName
) {
    const deck = startingDeck.map(card => ({ ...card }));
    const seedNames = new Set(startingDeck.map(card => card.name));

    const workingClasses = new Set(activeClasses || []);

    for (const card of deck) {
        const cardClass = cardDatabase?.[card.name]?.Class;
        if (cardClass) workingClasses.add(cardClass);
    }

    const allCandidateNames = Object.keys(cardDatabase || {});

    while (getFinishDeckCount(deck) < 40) {
        const totalCards = getFinishDeckCount(deck);
        const slotsLeft = 40 - totalCards;

        const singletons = deck.filter(card => card.count === 1).length;

        /*
         * When there are barely enough slots to eliminate all singletons,
         * stop introducing brand-new cards.
         */
        const onlyExisting =
            slotsLeft <= singletons ||
            slotsLeft === 1;

        const candidatePool = onlyExisting
            ? deck.map(card => card.name)
            : allCandidateNames;

        let bestName = null;
        let bestCandidateScore = -Infinity;

        for (const candidateName of candidatePool) {
            if (
                !canFinishAddCard(
                    candidateName,
                    deck,
                    workingClasses,
                    isBudget,
                    isSuperBudget,
                    ownedOnly
                )
            ) {
                continue;
            }

            const candidateScore = getFastFinishCandidateScore(
                candidateName,
                deck,
                seedNames,
                profile,
                idealCurve,
                verdictCtx,
                heroName
            );

            if (candidateScore > bestCandidateScore) {
                bestCandidateScore = candidateScore;
                bestName = candidateName;
            }
        }

        /*
         * The "only top off existing singletons" restriction can dead-end -
         * e.g. every singleton is already maxed out under a budget rule, so
         * none of them can actually take another copy. If that happens,
         * don't just give up; open the pool back up to any eligible card so
         * we still make progress toward 40.
         */
        if (!bestName && onlyExisting) {
            for (const candidateName of allCandidateNames) {
                if (
                    !canFinishAddCard(
                        candidateName,
                        deck,
                        workingClasses,
                        isBudget,
                        isSuperBudget,
                        ownedOnly
                    )
                ) {
                    continue;
                }

                const candidateScore = getFastFinishCandidateScore(
                    candidateName,
                    deck,
                    seedNames,
                    profile,
                    idealCurve,
                    verdictCtx,
                    heroName
                );

                if (candidateScore > bestCandidateScore) {
                    bestCandidateScore = candidateScore;
                    bestName = candidateName;
                }
            }
        }

        /*
         * Nothing eligible inside the locked classes (this happens a lot with
         * ownedOnly, when the collection just doesn't have enough playables
         * in those 2 classes). Rather than quitting early and handing back a
         * short deck, fall back to any owned/eligible card regardless of
         * class so we still reach 40.
         */
        if (!bestName) {
            for (const candidateName of allCandidateNames) {
                if (
                    !canFinishAddCard(
                        candidateName,
                        deck,
                        workingClasses,
                        isBudget,
                        isSuperBudget,
                        ownedOnly,
                        true // allowNewClass
                    )
                ) {
                    continue;
                }

                const candidateScore = getFastFinishCandidateScore(
                    candidateName,
                    deck,
                    seedNames,
                    profile,
                    idealCurve,
                    verdictCtx,
                    heroName
                );

                if (candidateScore > bestCandidateScore) {
                    bestCandidateScore = candidateScore;
                    bestName = candidateName;
                }
            }
        }

        if (!bestName) break;

        addFinishCard(deck, bestName);

        const addedClass = cardDatabase?.[bestName]?.Class;
        if (addedClass) workingClasses.add(addedClass);
    }

    return deck;
}
function getFastFinishCandidateScore(
    candidateName,
    deck,
    seedNames,
    profile,
    idealCurve,
    verdictCtx,
    heroName
) {
    const currentCopies =
        deck.find(card => card.name === candidateName)?.count || 0;

    const synergy = getFastFinishSynergy(
        candidateName,
        deck,
        seedNames
    );

    const power = getFastFinishPower(candidateName, verdictCtx);

    const projectedDeck = deck.map(card => ({ ...card }));
    addFinishCard(projectedDeck, candidateName);

    const curve = getFastFinishCurveScore(
        projectedDeck,
        idealCurve
    );

    const consistency = getFinishConsistencyScore(projectedDeck);

    let score =
        synergy * profile.synergy +
        power * profile.power +
        curve * profile.curve +
        consistency * profile.consistency;

    // Nudge toward cards that specifically pair well with this hero's kit
    // (see getHeroAffinityBonus for what this is standing in for).
    if (heroName) {
        score += getHeroAffinityBonus(candidateName, heroName);
    }

    /*
     * Encourage reaching approximately ten distinct cards.
     * Ten 4x cards can achieve perfect consistency, while a deck made from
     * only two or three cards would not be a meaningful finished deck.
     */
    if (currentCopies === 0) {
        if (deck.length < 9) {
            score += 12;
        } else if (deck.length >= 13) {
            score -= 10;
        }
    }

    /*
     * Gently follow the copy counts commonly used for this card.
     * Unlike the old 75x multiplier, this cannot completely overwhelm
     * synergy, power, and curve.
     */
    const copyStats = cardAverageCopies?.[candidateName];

    if (copyStats?.appearances > 0) {
        const averageCopies =
            copyStats.total / copyStats.appearances;

        const targetCopies = Math.max(
            1,
            Math.min(4, Math.round(averageCopies))
        );

        if (currentCopies < targetCopies) {
            score += 5;
        } else {
            score -= 4;
        }
    }

    /*
     * Breaking a singleton is useful, but should not decide the entire
     * algorithm by itself.
     */
    if (currentCopies === 1) {
        score += 10;
    } else if (currentCopies === 2) {
        score += 5;
    }

    return score;
}
function getFastFinishSynergy(candidateName, deck, seedNames) {
    if (!deck.length) return 25;

    const candidateFrequency =
        cardFrequencies?.[candidateName] || 1;

    const partners = [];

    for (const deckCard of deck) {
        if (deckCard.name === candidateName) continue;

        const coOccurrences =
            synergyMatrix?.[candidateName]?.[deckCard.name] || 0;

        const partnerFrequency =
            cardFrequencies?.[deckCard.name] || 1;

        const cosineSynergy =
            coOccurrences > 0
                ? coOccurrences /
                  Math.sqrt(candidateFrequency * partnerFrequency)
                : 0;

        const seedMultiplier =
            seedNames.has(deckCard.name) ? 1.25 : 1;

        partners.push({
            name: deckCard.name,
            score:
                cosineSynergy *
                seedMultiplier *
                Math.sqrt(deckCard.count),
            cosineSynergy,
            coOccurrences
        });
    }

    partners.sort((a, b) => b.score - a.score);

    const best = partners[0]?.cosineSynergy || 0;
    const second = partners[1]?.cosineSynergy || 0;

    let triadBonus = 0;

    if (partners.length >= 2) {
        const firstName = partners[0].name;
        const secondName = partners[1].name;

        const coOccurrences =
            synergyMatrix?.[firstName]?.[secondName] || 0;

        const firstFrequency =
            cardFrequencies?.[firstName] || 1;

        const secondFrequency =
            cardFrequencies?.[secondName] || 1;

        const pairSynergy =
            coOccurrences > 0
                ? coOccurrences /
                  Math.sqrt(firstFrequency * secondFrequency)
                : 0;

        triadBonus =
            0.15 * Math.min(best, second, pairSynergy);
    }

    const localCluster =
        best * 0.70 +
        second * 0.25 +
        triadBonus;

    const normalized =
        ((localCluster - 0.22) / (0.68 - 0.22)) * 100;

    const realPartners = partners.filter(
        partner =>
            partner.coOccurrences >= 2 &&
            partner.cosineSynergy >= 0.30
    ).length;

    return finishClamp(
        normalized + Math.min(10, realPartners * 2),
        0,
        100
    );
}
function getFastFinishPower(candidateName, verdictCtx) {
    const popularity =
        verdictCtx?.cardPopularity?.[candidateName] ||
        cardFrequencies?.[candidateName] ||
        0;

    const maxPopularity =
        verdictCtx?.maxMetaCopies ||
        Math.max(1, ...Object.values(cardFrequencies || {}));

    const rawRatio = popularity / Math.max(1, maxPopularity);

    return finishClamp(rawRatio * 100 * 2.7, 0, 100);
}

function getFastFinishCurveScore(deck, idealCurve) {
    const totalCards = getFinishDeckCount(deck);
    if (!totalCards) return 50;

    const buckets = [0, 0, 0, 0, 0, 0];

    for (const card of deck) {
        const rawCost = parseInt(
            cardDatabase?.[card.name]?.Cost ?? card.cost,
            10
        );

        const cost = Number.isFinite(rawCost) ? rawCost : 1;
        const bucket = cost >= 6 ? 5 : Math.max(0, cost - 1);

        buckets[bucket] += card.count;
    }

    const shape = buckets.map(count => count / totalCards);

    let totalDifference = 0;

    for (let index = 0; index < 6; index++) {
        totalDifference += Math.abs(
            shape[index] - idealCurve[index]
        );
    }

    return finishClamp(
        100 - totalDifference * 145,
        0,
        100
    );
}

function getFinishConsistencyScore(deck) {
    if (!deck.length) return 0;

    let points = 0;

    for (const card of deck) {
        if (card.count === 2) points += 50;
        else if (card.count === 3) points += 80;
        else if (card.count >= 4) points += 100;
    }

    return Math.round(points / deck.length);
}
function getFinishIdealCurve(startingDeck, verdictCtx) {
    const fallbackCurve = [
        0.23,
        0.22,
        0.20,
        0.15,
        0.10,
        0.10
    ];

    if (
        !startingDeck.length ||
        !verdictCtx?.dbDecks
    ) {
        return fallbackCurve;
    }

    const seedCounts = new Map(
        startingDeck.map(card => [card.name, card.count])
    );

    const comparisons = [];

    for (const deckKey in verdictCtx.dbDecks) {
        const databaseDeck = verdictCtx.dbDecks[deckKey];

        if (
            !databaseDeck?.seedCounts ||
            !Array.isArray(databaseDeck.shape)
        ) {
            continue;
        }

        let overlap = 0;

        for (const [name, count] of seedCounts) {
            const databaseCount =
                databaseDeck.seedCounts.get(name) || 0;

            overlap += Math.min(count, databaseCount);
        }

        if (overlap > 0) {
            comparisons.push({
                overlap,
                shape: databaseDeck.shape
            });
        }
    }

    comparisons.sort((a, b) => b.overlap - a.overlap);

    const closest = comparisons.slice(0, 8);

    if (!closest.length) {
        return fallbackCurve;
    }

    const totalWeight = closest.reduce(
        (sum, deck) => sum + deck.overlap,
        0
    );

    const idealCurve = [0, 0, 0, 0, 0, 0];

    for (const databaseDeck of closest) {
        const weight = databaseDeck.overlap / totalWeight;

        for (let index = 0; index < 6; index++) {
            idealCurve[index] +=
                databaseDeck.shape[index] * weight;
        }
    }

    return idealCurve;
}
function polishFinishedDeck(
    startingDeck,
    lockedCounts,
    idealCurve,
    verdictCtx,
    isBudget,
    isSuperBudget,
    options = {},
    ownedOnly
) {
    const maxMilliseconds = options.maxMilliseconds ?? 350;
    const maxEvaluations = options.maxEvaluations ?? 140;
    const maxPasses = options.maxPasses ?? 2;

    const startedAt = performance.now();

    let evaluations = 0;
    let bestDeck = startingDeck.map(card => ({ ...card }));
    let bestScore = getExactFinishScore(bestDeck, verdictCtx);

    for (let pass = 0; pass < maxPasses; pass++) {
        if (
            evaluations >= maxEvaluations ||
            performance.now() - startedAt >= maxMilliseconds
        ) {
            break;
        }

        const finalClasses = getFinishDeckClasses(bestDeck);
        const seedNames = new Set(lockedCounts.keys());

        /*
         * Remove the weakest algorithm-added cards first.
         */
        const removableCards = bestDeck
            .filter(card => {
                const locked = lockedCounts.get(card.name) || 0;
                return card.count > locked;
            })
            .map(card => ({
                card,
                fit: getFastFinishSynergy(
                    card.name,
                    bestDeck.filter(
                        other => other.name !== card.name
                    ),
                    seedNames
                ) +
                getFastFinishPower(card.name, verdictCtx)
            }))
            .sort((a, b) => a.fit - b.fit)
            .slice(0, 8)
            .map(entry => entry.card);

        const replacementCandidates = Object.keys(cardDatabase || {})
            .filter(name => {
                const cardClass = cardDatabase[name]?.Class;
                const faction = plantClasses.has(cardClass)
                    ? "Plant"
                    : "Zombie";

                if (faction !== currentFaction) return false;
                if (!finalClasses.has(cardClass)) return false;

                const copies =
                    bestDeck.find(card => card.name === name)?.count || 0;

                if (ownedOnly) {
                    const maxOwned = ownedCollection[name] || 0;
                    return maxOwned > 0 && copies < maxOwned;
                }

                return copies < 4;
            })
            .map(name => ({
                name,
                fit: getFastFinishCandidateScore(
                    name,
                    bestDeck,
                    seedNames,
                    {
                        synergy: 0.42,
                        power: 0.275,
                        curve: 0.255,
                        consistency: 0.05
                    },
                    idealCurve,
                    verdictCtx
                )
            }))
            .sort((a, b) => b.fit - a.fit)
            .slice(0, 18)
            .map(entry => entry.name);

        let bestNeighbor = null;
        let bestNeighborScore = bestScore;

        search:
        for (const removedCard of removableCards) {
            for (const addedName of replacementCandidates) {
                if (
                    evaluations >= maxEvaluations ||
                    performance.now() - startedAt >= maxMilliseconds
                ) {
                    break search;
                }

                if (
                    removedCard.name === addedName
                ) {
                    continue;
                }

                const candidateDeck = bestDeck.map(card => ({
                    ...card
                }));

                removeFinishCard(candidateDeck, removedCard.name);

                const classesAfterRemoval =
                    getFinishDeckClasses(candidateDeck);

                if (
                    !canFinishAddCard(
                        addedName,
                        candidateDeck,
                        classesAfterRemoval,
                        isBudget,
                        isSuperBudget,
                        ownedOnly
                    )
                ) {
                    continue;
                }

                addFinishCard(candidateDeck, addedName);

                if (getFinishDeckCount(candidateDeck) !== 40) {
                    continue;
                }

                evaluations++;

                const score = getExactFinishScore(
                    candidateDeck,
                    verdictCtx
                );

                if (score > bestNeighborScore + 0.005) {
                    bestNeighborScore = score;
                    bestNeighbor = candidateDeck;
                }
            }
        }

        if (!bestNeighbor) break;

        bestDeck = bestNeighbor;
        bestScore = bestNeighborScore;
    }

    console.log(
        `Finish For Me exact polishing: ${evaluations} evaluations`
    );

    return bestDeck;
}
function getExactFinishVerdict(deck, verdictCtx) {
    try {
        return getDeckVerdictFromCards(
            deck.map(card => `${card.count}x ${card.name}`),
            null,
            verdictCtx
        );
    } catch (error) {
        console.warn("Could not calculate Finish For Me score:", error);
        return null;
    }
}

function getExactFinishScore(deck, verdictCtx) {
    return getExactFinishVerdict(deck, verdictCtx)?.score ?? -Infinity;
}

function canFinishAddCard(
    candidateName,
    deck,
    workingClasses,
    isBudget,
    isSuperBudget,
    ownedOnly,
    allowNewClass
) {
    const candidateData = cardDatabase?.[candidateName];
    if (!candidateData) return false;

    const candidateType = String(candidateData.Type || '').toLowerCase();
    if (candidateType.includes('superpower')) return false;

    const candidateClass = candidateData.Class;
    const candidateFaction = plantClasses.has(candidateClass)
        ? "Plant"
        : "Zombie";

    if (candidateFaction !== currentFaction) return false;

    if (
        !allowNewClass &&
        !workingClasses.has(candidateClass) &&
        workingClasses.size >= 2
    ) {
        return false;
    }

    const existing =
        deck.find(card => card.name === candidateName);

    const currentCopies = existing?.count || 0;
    if (currentCopies >= 4) return false;

    if (ownedOnly) {
        const maxOwned = ownedCollection[candidateName] || 0;
        if (maxOwned <= 0) return false;
        if (currentCopies >= maxOwned) return false;
    }

    if (isBudget || isSuperBudget) {
        const rarity = candidateData.Rarity;

        if (rarity === "Legendary") return false;

        if (
            rarity === "Super-Rare" ||
            rarity === "Event"
        ) {
            const expensiveCount = deck.reduce((sum, card) => {
                const cardRarity =
                    cardDatabase?.[card.name]?.Rarity;

                return (
                    cardRarity === "Super-Rare" ||
                    cardRarity === "Event"
                )
                    ? sum + card.count
                    : sum;
            }, 0);

            if (isSuperBudget) {
                if (expensiveCount >= 4) return false;

                const expensiveNames = deck.filter(card => {
                    const cardRarity =
                        cardDatabase?.[card.name]?.Rarity;

                    return (
                        cardRarity === "Super-Rare" ||
                        cardRarity === "Event"
                    );
                });

                if (
                    currentCopies === 0 &&
                    expensiveNames.length > 0
                ) {
                    return false;
                }
            } else if (
                currentCopies === 0 &&
                expensiveCount > 13
            ) {
                return false;
            }
        }
    }

    return true;
}

function addFinishCard(deck, cardName) {
    const existing =
        deck.find(card => card.name === cardName);

    if (existing) {
        existing.count++;
        return;
    }

    deck.push({
        name: cardName,
        count: 1,
        class: cardDatabase?.[cardName]?.Class,
        cost: cardDatabase?.[cardName]?.Cost
    });
}

function removeFinishCard(deck, cardName) {
    const index =
        deck.findIndex(card => card.name === cardName);

    if (index === -1) return;

    deck[index].count--;

    if (deck[index].count <= 0) {
        deck.splice(index, 1);
    }
}

function getFinishDeckCount(deck) {
    return deck.reduce((sum, card) => {
        const type = String(cardDatabase?.[card.name]?.Type || '').toLowerCase();
        if (type.includes('superpower')) return sum;
        return sum + card.count;
    }, 0);
}

function getFinishDeckClasses(deck) {
    const classes = new Set();

    for (const card of deck) {
        const cardClass =
            cardDatabase?.[card.name]?.Class;

        if (cardClass) classes.add(cardClass);
    }

    /*
     * Preserve explicitly selected classes, even when the current deck
     * temporarily has no card from one of them.
     */
    for (const cardClass of activeClasses || []) {
        classes.add(cardClass);
    }

    return classes;
}

function finishClamp(value, minimum, maximum) {
    return Math.max(
        minimum,
        Math.min(maximum, value)
    );
}

   // --- 6. NAMING & COPY LOGIC ---
function generateDeckName(deck, isPlant) {
    if (!Array.isArray(deck) || deck.length === 0) {
        return isPlant ? "Suspicious Salad" : "Unlicensed Brain Buffet";
    }

    const cleanName = (name = "") =>
        String(name)
            .replace(/_/g, " ")
            .replace(/^The /i, "")
            .replace(/\s+/g, " ")
            .trim();

    const cards = deck
        .filter(c => c && c.name && c.count > 0)
        .map(c => ({
            ...c,
            name: cleanName(c.name),
            cost: Number(c.cost) || 0,
            count: Number(c.count) || 1
        }));

    if (cards.length === 0) {
        return isPlant ? "Suspicious Salad" : "Unlicensed Brain Buffet";
    }

    // Stable hash so deck names do not randomly change every render.
    const hashString = (str) => {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    };

    const deckKey = cards
        .map(c => `${c.name}:${c.count}`)
        .sort()
        .join("|") + (isPlant ? "|plant" : "|zombie");

    const seed = hashString(deckKey);

    const pick = (arr, salt = 0) => {
        if (!arr.length) return "";
        return arr[(seed + salt * 2654435761) >>> 0 % arr.length];
    };

    const pickActually = (arr, salt = 0) => {
        if (!arr.length) return "";
        const n = (seed + Math.imul(salt + 1, 2654435761)) >>> 0;
        return arr[n % arr.length];
    };

    const namesBlob = cards.map(c => c.name.toLowerCase()).join(" | ");

    const hasAny = (...terms) =>
        terms.some(t => namesBlob.includes(String(t).toLowerCase()));

    const totalCards = cards.reduce((s, c) => s + c.count, 0);
    const totalCost = cards.reduce((s, c) => s + c.cost * c.count, 0);
    const avgCost = totalCost / Math.max(totalCards, 1);

    // Signature cards: not just most expensive, but likely "deck-defining."
    const signatureHints = [
        "valkyrie",
        "trickster",
        "bad moon rising",
        "espresso fiesta",
        "going viral",
        "con man",
        "quickdraw con man",
        "teleport",
        "teleportation zombie",
        "interdimensional zombie",
        "teacher",
        "zombology teacher",
        "gargantuar",
        "binary stars",
        "mustache monument",
        "astro-shroom",
        "heartichoke",
        "pepper m.d.",
        "ketchup mechanic",
        "pineclone",
        "dandy lion king",
        "gatling pea",
        "threepeater",
        "repeat moss",
        "magnifying grass",
        "pecanolith",
        "soul patch",
        "brainana",
        "dark matter dragonfruit",
        "starch-lord"
    ];

    const scoreCard = (c) => {
        const n = c.name.toLowerCase();
        let score = c.count * (c.cost + 1);
        if (signatureHints.some(h => n.includes(h))) score += 20;
        if (c.count >= 4) score += 4;
        return score;
    };

    const sortedDeck = [...cards].sort((a, b) => scoreCard(b) - scoreCard(a));

    const sig1 = sortedDeck[0].name;
    const sig2 = sortedDeck[1] ? sortedDeck[1].name : sig1;

    // Archetype vibes, used only to choose jokes.
    let vibe = "mid";

    if (avgCost <= 2.7) vibe = "aggro";
    else if (avgCost >= 4.1) vibe = "greed";

    if (hasAny("trick", "teleport", "mustache monument", "bonus attack", "espresso fiesta", "repeat moss")) {
        vibe = "combo";
    }

    if (hasAny("heal", "heartichoke", "pepper m.d", "venus flytraplanet", "taco")) {
        vibe = "heal";
    }

    if (hasAny("bad moon rising", "gargantuar", "dark matter dragonfruit", "brainana")) {
        vibe = "greed";
    }

    if (hasAny("mushroom", "astro-shroom", "pineclone", "swarm")) {
        vibe = "swarm";
    }

    const genericFunny = [
        `${sig1}: The Deck`,
        `Oops! All ${sig1}`,
        `I Swear ${sig1} Is Balanced`,
        `${sig1} Did Nothing Wrong`,
        `Mom Said It’s My Turn to Play ${sig1}`,
        `${sig1} and the Audacity`,
        `The ${sig1} Incident`,
        `${sig1} Support Group`,
        `Local Player Discovers ${sig1}`,
        `${sig1} Delivery Service`,
        `Please Nerf ${sig1}`,
        `${sig1} Apology Tour`,
        `${sig1} with Extra Sauce`,
        `Definitely Not Just ${sig1}`,
        `${sig1} and Friends`,
        `${sig1} Friendship Simulator`,
        `${sig1} Any% Speedrun`,
        `My Lawyer Advised Me to Play ${sig1}`,
        `${sig1} Tax Evasion`,
        `Least Annoying ${sig1} Deck`
    ];

    const plantFunny = [
        `Lawn Enforcement`,
        `Compost Malone`,
        `Peas Was Never an Option`,
        `Photosynthesis Crimes`,
        `Garden Variety Nonsense`,
        `Root Canal`,
        `The Salad Bar Brawl`,
        `Weaponized Vegetables`,
        `Certified Lawn Goblin`,
        `Botany With Bad Intentions`,
        `${sig1} Garden Party`,
        `${sig1} but Make It Organic`,
        `${sig1} Touches Grass`,
        `Farm-to-Face ${sig1}`,
        `${sig1} Chlorophyll Villain Arc`,
        `Locally Sourced Lethal`
    ];

    const zombieFunny = [
        `Brains Before Gains`,
        `Graveyard Shift Manager`,
        `Undead Tax Fraud`,
        `OSHA Violation Zombies`,
        `Brain Buffet Deluxe`,
        `Mildly Legal Necromancy`,
        `The Walking Debt`,
        `Certified Brainrot`,
        `Rot Pocket`,
        `Funeral Home Combo Meal`,
        `${sig1} Brain Subscription`,
        `${sig1} but Somehow Dumber`,
        `${sig1} Grave Mistake`,
        `${sig1} Ate My Homework`,
        `Weekend at ${sig1}’s`,
        `Corporate Wants More Brains`
    ];

    const vibeFunny = {
        aggro: [
            `Go Face or Go Home`,
            `No Blocks? No Problem`,
            `Turn Two Emotional Damage`,
            `${sig1} Speedrun`,
            `${sig1} Hits the Gas`,
            `Counting to 20 Is Hard`,
            `The Opponent Had Plans?`,
            `Oops, No Late Game`
        ],
        mid: [
            `Good Cards, Bad Manners`,
            `${sig1} Value Meal`,
            `Reasonable Deck, Unreasonable Results`,
            `${sig1} Midlife Crisis`,
            `Curve? I Hardly Know Her`,
            `${sig1} and Some Other Nonsense`,
            `The Fair and Balanced Lie`
        ],
        greed: [
            `Late Game Greed Goblin`,
            `Seven-Cost Personality Disorder`,
            `${sig1} Retirement Plan`,
            `Please Survive Until Turn 8`,
            `Big Cards, Small Shame`,
            `Wallet Inspector ${sig1}`,
            `The Greed Is Good Actually`,
            `Oops, All Finishers`
        ],
        combo: [
            `Oops, Lethal`,
            `The Math Homework Deck`,
            `${sig1} Combo Crimes`,
            `One Weird Trick`,
            `Judge, I Can Explain`,
            `${sig1} Rube Goldberg Machine`,
            `Totally Intended Lethal`,
            `The Spreadsheet Said Yes`
        ],
        heal: [
            `Healthcare Fraud`,
            `Emotional Support Taco`,
            `${sig1} Urgent Care`,
            `HIPAA Violation Garden`,
            `Doctor Recommended Violence`,
            `Healing but Rude`,
            `The Insurance Claim`
        ],
        swarm: [
            `Personal Space Invaders`,
            `Oops, All Bodies`,
            `${sig1} Population Problem`,
            `The Board Is Full Again`,
            `Tiny Guys, Huge Problem`,
            `Clown Car Garden`,
            `One Million Little Problems`
        ]
    };

    // Card-specific jokes. These fire when a famous card appears.
    const cardSpecific = [];

    const addIf = (condition, names) => {
        if (condition) cardSpecific.push(...names);
    };

    addIf(hasAny("valkyrie"), [
        `Valkaholics Anonymous`,
        `Valkyrie Did Nothing Wrong`,
        `Valk and Awe`,
        `Live Laugh Valkyrie`
    ]);

    addIf(hasAny("trickster"), [
        `Trickster? I Barely Know Her`,
        `The Trickster Situation`,
        `One Trick Pony, Literally`,
        `Trickster Math Department`
    ]);

    addIf(hasAny("bad moon rising"), [
        `Bad Moon, Worse Decisions`,
        `BMR Support Group`,
        `Moon Landing Was Personal`,
        `Oops, All Gargantuars`
    ]);

    addIf(hasAny("espresso fiesta"), [
        `Espresso Depresso`,
        `Caffeine-Based Lethal`,
        `One More Shot`,
        `The 3 AM Fiesta`
    ]);

    addIf(hasAny("going viral"), [
        `Going Viral, Unfortunately`,
        `Contagious Bad Decisions`,
        `The Algorithm Liked This`,
        `Viral Marketing`
    ]);

    addIf(hasAny("con man"), [
        `Con Man Tax Season`,
        `Legally Questionable Pirates`,
        `This Deck Is a Scam`,
        `Fraudulent Activities`
    ]);

    addIf(hasAny("astro-shroom"), [
        `Astro-Shroom Space Program`,
        `NASA but Fungus`,
        `One Small Shroom for Man`,
        `The Mushroom Tax`
    ]);

    addIf(hasAny("heartichoke"), [
        `Heartichoke Healthcare Fraud`,
        `Emotional Damage Healing`,
        `Doctor’s Hate This One Trick`,
        `Cardiology Crimes`
    ]);

    addIf(hasAny("pineclone"), [
        `Pineclone Identity Theft`,
        `Oops, All Trees`,
        `Forest of Bad Choices`,
        `Clone Wars: Lawn Edition`
    ]);

    addIf(hasAny("starch-lord"), [
        `Starch-Lord’s Weird Potato Cult`,
        `All Hail the Potato`,
        `The Spudfather`,
        `Tubersday`
    ]);

    addIf(hasAny("gargantuar"), [
        `Gargantuar Daycare`,
        `Big Guy Appreciation Club`,
        `Large Adult Zombies`,
        `Oops, All Large Men`
    ]);

    const duoFunny = [
        `${sig1} & ${sig2}: Buddy Comedy`,
        `${sig1} / ${sig2} Divorce Court`,
        `${sig1} and ${sig2} Ruin Everything`,
        `${sig1} + ${sig2} = Bad News`,
        `${sig1} Featuring ${sig2}`,
        `${sig1} and the Backup Dancers`,
        `${sig1}, ${sig2}, and Poor Decisions`
    ].filter(name => sig1 !== sig2 || !name.includes(`${sig1} & ${sig2}`));

    const candidates = [
        ...cardSpecific,
        ...genericFunny,
        ...(isPlant ? plantFunny : zombieFunny),
        ...(vibeFunny[vibe] || vibeFunny.mid),
        ...duoFunny
    ];

    // Prefer card-specific jokes sometimes, but not always.
    if (cardSpecific.length && seed % 3 !== 0) {
        return pickActually(cardSpecific, 99);
    }

    return pickActually(candidates, 123);
}

    
    const downloadBtn = document.getElementById('downloadImageBtn');

    // --- Save deck as JSON, shaped like an entry in deck_database_final.json,
    // so it can be dropped straight into that file to teach Dave about it ---
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    if (downloadJsonBtn) {
        downloadJsonBtn.addEventListener('click', () => {
            if (!currentSeeds.length) {
                alert('Add some cards to the deck first.');
                return;
            }

            const deckName = (typeof getCurrentDeckName === 'function')
                ? getCurrentDeckName()
                : 'Custom Deck';

            const cardsArray = currentSeeds
                // Same "xN Card_Name" shape parseCardEntry/getVerdictContext expect.
                .map(s => `x${s.count} ${s.name}`);

            const nowIso = new Date().toISOString();

            const deckEntry = {
                name: deckName,
                cards: cardsArray,
                upload_date: nowIso,
                credit: "You",
                youtube_url: "",
                youtube_title: ""
            };

            // Key it the same way the rest of the database is keyed: a
            // slugified name plus a timestamp so it can't collide with an
            // existing entry.
            const slug = deckName
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '') || 'custom_deck';
            const deckKey = `${slug}_${Date.now()}`;

            const output = { [deckKey]: deckEntry };

            const blob = new Blob(
                [JSON.stringify(output, null, 2)],
                { type: 'application/json' }
            );
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${slug}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });
    }

    function toImageFilename(name) {
    return name
        .replace(/_/g, ' ')
        .trim()
        .replace(/[\s-]+/g, '_');
}

function loadCanvasImage(srcs) {
    return new Promise(resolve => {
        let i = 0;

        function tryNext() {
            if (i >= srcs.length) return resolve(null);

            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => resolve(img);
            img.onerror = () => {
                i++;
                tryNext();
            };

            img.src = srcs[i];
        }

        tryNext();
    });
}

function getExportHeroData() {
    const classArray = [...new Set(
        currentSeeds
            .map(seed => cardDatabase[seed.name]?.Class)
            .filter(Boolean)
    )].sort();

    if (classArray.length === 0) {
        return {
            heroName: "Custom Deck",
            heroesData: []
        };
    }

    if (classArray.length === 1) {
        const singleClass = classArray[0];

        return {
            heroName: `Any ${singleClass} Hero`,
            heroesData: [{
                name: singleClass,
                imgFilename: `${toImageFilename(singleClass)}.webp`
            }]
        };
    }

    const heroName = heroMap[classArray.join(',')] || `Any ${classArray.join(' / ')} Hero`;

    return {
        heroName,
        heroesData: heroName.split(/\s*\/\s*/).map(name => ({
            name,
            imgFilename: `${toImageFilename(name)}.webp`
        }))
    };
}

function drawFitText(ctx, text, x, y, maxWidth, startPx, minPx, weight = "bold") {
    let size = startPx;

    do {
        ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`;
        if (ctx.measureText(text).width <= maxWidth) break;
        size--;
    } while (size > minPx);

    ctx.fillText(text, x, y);
}

function drawCircleImage(ctx, img, cx, cy, radius) {
    ctx.save();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();

    ctx.shadowColor = 'transparent';

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    const side = radius * 2;
    ctx.drawImage(img, cx - radius, cy - radius, side, side);

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();
}if (downloadBtn) {
    downloadBtn.addEventListener("click", async (e) => {
    if (currentSeeds.length === 0) return;

    const btn = e.currentTarget;
    const label = btn.querySelector("span");
    const originalText = label?.textContent || "Save deck image";

    if (label) {
        label.textContent = "Saving...";
    }

    btn.disabled = true;

    try {
        // Rest of canvas code...
            const padding = 30;
            const cardBoxWidth = 110;
            const cardBoxHeight = 140;
            const gap = 12;
            const columns = 4;
            const rows = Math.ceil(currentSeeds.length / columns);

            const headerHeight = 118;
            const watermarkHeight = 28;

            const canvasWidth =
                padding * 2 +
                columns * cardBoxWidth +
                (columns - 1) * gap;

            const canvasHeight =
                padding * 2 +
                headerHeight +
                rows * cardBoxHeight +
                (rows - 1) * gap +
                watermarkHeight;

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            const ctx = canvas.getContext('2d');

            // Background
            const cx = canvasWidth / 2;
            const cy = canvasHeight / 2;
            const bgGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvasWidth);
            bgGradient.addColorStop(0, '#2c333a');
            bgGradient.addColorStop(1, '#111417');

            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            ctx.strokeStyle = '#3e464f';
            ctx.strokeStyle = 'rgba(255,255,255,0.10)';
ctx.lineWidth = 2;
ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);

            // Hero/deck data
            const { heroName, heroesData } = getExportHeroData();

           const aiDeckName = getCurrentDeckName();

            // Load hero images
            const loadedHeroes = await Promise.all(
                heroesData.map(async hero => {
                    const base = hero.imgFilename.replace(/\.(webp|png)$/i, '');
                    const img = await loadCanvasImage([
                        `hero_images/${base}.webp`,
                        `hero_images/${base}.png`
                    ]);

                    return { ...hero, img };
                })
            );
            // Load PvZH Vault leaf icon
const vaultIcon = await loadCanvasImage([
    `pvzhvault_favicon.png`,
    `/pvzhvault_favicon.png`,
    `images/pvzhvault_favicon.png`
]);

            // Header panel
            const headerX = padding;
            const headerY = padding;
            const headerW = canvasWidth - padding * 2;
            const headerH = 88;

            const headerGradient = ctx.createLinearGradient(headerX, headerY, headerX, headerY + headerH);
            headerGradient.addColorStop(0, 'rgba(255,255,255,0.11)');
            headerGradient.addColorStop(1, 'rgba(255,255,255,0.04)');

            ctx.fillStyle = headerGradient;
            ctx.beginPath();
            ctx.roundRect(headerX, headerY, headerW, headerH, 18);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Hero avatars
            const avatarRadius = loadedHeroes.length > 1 ? 28 : 34;
            const avatarStartX = headerX + 50;
            const avatarY = headerY + headerH / 2;

            loadedHeroes.slice(0, 3).forEach((hero, i) => {
                const avatarX = avatarStartX + i * 34;

                if (hero.img) {
                    drawCircleImage(ctx, hero.img, avatarX, avatarY, avatarRadius);
                } else {
                    ctx.beginPath();
                    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
                    ctx.fillStyle = '#20262d';
                    ctx.fill();

                    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 18px "Segoe UI", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(hero.name[0] || '?', avatarX, avatarY + 1);
                }
            });

            // Header text
            const textX = headerX + 108 + Math.max(0, loadedHeroes.length - 1) * 24;
            const textMaxW = headerX + headerW - textX - 22;

            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            ctx.fillStyle = '#3cc9e8';
            drawFitText(ctx, aiDeckName, textX, headerY + 34, textMaxW, 22, 15, "bold");

            ctx.fillStyle = 'rgba(215, 221, 228, 0.9)';
            drawFitText(ctx, heroName, textX, headerY + 61, textMaxW, 16, 12, "600");

            // Sort cards
            const sortedSeeds = [...currentSeeds].sort((a, b) => {
                const costA = cardDatabase[a.name]?.Cost || 0;
                const costB = cardDatabase[b.name]?.Cost || 0;
                if (costA !== costB) return costA - costB;
                return a.name.localeCompare(b.name);
            });

            // Load card images
            const loadedImages = await Promise.all(sortedSeeds.map(async seed => {
                const dbName = seed.name.replace(/_/g, ' ').replace(/ /g, '_');

                const img = await loadCanvasImage([
                    `card_images/${dbName}.png`,
                    `card_images/${dbName}.webp`
                ]);

                return { img, seed };
            }));

            // Draw cards
            const cardStartY = padding + headerHeight;

            loadedImages.forEach((item, index) => {
                const col = index % columns;
                const row = Math.floor(index / columns);

                const x = padding + col * (cardBoxWidth + gap);
                const y = cardStartY + row * (cardBoxHeight + gap);

                let drawWidth = cardBoxWidth;
                let drawHeight = cardBoxHeight;
                let dx = x;
                let dy = y;

                if (item.img) {
                    const imgAspect = item.img.width / item.img.height;
                    const boxAspect = cardBoxWidth / cardBoxHeight;

                    if (imgAspect > boxAspect) {
                        drawWidth = cardBoxWidth;
                        drawHeight = cardBoxWidth / imgAspect;
                    } else {
                        drawHeight = cardBoxHeight;
                        drawWidth = cardBoxHeight * imgAspect;
                    }

                    dx = x + (cardBoxWidth - drawWidth) / 2;
dy = y + cardBoxHeight - drawHeight;

                    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
ctx.shadowBlur = 8;
ctx.shadowOffsetY = 4;
                    ctx.shadowOffsetX = 0;

                    ctx.drawImage(item.img, dx, dy, drawWidth, drawHeight);

                    ctx.shadowColor = 'transparent';
                } else {
                    ctx.fillStyle = '#1e2226';
                    ctx.strokeStyle = '#3e464f';
                    ctx.lineWidth = 2;
                    ctx.fillRect(x, y, cardBoxWidth, cardBoxHeight);
                    ctx.strokeRect(x, y, cardBoxWidth, cardBoxHeight);
                }

               // Quantity badge — matches .card-quantity
const quantityText = `x${item.seed.count}`;
const paddingX = 6;
const letterSpacing = 0.5;
const badgeHeight = 17;

ctx.save();

ctx.font = '900 11px "Segoe UI", sans-serif';
ctx.textAlign = 'left';
ctx.textBaseline = 'middle';

// Canvas does not natively support letter-spacing,
// so calculate and draw each character separately.
const characters = [...quantityText];

const quantityTextWidth =
    characters.reduce(
        (total, character) => total + ctx.measureText(character).width,
        0
    ) +
    letterSpacing * Math.max(0, characters.length - 1);

const badgeWidth = Math.ceil(quantityTextWidth + paddingX * 2);
const badgeX = dx + 4;
const badgeY = dy + drawHeight - badgeHeight - 4;

// Background and box shadow
ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
ctx.shadowBlur = 4;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 2;

ctx.beginPath();
ctx.roundRect(
    badgeX,
    badgeY,
    badgeWidth,
    badgeHeight,
    4
);
ctx.fill();

// Border should not inherit the shadow
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;

ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
ctx.lineWidth = 1;
ctx.stroke();

// Quantity text
ctx.fillStyle = '#ffffff';

let characterX = badgeX + paddingX;
const textY = badgeY + badgeHeight / 2 + 0.5;

characters.forEach(character => {
    ctx.fillText(character, characterX, textY);
    characterX +=
        ctx.measureText(character).width +
        letterSpacing;
});

ctx.restore();
            });

   // Minimal bottom-right watermark (no background)
const brandText = 'PVZH VAULT';
const iconSize = 15;

ctx.save();
ctx.textAlign = 'left';
ctx.textBaseline = 'middle';
ctx.font = '700 12px "Segoe UI", sans-serif';

const textWidth = ctx.measureText(brandText).width;
const brandW = iconSize + 7 + textWidth;
const brandX = canvasWidth - padding - brandW;
const brandY = canvasHeight - 15;

// Optional ultra-subtle divider above watermark area
ctx.strokeStyle = 'rgba(255,255,255,0.07)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(padding, canvasHeight - watermarkHeight - 6);
ctx.lineTo(canvasWidth - padding, canvasHeight - watermarkHeight - 6);
ctx.stroke();

// Slight shadow only for readability
ctx.shadowColor = 'rgba(0,0,0,0.45)';
ctx.shadowBlur = 4;
ctx.shadowOffsetY = 1;

// Icon
if (vaultIcon) {
    ctx.globalAlpha = 0.88;
    ctx.drawImage(vaultIcon, brandX, brandY - iconSize / 2, iconSize, iconSize);
    ctx.globalAlpha = 1;
} else {
    ctx.fillStyle = 'rgba(0,180,216,0.9)';
    ctx.beginPath();
    ctx.arc(brandX + iconSize / 2, brandY, iconSize / 2, 0, Math.PI * 2);
    ctx.fill();
}

// Text
ctx.fillStyle = 'rgba(241,245,249,0.82)';
ctx.fillText(brandText, brandX + iconSize + 7, brandY);

ctx.restore();

            // Export
            const link = document.createElement('a');
            link.download = `${aiDeckName.replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'deck_export'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          

        if (typeof gtag === "function") {
        gtag("event", "download_deck_image", {
            deck_name: aiDeckName,
            hero_name: heroName,
            card_count: currentSeeds.reduce(
                (sum, seed) => sum + seed.count,
                0
            ),
            value: 1
        });
    }

    label.textContent = "Downloaded!";
} catch (err) {
    console.error("Canvas generation failed:", err);
    label.textContent = "Error";
} finally {
    setTimeout(() => {
        label.textContent = originalText;
        btn.style.background = "";
        btn.disabled = false;
    }, 2000);
}
    });
}

    // --- ROUTING LOGIC ---

    window.addEventListener('hashchange', handleRouting);

    statsBtn.addEventListener('click', () => {
        window.location.hash = 'stats';
    });

    crafterBtn.addEventListener('click', () => {
        window.location.hash = 'crafter';
    });

    finderBtn.addEventListener('click', () => {
        window.location.hash = 'finder';
    });

    guidesBtn.addEventListener('click', () => {
        window.location.hash = 'guides';
    });

    gamesBtn.addEventListener('click', () => { // <-- NEW
        window.location.hash = 'games';
    });

    tiersBtn.addEventListener('click', () => { // <-- NEW
        window.location.hash = 'tiers';
    });

    if (collectionPageBtn) {
        collectionPageBtn.addEventListener('click', () => {
            window.location.hash = 'collection';
        });
    }

    if (synergyEasterEgg) {
        synergyEasterEgg.addEventListener('click', () => {
            window.location.hash = 'synergy';
        });
    }

    if (typeof backBtn !== 'undefined') {
        backBtn.addEventListener('click', () => {
            window.location.hash = ''; // Clearing the hash triggers the default Home UI
        });
    }
});

// --- Modal Elements ---
const modal = document.getElementById('deckVisualModal');
const modalTitle = document.getElementById('modalDeckTitle');
const modalGrid = document.getElementById('modalDeckGrid');
const closeModalBtn = document.querySelector('.close-modal-btn');

// --- Event Delegation for "View Visual Deck" buttons ---
// We attach the listener to the whole grid instead of 1700 individual buttons
document.getElementById('deckGrid').addEventListener('click', function (e) {
    if (e.target.classList.contains('view-visual-btn')) {
        e.preventDefault();
        const title = e.target.getAttribute('data-title');
        const cardsArray = JSON.parse(decodeURIComponent(e.target.getAttribute('data-cards')));

        openVisualModal(title, cardsArray);
    }
});

function openVisualModal(title, cardsArray) {
    modalTitle.textContent = title;
    modalGrid.innerHTML = ''; // Clear previous deck

    // We will populate this array so the encoder can read it
    const deckToAnalyze = [];

    // Loop directly through the strings in your array
    cardsArray.forEach(cardString => {
        const match = cardString.trim().match(/^x(\d+)\s+(.+)$/i);

        let count = 1;
        let rawName = cardString;

        if (match) {
            count = parseInt(match[1], 10);
            rawName = match[2];
        }

        const displayName = rawName.replace(/_/g, ' ');
        const dbName = displayName.replace(/ /g, '_');

        // FIXED: Push dbName (with underscores) instead of displayName
        deckToAnalyze.push({ name: dbName, count: count });

        const cardDiv = document.createElement('div');
        cardDiv.className = 'visual-card';

        const img = document.createElement('img');
        img.src = `card_images/${dbName}.png`;
        img.alt = displayName;
        img.title = displayName;
        img.style.objectFit = 'contain';

        img.onerror = function () {
            this.onerror = null;
            this.src = `card_images/${dbName}.webp`;
        };

        const badge = document.createElement('div');
        badge.className = 'card-quantity';
        badge.textContent = `x${count}`;

        cardDiv.appendChild(img);
        cardDiv.appendChild(badge);
        modalGrid.appendChild(cardDiv);
    });

    // --- Attach Analyze Logic to the Button ---
    const analyzeBtn = document.getElementById('modalAnalyzeBtn');

    if (analyzeBtn) {
        analyzeBtn.onclick = function () {
            const cardDictionary = Object.keys(cardDatabase).sort();

            const minimalDeckString = deckToAnalyze.map(card => {
                // Find the index using the underscore name
                const index = cardDictionary.indexOf(card.name);

                // Debugging logs just in case!
                if (index === -1) {
                    console.error(`🚨 Could not find card in dictionary: ${card.name}`);
                }

                const cardIndex = index.toString(36);

                return card.count === 4 ? cardIndex : `${cardIndex}.${card.count}`;
            }).join('-');

            const analyzeUrl = `${window.location.origin}${window.location.pathname}?deck=${minimalDeckString}#crafter`;

            console.log("Encoding complete. Target URL:", analyzeUrl);

            // Navigate the user to the encoded URL!
            window.location.href = analyzeUrl;
        };
    }

    // Show the modal
    modal.classList.remove('hidden');
}
// --- Close Modal Logic ---
closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Close modal if user clicks the dark background outside the content
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});
function renderGames() {
    // ==========================================
    // CORE SYSTEM DATA PARSING & COMPILE
    // ==========================================
    let deckCounts = {};
    let validHlCards = [];

    Object.keys(cardDatabase).forEach(card => deckCounts[card] = 0);

    Object.values(fullDatabase).forEach(deck => {
        if (!deck || !deck.cards) return;
        deck.cards.forEach(cardString => {
            const cleanName = cardString.replace(/^x\d\s+/, '');
            if (deckCounts[cleanName] !== undefined) {
                deckCounts[cleanName]++;
            } else {
                deckCounts[cleanName] = 1;
            }
        });
    });

    validHlCards = Object.keys(deckCounts).filter(k => cardDatabase[k] !== undefined);

    // ==========================================
    // ARCADE METRIC STATE CONFIGURATION
    // ==========================================
    let hlScore = 0;
    let hlStreak = 0;
    let peakSessionStreak = 0;
    let hlCombo = 1.0;
    let hlBestScore = parseInt(localStorage.getItem('hlBestScoreArcade') || '0');
    let hlTimeLeft = 60;
    let hlTimerInterval = null;
    const hlTimerText = document.getElementById('hlTimerText');
    // Mechanics State
    let hlSkipsLeft = 3;
    let hlPerfectRun = true;
    let hlIsFever = false;
    let hlIsAnimating = false;

    let currentCardLeft = null;
    let currentCardRight = null;

    // DOM UI Bindings
    const hlArcadeContainer = document.getElementById('hlArcadeContainer');
    const hlCardLeftEl = document.getElementById('hlCardLeft');
    const hlCardRightEl = document.getElementById('hlCardRight');
    const hlTimerBar = document.getElementById('hlTimerBar');
    const hlVsBadge = document.getElementById('hlVsBadge');

    const hlScoreVal = document.getElementById('hlScoreVal');
    const hlComboVal = document.getElementById('hlComboVal');
    const hlStreakVal = document.getElementById('hlStreakVal');
    const hlBestVal = document.getElementById('hlBestVal');

    const hlSkipBtn = document.getElementById('hlSkipBtn');
    const hlSkipCount = document.getElementById('hlSkipCount');

    const hlStartScreen = document.getElementById('hlStartScreen');
    const hlGameOverScreen = document.getElementById('hlGameOverScreen');
    const hlFinalSummary = document.getElementById('hlFinalSummary');

    hlBestVal.textContent = hlBestScore;

    // ==========================================
    // UTILITY HELPER UTILITIES
    // ==========================================
    function setCardImage(imgElement, cardKey) {
        imgElement.src = `card_images/${cardKey}.png`;
        imgElement.onerror = function () {
            this.onerror = null;
            this.src = `card_images/${cardKey}.webp`;
        };
    }

    function getRandomCard(excludeCard) {
        let selection;
        do {
            selection = validHlCards[Math.floor(Math.random() * validHlCards.length)];
        } while (selection === excludeCard);
        return selection;
    }

    function animateValue(element, start, end, duration, postfix = " Decks") {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeProgress * (end - start) + start);

            element.textContent = `${currentVal}${postfix}`;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = `${end}${postfix}`;
            }
        };
        window.requestAnimationFrame(step);
    }

    // Spawns Combat Text (+150, -10s, etc.) over the target card
    function spawnFloatingText(wrapperElement, text, color) {
        const popup = document.createElement('div');
        popup.textContent = text;
        popup.className = 'hl-floating-text';
        popup.style.color = color;
        wrapperElement.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }

    // ==========================================
    // ENGINE RUNTIME CONTROLLERS
    // ==========================================
    function initMatchup() {
        document.getElementById('hlNameLeft').textContent = currentCardLeft.replace(/_/g, ' ');
        document.getElementById('hlCountLeft').textContent = `${deckCounts[currentCardLeft]} Decks`;
        setCardImage(document.getElementById('hlImgLeft'), currentCardLeft);

        document.getElementById('hlNameRight').textContent = currentCardRight.replace(/_/g, ' ');
        document.getElementById('hlCountRight').textContent = `??? Decks`;
        setCardImage(document.getElementById('hlImgRight'), currentCardRight);

        hlIsAnimating = false;
    }

    function cycleCards(targetEl) {
        setTimeout(() => {
            if (targetEl) {
                targetEl.classList.remove('hl-correct-flash');
                targetEl.classList.remove('hl-wrong-flash');
            }
            hlCardLeftEl.classList.add('hl-slide-out');
            hlCardRightEl.classList.add('hl-slide-out');

            setTimeout(() => {
                currentCardLeft = targetEl ? currentCardRight : getRandomCard(null); // Full reset if skipped or wrong
                currentCardRight = getRandomCard(currentCardLeft);

                hlCardLeftEl.classList.remove('hl-slide-out');
                hlCardRightEl.classList.remove('hl-slide-out');
                initMatchup();
            }, 250);
        }, 900);
    }

    function handleGuess(selectedSide) {
        if (hlIsAnimating || hlTimeLeft <= 0) return;
        hlIsAnimating = true;

        const countLeft = deckCounts[currentCardLeft];
        const countRight = deckCounts[currentCardRight];
        animateValue(document.getElementById('hlCountRight'), 0, countRight, 500);

        let isCorrect = false;
        if (selectedSide === 'left' && countLeft >= countRight) isCorrect = true;
        if (selectedSide === 'right' && countRight >= countLeft) isCorrect = true;

        const targetEl = selectedSide === 'left' ? hlCardLeftEl : hlCardRightEl;

        if (isCorrect) {
            hlStreak++;
            peakSessionStreak = Math.max(peakSessionStreak, hlStreak);

            const pointsEarned = Math.round(100 * hlCombo);
            hlScore += pointsEarned;

            hlCombo = parseFloat((hlCombo + 0.2).toFixed(1));

            // --- UPDATED: Floating point precision adjustment & gain flash ---
            hlTimeLeft = Math.min(60, parseFloat((hlTimeLeft + 3).toFixed(1)));
            hlTimerBar.classList.add('timer-gain-flash');
            setTimeout(() => hlTimerBar.classList.remove('timer-gain-flash'), 400);
            // -----------------------------------------------------------------

            // Visual Updates
            hlScoreVal.textContent = hlScore;
            hlStreakVal.textContent = hlStreak;

            hlComboVal.textContent = `${hlCombo}x`;
            hlComboVal.classList.add('hl-combo-pop');
            setTimeout(() => hlComboVal.classList.remove('hl-combo-pop'), 400);

            targetEl.classList.add('hl-correct-flash');

            // Combat Text
            spawnFloatingText(targetEl, `+${pointsEarned}`, '#00f5d4');
            spawnFloatingText(hlCardLeftEl === targetEl ? hlCardRightEl : hlCardLeftEl, `+3s`, '#00b4d8');

            // Fever Mode Check
            if (hlCombo >= 2.0 && !hlIsFever) {
                hlIsFever = true;
                hlArcadeContainer.classList.add('fever-active');
                hlComboVal.style.color = '#ffea00';
                hlVsBadge.textContent = "FEVER!";
                hlVsBadge.style.color = "#ffea00";
            }

            if (hlScore > hlBestScore) {
                hlBestScore = hlScore;
                hlBestVal.textContent = hlBestScore;
                localStorage.setItem('hlBestScoreArcade', hlBestScore.toString());
            }

            cycleCards(targetEl);

        } else {
            hlPerfectRun = false; // Lost the perfect run
            const penalty = hlIsFever ? 15 : 10;

            // --- UPDATED: Floating point precision adjustment & loss flash ---
            hlTimeLeft = Math.max(0, parseFloat((hlTimeLeft - penalty).toFixed(1)));
            hlTimerBar.classList.add('timer-loss-flash');
            setTimeout(() => hlTimerBar.classList.remove('timer-loss-flash'), 400);
            // -----------------------------------------------------------------

            // Reset Combo & Fever
            hlStreak = 0;
            hlCombo = 1.0;
            hlIsFever = false;
            hlArcadeContainer.classList.remove('fever-active');
            hlComboVal.style.color = '#00b4d8';
            hlVsBadge.textContent = "VS";
            hlVsBadge.style.color = "#ff007f";

            hlStreakVal.textContent = hlStreak;
            hlComboVal.textContent = "1.0x";

            targetEl.classList.add('hl-wrong-flash');
            spawnFloatingText(targetEl, `-${penalty}s`, '#ff007f');

            cycleCards(targetEl);
        }
    }

    function handleSkip() {
        if (hlIsAnimating || hlTimeLeft <= 0 || hlSkipsLeft <= 0) return;
        hlIsAnimating = true;

        hlSkipsLeft--;
        hlSkipCount.textContent = hlSkipsLeft;
        if (hlSkipsLeft === 0) hlSkipBtn.disabled = true;

        hlTimeLeft = Math.max(0, hlTimeLeft - 2);
        spawnFloatingText(hlCardRightEl, `SKIPPED (-2s)`, '#ffea00');

        cycleCards(null); // Cycle without evaluating a win/loss
    }

    // ==========================================
    // CHRONO TIMER CLOCK LOOP MANAGEMENT
    // ==========================================
    function startClock() {
        if (hlTimerInterval) clearInterval(hlTimerInterval);

        hlTimerInterval = setInterval(() => {
            // Drop by 0.1 seconds every 100ms loop execution
            hlTimeLeft = parseFloat((hlTimeLeft - 0.1).toFixed(1));
            if (hlTimeLeft < 0) hlTimeLeft = 0;

            // Update precise digital readout text
            hlTimerText.textContent = `${hlTimeLeft.toFixed(1)}s`;

            // Update bar width percentile
            const percent = (hlTimeLeft / 60) * 100;
            hlTimerBar.style.width = `${percent}%`;

            // Handle Alert Stages
            if (hlTimeLeft <= 15) {
                hlTimerBar.classList.add('timer-warning', 'timer-panic');
                hlTimerText.style.color = '#ff007f';
                hlTimerText.style.textShadow = '0 0 10px rgba(255,0,127,0.5)';
                // Make the text slightly pulse size-wise on mobile/desktop
                hlTimerText.style.transform = 'scale(1.1)';
            } else {
                hlTimerBar.classList.remove('timer-warning', 'timer-panic');
                hlTimerText.style.color = '#00f5d4';
                hlTimerText.style.textShadow = '0 0 10px rgba(0,245,212,0.4)';
                hlTimerText.style.transform = 'scale(1)';
            }

            if (hlTimeLeft <= 0) {
                terminateGameLoop();
            }
        }, 100); // 100ms frequency for arcade-grade smoothness
    }

    function terminateGameLoop() {
        clearInterval(hlTimerInterval);

        // Perfect Run Calculation
        let perfectRunHTML = "";
        if (hlPerfectRun && hlScore > 0) {
            hlScore += 5000;
            perfectRunHTML = `<br><span style="color:#ffea00; font-weight:900;">🔥 PERFECT RUN! +5000 🔥</span>`;
            if (hlScore > hlBestScore) {
                hlBestScore = hlScore;
                hlBestVal.textContent = hlBestScore;
                localStorage.setItem('hlBestScoreArcade', hlBestScore.toString());
            }
        }

        // Inside your game over function:
        hlFinalSummary.innerHTML = `
    <div class="hl-stat-line hl-gameover-animate" style="animation-delay: 0.3s;">
        Final Score: <span style="color: #00f5d4; font-weight: 900;">${hlScore}</span>
    </div>
    <div class="hl-stat-line hl-gameover-animate" style="animation-delay: 0.6s;">
        Peak Streak: <span style="color: #ffea00; font-weight: 900;">${peakSessionStreak}</span>
    </div>
    <div class="hl-stat-line hl-gameover-animate" style="animation-delay: 0.9s;">
        All-Time High: <span style="color: #00b4d8; font-weight: 900;">${hlBestScore}</span>
    </div>
`;

        // Show the screen (make sure this happens at the same time so animations sync)
        document.getElementById('hlGameOverScreen').style.display = 'flex';
    }

    function beginGameSession() {
        // Reset Base Stats
        hlScore = 0;
        hlStreak = 0;
        peakSessionStreak = 0;
        hlCombo = 1.0;
        hlTimeLeft = 60;
        hlIsAnimating = false;

        // Reset Mechanics
        hlPerfectRun = true;
        hlIsFever = false;
        hlSkipsLeft = 3;

        hlArcadeContainer.classList.remove('fever-active');
        hlComboVal.style.color = '#00b4d8';
        hlVsBadge.textContent = "VS";
        hlVsBadge.style.color = "#ff007f";

        hlSkipCount.textContent = hlSkipsLeft;
        hlSkipBtn.disabled = false;

        hlScoreVal.textContent = "0";
        hlStreakVal.textContent = "0";
        hlComboVal.textContent = "1.0x";
        hlTimerBar.style.width = "100%";
        hlTimerBar.classList.remove('timer-warning');

        hlStartScreen.style.display = 'none';
        hlGameOverScreen.style.display = 'none';

        currentCardLeft = getRandomCard(null);
        currentCardRight = getRandomCard(currentCardLeft);

        initMatchup();
        startClock();
    }

    // ==========================================
    // ACTION LISTENERS ASSIGNMENTS
    // ==========================================
    hlCardLeftEl.onclick = () => handleGuess('left');
    hlCardRightEl.onclick = () => handleGuess('right');
    hlSkipBtn.onclick = handleSkip;

    document.getElementById('hlStartBtn').onclick = beginGameSession;
    document.getElementById('hlRestartBtn').onclick = beginGameSession;
}

// Keep a global reference to the graph so we don't recreate it every time they click the tab
let currentSynergyGraph = null;

async function renderSynergyWeb() {
    const container = document.getElementById('synergyCanvasContainer');
    const overlay = document.getElementById('synergyLoadingOverlay');
    const progressBar = document.getElementById('synergyProgressBar');
    const progressText = document.getElementById('synergyLoadingText');

    if (!container || currentSynergyGraph) return;

    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';

    // Step 1: Crunch the data (Wait a frame so UI updates)
    await new Promise(r => setTimeout(r, 50));
    const graphData = buildSynergyData();

    // Step 2: Preload all required images for a flawless reveal
    progressText.innerText = `Loading ${graphData.nodes.length} Cards...`;
    let loadedCount = 0;

    const preloadImage = (node) => {
        return new Promise((resolve) => {
            const img = new Image();
            const formattedName = node.id.replaceAll(' ', '_');

            // 1. If it loads successfully (whether PNG or WEBP), attach it and resolve
            img.onload = () => {
                node.img = img;
                resolve();
            };

            // 2. If it fails, check what failed
            img.onerror = () => {
                // If the PNG failed, let's try the WEBP!
                // We overwrite the onerror so if the WEBP *also* fails, it just gives up and resolves (preventing a frozen loading bar)
                img.onerror = () => {
                    console.warn(`Missing image for: ${node.id}`);
                    resolve();
                };

                // Swap the source to WEBP
                img.src = `card_images/${formattedName}.webp`;
            };

            // 3. Kick off the loading process by assuming it's a PNG first
            img.src = `card_images/${formattedName}.png`;
        });
    };

    // Load images in parallel chunks to speed it up while updating the bar
    const batchSize = 20;
    for (let i = 0; i < graphData.nodes.length; i += batchSize) {
        const batch = graphData.nodes.slice(i, i + batchSize);
        await Promise.all(batch.map(preloadImage));

        loadedCount += batch.length;
        const percent = Math.min(100, Math.round((loadedCount / graphData.nodes.length) * 100));
        progressBar.style.width = `${percent}%`;
    }

    // Step 3: Fade out loading screen
    progressText.innerText = "Weaving the Web...";
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500); // Hide completely
    }, 400);
    // Keep track of the highlighted neighborhood
    let activeNode = null;
    const highlightNodes = new Set();
    const highlightLinks = new Set();
    // Step 4: Render the stunning Force-Graph
    currentSynergyGraph = ForceGraph()(container)
        .graphData(graphData)
        .backgroundColor('#0f172a')
        .nodeId('id')
        // 1. Dynamic Link Styling
        .linkColor(link => {
            if (activeNode) {
                // If in focus mode, highlight active links in bright green, hide the rest
                return highlightLinks.has(link) ? 'rgba(76, 175, 80, 0.8)' : 'rgba(180, 200, 255, 0.02)';
            }
            // Default icy blue galaxy look
            return `rgba(180, 200, 255, ${Math.min(0.6, link.weight / 25)})`;
        })
        .linkWidth(link => {
            if (activeNode) {
                return highlightLinks.has(link) ? Math.min(5, Math.max(2, link.weight / 10)) : 0.5;
            }
            return Math.min(3, Math.max(0.5, link.weight / 15));
        })

        // 2. THE SPECTACULAR EFFECT: Glowing Energy Particles
        .linkDirectionalParticles(link => highlightLinks.has(link) ? 4 : 0) // Only animate active links
        .linkDirectionalParticleWidth(4)
        .linkDirectionalParticleColor(() => '#a7f3d0') // Pale green energy
        .linkDirectionalParticleSpeed(0.006)

        // 3. Interactions: The Camera Swoop & Focus State
        .onNodeClick(node => {
            // If they click the same node again, turn off focus mode
            if (activeNode === node) {
                activeNode = null;
                highlightNodes.clear();
                highlightLinks.clear();
                return;
            }

            // Set the new active node and find its neighborhood
            activeNode = node;
            highlightNodes.clear();
            highlightLinks.clear();
            highlightNodes.add(node);

            graphData.links.forEach(link => {
                if (link.source.id === node.id || link.target.id === node.id) {
                    highlightLinks.add(link);
                    highlightNodes.add(link.source);
                    highlightNodes.add(link.target);
                }
            });

            // Smoothly fly the camera to the tapped card
            currentSynergyGraph.centerAt(node.x, node.y, 800); // 800ms pan
            currentSynergyGraph.zoom(1.8, 800); // Zoom in closer
        })
        .onBackgroundClick(() => {
            // Clicking empty space resets the view
            activeNode = null;
            highlightNodes.clear();
            highlightLinks.clear();
        })

        // Physics Setup
        .d3Force('charge', d3.forceManyBody().strength(-200))
        .d3Force('link', d3.forceLink().distance(80).id(d => d.id))
        .d3Force('center', d3.forceCenter())
        .d3Force('x', d3.forceX(0).strength(0.05))
        .d3Force('y', d3.forceY(0).strength(0.05))
        .d3Force('collide', d3.forceCollide(node => {
            return Math.max(20, Math.min(50, node.popularity / 3)) + 5;
        }).iterations(2))

        // 4. Update Node Rendering to Handle Fading
        .nodeCanvasObject((node, ctx, globalScale) => {
            const baseSize = Math.max(20, Math.min(50, node.popularity / 3));

            // Check if we should dim this card
            const isFaded = activeNode && !highlightNodes.has(node);

            ctx.save();

            // Fade out cards that aren't connected to the active node
            ctx.globalAlpha = isFaded ? 0.15 : 1;

            if (node.img && node.img.complete && node.img.naturalHeight !== 0) {

                // Keep the stunning shadows
                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowBlur = 12;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 6;

                // If this is the specifically clicked node, give it an extra glowing aura!
                if (node === activeNode) {
                    ctx.shadowColor = '#4CAF50';
                    ctx.shadowBlur = 25;
                }

                const imgAspect = node.img.naturalWidth / node.img.naturalHeight;
                let drawWidth = baseSize * 2;
                let drawHeight = baseSize * 2;

                if (imgAspect > 1) {
                    drawHeight = drawWidth / imgAspect;
                } else {
                    drawWidth = drawHeight * imgAspect;
                }

                ctx.drawImage(
                    node.img,
                    node.x - (drawWidth / 2),
                    node.y - (drawHeight / 2),
                    drawWidth,
                    drawHeight
                );

            } else {
                ctx.fillStyle = '#334155';
                ctx.fillRect(node.x - baseSize, node.y - baseSize * 1.4, baseSize * 2, baseSize * 2.8);
            }

            ctx.restore();
        })
        .nodePointerAreaPaint((node, color, ctx) => {
            const baseSize = Math.max(20, Math.min(50, node.popularity / 3));

            // Create a clickable rectangle that roughly matches the card dimensions
            const hitWidth = baseSize * 2.2;
            const hitHeight = baseSize * 2.8;

            ctx.fillStyle = color; // The engine passes a unique hidden color to track clicks

            // Draw the invisible clickable box perfectly over the image
            ctx.fillRect(
                node.x - (hitWidth / 2),
                node.y - (hitHeight / 2),
                hitWidth,
                hitHeight
            );
        })
}

// --- Sync Data Cruncher ---
function buildSynergyData() {
    const nodesMap = new Map();
    const edgesMap = new Map();

    for (const key in fullDatabase) {
        const deck = fullDatabase[key];
        if (!deck.cards || !Array.isArray(deck.cards)) continue;

        const deckCards = deck.cards.map(c => c.replace(/^x\d+\s+/, '').trim().replaceAll('_', ' '));

        deckCards.forEach(card => {
            if (!nodesMap.has(card)) {
                nodesMap.set(card, { id: card, popularity: 1 });
            } else {
                nodesMap.get(card).popularity += 1;
            }
        });

        for (let i = 0; i < deckCards.length; i++) {
            for (let j = i + 1; j < deckCards.length; j++) {
                const pair = [deckCards[i], deckCards[j]].sort();
                const edgeId = `${pair[0]}|||${pair[1]}`;

                if (!edgesMap.has(edgeId)) {
                    edgesMap.set(edgeId, { source: pair[0], target: pair[1], weight: 1 });
                } else {
                    edgesMap.get(edgeId).weight += 1;
                }
            }
        }
    }

    const MIN_SYNERGY_WEIGHT = 10;
    const links = Array.from(edgesMap.values()).filter(e => e.weight >= MIN_SYNERGY_WEIGHT);

    const connectedNodes = new Set();
    links.forEach(link => {
        connectedNodes.add(link.source);
        connectedNodes.add(link.target);
    });
    const nodes = Array.from(nodesMap.values()).filter(n => connectedNodes.has(n.id));

    return { nodes, links };
}

function calculateCardScores(decksData) {
    const decks = [];
    let mostRecentDate = 0;

    // A. Parse the decks
    for (const [deckId, deckInfo] of Object.entries(decksData)) {
        if (!deckInfo.upload_date) continue;

        const dateObj = new Date(deckInfo.upload_date);
        if (isNaN(dateObj.getTime())) continue;

        if (dateObj.getTime() > mostRecentDate) {
            mostRecentDate = dateObj.getTime();
        }

        const cardsList = [];
        for (const cardStr of (deckInfo.cards || [])) {
            // Split "x4" and "Clique Peas"
            const spaceIndex = cardStr.indexOf(' ');
            if (spaceIndex !== -1) {
                const countPart = cardStr.substring(0, spaceIndex);
                const namePart = cardStr.substring(spaceIndex + 1);

                if (countPart.startsWith('x')) {
                    const count = parseInt(countPart.substring(1), 10);
                    if (!isNaN(count)) {
                        const cardName = namePart.replace(/_/g, " ");
                        cardsList.push({ name: cardName, count: count });
                    }
                }
            }
        }

        decks.push({ id: deckId, date: dateObj, cards: cardsList });
    }

    if (decks.length === 0) return [];

    // B. Calculate Meta-Metrics
    const totalDecks = decks.length;
    const cardDeckCounts = {};
    const cardWeightedCopies = {};

    // C. Calculate Time-Weighted Copies (TF)
    decks.forEach(deck => {
        // Time-decay: 1-year (365.25 days) half-life.
        const daysOld = (mostRecentDate - deck.date.getTime()) / (1000 * 60 * 60 * 24);
        const timeWeight = Math.pow(0.5, daysOld / 365.25);
        const deckCardsSeen = new Set();

        deck.cards.forEach(card => {
            if (!cardDeckCounts[card.name]) cardDeckCounts[card.name] = 0;
            if (!cardWeightedCopies[card.name]) cardWeightedCopies[card.name] = 0;

            if (!deckCardsSeen.has(card.name)) {
                cardDeckCounts[card.name]++;
                deckCardsSeen.add(card.name);
            }

            cardWeightedCopies[card.name] += (card.count * timeWeight);
        });
    });

    const cardScores = [];

    // D. Apply TF-IDF
    for (const [card, weightedCopies] of Object.entries(cardWeightedCopies)) {
        const docFrequency = cardDeckCounts[card];
        const idf = Math.log(totalDecks / docFrequency);
        const finalScore = weightedCopies * idf;

        cardScores.push({ card, score: finalScore });
    }

    // E. Sort from best to worst
    cardScores.sort((a, b) => b.score - a.score);
    return cardScores;
}

// Keep your existing calculateCardScores function exactly as it is above!

// State variables for the Tier List Navigation
let tierListInitialized = false;
let availableClasses = [];
let currentClassIndex = 0;
let cachedScoredCards = [];

function renderTiers() {
    // 1. One-time initialization when the view is first opened
    if (!tierListInitialized) {
        // Calculate all TF-IDF scores globally and cache them
        cachedScoredCards = calculateCardScores(fullDatabase);

        // Extract a unique, sorted list of all Classes from cardDatabase
        const classSet = new Set();
        for (const key in cardDatabase) {
            if (cardDatabase[key].Class) {
                classSet.add(cardDatabase[key].Class);
            }
        }
        availableClasses = Array.from(classSet).sort();

        // Start on a random class
        if (availableClasses.length > 0) {
            currentClassIndex = Math.floor(Math.random() * availableClasses.length);
        }

        // Hook up the Previous/Next buttons
        document.getElementById('prevClassBtn').addEventListener('click', () => {
            // This math handles negative looping cleanly
            currentClassIndex = (currentClassIndex - 1 + availableClasses.length) % availableClasses.length;
            drawCurrentClassTiers();
        });

        document.getElementById('nextClassBtn').addEventListener('click', () => {
            currentClassIndex = (currentClassIndex + 1) % availableClasses.length;
            drawCurrentClassTiers();
        });

        tierListInitialized = true;
    }

    // 2. Actually draw the list for the current class
    drawCurrentClassTiers();
}

function drawCurrentClassTiers() {
    const container = document.querySelector('.tier-list-container');
    container.innerHTML = ''; // Clear out the old tiers before drawing new ones

    const titleEl = document.getElementById('tierClassTitle');
    const currentClass = availableClasses[currentClassIndex];

    // Update the title visually
    titleEl.textContent = `${currentClass} Tier List`;

    // 3. Filter the cached cards to ONLY include cards belonging to this class
    const classCards = cachedScoredCards.filter(cardData => {
        // Format name to match cardDatabase keys (e.g., "Party Thyme" -> "Party_Thyme")
        const formattedKey = cardData.card.replace(/ /g, "_");
        const dbInfo = cardDatabase[formattedKey];
        return dbInfo && dbInfo.Class === currentClass;
    });

    if (classCards.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No ranked cards found for this class.</p>';
        return;
    }

    // 4. Determine the highest score IN THIS CLASS so the curve fits the page perfectly
    const topScore = classCards[0].score;

    const tiers = [
        { grade: 'S', colorClass: 'tier-s', title: 'Overpowered', cards: [], minScore: topScore * 0.75 },
        { grade: 'A', colorClass: 'tier-a', title: 'Excellent', cards: [], minScore: topScore * 0.45 },
        { grade: 'B', colorClass: 'tier-b', title: 'Great', cards: [], minScore: topScore * 0.25 },
        { grade: 'C', colorClass: 'tier-c', title: 'Average', cards: [], minScore: topScore * 0.10 },
        { grade: 'D', colorClass: 'tier-d', title: 'Niche', cards: [], minScore: topScore * 0.03 },
        { grade: 'F', colorClass: 'tier-f', title: 'Terrible', cards: [], minScore: 0 }
    ];

    // Assign cards to tiers based on the class curve
    classCards.forEach(cardData => {
        for (let i = 0; i < tiers.length; i++) {
            if (cardData.score >= tiers[i].minScore) {
                tiers[i].cards.push(cardData);
                break;
            }
        }
    });

    // 5. Build the DOM
    tiers.forEach(tier => {
        const row = document.createElement('div');
        row.className = 'tier-row';

        const label = document.createElement('div');
        label.className = `tier-label ${tier.colorClass}`;
        label.textContent = tier.grade;
        label.title = tier.title;

        const cardsArea = document.createElement('div');
        cardsArea.className = 'tier-cards';

        tier.cards.forEach(cardData => {
            const imgWrap = document.createElement('div');
            imgWrap.className = 'tier-card-wrapper';

            imgWrap.title = `${cardData.card}\nScore: ${cardData.score.toFixed(2)}`;

            const formattedName = cardData.card.replace(/ /g, "_");

            const img = document.createElement('img');
            img.className = 'tier-actual-card';

            // Default to PNG
            img.src = `card_images/${formattedName}.png`;

            // Fallback to WebP if the PNG is missing
            img.onerror = function () {
                this.onerror = null; // Prevent infinite loop
                this.src = `card_images/${formattedName}.webp`;
            };

            imgWrap.appendChild(img);
            cardsArea.appendChild(imgWrap);
        });

        row.appendChild(label);
        row.appendChild(cardsArea);
        container.appendChild(row);
    });
}
const guidesData = [
    {
        title: "Top 10 Best Decks in PvZH — July 2026",
        description: "The strongest PvZ Heroes decks for the July 2026 meta, ranked by PvZH Vault data.",
        href: "/best-decks-pvzh-july-2026",
        badge: "Latest",
        time: "6 min read",
        date: "July 1, 2026",
        icon: "stack"
    },
    {
        title: "Top 10 Best Decks in PvZH — June 2026",
        description: "A data-backed ranking of the strongest PvZ Heroes decks from the June 2026 meta.",
        href: "/best-decks-pvzh-june-2026",
        badge: "Most searched",
        time: "6 min read",
        date: "June 11, 2026",
        icon: "stack"
    },
    {
        title: "Best Immorticia Decks",
        description: "Taking a look at the most powerful Immorticia decks.",
        href: "/best-immorticia-decks",
        badge: "Hero Guide",
        time: "4 min read",
        date: "June 12, 2026",
        icon: "hero"
    },
    {
        title: "Top 10 Espresso Fiesta Decks",
        description: "A breakdown of the highest-scoring decks featuring the Espresso Fiesta finisher.",
        href: "/best-espresso-fiesta-decks",
        badge: "Card Guide",
        time: "5 min read",
        date: "June 16, 2026",
        icon: "book"
    },
    {
        title: "Top 10 Bad Moon Rising Decks",
        description: "A showcase of the most chaotic and competitive decks relying on the Bad Moon Rising finisher.",
        href: "/best-bad-moon-rising-decks",
        badge: "Card Guide",
        time: "5 min read",
        date: "June 17, 2026",
        icon: "book"
    },
    {
        title: "Top 10 Budget Decks",
        description: "A roundup of the highest-scoring, low-spark decks for players on a budget.",
        href: "/best-budget-decks",
        badge: "Budget Guide",
        time: "5 min read",
        date: "June 19, 2026",
        icon: "budget"
    },
    {
    title: "Best Impfinity Decks",
    description: "A guide to the strongest Impfinity decks, from fast Pirate aggro builds to powerful budget-friendly Crazy/Sneaky strategies.",
    href: "/best-impfinity-decks",
    badge: "Hero Guide",
    time: "5 min read",
    date: "June 28, 2026",
    icon: "hero"
},
    {
        title: "Best Decks for Every Hero in PvZH",
        description: "A complete hero-by-hero guide to the best Plant and Zombie decks, including budget and maxed options.",
        href: "/best-decks-for-every-hero",
        badge: "Mega Guide",
        time: "12 min read",
        date: "June 20, 2026",
        icon: "tiers"
    },
    {
        title: "Best Rose Decks",
        description: "A breakdown of the most dominant Rose decks, from infuriating Heal/Freeze combos to Midrange powerhouses.",
        href: "/best-rose-decks",
        badge: "Hero Guide",
        time: "5 min read",
        date: "June 22, 2026",
        icon: "hero"
    },
    {
        title: "Best Nightcap Decks",
        description: "Exploring the most effective Nightcap decks, featuring aggressive swarm and devastating Cyclecap strategies.",
        href: "/best-nightcap-decks",
        badge: "Hero Guide",
        time: "4 min read",
        date: "June 24, 2026",
        icon: "hero"
    },
    {
    title: "Best Solar Flare Decks",
    description: "A guide to the strongest Solar Flare decks, from budget aggro builds to powerful Pineclone and late-game finishers.",
    href: "/best-solar-flare-decks",
    badge: "Hero Guide",
    time: "5 min read",
    date: "June 25, 2026",
    icon: "hero"
},
{
    title: "Best Zombie Decks in PvZ Heroes — 2026",
    description: "The 10 highest-rated Zombie decks of 2026, with complete card lists, scores, heroes, and strategy breakdowns.",
    href: "/best-zombie-decks-pvzh",
    badge: "Mega Guide",
    time: "10 min read",
    date: "July 21, 2026",
    icon: "tiers"
}
];

function guideIconSvg(type) {
    // All icons standardized to a crisp 24x24 outline grid
    const baseAttrs = 'class="guide-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

    const icons = {
        stack: `<svg ${baseAttrs}><path d="M7 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M3 7H2v10a2 2 0 0 0 2 2h10v-1"/></svg>`,
        hero: `<svg ${baseAttrs}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        budget: `<svg ${baseAttrs}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
        tiers: `<svg ${baseAttrs}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        book: `<svg ${baseAttrs}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
        arrow: `<svg ${baseAttrs}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`
    };

    return icons[type] || icons.stack;
}

function renderGuides() {
    const grid = document.getElementById("guidesGrid");
    if (!grid) return;

    // 1. Sort all guides by date descending (Most recent first)
    const sortedGuides = [...guidesData].sort((a, b) => new Date(b.date) - new Date(a.date));

    // 2. Map structural icon identifiers to clean display categories
    const categoryMapping = {
        stack: "Meta & Core Tier Lists",
        tiers: "Meta & Core Tier Lists",
        hero: "Hero Strategy Guides",
        book: "Card & Finisher Breakdowns",
        budget: "Budget Archetypes"
    };

    // 3. Group the chronologically sorted guides into categories
    const groupedGuides = {};
    sortedGuides.forEach(guide => {
        const categoryName = categoryMapping[guide.icon] || "General Resources";
        if (!groupedGuides[categoryName]) {
            groupedGuides[categoryName] = [];
        }
        groupedGuides[categoryName].push(guide);
    });

    // 4. Set an intentional sequence for how categories stack down the page
    const categoryOrder = [
        "Meta & Core Tier Lists",
        "Hero Strategy Guides",
        "Card & Finisher Breakdowns",
        "Budget Archetypes"
    ];

    // 5. Generate structured HTML chunks
    let htmlContent = "";

    categoryOrder.forEach(category => {
        const guidesInCat = groupedGuides[category];

        // If you haven't written a guide for this category yet, skip rendering the header entirely
        if (!guidesInCat || guidesInCat.length === 0) return;

        htmlContent += `
            <div class="guide-category-group">
                <h2 class="category-heading">${category}</h2>
                <div class="category-cards-grid">
                    ${guidesInCat.map(guide => `
                        <a class="guide-card" href="${guide.href}">
                            <div class="guide-top">
                                <div class="guide-icon-wrap">
                                    ${guideIconSvg(guide.icon)}
                                </div>
                                <div class="guide-badge">${guide.badge}</div>
                            </div>

                            <h3>${guide.title}</h3>
                            <p>${guide.description}</p>

                            <div class="guide-meta">
                                <div class="guide-meta-left">
                                    <span class="guide-date">${guide.date}</span>
                                    <span class="guide-separator">•</span>
                                    <span class="guide-time">${guide.time}</span>
                                </div>
                                <div class="guide-arrow" aria-hidden="true">→</div>
                            </div>
                        </a>
                    `).join("")}
                </div>
            </div>
        `;
    });

    grid.innerHTML = htmlContent;
}
document.addEventListener("DOMContentLoaded", function () {
    const container = document.querySelector('.featured-decks-container');
    if (container) {
        const links = container.querySelectorAll('.featured-decks-link');
        if (links.length > 0) {
            // Choose a random index between 0 and the total number of links
            const randomIndex = Math.floor(Math.random() * links.length);

            // Un-hide the chosen link
            links[randomIndex].classList.add('is-visible');
        }
    }
});
document.addEventListener("DOMContentLoaded", renderGuides);

// ============================================================
// "More" dropdown behavior — paste at the BOTTOM of app.js
// (or anywhere after the DOM is loaded)
//
// Your existing click handlers for #statsBtn, #guidesBtn, and
// #gamesBtn keep working untouched — this only opens/closes
// the menu around them.
// ============================================================

(function () {
    const moreBtn = document.getElementById('moreBtn');
    const dropdown = document.getElementById('moreDropdown');
    if (!moreBtn || !dropdown) return;

    function openMenu() {
        dropdown.hidden = false;
        moreBtn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
        dropdown.hidden = true;
        moreBtn.setAttribute('aria-expanded', 'false');
    }

    moreBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.hidden ? openMenu() : closeMenu();
    });

    // Picking any item (Stats / Guides / Mini Game) closes the menu.
    // The item's own existing handler still fires normally.
    dropdown.addEventListener('click', function () {
        closeMenu();
    });

    // Click anywhere else closes it
    document.addEventListener('click', function (e) {
        if (!dropdown.hidden && !dropdown.contains(e.target) && e.target !== moreBtn) {
            closeMenu();
        }
    });

    // Escape closes it
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });
})();

