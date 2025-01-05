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
	if (_raceRoll <= 40) {
		_race = 'white';
	} else if (_raceRoll <= 65) {
		_race = 'latina';
	} else if (_raceRoll <= 85) {
		_race = 'black';
	} else {
		_race = 'asian';
	}
	return _race;
};

setup.hairRoll = function(_race, _age, _gender) {
	var _hairRoll = window.randomInteger(1, 100);
	var _hair = '';
	if (['asian', 'black', 'latina'].includes(_race) || _hairRoll <= 15) {
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
	const _mapping = [
		'female',
		'male',
		'transfemale',
		'transmale'
	];

	return _mapping[person.gender];
};

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
	if (npc.sleeping) {
		output += '<span class="sleeping-info" data-balloon-length="medium" aria-label="Sleeping" data-balloon-pos="up-right"></span>';
	}

	return output;
}

setup.NpcInHome = function(_npc) {
	if (['garden', 'quarry'].includes(_npc.location)) {
		return false;
	}


	return true;
}