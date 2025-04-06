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



setup.getRandomTraits = function (npc, count = 1) {
    const _traitsNotPair = {
        breeder: 'infertile',
        infertile: 'breeder'
    };
    const _traits = clone(setup.traits);
    if (npc.traits ?? []) {
        for (let excludeTrait in npc.traits) {
            delete _traits[exclude[excludeTrait]];
        }
    }

    for (let _trait in _traits) {
        if (_traits[_trait].gender && _traits[_trait].gender.indexOf(npc.gender) < 0) {
            delete _traits[_trait];
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
