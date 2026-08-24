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