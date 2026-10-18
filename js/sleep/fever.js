/**
 * Fever in the house: a guesthouse/basement outbreak that hits a chunk of the settlement at once.
 * Nobody dies from it - the fever just keeps people in bed for a long time (see setup.fever.*_DAYS),
 * so the player's choices are about who gets antibiotics, whether to isolate the sick and what the
 * whole thing costs in happiness.
 *
 *   $game.outbreak       = { day, nights, quarantine, ids[] }   while it is going on
 *   $game.feverEvent     = true                                  makes Wood cabin open 'Event - Fever in the house'
 *   $game.outbreakEndDay = day                                   cooldown for the next outbreak
 *
 * Sick state is the normal npc.sick = { days, desc, id: 'fever', severe } so work, schedule, hospital and
 * the nightly sick tick (js/sleep/processNpc.js) already handle it.
 */
setup.fever = setup.fever || {};

setup.fever.MILD_DAYS        = [12, 18];
setup.fever.SEVERE_DAYS      = [28, 40];
setup.fever.TREATED_DAYS     = [4, 6];
setup.fever.MAX_SPREAD_NIGHTS = 6;
setup.fever.MIN_POOL         = 4;
setup.fever.COOLDOWN_DAYS    = 30;

/** Everyone who can catch it: guests and basement NPCs old enough to be up and about. */
setup.fever.pool = function () {
    const v = variables();
    return (v.guests ?? []).concat(v.slaves ?? []).filter(function (n) {
        return setup.getAge(n) >= 5;
    });
};

setup.fever.isPatient = function (npc) {
    return npc.sick?.id === 'fever';
};

/** Current patients, severe cases first. */
setup.fever.patients = function () {
    return setup.fever.pool().filter(setup.fever.isPatient).sort(function (a, b) {
        return (b.sick.severe ? 1 : 0) - (a.sick.severe ? 1 : 0);
    });
};

setup.fever.infect = function (npc, severe) {
    const range = severe ? setup.fever.SEVERE_DAYS : setup.fever.MILD_DAYS;
    npc.sick = {
        days: window.randomInteger(range[0], range[1]),
        desc: severe ? 'burning up with a severe fever' : 'fever',
        id: 'fever',
        severe: !!severe
    };
};

/** Antibiotics: the fever breaks in a few days instead of weeks. */
setup.fever.treat = function (npc) {
    npc.sick = {
        days: window.randomInteger(setup.fever.TREATED_DAYS[0], setup.fever.TREATED_DAYS[1]),
        desc: 'fever, recovering after treatment',
        id: 'fever',
        severe: false,
        treated: true
    };
};

setup.fever.chance = function (opts) {
    let chance = 2;
    if (opts.isColdSnap) chance += 2;
    if (opts.isOvercrowded) chance += 1;
    if (opts.hasWorkingHospital) chance -= 1;
    return Math.max(1, chance);
};

/** Pick 30-50% of the pool, about a third of them severe (resilient people only ever get the mild kind). */
setup.fever.start = function (pool, day) {
    const healthy = pool.filter(function (n) { return typeof n.sick === 'undefined'; });
    if (healthy.length < 2) return null;

    const shuffled = healthy.slice().sort(function () { return Math.random() - 0.5; });
    const count = Math.max(2, Math.round(shuffled.length * window.randomInteger(30, 50) / 100));
    const victims = shuffled.slice(0, count);

    let anySevere = false;
    for (const npc of victims) {
        const severe = !setup.personality.has(npc, 'resilient') && setup.percentageChance(30);
        setup.fever.infect(npc, severe);
        anySevere = anySevere || severe;
    }
    if (!anySevere) {
        const unlucky = victims.find(function (n) { return !setup.personality.has(n, 'resilient'); });
        if (unlucky) setup.fever.infect(unlucky, true);
    }

    const v = variables();
    v.game.outbreak = { day: day, nights: 0, quarantine: false, ids: victims.map(function (n) { return n.id; }) };
    v.game.feverEvent = true;
    return victims;
};

/**
 * Called once per night, after every guest/basement NPC has been processed (so a fresh infection
 * does not already tick down tonight).
 * opts: { day, isColdSnap, isOvercrowded, hasWorkingHospital }
 */
setup.fever.nightly = function (opts) {
    const v = variables();
    const pool = setup.fever.pool();

    // ── An outbreak is going on ───────────────────────────────────────────────
    if (v.game.outbreak) {
        const patients = setup.fever.patients();
        if (!patients.length) {
            v.game.outbreakEndDay = opts.day;
            delete v.game.outbreak;
            setup.sleepMessages.addMain('The fever has finally run its course. Nobody in the house is burning up anymore.');
            return;
        }

        const outbreak = v.game.outbreak;
        if (!outbreak.quarantine && outbreak.nights < setup.fever.MAX_SPREAD_NIGHTS) {
            outbreak.nights++;
            const caught = [];
            for (const npc of pool) {
                if (typeof npc.sick !== 'undefined') continue;
                const resilient = setup.personality.has(npc, 'resilient');
                if (!setup.percentageChance(resilient ? 3 : 7)) continue;
                setup.fever.infect(npc, !resilient && setup.percentageChance(20));
                caught.push(npc.name);
            }
            if (caught.length) {
                setup.sleepMessages.addMain('<span class="warning">The fever spread in the night. ' + caught.join(', ') + (caught.length === 1 ? ' is' : ' are') + ' burning up now too.</span>');
            }
        }
        return;
    }

    // ── Roll for a new one ────────────────────────────────────────────────────
    if (!v.game.cabinName || opts.day <= 40 || pool.length < setup.fever.MIN_POOL) return;
    if ((v.game.outbreakEndDay ?? 0) + setup.fever.COOLDOWN_DAYS >= opts.day) return;
    if (!setup.percentageChance(setup.fever.chance(opts))) return;

    const victims = setup.fever.start(pool, opts.day);
    if (victims) {
        setup.sleepMessages.addMain('<span class="warning">A fever tore through the house in the night. ' + victims.length + ' people woke up burning up.</span>');
    }
};
