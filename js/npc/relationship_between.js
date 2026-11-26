setup.relationshipBetween = {
    npc: null,
    guests: null,
    guests18yo: null,
    _init: function() {
        if (typeof this.npc.relationshipBetween === 'undefined') {
            this.npc.relationshipBetween = {
                stats: {},
                likes: null,
                dislikes: []
            };
        }
    },
    _ignore: function() {
        if (this.npc.assignedTo === 'mistress') {
            return true;
        }

        return false;
    },

    /* A like above this makes someone a close friend */
    CLOSE_FRIEND: 50,

    /* Guests and slaves: everyone whose personal feelings (likes, best friends, standing) this tracks */
    household: function() {
        return [...(variables().guests ?? []), ...(variables().slaves ?? [])];
    },

    /* What friends lose when a guest or slave leaves, as [friend, close friend]. happy is their happiness, trust their relationship with the MC. */
    departures: {
        killed:         { happy: [50, 80] },
        handed_over:    { happy: [50, 80], trust: [25, 50] },
        lost:           { happy: [40, 65] },
        sold:           { happy: [20, 35] },  // a slave sold through a regulated trade (slave market, settlement trade): an accepted transaction, unlike handed_over
        thrown_out:     { happy: [25, 40] },
        betrayed:       { happy: [20, 35] },
        neglected:      { happy: [20, 35] },
        captured:       { happy: [15, 30] },
        marriage_ended: { happy: [15, 30] },
        walked_out:     { happy: [10, 20] },
        punished:       { happy: [10, 20] }, // a basement move her own actions earned
        freed:          { happy: [5, 10] },  // a slave who escaped or was set free: missed, but she is free, a step below walked_out
        moved:          { happy: [0, 5] },
        already_counted: { happy: [0, 0] }   // left with someone else, see reactToCoupleDeparture
    },

    /* Happiness change for friends when a captured guest's fate is settled, as [friend, close friend]. captured + abandoned adds up to killed. */
    CAPTURE_RESCUED: [15, 30],
    CAPTURE_ABANDONED: [35, 50],

    /* What a mother loses when her child is sold */
    CHILD_SOLD_HAPPY: 100,
    CHILD_SOLD_RELATIONSHIP: 100,

    /* A guest or slave "likes" (is in love with) a guest or slave she feels at least LIKE_FROM toward, and lets go below LIKE_CLEAR; adults only.
       Mutual guest likes lead to weddings (getMatches) */
    LIKE_FROM: 95,
    LIKE_CLEAR: 85,

    /*
     * Best friends: up to BEST_FRIENDS people she feels at least BEST_FROM toward, kept in relationshipBetween.best (ids).
     * They skip the plateau resistance in the night school and work sweeps, so they can stay at the top while other ties
     * settle lower. Chosen once and kept until the tie drops below BEST_FROM or the friend is gone, so a team that all
     * stands at 100 keeps the same favorites night after night.
     */
    BEST_FRIENDS: 2,
    BEST_FROM: 75,

    /** Her best friends' ids, after dropping lapsed ones and filling empty places from her highest ties */
    refreshBest: function(npc) {
        const rb = npc.relationshipBetween;
        if (!rb) return [];
        const stats = rb.stats ?? {};
        const around = id => String(id) !== String(npc.id) && (stats[id] ?? -100) >= this.BEST_FROM && !!setup.getNpcById(id);
        const best = (rb.best ?? []).map(String).filter(around);
        if (best.length < this.BEST_FRIENDS) {
            const theirs = id => setup.getNpcById(id)?.relationshipBetween?.stats?.[npc.id] ?? -100;
            const candidates = Object.keys(stats)
                .filter(id => !best.includes(id) && around(id))
                .map(id => ({ id, mine: stats[id], theirs: theirs(id), roll: Math.random() }))
                .sort((x, y) => (y.mine - x.mine) || (y.theirs - x.theirs) || (x.roll - y.roll));
            for (const c of candidates.slice(0, this.BEST_FRIENDS - best.length)) best.push(c.id);
        }
        if (best.length || rb.best) rb.best = best;
        return best;
    },

    isBest: function(npc, otherId) {
        return (npc.relationshipBetween?.best ?? []).includes(String(otherId));
    },

    /* Guest house sex scenes (Guesthouse [Event] - ...): what everyone gains with each other, extra toward whoever made them climax, and with the MC */
    SEX_BOND: 5,
    SEX_CLIMAX_BOND: 3,
    SEX_MC: [1, 3],

    /* After a guest house sex scene. ids: $guests indexes of everyone in it. climaxes: [[climaxer index, [giver indexes]], ...].
       Everyone bonds SEX_BOND with each other, each climax adds SEX_CLIMAX_BOND from the climaxer toward her givers,
       and everyone gains a little with the MC unless mcGain is false. Some event passages wrap an index in a one-element array. */
    afterGuestSex: function(ids, climaxes, mcGain = true) {
        const guests = variables().guests ?? [];
        const at = i => guests[Array.isArray(i) ? i[0] : i];
        const npcs = ids.map(at).filter(Boolean);
        const pairs = this.pairsBefore(npcs);
        const like = (from, to, amount) => {
            from.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
            from.relationshipBetween.stats ??= {};
            from.relationshipBetween.stats[to.id] = Math.clamp((from.relationshipBetween.stats[to.id] ?? 0) + amount, -100, 100);
        };
        for (let i = 0; i < npcs.length; i++) {
            for (let j = i + 1; j < npcs.length; j++) {
                like(npcs[i], npcs[j], this.SEX_BOND);
                like(npcs[j], npcs[i], this.SEX_BOND);
            }
        }
        for (const [climaxer, givers] of climaxes ?? []) {
            const who = at(climaxer);
            if (!who) continue;
            for (const giver of givers.map(at).filter(g => g && g !== who)) like(who, giver, this.SEX_CLIMAX_BOND);
        }
        if (mcGain) {
            for (const npc of npcs) npc.relationship = Math.min(100, (npc.relationship ?? 0) + randomInteger(...this.SEX_MC));
        }
        this.queueMilestones(pairs, ' in the guest house', 'the guest house');
    },

    /* The MC's threesomes and foursomes (Mc threesome fuck, Mc foursome fuck): every action one of them enjoys bonds the
       partners GROUP_ACTION_BOND with each other, up to GROUP_SCENE_MAX per group in one scene (as much as a guest house
       scene, SEX_BOND), and a climax adds SEX_CLIMAX_BOND from her toward each partner who took part in the action that did it */
    GROUP_ACTION_BOND: 1,
    GROUP_SCENE_MAX: 5,
    /* Threesome actions with no partner in them: the single acts (most are the MC alone with her) and the MC's own finishes.
       Every combined action ('pussy_a_pussy_lick', 'bj_anal_reverse', ...) has both partners in it. */
    GROUP_SOLO_ACTIONS: ['handjob', 'footjob', 'titjob', 'bj', 'dp', 'pussy_lick', 'pussy_fingering', 'pussy', 'anal_fingering', 'anal',
        'anal_fisting', 'bj_reverse', 'anal_reverse'],
    /* Foursome actions are all single acts; in these the other two are on her (the texts in Texts/female/foursome.js) */
    FOURSOME_JOINED: ['kissing', 'pussy', 'anal'],

    /* Did the other partners take part in this action with her? (only $tmpGirl climaxes in these scenes) */
    groupJoined: function(kind, action) {
        if (!action) return false;
        if (kind === 'foursome') return this.FOURSOME_JOINED.includes(action);
        if (action === 'double_cum') return true;
        return !this.GROUP_SOLO_ACTIONS.includes(action) && !/^cum_|_cum$/.test(action);
    },

    /* After one action: npcs = [$tmpGirl, $tmpGirl2, ...]; enjoyed = at least one of them liked the action (its positive
       flags); climaxed = $tmpGirl climaxed on it. Returns { bond, climax }: what each pair gained with each other, and the
       climax bond given (0 when none). The per-scene tally lives in $sexActsThisScene, reset by setup.sexActs.startScene. */
    afterGroupAction: function(npcs, kind, action, enjoyed, climaxed) {
        const result = { bond: 0, climax: 0 };
        const group = npcs.filter(npc => npc && npc.id != null);
        if (group.length < 2) return result;
        const pairs = this.pairsBefore(group);
        const like = (from, to, amount) => {
            from.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
            from.relationshipBetween.stats ??= {};
            from.relationshipBetween.stats[to.id] = Math.clamp((from.relationshipBetween.stats[to.id] ?? 0) + amount, -100, 100);
        };
        if (enjoyed) {
            const tally = ((variables().sexActsThisScene ??= {})['~groupBond'] ??= {});
            const key = group.map(npc => String(npc.id)).sort().join('|');
            const bond = Math.min(this.GROUP_ACTION_BOND, this.GROUP_SCENE_MAX - (tally[key] ?? 0));
            if (bond > 0) {
                tally[key] = (tally[key] ?? 0) + bond;
                for (const { a, b } of pairs) {
                    like(a, b, bond);
                    like(b, a, bond);
                }
                result.bond = bond;
            }
        }
        if (climaxed && group[0] === npcs[0] && this.groupJoined(kind, action)) {
            for (const partner of group.slice(1)) like(group[0], partner, this.SEX_CLIMAX_BOND);
            result.climax = this.SEX_CLIMAX_BOND;
        }
        if (result.bond || result.climax) {
            const what = kind === 'foursome' ? 'a foursome with you' : 'a threesome with you';
            this.queueMilestones(pairs, ' after ' + what, what);
        }
        return result;
    },

    /* Milestone tier of one side's value: 2 close friends, 1 friends, -1 rivals, -2 enemies (thresholds from night school) */
    tier: function(value) {
        const T = setup.eveningSchoolSocial.TUNING;
        if (value >= T.CLOSE_FRIENDS) return 2;
        if (value >= T.FRIENDS) return 1;
        if (value <= T.ENEMIES) return -2;
        if (value <= T.RIVALS) return -1;
        return 0;
    },

    /* Both sides' values for a pair, taken before a change and handed to milestones() afterwards */
    pairBefore: function(a, b) {
        return {
            ab: a.relationshipBetween?.stats?.[b.id] ?? 0,
            ba: b.relationshipBetween?.stats?.[a.id] ?? 0
        };
    },

    /*
     * Milestone messages for a pair, announced once per tier (memory in relationshipBetween.esTier, shared by every source):
     * friendship when both sides reach it, a grudge when either side does. place ends the pair lines, e.g. ' at night school'.
     * before (from pairBefore): only tiers this change crossed are announced; tiers the pair already had are recorded quietly.
     * via names the source for the NPC view ('night school'); each side's crossings are kept in esTier[otherId].reached[tier] = { day, via }.
     */
    milestones: function(a, b, place, before, via) {
        const messages = [];
        for (const npc of [a, b]) {
            npc.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
            npc.relationshipBetween.stats ??= {};
        }
        const rbA = a.relationshipBetween;
        const rbB = b.relationshipBetween;
        const memA = ((rbA.esTier ??= {})[b.id] ??= { pos: 0, neg: 0 });
        const memB = ((rbB.esTier ??= {})[a.id] ??= { pos: 0, neg: 0 });
        const tierA = this.tier(rbA.stats[b.id] ?? 0);
        const tierB = this.tier(rbB.stats[a.id] ?? 0);
        const wasA = before ? this.tier(before.ab) : 0;
        const wasB = before ? this.tier(before.ba) : 0;
        const nameA = setup.displayName(a);
        const nameB = setup.displayName(b);

        // When and how each side got this far: every tier stepped past tonight, away from neutral (0 -> 2 records 1 and 2)
        const day = variables().game?.day;
        const note = (mem, now, was) => {
            if (!before || !now || day === undefined) return;
            const from = Math.sign(now) === Math.sign(was) ? Math.abs(was) : 0;
            for (let t = from + 1; t <= Math.abs(now); t++) {
                (mem.reached ??= {})[Math.sign(now) * t] = { day, via };
            }
        };
        note(memA, tierA, wasA);
        note(memB, tierB, wasB);

        const mutual = Math.min(tierA, tierB);
        if (mutual > memA.pos) {
            memA.pos = memB.pos = mutual;
            if (!before || mutual > Math.min(wasA, wasB)) {
                messages.push(nameA + ' and ' + nameB + (mutual === 2 ? ' have become close friends' : ' have become friends') + place + '.');
            }
        }

        const newA = tierA < 0 && tierA < memA.neg;
        const newB = tierB < 0 && tierB < memB.neg;
        if (newA) memA.neg = tierA;
        if (newB) memB.neg = tierB;
        const sayA = newA && (!before || tierA < wasA);
        const sayB = newB && (!before || tierB < wasB);
        if (sayA && sayB && tierA === tierB) {
            messages.push(nameA + ' and ' + nameB + (tierA === -2 ? ' have become bitter enemies' : ' have become rivals') + place + '.');
        } else {
            if (sayA) messages.push(this.grudge(nameA, nameB, tierA));
            if (sayB) messages.push(this.grudge(nameB, nameA, tierB));
        }
        return messages;
    },

    /* Every pair among npcs with its values going in (pairBefore), for queueMilestones */
    pairsBefore: function(npcs) {
        const pairs = [];
        npcs.forEach((a, i) => npcs.slice(i + 1).forEach(b => pairs.push({ a, b, before: this.pairBefore(a, b) })));
        return pairs;
    },

    /* Milestones for daytime changes (guest house sex, house parties, truth or dare). The scene has moved on by the time
       they are known, so they wait in $game.socialMilestones for tonight's report (postQueuedMilestones). */
    queueMilestones: function(pairs, place, via) {
        const game = variables().game;
        if (!game) return;
        const neutral = value => this.tier(value) === 0;
        for (const { a, b, before } of pairs) {
            // Neutral on both sides before and after: milestones() would only add an empty esTier record (a house party pairs every adult)
            if (neutral(before.ab) && neutral(before.ba)
                && neutral(a.relationshipBetween?.stats?.[b.id] ?? 0) && neutral(b.relationshipBetween?.stats?.[a.id] ?? 0)) continue;
            for (const msg of this.milestones(a, b, place, before, via)) (game.socialMilestones ??= []).push(msg);
        }
    },

    /* Posts the queued daytime milestones with the night's own. Called from run(), after the sleep messages are reset. */
    postQueuedMilestones: function() {
        const game = variables().game;
        if (!game?.socialMilestones) return;
        for (const msg of game.socialMilestones) setup.sleepMessages.addJob(msg, 'household');
        delete game.socialMilestones;
    },

    grudge: function(who, whom, tier) {
        return tier === -2
            ? who + ' now considers ' + whom + ' an enemy.'
            : who + ' has come to resent ' + whom + '.';
    },

    /* Labels for the NPC view, by tier */
    TIER_GROUP: { 2: 'Close friends', 1: 'Friends', '-1': 'Rivals', '-2': 'Enemies' },
    TIER_ONE: { 2: 'a close friend', 1: 'a friend', '-1': 'a rival', '-2': 'an enemy' },

    /* Guests and slaves this NPC counts as friends or rivals (her own side past a threshold), closest first, as { npc, type, tier, theirTier, mutual, reached }; type is 'guest' or 'slave' */
    standingWith: function(npc) {
        const stats = npc.relationshipBetween?.stats ?? {};
        const memory = npc.relationshipBetween?.esTier ?? {};
        const slaves = new Set((variables().slaves ?? []).map(s => s.id));
        return this.household()
            .filter(other => other.id !== npc.id && this.tier(stats[other.id] ?? 0) !== 0)
            .map(other => {
                const tier = this.tier(stats[other.id]);
                const theirTier = this.tier(other.relationshipBetween?.stats?.[npc.id] ?? 0);
                return { npc: other, type: slaves.has(other.id) ? 'slave' : 'guest', tier, theirTier, mutual: Math.sign(theirTier) === Math.sign(tier), reached: memory[other.id]?.reached?.[tier] ?? null };
            })
            .sort((x, y) => (stats[y.npc.id] - stats[x.npc.id]));
    },

    /* Hover text for one standingWith() entry: since when and how (when known), and how the other side feels */
    standingTip: function(npc, entry) {
        const lines = [];
        const label = this.TIER_GROUP[entry.tier];
        if (this.isBest(npc, entry.npc.id)) lines.push('Best friend');
        if (entry.reached) {
            const days = Math.max(0, (variables().game?.day ?? entry.reached.day) - entry.reached.day);
            const date = setup.npc.dayToDate(entry.reached.day);
            lines.push(label + ' for ' + days + (days === 1 ? ' day' : ' days') + (date ? ' (since ' + setup.formatDate(date) + ')' : ''));
            if (entry.reached.via) lines.push('Through ' + entry.reached.via);
        }
        // Plain names: displayName is HTML, which a tooltip shows as text
        const name = npc.name;
        const other = entry.npc.name;
        if (entry.mutual) {
            lines.push('Mutual: ' + other + ' considers ' + name + ' ' + this.TIER_ONE[entry.theirTier]);
        } else {
            lines.push('One-sided: ' + (entry.theirTier ? other + ' considers ' + name + ' ' + this.TIER_ONE[entry.theirTier] : other + ' does not feel the same'));
        }
        return lines.join('\n');
    },

    /* Everyone on good terms with this NPC, as { npc, like }. Scores are per direction, so this reads what each of them thinks of her, not what she thinks of them. */
    friendsOf: function(target) {
        const sv = variables();
        const people = [...(sv.slaves ?? []), ...(sv.guests ?? []), ...(sv.nursery ?? []), ...Object.values(sv.characters ?? {})];
        return people
            .filter(person => person.id !== target.id && (person.relationshipBetween?.stats?.[target.id] ?? 0) > 0)
            .map(person => ({ npc: person, like: person.relationshipBetween.stats[target.id] }));
    },

    /* Friends react to one guest or several leaving; departure is a key of departures. Leaving together is one event: each friend reacts once, by her closer tie. */
    reactToDeparture: function(targets, departure) {
        const leaving = [].concat(targets).filter(Boolean);
        const reaction = this.departures[departure] ?? this.departures.walked_out;
        const closest = new Map();
        for (const target of leaving) {
            for (const friend of this.friendsOf(target)) {
                if (!leaving.some(person => person.id === friend.npc.id)) {
                    closest.set(friend.npc, Math.max(closest.get(friend.npc) ?? 0, friend.like));
                }
            }
        }
        const guests = variables().guests ?? [];
        const flightRisk = [[], []]; // [friends, close friends]
        for (const [npc, like] of closest) {
            const tier = like > this.CLOSE_FRIEND ? 1 : 0;
            const wasLeaving = setup.sleep.guestWouldLeave(npc);
            npc.happy = Math.max(-100, (npc.happy ?? 0) - reaction.happy[tier]);
            if (reaction.trust) {
                npc.relationship = Math.max(-100, (npc.relationship ?? 0) - reaction.trust[tier]);
            }
            // Pushed over the overnight walk-out line (setup.sleep.guestWouldLeave): warn the player while there is time to talk her round
            if (!wasLeaving && setup.sleep.guestWouldLeave(npc) && guests.some(g => g.id === npc.id)) {
                flightRisk[tier].push(npc);
            }
        }
        for (const tier of [1, 0]) {
            if (flightRisk[tier].length) this.warnFlightRisk(flightRisk[tier], tier, !!reaction.trust);
        }
    },

    /* Queues a "looking at the gate" warning, shown in the 'Departure warning' interstitial once the player leaves the passage that told them of the departure.
       Queued in a link's setter (before the outcome passage renders), it waits one more passage so the outcome is read first.
       tier: 1 close friend, 0 friend. byMc: the MC caused the departure (a hand-over), which the text then blames. */
    warnFlightRisk: function(npcs, tier, byMc) {
        const game = variables().game;
        if (!game) return;
        (game.departureWarnings ??= []).push({ ids: npcs.map(npc => npc.id), tier, byMc });
        game.departureWarningsDue ??= State.turns + (Engine.state === 'idle' ? 1 : 0);
    },

    /* Texts of the queued warnings that still name a guest who is here */
    flightRiskTexts: function() {
        return (variables().game?.departureWarnings ?? []).map(warning => this.flightRiskText(warning)).filter(Boolean);
    },

    /* Config.navigation.override hook: sends the player to the interstitial, remembering where they were going */
    departureWarningRedirect: function(destination) {
        const game = variables().game;
        if (!game?.departureWarnings?.length || destination === 'Departure warning' || State.turns < (game.departureWarningsDue ?? 0)) return;
        if (!this.flightRiskTexts().length) {
            delete game.departureWarnings;
            delete game.departureWarningsDue;
            return;
        }
        game.departureWarningNext = destination;
        // Where the player really came from, for setup.previousPassage (the override runs before the move, so this is still the origin)
        game.departureWarningFrom = passage();
        return 'Departure warning';
    },

    /* Warning text for the guests in a queued warning who are still here, or '' if none are */
    flightRiskText: function(warning) {
        const npcs = (warning.ids ?? []).map(id => (variables().guests ?? []).find(g => g.id === id)).filter(Boolean);
        if (!npcs.length) return '';
        const friend = warning.tier === 1 ? 'close friend' : 'friend';
        const names = npcs.map(npc => '<strong>' + setup.displayName(npc) + '</strong>');
        const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
        const one = npcs.length === 1 ? npcs[0] : null;
        const she = one ? setup.pronounceWhat(one) : 'they';
        const her = one ? setup.pronounceWhos(one) : 'their';
        const herObj = one ? setup.pronounceWho(one) : 'them';
        const opening = warning.byMc
            ? list + ' seemed very upset when ' + she + ' found out what you did to ' + her + ' ' + friend
            : list + (one ? ' has' : ' have') + ' taken losing ' + her + ' ' + friend + ' very hard';
        return opening + ', and ' + (one ? 'has' : 'have') + ' been looking at the gate a lot. You may want to check in with ' + herObj + ' before you go to bed.';
    },

    /* A couple leaving together, guests or slaves. Remove each of them afterwards with 'already_counted'. */
    reactToCoupleDeparture: function(husband, wife, departure) {
        const household = this.household();
        this.reactToDeparture([husband, wife].filter(npc => household.some(other => other.id === npc?.id)), departure);
    },

    /* Friends react once a captured guest's fate is settled */
    reactToCaptureResolved: function(target, rescued) {
        for (const friend of this.friendsOf(target)) {
            const tier = friend.like > this.CLOSE_FRIEND ? 1 : 0;
            const change = rescued ? this.CAPTURE_RESCUED[tier] : -this.CAPTURE_ABANDONED[tier];
            friend.npc.happy = Math.max(-100, Math.min(100, (friend.npc.happy ?? 0) + change));
        }
    },

    /* The mother of a child sold to the baby merchant, if she is still around */
    reactToChildSold: function(child) {
        const motherId = child?.family?.mother;
        const mother = motherId && motherId !== 'mc' ? setup.getNpcById(motherId) : null;
        if (!mother) {
            return;
        }
        mother.happy = Math.max(-100, (mother.happy ?? 0) - this.CHILD_SOLD_HAPPY);
        mother.relationship = Math.max(-100, (mother.relationship ?? 0) - this.CHILD_SOLD_RELATIONSHIP);
    },

    increaseByParty: function()
    {
        for (let _guestI in this.guests) {
            let _guest = this.guests[_guestI];
            if (this.npc.id === _guest.id) {
                continue;
            }

            this.npc.relationshipBetween.stats[_guest.id]??=0;
            this.npc.relationshipBetween.stats[_guest.id] = Math.min(
                (this.npc.relationshipBetween.stats[_guest.id] + randomInteger(-5, 10)),
                100
            );
        }
    },

    /** Lets go of a like that has faded below LIKE_CLEAR, left, or (teens) should not be there */
    clearLike: function() {
        const rb = this.npc.relationshipBetween;
        // A deleted like (self-like cleanup, old saves) is undefined, which setLike's null check would never refill
        if (rb.likes === undefined) rb.likes = null;
        if (rb.likes === null) return;
        const target = this.household().find(g => String(g.id) === String(rb.likes));
        if (!target || setup.getAge(this.npc) < 18 || setup.getAge(target) < 18 || (rb.stats[rb.likes] ?? 0) < this.LIKE_CLEAR) {
            rb.likes = null;
        }
    },

    setLike: function() {
        // Adults only: teens bond, but never toward marriage
        if (setup.getAge(this.npc) < 18) {
            return;
        }
        let likeableGuests = [];
        const household = this.household();
        for (let targetNpcId in this.npc.relationshipBetween.stats) {
            // Guests and slaves: a like is a personal feeling. Only guest-guest likes reach the wedding matcher (getMatches)
            let targetNpc = household.find(g => String(g.id) === String(targetNpcId));
            if (targetNpc && setup.getAge(targetNpc) >= 18 && this.npc.relationshipBetween.stats[targetNpcId] >= this.LIKE_FROM && (
                (this.npc.likesGirls && targetNpc.gender === 0) || 
                (this.npc.likesGuys && targetNpc.gender === 1) || 
                (this.npc.likesTGirls && targetNpc.gender === 2) ||
                (this.npc.likesTGuys && targetNpc.gender === 3)
            )) {
                likeableGuests.push(targetNpcId);
            }
        }

        if (!likeableGuests.length) {
            return;
        }

        this.npc.relationshipBetween.likes = setup.getRandomElement(likeableGuests);
    },

    setDislike: function() {
        let dislikeableGuests = [];

        for (let targetNpcId in this.npc.relationshipBetween.stats) {
            let stat = this.npc.relationshipBetween.stats[targetNpcId];
            let targetNpc = setup.getNpcById(targetNpcId);

            if (targetNpc && stat <= -70) {
                dislikeableGuests.push(targetNpcId);
            }
        }

        if (!dislikeableGuests.length) {
            return;
        }

        this.npc.relationshipBetween.dislikes = setup.getRandomElement(dislikeableGuests);
    },

    run: function() {
        let start = Date.now();
        const household = this.household();

        // Friendships and grudges reached today in scenes (queueMilestones)
        this.postQueuedMilestones();

        // Work relationships (js/npc/workSocial.js), before the likes so a tie that reached LIKE_FROM tonight counts
        setup.workSocial.sweep();

        // Guests and slaves both form likes; weddings stay guest-only (getMatches)
        for (let i = 0; i < household.length; i++) {
            this.npc = household[i];
            this._init();
            if (this._ignore()) {
                continue;
            }

            if (this.npc.relationshipBetween.likes !== null && this.npc.relationshipBetween.likes === this.npc.id) {
                delete this.npc.relationshipBetween.likes;
            }
            this.clearLike();
            if (setup.percentageChance(5) && this.npc.relationshipBetween.likes === null) {
                this.setLike();
            }
        }

        let end = Date.now() - start;

        this.getMatches();
    },

    runParty: function() {
        let start = Date.now();
        this.guests = variables().guests;
        let guestsCount = this.guests.length;
        // Announced from the age the work sweep counts friendships (young kids get the party bonus quietly)
        const pairs = this.pairsBefore(this.guests.filter(g => setup.getAge(g) >= setup.workSocial.TUNING.MIN_AGE));

        for (let i = 0; i < guestsCount; i++) {
            this.npc = this.guests[i];
            this._init();
            this.increaseByParty();

            if (this.npc.relationshipBetween.likes !== null && this.npc.relationshipBetween.likes === this.npc.id) {
                delete this.npc.relationshipBetween.likes;
            }
            this.clearLike();
            if (setup.percentageChance(5) && this.npc.relationshipBetween.likes === null) {
                this.setLike();
            }
            if (setup.percentageChance(5) && this.npc.relationshipBetween.dislikes === null) {
                this.setDislike();
            }
        }
        this.queueMilestones(pairs, ' at the house party', 'a house party');

        let end = Date.now() - start;
    },

    getMatches: function(notMarried) {
        this.guests = variables().guests;
        let guestsCount = this.guests.length;
    
        // Weddings are a guest social function: only guests' likes are collected, so a pair with a slave on either side never matches
        let _matches = {};
        for (let i = 0; i < guestsCount; i++) {
            this.npc = this.guests[i];
            if (this.npc?.relationshipBetween?.likes) {
                _matches[this.npc.id] = this.npc.relationshipBetween.likes;
            }
        }

        let _matchesBetween = [];
        for (let _npc1Id in _matches) {
            let _npc2Id = _matches[_npc1Id];
            if ((_matches[_npc2Id] ?? false) === _npc1Id) {
                const npc1 = setup.getNpcById(_npc1Id);
                const npc2 = setup.getNpcById(_npc2Id);

                delete _matches[_npc2Id];

                if (notMarried && (npc1.married || npc2.married)) {
                    continue;
                }

                // Only male and female for now; id1 must be the male (proposer)
                if (npc1.gender + npc2.gender !== 1) {
                    continue;
                }

                if ((npc1.traits ?? []).includes('feral') || (npc2.traits ?? []).includes('feral')) {
                    continue;
                }

                // Adults only (setLike already skips teens; this covers likes from older saves)
                if (setup.getAge(npc1) < 18 || setup.getAge(npc2) < 18) {
                    continue;
                }

                const maleId   = npc1.gender === 1 ? _npc1Id : _npc2Id;
                const femaleId = npc1.gender === 1 ? _npc2Id : _npc1Id;
                _matchesBetween.push([maleId, femaleId]);
            }
        }

        return _matchesBetween;
    }

};

/* previous(), looking past the 'Departure warning' interstitial: checks like previous() === 'Wood cabin' (entry encounters)
   still see the passage the player left, not the warning shown on the way */
setup.previousPassage = function() {
    const prev = previous();
    return prev === 'Departure warning' ? (variables().game?.departureWarningFrom ?? prev) : prev;
};

/* Chain the departure warning interstitial onto the existing navigation override (Story JavaScript), whichever loaded first */
$(document).one(':storyready', () => {
    const previous = Config.navigation.override;
    Config.navigation.override = destination => {
        const redirect = typeof previous === 'function' ? previous(destination) : undefined;
        return setup.relationshipBetween.departureWarningRedirect(redirect || destination) || redirect;
    };
});
