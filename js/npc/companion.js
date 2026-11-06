/**
 * The NPC a companion entry stands for: an NPC id (guest, slave, nursery or character). Old position keys
 * ('guest:3', 'slave:0') still resolve, for runtime-loaded scripts and for saves made before companions were stored
 * as ids. Returns undefined when nobody matches.
 */
setup.companionGet = function (key) {
    if (key === undefined || key === null || key === '') {
        return undefined;
    }
    if (typeof key === 'object') {
        return key.id ? setup.companionGet(key.id) : undefined;
    }
    const npc = setup.getNpcById(key);
    if (npc) {
        return npc;
    }
    const legacy = setup.npcs.parseLegacyCompanionKey(key);
    return legacy ? (variables()[legacy.type + 's'] ?? [])[legacy.index] : undefined;
};

/**
 * "namespace" for companions-list help functions.
 *
 * $player.companions is a Set of NPC ids. Use these helpers instead of touching it directly: they also convert the
 * old { 'guest:3': true } format if a runtime-loaded script put one back.
 */
setup.companions = {
    /** The id of an NPC, or the id itself (old position keys are resolved to the NPC's id). */
    idOf: function (npcOrId) {
        if (npcOrId && typeof npcOrId === 'object') {
            return npcOrId.id;
        }
        if (setup.npcs.parseLegacyCompanionKey(npcOrId)) {
            return setup.companionGet(npcOrId)?.id;
        }
        return npcOrId;
    },

    /** The ids in companions (defaults to $player.companions) as an array. */
    ids: function (companions) {
        if (companions === undefined) {
            return Array.from(setup.companions.set());
        }
        const v = variables();
        return setup.npcs.companionIds(companions, { guest: v.guests ?? [], slave: v.slaves ?? [] });
    },

    /** $player.companions as a Set, converting an old-format value in place. */
    set: function () {
        const player = variables().player;
        if (!(player.companions instanceof Set)) {
            const v = variables();
            player.companions = new Set(setup.npcs.companionIds(player.companions, { guest: v.guests ?? [], slave: v.slaves ?? [] }));
        }
        return player.companions;
    },

    /** The companion NPCs (the live objects), skipping ids that point at nobody. */
    list: function (companions) {
        return setup.companions.ids(companions).map(id => setup.companionGet(id)).filter(Boolean);
    },

    /** True when npcOrId is with the MC. Works with copies like $tmpGirl, since it compares ids. */
    has: function (npcOrId) {
        const id = setup.companions.idOf(npcOrId);
        return id !== undefined && setup.companions.set().has(id);
    },

    /**
     * Takes an NPC along. Accepts an NPC, an id, or the old (list, index) pair: add('guest', 3).
     * Returns false when the NPC has no id.
     */
    add: function (npcOrId, index) {
        let id;
        if ((npcOrId === 'guest' || npcOrId === 'slave') && index !== undefined) {
            id = (variables()[npcOrId + 's'] ?? [])[index]?.id;
        } else {
            id = setup.companions.idOf(npcOrId);
        }
        if (!id) {
            return false;
        }
        setup.companions.set().add(id);
        return true;
    },

    /** Sends an NPC home: they stop being a companion but stay in the game. */
    remove: function (npcOrId) {
        const id = setup.companions.idOf(npcOrId);
        return id !== undefined && setup.companions.set().delete(id);
    },

    /** No companions any more. */
    clear: function () {
        variables().player.companions = new Set();
    },

    /** Drops ids that no longer point at anyone (e.g. removed by a runtime script). Returns how many went. */
    prune: function () {
        const companions = setup.companions.set();
        let removed = 0;
        for (const id of Array.from(companions)) {
            if (!setup.companionGet(id)) {
                companions.delete(id);
                removed++;
            }
        }
        return removed;
    },

    /** 'guest' | 'slave' | 'nursery' | 'character' | null: which list holds the NPC with this id. */
    listOf: function (npcOrId) {
        return setup.companions.where(npcOrId)?.list ?? null;
    },

    /**
     * Where the NPC is right now: { list: 'guest' | 'slave' | 'nursery', index } or { list: 'character', key },
     * or null. Positions are only valid until a list changes: use them right away, never store them.
     */
    where: function (npcOrId) {
        const id = setup.companions.idOf(npcOrId);
        if (id === undefined) {
            return null;
        }
        const v = variables();
        for (const [list, npcs] of [['guest', v.guests], ['slave', v.slaves], ['nursery', v.nursery]]) {
            const index = (npcs ?? []).findIndex(n => n.id === id);
            if (index !== -1) {
                return { list, index };
            }
        }
        const key = Object.keys(v.characters ?? {}).find(k => v.characters[k]?.id === id || k === id);
        return key !== undefined ? { list: 'character', key } : null;
    },

    /**
     * Makes the NPC $tmpGirl and sets the matching $guestId / $slaveId / $charId (the others are unset), so
     * PassageHeader writes her changes back. Returns the NPC, or undefined when nobody has that id.
     */
    focus: function (npcOrId) {
        const v = variables();
        const place = setup.companions.where(npcOrId);
        if (!place || place.list === 'nursery') {
            return undefined;
        }
        delete v.slaveId;
        delete v.guestId;
        delete v.charId;
        delete v.childId;
        if (place.list === 'guest') {
            v.guestId = place.index;
            v.tmpGirl = v.guests[place.index];
        } else if (place.list === 'slave') {
            v.slaveId = place.index;
            v.tmpGirl = v.slaves[place.index];
        } else {
            v.charId = place.key;
            v.tmpGirl = v.characters[place.key];
        }
        return v.tmpGirl;
    },

    /**
     * Guest companions at least this horny, grouped by gender: { 0: [id, …], 1: [...] }.
     */
    getHorny: function (hornyLevel = 50) {
        const hornyCompanions = {};
        for (const companion of setup.companions.list()) {
            if (setup.companions.listOf(companion) !== 'guest' || companion.horny < hornyLevel) {
                continue;
            }
            hornyCompanions[companion.gender] ??= [];
            hornyCompanions[companion.gender].push(companion.id);
        }
        return hornyCompanions;
    },

    /**
     * All companions who has a certain skill
     * @param {Set|Array} companions  ids (defaults to $player.companions)
     * @param {string} skill
     * @returns [npc]  npcs
     */
    getBySkill: function (companions, skill = '') {
        return setup.companions.list(companions).filter(npc => (npc.skills ?? []).includes(skill));
    },

    /**
     * all doctors
     * @param {Set|Array} companions  ids (defaults to $player.companions)
     * @returns  [npc]  npcs
     */
    getDoctors: function (companions) {
        return setup.companions.getBySkill(companions, 'doctor');
    },

    /**
     * count companions
     * @param {Set|Array} companions  ids (defaults to $player.companions)
     * @returns {int} number of companions
     */
    count: function (companions) {
        return setup.companions.ids(companions).length;
    },

    /**
     * Check if the companions in the list is valid or not
     * @param {Set|Array} companions  ids (defaults to $player.companions)
     * @returns {boolean}      valid list or not
     */
    check: function (companions) {
        return setup.companions.ids(companions).every(id => setup.companionGet(id));
    },

    /**
     * check if we have the right number of companions with right strength
     * @param {Set|Array} companions  ids (defaults to $player.companions)
     * @param {int}       amount        number of companions
     * @param {int}       minstrength   minimium strength needed
     * @returns {boolean}
     */
    sanctuary_infiltration: function (companions, amount = 4, minstrength = 40) {
        if (setup.companions.count(companions) !== amount) {
            return false;
        }
        return setup.companions.ids(companions).every(id => (setup.companionGet(id)?.strength ?? 0) >= minstrength);
    }
};
