setup.traits = {
    analslut: {
        title: 'Anal slut',
        description: 'Gets orgasm only from anal sex'
    },
    cumslut: {
        title: 'Cumslut',
        description: 'Loves cum in mouth'
    },
    masochist: {
        title: 'Masochist',
        description: 'Likes to be punished'
    },
    deepthroat: {
        title: 'Deepthroat',
        description: 'Likes to get deepthroated'
    },
    breeder: {
        title: 'Breeder',
        description: '100% chance to get pregnant and pregnancy goes x2',
        gender: [0]
    },
    sadistic: {
        title: 'Sadistic',
        description: 'Display recurrent cruel behavior and aggression. Can be assigned as mistress if woman'
    },
    squirter: {
        title: 'Squirter',
        description: 'Ejaculates when gets orgasm',
        gender: [0]
    },
    nymphomaniac: {
        title: 'Nymphomaniac',
        description: 'Never says no, and earn double on street'
    }
};

setup.getRandomTraits = function (count = 1, exclude) {
    const _traits = clone(setup.traits);
    if (exclude) {
        for (let excludeTrait in exclude) {
            delete _traits[excludeTrait];
        }
    }
    var shuffledTraits = Object.keys(_traits).sort((a, b) => 0.5 - Math.random());

    return shuffledTraits.slice(0, count);
};
