/**
 * Broken Guest (0.92): a woman who has been miserable for too many nights in a row snaps one night
 * (Event - Broken guest, dispatched from Wood cabin). Nobody dies; it costs food and nerves.
 *
 *   guest.lowMoodNights   nights in a row below LOW_MOOD happiness (counted here, after the night's mood changes)
 *   $game.brokenGuest     { guestId } while the event is waiting for the morning
 *   $game.brokenGuestDay  day of the last one (cooldown)
 */
setup.brokenGuest = {
    LOW_MOOD: -40,       // "very unhappy": the leave line is -70 (setup.sleep.guestWouldLeave)
    MIN_NIGHTS: 5,
    CHANCE: 25,          // per night once somebody qualifies
    COOLDOWN_DAYS: 20,
    MIN_DAY: 30
};

/** Women in the house who qualify tonight, most miserable first. */
setup.brokenGuest.candidates = function () {
    return (variables().guests ?? [])
        .filter(g => setup.getAge(g) >= 18 && setup.pronounceWhat(g) === 'she' && typeof g.sick === 'undefined'
            && (g.lowMoodNights ?? 0) >= setup.brokenGuest.MIN_NIGHTS)
        .sort((a, b) => (a.happy ?? 0) - (b.happy ?? 0));
};

/** Called once per night from the sleep widget, after the guests were processed and the leavers removed. */
setup.brokenGuest.nightly = function (day) {
    const v = variables();
    for (const g of v.guests ?? []) {
        if ((g.happy ?? 0) < setup.brokenGuest.LOW_MOOD) g.lowMoodNights = (g.lowMoodNights ?? 0) + 1;
        else delete g.lowMoodNights;
    }
    if (v.game.brokenGuest || !v.game.cabinName || day < setup.brokenGuest.MIN_DAY) return;
    if ((v.game.brokenGuestDay ?? -999) + setup.brokenGuest.COOLDOWN_DAYS > day) return;
    const pool = setup.brokenGuest.candidates();
    if (!pool.length || !setup.percentageChance(setup.brokenGuest.CHANCE)) return;
    v.game.brokenGuest = { guestId: pool[0].id };
};

/** The guest the event is about, or null when she is gone by the morning. */
setup.brokenGuest.npc = function () {
    const e = variables().game.brokenGuest;
    return e ? (variables().guests ?? []).find(g => g.id === e.guestId) ?? null : null;
};

/** What she wrecked: up to 5 food from storage or the backpack (no shop storage = backpack). */
setup.brokenGuest.ruinFood = function () {
    const lost = Math.min(5, setup.cabinInventory.count('food'));
    if (lost > 0) setup.cabinInventory.drop('food', lost);
    return lost;
};

/** Close the event: cooldown starts, her counter starts over. */
setup.brokenGuest.finish = function (npc) {
    const v = variables();
    delete v.game.brokenGuest;
    v.game.brokenGuestDay = v.game.day;
    if (npc) delete npc.lowMoodNights;
};
