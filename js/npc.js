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
	if (['asian', 'black', 'latina'].includes(_race) || _hairRoll <= 25) {
		_hair = 'black';
	} else if (_hairRoll <= 65) {
		_hair = 'brown';
	} else if (_hairRoll <= 75) {
		_hair = 'ginger';
	} else {
		_hair = 'blonde';
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

setup.orientationRoll = function(gender) {
	var _orientationRoll = Math.floor(Math.random() * 100 + 1);
	var _orientation = '';
	if (_orientationRoll <= 70) {
		_orientation = 'straight';
	} else if (_orientationRoll <= 75) {
		_orientation = ['lesbian','gay'][gender];
	} else if (_orientationRoll <= 95) {
		_orientation = 'bisexual';
	} else {
		_orientation = 'asexual';
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

	if (!person.gender) {
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
	else if (!person.gender && orientation == 'straight') {
			person.likesGuys = true;
			person.likesTGuys = Math.floor(Math.random() * 100) + 1 <= 10;
	}
	else if (person.gender && orientation == 'straight') {
			person.likesGirls = true;
			person.likesTGirls = Math.floor(Math.random() * 100) + 1 <= 10;
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

	if (!person.gender && orientation !== 'asexual') {
			person.pussy = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
	}

	if (!person.gender && orientation !== 'asexual' && (Math.floor(Math.random() * 100) + 1 <= 50)) {
			person.anal = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
	}

	if (person.gender && (orientation == 'bisexual' || orientation == 'gay') && (Math.floor(Math.random() * 100) + 1 <= 50)) {
			person.anal = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
	}
	return person;
};

setup.genderDescriptor = function(person) {
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

setup.beautyDescriptor = function(beauty) {
	if (beauty <= 10) {
		return 'repulsive looking';
	} else if (beauty <= 20) {
		return 'hideous';
	} else if (beauty <= 30) {
		return 'ugly';
	} else if (beauty <= 40) {
		return 'unattractive';
	} else if (beauty <= 50) {
		return 'plain looking';
	} else if (beauty <= 60) {
		return 'average looking'
	} else if (beauty <= 70) {
		return 'attractive'
	} else if (beauty <= 80) {
		return 'beautiful'
	} else if (beauty <= 90) {
		return 'gorgeous'
	} else if (beauty <= 100) {
		return 'stunning'
	}
};
