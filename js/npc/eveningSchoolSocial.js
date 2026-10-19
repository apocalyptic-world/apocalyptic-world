/**
 * Night school social sweep: once a night, the people who attended evening class
 * (setup.eveningSchool.night.roster) form, deepen, sour and escalate relationships.
 *
 * Model ("shared encounter"): each pair rolls once for whether they interacted tonight.
 * If they did, each side works out its own shift (-4..+4) from its own point of view,
 * so A can warm to B while B is annoyed. Values live in the existing per-direction
 * npc.relationshipBetween.stats, clamped to -100..100, alongside:
 *   relationshipBetween.last[otherId]   sign of the last night-school shift (-1 / 1)
 *   relationshipBetween.esTier[otherId] milestone tiers already announced { pos, neg }
 *
 * Every number lives in TUNING. Personality traits come from setup.personality.has;
 * 'sadistic' and 'masochist' are regular npc.traits.
 */
setup.eveningSchoolSocial = {
    // Calibrated with a headless simulator (25 attendees, 5 classes): ~3 shifts per NPC a night. By night 47 a typical
    // school has ~18 mutual friendships, ~3 friend groups and ~5 loners; by night 100 ~8 groups, ~10 best-friend pairs
    // and rare cross-class bridges. The plateau keeps 100s occasional: a proposal-ready couple in ~40% of schools by
    // night 100, about one per school by a year.
    TUNING: {
        // Chance that a pair interacts tonight: BASE x context x sqrt(mA x mB), clamped
        BASE: 0.033,
        P_MIN: 0.02,             // floor once either side knows the other
        P_MIN_NEW: 0.005,        // floor for strangers, so the whole school doesn't meet in a few weeks
        P_MAX: 0.6,

        // Context (applies to the pair)
        SAME_CLASS: 11.45,
        AGE_BONUS: 1,            // up to x(1 + AGE_BONUS) at the same age...
        AGE_SPAN: 20,            // ...fading to x1 at AGE_SPAN years apart
        FAMILY: 1.5,             // related or married
        INSTRUCTOR_PAIR: 5.88,
        SLAVE_PAIR: 2,

        // Personal multipliers, any shift (X's side, toward Y)
        NERVOUS: 0.7,
        BEST_FRIEND: 1.8,
        NEMESIS: 1.8,
        FRIENDLY_POSITIVE: 1.3,      // friendly, and the relationship is positive
        CRITICAL_NEGATIVE: 1.3,      // critical, and the relationship is negative
        CONFIDENT_TO_INSTRUCTOR: 1.4,// guest student -> instructor
        CURIOUS_CROSS_CLASS: 1.3,    // guest student -> someone outside their class
        CAUTIOUS_CROSS_CLASS: 0.7,
        SLAVE_CONFIDENT_TO_GUEST: 1.4,
        SLAVE_WITH_COMPASSIONATE: 1.3,

        // Personal multipliers, starting a new relationship (X has no value for Y yet)
        NEW_DECAY: 1.11,         // x 1 / (1 + NEW_DECAY x ties already in the school)
        FIRST_BONUS: 2.07,        // no ties yet: classmates (or anyone, if alone in class), unless solitary
        NEW_OUTGOING: 3.13,
        NEW_CONFIDENT: 1.3,
        NEW_CURIOUS: 1.3,
        NEW_CAUTIOUS: 0.75,
        NEW_SLAVE_CURIOUS_TO_GUEST_STUDENT: 1.3,
        NEW_SLAVE_CAUTIOUS_TO_GUEST: 0.7,

        // Chance a shift is positive: POS_BASE + adjustments, clamped
        POS_BASE: 0.683,
        POS_MIN: 0.08,
        POS_MAX: 0.92,
        ALREADY_POSITIVE: 0.197,  // scaled by how positive (see momentum)
        ALREADY_NEGATIVE: 0.195,  // scaled by how negative; stronger, so feuds escalate
        MOMENTUM_FLOOR: 0.3,     // momentum weight = FLOOR + (1 - FLOOR) x min(1, |value| / MOMENTUM_SPAN)
        MOMENTUM_SPAN: 22.78,
        LAST_WAS_NEGATIVE: -0.15,
        CRITICAL: -0.12,
        CRITICAL_INSTRUCTOR: -0.1,   // either side critical and the other's instructor
        FRIENDLY: 0.12,
        COMPASSIONATE: 0.1,          // either side
        SLAVE_COMPASSIONATE: 0.08,   // slave X, compassionate Y (on top of the above)
        SADISTIC_TO_SLAVE: -0.2,     // sadistic non-slave Y, slave X who isn't a masochist

        // Circles: X's friends' friends and enemies (X -> F >= FRIENDS, then F -> Y >= FRIENDS or <= RIVALS).
        // Each such F counts CIRCLE_FRIEND units, or CIRCLE_CLOSE if X is close friends with F; capped at CIRCLE_CAP.
        CIRCLE_FRIEND: 1,
        CIRCLE_CLOSE: 2,
        CIRCLE_CAP: 3,
        ALLY_NEW: 0.439,           // new relationship with a friend's friend: x(1 + ALLY_NEW x units)
        FOE_NEW: 0.5,            // new relationship with a friend's enemy:  x(1 + FOE_NEW x units)
        ALLY_POSITIVE: 0.039,     // positive chance per unit, friend's friend
        FOE_NEGATIVE: 0.082,      // negative chance per unit, friend's enemy

        // Plateau: past RESIST_FROM, the positive chance falls by up to RESIST at 100, so each pair settles
        // where its compatibility puts it instead of everyone drifting to 100 (and into the wedding matcher)
        RESIST_FROM: 30,
        RESIST: 0.45,

        // Size of a shift
        BIG_SHIFT: 0.898,          // chance the base size is 2 instead of 1
        RATIONAL_NULLIFY: 0.35,  // rational: chance a negative shift becomes 0
        COMPASSIONATE_FLIP: 0.3, // compassionate: chance a negative shift becomes +1
        MAX_SHIFT: 4,

        // Milestones (announced once per tier)
        FRIENDS: 40,
        CLOSE_FRIENDS: 75,
        RIVALS: -40,
        ENEMIES: -75,
    },

    // Last sweep, for the Dev Tool page: { encounters, shifts: { id: count }, messages: [] }
    lastRun: null,

    /**
     * Run tonight's sweep over setup.eveningSchool.night.roster. Safe to call when nobody attended.
     * options.quiet: collect milestone messages in the result without posting them (Dev Tool runs).
     */
    sweep: function (options) {
        const quiet = !!(options && options.quiet);
        const night = setup.eveningSchool.night;
        const run = { encounters: 0, shifts: {}, messages: [] };
        this.lastRun = run;
        if (!night || !night.roster || night.roster.length < 2) return run;

        const people = night.roster
            .map(r => Object.assign({ npc: setup.getNpcById(r.id) }, r))
            .filter(p => p.npc);
        this._people = new Map(people.map(p => [p.id, p]));
        for (const p of people) this._prepare(p, people);

        const changed = [];
        for (let i = 0; i < people.length; i++) {
            for (let j = i + 1; j < people.length; j++) {
                const a = people[i];
                const b = people[j];
                if (Math.random() >= this.encounterChance(a, b)) continue;
                run.encounters++;

                // Both sides judge the same encounter from the values they had going in
                const deltaA = this.shift(a, b);
                const deltaB = this.shift(b, a);
                if (this._apply(a, b, deltaA)) run.shifts[a.id] = (run.shifts[a.id] ?? 0) + 1;
                if (this._apply(b, a, deltaB)) run.shifts[b.id] = (run.shifts[b.id] ?? 0) + 1;
                if (deltaA || deltaB) changed.push([a, b]);
            }
        }

        for (const [a, b] of changed) {
            for (const msg of this._milestones(a, b)) {
                run.messages.push(msg);
                if (!quiet) setup.sleepMessages.addJob(msg, 'school');
            }
        }
        return run;
    },

    // ── Pieces ──────────────────────────────────────────────────────────────

    _has: function (npc, ...traits) {
        return traits.some(t => setup.personality.has(npc, t));
    },

    _stats: function (npc) {
        npc.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
        npc.relationshipBetween.stats ??= {};
        return npc.relationshipBetween;
    },

    /** Per-night facts about one attendee: age, ties in the school, best friend, nemesis, family. */
    _prepare: function (p, people) {
        const stats = this._stats(p.npc).stats;
        p.age = setup.getAge(p.npc);
        p.ties = 0;
        p.friends = []; // [{ id, units }] people in the school p counts as friends
        let best = 0;
        let worst = 0;
        for (const other of people) {
            if (other.id === p.id || typeof stats[other.id] === 'undefined') continue;
            p.ties++;
            if (stats[other.id] >= this.TUNING.FRIENDS) {
                p.friends.push({ id: other.id, units: stats[other.id] >= this.TUNING.CLOSE_FRIENDS ? this.TUNING.CIRCLE_CLOSE : this.TUNING.CIRCLE_FRIEND });
            }
            if (stats[other.id] > best) { best = stats[other.id]; p.bestFriend = other.id; }
            if (stats[other.id] < worst) { worst = stats[other.id]; p.nemesis = other.id; }
        }
        p.aloneInClass = !p.cls || !people.some(o => o.id !== p.id && o.cls === p.cls);
        p.family = setup.family.getFamily(p.npc);
        p.spouse = setup.npc.currentMarriage(p.npc)?.with ?? null;
    },

    /** How strongly X's friends pull X toward Y: { ally, foe } units (friends of Y / enemies of Y among X's friends). */
    _circle: function (x, y) {
        const T = this.TUNING;
        let ally = 0;
        let foe = 0;
        for (const f of x.friends ?? []) {
            if (f.id === y.id) continue;
            const friend = this._people?.get(f.id);
            const view = friend ? this._stats(friend.npc).stats[y.id] : undefined;
            if (view >= T.FRIENDS) ally += f.units;
            else if (view <= T.RIVALS) foe += f.units;
        }
        return { ally: Math.min(T.CIRCLE_CAP, ally), foe: Math.min(T.CIRCLE_CAP, foe) };
    },

    _sameClass: function (x, y) {
        return !!x.cls && x.cls === y.cls;
    },

    _isInstructorOf: function (x, y) {
        return x.role === 'instructor' && y.role === 'student' && x.cls === y.cls;
    },

    /** Chance (0..1) that a and b interact tonight. */
    encounterChance: function (a, b) {
        const T = this.TUNING;
        let context = 1;
        if (this._sameClass(a, b)) context *= T.SAME_CLASS;
        context *= 1 + T.AGE_BONUS * Math.max(0, 1 - Math.abs(a.age - b.age) / T.AGE_SPAN);
        if (a.family.has(b.id) || a.spouse === b.id || b.spouse === a.id) context *= T.FAMILY;
        if (a.role === 'instructor' && b.role === 'instructor') context *= T.INSTRUCTOR_PAIR;
        if (a.type === 'slave' && b.type === 'slave') context *= T.SLAVE_PAIR;

        const p = T.BASE * context * Math.sqrt(this.personal(a, b) * this.personal(b, a));
        const strangers = typeof this._stats(a.npc).stats[b.id] === 'undefined'
            && typeof this._stats(b.npc).stats[a.id] === 'undefined';
        return Math.min(T.P_MAX, Math.max(strangers ? T.P_MIN_NEW : T.P_MIN, p));
    },

    /** X's personal multiplier toward Y (traits, best friend / nemesis, new-relationship odds). */
    personal: function (x, y) {
        const T = this.TUNING;
        const npc = x.npc;
        const value = this._stats(npc).stats[y.id];
        const isNew = typeof value === 'undefined';
        const crossClass = !this._sameClass(x, y);
        const guestStudent = x.type === 'guest' && x.role === 'student';
        let m = 1;

        // Any shift
        if (this._has(npc, 'nervous')) m *= T.NERVOUS;
        if (x.bestFriend === y.id) m *= T.BEST_FRIEND;
        if (x.nemesis === y.id) m *= T.NEMESIS;
        if (!isNew && value > 0 && this._has(npc, 'friendly')) m *= T.FRIENDLY_POSITIVE;
        if (!isNew && value < 0 && this._has(npc, 'critical')) m *= T.CRITICAL_NEGATIVE;
        if (guestStudent) {
            if (y.role === 'instructor' && this._has(npc, 'confident')) m *= T.CONFIDENT_TO_INSTRUCTOR;
            if (crossClass && this._has(npc, 'curious')) m *= T.CURIOUS_CROSS_CLASS;
            if (crossClass && this._has(npc, 'cautious')) m *= T.CAUTIOUS_CROSS_CLASS;
        }
        if (x.type === 'slave') {
            if (y.type === 'guest' && this._has(npc, 'confident')) m *= T.SLAVE_CONFIDENT_TO_GUEST;
            if (this._has(y.npc, 'compassionate')) m *= T.SLAVE_WITH_COMPASSIONATE;
        }

        // Starting a new relationship
        if (isNew) {
            if (x.ties > 0) {
                m *= 1 / (1 + T.NEW_DECAY * x.ties);
            } else if (!this._has(npc, 'solitary') && (!crossClass || x.aloneInClass)) {
                m *= T.FIRST_BONUS;
            }
            if (this._has(npc, 'outgoing')) m *= T.NEW_OUTGOING;
            if (this._has(npc, 'confident')) m *= T.NEW_CONFIDENT;
            if (this._has(npc, 'curious')) m *= T.NEW_CURIOUS;
            if (this._has(npc, 'cautious')) m *= T.NEW_CAUTIOUS;
            const circle = this._circle(x, y);
            m *= (1 + T.ALLY_NEW * circle.ally) * (1 + T.FOE_NEW * circle.foe);
            if (x.type === 'slave' && y.type === 'guest') {
                if (y.role === 'student' && this._has(npc, 'curious')) m *= T.NEW_SLAVE_CURIOUS_TO_GUEST_STUDENT;
                if (this._has(npc, 'cautious')) m *= T.NEW_SLAVE_CAUTIOUS_TO_GUEST;
            }
        }
        return m;
    },

    /** Chance (0..1) that X's shift toward Y tonight is positive. */
    positiveChance: function (x, y) {
        const T = this.TUNING;
        const rb = this._stats(x.npc);
        const value = rb.stats[y.id];
        let pos = T.POS_BASE;

        if (typeof value !== 'undefined' && value !== 0) {
            const weight = T.MOMENTUM_FLOOR + (1 - T.MOMENTUM_FLOOR) * Math.min(1, Math.abs(value) / T.MOMENTUM_SPAN);
            pos += (value > 0 ? T.ALREADY_POSITIVE : -T.ALREADY_NEGATIVE) * weight;
        }
        if ((rb.last ?? {})[y.id] < 0) pos += T.LAST_WAS_NEGATIVE;
        if (this._has(x.npc, 'critical')) pos += T.CRITICAL;
        if ((this._isInstructorOf(x, y) && this._has(x.npc, 'critical'))
            || (this._isInstructorOf(y, x) && this._has(y.npc, 'critical'))) pos += T.CRITICAL_INSTRUCTOR;
        if (this._has(x.npc, 'friendly')) pos += T.FRIENDLY;
        const circle = this._circle(x, y);
        pos += T.ALLY_POSITIVE * circle.ally - T.FOE_NEGATIVE * circle.foe;
        if (value > T.RESIST_FROM) pos -= T.RESIST * (value - T.RESIST_FROM) / (100 - T.RESIST_FROM);
        if (this._has(x.npc, 'compassionate') || this._has(y.npc, 'compassionate')) pos += T.COMPASSIONATE;
        if (x.type === 'slave') {
            if (this._has(y.npc, 'compassionate')) pos += T.SLAVE_COMPASSIONATE;
            if (y.type !== 'slave' && (y.npc.traits ?? []).includes('sadistic') && !(x.npc.traits ?? []).includes('masochist')) {
                pos += T.SADISTIC_TO_SLAVE;
            }
        }
        return Math.min(T.POS_MAX, Math.max(T.POS_MIN, pos));
    },

    /** X's shift toward Y from tonight's encounter: -MAX_SHIFT..MAX_SHIFT. */
    shift: function (x, y) {
        const T = this.TUNING;
        let size = Math.random() < T.BIG_SHIFT ? 2 : 1;
        if (this._has(x.npc, 'sensitive')) size++;
        let delta = Math.random() < this.positiveChance(x, y) ? size : -size;

        if (delta < 0 && this._has(x.npc, 'rational') && Math.random() < T.RATIONAL_NULLIFY) delta = 0;
        if (delta < 0 && this._has(x.npc, 'compassionate') && Math.random() < T.COMPASSIONATE_FLIP) delta = 1;
        // Same class amplifies whatever is left, after every other rule
        if (delta !== 0 && this._sameClass(x, y)) delta += Math.sign(delta);

        return Math.max(-T.MAX_SHIFT, Math.min(T.MAX_SHIFT, delta));
    },

    /** Apply X's shift toward Y. A first meeting that comes out 0 creates no relationship. Returns true if it moved. */
    _apply: function (x, y, delta) {
        if (!delta) return false;
        const rb = this._stats(x.npc);
        rb.stats[y.id] = Math.max(-100, Math.min(100, (rb.stats[y.id] ?? 0) + delta));
        (rb.last ??= {})[y.id] = Math.sign(delta);
        return true;
    },

    _tier: function (value) {
        const T = this.TUNING;
        if (value >= T.CLOSE_FRIENDS) return 2;
        if (value >= T.FRIENDS) return 1;
        if (value <= T.ENEMIES) return -2;
        if (value <= T.RIVALS) return -1;
        return 0;
    },

    /**
     * New milestones for the pair, announced once per tier:
     * friendship when both sides reach it, a grudge when either side does.
     */
    _milestones: function (a, b) {
        const messages = [];
        const rbA = this._stats(a.npc);
        const rbB = this._stats(b.npc);
        const memA = ((rbA.esTier ??= {})[b.id] ??= { pos: 0, neg: 0 });
        const memB = ((rbB.esTier ??= {})[a.id] ??= { pos: 0, neg: 0 });
        const tierA = this._tier(rbA.stats[b.id] ?? 0);
        const tierB = this._tier(rbB.stats[a.id] ?? 0);
        const nameA = setup.displayName(a.npc);
        const nameB = setup.displayName(b.npc);

        const mutual = Math.min(tierA, tierB);
        if (mutual > memA.pos) {
            memA.pos = memB.pos = mutual;
            messages.push(nameA + ' and ' + nameB + (mutual === 2 ? ' have become close friends' : ' have become friends') + ' at night school.');
        }

        const newA = tierA < 0 && tierA < memA.neg;
        const newB = tierB < 0 && tierB < memB.neg;
        if (newA) memA.neg = tierA;
        if (newB) memB.neg = tierB;
        if (newA && newB && tierA === tierB) {
            messages.push(nameA + ' and ' + nameB + (tierA === -2 ? ' have become bitter enemies' : ' have become rivals') + ' at night school.');
        } else {
            if (newA) messages.push(this._grudge(nameA, nameB, tierA));
            if (newB) messages.push(this._grudge(nameB, nameA, tierB));
        }
        return messages;
    },

    _grudge: function (who, whom, tier) {
        return tier === -2
            ? who + ' now considers ' + whom + ' an enemy.'
            : who + ' has come to resent ' + whom + '.';
    },
};
