/**
 * collection of tools for the $player in one "namespace"
 */
setup.player = {
    /**
     * check and updates the player family tree
     */
    updateFamily: function() {
        const player = variables().player;
        const npcs = (variables().slaves ?? []).concat((variables().guests ?? []), (variables().nursery ?? []), Object.values(variables().characters ?? {}));
        for (const npc of npcs) {
            if(npc.id && (npc?.family?.father ?? '') === 'mc') {
                if(!((player?.family?.kids ?? []).includes(npc.id))) {
					player.family ??= {};
					player.family.kids ??= [];
					player.family.kids.push(npc.id);
                }
            }
            if(npc.id && (npc?.family?.husband ?? '') === 'mc') {
                if(!((player?.family?.wives ?? []).includes(npc.id))) {
					player.family ??= {};
					player.family.wives ??= [];
					player.family.wives.push(npc.id);
                }
            }
        }
    },
    /**
     * Pretty prints name of npc
     * @param {*} npc 
     * @returns         string with colorcoded gender 
     */
    npcNameColor: function(npc) {
        if(npc ?? false) {
            return '<span class="gender-' + setup.genderClass(npc) + '">' + npc.name + '</span>'
        } else {
            return '';
        }
    },
    /**
     * Pretty print a relation of mc with all its other relatives
     * @param {*} npcID 
     * @returns         string
     */
    npcRelationText: function(npcID, pregCheck = true) {
        if((npcID ?? 'mc') === 'mc') { /* ignore undef and mc */
            return '';
        }
        const npc = setup.getNpcById(npcID);
        if(!npc) {
            return '';
        }
        let npcText = setup.player.npcNameColor(npc) + ' (';
        const family = npc.family ?? {};
        for(const relation in family) {
            if (['wives','kids'].includes(relation)) {
                const out = [];
                for(const id of (family[relation] ?? [])) {
                    if((id ?? 'mc') !== 'mc') {
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
                if((id ?? 'mc') !== 'mc') {
                    const rel = setup.getNpcById(id);
                    if(rel) {
                        npcText += relation + ': ' + setup.player.npcNameColor(rel) + '; ';
                    }
                }
            }
        }
        if(pregCheck && typeof npc.pregnancy !== 'undefined') {
            const fatherId = npc.pregnancy_father ?? 'unknown';
            if(fatherId === 'mc') {
                npcText += 'Pregnant with your child';
            } else {
                npcText += 'Pregnant with another guys child';
            }
        }
        npcText += ')';
        return npcText;
    },
};