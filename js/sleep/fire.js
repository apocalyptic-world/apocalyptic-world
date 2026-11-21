/**
 * Fire in the Night (0.92): a fire starts in the storage shed at night (Event - Fire in the night, from Wood cabin).
 * Goods burn and one outbuilding burns out and has to be repaired at the workbench. Nobody dies.
 *
 *   $game.fireNight   true while the event waits for the morning
 *   $game.fireDay     day of the last fire (cooldown)
 *   $game.burned      { key, day } while a building is burned out; its $game.location[key] flag is off until repaired
 */
setup.fire = {
    CHANCE: 1,                 // % per night (+2 in a heat wave)
    MIN_DAY: 60,
    COOLDOWN_DAYS: 60,
    BUILDINGS: ['greenhouse', 'bathhouse'],   // outbuildings that can burn out; nothing guests sleep in, nothing that holds storage
    NAMES: { greenhouse: 'greenhouse', bathhouse: 'bathhouse' },
    REPAIR: {                  // workbench "Repair the ..." cost (cheaper than building new)
        greenhouse: { wood: 15 },
        bathhouse: { wood: 60, plastic: 5 }
    },
    GOODS: ['food', 'wood']    // what the shed held
};

/** Called once per night from the sleep widget. */
setup.fire.nightly = function (day, isHeatWave) {
    const v = variables();
    if (v.game.fireNight || !v.game.cabinName || day < setup.fire.MIN_DAY) return;
    if ((v.game.fireDay ?? -999) + setup.fire.COOLDOWN_DAYS > day) return;
    if (!setup.percentageChance(setup.fire.CHANCE + (isHeatWave ? 2 : 0))) return;
    v.game.fireNight = true;
};

/** Which building the fire reaches: an owned one from BUILDINGS, or null (then only the shed and its goods burn). */
setup.fire.pickBuilding = function () {
    if (variables().game.burned) return null;   // one burned building at a time: the first one has to be repaired first
    const loc = variables().game.location ?? {};
    const owned = setup.fire.BUILDINGS.filter(b => loc[b]);
    return owned.length ? setup.getRandomElement(owned) : null;
};

/** Burn `percent` of each kind of goods; returns [{item, lost}] for the ones that were there. */
setup.fire.burnGoods = function (percent) {
    const out = [];
    for (const item of setup.fire.GOODS) {
        const have = setup.cabinInventory.count(item);
        const lost = Math.round(have * percent / 100);
        if (lost > 0) { setup.cabinInventory.drop(item, lost); out.push({ item, lost }); }
    }
    return out;
};

/** Burn the building out: its flag goes off (production, tile and events treat it as gone) until it is repaired. */
setup.fire.burn = function (key) {
    const v = variables();
    delete v.game.fireNight;
    v.game.fireDay = v.game.day;
    if (!key) return;
    v.game.location[key] = false;
    v.game.burned = { key, day: v.game.day };
};

setup.fire.isBurned = function (key) {
    return variables().game.burned?.key === key;
};

/** Workbench repair finished: the building is back. */
setup.fire.repair = function () {
    const v = variables();
    const b = v.game.burned;
    if (!b) return;
    v.game.location[b.key] = true;
    delete v.game.burned;
};
