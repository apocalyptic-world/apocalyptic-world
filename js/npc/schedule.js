// Set true to make MC wives sort as a bloc at the very top of the guest list
// when "sort spouses together" is active.  Currently off: with large harems the
// top becomes a featureless block.  Flip to true (or tie to a player setting)
// when per-group opt-in is added.
setup.guestSortMcWivesToTop = false;

setup.bathSchedule = {
    garden:     { from: '16:00', to: '20:00', p: 10 },
    forest:     { from: '18:00', to: '20:00', p: 20 },
    kitchen:    { from: '12:00', to: '20:00', p: 10 },
    scavenging: { from: '20:00', to: '23:00', p: 30 },
    mistress:   { from: '22:00', to: '24:00', p: 70 },
    attendant:  { from: '20:00', to: '22:00', p: 70 },
    streets:    { from: '08:00', to: '12:00', p: 20 },
    nightclub:  { from: '14:00', to: '18:00', p: 60 },
    school:     { from: '15:00', to: '22:00', p: 60 }
};

// Canonical work hours for every outside job.
// blockedBy: conditions that prevent the NPC from working despite being in-hours.
//   'sick'      = npc.sick is defined
//   'dayOff'    = npc.sick OR npc.rest is defined
//   'heatWave'  = weather.heatWave
//   'sandStorm' = weather.sandStorm
//   'coldSnap'  = weather.coldSnap && no coat_wolf
setup.outsideWorkHours = {
    garden:    { from: '08:00', to: '16:00', blockedBy: ['sick', 'heatWave'] },
    forest:    { from: '08:00', to: '18:00', blockedBy: ['sick', 'sandStorm', 'coldSnap'] },
    milk_barn: { from: '12:00', to: '18:00', blockedBy: ['dayOff'] },
    strip_club:{ from: '18:00', to: '04:00', blockedBy: ['dayOff', 'sandStorm', 'coldSnap'] },
    nightclub: { from: '20:00', to: '04:00', blockedBy: ['dayOff', 'sandStorm', 'coldSnap'] },
    streets:   { from: '14:00', to: '06:00', blockedBy: ['dayOff', 'sandStorm', 'coldSnap'] },
    kitchen:   { from: '08:00', to: '22:00', blockedBy: ['sick'] },
    mistress:  { from: '12:00', to: '22:00', blockedBy: ['sick'] },
    scavenging:{ from: '12:00', to: '20:00', blockedBy: ['sick', 'sandStorm'] },
    hospital:  { from: '08:00', to: '22:00', blockedBy: [] },
    church:    { from: '08:00', to: '18:00', blockedBy: ['sick'] },
    quarry:    { from: '08:00', to: '18:00', blockedBy: ['dayOff', 'sick', 'sandStorm'] },
    maid:      { from: '10:00', to: '15:00', blockedBy: [] },
    garage:    { from: '10:00', to: '18:00', blockedBy: [] },
    school:    { from: '09:00', to: '15:00', blockedBy: [] },
    attendant: { from: '10:00', to: '20:00', blockedBy: ['sick'] },
};

// Returns true if npc is physically at their job location right now.
// Pass $weather from the passage so weather conditions are evaluated correctly.
setup.isAtWork = function (npc, weather) {
    const schedule = setup.outsideWorkHours[npc.assignedTo];
    if (!schedule) return false;
    if (!timeBetween(schedule.from, schedule.to)) return false;

    const isSick   = typeof npc.sick  !== 'undefined';
    const isDayOff = isSick || typeof npc.rest !== 'undefined';
    const blocked  = schedule.blockedBy;

    if (blocked.includes('sick')   && isSick)   return false;
    if (blocked.includes('dayOff') && isDayOff) return false;

    if (weather) {
        if (blocked.includes('heatWave')  && (weather.heatWave  ?? false)) return false;
        if (blocked.includes('sandStorm') && (weather.sandStorm ?? false)) return false;
        if (blocked.includes('coldSnap')  && (weather.coldSnap  ?? false) && !setup.npcInventoryHas(npc, 'coat_wolf')) return false;
    }

    return true;
};

