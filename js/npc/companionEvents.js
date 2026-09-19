/**
 * Companion travel events.
 *
 * Trips currently only notice companions as extra damage. These events read the
 * companion's own data (skills, traits, state) so that WHO you bring changes what
 * happens, and remember the outcome so later events can refer back to it.
 *
 * Memory lives on $player.companionMemory, keyed by npc.id — the 'guest:3' style
 * companion key shifts whenever the roster changes, npc.id does not.
 */
setup.companionEvents = {

    /** Every event: which companion it needs, and when it can fire. */
    defs: [
        {
            id: 'watch',
            passage: 'Companion - watch shift',
            // Two-hander: with a party the others rotate the watch between them and
            // the choice of who goes without rest stops meaning anything.
            solo: true,
            test: function (npc) {
                // Female-only for now: the passage art depicts a woman. Drop this
                // condition once male variants of the two images exist.
                return [0, 2].includes(npc.gender) && (npc.happy ?? 0) > -50;
            }
        },
        {
            id: 'ration',
            passage: 'Companion - last ration',
            // Two-hander: one tin split five ways is arithmetic, not a dilemma.
            solo: true,
            test: function (npc) {
                return [0, 2].includes(npc.gender) && variables().backpack.count('food') === 1;
            }
        }
    ],

    /** Per-companion memory record, created on first use. */
    memoryFor: function (npcId) {
        const player = variables().player;
        player.companionMemory ??= {};
        player.companionMemory[npcId] ??= { seen: {} };
        player.companionMemory[npcId].seen ??= {};
        return player.companionMemory[npcId];
    },

    /**
     * Pick a companion + event for this trip, or null if nothing is eligible.
     * Events already seen with this companion are weighted down so they thin out
     * instead of repeating back to back.
     */
    pick: function () {
        const sv = variables();
        const day = sv.game.day;
        const candidates = [];
        const soloTrip = Object.keys(sv.player.companions ?? {}).length === 1;

        for (const key in (sv.player.companions ?? {})) {
            const npc = setup.companionGet(key);
            if (!npc || !npc.id) continue;
            if (setup.getAge(npc) < 18) continue;

            const mem = setup.companionEvents.memoryFor(npc.id);
            if (day < ((mem.lastEventDay ?? -99) + 3)) continue;

            for (const def of setup.companionEvents.defs) {
                if (def.solo && !soloTrip) continue;
                if (!def.test(npc)) continue;
                const seen = mem.seen[def.id] ?? 0;
                candidates.push({
                    weight: 1 / (1 + seen),
                    npcKey: key,
                    npcId: npc.id,
                    event: def.id,
                    passage: def.passage
                });
            }
        }

        if (!candidates.length) return null;

        let total = 0;
        for (const c of candidates) total += c.weight;
        let roll = Math.random() * total;
        for (const c of candidates) {
            roll -= c.weight;
            if (roll <= 0) return c;
        }
        return candidates[candidates.length - 1];
    },

    /** Stamp the outcome so later events can refer back to it. */
    record: function (npcId, event, extra = {}) {
        const mem = setup.companionEvents.memoryFor(npcId);
        mem.lastEventDay = variables().game.day;
        mem.seen[event] = (mem.seen[event] ?? 0) + 1;
        mem.lastEvent = event;
        Object.assign(mem, extra);
        return mem;
    }
};
