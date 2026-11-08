/*
 * Nursery behavior: the nightly drift of $player.nurseryCare.behavior, called from setup.nurseryCare.nightly.
 * Each night it moves up or down by 1-5. The odds of a bad night start from how stretched the caretakers are, then
 * shift with who they are and how old the children are. Bad nights at low behavior have knock-on effects, which stack.
 * Below LOCKDOWN_BELOW the player can step in with an emergency lockdown (Nursery - lockdown).
 */
setup.nurseryBehavior = {
    /* A bad night is never certain or impossible */
    MIN_CHANCE: 5,
    MAX_CHANCE: 95,
    KID_CAP: 100,
    STAFF_DIVISOR: 1.4,
    NEWCOMER_DAYS: 30,
    VETERAN_DAYS: 100,
    /* Percentage points on the chance of a bad night. Negative numbers favor a good night. */
    ODDS: {
        allYoung: 5,
        anyMidlife: -5,
        eachNewcomer: 2,
        /* More novices than this don't make it any worse */
        newcomerCap: 4,
        eachVeteran: -3,
        eachCritical: -3,
        eachCompassionate: -3,
        eachCareless: 5,
        anyOrganized: -5,
        /* If every child were in the band. Each band counts for its share of the nursery. */
        allToddlers: 15,
        allSchoolAge: 8,
        /* The shelf is empty after tonight's wear and weekly use */
        noToys: 5,
        noSnacks: 5
    },
    /* Above this, good nights get smaller the closer behavior is to 100: even well-behaved kids aren't perfect */
    PULL_FROM: 50,
    LOW_CARETAKERS: 25,
    LOW_PARENTS: 0,
    LOW_OFFSPRING: -25,
    LOW_RUNAWAY: -50,
    LOCKDOWN_BELOW: -50,
    LOCKDOWN_HAPPY_LOSS: 20,
    LOCKDOWN_CARETAKER_SUB: 10,
    LOCKDOWN_CARETAKER_HAPPY_LOSS: 10,

    /** How much of the nursery is aged from-to, from 0 to 1 */
    share: function (from, to) {
        const count = setup.nurseryCare.kids().length;
        return count ? setup.nurseryCare.kidsAged(from, to).length / count : 0;
    },

    /** Percent chance that tonight is a bad night. Nobody working counts the same as one caretaker. */
    negativeChance: function (workers) {
        const odds = this.ODDS;
        const count = test => workers.filter(test).length;
        const trait = name => count(npc => setup.personality.has(npc, name));
        const ages = workers.map(npc => setup.getAge(npc));
        const days = npc => npc.stats?.caretaker ?? 0;
        const care = variables().player.nurseryCare;

        let chance = Math.min(setup.nurseryCare.kids().length, this.KID_CAP) / (Math.max(workers.length, 1) / this.STAFF_DIVISOR);
        if (ages.length && Math.max(...ages) <= 24) chance += odds.allYoung;
        if (ages.some(age => age >= 35 && age <= 49)) chance += odds.anyMidlife;
        chance += Math.min(count(npc => days(npc) < this.NEWCOMER_DAYS) * odds.eachNewcomer, odds.newcomerCap);
        chance += count(npc => days(npc) > this.VETERAN_DAYS) * odds.eachVeteran;
        chance += trait('critical') * odds.eachCritical;
        chance += trait('compassionate') * odds.eachCompassionate;
        chance += trait('careless') * odds.eachCareless;
        if (trait('organized')) chance += odds.anyOrganized;
        chance += this.share(2, 5) * odds.allToddlers;
        chance += this.share(6, 12) * odds.allSchoolAge;
        if ((care.toys ?? 0) <= 0) chance += odds.noToys;
        if ((care.snacks ?? 0) <= 0) chance += odds.noSnacks;
        return Math.clamp(chance, this.MIN_CHANCE, this.MAX_CHANCE);
    },

    /** The more of the nursery is aged 2-5, the more likely a bad night is a bad one */
    negativeAmount: function () {
        return random(1, 5) + (Math.random() < this.share(2, 5) ? random(1, 2) : 0);
    },

    positiveAmount: function (workers) {
        const amount = random(1, 5) + (workers.some(npc => setup.personality.has(npc, 'organized')) ? random(1, 4) : 0);
        const behavior = variables().player.nurseryCare.behavior;
        if (behavior <= this.PULL_FROM) {
            return amount;
        }
        /* Full size at 50, half at 75, and down to 1 near the top */
        return Math.max(1, Math.round(amount * (100 - behavior) / (100 - this.PULL_FROM)));
    },

    TEXT: {
        positive: [
            'The nursery had a good day, with the children mostly doing as they were told.',
            'The caretakers got through the day in the nursery with few arguments and no real trouble.',
            'The children in the nursery were settled today, and bedtime went smoothly.'
        ],
        negative: [
            'The nursery had a rough day, with squabbles breaking out faster than anyone could settle them.',
            'The children in the nursery tested every rule they could find today.',
            'Bedtime in the nursery turned into a battle, and it took a long time to get everyone down.'
        ]
    },

    run: function (workers) {
        const care = variables().player.nurseryCare;
        if (!setup.nurseryCare.kids().length) {
            return;
        }
        const negative = setup.percentageChance(this.negativeChance(workers));
        const before = care.behavior;
        const amount = negative ? -this.negativeAmount() : this.positiveAmount(workers);
        care.behavior = Math.clamp(before + amount, -100, 100);
        const change = care.behavior - before;
        if (change) {
            setup.sleepMessages.addJob(this.TEXT[negative ? 'negative' : 'positive'].random() + ' <strong>(Behavior ' + (change > 0 ? '+' : '') + change + ', now ' + care.behavior + ')</strong>', 'nursery');
        }
        if (negative) {
            this.consequences(workers, care.behavior);
        }
    },

    /** Knock-on effects of a bad night, which stack as behavior falls */
    consequences: function (workers, behavior) {
        if (behavior < this.LOW_CARETAKERS && workers.length) {
            this.loseHappy(workers);
            setup.sleepMessages.addJob('Trying to keep order wore on ' + this.namesLabel(workers, 'caretaker', 'caretakers') + '. <strong>(Happiness -3 to -5)</strong>', 'nursery');
        }
        if (behavior < this.LOW_PARENTS) {
            const parents = this.allParents().shuffle().slice(0, random(1, 3));
            if (parents.length) {
                this.loseHappy(parents);
                setup.sleepMessages.addJob('The state of the nursery has ' + this.namesLabel(parents, 'parent', 'parents') + ' worried. <strong>(Happiness -3 to -5)</strong>', 'nursery');
            }
        }
        if (behavior < this.LOW_OFFSPRING) {
            const offspring = setup.nurseryCare.kidsAged(5, 17).filter(kid => setup.nurseryEncounters.isOwnChild(kid)).shuffle().slice(0, random(3, 5));
            if (offspring.length) {
                offspring.forEach(kid => setup.nurseryEncounters.change(kid, 'relationship', -5, -3));
                setup.sleepMessages.addJob(this.namesLabel(offspring, 'of your children blames', 'of your children blame') + ' you for how things are in the nursery. <strong>(Relationship -3 to -5)</strong>', 'nursery');
            }
        }
        if (behavior < this.LOW_RUNAWAY && setup.percentageChance(-behavior)) {
            this.runaway();
        }
    },

    loseHappy: function (npcs) {
        npcs.forEach(npc => setup.nurseryEncounters.change(npc, 'happy', -5, -3));
    },

    /** A count that shows the names on hover */
    namesLabel: function (npcs, one, many) {
        return setup.nurseryOvernight.hoverLabel(npcs.map(npc => setup.displayName(npc)), npcs.length + ' ' + (npcs.length === 1 ? one : many));
    },

    /** Everyone in the household with a child in the nursery, once each */
    allParents: function () {
        const parents = setup.nurseryCare.kids().flatMap(kid => setup.nurseryEncounters.parents(kid));
        return parents.filter((npc, index) => parents.indexOf(npc) === index);
    },

    /** A school-age child slips away for good, which devastates their parents */
    runaway: function () {
        const pool = setup.nurseryCare.kidsAged(5, 17);
        if (!pool.length) {
            return;
        }
        const kid = pool.random();
        const parents = setup.nurseryEncounters.parents(kid);
        const nursery = variables().nursery;
        nursery.splice(nursery.indexOf(kid), 1);
        parents.forEach(npc => setup.nurseryEncounters.change(npc, 'happy', -80, -80));
        const grief = parents.length
            ? ' ' + parents.map(npc => setup.displayName(npc)).join(' and ') + (parents.length === 1 ? ' is' : ' are') + ' devastated. <strong>(Happiness -80)</strong>'
            : '';
        setup.sleepMessages.add('<span class="dead">' + kid.name + ' ran away from the nursery in the night and is gone.</span>' + grief, 'nursery');
    },

    /** Moves behavior by a random amount from low to high, for encounters */
    change: function (low, high) {
        const care = variables().player.nurseryCare;
        const before = care.behavior;
        const rolled = random(low, high);
        care.behavior = Math.clamp(care.behavior + rolled, -100, 100);
        setup.nurseryEncounters.record(null, 'behavior', care.behavior - before, rolled);
    },

    canLockdown: function () {
        return setup.nurseryCare.isActive() && variables().player.nurseryCare.behavior < this.LOCKDOWN_BELOW;
    },

    lockdown: function () {
        const change = setup.nurseryEncounters.change.bind(setup.nurseryEncounters);
        variables().player.nurseryCare.behavior = 0;
        setup.nurseryCare.kids().forEach(kid => change(kid, 'happy', -this.LOCKDOWN_HAPPY_LOSS, -this.LOCKDOWN_HAPPY_LOSS));
        setup.nurseryCare.caretakers().forEach(npc => {
            change(npc, 'sub', this.LOCKDOWN_CARETAKER_SUB, this.LOCKDOWN_CARETAKER_SUB);
            change(npc, 'happy', -this.LOCKDOWN_CARETAKER_HAPPY_LOSS, -this.LOCKDOWN_CARETAKER_HAPPY_LOSS);
        });
    }
};
