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
        if (Object.entries(criteria).every(([key, value]) => {
            if (typeof value === 'number') {
                return npc[key] >= value;
            }
            return npc[key] === value;
        })) {
            result[npc.gender] ??= [];
            result[npc.gender].push(index);
        }
        return result;
    }, {});
};