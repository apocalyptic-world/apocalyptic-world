setup.neganQuest2HaveGirls = function() 
{
    // ids of the companions Negan takes: blonde, beautiful women from your guests or slaves (never characters)
    return setup.companions.list().filter(function (npc) {
        return !npc.gender && npc.beauty >= 80 && npc.hair === 'blonde'
            && ['guest', 'slave'].includes(setup.companions.listOf(npc));
    }).map(npc => npc.id);
}

setup.baseIntruderChance = function ()
{
    const _woodWalls = (variables().player?.baseManagement?.buildings?.['wood_wall'] ?? 0);
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