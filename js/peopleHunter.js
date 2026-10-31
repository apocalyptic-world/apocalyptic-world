/*
 * People hunter job (guests only): roams the land around the settlement and now and then brings a woman
 * back to the basement. Balanced to stay a slow trickle, not a money machine:
 *   - needs 100 submission, 40+ relationship, 40+ strength and a knife; one hunter at a time
 *   - level 2 (80+ strength, 80+ relationship, scavenger skill) hunts more often and catches prettier women
 *   - 4% (level 2: 6%) a night, one catch at a time, uses up a rope per catch, nothing when the basement is full
 *   - 3% a night to come home hurt; while hostile settlements are around, the same capture risk as scavenging
 *   - a quarter of the catches come from a discovered settlement, which costs 5 relationship with it
 *   - catches are flagged `hunted` and sell at half price until trained (submission 80+), see <<slaveValue>>
 * The nightly hunt runs in the 'sleepPeopleHunter' include; the capture risk in setup.sleep.processNpc.
 */
setup.peopleHunter = {
    JOB: 'people_hunter',
    CATCH_CHANCE: { 1: 4, 2: 6 },
    INJURY_CHANCE: 3,
    SETTLEMENT_SHARE: 25,
    SETTLEMENT_RELATIONSHIP: -5,
    TRAINED_SUB: 80,

    meetsRequirements: function (npc) {
        return !!npc && setup.getAge(npc) >= 18 && !(npc.traits ?? []).includes('feral')
            && (npc.sub ?? 0) >= 100 && (npc.relationship ?? 0) >= 40 && (npc.strength ?? 0) >= 40;
    },

    level: function (npc) {
        return (npc.strength ?? 0) >= 80 && (npc.relationship ?? 0) >= 80 && (npc.skills ?? []).includes('scavenger') ? 2 : 1;
    },

    catchChance: function (npc) {
        return this.CATCH_CHANCE[this.level(npc)];
    },

    basementHasRoom: function () {
        const v = variables();
        return !!(v.game.location?.basement ?? false) && (v.slaves ?? []).length < (v.basementLimit ?? 0);
    },

    hasRope: function (npc) {
        return setup.npcInventoryHas(npc, 'rope') || setup.cabinInventory.has('rope');
    },

    /** Uses up the rope for one catch: her own first, then one from storage */
    useRope: function (npc) {
        if (setup.npcInventoryHas(npc, 'rope')) {
            setup.npcInventoryRemove(npc, 'rope', 1);
        } else {
            setup.cabinInventory.drop('rope', 1);
        }
    },

    /** Beauty of tonight's catch: 30-60, level 2 up to 75, level 2 with binoculars 5% of the time 80-90 */
    rollBeauty: function (npc) {
        const lvl = this.level(npc);
        if (lvl === 2 && setup.npcInventoryHas(npc, 'binoculars') && setup.percentageChance(5)) {
            return window.randomInteger(80, 90);
        }
        return window.randomInteger(30, lvl === 2 ? 75 : 60);
    },

    /** A discovered settlement the catch was taken from (a quarter of the time), or null */
    pickSettlement: function () {
        if (!setup.percentageChance(this.SETTLEMENT_SHARE)) {
            return null;
        }
        const options = setup.settlements.getAll().filter(function (s) { return s.discovered && !s.destroyed; });
        return options.length ? options[window.randomInteger(0, options.length - 1)] : null;
    },

    /** Half price at the market while she is untrained */
    isUntrainedCatch: function (npc) {
        return !!npc?.hunted && (npc.sub ?? 0) < this.TRAINED_SUB;
    }
};
