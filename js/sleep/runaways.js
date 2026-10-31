/**
 * Runaway guests: a guest who quietly walks out at night (the leave check in js/sleep/processNpc.js,
 * when setup.betrayal.depart() did not turn it into 'Gone in the night') leaves fresh tracks.
 * The next time the player is at the cabin - the same morning or the day after - Wood cabin opens
 * 'Event - Runaway tracks', where he can follow her.
 *
 *   $game.runaway = { npc (clone), day }
 *
 * One runaway at a time; the first one of the night is kept.
 */
setup.runaways = {
    /** Days the tracks stay fresh after the night she left */
    FRESH_DAYS: 1,

    /** A guest is leaving quietly tonight. Returns true when her tracks can be followed. */
    depart: function (npc) {
        const v = variables();
        if (v.game.runaway || !v.game.cabinName || setup.getAge(npc) < 18) {
            return false;
        }
        v.game.runaway = { npc: clone(npc), day: v.game.day };
        return true;
    },

    /** True while there is a runaway whose tracks are still fresh; clears a stale one. */
    active: function () {
        const v = variables();
        const r = v.game.runaway;
        if (!r) {
            return false;
        }
        if (v.game.day - r.day > this.FRESH_DAYS) {
            delete v.game.runaway;
            return false;
        }
        return true;
    },

    /** Chance to pick up her trail: fresher tracks and a stronger MC find her more often */
    findChance: function () {
        const v = variables();
        const daysOld = Math.max(0, v.game.day - (v.game.runaway?.day ?? v.game.day));
        return Math.max(20, Math.min(90, 75 - daysOld * 25 + Math.min(15, Math.floor((v.player.strength ?? 0) / 6))));
    },

    /** Chance she agrees to come back when you talk to her */
    talkChance: function (npc) {
        return Math.max(10, Math.min(85, 40 + Math.round((npc.relationship ?? 0) / 2) + ((npc.happy ?? 0) > -70 ? 10 : 0)));
    },

    canDragToBasement: function () {
        const v = variables();
        return !!(v.game.location?.basement ?? false) && (v.slaves ?? []).length < (v.basementLimit ?? 0);
    }
};
