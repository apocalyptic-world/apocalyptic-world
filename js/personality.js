/**
 * Personality: every NPC carries 1-2 personality traits (setup.personalityTraits),
 * one per axis at most, so opposites like confident/nervous never meet.
 *
 * Each trait nudges exactly one system the game already runs. The numbers are
 * small on purpose: a personality should shape an NPC, not decide everything
 * about them. `info` doubles as the tooltip text in NPC info.
 */
setup.personality = {
    info: {
        efficient:     'Job output +20%. Nursery caretaker: head starts on skills go further',
        organized:     'Learns job skills 50% faster. Nursery caretaker: head starts on skills go further, and good days for the children\'s behavior are more likely and count for more',
        extravagant:   'Gifts are worth twice the relationship, and every gift that is not disliked adds 2 extra happiness. Slumber parties: enjoys them more, and gets a little extra beauty',
        careless:      'Job output -10%, and sometimes gets hurt at work. Nursery caretaker: the children\'s behavior slips more often. Slumber parties: may botch a makeover',
        friendly:      'Relationship does not drop when neglected. Slumber parties: throws more, invited more, bonds more',
        compassionate: 'At the church lifts everyone twice as much; as attendant comforts unhappy slaves; as nursery caretaker nurtures more often and the children behave better. Slumber parties: invited more, lifts the mood',
        critical:      'A harsher mistress (raises submission more often), but relationship drops after 7 days of neglect instead of 14. Nursery caretaker: nurtures less often, but healthy days go further and the children behave better. Slumber parties: invited less; as a guest bonds with the host but dampens other guests',
        rational:      'Will not walk out just for being unhappy, only if relationship drops below 0',
        sensitive:     'Happiness gained from rest and lost to unpleasant work is doubled. Slumber parties: enjoys and bonds more as a guest',
        nervous:       'Deals 15% less damage in fights, more likely to run into trouble scavenging. Slumber parties: throws fewer, invited less, enjoys and bonds much more as a guest',
        resilient:     'Recovers from sickness faster, unpleasant work costs half the happiness',
        confident:     'Deals 15% more damage in fights',
        inventive:     'Brings back one extra item from successful scavenging. Nursery caretaker: makes one extra toy',
        curious:       'Extra chance at rare scavenging finds, but more likely to run into trouble',
        consistent:    'Job output +10% after 30 days in the same job',
        cautious:      'Much safer when scavenging, but job output -10%. Slumber parties: throws fewer, enjoys and bonds more as a guest',
        outgoing:      'Happier when the guesthouse is busy. Slumber parties: throws more, invites one extra, enjoys and bonds more as a guest',
        energetic:     'Rest days pass twice as fast. Nursery caretaker: plays sports with the kids more often. Slumber parties: may double a makeover',
        solitary:      'Unhappy in a crowded guesthouse, happier when it is quiet. Slumber parties: throws fewer, invites one less, bonds much more as a guest',
        reserved:      'Submission does not drop when neglected'
    },

    /**
     * The five axes. An NPC never holds two traits from the same axis, which is what keeps
     * opposites like confident/nervous apart. Used by setup.personalityTraits (random roll)
     * and by the Edit NPC cheat menu.
     */
    axes: [
        { key: 'conscientiousness', label: 'Conscientiousness', traits: ['efficient', 'organized', 'extravagant', 'careless'] },
        { key: 'agreeableness',     label: 'Agreeableness',     traits: ['friendly', 'compassionate', 'critical', 'rational'] },
        { key: 'neuroticism',       label: 'Neuroticism',       traits: ['sensitive', 'nervous', 'resilient', 'confident'] },
        { key: 'openness',          label: 'Openness',          traits: ['inventive', 'curious', 'consistent', 'cautious'] },
        { key: 'extraversion',      label: 'Extraversion',      traits: ['outgoing', 'energetic', 'solitary', 'reserved'] }
    ],

    /** Jobs where a careless worker can hurt themselves. */
    ACCIDENT_JOBS: ['garden', 'kitchen', 'hunter', 'scavenging', 'forest', 'quarry', 'garage'],

    /** Extra happiness an extravagant NPC gets from each gift that is not disliked (keep in sync with info.extravagant). */
    EXTRAVAGANT_GIFT_HAPPY: 2,

    has: function (npc, trait) {
        return [].concat(npc?.personality ?? []).includes(trait);
    },

    /** The trait an NPC holds on one axis (an entry of setup.personality.axes), or null for none. */
    axisTrait: function (npc, axis) {
        return axis.traits.find(trait => this.has(npc, trait)) ?? null;
    },

    /**
     * Builds a personality list from one pick per axis ({ axisKey: trait | 'none' }).
     * A pick that does not belong to its axis is dropped, so one trait per axis is guaranteed.
     */
    fromPicks: function (picks) {
        const chosen = [];
        for (const axis of this.axes) {
            const pick = picks?.[axis.key];
            if (axis.traits.includes(pick)) {
                chosen.push(pick);
            }
        }
        return chosen.sort();
    },

    /** Randomised rounding, so +-10% still shows on small numbers (2.7 is 3 seven times in ten). */
    round: function (value) {
        const whole = Math.floor(value);
        return whole + (Math.random() < value - whole ? 1 : 0);
    },

    /** Nights spent in the current job, for 'consistent'. Called once per night. */
    tickJobStreak: function (npc) {
        const job = npc.assignedTo ?? null;
        if (!job) {
            delete npc.jobStreak;
        } else if (npc.jobStreak?.job === job) {
            npc.jobStreak.days++;
        } else {
            npc.jobStreak = { job: job, days: 1 };
        }
    },

    /** Job output adjusted for work style and afterglow. A real result never drops to zero. */
    output: function (npc, amount) {
        if (!amount || amount < 1) {
            return amount;
        }
        let mult = 1;
        if (this.has(npc, 'efficient')) mult += 0.2;
        if (this.has(npc, 'careless')) mult -= 0.1;
        if (this.has(npc, 'cautious')) mult -= 0.1;
        if (this.has(npc, 'consistent') && (npc.jobStreak?.days ?? 0) >= 30) mult += 0.1;
        if (setup.sex.hasAfterglow(npc)) mult += setup.sex.AFTERGLOW_OUTPUT;
        return mult === 1 ? amount : Math.max(1, this.round(amount * mult));
    },

    /** Extra job-skill progress on top of the normal +1 a night. */
    learnBonus: function (npc) {
        return this.has(npc, 'organized') && setup.percentageChance(50) ? 1 : 0;
    },

    /** Damage multiplier for an NPC fighting on your side. */
    fightMultiplier: function (npc) {
        if (this.has(npc, 'confident')) return 1.15;
        if (this.has(npc, 'nervous')) return 0.85;
        return 1;
    },

    /** Happiness lost to unpleasant work. */
    happyLoss: function (npc, amount) {
        if (this.has(npc, 'sensitive')) return amount * 2;
        if (this.has(npc, 'resilient')) return Math.ceil(amount / 2);
        return amount;
    },

    /** Happiness gained from rest. */
    happyGain: function (npc, amount) {
        return this.has(npc, 'sensitive') ? amount * 2 : amount;
    },

    /** Change to the chance of not coming back from scavenging. */
    scavengingRisk: function (npc) {
        let delta = 0;
        if (this.has(npc, 'cautious')) delta -= 3;
        if (this.has(npc, 'nervous')) delta += 2;
        if (this.has(npc, 'curious')) delta += 2;
        return delta;
    },

    /** Nights without contact before relationship starts slipping, or null for never. */
    relationshipNeglectDays: function (npc) {
        if (this.has(npc, 'friendly')) return null;
        if (this.has(npc, 'critical')) return 7;
        return 14;
    },

    /** Nightly happiness change from how full the guesthouse is. */
    crowdMood: function (npc) {
        const sv = variables();
        const fill = setup.guestRoom.occupants().length / Math.max(1, sv.guesthouseLimit ?? 3);
        if (this.has(npc, 'outgoing') && fill >= 0.6) return 1;
        if (this.has(npc, 'solitary')) {
            if (fill >= 0.8) return -1;
            if (fill < 0.3) return 1;
        }
        return 0;
    },

    /** Careless workers hurt themselves 5% of working nights. Returns true if it happened. */
    workAccident: function (npc) {
        if (!this.has(npc, 'careless') || !this.ACCIDENT_JOBS.includes(npc.assignedTo) || !setup.percentageChance(5)) {
            return false;
        }
        const days = randomInteger(1, 2);
        npc.sick = { days: days, desc: 'hurt at work', id: 'accident' };
        setup.sleepMessages.addMain('<span class="warning">' + npc.name + ' (careless) had an accident at work and needs ' + days + (days === 1 ? ' day' : ' days') + ' to recover.</span>');
        return true;
    },

    /**
     * Curious scavengers get their own roll at the rare finds, on top of the shared
     * nightly pool, roughly doubling how often they bring one home.
     */
    curiousFind: function (npc) {
        if (!this.has(npc, 'curious')) {
            return null;
        }
        for (const [item, chance] of Object.entries(setup.items.scavenging_chance ?? {})) {
            const max = setup.items.scavenging_max?.[item];
            if (typeof max !== 'undefined' && setup.cabinInventory.count(item) >= max) continue;
            if (setup.percentageChance(chance / 10)) return item;
        }
        return null;
    }
};
