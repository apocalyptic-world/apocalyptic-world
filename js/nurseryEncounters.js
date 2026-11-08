/*
 * Nursery encounters: scenes with a caretaker, rolled when the player walks into a location.
 * At most one per location per time slot per day, tracked in $locationEvents so the nightly reset clears them.
 *
 * To add one, add an entry to LIST and create its passage:
 *   id:      unique name
 *   passage: passage to send the player to
 *   slots:   which SLOTS it can happen in
 *   location: optional, where it happens, 'guesthouse' or 'school'. Leave it out for the nursery.
 *   cast:    function (ctx), returns the NPCs in the scene as { carer: npc, kid: npc, ... }, or null if it
 *            can't happen right now. Put any other requirement here too (items, buildings, ages).
 *   weight:  optional function (cast, ctx), how likely it is to be the one picked. DEFAULT_WEIGHT is an ordinary one.
 *            This is the place for personality, relationshipBetween, nursery behavior and so on.
 *   odds:    optional function (cast, ctx), percent chance of happening. An encounter with this rolls for itself
 *            on each visit, ahead of and apart from the shared VISIT_CHANCE roll.
 * ctx is { slot, carers (caretakers at work now), care ($player.nurseryCare) }.
 * The passage gets its NPCs back from setup.nurseryEncounters.cast().
 */
