setup.ageRoll = function() {
	var _ageRoll = window.randomInteger(1, 100);
	var _ageRange = new Array();
	if (_ageRoll <= 55) {
		_ageRange = [18,27];
	} else if (_ageRoll <= 75) {
		_ageRange = [28,37];
	} else if (_ageRoll <= 90) {
		_ageRange = [38,47];
	} else {
		_ageRange = [48,60];
	}
	return window.randomInteger(_ageRange[0], _ageRange[1]);
};

setup.raceRoll = function() {
    var _raceRoll = window.randomInteger(1, 100);
    var _race = '';
    if (_raceRoll <= 35) {
        _race = 'white';
    } else if (_raceRoll <= 55) {
        _race = 'latina';
    } else if (_raceRoll <= 75) {
        _race = 'black';
    } else if (_raceRoll <= 90) {
        _race = 'asian';
    } else {
        _race = 'indian';
    }
    return _race;
};

setup.hairRoll = function(_race, _age, _gender) {
	var _hairRoll = window.randomInteger(1, 100);
	var _hair = '';
	if (['asian', 'black', 'latina', 'indian'].includes(_race) || _hairRoll <= 15) {
		_hair = 'black';
	} else if (_hairRoll <= 50) {
		_hair = 'brown';
	} else if (_hairRoll <= 85) {
		_hair = 'blonde';
	} else {
		_hair = 'ginger';
	}
	if (_age >= 50) {
		_hair = 'gray';
	}
	if (_gender == 1 && setup.percentageChance(_age - 10)) {
		_hair = 'bald';
	}	
	return _hair;
};

setup.dyeRoll = function(hair) {
	var _dyeRoll = window.randomInteger(1, 100);
	var _hairList = [hair];
	if (_dyeRoll <= 25) {
		_hairList = ['red', 'green', 'blue', 'pink', 'purple', 'white', 'gray'];
	} else if (_dyeRoll <= 50) {
		_hairList = ['ginger', 'blonde'];
	}
	return _hairList[window.randomInteger(0, _hairList.length - 1)];
};

setup.eyesRoll = function(_race, _hair) {
    var _eyesRoll = window.randomInteger(1, 100);
    var _metisRoll = window.randomInteger(1, 100);
    var _eyes = 'brown';
    
    var eyeColorChances = {
        blonde_ginger: [
            { color: 'gray', chance: 10 },
            { color: 'green', chance: 15 },
            { color: 'hazel', chance: 25 },
            { color: 'blue', chance: 40 },
            { color: 'brown', chance: 100 } // default to brown if no other matches
        ],
        other_hair: [
            { color: 'gray', chance: 10 },
            { color: 'green', chance: 10 },
            { color: 'hazel', chance: 20 },
            { color: 'blue', chance: 20 },
            { color: 'brown', chance: 100 } // default to brown if no other matches
        ]
    };

    var selectedMapping = (['blonde', 'ginger'].includes(_hair)) ? eyeColorChances.blonde_ginger : eyeColorChances.other_hair;

    if (_race === 'white' || _metisRoll <= 30) {
        for (var i = 0; i < selectedMapping.length; i++) {
            if (_eyesRoll <= selectedMapping[i].chance) {
                _eyes = selectedMapping[i].color;
                break;
            }
        }
    }
    
    return _eyes;
};

setup.orientationRoll = function(gender) {

	if (!settings.gaysEnabled && [1, 3].includes(gender)) {
		return 'straight';
	}
	if (!settings.lesbiansEnabled && [0, 2].includes(gender)) {
		return 'straight';
	}
	var _orientationRoll = window.randomInteger(1, 100);

	if (gender == 0 || gender == 1) {
		if (_orientationRoll <= 70) {
			return 'straight';
		} else if (_orientationRoll <= 75) {
			return ['lesbian','gay'][gender];
		} else if (_orientationRoll <= 95) {
			return 'bisexual';
		} else {
			return 'asexual';
		}
	} else {
		if (_orientationRoll <= 20) {
			return 'straight';
		} else if (_orientationRoll <= 50) {
			return ['lesbian','gay'][gender-2];
		} else if (_orientationRoll <= 70) {
			return 'bisexual';
		} else if (_orientationRoll <= 90) {
			return 'pansexual';
		} else {
			return 'asexual';
		}
	}
};

