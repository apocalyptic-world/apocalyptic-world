/*
 * Church service: the MC, as patron of the church, tells each nun how to understand the divine.
 * Eve opens the feature once the church has stood for a while ($characters.eve.quests.church_service_day).
 * A nun's own npc.churchService holds { divineFocus: 'kind' | 'love' | 'power' }, created the first time she is given one.
 */
setup.churchService = {
    INTRO_DELAY_DAYS: 10,
    FOCUSES: ['kind', 'love', 'power'],
    FOCUS_LABELS: {
        kind: 'Holy and kind',
        love: 'Like sex, based on love',
        power: 'Like sex, based on power'
    },

    nuns: function () {
        return (variables().guests ?? []).filter(npc => npc.assignedTo === 'church');
    },

    isActive: function () {
        return !!variables().characters?.eve?.quests?.church_service_day;
    },

    /** Base policy: nuns may attend to slaves as well as guests (holy and love overnight work, the welcome at the gate, hospital visits) */
    servesSlaves: function () {
        return !!variables().player?.baseManagement?.nunsServeSlaves;
    },

    /** Who a nun's care reaches: the guests, and the slaves too if the policy allows */
    served: function () {
        const v = variables();
        return (v.guests ?? []).concat(this.servesSlaves() ? v.slaves ?? [] : []);
    },

    introDue: function () {
        const v = variables();
        const quests = v.characters?.eve?.quests ?? {};
        return !!quests.church_built_day
            && !quests.church_service_day
            && v.game.day - quests.church_built_day >= this.INTRO_DELAY_DAYS
            && this.nuns().length > 0
            && timeBetween('08:00', '18:00');
    },

    /** Eve hints at the carnal paths only once the MC has slept with her or corrupted her */
    eveIsOpen: function () {
        const eve = variables().characters?.eve ?? {};
        return !!eve.quests?.sex || (eve.corruption ?? 0) >= 30;
    },

    hasFocus: function (npc) {
        return !!npc.churchService?.divineFocus;
    },

    /** Nuns who haven't been spoken to yet serve the kind way */
    focus: function (npc) {
        return npc.churchService?.divineFocus ?? 'kind';
    },

    setFocus: function (npc, focus) {
        npc.churchService ??= {};
        npc.churchService.divineFocus = focus;
    },

    FIRST_TALK_GAINS: {
        kind: { happy: 3, relationship: 3 },
        love: { happy: 3, relationship: 5 },
        power: { happy: 3, relationship: 3, corruption: 3, sub: 2 }
    },
    STAT_LABELS: { happy: 'Happy', relationship: 'Relationship', corruption: 'Corruption', sub: 'Submission' },

    /** Sets the nun's first focus and applies what praying on it together gives her. Returns the effects line to show. */
    firstFocus: function (npc, focus) {
        this.setFocus(npc, focus);
        const gains = this.FIRST_TALK_GAINS[focus];
        const parts = Object.keys(gains).map(stat => {
            npc[stat] = Math.min((npc[stat] ?? 0) + gains[stat], 100);
            return this.STAT_LABELS[stat] + ' +' + gains[stat];
        });
        return '(' + parts.join(', ') + ')';
    },

    canOfferHelp: function (npc) {
        return this.isActive()
            && npc.assignedTo === 'church'
            && npc.location === 'church'
            && timeBetween('08:00', '18:00');
    },

    /** Whether the love and power talks can end in sex; empty string if so, otherwise the reason shown on the greyed-out link */
    inviteBlockedBy: function (npc) {
        const v = variables();
        if (!(npc.likesGuys ?? true)) return 'hidden';
        if (v.player?.baseManagement?.noIncest && setup.family.getRelationToMC(npc)) return 'hidden';
        if ((v.player.energy ?? 0) <= 30) return 'Not enough energy';
        return '';
    },

    /** "Anna", "Anna and Beth", "Anna, Beth and Cleo" */
    nunNames: function () {
        const names = this.nuns().map(npc => setup.displayName(npc));
        if (names.length < 2) return names.join('');
        return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
    }
};
