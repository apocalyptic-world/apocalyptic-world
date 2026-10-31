/*
 * Wives living in the player's room: a wife of the MC (family.husband === 'mc') can move out of the
 * guest house into his bedroom. She no longer takes a guest bed (setup.guestRoom.occupants) and some
 * mornings wakes him up (the sleep-over morning scene). The room holds 1 wife, 3 with the big bed.
 *
 *   npc.livesWithMc = true   (ignored once she is no longer his wife, so a divorce needs no cleanup)
 */
setup.spouseRoom = {
    MORNING_CHANCE: 25,

    isMcWife: function (npc) {
        return !!npc && npc.family?.husband === 'mc' && setup.getAge(npc) >= 18;
    },

    livesHere: function (npc) {
        return !!npc?.livesWithMc && this.isMcWife(npc);
    },

    capacity: function () {
        return (variables().game.location?.big_bed ?? false) ? 3 : 1;
    },

    residents: function () {
        return (variables().guests ?? []).filter(g => this.livesHere(g));
    },

    hasRoom: function () {
        return this.residents().length < this.capacity();
    },

    anyWife: function () {
        return (variables().guests ?? []).some(g => this.isMcWife(g));
    },

    /** A wife living in the room who wakes the player up tomorrow (sleep-over morning scene), or null */
    morningCandidate: function () {
        if (!setup.percentageChance(this.MORNING_CHANCE)) {
            return null;
        }
        const pool = this.residents().filter(g => !g.gender && (g.likesGuys ?? true) && typeof g.sick === 'undefined' && !g.chastityBelt);
        return pool.length ? pool[window.randomInteger(0, pool.length - 1)] : null;
    }
};