// Returns the % chance (0-100) that a married NPC will intercede when their spouse is
// asked to have sex with someone else. Pass $weather from the calling passage.
setup.intercessionChance = function (npc, weather) {
    if (!npc) return 0;

    var job = npc.assignedTo;

    // Enslaved in guesthouse as companion-slave — cannot intercede
    if (job === 'companion_slave') return 0;

    // Always present in guesthouse
    var alwaysHome = !job || job === 'none' || job === 'guard'
                  || job === 'companion' || job === 'hunter';
    if (alwaysHome) {
        return typeof npc.sick !== 'undefined' ? 33 : 100;
    }

    // Sick/injured overrides job location for all remaining categories
    if (typeof npc.sick !== 'undefined') return 33;

    // In-and-out jobs with no fixed schedule
    if (job === 'milkwarden' || job === 'shop') return 75;

    // Jobs outside the settlement
    var outsideJobs = ['forest', 'scavenging', 'streets', 'nightclub', 'strip_club', 'quarry'];

    var schedule = setup.outsideWorkHours[job];
    if (schedule) {
        // Off-shift → back in guesthouse
        if (!setup.isAtWork(npc, weather)) return 100;
        return outsideJobs.indexOf(job) !== -1 ? 25 : 50;
    }

    // Unknown job — treat as inside settlement
    return 50;
};

// Returns an array of real indices into arr, sorted by sortBy.
// 'N' = name, 'P' = pregnancy desc, 'A' = assignment (needs companions + prefix like 'guest:' or 'slave:')
// Any unrecognised sortBy returns indices in original order.
setup.npcSortedIndices = function (arr, sortBy, companions, prefix) {
    var indices = arr.map(function (_, i) { return i; });
    if (sortBy === 'N') {
        indices.sort(function (a, b) {
            return arr[a].name < arr[b].name ? -1 : arr[a].name > arr[b].name ? 1 : 0;
        });
    } else if (sortBy === 'A') {
        indices.sort(function (a, b) {
            var ta = 'assignedTo' in arr[a] ? arr[a].assignedTo
                   : (companions && typeof companions[prefix + a] !== 'undefined') ? 'companion' : 'zzz';
            var tb = 'assignedTo' in arr[b] ? arr[b].assignedTo
                   : (companions && typeof companions[prefix + b] !== 'undefined') ? 'companion' : 'zzz';
            return ta < tb ? -1 : ta > tb ? 1 : 0;
        });
    } else if (sortBy === 'P') {
        indices.sort(function (a, b) {
            return (arr[b].pregnancy || 0) - (arr[a].pregnancy || 0);
        });
    }
    return indices;
};

/**
 * Like npcSortedIndices but optionally groups spouses and/or offspring together.
 *
 * Spouse grouping:
 *   - MC wives sort to the very top as a group.
 *   - Other wives sort immediately after their husband.
 *   - Wives whose husband is absent sort by the main method.
 *
 * Offspring grouping (only for entries not already spouse-grouped):
 *   - Offspring sort immediately after their mother (or father when mother is
 *     absent/MC). Multi-generational chains are handled: grandchildren follow
 *     their parent who follows their grandparent, arbitrarily deep.
 *   - Offspring with both parents absent, or MC-only parentage with no NPC
 *     parent present, sort by the main method.
 *   - If sortSpouses is also on and an offspring is married, spouse grouping
 *     takes priority.
 *
 * Sort keys are built hierarchically by walking each entry's groupHeadId chain
 * to its root ancestor, so every generation sorts directly after its parent.
 */
