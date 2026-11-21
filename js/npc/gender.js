/* Gender labels: gender number (0 woman, 1 man, 2 trans woman, 3 trans man) to class, description and path names. */

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

/* setup.npc part: gender name of an NPC (setup.npc is spread over js/npc/*.js; Object.assign so load order does not matter) */
Object.assign(setup.npc ??= {}, {
	getGenderAsName: function(npc)
	{
		const _genders = [
			'female',
			'male',
			'transfemale',
			'transmale'
		]

		return _genders[npc.gender] ?? 'unknown';
	}
});
