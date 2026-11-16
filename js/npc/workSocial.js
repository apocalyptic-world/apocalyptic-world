/**
 * Work social sweep: once a night, guests and slaves whose days cross at work form, deepen, sour and
 * escalate relationships, by the night school rules (setup.eveningSchoolSocial: traits, momentum,
 * friend circles, plateau, best friends). Replaces the old flat +1 a night between colleagues.
 *
 * Who meets whom (link): the same assignment (or both MC wives, or both companions) like classmates;
 * tangent assignments (TANGENTS: jobs that hand each other work) at a lower rate; guards, nuns and the
 * mistress reach across the household; nursery parents meet the teacher and the caretakers.
 * Only the same group amplifies a shift (night school's "same class" rule).
 *
 * Calibrated with the household simulator in memory/social-sim (work_sim.js): ~33 encounters a night
 * in a 41-adult household; ~2 close friends per NPC after a year, ~7 after four.
 */
setup.workSocial = {
    TUNING: {
        // Chance that a pair meets tonight: BASE x link x age/family context x sqrt(mA x mB), clamped
        BASE: 0.033,
        SAME: 11.45,      // same group: like night school classmates
        HIGH: 3.8,        // high-likelihood tangent
        MODERATE: 1.45,   // moderate-likelihood tangent
        WIDE: 1.0,        // household-wide reach
        P_MIN: 0.02,      // floor once either side knows the other
        P_MIN_NEW: 0.005, // floor for strangers
        P_MAX: 0.6,
        MIN_AGE: 13,      // teens bond too (platonic: setLike and the wedding matcher are adults only)
    },

    /* Assignments that hand each other work. 'instructor' is any night school instructor, 'companion' anyone with the MC. */
    TANGENTS: {
        HIGH: [
            ['kitchen', 'garden'], ['kitchen', 'hunter'], ['kitchen', 'milkwarden'], ['kitchen', 'shop'], ['kitchen', 'maid'],
            ['shop', 'scavenging'], ['shop', 'garden'], ['shop', 'hunter'],
            ['milkwarden', 'milk_barn'], ['forest', 'hunter'], ['garage', 'scavenging'],
            ['mistress', 'attendant'], ['mistress', 'people_hunter'],
            ['school', 'caretaker'], ['school', 'librarian'], ['instructor', 'librarian'],
            ['strip_club', 'nightclub'], ['church', 'hospital'],
            ['companion', 'guard'], ['companion', 'garage'],
        ],
        MODERATE: [
            ['shop', 'forest'], ['shop', 'quarry'], ['shop', 'milkwarden'],
            ['forest', 'quarry'], ['garden', 'milk_barn'],
            ['streets', 'strip_club'], ['streets', 'nightclub'],
            ['maid', 'attendant'], ['maid', 'caretaker'],
            ['hospital', 'caretaker'], ['hospital', 'guard'],
            ['librarian', 'caretaker'],
            ['people_hunter', 'guard'], ['people_hunter', 'hunter'],
        ],
    },

    /* Jobs without an entry in setup.outsideWorkHours: kept home by illness or a day off */
    DEFAULT_BLOCKED: ['sick', 'dayOff'],

    /* Milestone message endings and NPC view sources, by kind of link */
    PLACE: {
        job: ' while working together',
        companion: ' while traveling together',
        wives: ' as fellow wives',
        household: ' around the settlement',
    },

    // Last sweep, for a Dev Tool page: { encounters, shifts: { id: count }, messages: [] }
    lastRun: null,

    _tangents: null,

    /** 'HIGH', 'MODERATE' or null for two different groups */
    tangent: function (a, b) {
        if (!this._tangents) {
            this._tangents = new Map();
            for (const tier of ['MODERATE', 'HIGH']) {
                for (const [x, y] of this.TANGENTS[tier]) this._tangents.set([x, y].sort().join('|'), tier);
            }
        }
        return this._tangents.get([a, b].sort().join('|')) ?? null;
    },

    /** Did this NPC work today? Illness, a day off, the pregnancy policy and the weather keep people home (setup.outsideWorkHours, without the hours). */
    worked: function (npc, job) {
        if (setup.baseManagement?.pregnantPrivilege?.exemptsFromJob(npc)) return false;
        const blocked = setup.outsideWorkHours?.[job]?.blockedBy ?? this.DEFAULT_BLOCKED;
        const isSick = typeof npc.sick !== 'undefined';
        if (blocked.includes('sick') && isSick) return false;
        if (blocked.includes('dayOff') && (isSick || typeof npc.rest !== 'undefined')) return false;
        const weather = variables().weather;
        if (weather) {
            if (blocked.includes('heatWave') && weather.heatWave) return false;
            if (blocked.includes('sandStorm') && weather.sandStorm) return false;
            if (blocked.includes('coldSnap') && weather.coldSnap && !setup.npcInventoryHas(npc, 'coat_wolf')) {
                if (job !== 'scavenging' || !setup.coldSnapScavengerGoesOut(npc, variables().game.day)) return false;
            }
        }
        return true;
    },

    /** The group an NPC worked in today, or null (no job, or stayed home) */
    group: function (npc) {
        if (setup.companions.has(npc)) {
            return typeof npc.sick === 'undefined' ? 'companion' : null;
        }
        const job = npc.assignedTo;
        if (!job || !this.worked(npc, job)) return null;
        return job.startsWith('instructor-') ? 'instructor' : job;
    },

    isMcWife: function (npc) {
        return npc.family?.husband === 'mc';
    },

    /** { mult, same, kind, via } for a pair: the strongest of their links, or null if their days don't cross */
    link: function (a, b) {
        const T = this.TUNING;
        const ga = a.group;
        const gb = b.group;
        let best = null;
        const take = (mult, same, kind, via) => {
            if (!best || mult > best.mult) best = { mult, same, kind, via };
        };

        // Instructors already meet every night at night school (eveningSchoolSocial INSTRUCTOR_PAIR)
        if (ga && ga === gb && ga !== 'instructor') {
            if (ga === 'companion') take(T.SAME, true, 'companion', 'traveling together');
            else take(T.SAME, true, 'job', 'working together (' + ga + ')');
        }
        if (a.wife && b.wife) take(T.SAME, true, 'wives', 'being wives together');
        if (ga && gb && ga !== gb) {
            const tier = this.tangent(ga, gb);
            if (tier) take(T[tier], false, 'household', 'crossing paths at work (' + ga + ', ' + gb + ')');
        }
        const caresForKids = g => g === 'school' || g === 'caretaker';
        if ((a.parent && caresForKids(gb)) || (b.parent && caresForKids(ga))) take(T.HIGH, false, 'household', 'the nursery');
        // Guards reach everyone, nuns every guest, the mistress every slave
        const reaches = (x, y) => x.group === 'guard' || (x.group === 'church' && y.type === 'guest') || (x.group === 'mistress' && y.type === 'slave');
        if (reaches(a, b) || reaches(b, a)) take(T.WIDE, false, 'household', 'crossing paths around the settlement');
        return best;
    },

    /**
     * Run tonight's sweep. Call after the night's processNpc, before sleepRelationship (setLike).
     * options.quiet: collect milestone messages in the result without posting them (Dev Tool runs).
     */
    sweep: function (options) {
        const quiet = !!(options && options.quiet);
        const T = this.TUNING;
        const es = setup.eveningSchoolSocial;
        const v = variables();
        const parents = new Set();
        for (const child of v.nursery ?? []) {
            for (const id of [child.family?.mother, child.family?.father]) if (id && id !== 'mc') parents.add(String(id));
        }

        const people = [];
        for (const [list, type] of [[v.guests ?? [], 'guest'], [v.slaves ?? [], 'slave']]) {
            for (const npc of list) {
                if (!npc?.id || setup.getAge(npc) < T.MIN_AGE) continue;
                const p = { npc, id: npc.id, type, role: 'worker', group: this.group(npc), wife: this.isMcWife(npc), parent: parents.has(String(npc.id)) };
                p.cls = p.group ?? (p.wife ? 'wives' : null);
                // Everyone at home takes part: guards and nuns reach people without a job too (see link)
                people.push(p);
            }
        }
        const run = { encounters: 0, shifts: {}, messages: [] };
        this.lastRun = run;
        if (people.length < 2) return run;

        // The night school rules, with "same class" read as this pair sharing a group
        const self = this;
        const rules = Object.create(es);
        rules._people = new Map(people.map(p => [p.id, p]));
        rules._sameClass = (x, y) => !!self.link(x, y)?.same;
        for (const p of people) rules._prepare(p, people);

        const changed = [];
        for (let i = 0; i < people.length; i++) {
            for (let j = i + 1; j < people.length; j++) {
                const a = people[i];
                const b = people[j];
                const link = this.link(a, b);
                if (!link) continue;

                let context = link.mult;
                context *= 1 + es.TUNING.AGE_BONUS * Math.max(0, 1 - Math.abs(a.age - b.age) / es.TUNING.AGE_SPAN);
                if (a.family.has(b.id) || a.spouse === b.id || b.spouse === a.id) context *= es.TUNING.FAMILY;
                const chance = T.BASE * context * Math.sqrt(rules.personal(a, b) * rules.personal(b, a));
                const strangers = typeof es._stats(a.npc).stats[b.id] === 'undefined' && typeof es._stats(b.npc).stats[a.id] === 'undefined';
                if (Math.random() >= Math.min(T.P_MAX, Math.max(strangers ? T.P_MIN_NEW : T.P_MIN, chance))) continue;
                run.encounters++;

                // Both sides judge the same encounter from the values they had going in
                const deltaA = rules.shift(a, b);
                const deltaB = rules.shift(b, a);
                const before = setup.relationshipBetween.pairBefore(a.npc, b.npc);
                if (rules._apply(a, b, deltaA)) run.shifts[a.id] = (run.shifts[a.id] ?? 0) + 1;
                if (rules._apply(b, a, deltaB)) run.shifts[b.id] = (run.shifts[b.id] ?? 0) + 1;
                if (deltaA || deltaB) changed.push([a, b, before, link]);
            }
        }

        for (const [a, b, before, link] of changed) {
            const category = link.kind === 'job' ? a.group : (link.kind === 'companion' ? 'companion' : 'household');
            for (const msg of setup.relationshipBetween.milestones(a.npc, b.npc, this.PLACE[link.kind], before, link.via)) {
                run.messages.push(msg);
                if (!quiet) setup.sleepMessages.addJob(msg, category);
            }
        }
        return run;
    },
};
