/**
 * Lines for strangers the MC meets while exploring (forest, roadside, Abandoned mall), by situation and by the MC's
 * reputation tier. Scene-specific text stays in its passage; this holds what any stranger could say.
 *
 * Placeholders, filled from the NPC: %SheOrHe% %sheOrHe% %herOrHim% %herOrHis%, plus any vars passed to line().
 * A line can be { text, aim: 'mc' } when the stranger wants the MC; those only show when
 * setup.npcs.mcAttraction(npc).willing is 'desire' and the stranger is an adult.
 *
 *   setup.strangerDialog.line('inviteRefused', $tmpGirl)               // tier from $player.reputation
 *   setup.strangerDialog.line('companionVouch', $tmpGirl, { vars: { name: 'Ana' } })
 */
setup.strangerDialog = {
    /** Reputation tiers, lowest first: a tier applies from its min reputation on. */
    TIERS: [
        { id: 'unknown', min: -Infinity, name: 'Unknown' },
        { id: 'rumoured', min: 10, name: 'Rumoured' },
        { id: 'known', min: 50, name: 'Known' },
        { id: 'renowned', min: 100, name: 'Renowned' },
        { id: 'legend', min: 200, name: 'Legend' }
    ],

    /** Tier id for a reputation value ('unknown' … 'legend'). */
    tierOf: function (reputation) {
        const rep = Number(reputation) || 0;
        let tier = this.TIERS[0];
        for (const t of this.TIERS) {
            if (rep >= t.min) tier = t;
        }
        return tier.id;
    },

    /**
     * situation → tier → lines. A tier without lines uses the closest lower tier; 'any' lines are added to every
     * tier. Every tiered situation has 'unknown' lines, so the fallback always finds something.
     */
    LINES: {
        // narration when the stranger has heard of the MC (setup.player.meetStranger → heardOfYou)
        heardOfYou: {
            unknown: [
                '%SheOrHe% squints at you, as if trying to place your face. Someone, somewhere, has mentioned you.'
            ],
            rumoured: [
                'Something changes in %herOrHis% face. Your name travels further than you thought, and %sheOrHe% seems to know it.'
            ],
            known: [
                '%SheOrHe% looks at you a second time, and you see recognition in %herOrHis% eyes. People out here talk about you, and %sheOrHe% has heard the stories.'
            ],
            renowned: [
                '%SheOrHe% studies your face, then lets out a breath. "I know who you are. Everyone says you can be trusted."'
            ],
            legend: [
                '%SheOrHe% stares at you, wide-eyed. "It\'s really you. They talk about you at every campfire from here to the city."'
            ]
        },
        // narration when a companion vouches for the MC; vars: { name }
        companionVouch: {
            any: [
                '%name% steps up beside you and tells %herOrHim% you are someone to trust. %SheOrHe% relaxes a little.'
            ]
        },
        // said by a stranger who refuses the invite but can't just walk away (the MC is stronger)
        inviteRefused: {
            unknown: [
                "No, I don't want to come to live with you. Let me go!"
            ],
            known: [
                "I've heard good things about you. But I'm not ready to live with anyone. Please, let me go."
            ],
            renowned: [
                "I know your place is probably the safest around. I just... can't. Not yet. Please let me go."
            ]
        },
        // narration when a stranger refuses the invite and leaves (the stranger is stronger)
        refusedLeaves: {
            unknown: [
                '%SheOrHe% considers your invite for a few moments, says no and leaves.'
            ],
            renowned: [
                '%SheOrHe% hesitates. Your name clearly means something to %herOrHim%, but in the end %sheOrHe% shakes %herOrHis% head and walks away.'
            ]
        },
        // NPC talk with a stranger (instead of setup.npc.getSayDialog, which is written for the household)
        talk: {
            any: [
                'Out here you learn to sleep with one eye open.',
                "Another day alive. That's a good day now."
            ],
            unknown: [
                "Keep your hands where I can see them. People out here don't stop to chat for nothing.",
                "I don't know you. Out here, that usually means trouble.",
                "If you're looking for supplies, I've got nothing worth taking."
            ],
            rumoured: [
                'You look like someone I heard about. Some fighter from the underground city?',
                "There's talk of someone building a place out here. Is that you?"
            ],
            known: [
                'I know who you are. People say you keep your settlement fed and safe.',
                "You're the one from the fight cage, right? I've heard the stories."
            ],
            renowned: [
                'Everyone out here has heard of you. Is it true you take people in?',
                'Your name comes up at every campfire. Most of it good.'
            ],
            legend: [
                "I can't believe it's really you. They say nobody touches your people.",
                "Half the wasteland talks about you like you're a legend. I thought you'd be taller."
            ]
        },
        // extra talk lines for a horny stranger (horny ≥ 20 / ≥ 60), added by talk()
        talkHorny: {
            any: [
                'Being alone out here gets to you in ways you would not expect.'
            ]
        },
        talkFlirt: {
            any: [
                { text: "You've got a look about you. I wouldn't mind getting to know you better.", aim: 'mc' },
                { text: "If you're offering more than conversation, I'm listening.", aim: 'mc' }
            ]
        }
    },

    /** All lines for situation at tier (closest lower tier with lines, plus 'any'), before filtering. */
    linesFor: function (situation, tier) {
        const table = this.LINES[situation];
        if (!table) return [];
        const ids = this.TIERS.map(t => t.id);
        let i = ids.indexOf(tier);
        if (i === -1) i = 0;
        let tiered = [];
        for (; i >= 0 && !tiered.length; i--) {
            tiered = table[ids[i]] ?? [];
        }
        return [...tiered, ...(table.any ?? [])];
    },

    /** True when npc may say lines aimed at the MC (adult and setup.npcs.mcAttraction(npc).willing === 'desire'). */
    wantsMc: function (npc) {
        return setup.getAge(npc) >= 18 && setup.npcs.mcAttraction(npc).willing === 'desire';
    },

    /** Replaces the placeholders in text with npc's pronouns and vars. */
    fill: function (text, npc, vars = {}) {
        const values = {
            SheOrHe: setup.pronounceWhat(npc, true),
            sheOrHe: setup.pronounceWhat(npc),
            herOrHim: setup.pronounceWho(npc),
            herOrHis: setup.pronounceWhos(npc),
            ...vars
        };
        return text.replace(/%(\w+)%/g, (match, key) => (key in values ? String(values[key]) : match));
    },

    /** Lines npc can say from a list: drops aim 'mc' lines unless wantsMc(npc). */
    allowed: function (lines, npc) {
        const wantsMc = lines.some(line => line?.aim === 'mc') && this.wantsMc(npc);
        return lines.filter(line => line?.aim !== 'mc' || wantsMc);
    },

    /**
     * A random line for situation, filled in for npc. options: tier (default: from $player.reputation),
     * vars (extra placeholders), rng (0 ≤ x < 1). Returns '' when there is no line.
     */
    line: function (situation, npc, { tier = null, vars = {}, rng = Math.random } = {}) {
        return this.pick(this.allowed(this.linesFor(situation, tier ?? this.currentTier()), npc), npc, vars, rng);
    },

    /** A Talk line for a stranger: the tier's lines, plus horny and (if they want the MC) flirty ones. */
    talk: function (npc, { tier = null, rng = Math.random } = {}) {
        tier ??= this.currentTier();
        const horny = Number(npc?.horny) || 0;
        const lines = [...this.linesFor('talk', tier)];
        if (horny >= 20) lines.push(...this.linesFor('talkHorny', tier));
        if (horny >= 60) lines.push(...this.linesFor('talkFlirt', tier));
        return this.pick(this.allowed(lines, npc), npc, {}, rng);
    },

    currentTier: function () {
        return this.tierOf(variables().player?.reputation ?? 0);
    },

    pick: function (lines, npc, vars, rng) {
        if (!lines.length) return '';
        const line = lines[Math.floor(rng() * lines.length)];
        return this.fill(typeof line === 'string' ? line : line.text, npc, vars);
    }
};
