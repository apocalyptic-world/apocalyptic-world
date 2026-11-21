setup.agePeriod = function(age) {
	var _unit = age.toString()[1];
	var _tens = age.toString()[0];

	if (age <= 8) {
		return 'childhood years';
	} else if (age <= 12) {
		return 'tween years';
	} else if (age <= 14) {
		return 'early teens';
	} else if (age <= 17) {
		return 'mid teens';
	} else if (age <= 19) {
		return 'late teens';
	} else if (age >= 100) {
		return '100s';
	} else if (_unit <= 4) {
		return 'early '+_tens+'0s';
	} else if (_unit <= 9) {
		return 'late '+_tens+'0s';
	}
};

setup.beautyDescription = function(beauty) {
	const categories = ['repulsive looking', 'hideous', 'ugly', 'unattractive', 'plain looking', 'average looking', 'attractive', 'beautiful', 'gorgeous', 'stunning'];
    const categoryIndex = Math.floor((beauty - 1) / 10);
    return categories[Math.max(categoryIndex, 0)];
};

/**
 * Gives happy level from either a npc, a number or a string
 * @param   {npc|number|string}   nns
 * @returns {string}              happy level
 */
setup.getNpcHappyLevel = function(nns) {
	var happy = 0;
	if (typeof nns === 'number' || nns instanceof Number) {
		happy = nns;
	} else if (typeof nns === 'string' || nns instanceof String) {
		return nns;
	} else { /* npc */
		happy = nns.happy ?? 0;
	}

	const emotions = {
        very_sad: happy < -50,
        sad: happy < 0,
        normal: happy < 20,
        happy: happy < 50
    };

    for (const emotion in emotions) {
        if (emotions[emotion]) {
            return emotion;
        }
    }

    return 'very_happy';
};

