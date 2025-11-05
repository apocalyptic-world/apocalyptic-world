/**
 * collection of tools for the $player in one "namespace"
 */
setup.player = {
    isRecognized: function() {
        let recognitionPercentage;
        let recognitionPercentageReputation;

        const fighterRank = variables().player.fighter_rank ?? 0;
        if (fighterRank <= 40) {
            recognitionPercentage = 60;
        } else if (fighterRank <= 50) {
            recognitionPercentage = 50;
        } else if (fighterRank <= 60) {
            recognitionPercentage = 40;
        } else if (fighterRank <= 70) {
            recognitionPercentage = 30;
        } else if (fighterRank <= 80) {
            recognitionPercentage = 20;
        } else if (fighterRank <= 90) {
            recognitionPercentage = 10;
        } else {
            recognitionPercentage = 0;
        }
        
        if (variables().player.reputation && variables().player.reputation > 0) {
            recognitionPercentageReputation = Math.floor(variables().player.reputation / 2);
        }

        return setup.percentageChance(Math.max(recognitionPercentage, recognitionPercentageReputation));
    },

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
    npcRelationText: function(npcID, pregCheck = true, showMC = false, hideRel = '') {
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
        return this.npcRelationText2(npc, pregCheck, showMC, hideRel);
    },

    /**
     * Pretty print a relation to a person with all its other relatives
     * @param {*} npc 
     * @param {*} pregCheck 
     * @param {*} showMC 
     * @returns 
     */
    npcRelationText2: function(npc, pregCheck = true, showMC = false, hideRel = '') {
        const npcID =npc.id;

	let family_container = 'display:flex;width:100;padding-inline:5px;align-items:flex-start;';
	let npc_name = 'flex:0 0 16%;padding-right:15px;display:flex;align-items:center;justify-content:left;';
	let name_display = 'text-align:left;';
	let family_details = 'flex:1;display:flex;flex-direction:column;padding-left:15px;';
	let relation_group = 'display:flex;margin-bottom:0px;align-items:baseline;';
	let relation_label = 'flex: 0 0 16%;padding-right:10px;text-align:right;min-width:100px;text-transform:capitalize;';
	let relation_names = 'flex:1;';

	let charDead = false;
	if ((variables().characters[npcID]?.dead ?? false) || (variables().characters[npcID]?.quests?.dead ?? false)) {
		charDead = true;
	}

        let npcText = '<div style="' + family_container + '"><div style="' + npc_name + '"><span style="' + name_display + '">' + setup.player.npcNameColor(npc) + (charDead ? ' (deceased)' : '') + ': </span></div><div style="' + family_details + '">';
        const family = npc.family ?? {};
        for(const relation in family) {
            if (['wives','kids'].includes(relation)) {
                const out = [];
                for(const id of (family[relation] ?? [])) {
 /*                  if(((npcID ?? 'unknown') !== 'unknown') || (showMC && npcID === 'mc')) */

                    if((id ?? 'unknown') !== 'mc' || showMC || relation !== hideRel) {
                        const rel = setup.getNpcById(id);
                        if(rel) {
				if (relation == 'kids') {
					if (rel.family['father'] == 'mc') {
						out.push('Your |' + setup.player.npcNameColor(rel));
					} else if ((rel.family['father'] ?? false) && (setup.getNpcById(rel.family['father']) ?? false)) {
						let kidDad = setup.getNpcById(rel.family['father']);
		                            	out.push(setup.player.npcNameColor(kidDad) + "'s |" + setup.player.npcNameColor(rel));
					} else {
						if (hideRel == 'husband') {
			                            	out.push("Your step-|" + setup.player.npcNameColor(rel));
						} else {
			                            	out.push("Other |" + setup.player.npcNameColor(rel));
						}
					}
				} else {
                            		out.push(setup.player.npcNameColor(rel));
				}
                        } 
                    } 
                }
                if(out.length) {
			if (relation !== 'kids') {
                    		npcText += '<div style="' + relation_group + '"><span style="' + relation_label + '">' + relation + ': </span><span style="' + relation_names + '">' + out.sort().join(', ') + '</span></div> ';
			} else {
				let lastDad = '';
				for (const kidWithDad of out.sort()) {
					let parts = kidWithDad.split('|');
					let myKid = parts[1];
					let myDad = parts[0];

					if (lastDad == '') {
						npcText += '<div style="' + relation_group + '"><span style="' + relation_label + '">' + myDad + relation + ': </span><span style="' + relation_names + '">';
						lastDad = myDad;
					} else if (myDad !== lastDad) {
						npcText += '</span></div> <div style="' + relation_group + '"><span style="' + relation_label + '">' + myDad + relation + ': </span><span style="' + relation_names + '">';
						lastDad = myDad;
					} else {
						npcText += ' - ';
					}
					npcText += myKid;
				}
				npcText += '</span></div> ';
			}
                }
            } else {
                const id = family[relation];
                if((id ?? 'unknown') !== 'mc' || showMC || relation !== hideRel) {
                    const rel = setup.getNpcById(id);
                    if(rel) {
			let charDead = false;
			if ((variables().characters[id]?.dead ?? false) || (variables().characters[id]?.quests?.dead ?? false)) {
				charDead = true;
			}
                        npcText += '<div style="' + relation_group + '"><span style="' + relation_label + '">' + relation + ': </span><span style="' + relation_names + '">' + setup.player.npcNameColor(rel) + (charDead ? ' (deceased)' : '') + '</span></div> ';
                    }
                }
            }
        }
        if(pregCheck && typeof npc.pregnancy !== 'undefined') {
            const fatherId = npc.pregnancy_father ?? 'unknown';
            const father = setup.getNpcById(fatherId);
            if(fatherId === 'mc') {
                npcText += '<div style="' + relation_group + '">Pregnant with your child</div>';
            } else if (father) {
                npcText += '<div style="' + relation_group + '">Pregnant with child of ' + setup.player.npcNameColor(father) + '</div>';
            } else {
                npcText += '<div style="' + relation_group + '">Pregnant with another guys child</div>';
            }
        }
        npcText += '</div></div>';
        return npcText;
    },

    hasFlaccidDick: function()
    {
        return setup.perkHas('temp_impotence');
    }
};
