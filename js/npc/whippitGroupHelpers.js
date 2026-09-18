// Relative weight of an NPC lingering after a group whippit session: liked doubles the base
// weight, higher intoxication scales it up further (drunk 100 doubles it again), and not being
// into guys halves it (the MC is the one who'd be lingering with them).
setup.getWhippitParticipantWeight = function (npc) {
    var base = (npc.likes ?? []).includes('whippit') ? 2 : 1;
    var weight = base * (1 + (npc.drunk ?? 0) / 100);
    if (!(npc.likesGuys ?? true)) weight *= 0.5;
    return weight;
};

// Picks `count` distinct entries from `items` via weighted random sampling without replacement.
// weightFn(item) returns a positive number. Returns fewer than `count` if items runs out.
setup.weightedSampleWithoutReplacement = function (items, weightFn, count) {
    var pool = items.slice();
    var picked = [];
    while (pool.length && picked.length < count) {
        var total = 0;
        for (var i = 0; i < pool.length; i++) total += weightFn(pool[i]);
        var roll = Math.random() * total;
        var idx = 0;
        for (; idx < pool.length; idx++) {
            roll -= weightFn(pool[idx]);
            if (roll <= 0) break;
        }
        if (idx >= pool.length) idx = pool.length - 1;
        picked.push(pool[idx]);
        pool.splice(idx, 1);
    }
    return picked;
};