setup.npcListInfo = function(npc, isSick, isRest) {
	let output = '';
	if (setup.getAge(npc) >= 18) {
		if (npc.virgin && !npc.gender) {
			output += '<span class="virgin-info" data-balloon-length="medium" aria-label="Virgin" data-balloon-pos="up-right"></span>';
		}
		if (npc.pregnancy) {
			output += '<span class="pregnancy-info" data-balloon-length="medium" aria-label="Pregnant" data-balloon-pos="up-right">' + npc.pregnancy + '</span>';
		}
		if (npc.married && npc?.family?.husband === 'mc') {
			output += '<span class="married-info" data-balloon-length="medium" aria-label="Married" data-balloon-pos="up-right"></span>';
		}
		if (setup.spouseRoom.livesHere(npc)) {
			output += '<span class="glyph" data-balloon-length="medium" aria-label="Lives in your room" data-balloon-pos="up-right">&#x1F6CF;&#xFE0F;</span>';
		}
		if (npc.married || setup.npc.isMarried(npc)) {
			const spouseIds = [];
			if (npc?.family?.husband && npc.family.husband !== 'mc') {
				spouseIds.push(npc.family.husband);
			}
			for (const wifeId of (npc?.family?.wives ?? [])) {
				spouseIds.push(wifeId);
			}
			if (spouseIds.length > 0) {
				const names = spouseIds.map(id => {
					const s = setup.getNpcById(id);
					return s ? s.name : 'someone';
				}).join(', ').replace(/"/g, '&quot;');
				output += '<span class="glyph" data-balloon-length="medium" aria-label="Married to ' + names + '" data-balloon-pos="up-right">&#x1F48D;</span>';
			}
		}
		if (isSick && !npc.sleeping) {
			output += '<span class="sick-info">(sick)</span>';
		} else if (isRest && !npc.sleeping) {
			output += '<span class="sick-info">(resting)</span>';
		}
	}
	const _relToMC = setup.family.getRelationToMC(npc);
	if (_relToMC) {
		output += '<span class="relative-info" data-balloon-length="medium" aria-label="Relative: ' + _relToMC + '" data-balloon-pos="up-right"></span>';
	}
	if (npc.sleeping) {
		output += '<span class="sleeping-info" data-balloon-length="medium" aria-label="Sleeping" data-balloon-pos="up-right"></span>';
	}
	if (npc.notes) {
		output += '<span class="glyph" data-balloon-length="large" aria-label="' + npc.notes + '" data-balloon-pos="up-left">&#128456;</span>';
	}
	if (npc.drunk >= 20) {
		output += '<span class="glyph" data-balloon-length="medium" aria-label="' + setup.pronounceWhat(npc, true) + ' looks ' + setup.drunkDescription(npc) +'" data-balloon-pos="up-left">&#x1F942;</span>';
	}
	return output;
}

setup.NpcInHome = function(_npc) {
	if (['garden', 'quarry', 'school', 'nightclub', 'gloryhole', 'strip_club', 'forest'].includes(_npc.location)) {
		return false;
	}


	return true;
}

/* setup.npc core: how an NPC addresses the MC, lookups and duplicate names. The rest of setup.npc lives in
   js/npc/dialog.js, gender.js, history.js and marriage.js (Object.assign, so load order does not matter). */
Object.assign(setup.npc ??= {}, {
		isMcNameUc: false,

	mcNameUC: function (name)
	{
		if (!this.isMcNameUc) {
			return name;
		}

        return name.charAt(0).toUpperCase() + name.slice(1);
	},

	mcName: function (npc, ucfirst) {
		this.isMcNameUc = ucfirst;

		if (npc?.myMcName) {
			return this.mcNameUC(npc.myMcName)
		}

		const player = variables().player;

		if (npc?.family?.father === 'mc') {
			return this.mcNameUC(variables().mcNameOff ?? 'dad')
		}

		if (player.family?.mother === npc.id || player.family?.father === npc.id) {
			return this.mcNameUC(variables().mcNameParent ?? player.name)
		}

		if ((player.family?.siblings ?? []).includes(npc.id)) {
			return this.mcNameUC(variables().mcNameSib ?? player.name)
		}

		if (npc?.family?.husband === 'mc') {
			return this.mcNameUC(variables().mcNameWife ?? player.name)
		}

		const slaves = variables().slaves ?? [];
		if (slaves.some(s => s.id === npc.id)) {
	        return this.mcNameUC(variables().mcNameSlave ?? 'master');
		}

		if (npc.sub > 90) {
			return this.mcNameUC(variables().mcNameSub ?? 'sir');
		}

		const guests = variables().guests ?? [];
		if (guests.some(g => g.id === npc.id)) {
			return this.mcNameUC(variables().mcNameGuest ?? player.name)
		}

		return player.name;
	},

	/**
	 * For people with the same name, get a number som we can differiate them
	 * @returns list of these
	 */
	checkDuplicateName: function() {
		const name2id = {}; // {name}[ids...]
		const number  = new Map; // number{id} = number for that name

        const persons = [variables().player].concat((Object.values(variables().characters ?? {})), (variables().slaves ?? [], variables().guests ?? []), (variables().nursery ?? []));
		for (const person of persons) {
			name2id[person.name] ??= [];
			name2id[person.name].push(person.id);
		}
		for (const name in name2id) {
			if (name2id[name].length > 1) {
				for (const i in name2id[name]) {
					number.set(name2id[name][i], parseInt(i)+1);
				}
			}
		}
		return number;
	},

	/* Find any NPC across all collections by their id */
	findById: function(id) {
		const v = variables();
		for (const npc of (v.slaves ?? [])) { if (npc.id === id) return npc; }
		for (const key in (v.guests ?? {}))      { if (v.guests[key].id === id)      return v.guests[key]; }
		for (const key in (v.characters ?? {}))  { if (v.characters[key].id === id)  return v.characters[key]; }
		return null;
	},

	/* $characters holds placeholder entries before they are met, and dead Characters stay listed */
	isLivingCharacter: function(character) {
		return !!character?.name && !character.dead && !character.quests?.dead;
	}
});

setup.npcGetPackPortrait =  function(npc) {
	if (!npc.pack) {
		return null;
	}

	if (setup.packs[npc.pack]?.portrait) {
		return 'packs/'  + npc.pack + '/' + setup.packs[npc.pack]?.portrait;
	}

	if (setup.packsCustom[npc.pack]?.portrait) {
		return 'packs/'  + npc.pack + '/' + setup.packsCustom[npc.pack]?.portrait;
	}

	return null;
}

setup.wash = function (npc, options = {}) {
    const {
        beautyMultiplier = 2,
        washDays = 2,
        relationshipBonus = 0,
        happyBonus = 0,
        newBonus = null,
        markWashed = false,
    } = options;

    const bonus = newBonus !== null ? Math.min(newBonus, 5) : randomInteger(1, 2);

    if (!npc.washDays) {
        npc.baseBeauty = npc.beauty;
        npc.washBeauty = bonus;
        npc.beauty = Math.min(npc.beauty + (bonus * beautyMultiplier), 100);
        if (relationshipBonus) {
            npc.relationship = Math.min((npc.relationship ?? 0) + relationshipBonus, 100);
        }
    } else {
        npc.beauty = Math.max(npc.beauty - npc.washBeauty * npc.washDays, 0);
        npc.beauty = Math.min(npc.beauty + (npc.washBeauty * beautyMultiplier), 100);
    }

    npc.washDays = washDays;

    if (happyBonus) {
        npc.happy = Math.min((npc.happy ?? 0) + happyBonus, 100);
    }
    if (markWashed) {
        npc.washed = true;
    }
};
