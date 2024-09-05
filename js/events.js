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
    const _chance = 100 - _woodWalls;

    return setup.percentageChance(_chance)
}