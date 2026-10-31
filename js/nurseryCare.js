/*
 * Nursery caretaker job: one adult guest looks after the children.
 * Each night every child under 18 gains a little happiness and has a chance to grow one extra day
 * (25%, 35% with a compassionate caretaker) - roughly a quarter faster to adulthood.
 */
setup.nurseryCare = {
    GROW_CHANCE: 25,
    GROW_CHANCE_COMPASSIONATE: 35,
    HAPPY: 2,

    /** The guest working as caretaker tonight (not sick, not resting), or null */
    caretaker: function () {
        return (variables().guests ?? []).find(function (g) {
            return g.assignedTo === 'caretaker' && typeof g.sick === 'undefined' && typeof g.rest === 'undefined';
        }) ?? null;
    },

    growChance: function (carer) {
        return setup.personality.has(carer, 'compassionate') ? this.GROW_CHANCE_COMPASSIONATE : this.GROW_CHANCE;
    },

    /** Called once a night from the sleep widget, before the nursery loop */
    nightly: function () {
        const v = variables();
        const carer = this.caretaker();
        if (!carer || !(v.game?.location?.nursery ?? false)) {
            return;
        }
        const chance = this.growChance(carer);
        let kids = 0;
        for (const kid of (v.nursery ?? [])) {
            if (setup.getAge(kid) >= 18) {
                continue;
            }
            kids++;
            kid.happy = Math.min(100, (kid.happy ?? 0) + this.HAPPY);
            if (setup.percentageChance(chance)) {
                kid.birthDate.setDate(kid.birthDate.getDate() - 1);
            }
        }
        carer.stats ??= {};
        carer.stats.caretaker = (carer.stats.caretaker ?? 0) + 1;
        if (kids) {
            setup.sleepMessages.addJob(carer.name + ' looked after <strong>' + kids + '</strong> ' + (kids === 1 ? 'child' : 'children') + ' in the nursery.', 'nursery');
        }
    }
};
