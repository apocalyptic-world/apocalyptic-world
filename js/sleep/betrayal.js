/**
 * Gone in the Night: a guest who is leaving (see the leave check in js/sleep/processNpc.js) sometimes
 * does more than just walk out. From day 250 on, 5% of the time she takes something with her, sells what she knows
 * about the base, or leaves a note. The next morning Wood cabin opens 'Event - Gone in the night'.
 *
 *   $game.betrayal = { npc (clone), kind: 'theft'|'intel'|'note', day, loot?, leak? }
 *
 * The loss is applied at once (so ignoring the event still costs something) and stored, so winning the
 * chase can hand it back.
 *
 * Also here: the loyalty trial - guests recruited from a settlement that has since turned hostile get
 * accused by the rest of the house (Event - Loyalty trial).
 */
setup.betrayal = setup.betrayal || {};

setup.betrayal.CHANCE = 5;
/** No theft, leaks or notes in the early game: the event only starts from this day, earlier leavers just walk out quietly. */
setup.betrayal.MIN_DAY = 250;

/** Something she could carry off: caps, food or antibiotics. Null when there is nothing worth taking. */
setup.betrayal.pickLoot = function () {
    const v = variables();
    const options = [];
    const caps = v.player.money ?? 0;
    if (caps >= 60) {
        options.push({ type: 'caps', amount: Math.min(300, Math.max(40, Math.floor(caps * 0.3))) });
    }
    const food = setup.cabinInventory.count('food');
    if (food >= 6) {
        options.push({ type: 'item', item: 'food', amount: Math.min(food, window.randomInteger(6, 15)) });
    }
    const antibiotics = setup.cabinInventory.count('antibiotics');
    if (antibiotics >= 1) {
        options.push({ type: 'item', item: 'antibiotics', amount: Math.min(antibiotics, window.randomInteger(1, 2)) });
    }
    if (!options.length) {
        return null;
    }
    return options[window.randomInteger(0, options.length - 1)];
};

setup.betrayal.lootText = function (loot) {
    if (!loot) {
        return 'nothing';
    }
    if (loot.type === 'caps') {
        return loot.amount + ' caps';
    }
    return loot.amount + (loot.item === 'food' ? ' food rations' : ' antibiotics');
};

/** Put the stolen goods back (she was caught). */
setup.betrayal.returnLoot = function (loot) {
    if (!loot) {
        return;
    }
    if (loot.type === 'caps') {
        variables().player.money += loot.amount;
    } else {
        setup.cabinInventory.pickup(loot.item, loot.amount);
    }
};

/**
 * A guest is leaving tonight. Returns the kind of departure ('theft' | 'intel' | 'note') when this one
 * turns into an event, or null for the usual quiet exit.
 */
setup.betrayal.depart = function (npc) {
    const v = variables();
    if (v.game.betrayal || !v.game.cabinName || v.game.day < setup.betrayal.MIN_DAY || !setup.percentageChance(setup.betrayal.CHANCE)) {
        return null;
    }

    const roll = window.randomInteger(1, 100);
    let kind = roll <= 45 ? 'theft' : (roll <= 70 ? 'intel' : 'note');
    const betrayal = { npc: clone(npc), day: v.game.day };

    if (kind === 'theft') {
        betrayal.loot = setup.betrayal.pickLoot();
        if (betrayal.loot) {
            if (betrayal.loot.type === 'caps') {
                v.player.money -= betrayal.loot.amount;
            } else {
                setup.cabinInventory.drop(betrayal.loot.item, betrayal.loot.amount);
            }
        } else {
            kind = 'note';
        }
    }
    if (kind === 'intel') {
        betrayal.leak = setup.settlements.leakIntel();
        if (!betrayal.leak) {
            kind = 'note';
        }
    }

    betrayal.kind = kind;
    v.game.betrayal = betrayal;
    return kind;
};

/** Morning-report line for the three kinds. */
setup.betrayal.message = function (npc, kind) {
    const she = setup.pronounceWhat(npc, true);
    if (kind === 'theft') {
        return npc.name + ' was missing in the morning, and so was some of your stuff.';
    }
    if (kind === 'intel') {
        return npc.name + ' was missing in the morning. ' + she + ' had been seen near the gate before dawn, and the gate had been left unlatched.';
    }
    return npc.name + ' left a note on the table and was gone before sunrise.';
};

// ── Loyalty trial ─────────────────────────────────────────────────────────────

setup.loyaltyTrial = setup.loyaltyTrial || {};

/** Adult women who came from a settlement that is hostile now and have not been put on trial yet. */
setup.loyaltyTrial.suspects = function () {
    return (variables().guests ?? []).filter(function (g) {
        if (g.gender !== 0 || setup.getAge(g) < 18 || typeof g.loyaltyTrialDay !== 'undefined' || typeof g.sick !== 'undefined') {
            return false;
        }
        const origin = (g.history ?? []).find(function (h) {
            return ['recruited', 'tribute_accepted'].includes(h.event) && h.place;
        });
        if (!origin) {
            return false;
        }
        const s = setup.settlements.getAll().find(function (x) { return x.name === origin.place; });
        return !!s && !s.destroyed && setup.settlements.isHostile(s);
    });
};

/** The settlement a suspect came from (null if it is gone). */
setup.loyaltyTrial.originOf = function (npc) {
    const origin = (npc.history ?? []).find(function (h) {
        return ['recruited', 'tribute_accepted'].includes(h.event) && h.place;
    });
    if (!origin) {
        return null;
    }
    return setup.settlements.getAll().find(function (x) { return x.name === origin.place; }) ?? null;
};

/** Nightly roll: the house starts whispering about someone's old loyalties. */
setup.loyaltyTrial.nightly = function (day) {
    const v = variables();
    if (v.game.loyaltyTrial || !v.game.cabinName || day <= 30 || (v.game.loyaltyTrialDay ?? 0) + 20 >= day) {
        return;
    }
    if ((v.guests ?? []).length < 5 || !setup.percentageChance(3)) {
        return;
    }
    const suspects = setup.loyaltyTrial.suspects();
    if (!suspects.length) {
        return;
    }
    const pick = suspects[window.randomInteger(0, suspects.length - 1)];
    v.game.loyaltyTrial = { guestId: pick.id, settlementId: setup.loyaltyTrial.originOf(pick)?.id };
    setup.sleepMessages.addMain('<span class="warning">Voices carried across the yard at dawn. A crowd had gathered outside the house, and they were shouting about ' + pick.name + '.</span>');
};
