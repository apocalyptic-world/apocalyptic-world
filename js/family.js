/**
 * Help functions for family checks
 */
setup.family = {
    /**
     * Is the npc a blood relative to the mc? That is child of, grandchild of, ...
     */
    isBloodToMC: function (npc) {
        if (!npc.hasOwnProperty('family')) {
            return false;
        }

        // child of mc?
        if (npc.family.hasOwnProperty('father') && npc.family.father === 'mc') {
            return true;
        }
        // grandchild of mc? mc son's daughter or daughter's daughter
        return (npc.family?.hasOwnProperty('mother') && setup.getNpcById(npc.family.mother) && setup.family.isBloodToMC(setup.getNpcById(npc.family.mother))) || (npc.family?.hasOwnProperty('father') && setup.getNpcById(npc.family.father) && setup.family.isBloodToMC(setup.getNpcById(npc.family.father))) ;
    },

    isBlood: function (npc, npc2) {
        return this.isBloodToMC(npc) && this.isBloodToMC(npc2);
    },

    getFamily: function(npc) {
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
    },

    getIncestDistance: function(who, other) {
        const list = setup.family.getFamily(who);
        return list.has(other.id) ? list.get(other.id)[1] : 0;
    },

    isIncest: function(who, other, dist=-1) {
        const distD = setup.family.getIncestDistance(who, other);
        return ((dist == -1 && distD > 0)|| dist >= distD);
    },

    // Returns a label for the relationship of npc2 from npc1's perspective (e.g. "daughter", "sister").
    // npc2 is assumed to be female. Falls back to "family member" for distant/unresolved relations.
    getRelationshipLabel: function(npc1, npc2) {
        const f1 = npc1.family ?? {};
        const f2 = npc2.family ?? {};

        // Direct descendant: daughter
        if ((f1.kids ?? []).includes(npc2.id)) return 'daughter';

        // Direct ancestor: mother
        if (f1.mother && f1.mother === npc2.id) return 'mother';

        // Sibling: shared father or shared mother
        if ((f1.father && f2.father && f1.father === f2.father) ||
            (f1.mother && f2.mother && f1.mother === f2.mother)) return 'sister';

        // Granddaughter: npc2 is a child of one of npc1's children
        for (const kidId of (f1.kids ?? [])) {
            const kid = setup.getNpcById(kidId);
            if (kid && (kid.family?.kids ?? []).includes(npc2.id)) return 'granddaughter';
        }

        // Grandmother: npc1's parent's mother is npc2
        const mom = f1.mother ? setup.getNpcById(f1.mother) : null;
        const dad = f1.father ? setup.getNpcById(f1.father) : null;
        if (mom?.family?.mother === npc2.id) return 'grandmother';
        if (dad?.family?.mother === npc2.id) return 'grandmother';

        // Aunt: npc2 shares a parent with npc1's parent (is a sibling of npc1's parent)
        const isSiblingOf = (parent, candidate) => {
            const pf = parent?.family ?? {};
            const cf = candidate.family ?? {};
            return (pf.father && cf.father && pf.father === cf.father) ||
                   (pf.mother && cf.mother && pf.mother === cf.mother);
        };
        if ((mom && isSiblingOf(mom, npc2)) || (dad && isSiblingOf(dad, npc2))) return 'aunt';

        // Niece: npc2's parent is a sibling of npc1
        const isNpc1Sibling = (otherId) => {
            const other = setup.getNpcById(otherId);
            if (!other?.family) return false;
            const of_ = other.family;
            return (f1.father && of_.father && f1.father === of_.father) ||
                   (f1.mother && of_.mother && f1.mother === of_.mother);
        };
        if (f2.father && isNpc1Sibling(f2.father)) return 'niece';
        if (f2.mother && isNpc1Sibling(f2.mother)) return 'niece';

        return 'family member';
    },
};


