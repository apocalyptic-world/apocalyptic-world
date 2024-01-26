setup.neganQuest2HaveGirls = function() 
{
    var girlIds = [];
    for (var _companionId in (variables().player.companions ?? {})) {
        var _npcType = _companionId.split(':')[0];
        var _npcId = _companionId.split(':')[1];
        if (_npcType === 'guest') {
            var _npc = variables().guests[_npcId];
        } else {
            var _npc = variables().slaves[_npcId]
        }
        if (!_npc.gender && _npc.beauty >= 80 && _npc.hair === 'blonde') {
            girlIds.push(_npcId)
        }
    }

    return girlIds;
}