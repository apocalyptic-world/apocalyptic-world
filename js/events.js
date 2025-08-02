setup.neganQuest2HaveGirls = function() 
{
    var girlIds = [];
    for (var _companionId in (variables().player.companions ?? {})) {
        var _npc = setup.companionGet(_companionId);
        if (!_npc.gender && _npc.beauty >= 80 && _npc.hair === 'blonde') {
            girlIds.push(_companionId)
        }
    }

    return girlIds;
}

setup.baseIntruderChance = function ()
{
    const _woodWalls = (variables().player?.baseManagement?.buildings['wood_wall'] ?? 0);
    let _chance = 100;

    _chance -= _woodWalls;

    return setup.percentageChance(_chance)
}

setup.filterNPCs = function(list, criteria) {
    return list.reduce((result, npc, index) => {
        const passes = Object.entries(criteria).every(([key, value]) => {
            if (key.endsWith('_in')) {
                const actualKey = key.slice(0, -3);
                return Array.isArray(value) && value.includes(npc[actualKey]);
            } else if (key.endsWith('_not')) {
                const actualKey = key.slice(0, -4);
                return Array.isArray(value) && !value.includes(npc[actualKey]);
            } else if (key.endsWith('_gte')) {
                const actualKey = key.slice(0, -4);
                return npc[actualKey] >= value;
            } else if (key.endsWith('_inc')) {
                const actualKey = key.slice(0, -4);
                return Array.isArray(npc[actualKey]) &&
                       Array.isArray(value) &&
                       value.some(v => npc[actualKey].includes(v));
            } else if (key === 'inventory_has') {
                return setup.npcInventoryHas(npc, value);
            } else {
                return npc[key] === value;
            }
        });

        if (passes) {
            result[npc.gender] ??= [];
            result[npc.gender].push(index);
        }

        return result;
    }, {});
};