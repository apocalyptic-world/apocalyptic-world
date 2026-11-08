/*
 * Nursery overnight: what each caretaker got done during the day just ended, called from setup.nurseryCare.nightly.
 * A caretaker either burns out, or lands 1-2 different impacts picked by weight. Each impact reaches a handful of
 * children, more in a bigger nursery (see maxKids), and makes one sleep message, with the children's names in a tooltip so a big nursery can't flood the morning.
 *
 * To add an impact, add an entry to IMPACTS:
 *   id:     unique name, also the key into TEXT
 *   wardChance: optional, percent chance a caretaker's ward is included, in place of WARD_CHANCE
 *   weight: function (npc, care), how likely it is compared to the others (BASE_WEIGHT is an ordinary one)
 *   plan:   function (npc), returns { kids } plus anything apply needs, or null if it can't happen tonight
 *   apply:  function (npc, plan, kids, gains), applies the effects, returns any extra summary text as an array
 */
setup.nurseryOvernight = {
    BASE_WEIGHT: 10,
    /* Up to this many toys or snacks keep making sports or healthy days more likely */
    SUPPLY_WEIGHT_CAP: 10,
    EXPERIENCED_DAYS: 30,
    KIDS_PER_REACH: 20,
    MIN_REACH: 2,
    MAX_REACH: 5,
    /* Younger than this, a child can only be nurtured or kept healthy */
    ACTIVITY_MIN_AGE: 2,
    SPORTY_STAT_CAP: 50,
    HEALTHY_BEAUTY_CAP: 80,
    HEALTHY_ENDURANCE_CAP: 50,
    FIT_CARETAKER_STAT: 50,
    /* The day school turns 100 into the skill, so this leaves them plenty still to learn there */
    HEAD_START_CAP: 50,
    HEAD_START_MAX_AGE: 5,
    /* Percent chance a caretaker's ward is one of the children in each of their impacts */
    WARD_CHANCE: 60,
    /* Happiness a ward gets each night from each caretaker who didn't burn out */
    WARD_HAPPY: 1,
    /* Percent chance a caretaker lands a second impact on top of the first */
    SECOND_IMPACT_CHANCE: 34,
    /* Chance a caretaker without the cook skill still puts together a snack on a healthy day, shared out among
       everyone on shift so the total doesn't grow with staff: 130 means 65% each for two, 33% each for four.
       That keeps up with about 25 children; past that the shelf runs down without a cook. */
    NON_COOK_SNACK_SHARE: 130,
    /* Caretakers stop making snacks once this many weeks' worth are on the shelf */
    SNACK_STOCK_WEEKS: 4,
    /* Each toy made overnight takes 1 glue and 1 of these, from the backpack or storage.
       A batch of snacks takes 1 food, from storage only. */
    TOY_MATERIALS: ['cloth', 'plastic', 'wood'],

    /** Makes up to count toys from storage and returns how many were made */
    makeToys: function (count) {
        const inventory = setup.cabinInventory;
        let made = 0;
        while (made < count && inventory.has('glue')) {
            const materials = this.TOY_MATERIALS.filter(item => inventory.has(item));
            if (!materials.length) {
                break;
            }
            inventory.drop('glue');
            inventory.drop(materials.random());
            made++;
        }
        return made;
    },

    /* Skills that can be taught, with the stat the day school keeps their progress in */
    SKILL_STATS: { gardener: 'garden', cook: 'kitchen', doctor: 'hospital', teacher: 'school', woodcraft: 'forest', shopkeeper: 'shop' },
    SKILL_LABELS: { gardener: 'gardening', cook: 'cooking', doctor: 'first aid', teacher: 'teaching', woodcraft: 'woodcraft', shopkeeper: 'counting and trade' },
    STAT_LABELS: { happy: 'Happiness', strength: 'Strength', endurance: 'Endurance', beauty: 'Beauty' },

    hasSkill: function (npc, skill) {
        return (npc.skills ?? []).includes(skill);
    },

    isExperienced: function (npc) {
        return (npc.stats?.caretaker ?? 0) >= this.EXPERIENCED_DAYS;
    },

    /** Scales with how much is on the shelf; an empty shelf counts against it */
    supplyWeight: function (count) {
        return count > 0 ? Math.min(count, this.SUPPLY_WEIGHT_CAP) : -5;
    },

    activityKids: function () {
        return setup.nurseryEncounters.healthyKids(this.ACTIVITY_MIN_AGE, 17);
    },

    IMPACTS: [
        {
            id: 'nurturing',
            wardChance: 70,
            weight: function (npc) {
                let weight = setup.nurseryOvernight.BASE_WEIGHT;
                if (setup.personality.has(npc, 'compassionate')) weight += 10;
                if (setup.personality.has(npc, 'critical')) weight -= 5;
                if (setup.getAge(npc) >= 50) weight += 5;
                if ((npc.stats?.church ?? 0) >= 30) weight += 5;
                return weight;
            },
            plan: function () {
                const kids = setup.nurseryCare.kids().filter(kid => (kid.happy ?? 0) < 100);
                return kids.length ? { kids: kids, lean: kid => 110 - (kid.happy ?? 0) } : null;
            },
            apply: function (npc, plan, kids, gains) {
                const self = setup.nurseryOvernight;
                const bonus = self.isExperienced(npc) ? 1 : 0;
                kids.forEach(kid => self.raise(gains, kid, 'happy', random(1, 2) + bonus));
                return [];
            }
        },
        {
            id: 'crafty',
            weight: function (npc) {
                const self = setup.nurseryOvernight;
                return self.BASE_WEIGHT + (self.hasSkill(npc, 'scavenger') ? 5 : 0) + (self.hasSkill(npc, 'mechanic') ? 5 : 0);
            },
            plan: function () {
                const kids = setup.nurseryOvernight.activityKids();
                return kids.length ? { kids: kids } : null;
            },
            apply: function (npc, plan, kids, gains) {
                const self = setup.nurseryOvernight;
                const bonus = self.isExperienced(npc) ? 1 : 0;
                kids.forEach(kid => self.raise(gains, kid, 'happy', random(1, 2) + bonus));
                /* Once there is a toy for every child, they stop making more */
                const care = variables().player.nurseryCare;
                const room = Math.max(0, setup.nurseryCare.kids().length - care.toys);
                const made = self.makeToys(Math.min(room, random(1, 2) + (setup.personality.has(npc, 'inventive') ? 1 : 0)));
                care.toys += made;
                return made ? ['Toys +' + made] : [];
            }
        },
        {
            id: 'sporty',
            weight: function (npc, care) {
                const self = setup.nurseryOvernight;
                const age = setup.getAge(npc);
                let weight = self.BASE_WEIGHT + self.supplyWeight(care.toys);
                if (self.hasSkill(npc, 'fighter')) weight += 5;
                if (self.hasSkill(npc, 'woodcraft')) weight += 5;
                if (setup.personality.has(npc, 'energetic')) weight += 5;
                if (age >= 50) weight -= 10;
                else if (age >= 35) weight -= 5;
                return weight;
            },
            plan: function () {
                const cap = setup.nurseryOvernight.SPORTY_STAT_CAP;
                const kids = setup.nurseryOvernight.activityKids().filter(kid => (kid.strength ?? 0) < cap || (kid.endurance ?? 0) < cap);
                return kids.length ? { kids: kids } : null;
            },
            apply: function (npc, plan, kids, gains) {
                const self = setup.nurseryOvernight;
                const bonus = self.isExperienced(npc) ? 1 : 0;
                const fit = stat => (npc[stat] ?? 0) >= self.FIT_CARETAKER_STAT ? 1 : 0;
                kids.forEach(kid => {
                    self.raise(gains, kid, 'strength', random(1, 2) + bonus + fit('strength'), self.SPORTY_STAT_CAP);
                    self.raise(gains, kid, 'endurance', random(1, 2) + bonus + fit('endurance'), self.SPORTY_STAT_CAP);
                });
                return [];
            }
        },
        {
            id: 'healthy',
            weight: function (npc, care) {
                const self = setup.nurseryOvernight;
                return self.BASE_WEIGHT + self.supplyWeight(care.snacks) + (self.hasSkill(npc, 'doctor') ? 5 : 0) + (self.hasSkill(npc, 'cook') ? 5 : 0);
            },
            plan: function () {
                const self = setup.nurseryOvernight;
                const all = setup.nurseryEncounters.healthyKids(0, 17);
                const kids = all.filter(kid => (kid.beauty ?? 0) < self.HEALTHY_BEAUTY_CAP || (kid.endurance ?? 0) < self.HEALTHY_ENDURANCE_CAP);
                /* With under a week of snacks left it still happens when nobody needs it, so the shelf gets restocked */
                if (!kids.length && variables().player.nurseryCare.snacks < setup.nurseryCare.weeklySnacks()) {
                    return all.length ? { kids: all } : null;
                }
                return kids.length ? { kids: kids } : null;
            },
            apply: function (npc, plan, kids, gains) {
                const self = setup.nurseryOvernight;
                const critical = setup.personality.has(npc, 'critical');
                const doctor = self.hasSkill(npc, 'doctor');
                const bonus = self.isExperienced(npc) ? 1 : 0;
                kids.forEach(kid => {
                    self.raise(gains, kid, 'beauty', random(1, 2) + bonus + (critical ? 2 : 0) + (doctor ? 1 : 0), self.HEALTHY_BEAUTY_CAP);
                    self.raise(gains, kid, 'endurance', random(1, 2) + bonus + (critical ? 1 : 0) + (doctor ? 2 : 0), self.HEALTHY_ENDURANCE_CAP);
                });
                const cook = self.hasSkill(npc, 'cook');
                const care = variables().player.nurseryCare;
                const room = Math.max(0, setup.nurseryCare.weeklySnacks() * self.SNACK_STOCK_WEEKS - care.snacks);
                if (!room || !setup.nurseryEncounters.storageHas('food') || (!cook && !setup.percentageChance(self.NON_COOK_SNACK_SHARE / Math.max(1, self.shiftSize)))) {
                    return [];
                }
                variables().storage.drop('food', 1);
                const made = Math.min(room, cook ? random(3, 5) : 1);
                care.snacks += made;
                return ['Snacks +' + made];
            }
        },
        {
            id: 'educational',
            weight: function () {
                return setup.nurseryOvernight.BASE_WEIGHT;
            },
            plan: function (npc) {
                const self = setup.nurseryOvernight;
                if (!self.hasSkill(npc, 'teacher')) {
                    return null;
                }
                const little = setup.nurseryEncounters.healthyKids(self.ACTIVITY_MIN_AGE, self.HEAD_START_MAX_AGE);
                const options = Object.keys(self.SKILL_STATS)
                    .filter(skill => self.hasSkill(npc, skill))
                    .map(skill => ({ skill: skill, kids: little.filter(kid => (kid.stats?.[self.SKILL_STATS[skill]] ?? 0) < self.HEAD_START_CAP) }))
                    .filter(option => option.kids.length);
                return options.length ? options.random() : null;
            },
            apply: function (npc, plan, kids, gains) {
                const self = setup.nurseryOvernight;
                const stat = self.SKILL_STATS[plan.skill];
                const bonus = (setup.personality.has(npc, 'efficient') ? 1 : 0) + (setup.personality.has(npc, 'organized') ? 1 : 0);
                kids.forEach(kid => {
                    kid.stats ??= {};
                    self.raise(gains, kid.stats, stat, random(1, 2) + bonus, self.HEAD_START_CAP, ucfirst(self.SKILL_LABELS[plan.skill]));
                });
                return [];
            }
        }
    ],

    /* {name} is the caretaker, {kids} the hoverable count, {skill} what was taught */
    TEXT: {
        burnout: [
            'The nursery got to be too much for {name}, who spent the day going through the motions and got nothing extra done.',
            '{name} hit a wall in the nursery. The children were fed and kept safe, but that was all there was left to give.',
            'By midday {name} had nothing left, and the rest of the shift was a matter of getting through it.'
        ],
        nurturing: [
            '{name} spent extra time with {kids} who were having a hard time, listening and offering comfort.',
            '{name} sat with {kids} who needed some reassurance.',
            '{name} made a point of giving {kids} some one-on-one attention.'
        ],
        crafty: [
            '{name} sat down with {kids} to make things out of scraps.',
            '{name} turned a pile of odds and ends into a craft session with {kids}.',
            '{name} helped {kids} build something from whatever could be salvaged.'
        ],
        sporty: [
            '{name} took {kids} out to the yard for races and games.',
            '{name} kept {kids} running through a game of tag for most of the afternoon.',
            '{name} got {kids} moving with an obstacle course around the yard.'
        ],
        healthy: [
            '{name} made sure {kids} were well fed and got plenty of fresh air.',
            '{name} kept {kids} on a good routine of proper meals and plenty of rest.',
            '{name} kept a close eye on the health of {kids}, and caught a few small problems early.'
        ],
        educational: [
            '{name} gave {kids} an early start on {skill}, turning the lesson into a game.',
            '{name} spent part of the day teaching {kids} the basics of {skill}.',
            '{name} used playtime to introduce {kids} to {skill}.'
        ]
    },

    /** Percent chance of burning out: behavior risk scaled by the staffing load, less what a good mood can absorb */
    burnoutChance: function (npc, care, kidCount, staff) {
        const behaviorRisk = (100 - care.behavior) / 4;
        const load = Math.min(kidCount, 100) / (staff * 25);
        const cushion = ((npc.happy ?? 0) + 100) / 8;
        return Math.clamp(Math.round(behaviorRisk * load - cushion), 1, 99);
    },

    /** Most children one impact can reach tonight */
    maxKids: function () {
        return Math.clamp(Math.floor(setup.nurseryCare.kids().length / this.KIDS_PER_REACH), this.MIN_REACH, this.MAX_REACH);
    },

    /** Raises a stat up to cap, never lowering one already past it, and notes what was gained under its label */
    raise: function (gains, target, stat, amount, cap = 100, label = this.STAT_LABELS[stat]) {
        const current = target[stat] ?? 0;
        const gained = current < cap ? Math.min(amount, cap - current) : 0;
        target[stat] = current + gained;
        if (gained > 0) {
            (gains[label] ??= []).push(gained);
        }
    },

    /** "Happiness +1 to +4" from the amounts noted by raise */
    describeGains: function (gains) {
        return Object.keys(gains).map(label => {
            const low = Math.min(...gains[label]);
            const high = Math.max(...gains[label]);
            return label + ' +' + low + (high > low ? ' to +' + high : '');
        });
    },

    /** Items with a higher weight are more likely, and each can only come up once */
    pickWeighted: function (items, weightOf, count) {
        const left = items.map(item => ({ item: item, weight: Math.max(1, weightOf(item)) }));
        const picked = [];
        while (picked.length < count && left.length) {
            let roll = Math.random() * left.reduce((sum, entry) => sum + entry.weight, 0);
            const index = left.findIndex(entry => (roll -= entry.weight) < 0);
            picked.push(left.splice(index < 0 ? left.length - 1 : index, 1)[0].item);
        }
        return picked;
    },

    /** The number of children, with their names on hover */
    kidsLabel: function (kids) {
        return this.hoverLabel(kids.map(kid => kid.name), kids.length + (kids.length === 1 ? ' child' : ' children'));
    },

    hoverLabel: function (names, text) {
        return '<span data-balloon-length="large" data-balloon-pos="up" aria-label="' + Util.escape(names.join(', ')) + '" style="border-bottom: 1px dotted">'
            + '<strong>' + text + '</strong></span>';
    },

    /** The summary only names what changed ("Endurance +2 to +3" shows as "Endurance"), in small print */
    message: function (key, tokens, summary) {
        const line = this.TEXT[key].random().replace(/\{(\w+)\}/g, (match, token) => tokens[token] ?? match);
        const stats = [...new Set(summary.map(part => part.replace(/\s[+-]\d.*$/, '')))];
        setup.sleepMessages.addJob(line + (stats.length ? ' <small>(' + stats.join(', ') + ')</small>' : ''), 'nursery');
    },

    /** Who this impact reaches: the ward if they make the cut, then the rest of the pool */
    chooseKids: function (npc, entry, plan) {
        const size = Math.min(random(1, this.maxKids()), plan.kids.length);
        const ward = setup.nurseryCare.wardOf(npc);
        const chosen = ward && plan.kids.includes(ward) && setup.percentageChance(entry.wardChance ?? this.WARD_CHANCE) ? [ward] : [];
        const rest = plan.kids.filter(kid => !chosen.includes(kid));
        const left = size - chosen.length;
        return chosen.concat(plan.lean ? this.pickWeighted(rest, plan.lean, left) : rest.shuffle().slice(0, left));
    },

    runImpact: function (npc, entry, plan) {
        const kids = this.chooseKids(npc, entry, plan);
        const gains = {};
        const extras = entry.apply(npc, plan, kids, gains);
        this.message(entry.id, { name: setup.displayName(npc), kids: this.kidsLabel(kids), skill: plan.skill ? this.SKILL_LABELS[plan.skill] : '' }, this.describeGains(gains).concat(extras));
    },

    run: function (workers) {
        const care = variables().player.nurseryCare;
        const kidCount = setup.nurseryCare.kids().length;
        if (!kidCount) {
            return;
        }
        this.shiftSize = workers.length;
        for (const npc of workers) {
            if (setup.percentageChance(this.burnoutChance(npc, care, kidCount, workers.length))) {
                const lost = setup.personality.happyLoss(npc, random(2, 5));
                npc.happy = Math.max(-100, (npc.happy ?? 0) - lost);
                this.message('burnout', { name: setup.displayName(npc) }, ['Happiness -' + lost]);
                continue;
            }
            const ward = setup.nurseryCare.wardOf(npc);
            if (ward) {
                this.raise({}, ward, 'happy', this.WARD_HAPPY);
            }
            const options = this.IMPACTS
                .map(entry => ({ entry: entry, plan: entry.plan(npc) }))
                .filter(option => option.plan);
            this.pickWeighted(options, option => option.entry.weight(npc, care), setup.percentageChance(this.SECOND_IMPACT_CHANCE) ? 2 : 1)
                .forEach(option => this.runImpact(npc, option.entry, option.plan));
        }
    }
};