setup.nurseryEncounters = {
    /* Percent chance per visit that something happens. If it does, one eligible encounter is picked by weight. */
    VISIT_CHANCE: 30,
    DEFAULT_WEIGHT: 10,
    TRAIT_WEIGHT: 10,
    /* Percent chance a scene with a caretaker features their ward, then one of their favored */
    WARD_PICK_CHANCE: 40,
    FAVORED_PICK_CHANCE: 25,
    OWN_BABY_CHANCE: 60,
    /* Percent chance that a teen found here during lessons has a good reason */
    EXCUSED_CHANCE: 20,
    /* How much more likely a topic is once a trait leans it that way */
    ISSUE_LEAN: 3,

    SLOTS: [
        { id: 'gettingReady', from: '08:00', to: '09:00' },
        { id: 'schoolHours', from: '09:00', to: '15:00' },
        { id: 'afterSchool', from: '15:00', to: '19:00' },
        { id: 'bedtime', from: '19:00', to: '21:00' }
    ],

    LIST: [
        {
            id: 'minorInjury',
            passage: 'Nursery encounter - minor injury',
            slots: ['gettingReady', 'schoolHours', 'afterSchool'],
            cast: function (ctx) {
                /* Older kids are in class during school hours, if there is a school to go to */
                const inClass = ctx.slot === 'schoolHours' && (variables().player.quests.school_built ?? false);
                const kids = setup.nurseryEncounters.healthyKids(2, inClass ? 4 : 10);
                return kids.length ? { carer: ctx.carers.random(), kid: kids.random() } : null;
            }
        },
        {
            id: 'bedtimeStory',
            passage: 'Nursery encounter - bedtime story',
            slots: ['bedtime'],
            cast: function (ctx) {
                const enoughKids = setup.nurseryEncounters.healthyKids(4, 12).length >= 2;
                return enoughKids && setup.cabinInventory.has('book') ? { carer: ctx.carers.random() } : null;
            }
        },
        {
            id: 'lostToy',
            passage: 'Nursery encounter - lost toy',
            slots: ['gettingReady'],
            cast: function (ctx) {
                const kids = setup.nurseryEncounters.healthyKids(5, 9);
                return (variables().player.quests.school_built ?? false) && kids.length ? { carer: ctx.carers.random(), kid: kids.random() } : null;
            }
        },
        {
            id: 'visitingParent',
            passage: 'Nursery encounter - visiting parent',
            location: 'guesthouse',
            slots: ['gettingReady', 'schoolHours', 'afterSchool', 'bedtime'],
            cast: function (ctx) {
                const self = setup.nurseryEncounters;
                const carer = ctx.carers.random();
                /* The older ones are at their lessons during the day */
                const kids = self.healthyKids(0, ctx.slot === 'schoolHours' ? 4 : 17).filter(kid => self.parentsHere(kid, carer).length);
                if (!kids.length) {
                    return null;
                }
                const kid = self.pickCharge(carer, kids);
                const cast = { carer: carer, kid: kid };
                self.parentsHere(kid, carer).forEach(parent => {
                    cast[parent.id === kid.family.mother ? 'mother' : 'father'] = parent;
                });
                return cast;
            }
        },
        {
            id: 'forgottenItem',
            passage: 'Nursery encounter - forgotten item',
            location: 'school',
            slots: ['schoolHours'],
            cast: function (ctx) {
                const self = setup.nurseryEncounters;
                const v = variables();
                const teachers = (v.player.quests.school_built ?? false) ? setup.getNpcsForLocation(v.guests, 'school').filter(npc => setup.isAtWork(npc, v.weather)) : [];
                const kids = self.healthyKids(5, 17);
                if (!teachers.length || !kids.length) {
                    return null;
                }
                const carer = ctx.carers.random();
                return { carer: carer, kid: self.pickCharge(carer, kids), teacher: teachers[0] };
            }
        },
        {
            id: 'parentalDispute',
            passage: 'Nursery encounter - parental dispute',
            slots: ['gettingReady', 'schoolHours', 'afterSchool', 'bedtime'],
            cast: function (ctx) {
                const self = setup.nurseryEncounters;
                const carer = self.pickByTraits(ctx.carers, ['critical'], ['compassionate']);
                const parents = setup.nurseryBirthday.freeParents().filter(npc => npc !== carer && self.childrenOf(npc).length);
                if (!parents.length) {
                    return null;
                }
                const parent = setup.nurseryOvernight.pickWeighted(parents, npc => self.traitWeight(npc, ['critical'], ['compassionate', 'friendly']) + self.grudge(npc, carer), 1)[0];
                return { carer: carer, parent: parent, kid: self.childrenOf(parent).random() };
            }
        },
        {
            id: 'rebelliousTeen',
            passage: 'Nursery encounter - rebellious teen',
            slots: ['gettingReady', 'schoolHours', 'afterSchool', 'bedtime'],
            cast: function (ctx) {
                const self = setup.nurseryEncounters;
                const teens = self.healthyKids(13, 17);
                return teens.length ? { carer: self.pickByTraits(ctx.carers, ['critical'], []), kid: self.pickByTraits(teens, ['careless', 'confident'], ['organized']) } : null;
            }
        },
        {
            id: 'helpfulTeen',
            passage: 'Nursery encounter - helpful teen',
            slots: ['gettingReady', 'afterSchool', 'bedtime'],
            cast: function (ctx) {
                const self = setup.nurseryEncounters;
                const teens = self.healthyKids(13, 17);
                return teens.length ? { carer: ctx.carers.random(), kid: self.pickByTraits(teens, ['organized', 'compassionate'], ['careless']) } : null;
            }
        },
        {
            id: 'wetNurse',
            passage: 'Nursery encounter - wet nurse',
            slots: ['gettingReady', 'schoolHours', 'afterSchool', 'bedtime'],
            cast: function (ctx) {
                const self = setup.nurseryEncounters;
                const nurses = ctx.carers.filter(npc => self.isLactating(npc));
                const babies = self.healthyKids(0, 1);
                if (!nurses.length || !babies.length) {
                    return null;
                }
                const carer = nurses.random();
                const own = babies.filter(kid => kid.family?.mother === carer.id);
                return { carer: carer, kid: own.length && setup.percentageChance(self.OWN_BABY_CHANCE) ? own.random() : babies.random() };
            }
        },
        {
            id: 'tooQuiet',
            passage: 'Nursery encounter - too quiet',
            slots: ['gettingReady', 'schoolHours', 'afterSchool', 'bedtime'],
            cast: function (ctx) {
                const incident = ctx.care.quietIncident;
                if (!incident) {
                    return null;
                }
                if (incident.kind !== 'teen') {
                    return { carer: ctx.carers.random() };
                }
                const kid = incident.kid ? setup.getNpcById(incident.kid) : null;
                return kid ? { carer: ctx.carers.random(), kid: kid } : null;
            },
            /* The caretakers bring it up the first time the player looks in after the night of Too quiet */
            odds: function () {
                return 100;
            }
        },
        {
            id: 'burnedOut',
            passage: 'Nursery encounter - burned out',
            slots: ['gettingReady', 'schoolHours', 'afterSchool', 'bedtime'],
            cast: function (ctx) {
                const self = setup.nurseryEncounters;
                return { carer: setup.nurseryOvernight.pickWeighted(ctx.carers, npc => self.burnoutRisk(npc, ctx), 1)[0] };
            },
            /* The same odds as burning out overnight */
            odds: function (cast, ctx) {
                return setup.nurseryEncounters.burnoutRisk(cast.carer, ctx);
            }
        }
    ],

    currentSlot: function () {
        return this.SLOTS.find(slot => timeBetween(slot.from, slot.to))?.id ?? null;
    },

    /** Picks an encounter for this visit and returns its passage, or null if nothing happens */
    roll: function (location = 'nursery') {
        const v = variables();
        const slot = this.currentSlot();
        const key = location === 'nursery' ? 'nursery_' + slot : 'nursery_' + location + '_' + slot;
        if (!slot || !setup.nurseryCare.isActive() || v.locationEvents[key]) {
            return null;
        }
        const ctx = { slot: slot, carers: setup.nurseryCare.atWork(v.weather), care: v.player.nurseryCare };
        if (ctx.carers.length < 1) {
            return null;
        }
        const options = this.LIST
            .filter(item => item.slots.includes(slot) && (item.location ?? 'nursery') === location)
            .map(item => ({ encounter: item, cast: item.cast(ctx) }))
            .filter(option => option.cast);
        const rollsAlone = options.filter(option => option.encounter.odds).shuffle();
        const shared = options.filter(option => !option.encounter.odds);
        const picked = rollsAlone.find(option => setup.percentageChance(option.encounter.odds(option.cast, ctx)))
            ?? (shared.length && setup.percentageChance(this.VISIT_CHANCE)
                ? setup.nurseryOvernight.pickWeighted(shared, option => option.encounter.weight ? option.encounter.weight(option.cast, ctx) : this.DEFAULT_WEIGHT, 1)[0]
                : null);
        if (!picked) {
            return null;
        }
        const ids = {};
        Object.keys(picked.cast).forEach(role => { ids[role] = picked.cast[role].id; });
        v.locationEvents[key] = true;
        v.tmpEvent = { cast: ids };
        return picked.encounter.passage;
    },

    /*
     * Stat changes made since the encounter started, for the effect lines on its last screen (<<nurseryEffects>>).
     * Starts in cast(), cleared overnight. Lives on setup, so it isn't saved.
     */
    log: null,
    logShown: 0,

    /** The NPCs of the current encounter, or null if one of them is gone. Also starts the effect log. */
    cast: function () {
        this.startLog();
        const ids = variables().tmpEvent?.cast ?? {};
        const cast = {};
        for (const role of Object.keys(ids)) {
            cast[role] = setup.getNpcById(ids[role]);
            if (!cast[role]) {
                return null;
            }
        }
        return ids.carer ? cast : null;
    },

    healthyKids: function (from, to) {
        return setup.nurseryCare.kidsAged(from, to).filter(kid => kid.id && typeof kid.sick === 'undefined');
    },

    /** Weight for picking someone by personality. BASE is ordinary, so a trait in up doubles it and one in down halves it. */
    traitWeight: function (npc, up, down) {
        const has = trait => setup.personality.has(npc, trait);
        return Math.max(1, this.TRAIT_WEIGHT + up.filter(has).length * this.TRAIT_WEIGHT - down.filter(has).length * this.TRAIT_WEIGHT / 2);
    },

    pickByTraits: function (npcs, up, down) {
        return setup.nurseryOvernight.pickWeighted(npcs, npc => this.traitWeight(npc, up, down), 1)[0];
    },

    /** Extra weight for someone who doesn't get along with this caretaker */
    grudge: function (npc, carer) {
        const like = npc.relationshipBetween?.stats?.[carer.id] ?? 0;
        return like < 0 ? Math.min(this.TRAIT_WEIGHT * 2, -like / 2) : 0;
    },

    /** A child for this caretaker's scene, more likely to be the one they watch over */
    pickCharge: function (carer, kids) {
        const ward = kids.find(kid => kid.id === carer.nurseryCare?.ward);
        if (ward && setup.percentageChance(this.WARD_PICK_CHANCE)) {
            return ward;
        }
        const favored = kids.filter(kid => (carer.nurseryCare?.favored ?? []).includes(kid.id));
        return favored.length && setup.percentageChance(this.FAVORED_PICK_CHANCE) ? favored.random() : kids.random();
    },

    /** Whether this guest is at the guest house right now */
    atGuestHouse: function (npc) {
        const v = variables();
        return (v.guests ?? []).includes(npc)
            && !npc.sleeping
            && npc.location !== 'school'
            && !setup.isAtWork(npc, v.weather)
            && !((v.game.location.hospital ?? false) && typeof npc.sick !== 'undefined');
    },

    /** The child's parents who could be visited at the guest house, other than the caretaker bringing them */
    parentsHere: function (kid, carer) {
        return this.parents(kid).filter(npc => npc !== carer && this.atGuestHouse(npc) && !(npc.traits ?? []).includes('feral'));
    },

    childrenOf: function (npc) {
        return this.healthyKids(0, 17).filter(kid => kid.family?.mother === npc.id || kid.family?.father === npc.id);
    },

    /** Same as the milk barn: late in a pregnancy, or a milker */
    isLactating: function (npc) {
        return (npc.pregnancy ?? 0) >= 7 || (npc.traits ?? []).includes('milker');
    },

    burnoutRisk: function (npc, ctx) {
        return setup.nurseryOvernight.burnoutChance(npc, ctx.care, setup.nurseryCare.kids().length, ctx.carers.length);
    },

    /** Relationship between two NPCs, both ways, rolled separately */
    changeBetween: function (first, second, low, high) {
        const shift = (from, to) => {
            from.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
            const before = from.relationshipBetween.stats[to.id] ?? 0;
            from.relationshipBetween.stats[to.id] = Math.clamp(before + random(low, high), -100, 100);
            const amount = from.relationshipBetween.stats[to.id] - before;
            if (this.log && amount) {
                this.log.push({ npc: from, other: to, stat: 'between', amount });
            }
        };
        shift(first, second);
        shift(second, first);
    },

    /** "Anna" or "Anna and Ben" */
    names: function (npcs) {
        return npcs.map(npc => setup.displayName(npc)).join(' and ');
    },

    /** Fills in the child's name and pronouns in a line from setup.nurseryEncounterText */
    fill: function (line, kid) {
        const he = setup.pronounceWhat(kid);
        const his = setup.pronounceWhos(kid);
        const tokens = { kid: kid.name, he: he, his: his, him: setup.pronounceWho(kid), He: ucfirst(he), His: ucfirst(his) };
        return line.replace(/\{(\w+)\}/g, (match, token) => tokens[token] ?? match);
    },

    /** Which group of dispute topics suits a child this age */
    ageBand: function (kid) {
        const age = setup.getAge(kid);
        return age < 2 ? 'infant' : age < 5 ? 'little' : age < 13 ? 'school' : 'teen';
    },

    disputeTopic: function (kid) {
        return setup.nurseryEncounterText.disputes[this.ageBand(kid)].random();
    },

    /** What a teen is in trouble over. A critical caretaker is more often being unfair, a careless teen more often at fault. */
    teenIssue: function (carer, kid, slot) {
        const issues = setup.nurseryEncounterText.teenIssues;
        if (slot === 'schoolHours' && (variables().player.quests.school_built ?? false)) {
            return (setup.percentageChance(this.EXCUSED_CHANCE) ? issues.excused : issues.skipping).random();
        }
        const lean = setup.nurseryOvernight.pickWeighted(['teen', 'carer', 'even'], side => {
            if (side === 'teen' && setup.personality.has(carer, 'critical')) return this.ISSUE_LEAN;
            if (side === 'carer' && setup.personality.has(kid, 'careless')) return this.ISSUE_LEAN;
            return 1;
        }, 1)[0];
        return issues[lean].random();
    },

    isOwnChild: function (kid) {
        return kid.family?.father === 'mc';
    },

    /** The child's parents in the household, leaving out the player */
    parents: function (kid) {
        return [kid.family?.mother, kid.family?.father]
            .filter(id => id && id !== 'mc')
            .map(id => setup.getNpcById(id))
            .filter(Boolean);
    },

    /** Changes a stat by a random amount from low to high, staying within the stat's limits. Returns how much it actually moved. */
    change: function (npc, stat, low, high) {
        const min = stat === 'endurance' ? 0 : -100;
        const before = npc[stat] ?? 0;
        const rolled = random(low, high);
        npc[stat] = Math.clamp(before + rolled, min, 100);
        if (npc.id) {
            this.record(npc, stat, npc[stat] - before, rolled);
        }
        return npc[stat] - before;
    },

    startLog: function () {
        this.log = [];
        this.logShown = 0;
    },

    /**
     * Adds to the effect log. npc null is the nursery itself (behavior, toys, snacks).
     * rolled is what the change would have been without the limits, so a stat already at max or min still gets a mention.
     */
    record: function (npc, stat, amount, rolled = amount) {
        if (this.log && (amount || rolled)) {
            this.log.push({ npc, stat, amount, limit: !amount ? (rolled > 0 ? 'max' : 'min') : null });
        }
    },

    /**
     * Lines for <<nurseryEffects>>: everything logged since the last time it was shown.
     * The nursery first, then each NPC in the order they were affected, then NPC-to-NPC relationships.
     * More than CHILD_LINES children are summed up on one line.
     */
    CHILD_LINES: 3,
    STAT_LABELS: { happy: 'Happiness', relationship: 'Relationship', sub: 'Submission', endurance: 'Endurance', behavior: 'Behavior', toys: 'Toys', snacks: 'Snacks' },
    effectLines: function () {
        const log = (this.log ?? []).slice(this.logShown);
        this.logShown = (this.log ?? []).length;
        const label = stat => this.STAT_LABELS[stat] ?? ucfirst(stat);
        const signed = n => (n > 0 ? '+' : '') + n;
        /* { stat: total } plus { stat: 'max' | 'min' } for the ones that couldn't move, as one line */
        const fx = (totals, limits, who) => {
            const text = Object.keys(totals)
                .map(stat => totals[stat] ? label(stat) + ' ' + signed(totals[stat])
                    : limits[stat] ? label(stat) + ' already at ' + limits[stat] : '')
                .filter(Boolean)
                .join(' &bull; ');
            return text && who ? who + ': ' + text : text;
        };
        const room = {};
        const roomLimits = {};
        const people = new Map();
        const between = new Map();
        for (const entry of log) {
            if (!entry.npc) {
                room[entry.stat] = (room[entry.stat] ?? 0) + entry.amount;
                roomLimits[entry.stat] = entry.limit;
            } else if (entry.other) {
                const [a, b] = [entry.npc, entry.other].sort((x, y) => String(x.id).localeCompare(String(y.id)));
                const key = a.id + '|' + b.id;
                if (!between.has(key)) {
                    between.set(key, { a, b, ab: 0, ba: 0 });
                }
                const pair = between.get(key);
                pair[entry.npc === a ? 'ab' : 'ba'] += entry.amount;
            } else {
                if (!people.has(entry.npc.id)) {
                    people.set(entry.npc.id, { npc: entry.npc, stats: {}, limits: {} });
                }
                const person = people.get(entry.npc.id);
                person.stats[entry.stat] = (person.stats[entry.stat] ?? 0) + entry.amount;
                person.limits[entry.stat] = entry.limit;
            }
        }
        const lines = [fx(room, roomLimits)];
        const everyone = [...people.values()];
        const kids = everyone.filter(p => setup.getAge(p.npc) < 18);
        const grouped = kids.length > this.CHILD_LINES;
        for (const person of everyone) {
            if (!(grouped && kids.includes(person))) {
                lines.push(fx(person.stats, person.limits, setup.displayName(person.npc)));
            }
        }
        if (grouped) {
            const stats = [...new Set(kids.flatMap(p => Object.keys(p.stats)))];
            const parts = stats.map(stat => {
                const values = kids.map(p => p.stats[stat]).filter(Boolean);
                if (!values.length) {
                    return '';
                }
                const low = Math.min(...values), high = Math.max(...values);
                return label(stat) + ' ' + (low === high ? signed(low) : signed(low) + ' to ' + signed(high))
                    + (values.length < kids.length ? ' (' + values.length + ' of them)' : '');
            }).filter(Boolean);
            if (parts.length) {
                lines.push(kids.length + ' children: ' + parts.join(' &bull; '));
            }
        }
        for (const { a, b, ab, ba } of between.values()) {
            if (ab || ba) {
                lines.push(setup.displayName(a) + ' and ' + setup.displayName(b) + ': Relationship with each other '
                    + (ab === ba ? signed(ab) : signed(ab) + ' / ' + signed(ba)));
            }
        }
        return lines.filter(Boolean);
    },

    /** Relationship change that only applies between the player and his own child */
    changeBond: function (kid, low, high) {
        return this.isOwnChild(kid) ? this.change(kid, 'relationship', low, high) : 0;
    },

    /** "Offer to help with nursery care": once per time slot for each caretaker */
    canOfferHelp: function (npc) {
        const slot = this.currentSlot();
        return setup.nurseryCare.isActive()
            && npc.assignedTo === 'caretaker'
            && !!slot
            && setup.isAtWork(npc, variables().weather)
            && !variables().locationEvents['nursery_help_' + slot + '_' + npc.id];
    },

    markHelped: function (npc) {
        variables().locationEvents['nursery_help_' + this.currentSlot() + '_' + npc.id] = true;
    },

    /** Names of whichever items in { item: count } the player is short of */
    missing: function (needs) {
        return Object.keys(needs)
            .filter(item => !setup.cabinInventory.has(item, needs[item]))
            .map(item => (needs[item] > 1 ? needs[item] + ' ' : '') + Item.get(item).name.toLowerCase());
    },

    consume: function (needs) {
        /* One at a time, since the items can be split between backpack and storage */
        for (const item of Object.keys(needs)) {
            for (let i = 0; i < needs[item]; i++) {
                setup.cabinInventory.drop(item);
            }
        }
    },

    /** +1 for every 50 points of the player's intelligence */
    intBonus: function () {
        return Math.floor(Math.max(0, variables().player.int ?? 0) / 50);
    },

    /** Same progress as working in the kitchen. Returns true if this taught them the cook skill. */
    addCookExperience: function (npc) {
        npc.stats = npc.stats ?? {};
        npc.stats.kitchen = (npc.stats.kitchen ?? 0) + 1;
        if (npc.stats.kitchen > 100 && !(npc.skills ?? []).includes('cook')) {
            npc.skills = npc.skills ?? [];
            npc.skills.push('cook');
            return true;
        }
        return false;
    },

    /** Bandages the caretaker could fetch without the player's help */
    storageHas: function (item) {
        const v = variables();
        return (v.game.location.shop ?? false) && v.storage.count(item) >= 1;
    }
};
