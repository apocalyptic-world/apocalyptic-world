setup.family = {
    isBloodToMC: function (npc) {
        if (!npc.hasOwnProperty('family')) {
            return false;
        }

        if (!npc.family.hasOwnProperty('father')) {
            return false;
        }

        return npc.family.father === 'mc';
    }
};


setup.family = function(npc) {
    function getNPCList() {
        const npcs = (variables().slaves ?? []).concat((variables().guests ?? []), (variables().nursery ?? []), Object.values(variables().characters ?? {}));
        var list = new Map;
        for (var i=0;i < npcs.length;i++) {
            list.set(npcs[i].id, npcs[i]);
        }
        return list;
    };

    function createFamilyList(who, NPCList=getNPCList(), familyList=new Map(), depth=1) {
        if (!who) { return familyList; }
        if (!who.hasOwnProperty('family')) { return familyList; }
        if (who.family.hasOwnProperty('father')) {
            if ((!familyList.has(who.family.father) || familyList.get(who.family.father)[1] > depth) && NPCList.has(who.family.father) && !who.id != npc.id) {
                familyList.set(who.family.father, [NPCList.get(who.family.father), depth])
                createFamilyList(NPCList.get(who.family.father), NPCList, familyList, depth + 1);
            }
        }
        if (who.family.hasOwnProperty('mother')) {
            if ((!familyList.has(who.family.mother) || familyList.get(who.family.mother)[1] > depth) && NPCList.has(who.family.mother) && !who.id != npc.id) {
                familyList.set(who.family.mother, [NPCList.get(who.family.mother), depth]);
                createFamilyList(NPCList.get(who.family.mother), NPCList, familyList, depth + 1);
            }
        }

        if (who.family.hasOwnProperty('kids')) {
            who.family.kids.forEach(kid);
            function kid(item) {
                if ((!familyList.has(item) || familyList.get(item)[1] > depth) && NPCList.has(item) && !who.id != npc.id) {
                    familyList.set(item, [NPCList.get(item), depth]);
                    createFamilyList(NPCList.get(item), NPCList, familyList, depth + 1);
                }
            }
        }
        return familyList;
    };

    return createFamilyList(npc, getNPCList());
};

setup.getIncestDistance = function(who, other) {
    const list = setup.getFamily(who);
    return list.has(other.id) ? list.get(other.id)[1] : 0;
};

setup.isIncest = function(who, other, dist=-1) {
    const distD = setup.getIncestDistance(who, other);
    return ((dist == -1 && distD > 0)|| dist >= distD);
};