setup.traits = {
    analslut: {
        title: 'Anal slut',
        description: 'Gets an orgasm only from anal sex.'
    },
    cumslut: {
        title: 'Cumslut',
        description: 'Loves cum in mouth.'
    },
    masochist: {
        title: 'Masochist',
        description: 'Likes to be punished.'
    },
    deepthroat: {
        title: 'Deepthroat',
        description: 'Likes to get deep-throated.'
    },
    breeder: {
        title: 'Breeder',
        description: 'Double chance to get pregnant and pregnancy twice as fast.',
        gender: [0]
    },
    sadistic: {
        title: 'Sadistic',
        description: 'Display recurrent cruel behavior and aggression. Can be assigned as mistress if woman.'
    },
    squirter: {
        title: 'Squirter',
        description: 'Ejaculates when gets orgasm.',
        gender: [0]
    },
    nymphomaniac: {
        title: 'Nymphomaniac',
        description: 'Never says no, and earns double on street.'
    },
    infertile: {
        title: "Infertile",
        description: "Can't have children"
    },
    milker: {
        title: "milker",
        description: "Can produce breast milk without being pregnant",
        gender: [0]
    }
};



setup.getRandomTraits = function (count = 1, exclude) {
    const _traitsNotPair = {
        breeder: 'infertile',
        infertile: 'breeder'
    };
    const _traits = clone(setup.traits);
    if (exclude) {
        for (let excludeTrait in exclude) {
            delete _traits[exclude[excludeTrait]];
        }
    }
    var shuffledTraits = Object.keys(_traits).sort((a, b) => 0.5 - Math.random());
    if (!shuffledTraits.length) {
        return [];
    }

    const _givenTraits = shuffledTraits.slice(0, count);
    for (const _traitsNotPairKey in _traitsNotPair) {
        if (_givenTraits.includes(_traitsNotPairKey) && _givenTraits.includes(_traitsNotPair[_traitsNotPairKey])) {
            const _traitKey = _givenTraits.indexOf(_traitsNotPair[_traitsNotPairKey]);
            _givenTraits.splice(_traitKey, 1);
        }
    }
    
    return _givenTraits;
};
