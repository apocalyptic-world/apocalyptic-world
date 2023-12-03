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
	var _lightRoll = window.randomInteger(1, 100);
	var _eyes = 'brown';
	
	if (_race = 'white' || _metisRoll <= 30){
		if (['blonde', 'ginger'].includes(_hair)){
			if (_eyesRoll <= 10) {
				_eyes = 'gray';
			} else if (_eyesRoll <= 25) {
				_eyes = 'green';
			} else if (_eyesRoll <= 50) {
				_eyes = 'hazel';
			} else if (_eyesRoll <= 90) {
				_eyes = 'blue';
			}
		} else {
			if (_eyesRoll <= 10) {
				_eyes = 'gray';
			} else if (_eyesRoll <= 20) {
				_eyes = 'green';
			} else if (_eyesRoll <= 40) {
				_eyes = 'hazel';
			} else if (_eyesRoll <= 60) {
				_eyes = 'blue';
			}
		}
	}
	if (_lightRoll <= 33) {
		_eyes = 'dark '+_eyes;
	} else if (_lightRoll <= 66) {
		_eyes = 'light '+_eyes;
	}
	return _eyes;
};

setup.orientationRoll = function(gender) {
	if (!settings.gaysEnabled) {
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
};

setup.setSexuality = function(person, orientation) {
	var _orientation = orientation;
	if (!settings.gaysEnabled) {
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

setup.genderDescription = function(person) {
	const _mapping = [
		'woman',
		'man',
		'trans woman',
		'trans man'
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

setup.genderClass = function(person) {
	const _mapping = [
		'girl',
		'guy',
		'tgirl',
		'tguy'
	];

	return _mapping[person.gender];
};

setup.getNpcHappyLevel = function(person) {
	if (!person.happy) {
		person.happy = 50;
	}
	const emotions = {
        very_sad: person.happy < -50,
        sad: person.happy < 0,
        normal: person.happy < 20,
        happy: person.happy < 50
    };

    for (const emotion in emotions) {
        if (emotions[emotion]) {
            return emotion;
        }
    }

    return 'very_happy';
};

setup.personalityTraits = function(count = 1) {
	var c = ['efficient','organized','extravagant','careless'][window.randomInteger(0, 3)];
	var a = ['friendly','compassionate','critical','rational'][window.randomInteger(0, 3)];
	var n = ['sensitive','nervous','resilient','confident'][window.randomInteger(0, 3)];
	var o = ['inventive','curious','consistent','cautious'][window.randomInteger(0, 3)];
	var e = ['outgoing','energetic','solitary','reserved'][window.randomInteger(0, 3)];
	var traits = shuffle([c, a, n, o, e]);

	return traits.slice(0, count).sort();
};
