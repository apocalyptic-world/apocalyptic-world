setup.sex = {
    calcHornyIncrease: function(npc, hornyIncrease, sexAction)
    {
        let levels = [
            { name: "Beautiful", multiplier: 2 },
            { name: "Pretty", multiplier: 1.5 },
            { name: "Average", multiplier: 1 },
            { name: "Ugly", multiplier: 0.5 }
        ];
    
        let hornyPerStep = hornyIncrease * (0.5 + (npc.beauty ?? 0) / 200);
        let levelIndex = Math.max(0, Math.min(Math.floor(hornyPerStep / (hornyIncrease / 2)), levels.length - 1));

        if (sexAction === 'pussy' && npc.traits.includes('tight_vagina')) {
            hornyPerStep += randomInteger(5, 10)
        }
    
        return parseInt(hornyPerStep);
    },

    /**
     * Mirror of calcHornyIncrease for the partner: the more sex the MC has had
     * ($player.sexp), the faster partners get aroused. Asymptotic, so it tops
     * out at +60% and a long save can't trivialise every scene.
     */
    calcNpcHornyIncrease: function(npc, hornyGive, sexAction)
    {
        if (!hornyGive) {
            return hornyGive;
        }
        return Math.max(1, Math.round(hornyGive * setup.sex.sexpMultiplier()));
    },

    sexpMultiplier: function()
    {
        const sexp = Math.max(0, variables().player.sexp ?? 0);
        return 1 + 0.6 * (sexp / (sexp + 150));
    },

    /**
     * Afterglow: an NPC who came with the MC (not forced) has a better next day,
     * +10% work output and a little happiness. Set at the orgasm, read during the
     * following sleep. The sleep advances $game.day before NPCs are processed, so
     * "the day that just ended" is day - 1.
     */
    AFTERGLOW_OUTPUT: 0.1,
    AFTERGLOW_HAPPY: 3,

    giveAfterglow: function(npc)
    {
        if (npc && !variables().sexForced) {
            npc.afterglow = variables().game.day;
        }
    },

    hasAfterglow: function(npc)
    {
        return typeof npc?.afterglow !== 'undefined' && npc.afterglow === variables().game.day - 1;
    },

    /**
     * A virgin who trusts the MC (relationship) and has come with him a few times
     * (npc.orgasms) is willing to go all the way, even if her corruption is still
     * too low to pass the usual gate for pussy sex.
     */
    VIRGIN_WILLING_RELATIONSHIP: 70,
    VIRGIN_WILLING_ORGASMS: 5,

    virginWilling: function(npc)
    {
        return !!npc?.virgin
            && (npc.likesGuys ?? true)
            && (npc.relationship ?? 0) >= this.VIRGIN_WILLING_RELATIONSHIP
            && (npc.orgasms ?? 0) >= this.VIRGIN_WILLING_ORGASMS;
    },

    /** True if the action penetrates anybody's pussy (stats, stats2 or stats3 holds 'pussy'). */
    isPussyAction: function(action)
    {
        return ['stats', 'stats2', 'stats3'].some(key => [].concat(action?.[key] ?? []).includes('pussy'));
    }
}