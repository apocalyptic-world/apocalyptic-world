/**
 * Slumber party: an NPC with cosmetics may throw one at night (sleepNpcInventory) and give makeovers.
 * Guests invite friends from the guest house, slaves pair up with a neighbor through the bars. Adults only.
 *
 * Personality changes who throws them, who gets invited and what they get out of it. Anyone drunk can
 * also make out, brag about the MC, start a fight or pass out and miss her makeover.
 *
 * processNpc resets npc.drunk as each NPC is processed, so beginNight() keeps tonight's values.
 */
setup.slumberParty = {
    WORK_JOBS: ['strip_club', 'nightclub', 'streets'],
    COOLDOWN_DAYS: 5,
    THROW_CHANCE: 15,
    THROW_TRAITS: { outgoing: 5, friendly: 5, solitary: -5, nervous: -5, cautious: -5 },
    INVITE_LIMIT: 4,
    LIMIT_TRAITS: { outgoing: 1, solitary: -1 },
    INVITE_WEIGHT: 10,
    INVITE_TRAITS: { friendly: 5, compassionate: 5, critical: -5, nervous: -5 },
    STUNNING: 91,
    ENERGETIC_CHANCE: 25,
    CARELESS_CHANCE: 25,
    PASS_OUT_ABOVE: 70,

    /** Extra happiness [min, max] for the invited, not the host. */
    INVITED_HAPPY: { outgoing: [1, 2], sensitive: [2, 4], nervous: [2, 4], cautious: [2, 4] },
    /** Extra relationshipBetween [min, max] for the invited, not the host. */
    INVITED_REL: { outgoing: [2, 4], sensitive: [1, 2], solitary: [3, 6], nervous: [3, 6], cautious: [1, 3] },

    drunk: {},

    /** Call before the nightly NPC loops. */
    beginNight: function () {
        const v = variables();
        this.drunk = {};
        for (const npc of (v.slaves ?? []).concat(v.guests ?? [])) {
            this.drunk[npc.id] = npc.drunk ?? 0;
        }
    },

    drunkOf: function (npc) {
        return this.drunk[npc.id] ?? 0;
    },

    has: function (npc, trait) {
        return setup.personality.has(npc, trait);
    },

    roll: function (range) {
        return randomInteger(range[0], range[1]);
    },

    /** Sum of the values in a { trait: value } table for the traits npc has. */
    traitSum: function (npc, table) {
        let sum = 0;
        for (const trait in table) {
            if (this.has(npc, trait)) sum += table[trait];
        }
        return sum;
    },

    /** Sum of one roll per trait npc has in a { trait: [min, max] } table. */
    traitRoll: function (npc, table) {
        let sum = 0;
        for (const trait in table) {
            if (this.has(npc, trait)) sum += this.roll(table[trait]);
        }
        return sum;
    },

    canHost: function (npc) {
        return setup.npcInventoryHas(npc, 'cosmetics') && npc.happy >= 25 && typeof npc.sick === 'undefined'
            && setup.getAge(npc) >= 18 && (npc.gender === 0 || npc.gender === 2) && !this.WORK_JOBS.includes(npc.assignedTo)
            && !(npc.traits ?? []).includes('feral');
    },

    invitable: function (npc, host) {
        return npc.id !== host.id && setup.getAge(npc) >= 18 && (npc.gender === 0 || npc.gender === 2) && !this.WORK_JOBS.includes(npc.assignedTo);
    },

    pool: function (host, isGuest) {
        const v = variables();
        if (!isGuest) {
            return (v.slaves ?? []).filter(s => this.invitable(s, host));
        }
        const pool = [];
        for (const id in host.relationshipBetween?.stats ?? {}) {
            const guest = (v.guests ?? []).find(g => String(g.id) === String(id));
            if (guest && this.invitable(guest, host)) pool.push(guest);
        }
        return pool;
    },

    /** Weighted draw without replacement, so the friendly are picked more often than the nervous. */
    pickInvited: function (pool, count) {
        const left = pool.map(npc => ({ npc, weight: Math.max(1, this.INVITE_WEIGHT + this.traitSum(npc, this.INVITE_TRAITS)) }));
        const picked = [];
        while (picked.length < count && left.length) {
            let ticket = Math.random() * left.reduce((sum, entry) => sum + entry.weight, 0);
            let index = left.findIndex(entry => (ticket -= entry.weight) < 0);
            if (index < 0) index = left.length - 1;
            picked.push(left.splice(index, 1)[0].npc);
        }
        return picked;
    },

    /** Throws a party if the host's roll allows it. Returns true when one happened. */
    tryHost: function (host, isGuest, partyAlreadyTonight) {
        const day = variables().game.day;
        if (partyAlreadyTonight || !this.canHost(host)) return false;
        if (typeof host.slumberPartyDay !== 'undefined' && day < host.slumberPartyDay + this.COOLDOWN_DAYS) return false;

        const pool = this.pool(host, isGuest);
        if (!pool.length || !setup.percentageChance(this.THROW_CHANCE + this.traitSum(host, this.THROW_TRAITS))) return false;

        // Slaves can only reach the neighbor through the bars, whatever their personality
        const limit = isGuest ? this.INVITE_LIMIT + this.traitSum(host, this.LIMIT_TRAITS) : 1;
        const count = isGuest ? randomInteger(1, Math.min(limit, pool.length)) : 1;
        const invited = this.pickInvited(pool, count);

        let msg = isGuest
            ? host.name + ' got together with ' + (invited.length > 1 ? 'some friends' : 'a friend') + ' for a slumber party, and they gave each other makeovers!\n'
            : host.name + ' and her neighbor ' + invited[0].name + ' gave each other makeovers through the bars.\n';

        const everyone = [host].concat(invited);
        this.applyHappiness(host, invited);
        if (isGuest) this.applyRelationships(host, invited);
        const passedOut = this.drunkEvents(everyone, isGuest);
        msg += passedOut.lines;
        msg += this.makeovers(everyone, passedOut.npcs);

        setup.npcInventoryRemove(host, 'cosmetics', 1);
        host.slumberPartyDay = day;
        setup.sleepMessages.addJob(msg, 'slumber_party');
        return true;
    },

    applyHappiness: function (host, invited) {
        const everyone = [host].concat(invited);
        for (const npc of everyone) {
            let gain = randomInteger(1, 5);
            if (npc !== host) gain += this.traitRoll(npc, this.INVITED_HAPPY);
            if (this.has(npc, 'extravagant')) gain += randomInteger(1, 2);
            for (const other of everyone) {
                if (other === npc) continue;
                if (this.has(other, 'compassionate')) gain += randomInteger(1, 2);
                if (npc !== host && other !== host && this.has(other, 'critical')) gain -= randomInteger(1, 2);
            }
            npc.happy = Math.min(100, npc.happy + Math.max(0, gain));
        }
    },

    applyRelationships: function (host, invited) {
        const everyone = [host].concat(invited);
        for (const npcA of everyone) {
            npcA.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
            for (const npcB of everyone) {
                if (npcA === npcB) continue;
                let gain = typeof npcA.relationshipBetween.stats[npcB.id] === 'undefined' ? 10 : randomInteger(1, 5);
                if (npcA !== host) gain += this.traitRoll(npcA, this.INVITED_REL);
                if (this.has(npcA, 'friendly')) gain += randomInteger(1, 2);
                if (npcA !== host && npcB === host && this.has(npcA, 'critical')) gain += randomInteger(2, 4);
                npcA.relationshipBetween.stats[npcB.id] = Math.min(100, (npcA.relationshipBetween.stats[npcB.id] ?? 0) + gain);
            }
        }
    },

    /** Drunk events, in order. Returns their message lines and who passed out (always last, and skips her makeover). */
    drunkEvents: function (everyone, isGuest) {
        const result = { lines: '', npcs: [] };
        const madeOut = new Set();

        for (const npc of everyone) {
            const drunk = this.drunkOf(npc);
            if (drunk <= 0) continue;
            const others = everyone.filter(other => other !== npc);

            const partner = this.makeOutPartner(npc, others, madeOut);
            if (partner && setup.percentageChance(drunk)) {
                const curious = !(partner.likesGirls ?? false);
                if (!curious || setup.percentageChance(this.biCuriousChance(partner, npc))) {
                    madeOut.add(npc.id).add(partner.id);
                    for (const kisser of [npc, partner]) {
                        kisser.horny = Math.min(100, (kisser.horny ?? 0) + randomInteger(5, 10));
                        kisser.corruption = Math.min(100, (kisser.corruption ?? 0) + randomInteger(2, 4));
                    }
                    result.lines += setup.displayName(npc) + ' had too much to drink and ended up making out with ' + setup.displayName(partner)
                        + (curious ? ', who decided to explore her bi-curious side.\n' : ' on the bed.\n');
                }
            }
            if (this.isMcPartner(npc) && setup.percentageChance(drunk)) {
                result.lines += this.brag(npc, others) + '\n';
            }

            if (setup.percentageChance(drunk / 5)) {
                const rival = setup.getRandomElement(others);
                for (const fighter of [npc, rival]) {
                    fighter.beauty = Math.max(1, fighter.beauty - randomInteger(1, 2));
                }
                if (isGuest) {
                    this.loseRelationship(npc, rival);
                    this.loseRelationship(rival, npc);
                }
                result.lines += setup.displayName(npc) + ' got drunk and started a fight with ' + setup.displayName(rival) + '. Neither of them looks better for it.\n';
            }
        }

        for (const npc of everyone) {
            const drunk = this.drunkOf(npc);
            if (drunk > this.PASS_OUT_ABOVE && setup.percentageChance(drunk)) {
                result.npcs.push(npc);
                result.lines += setup.displayName(npc) + ' passed out before they finished, and missed her makeover.\n';
            }
        }
        return result;
    },

    loseRelationship: function (npc, other) {
        npc.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
        npc.relationshipBetween.stats[other.id] = Math.max(-100, (npc.relationshipBetween.stats[other.id] ?? 0) - randomInteger(3, 6));
    },

    /** Someone she can try to make out with: lesbian content on, she likes girls, and the family rules allow both of them. */
    makeOutPartner: function (npc, others, madeOut) {
        if (!settings.lesbiansEnabled || !(npc.likesGirls ?? false) || madeOut.has(npc.id) || !setup.Tangle.eligible(npc)) return null;
        const noIncest = variables().player?.baseManagement?.noIncest;
        const partners = others.filter(other => !madeOut.has(other.id)
            && setup.Tangle.eligible(other) && !(noIncest && setup.family.isIncest(npc, other)));
        return partners.length ? setup.getRandomElement(partners) : null;
    },

    /** Chance a partner who does not like girls goes along anyway: how drunk she is, or if sober how much she likes npc. */
    biCuriousChance: function (partner, npc) {
        return this.drunkOf(partner) > 0 ? this.drunkOf(partner) : (partner.relationshipBetween?.stats?.[npc.id] ?? 0);
    },

    /** The MC has slept with her, by her history or her acts with the MC. */
    isMcPartner: function (npc) {
        const inHistory = (npc.history ?? []).some(h => h.event === 'first_sex_mc' || (h.event === 'virgin_lost' && h.with === 'mc'));
        return inHistory || setup.sexActs.hadSexWithMc(npc);
    },

    /** Boasts with no number behind them. */
    GENERAL_BRAGS: [
        'You have no idea how big he is. I could barely take him.',
        'He went three rounds last time, and he was still ready for more.',
        'One night with him and you would forget every man you ever met.',
        'With a man that virile, I am amazed the whole settlement is not pregnant.',
        'I have never once left his bed unsatisfied.'
    ],

    /** Stats she can compare with the others. {a} is the bragger; the level comes from bragLevel(). */
    BRAG_STATS: {
        orgasms: {
            value: npc => npc.orgasms ?? 0,
            least: "{a} drunkenly got the others counting how often you've made them cum, then went quiet on learning hers was the lowest count in the room.",
            lower: "{a} started everyone comparing how often you've made them cum, landed in the bottom half, and got teased by the ones you've pleased more.",
            higher: "{a} started everyone comparing how often you've made them cum, came out near the top, and joined in teasing those who came up short.",
            top: "{a} got the others comparing how often you've made them cum, and no one came close. They listened in awe as she described it."
        },
        times: {
            value: npc => setup.sexActs.countWithMc(npc, 'receivedPussyFucked') + setup.sexActs.countWithMc(npc, 'receivedAssFucked'),
            least: "{a} boasted drunkenly about how often you take her to bed, only to find that everyone else has been there more.",
            lower: "{a} started a tally of how many times you've had each of them, and was ribbed by the leaders for landing near the bottom.",
            higher: "{a} started a tally of how many times you've had each of them, and happily ribbed those at the bottom from her place near the top.",
            top: "{a} got a tally going of how many times you've had each of them, and won by a distance. The others were suitably impressed."
        },
        creampies: {
            value: npc => setup.sexActs.countWithMc(npc, 'receivedVaginalCreampie'),
            least: "{a} giggled about how often you finish inside her, then sobered a little on hearing how much more often the others get the same.",
            lower: "{a} asked who you finish inside most often, and the answer wasn't her. The front-runners teased her and the others lagging behind.",
            higher: "{a} asked who you finish inside most often, and was happy to help the other front-runners tease those who get it less.",
            top: "{a} asked who you finish inside most often, and the answer was her, by far. The others hung on every detail."
        },
        kids: {
            value: npc => (npc.family?.kids ?? []).filter(id => setup.getNpcById(id)?.family?.father === 'mc').length,
            least: "{a} toasted to having your children, then realized she has given you fewer than any other mother here.",
            lower: "{a} got the mothers comparing how many children they've had by you, and she and the others with fewer were teased for falling behind.",
            higher: "{a} got the mothers comparing how many children they've had by you, and told those with fewer to get back to work.",
            top: "{a} got the others talking about having your children, and nobody has given you more. They eyed her with open envy."
        },
        corruption: {
            value: npc => npc.corruption ?? 0,
            least: "{a} hinted at the wicked things you've taught her, then blushed when the others described what they've been up to.",
            lower: "{a} got a game going of confessing what you've taught them, and was laughed at by the bolder ones for how tame her stories were.",
            higher: "{a} got a game going of confessing what you've taught them, and joined the bolder ones in making fun of the tamest stories.",
            top: "{a} got a game going of confessing what you've taught them, and her stories left the whole room speechless and squirming."
        }
    },

    /**
     * Who gains what, by the bragger's level. above/below are the others with MC history who beat her or
     * don't (someone level with her counts as on her side); outsider is everyone without MC history.
     */
    BRAG_EFFECTS: {
        least: {
            self: { sub: [3, 6], horny: [3, 5], corruption: [1, 2] },
            above: { corruption: [2, 3], horny: [1, 3] },
            below: { corruption: [2, 3], horny: [1, 3] },
            outsider: { horny: [1, 3] }
        },
        lower: {
            self: { sub: [2, 4], horny: [3, 5], corruption: [2, 3] },
            above: { corruption: [2, 3], horny: [3, 5] },
            below: { sub: [2, 4], horny: [3, 5], corruption: [2, 3] },
            outsider: { horny: [1, 3], sub: [1, 2] }
        },
        higher: {
            self: { corruption: [2, 3], horny: [3, 5] },
            above: { corruption: [2, 3], horny: [3, 5] },
            below: { sub: [2, 4], horny: [3, 5], corruption: [2, 3] },
            outsider: { horny: [1, 3], sub: [1, 2] }
        },
        top: {
            self: { relationship: [2, 4], happy: [2, 4], corruption: [3, 5] },
            below: { sub: [3, 6], corruption: [1, 3], horny: [3, 5] },
            outsider: { sub: [2, 4], corruption: [1, 2], horny: [3, 5] }
        }
    },

    /**
     * Where she stands against the others on one stat: 'least' (below their lowest non-zero value),
     * 'lower' (below their average), 'top' (above their highest) or 'higher'. Null when there is nothing
     * to brag about: she has none of it, or everyone is exactly level with her.
     */
    bragLevel: function (mine, values) {
        if (mine <= 0 || values.every(value => value === mine)) return null;
        const nonZero = values.filter(value => value > 0);
        const average = values.reduce((sum, value) => sum + value, 0) / values.length;
        if (nonZero.length && mine < Math.min(...nonZero)) return 'least';
        if (mine < average) return 'lower';
        if (mine > Math.max(...values)) return 'top';
        return 'higher';
    },

    gain: function (npc, effects) {
        for (const stat in effects ?? {}) {
            npc[stat] = Math.min(100, (npc[stat] ?? 0) + this.roll(effects[stat]));
        }
    },

    /** One drunk boast about the MC, picked from the general and comparable stat brags. Applies it and returns its line. */
    brag: function (npc, others) {
        const pool = this.GENERAL_BRAGS.slice();
        for (const key in this.BRAG_STATS) {
            const stat = this.BRAG_STATS[key];
            const level = this.bragLevel(stat.value(npc), others.map(other => stat.value(other)));
            if (level) pool.push({ stat, level });
        }

        const pick = setup.getRandomElement(pool);
        if (typeof pick === 'string') {
            this.gain(npc, { relationship: [1, 3], corruption: [3, 5] });
            for (const listener of others) {
                const experienced = this.isMcPartner(listener) && !listener.virgin;
                this.gain(listener, { sub: experienced ? [2, 4] : [3, 6], horny: [3, 5] });
            }
            return setup.displayName(npc) + ' got drunk and bragged about you: "' + pick + '"';
        }

        const mine = pick.stat.value(npc);
        const effects = this.BRAG_EFFECTS[pick.level];
        this.gain(npc, effects.self);
        for (const other of others) {
            const value = pick.stat.value(other);
            const beatsHer = value > mine || (pick.level === 'higher' && value === mine);
            this.gain(other, !this.isMcPartner(other) ? effects.outsider : beatsHer ? effects.above : effects.below);
        }
        return pick.stat[pick.level].replace('{a}', setup.displayName(npc));
    },

    /** Applies the beauty gains and returns the message lines. Passed out NPCs get nothing and do no work. */
    makeovers: function (everyone, passedOut) {
        const awake = everyone.filter(npc => !passedOut.includes(npc));
        const gains = new Map();
        for (const npc of awake) {
            if (npc.beauty >= this.STUNNING) continue;
            gains.set(npc, randomInteger(1, 2) + (this.has(npc, 'extravagant') ? randomInteger(0, 1) : 0));
        }

        const proud = new Map();
        for (const npc of awake) {
            if (!this.has(npc, 'energetic') || !setup.percentageChance(this.ENERGETIC_CHANCE)) continue;
            const others = awake.filter(other => other !== npc && gains.has(other) && !proud.has(other));
            if (!others.length) continue;
            const lucky = setup.getRandomElement(others);
            gains.set(lucky, gains.get(lucky) * 2);
            proud.set(lucky, npc);
        }

        let msg = '';
        for (const npc of awake) {
            if (!gains.has(npc)) {
                msg += setup.displayName(npc) + ' was already Stunning, you cannot improve a masterpiece.\n';
                continue;
            }
            const beforeCat = Math.floor((npc.beauty - 1) / 10);
            npc.beauty += gains.get(npc);
            msg += Math.floor((npc.beauty - 1) / 10) > beforeCat
                ? setup.displayName(npc) + ' found the perfect shade to bring forth her potential. She now looks ' + setup.beautyDescription(npc.beauty)
                : setup.displayName(npc) + ' improved her beauty, and looks ' + setup.beautyDescription(npc.beauty);
            if (proud.has(npc)) {
                msg += '. ' + setup.displayName(proud.get(npc)) + ' was particularly proud of her work.';
            }
            msg += '\n';
        }

        for (const npc of awake) {
            if (!this.has(npc, 'careless') || !setup.percentageChance(this.CARELESS_CHANCE)) continue;
            const others = everyone.filter(other => other !== npc);
            if (!others.length) continue;
            const victim = setup.getRandomElement(others);
            victim.beauty = Math.max(1, victim.beauty - randomInteger(1, 4));
            msg += this.carelessLine(npc, victim) + ' ' + setup.displayName(victim) + ' now looks ' + setup.beautyDescription(victim.beauty) + '.\n';
        }
        return msg;
    },

    carelessLine: function (npc, victim) {
        const a = setup.displayName(npc);
        const b = setup.displayName(victim);
        return setup.getRandomElement([
            a + ' mixed up the hair dye, and ' + b + '\'s hair came out a color nobody has a name for.',
            a + ' mistook the hair removal cream for a face mask. ' + b + ' is now short one eyebrow.',
            a + ' sneezed halfway through the eyeliner and drew a long streak across ' + b + '\'s temple.',
            a + ' forgot about the skin scrub, and left ' + b + ' blotchy and glowing red.',
            a + ' got bored halfway through ' + b + '\'s bangs. They now slope to one side.'
        ]);
    }
};
