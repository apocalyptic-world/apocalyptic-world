setup.ageRoll = function() {
	var _ageRoll = Math.floor(Math.random() * 100 + 1);
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
	return Math.floor(Math.random() * (_ageRange[1] - _ageRange[0] + 1)) + _ageRange[0];
};

setup.raceRoll = function() {
	var _raceRoll = Math.floor(Math.random() * 100 + 1);
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
	var _hairRoll = Math.floor(Math.random() * 100 + 1);
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
	if (_gender && (Math.floor(Math.random() * 100) + 1 <= (_age - 10))) {
		_hair = 'bald';
	}	
	return _hair;
};

setup.dyeRoll = function(hair) {
	var _dyeRoll = Math.floor(Math.random() * 100 + 1);
	var _hairList = [hair];
	if (_dyeRoll <= 25) {
		_hairList = ['red', 'green', 'blue', 'pink', 'purple', 'white'];
	} else if (_dyeRoll <= 50) {
		_hairList = ['ginger', 'blonde'];
	}
	return _hairList[Math.floor(Math.random() * _hairList.length)];
};

setup.eyesRoll = function(_race, _hair) {
	var _eyesRoll = Math.floor(Math.random() * 100 + 1);
	var _metisRoll = Math.floor(Math.random() * 100 + 1);
	var _lightRoll = Math.floor(Math.random() * 100 + 1);
	var _eyes = 'brown';
	
	if (_race = 'white' || _metisRoll <= 30){
		if (['black', 'brown'].includes(_hair)){
			if (_eyesRoll <= 40) {
			_eyes = 'brown';
			} else if (_eyesRoll <= 60) {
			_eyes = 'blue';
			} else if (_eyesRoll <= 80) {
			_eyes = 'hazel';
			} else if (_eyesRoll <= 90) {
			_eyes = 'green';
			} else {
			_eyes = 'gray';
			}
		}
		if (['blonde', 'ginger'].includes(_hair)){
			if (_eyesRoll <= 10) {
			_eyes = 'brown';
			} else if (_eyesRoll <= 50) {
			_eyes = 'blue';
			} else if (_eyesRoll <= 75) {
			_eyes = 'hazel';
			} else if (_eyesRoll <= 90) {
			_eyes = 'green';
			} else {
			_eyes = 'gray';
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
	var _orientationRoll = Math.floor(Math.random() * 100 + 1);
	var _orientation = '';
	if (gender == 0 || gender == 1) {
		if (_orientationRoll <= 70) {
			_orientation = 'straight';
		} else if (_orientationRoll <= 75) {
			_orientation = ['lesbian','gay'][gender];
		} else if (_orientationRoll <= 95) {
			_orientation = 'bisexual';
		} else {
			_orientation = 'asexual';
		}
	} else {
		if (_orientationRoll <= 20) {
			_orientation = 'straight';
		} else if (_orientationRoll <= 50) {
			_orientation = ['lesbian','gay'][gender-2];
		} else if (_orientationRoll <= 70) {
			_orientation = 'bisexual';
		} else if (_orientationRoll <= 90) {
			_orientation = 'pansexual';
		} else {
			_orientation = 'asexual';
		}
	}
	return _orientation;
};

setup.setSexuality = function(person, orientation) {
	person.orientation = orientation;
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

	if (orientation == 'bisexual') {
			person.likesGuys = true;
			person.likesGirls = true;
			person.likesTGuys = Math.floor(Math.random() * 100) + 1 <= 60;
			person.likesTGirls = Math.floor(Math.random() * 100) + 1 <= 60;
	}
	else if (orientation == 'lesbian') {
			person.likesGirls = true;
			person.likesTGuys = Math.floor(Math.random() * 100) + 1 <= 15;
			person.likesTGirls = Math.floor(Math.random() * 100) + 1 <= 30;
	}
	else if (orientation == 'gay') {
			person.likesGuys = true;
			person.likesTGuys = Math.floor(Math.random() * 100) + 1 <= 30;
			person.likesTGirls = Math.floor(Math.random() * 100) + 1 <= 15;
	}
	else if ((person.gender == 0 || person.gender == 2) && orientation == 'straight') {
			person.likesGuys = true;
			person.likesTGuys = Math.floor(Math.random() * 100) + 1 <= 10;
	}
	else if ((person.gender == 1 || person.gender == 3) && orientation == 'straight') {
			person.likesGirls = true;
			person.likesTGirls = Math.floor(Math.random() * 100) + 1 <= 10;
	}
	else if (orientation == 'pansexual') {
			person.likesGuys = true;
			person.likesGirls = true;
			person.likesTGuys = true;
			person.likesTGirls = true;
	}
	
	if (person.likesGuys == true && person.likesGirls == true && person.likesTGuys == true && person.likesTGirls == true) {
			person.orientation = 'pansexual';
	}
	
	if (person.likesGuys) {
			person.guys = Math.floor(Math.random() * (20 - 2 + 1)) + 2;
	}

	if (person.likesGirls) {
			person.girls = Math.floor(Math.random() * (20 - 2 + 1)) + 2;
	}

	if (person.likesTGuys && (Math.floor(Math.random() * 100) + 1 <= 50)) {
			person.tguys = Math.floor(Math.random() * (5 - 1 + 1)) + 1;
	}

	if (person.likesTGirls && (Math.floor(Math.random() * 100) + 1 <= 50)) {
			person.tgirls = Math.floor(Math.random() * (5 - 1 + 1)) + 1;
	}

	if (person.likesGuys) {
			person.bj = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
			person.dp = Math.floor(Math.random() * (20 - 0 + 1)) + 0;
	}
	
	if (person.likesTGirls && (Math.floor(Math.random() * 100) + 1 <= 50)) {
			person.bj = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
			person.dp = Math.floor(Math.random() * (20 - 0 + 1)) + 0;
	}

	if ((person.gender == 0 || person.gender == 3) && orientation !== 'asexual') {
			person.pussy = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
	}

	if (person.gender !== 1 && orientation !== 'asexual' && (Math.floor(Math.random() * 100) + 1 <= 50)) {
			person.anal = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
	}

	if (person.gender == 1 && orientation !== 'straight' && orientation !== 'asexual' && (Math.floor(Math.random() * 100) + 1 <= 50)) {
			person.anal = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
	}

	if (person.gender == 1 && orientation == 'straight' && (Math.floor(Math.random() * 100) + 1 <= 10)) {
			person.anal = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
	}	
	
	return person;
};

setup.genderDescription = function(person) {
	if (person.gender == 0) {
		return 'woman';
	} else if (person.gender == 1) {
		return 'man';
	} else if (person.gender == 2) {
		return 'trans woman';
	} else if (person.gender == 3) {
		return 'trans man';
	}
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
    const categoryIndex = Math.ceil(beauty / 10) - 1;
    return categories[Math.min(categoryIndex, 9)];
};

setup.genderClass = function(person) {
	if (person.gender == 0) {
		return 'girl';
	} else if (person.gender == 1) {
		return 'guy';
	} else if (person.gender == 2) {
		return 'tgirl';
	} else if (person.gender == 3) {
		return 'tguy';
	}
};

setup.personalityTraits = function(count = 1) {
	var c = shuffle(['efficient','organized','extravagant','careless']);
	var a = shuffle(['friendly','compassionate','critical','rational']);
	var n = shuffle(['sensitive','nervous','resilient','confident']);
	var o = shuffle(['inventive','curious','consistent','cautious']);
	var e = shuffle(['outgoing','energetic','solitary','reserved']);
	var traits = shuffle([c[0], a[0], n[0], o[0], e[0]]);

	return traits.slice(0, count).sort();
};