setup.displayOrientation = function(person) {
	if (person.likesGuys == false && person.likesGirls == false && person.likesTGuys == false && person.likesTGirls == false) {
		return 'asexual';
	}
	else if (person.likesGuys == true && person.likesGirls == true && person.likesTGuys == true && person.likesTGirls == true) {
		return 'pansexual';
	}
	else if (person.likesGuys == true && person.likesGirls == true) {
		return 'bisexual';
	}
	else if ((person.gender == 1 || person.gender == 3) && person.likesGirls == true) {
		return 'straight';
	}	
	else if ((person.gender == 0 || person.gender == 2) && person.likesGuys == true) {
		return 'straight';
	}
	else if ((person.gender == 1 || person.gender == 3) && person.likesGuys == true) {
		return 'gay';
	}	
	else if ((person.gender == 0 || person.gender == 2) && person.likesGirls == true) {
		return 'lesbian';
	}
	
	return 'straight';
};

setup.displayOrientationIcon = function(person) {
	const mapping = {
		asexual: '&#x26B2;',
		pansexual: '&#x26A7;',
		bisexual: 'bi',
		straight: '&#x26A4;',
		gay: '&#x26A3;',
		lesbian: '&#x26A2;'
	};
	const _ori = setup.displayOrientation(person);

	return mapping[_ori] ?? _ori;
}

setup.setSexuality = function(person, orientation) {
	var _orientation = orientation;

	if (!settings.gaysEnabled && [1, 3].includes(person.gender)) {
		_orientation = 'straight';
	}
	if (!settings.lesbiansEnabled && [0, 2].includes(person.gender)) {
		_orientation = 'straight';
	}

	person.likesGuys = false;
	person.likesGirls = false;
	person.likesTGuys = false;
	person.likesTGirls = false;
	person.guys = 0;
	person.girls = 0;
	person.tguys = 0;
	person.tgirls = 0;
	person.anal = 0;
	person.bj = 0;
	person.dp = 0;

	if (person.gender == 0 || person.gender == 3 ) {
		person.pussy = 0;
	}	

	if (_orientation == 'bisexual') {
		person.likesGuys = true;
		person.likesGirls = true;
		person.likesTGuys = setup.percentageChance(60);
		person.likesTGirls = setup.percentageChance(60);
	}
	else if (_orientation == 'lesbian') {
		person.likesGirls = true;
		person.likesTGuys = setup.percentageChance(15);
		person.likesTGirls = setup.percentageChance(30);
	}
	else if (_orientation == 'gay') {
		person.likesGuys = true;
		person.likesTGuys = setup.percentageChance(30);
		person.likesTGirls = setup.percentageChance(15);
	}
	else if ((person.gender == 0 || person.gender == 2) && _orientation == 'straight') {
		person.likesGuys = true;
		person.likesTGuys = setup.percentageChance(10);
	}
	else if ((person.gender == 1 || person.gender == 3) && _orientation == 'straight') {
		person.likesGirls = true;
		person.likesTGirls = setup.percentageChance(10);
	}
	else if (_orientation == 'pansexual') {
		person.likesGuys = true;
		person.likesGirls = true;
		person.likesTGuys = true;
		person.likesTGirls = true;
	}

	if (!settings.transEnabled) {
		person.likesTGuys = false;
		person.likesTGirls = false;
	}
	
	if (person.likesGuys) {
		person.guys = window.randomInteger(2, 20);
	}

	if (person.likesGirls) {
		person.girls = window.randomInteger(2, 20);
	}

	if (person.likesTGuys && setup.percentageChance(50)) {
		person.tguys = window.randomInteger(1, 5);
	}

	if (person.likesTGirls && setup.percentageChance(50)) {
		person.tgirls = window.randomInteger(1, 5);
	}

	if (person.likesGuys) {
		person.bj = window.randomInteger(10, 30);
		person.dp = window.randomInteger(0, 20);
	}
	
	if (person.likesTGirls && setup.percentageChance(25)) {
		person.bj = window.randomInteger(10, 30);
		person.dp = window.randomInteger(0, 20);
	}

	if ((person.gender == 0 || person.gender == 3) && _orientation !== 'asexual') {
		person.pussy = window.randomInteger(10, 30);
	}

	if (person.gender !== 1 && _orientation !== 'asexual' && setup.percentageChance(50)) {
		person.anal = window.randomInteger(5, 20);
	}

	if (person.gender == 1 && _orientation !== 'straight' && _orientation !== 'asexual' && setup.percentageChance(50)) {
		person.anal = window.randomInteger(5, 20);
	}

	if (person.gender == 1 && _orientation == 'straight' && setup.percentageChance(10)) {
		person.anal = window.randomInteger(5, 20);
	}	
	
	return person;
};

