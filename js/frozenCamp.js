/**
 * Frozen Camp (0.92): on a night trip in a cold snap (or a storm night), a camp with a dead fire and one adult woman
 * still alive (Night event - frozen camp). Rolled first in both night roll tables (on foot and by car).
 *   $player.quests.frozenCampDay   day of the last one (cooldown)
 */
setup.frozenCamp = {
    COLD_CHANCE: 25,     // % per night trip during a cold snap
    STORM_CHANCE: 6,     // % per night trip in a storm
    COOLDOWN_DAYS: 30,
    CARRY_FOOT: 65,      // % she survives being carried home on foot
    CARRY_CAR: 95        // ... or driven home
};

setup.frozenCamp.roll = function () {
    const v = variables();
    if ((v.player.quests?.frozenCampDay ?? -999) + setup.frozenCamp.COOLDOWN_DAYS > v.game.day) return false;
    const cold = setup.weather.isColdSnap();
    if (!cold && v.weather?.weather !== 'storm') return false;
    return setup.percentageChance(cold ? setup.frozenCamp.COLD_CHANCE : setup.frozenCamp.STORM_CHANCE);
};
