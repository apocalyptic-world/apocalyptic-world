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