setup.setToVirgin = function(person) {
	person.guys = 0;
	person.girls = 0;
	person.tguys = 0;
	person.tgirls = 0;

	person.anal = 0;
	person.bj = 0;
	person.dp = 0;

	if (person.gender == 0 || person.gender == 3) {
		person.virgin = true;
		person.pussy = 0;
	}

	return person;
};

setup.likesGender = function(person, gender = 1) {
	return [person.likesGirls,
	person.likesGuys,
	person.likesTGirls,
	person.likesTGuys][gender];
};

setup.genderClass = function(person) {
	const _mapping = [
		'girl',
		'guy',
		'tgirl',
		'tguy'
	];

	return _mapping[person.gender];
};

setup.genderDescription = function(person) {
	const _mapping = [
		'woman',
		'man',
		'trans woman',
		'trans man'
	];

	return _mapping[person.gender];
};

setup.genderPath = function(person) {
	return setup.genderPathByValue(person.gender);
};

setup.genderPathByValue = function (value)
{
	const _mapping = [
		'female',
		'male',
		'transfemale',
		'transmale'
	];

	return _mapping[value];
}

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

setup.personalityTraits = function(count = 1) {
	var c = setup.getRandomElement(['efficient','organized','extravagant','careless']);
	var a = setup.getRandomElement(['friendly','compassionate','critical','rational']);
	var n = setup.getRandomElement(['sensitive','nervous','resilient','confident']);
	var o = setup.getRandomElement(['inventive','curious','consistent','cautious']);
	var e = setup.getRandomElement(['outgoing','energetic','solitary','reserved']);
	var traits = shuffle([c, a, n, o, e]);

	return traits.slice(0, count).sort();
};


setup.npcClothes = {
	top: setup.range(1, 11),
	bot: setup.range(1, 3),
	panties: setup.range(1, 4),
    accessories: setup.range(1,3),
    shoes: setup.range(1, 4)
};

setup.getRandomNpcClothes = function(npc)
{
	if (![0,2].includes(npc.gender)) {
		return null;
	}

	return {
		top: setup.getRandomElement(setup.npcClothes.top),
		bot: setup.percentageChance(70) ?
			setup.getRandomElement(setup.npcClothes.bot) : 
			null,
		panties: setup.percentageChance(90) ?
			setup.getRandomElement(setup.npcClothes.panties) : 
			null,
		accessories: setup.percentageChance(20) ?
			setup.getRandomElement(setup.npcClothes.accessories) : 
			null,
		shoes: setup.percentageChance(90) ?
			setup.getRandomElement(setup.npcClothes.shoes) : 
			null,
	};
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
		if (isSick && !npc.sleeping) {
			output += '<span class="sick-info">(sick)</span>';
		} else if (isRest && !npc.sleeping) {
			output += '<span class="sick-info">(resting)</span>';
		}
	}
	if (setup.family.isBloodToMC(npc)) {
		output += '<span class="relative-info" data-balloon-length="medium" aria-label="Relative" data-balloon-pos="up-right"></span>';
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
	if (['garden', 'quarry', 'school', 'nightclub', 'strip_club', 'forest'].includes(_npc.location)) {
		return false;
	}


	return true;
}

