/**
 * NPC list helpers. Kept free of SugarCube globals (no variables(), State, random() or $lists inside) so they can
 * be unit tested in Node (see test/). Callers pass the lists in.
 */
setup.npcs = setup.npcs ?? {};

/**
 * Up to n distinct random items from list, optionally only those passing filter. Never mutates list, never loops
 * forever (asking for more than there are just returns them all), and returns the items themselves, not indices.
 * rng: a function returning [0, 1); defaults to Math.random, tests pass a seeded one.
 *
 *   setup.npcs.pick($guests, 2, g => setup.getAge(g) >= 18)
 */
setup.npcs.pick = function (list, n = 1, filter = null, rng = Math.random) {
    if (!Array.isArray(list)) {
        return [];
    }
    const pool = filter ? list.filter(filter) : list.slice();
    const count = Math.min(Math.max(0, Math.floor(n) || 0), pool.length);

    // Partial Fisher–Yates: only shuffle the positions we take
    for (let i = 0; i < count; i++) {
        const j = Math.min(pool.length - 1, i + Math.floor(rng() * (pool.length - i)));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
};

/** A shuffled copy of list (the list itself is left alone). */
setup.npcs.shuffled = function (list, rng = Math.random) {
    return setup.npcs.pick(list, Array.isArray(list) ? list.length : 0, null, rng);
};

/* Older helpers, kept because runtime-loaded scripts (js/actions.js, packs/) may still call them. New code should
   use setup.npcs.pick. They used to live in js/scripts.js; the versions there could loop forever, shuffled the
   caller's list in place, and returned indices into a list that had shrunk while picking. */

/** Up to limit random items of persons (shuffled, like before; persons itself is no longer shuffled in place). */
setup.getRandomPersons = function (persons, limit = 2) {
    return setup.npcs.pick(persons, limit);
};

/** Up to limit distinct random positions in persons. */
setup.getRandomPersonIds = function (persons, limit = 2) {
    return setup.npcs.pick(Array.isArray(persons) ? persons.map((_, i) => i) : [], limit);
};

/** Up to limit distinct random positions in persons of adult women. */
setup.getRandomPersonIdsGirls = function (persons, limit = 2) {
    const isAdultWoman = i => persons[i] && !persons[i].gender && setup.getAge(persons[i]) >= 18;
    return setup.npcs.pick(Array.isArray(persons) ? persons.map((_, i) => i) : [], limit, isAdultWoman);
};
