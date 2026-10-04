/**
 * Strip poker: five-card draw against a guest, played for clothes.
 *
 * Cards are {r: 2..14, s: 0..3}. A hand's value is an array compared left to
 * right: [category, ...tiebreak ranks]. Her play comes from her personality
 * and how drunk she is; how far she will strip comes from corruption, drink
 * and how horny she is.
 */
setup.poker = {
    SUITS: ['♠', '♥', '♦', '♣'],
    FACE: { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' },
    RANK_NAME: { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'jack', 12: 'queen', 13: 'king', 14: 'ace' },
    RANK_PLURAL: { 2: 'twos', 3: 'threes', 4: 'fours', 5: 'fives', 6: 'sixes', 7: 'sevens', 8: 'eights', 9: 'nines', 10: 'tens', 11: 'jacks', 12: 'queens', 13: 'kings', 14: 'aces' },

    /** Her clothes come off outermost first. 'bra' is not a clothing slot: each game decides whether she wears one. */
    HER_ORDER: ['shoes', 'neck', 'mask', 'bot', 'accessories', 'top', 'bra', 'panties'],
    BRA_CHANCE: 65,
    MC_ORDER: ['shoes', 'shirt', 'trousers', 'underwear'],
    COLLECT_BONUS: 15,
    BOT_NAMES: { 1: 'shorts', 2: 'jeans', 3: 'skirt' },
    SHOE_NAMES: { 1: 'heels', 2: 'boots' },

    // ── Cards ────────────────────────────────────────────────────────────────

    newDeck: function () {
        const deck = [];
        for (let s = 0; s < 4; s++) {
            for (let r = 2; r <= 14; r++) {
                deck.push({ r: r, s: s });
            }
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    },

    label: function (card) {
        return (this.FACE[card.r] ?? String(card.r)) + this.SUITS[card.s];
    },

    /** HTML for a row of cards. Face-down cards show their back; `clickable` lets you hold/discard. */
    cardsHtml: function (hand, opts) {
        opts = opts || {};
        const holds = opts.holds || [];
        return '<div class="poker-cards">' + hand.map((card, i) => {
            if (opts.faceDown) {
                return '<div class="poker-card back"></div>';
            }
            const cls = 'poker-card' + ((card.s === 1 || card.s === 2) ? ' red' : '') + (holds[i] ? ' held' : '') + (opts.clickable ? ' clickable' : '');
            const click = opts.clickable ? ' onclick="window.pokerToggle(' + i + ', this)"' : '';
            return '<div class="' + cls + '"' + click + '>' + this.label(card) + '</div>';
        }).join('') + '</div>';
    },

    // ── Hand values ──────────────────────────────────────────────────────────

    evaluate: function (hand) {
        const counts = {};
        hand.forEach(c => { counts[c.r] = (counts[c.r] ?? 0) + 1; });
        const groups = Object.keys(counts).map(Number)
            .sort((a, b) => counts[b] - counts[a] || b - a);
        const shape = groups.map(r => counts[r]);
        const flush = hand.every(c => c.s === hand[0].s);
        let straightHigh = 0;
        if (groups.length === 5) {
            const sorted = groups.slice().sort((a, b) => b - a);
            if (sorted[0] - sorted[4] === 4) straightHigh = sorted[0];
            else if (sorted.join() === '14,5,4,3,2') straightHigh = 5;
        }
        const P = this.RANK_PLURAL, N = this.RANK_NAME;
        const desc = groups.slice().sort((a, b) => b - a);
        if (straightHigh && flush) return { value: [8, straightHigh], name: 'Straight flush, ' + N[straightHigh] + ' high' };
        if (shape[0] === 4) return { value: [7, groups[0], groups[1]], name: 'Four ' + P[groups[0]] };
        if (shape[0] === 3 && shape[1] === 2) return { value: [6, groups[0], groups[1]], name: 'Full house, ' + P[groups[0]] + ' over ' + P[groups[1]] };
        if (flush) return { value: [5, ...desc], name: 'Flush, ' + N[desc[0]] + ' high' };
        if (straightHigh) return { value: [4, straightHigh], name: 'Straight to the ' + N[straightHigh] };
        if (shape[0] === 3) return { value: [3, ...groups], name: 'Three ' + P[groups[0]] };
        if (shape[0] === 2 && shape[1] === 2) return { value: [2, ...groups], name: 'Two pair, ' + P[groups[0]] + ' and ' + P[groups[1]] };
        if (shape[0] === 2) return { value: [1, ...groups], name: 'Pair of ' + P[groups[0]] };
        return { value: [0, ...desc], name: 'High card, ' + N[desc[0]] };
    },

    /** 1 if a beats b, -1 if b wins, 0 for a split. */
    compare: function (a, b) {
        const va = this.evaluate(a).value, vb = this.evaluate(b).value;
        for (let i = 0; i < Math.max(va.length, vb.length); i++) {
            if ((va[i] ?? 0) !== (vb[i] ?? 0)) return (va[i] ?? 0) > (vb[i] ?? 0) ? 1 : -1;
        }
        return 0;
    },

    /** Rough 0..1 strength for her decisions: category first, then how high it is. */
    strength: function (hand) {
        const v = this.evaluate(hand).value;
        return Math.min(1, (v[0] + (v[1] - 2) / 13) / 5);
    },

    // ── Game state ($poker) ──────────────────────────────────────────────────

    /** New game against `npc`: decides the bra first, since her piece count and limit depend on it. */
    start: function (npc) {
        variables().poker = { phase: 'draw', hand: 0, herRemoved: [], youRemoved: 0, ending: null, statsDone: false, note: null,
            bra: setup.percentageChance(this.BRA_CHANCE) };
        variables().poker.herLimit = this.limit(npc);
        this.deal();
    },

    deal: function () {
        const p = variables().poker;
        p.deck = this.newDeck();
        p.you = p.deck.splice(0, 5);
        p.her = p.deck.splice(0, 5);
        p.holds = [false, false, false, false, false];
        p.hand++;
        Object.assign(p, { phase: 'draw', revealed: false, winner: null, loser: null, folded: null, lost: [] });
    },

    draw: function (npc) {
        const p = variables().poker;
        p.you = p.you.map((card, i) => p.holds[i] ? card : p.deck.pop());
        const keep = this.herHolds(npc, p.her);
        p.herDrew = 5 - keep.length;
        p.her = p.her.map((card, i) => keep.includes(i) ? card : p.deck.pop());
        p.phase = 'bet';
    },

    showdown: function (npc, stake) {
        const p = variables().poker;
        const result = this.compare(p.you, p.her);
        p.revealed = true;
        p.folded = null;
        p.winner = result > 0 ? 'you' : result < 0 ? 'her' : 'split';
        this.settle(npc, p.winner === 'you' ? 'her' : p.winner === 'her' ? 'you' : null, stake);
        p.phase = 'result';
    },

    /** `who` folds and loses one piece without a showdown. */
    fold: function (npc, who) {
        const p = variables().poker;
        p.revealed = false;
        p.folded = who;
        p.winner = who === 'you' ? 'her' : 'you';
        this.settle(npc, who, 1);
        p.phase = 'result';
    },

    /** The loser takes off `pieces` items. She quits instead of going past her limit. */
    settle: function (npc, loser, pieces) {
        const p = variables().poker;
        p.loser = loser;
        p.lost = [];
        if (loser === 'her') {
            const all = this.herPieces(npc);
            for (let k = 0; k < pieces; k++) {
                if (p.herRemoved.length >= p.herLimit) {
                    if (p.herRemoved.length < all.length) p.ending = 'herLimit';
                    break;
                }
                const next = all.find(slot => !p.herRemoved.includes(slot));
                if (!next) break;
                p.herRemoved.push(next);
                p.lost.push(next);
            }
            if (!p.ending && p.herRemoved.length >= all.length) p.ending = 'herNaked';
        } else if (loser === 'you') {
            for (let k = 0; k < pieces && p.youRemoved < this.MC_ORDER.length; k++) {
                p.lost.push(this.MC_ORDER[p.youRemoved]);
                p.youRemoved++;
            }
            if (p.youRemoved >= this.MC_ORDER.length) p.ending = 'youNaked';
        }
    },

    // ── How she plays ────────────────────────────────────────────────────────

    /** Indices of her cards she keeps before the draw. */
    herHolds: function (npc, hand) {
        const has = t => setup.personality.has(npc, t);
        const v = this.evaluate(hand).value;
        let keep;
        if (v[0] >= 4) {
            keep = [0, 1, 2, 3, 4];
        } else {
            const counts = {};
            hand.forEach(c => { counts[c.r] = (counts[c.r] ?? 0) + 1; });
            keep = hand.map((c, i) => counts[c.r] >= 2 ? i : -1).filter(i => i >= 0);
            if (!keep.length) {
                const suits = {};
                hand.forEach(c => { suits[c.s] = (suits[c.s] ?? 0) + 1; });
                const flushSuit = Object.keys(suits).find(s => suits[s] === 4);
                keep = flushSuit !== undefined
                    ? hand.map((c, i) => c.s === Number(flushSuit) ? i : -1).filter(i => i >= 0)
                    : hand.map((c, i) => ({ c, i })).filter(x => x.c.r >= 12).sort((a, b) => b.c.r - a.c.r).slice(0, 2).map(x => x.i);
            }
        }
        // careless or drunk players sometimes throw away a card they should have kept
        if (keep.length && keep.length < 5 && (has('careless') ? 30 : 0) + ((npc.drunk ?? 0) >= 60 ? 20 : 0) > Math.random() * 100) {
            keep.splice(Math.floor(Math.random() * keep.length), 1);
        }
        return keep;
    },

    /** Her read of her own hand, bent by personality and drink. */
    _nerve: function (npc) {
        const has = t => setup.personality.has(npc, t);
        let nerve = 0;
        if (has('confident')) nerve += 0.12;
        if (has('cautious')) nerve -= 0.12;
        if ((npc.drunk ?? 0) >= 50) nerve += 0.1;
        return nerve;
    },

    /** You raised: does she call? */
    herCalls: function (npc, hand) {
        const bluffCall = setup.personality.has(npc, 'confident') ? 20 : setup.personality.has(npc, 'cautious') ? 0 : 8;
        return this.strength(hand) + this._nerve(npc) >= 0.3 || setup.percentageChance(bluffCall);
    },

    /** You checked: does she raise? Strong hands raise; confident or drunk players bluff. */
    herRaises: function (npc, hand) {
        const bluff = (setup.personality.has(npc, 'confident') ? 15 : 0) + ((npc.drunk ?? 0) >= 50 ? 10 : 0);
        return this.strength(hand) + this._nerve(npc) >= 0.45 || setup.percentageChance(bluff);
    },

    // ── Clothes ──────────────────────────────────────────────────────────────

    /** Slots she is wearing, in the order they come off. */
    herPieces: function (npc) {
        const bra = variables().poker?.bra ?? false;
        return this.HER_ORDER.filter(slot => slot === 'bra' ? bra && !!npc.clothes?.top : npc.clothes?.[slot]);
    },

    pieceName: function (npc, slot) {
        const v = npc.clothes?.[slot];
        switch (slot) {
            case 'bot': return this.BOT_NAMES[v] ?? 'skirt';
            case 'shoes': return this.SHOE_NAMES[v] ?? 'shoes';
            case 'accessories': return v === 1 ? 'fishnets' : 'stockings';
            case 'neck': return 'choker';
            case 'bra': return 'bra';
            default: return slot;
        }
    },

    /** She only sits down to play if she likes you, is corrupted enough, or has had a few. */
    agrees: function (npc) {
        return (npc.relationship ?? 0) >= 40 || (npc.corruption ?? 0) >= 40 || (npc.drunk ?? 0) >= 40;
    },

    /** How many pieces she will take off before she quits. */
    limit: function (npc) {
        const pieces = this.herPieces(npc);
        if ((npc.traits ?? []).includes('nymphomaniac')) return pieces.length;
        const nerve = (npc.corruption ?? 0) + (npc.drunk ?? 0) / 2 + ((npc.horny ?? 0) >= 60 ? 15 : 0) + ((npc.relationship ?? 0) >= 70 ? 10 : 0);
        let keeps = [];
        if (nerve < 45) keeps = ['top', 'bra', 'panties'];
        else if (nerve < 70) keeps = ['panties'];
        return pieces.filter(slot => !keeps.includes(slot)).length;
    },

    /**
     * She lost everything: does she let you collect? Uses sexChance, plus a bonus when she
     * likes guys (she is already sitting there naked). Returns 'yes', or why not:
     * 'incest', 'married', 'type' (not into guys) or 'mood'.
     */
    collect: function (npc) {
        const likesGuys = npc.likesGuys ?? true;
        if (setup.percentageChance(Math.min(100, setup.sexChance(npc) + (likesGuys ? this.COLLECT_BONUS : 0)))) return 'yes';
        if (variables().player?.baseManagement?.noIncest && setup.family.isBloodToMC(npc)) return 'incest';
        if (npc.married && npc.family?.husband !== 'mc' && !setup.npc.isSpouseLost(npc.family?.husband)) return 'married';
        if (!likesGuys) return 'type';
        return 'mood';
    },

    /**
     * The action image for taking off `slot`, shown with location 'poker'
     * (images/actions/<gender>/poker/<action>/). Returns null when no folder exists yet,
     * so adding e.g. undress_jeans or remove_boots later is picked up automatically.
     */
    actionFor: function (npc, slot) {
        let action;
        if (slot === 'top') action = variables().poker?.bra ? 'remove_top' : 'remove_top_no_bra';
        else if (slot === 'bra') action = 'remove_bra';
        else if (slot === 'panties') action = 'undress_panties';
        else if (slot === 'bot') action = 'undress_' + this.pieceName(npc, 'bot');
        else action = 'remove_' + this.pieceName(npc, slot);
        const gender = setup.genderPath(npc);
        const index = setup.actions ?? {};
        const exists = Object.keys(index).some(folder => folder.split('.')[0] === gender && index[folder]?.poker?.[action]);
        return exists ? action : null;
    },

    /** Your gambling experience lets you read her. Returns a hint or null. */
    tell: function (npc, hand, gambler) {
        if ((gambler ?? 0) < 10) return null;
        let s = this.strength(hand);
        if (gambler < 30 && setup.percentageChance(35)) s = 1 - s; // not always right yet
        if (s >= 0.45) return 'She could not stop glancing at her cards. She liked this hand.';
        if (s >= 0.25) return 'She kept her face perfectly still. Hard to say.';
        return 'She chewed her lip and rearranged her cards twice. She did not like them.';
    }
};

/** Card clicks toggle hold without re-rendering the passage. */
window.pokerToggle = function (i, el) {
    const poker = variables().poker;
    if (!poker || poker.phase !== 'draw') return;
    poker.holds[i] = !poker.holds[i];
    el.classList.toggle('held', poker.holds[i]);
};