setup.npc = {
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

		if (npc?.family?.father === 'mc') {
			return this.mcNameUC(variables().mcNameOff ?? 'dad')
		}

		if (variables().slaveId && variables().slaves[variables().slaveId].id ==  npc.id) {
	        return this.mcNameUC(variables().mcNameSlave ?? 'master');
		}

		if (npc.sub > 90) {
			return this.mcNameUC(variables().mcNameSub ?? 'sir');
		}
		
		return variables().player.name;
	},

	isMarried: function (npc) {
		const fam = npc.family || {};
		return (
			(fam.wives && fam.wives.length > 0) ||
			(fam.husband && fam.husband !== "")
		);
	},

	areMarriedToEachOther: function (npcA, npcB) {
		const famA = npcA.family || {};
		const famB = npcB.family || {};

		const spousesA = [
			...(famA.wives || []),
			...(famA.husband ? [famA.husband] : [])
		];

		const spousesB = [
			...(famB.wives || []),
			...(famB.husband ? [famB.husband] : [])
		];

		return (
			spousesA.includes(npcB.id) ||
			spousesB.includes(npcA.id)
		);
	},

	canHaveSexBetween: function(npc1, npc2) {
		const AIsMarried = setup.npc.isMarried(npc1);
		const BIsMarried = setup.npc.isMarried(npc2);

		if (!AIsMarried && !BIsMarried) {
			return true;
		}

		if (setup.npc.areMarriedToEachOther(npc1, npc2)) {
			return true;
		}

		// 1% cheating
		return Math.random() <= 0.01;
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

	getGenderAsName: function(npc)
	{
		const _genders = [
			'female',
			'male',
			'transfemale',
			'transmale'
		]

		return _genders[npc.gender] ?? 'unknown';
	},

	getSayDialog: function(npc) {
		const db = {
			survival: [
				"Every day is a fight. Some of us are just better at hiding it.",
				"Food. Water. Ammo. That's all that matters now."
			],
			emotional_positive: [
				"You give me hope... and that’s rare.",
				"I didn’t think I could smile again until I met you."
			],
			emotional_negative: [
				"Don’t ask me how I’m doing. You already know the answer.",
				"It’s easier not to feel anything at all."
			],
			philosophical: [
				"What even is ‘humanity’ anymore? Is it worth saving?",
				"I wonder if we were always doomed. The end just came quicker than expected."
			],
			sadistic: [
				"You should see their faces when they realize I'm not here to help.",
				"Screams echo beautifully, don’t they?"
			],
			masochist: [
				"Hurt me again. Make me feel like I still exist.",
				"Pain is my therapy now."
			],
			affectionate: [
				"I feel safest when you're near. Don't go, %mcName%",
				"You don't know how much I needed this… us."
			],
			hungry: [
				"I’m so damn hungry I could eat a dead rad-dog.",
				"I’d kill for a sandwich. Literally."
			],
			horny_low: [
				"It’s been a while… I could use a distraction.",
				"I’ve got urges I can’t just ignore, you know?"
			],
			horny_high: [
				"If you don't take me right now, I might explode.",
				"Let’s not pretend this tension doesn’t exist."
			],
			drunk: [
				"The world’s a blur. Makes it easier to forget.",
				"Another drink? Sure. What’s the worst that can happen?"
			],
			corrupted: [
				"I stopped pretending to care about ‘good’ a long time ago.",
				"Morality is for the dead. The rest of us just adapt."
			],
			mechanical: [
				"Fixed the generator again. I swear, it’s held together with duct tape and hope.",
				"If I had proper tools, I could do wonders..."
			],
			fighter: [
				"The best part of a fight? That split-second when you know you’ve won.",
				"Violence is a language everyone understands."
			],
			cook: [
				"I made stew out of god knows what. But it tastes... edible.",
				"I miss real food. You know, not rat jerky and canned beans."
			],

			// SEX STATS-BASED DIALOG
			sex_innocent: [
				"I’ve only done it a few times... is that bad?",
				"Sometimes I wonder if I’m still the same person after my first time."
			],
			sex_experienced: [
				"I've done more than I care to admit... but it kept me alive.",
				"Sex isn't new to me — it's just part of the game now."
			],
			sex_lewd: [
				"Use me %mcName%. Ruin me. I live for that.",
				"I'm dripping just thinking about it again..."
			],
			sex_jaded: [
				"It doesn’t mean anything to me anymore. Just another motion.",
				"I’ve stopped pretending I feel anything from it now."
			],
			family_child: [
				"I still remember when I used to fall asleep on your lap...",
				"You were always the one keeping me safe. I never said it back then, but thank you.",
				"Sometimes I wonder if things would be different if we never left home.",
				
				"You say you protected me, but look where we are now.",
				"I didn’t ask to be born into this. You made choices, and I live with them.",
				"Do you even remember what it means to be a parent anymore?",

				"What were you like before everything fell apart? Were you different?",
				"Do you think I'd still be me if the world had stayed normal?",
				"Do you ever wish I hadn't been born into all this chaos?",

				"No matter what happens, I’m glad I have you. Really.",
				"I feel safe when you're nearby. I know I shouldn't admit it, but I do.",
				"You're not perfect, but you're all I have. And I need you.",

				"I learned to fight because I had to. Not because I wanted to.",
				"Softness gets you killed. You taught me that, remember?",
				"I don't have time to be a kid anymore — we both know that.",

				"Sometimes I feel like I’ve lost who I was. Do you even see me the same?",
				"Things have changed between us... and not always for the better.",
				"The choices we made... some lines can't be uncrossed, right?",

				"People underestimate me because I smile. That’s their mistake.",
				"I’m not just your child. I’m my own person too, even if the world forgets that.",
				"I act confident so no one sees the cracks. But you see them, don’t you?",

				"%mcNameUC%, remember when you tried to teach me how to fix that old generator? You were terrible at it.",
				"You always said I'd be stronger than you someday. I think that day came."
			]
		}

		let pool = [];

		const {
			corruption, happy, drunk, food, horny, relationship,
			traits, personality, location, skills, sexStats
		} = npc;

		traits ??= [];
		skills ??= [];

		if (happy > 40) pool.push(...db.emotional_positive);
		else if (happy < -20) pool.push(...db.emotional_negative);

		if (corruption > 80) pool.push(...db.corrupted);
		if (drunk > 70) pool.push(...db.drunk);
		if (food < 3) pool.push(...db.hungry);

		if (horny >= 60) pool.push(...db.horny_high);
		else if (horny >= 20) pool.push(...db.horny_low);

		if (traits.includes("sadistic")) pool.push(...db.sadistic);
		if (traits.includes("masochist")) pool.push(...db.masochist);
		if (relationship > 70 || traits.includes("breeder") || personality.includes("extravagant"))
			pool.push(...db.affectionate);

		if (location === "bedroom" && relationship > 60) pool.push(...db.affectionate);

		if (skills.includes("mechanic")) pool.push(...db.mechanical);
		if (skills.includes("fighter")) pool.push(...db.fighter);
		if (skills.includes("cook")) pool.push(...db.cook);

		if (npc.family && npc.family.father === "mc") {
			const emotionalScore = (npc.happy ?? 0) - (npc.corruption ?? 0);
			const reflective = emotionalScore > 30;
			const jaded = emotionalScore < -10;
			
			if (reflective) {
				pool.push(...db.family_child.filter(line => line.includes("remember") || line.includes("glad")));
			} else if (jaded) {
				pool.push(...db.family_child.filter(line => line.includes("resent") || line.includes("lines")));
			} else {
				pool.push(...db.family_child);
			}
		}

		// === SexStats logic ===
		if (sexStats) {
			const { bj = 0, pussy = 0, anal = 0, dp = 0, creampies = 0 } = sexStats;
			const totalActs = bj + pussy + anal + dp;

			if (totalActs <= 3) pool.push(...db.sex_innocent);
			else if (totalActs >= 10 && totalActs <= 30) pool.push(...db.sex_experienced);

			if ((creampies > 5 || bj >= 15 || pussy >= 10) && corruption >= 50)
				pool.push(...db.sex_lewd);

			if (totalActs >= 30 && happy < -10)
				pool.push(...db.sex_jaded);
		}

		if (pool.length < 3) pool.push(...db.philosophical);
		pool.push(...db.survival);

		const unique = [...new Set(pool)];
		return unique[Math.floor(Math.random() * unique.length)]
			.replace(/%mcNameUC%/g, setup.npc.mcName(npc, true))
    		.replace(/%mcName%/g, setup.npc.mcName(npc, false));
	}
}

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

setup.handleBathing = function (guest, newBonus = 0) {
	const maxBeauty = 100;

	if (!guest.washDays) {
		guest.baseBeauty = guest.beauty;
		guest.washBeauty = Math.min(newBonus, 5); // clamp initial bonus
		guest.beauty = Math.min(guest.beauty + (guest.washBeauty * 2), maxBeauty);
	} else {
		const decay = guest.washBeauty * guest.washDays;
		guest.beauty = Math.max(guest.beauty - decay, 0);

		// Reapply bonus, safely
		const adjustedBonus = Math.min(guest.washBeauty, 5);
		guest.beauty = Math.min(guest.beauty + (adjustedBonus * 2), maxBeauty);
	}

	guest.washBeauty = Math.min(guest.washBeauty ?? newBonus, 5); // clamp stored bonus too
	guest.washDays = 2;
};