setup.npcGroupedIndices = function(arr, sortBy, companions, prefix, sortSpouses, sortOffspring) {
    var base = setup.npcSortedIndices(arr, sortBy, companions, prefix);
    if (!sortSpouses && !sortOffspring) return base;

    var entries = base.map(function(idx, rank) {
        return { idx: idx, id: arr[idx].id, npc: arr[idx], rank: rank, groupHeadId: null };
    });

    // id → entry for chain walking
    var byId = {};
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id) byId[entries[i].id] = entries[i];
    }

    if (sortSpouses) {
        for (var si = 0; si < entries.length; si++) {
            var fam = entries[si].npc.family || {};
            if (setup.guestSortMcWivesToTop && fam.husband === 'mc') {
                entries[si].groupHeadId = '__mc_wives__';
            } else if (fam.husband && fam.husband !== 'mc' && byId.hasOwnProperty(fam.husband)) {
                entries[si].groupHeadId = fam.husband;
            }
        }
    }

    if (sortOffspring) {
        for (var oi = 0; oi < entries.length; oi++) {
            if (entries[oi].groupHeadId !== null) continue; // spouse grouping wins
            var ofam = entries[oi].npc.family || {};
            var motherId = (ofam.mother && ofam.mother !== 'mc') ? ofam.mother : null;
            var fatherId = (ofam.father && ofam.father !== 'mc') ? ofam.father : null;
            if (motherId && byId.hasOwnProperty(motherId)) {
                entries[oi].groupHeadId = motherId;
            } else if (!motherId && fatherId && byId.hasOwnProperty(fatherId)) {
                entries[oi].groupHeadId = fatherId;
            }
        }
    }

    // Build a hierarchical sort key by walking the groupHeadId chain to the root.
    // Example: great-grand → grand → daughter → mother (root, rank R)
    //   mother key:       [R]
    //   daughter key:     [R, R_d]
    //   grand key:        [R, R_d, R_g]
    //   great-grand key:  [R, R_d, R_g, R_gg]
    // Lexicographic comparison places parents before children and keeps all
    // descendants adjacent, regardless of how deep the chain goes.
    // MC-wife sentinel gets a leading -1 so they all sort above everyone else.
    var keyCache = {};
    function sortKey(entry, depth) {
        if (keyCache.hasOwnProperty(entry.rank)) return keyCache[entry.rank];
        var key;
        if (entry.groupHeadId === null) {
            key = [entry.rank];
        } else if (entry.groupHeadId === '__mc_wives__') {
            key = [-1, entry.rank];
        } else {
            var head = byId[entry.groupHeadId];
            if (!head || depth > arr.length) {
                key = [entry.rank]; // missing head or cycle guard
            } else {
                key = sortKey(head, depth + 1).concat([entry.rank]);
            }
        }
        keyCache[entry.rank] = key;
        return key;
    }

    entries.sort(function(a, b) {
        var ka = sortKey(a, 0), kb = sortKey(b, 0);
        var len = Math.min(ka.length, kb.length);
        for (var i = 0; i < len; i++) {
            if (ka[i] !== kb[i]) return ka[i] - kb[i];
        }
        return ka.length - kb.length; // shorter key = ancestor, sorts first
    });

    return entries.map(function(e) { return e.idx; });
};

/**
 * Returns a map from arr-index (number) to root-group-id (string) for every
 * NPC that belongs to a spouse or offspring group — including the group head
 * itself.  Unaffiliated NPCs are absent.  Used to drive per-group highlight
 * colours in the guest list.
 *
 * Uses the same groupHeadId assignment logic as npcGroupedIndices so the two
 * functions always agree on who is in which group.
 */
setup.npcGroupMap = function(arr, sortSpouses, sortOffspring) {
    if (!sortSpouses && !sortOffspring) return {};

    var byId = {};
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].id) byId[arr[i].id] = i;
    }

    var parentId = [];
    for (var i = 0; i < arr.length; i++) parentId.push(null);

    if (sortSpouses) {
        for (var si = 0; si < arr.length; si++) {
            var sfam = arr[si].family || {};
            if (setup.guestSortMcWivesToTop && sfam.husband === 'mc') {
                parentId[si] = '__mc_wives__';
            } else if (sfam.husband && sfam.husband !== 'mc' && byId.hasOwnProperty(sfam.husband)) {
                parentId[si] = sfam.husband;
            }
        }
    }

    if (sortOffspring) {
        for (var oi = 0; oi < arr.length; oi++) {
            if (parentId[oi] !== null) continue;
            var ofam = arr[oi].family || {};
            var mid = (ofam.mother && ofam.mother !== 'mc') ? ofam.mother : null;
            var fid = (ofam.father && ofam.father !== 'mc') ? ofam.father : null;
            if (mid && byId.hasOwnProperty(mid)) {
                parentId[oi] = mid;
            } else if (!mid && fid && byId.hasOwnProperty(fid)) {
                parentId[oi] = fid;
            }
        }
    }

    function rootOf(i, depth) {
        if (depth > arr.length) return null;
        var pid = parentId[i];
        if (!pid) return null;
        if (pid === '__mc_wives__') return '__mc_wives__';
        var pidx = byId[pid];
        if (pidx === undefined) return null;
        var up = rootOf(pidx, depth + 1);
        return up !== null ? up : pid;
    }

    // Collect children, note which root ids actually have children
    var childRoot = {};
    var rootHasChild = {};
    for (var i = 0; i < arr.length; i++) {
        var r = rootOf(i, 0);
        if (r !== null) {
            childRoot[i] = r;
            rootHasChild[r] = true;
        }
    }

    // Build result: children + their root NPC
    var result = {};
    for (var ci in childRoot) result[ci] = childRoot[ci];
    for (var rootId in rootHasChild) {
        if (rootId !== '__mc_wives__' && byId.hasOwnProperty(rootId)) {
            result[byId[rootId]] = rootId;
        }
    }
    return result;
};