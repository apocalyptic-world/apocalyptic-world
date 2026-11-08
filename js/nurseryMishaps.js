/*
 * Nursery mishaps: things that go wrong overnight on their own, apart from the good or bad night in setup.nurseryBehavior.
 * Called from setup.nurseryCare.nightly after the behavior drift. Each mishap rolls separately, so more than one can happen.
 *
 * To add one, add an entry to LIST:
 *   id:     unique name
 *   chance: function (care), percent chance tonight (0 if it can't happen)
 *   apply:  function (care), makes the changes and returns the sleep message
 *
 * Too quiet leaves care.quietIncident = { kind: 'teen' | 'group' | 'woke', kid } for the next day, when a caretaker
 * brings it up with the player (Nursery encounter - too quiet). It is cleared at the start of the following night.
 */
setup.nurseryMishaps = {
    /* Too quiet: no chance at or below this behavior, then this many points of behavior for each percent of chance */
    QUIET_FROM: 50,
    QUIET_POINTS_PER_PERCENT: 5,
    /* Into the stores: chance if every child were a toddler, scaled by their share of the nursery */
    STORES_CHANCE: 10,

    LIST: [
        {
            id: 'tooQuiet',
            chance: function (care) {
                const self = setup.nurseryMishaps;
                return Math.max(0, (care.behavior - self.QUIET_FROM) / self.QUIET_POINTS_PER_PERCENT);
            },
            apply: function (care) {
                const change = setup.nurseryMishaps.change(-10, -5);
                const teens = setup.nurseryEncounters.healthyKids(13, 17);
                const older = setup.nurseryEncounters.healthyKids(6, 12);
                let line;
                if (teens.length) {
                    const teen = teens.random();
                    care.quietIncident = { kind: 'teen', kid: teen.id };
                    line = 'Things in the nursery had been going so well that the caretakers let their guard down. ' + teen.name
                        + ' slipped out after lights-out and wasn\'t found until well past midnight, and by morning every child in the room knew about it.';
                } else if (older.length > 1) {
                    care.quietIncident = { kind: 'group' };
                    line = 'With the nursery running so smoothly, nobody checked on the older children after lights-out. They stayed up half the night whispering and giggling, and the whole room paid for it in the morning.';
                } else {
                    care.quietIncident = { kind: 'woke' };
                    line = 'The nursery had been so calm lately that bedtime got a little lax. One child woke the rest, and nobody got much sleep after that.';
                }
                return line + setup.nurseryMishaps.summary(change);
            }
        },
        {
            id: 'cabinFever',
            chance: function () {
                const weather = variables().weather;
                return (weather?.sandStorm || weather?.coldSnap) ? 100 : 0;
            },
            apply: function (care) {
                const reason = variables().weather?.sandStorm ? 'the sandstorm' : 'the cold';
                if (care.toys > 0) {
                    const change = setup.nurseryMishaps.change(-3, -2);
                    return 'With ' + reason + ' keeping everyone indoors, the children in the nursery were more restless than usual, though the toys kept the worst of it in check.' + setup.nurseryMishaps.summary(change);
                }
                const change = setup.nurseryMishaps.change(-6, -3);
                return 'With ' + reason + ' keeping everyone indoors and nothing to play with, the children in the nursery spent the day bouncing off the walls.' + setup.nurseryMishaps.summary(change);
            }
        },
        {
            id: 'intoTheStores',
            chance: function (care) {
                if (care.toys <= 0 && care.snacks <= 0) {
                    return 0;
                }
                return setup.nurseryBehavior.share(2, 5) * setup.nurseryMishaps.STORES_CHANCE;
            },
            apply: function (care) {
                const shelf = ['toys', 'snacks'].filter(key => care[key] > 0).random();
                const lost = Math.min(care[shelf], random(2, 5));
                care[shelf] -= lost;
                const change = setup.nurseryMishaps.change(-4, -2);
                const line = shelf === 'snacks'
                    ? 'A few of the toddlers found their way into the snack shelf while nobody was looking, and what they didn\'t eat ended up on the floor.'
                    : 'The toddlers emptied the toy box and set about testing which toys would survive being thrown, stepped on or dunked in the wash bucket.';
                return line + setup.nurseryMishaps.summary(change, (shelf === 'snacks' ? 'Snacks' : 'Toys') + ' -' + lost + ', ' + care[shelf] + ' left');
            }
        }
    ],

    /** Lowers behavior by low to high (both negative) and returns how much it actually moved */
    change: function (low, high) {
        const care = variables().player.nurseryCare;
        const before = care.behavior;
        setup.nurseryBehavior.change(low, high);
        return care.behavior - before;
    },

    summary: function (change, extra) {
        const parts = [];
        if (extra) parts.push(extra);
        if (change) parts.push('Behavior ' + change + ', now ' + variables().player.nurseryCare.behavior);
        return parts.length ? ' <strong>(' + parts.join(', ') + ')</strong>' : '';
    },

    run: function () {
        const care = variables().player.nurseryCare;
        delete care.quietIncident;
        if (!setup.nurseryCare.kids().length) {
            return;
        }
        for (const entry of this.LIST) {
            if (setup.percentageChance(entry.chance(care))) {
                setup.sleepMessages.addJob(entry.apply(care), 'nursery');
            }
        }
    }
};
