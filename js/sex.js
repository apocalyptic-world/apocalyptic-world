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
    }
}