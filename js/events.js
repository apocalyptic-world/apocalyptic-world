setup.neganQuest2HaveGirls = function() 
{
    var girlIds = [];
    for (var _companionId in (variables().player.companions ?? {})) {
        var _guestId = _companionId.split(':')[1];
        var _npc = variables().guests[_guestId];
        if (!_npc.gender && _npc.beauty >= 80 && _npc.hair === 'blonde') {
            girlIds.push(_guestId)
        }
    }

    return girlIds;
}