/**
 * collection of tools for the $player in one "namespace"
 */
setup.player = {
    /**
     * check and updates the player family tree
     */
    updateFamily: function(childmothers = false) {
        const player = variables().player;
        const npcs = (variables().slaves ?? []).concat((variables().guests ?? []), (variables().nursery ?? []), Object.values(variables().characters ?? {}));
        player.family ??= {};

        for (const npc of npcs) {
            if(npc.id && (npc?.family?.father ?? '') === 'mc') {
                if(!((player?.family?.kids ?? []).includes(npc.id))) {
					player.family.kids ??= [];
					player.family.kids.push(npc.id);
                } 

                // mothers to your children
                const motherID = npc.family.mother ?? '';
                if (motherID && childmothers && !((player?.family?.childmothers ?? []).includes(motherID))) {
					player.family.childmothers ??= [];
					player.family.childmothers.push(motherID);                    
                }
            }
            if(npc.id && (npc?.family?.husband ?? '') === 'mc') {
                if(!((player?.family?.wives ?? []).includes(npc.id))) {
					player.family.wives ??= [];
					player.family.wives.push(npc.id);
                }
            }
        }
    },
    /**
     * check that special characters have correct I.D
     * should be .character.x.id = x
     * @returns 
     */
    charactersCheck: function() {
        const chars =  variables().characters;
        const changesID = new Map;
        for(const charID in chars) {
            chars[charID].id ??= charID;
            if (chars[charID].id !== charID) {
                changesID.set(chars[charID].id, charID);
            }
        }
        return changesID;
    },
    /**
     * As setup.genderClass(npc) but notes that som characters don't have npc.attributes like gender
     * @param {*} person
     * @returns     as  setup.genderClass(npc)
     */
    npcGenderClass: function(person) {
        /* const genderclass = (typeof person.gender !== 'undefined') ? setup.genderClass(person) : ''; */
        let genderclass = setup.genderClass(person);
        if (typeof genderclass !== 'undefined') {
            return genderclass;
        }
        genderclass =
            (['blair', 'eve', 'isabel'].includes(person.id)) ?                  'girl'  :
            (['mc', 'dom', 'negan', 'rodger', 'vincent'].includes(person.id)) ? 'guy'   : 
            (['horse'].includes(person.id)) ?                                   'horse' : '';
        return genderclass;
    },
    /**
     * Pretty prints name of npc
     * @param {*} npc 
     * @returns         string with colorcoded gender 
     */
    npcNameColor: function(npc) {
        if(npc ?? false) {
            return '<span class="gender-' + setup.player.npcGenderClass(npc) + '">' + npc.name + '</span>'
        } else {
            return '';
        }
    },
    /**
     * Pretty print a relation to a person with all its other relatives
     * @param {*} npcID 
     * @param {*} pregCheck 
     * @param {*} showMC 
     * @returns         string
     */
    npcRelationText: function(npcID, pregCheck = true, showMC = false) {
        if(((npcID ?? 'unknown') === 'unknown') || (!showMC && npcID === 'mc'))
        {            
            return '';
        }
        const npc = setup.getNpcById(npcID);
        if(!npc) {
            return '';
        }
        if(npcID === 'mc') {
            npc.id = npcID;
        }
        return this.npcRelationText2(npc, pregCheck, showMC);
    },

    /**
     * Pretty print a relation to a person with all its other relatives
     * @param {*} npc 
     * @param {*} pregCheck 
     * @param {*} showMC 
     * @returns 
     */
    npcRelationText2: function(npc, pregCheck = true, showMC = false) {
        const npcID =npc.id;

        let npcText = setup.player.npcNameColor(npc) + ' (';
        const family = npc.family ?? {};
        for(const relation in family) {
            if (['wives','kids'].includes(relation)) {
                const out = [];
                for(const id of (family[relation] ?? [])) {
 /*                  if(((npcID ?? 'unknown') !== 'unknown') || (showMC && npcID === 'mc')) */

                    if((id ?? 'unknown') !== 'mc' || showMC) {
                        const rel = setup.getNpcById(id);
                        if(rel) {
                            out.push(setup.player.npcNameColor(rel));
                        } 
                    } 
                }
                if(out.length) {
                    npcText += relation + ': ' + out.sort().join(', ') + '; ';
                }
            } else {
                const id = family[relation];
                if((id ?? 'unknown') !== 'mc' || showMC) {
                    const rel = setup.getNpcById(id);
                    if(rel) {
                        npcText += relation + ': ' + setup.player.npcNameColor(rel) + '; ';
                    }
                }
            }
        }
        if(pregCheck && typeof npc.pregnancy !== 'undefined') {
            const fatherId = npc.pregnancy_father ?? 'unknown';
            const father = setup.getNpcById(fatherId);
            if(fatherId === 'mc') {
                npcText += 'pregnant with your child';
            } else if (father) {
                npcText += 'pregnant with child of ' + setup.player.npcNameColor(father);
            } else {
                npcText += 'pregnant with another guys child';
            }
        }
        npcText += ')';
        return npcText;
    },
};