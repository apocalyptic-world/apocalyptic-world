/**
 * Eligibility guards for random household encounters: adults only, and no relatives of the
 * MC while the noIncest policy is on.
 */
setup.Tangle = {
    isRelated: function (npc) {
        return !!setup.family.getRelationToMC(npc) || setup.family.isIncest(variables().player, npc);
    },

    /** Guard for random-encounter triggers: adults only, and no relatives under the noIncest policy. */
    eligible: function (npc) {
        if (!npc || setup.getAge(npc) < 18) return false;
        return !(variables().player?.baseManagement?.noIncest && this.isRelated(npc));
    }
};
