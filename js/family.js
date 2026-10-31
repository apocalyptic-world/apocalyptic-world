/**
 * Help functions for family checks
 */
setup.family = {
    /**
     * Is the npc a blood relative to the mc? That is child of, grandchild of, ...
     */
    isBloodToMC: function (npc) {
        const player = variables().player;
        if (npc.id) {
            if (player.family?.mother === npc.id || player.family?.father === npc.id) return true;
            if ((player.family?.siblings ?? []).includes(npc.id)) return true;
        }
        if (!npc.hasOwnProperty('family')) {
            return false;
        }
        // child of mc?
        if (npc.family.hasOwnProperty('father') && npc.family.father === 'mc') {
            return true;
        }
        // grandchild of mc? mc son's daughter or daughter's daughter
        return (npc.family?.hasOwnProperty('mother') && setup.getNpcById(npc.family.mother) && setup.family.isBloodToMC(setup.getNpcById(npc.family.mother))) || (npc.family?.hasOwnProperty('father') && setup.getNpcById(npc.family.father) && setup.family.isBloodToMC(setup.getNpcById(npc.family.father)));
    },

    // For two family records already known to be siblings: 'half' when exactly one parent is shared
    // and the other is known on both sides and differs, otherwise 'full' (a cheat-linked "lost"
    // sibling with no parent records counts as full).
    siblingKind: function(fa, fb) {
        fa = fa ?? {};
        fb = fb ?? {};
        const sharesMother = !!fa.mother && fa.mother === fb.mother;
        const sharesFather = !!fa.father && fa.father === fb.father;
        if (sharesMother !== sharesFather) {
            const other = sharesMother ? 'father' : 'mother';
            if (fa[other] && fb[other] && fa[other] !== fb[other]) return 'half';
        }
        return 'full';
    },

    // 'full' | 'half' | null for person's sibling relation to the MC.
    mcSiblingType: function(person) {
        const pf = variables().player.family ?? {};
        const f = person?.family ?? {};
        if (!person?.id) return null;
        const sharesParent = (!!pf.mother && f.mother === pf.mother) || (!!pf.father && f.father === pf.father);
        if (!sharesParent && !(pf.siblings ?? []).includes(person.id)) return null;
        return this.siblingKind(pf, f);
    },

    // Every relation npc has to the MC, closest first, joined with '/' (e.g. "son/grandson",
    // "half-sister/niece") so tangled family lines show all of their ties.
    getRelationToMC: function(npc) {
        const pf = variables().player.family ?? {};
        const f = npc.family ?? {};
        const pick = (fem, male) => (npc.gender === 0 || npc.gender === 2) ? fem : male;
        const rels = [];

        if (npc.id && pf.mother === npc.id) rels.push('mother');
        if (npc.id && pf.father === npc.id) rels.push('father');

        // Generations below the MC along every parent line, so one child can be both son and grandson.
        const gens = new Set();
        const walk = (person, depth, path) => {
            const pfam = person.family ?? {};
            if (pfam.father === 'mc' || pfam.mother === 'mc') gens.add(depth);
            if (depth >= 4) return;
            for (const pid of [pfam.mother, pfam.father]) {
                if (!pid || pid === 'mc' || path.includes(pid)) continue;
                const parent = setup.getNpcById(pid);
                if (parent) walk(parent, depth + 1, path.concat(pid));
            }
        };
        walk(npc, 1, [npc.id]);
        for (const g of [...gens].sort()) {
            rels.push(g === 1 ? pick('daughter', 'son') : 'great-'.repeat(g - 2) + pick('granddaughter', 'grandson'));
        }

        const siblingType = this.mcSiblingType(npc);
        if (siblingType) rels.push((siblingType === 'half' ? 'half-' : '') + pick('sister', 'brother'));

        const parents = [f.mother, f.father].filter(id => id && id !== 'mc').map(id => setup.getNpcById(id)).filter(Boolean);
        if (parents.some(p => this.mcSiblingType(p))) rels.push(pick('niece', 'nephew'));

        if (!rels.length && parents.some(p => this.isBloodToMC(p))) rels.push('relative');
        return rels.length ? rels.join('/') : null;
    },

    // Step ties to the MC through marriage, only for NPCs with no blood tie. Returns { npc, mc } role
    // words (e.g. { npc: 'stepdaughter', mc: 'stepfather' }) or null. Kept apart from getRelationToMC
    // so step-family isn't treated as incest by the noIncest policy or shown as a blood "Relative".
    getStepRelationToMC: function(npc) {
        if (!npc?.id || this.getRelationToMC(npc)) return null;
        const pf = variables().player.family ?? {};
        const f = npc.family ?? {};
        const pick = (fem, male) => (npc.gender === 0 || npc.gender === 2) ? fem : male;
        const spousesOf = id => {
            const person = id ? setup.getNpcById(id) : null;
            return person ? [person.family?.husband, ...(person.family?.wives ?? [])].filter(Boolean) : [];
        };
        const npcParents = [f.mother, f.father].filter(Boolean);

        // Stepchild: one of npc's parents is married to the MC.
        if (npcParents.some(id => spousesOf(id).includes('mc') || (pf.wives ?? []).includes(id))) {
            return { npc: pick('stepdaughter', 'stepson'), mc: 'stepfather' };
        }
        // Step-parent: npc is married to one of the MC's parents.
        const parentSpouses = [pf.mother, pf.father].flatMap(spousesOf);
        if (parentSpouses.includes(npc.id)) return { npc: pick('stepmother', 'stepfather'), mc: 'stepson' };
        // Step-sibling: npc is a child of one of the MC's step-parents.
        if (npcParents.some(id => parentSpouses.includes(id))) return { npc: pick('stepsister', 'stepbrother'), mc: 'stepbrother' };
        return null;
    },

    // The MC's role from npc's side, mirroring getRelationToMC part by part (e.g. "half-brother/uncle").
    getMcRoleToNpc: function(npc) {
        const rel = this.getRelationToMC(npc);
        if (!rel) return null;
        const flip = {
            mother: 'son', father: 'son', daughter: 'father', son: 'father',
            sister: 'brother', brother: 'brother', 'half-sister': 'half-brother', 'half-brother': 'half-brother',
            niece: 'uncle', nephew: 'uncle', relative: 'relative'
        };
        return rel.split('/').map(r => {
            if (flip[r]) return flip[r];
            const m = r.match(/^((?:great-)*)grand(?:daughter|son)$/);
            return m ? m[1] + 'grandfather' : r;
        }).join('/');
    },

    isBlood: function (npc, npc2) {
        return this.isBloodToMC(npc) && this.isBloodToMC(npc2);
    },

    // Builds a map of npc's blood relatives (id -> [npcObject, depth]).
    // Walks true blood lines: ancestors, descendants, descendants of ancestors
    // (siblings/cousins/aunts/nieces, etc), and direct sibling links (family.siblings,
    // used for paired NPCs spawned without a parent record, or to mark an NPC as a
    // "lost and found" relative of the MC). Deliberately never follows a descendant's
    // other parent - sharing a child with someone doesn't make you related to them.
    getFamily: function(npc) {
        function getNPCList() {
            const npcs = (variables().slaves ?? []).concat((variables().guests ?? []), (variables().nursery ?? []), Object.values(variables().characters ?? {}));
            var list = new Map;
            for (var i=0;i < npcs.length;i++) {
                list.set(npcs[i].id, npcs[i]);
            }
            return list;
        };

        const NPCList = getNPCList();
        const familyList = new Map();

        function addDescendantsOf(person, depth) {
            if (!person || !person.hasOwnProperty('family') || !person.family.hasOwnProperty('kids')) { return; }
            for (const kidId of person.family.kids) {
                if (!NPCList.has(kidId)) { continue; }
                if (!familyList.has(kidId) || familyList.get(kidId)[1] > depth) {
                    familyList.set(kidId, [NPCList.get(kidId), depth]);
                    addDescendantsOf(NPCList.get(kidId), depth + 1);
                }
            }
        }

        function addSiblingLinksOf(person, depth) {
            if (!person || !person.hasOwnProperty('family') || !person.family.hasOwnProperty('siblings')) { return; }
            for (const siblingId of person.family.siblings) {
                if (!NPCList.has(siblingId)) { continue; }
                const sibling = NPCList.get(siblingId);
                // siblings is a mutual link (each side lists the other), so only
                // recurse when this actually improves on what we've already found -
                // otherwise the two sides keep re-discovering each other forever.
                if (!familyList.has(siblingId) || familyList.get(siblingId)[1] > depth) {
                    familyList.set(siblingId, [sibling, depth]);
                    addDescendantsOf(sibling, depth + 1);
                    addSiblingLinksOf(sibling, depth + 1);
                }
            }
        }

        function addAncestorsOf(person, depth) {
            if (!person || !person.hasOwnProperty('family')) { return; }
            for (const parentKey of ['father', 'mother']) {
                if (!person.family.hasOwnProperty(parentKey)) { continue; }
                const parentId = person.family[parentKey];
                if (!NPCList.has(parentId)) { continue; }
                const parent = NPCList.get(parentId);
                if (!familyList.has(parentId) || familyList.get(parentId)[1] > depth) {
                    familyList.set(parentId, [parent, depth]);
                    addDescendantsOf(parent, depth + 1);
                    addSiblingLinksOf(parent, depth + 1);
                    addAncestorsOf(parent, depth + 1);
                }
            }
        }

        addDescendantsOf(npc, 1);
        addSiblingLinksOf(npc, 1);
        addAncestorsOf(npc, 1);

        return familyList;
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

        // Sibling: shared father or shared mother, or a direct sibling link (paired
        // spawn without parent records, or an NPC marked as a "lost and found" relative)
        if ((f1.father && f2.father && f1.father === f2.father) ||
            (f1.mother && f2.mother && f1.mother === f2.mother) ||
            (f1.siblings ?? []).includes(npc2.id) ||
            (f2.siblings ?? []).includes(npc1.id)) return 'sister';

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


