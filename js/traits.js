setup.traits = {
    analslut: {
        title: 'Anal slut',
        description: 'Gets orgasm only from anal sex',
        gender: [0]
    },
    cumslut: {
        title: 'Cumslut',
        description: 'Loves cum in mouth',
        gender: [0]
    },
    masochist: {
        title: 'Masochist',
        description: 'Likes to be punished',
    },
    deepthroat: {
        title: 'Deepthroat',
        description: 'Likes to get deepthroated'
    },
    breeder: {
        title: 'Breeder',
        description: '100% chance to get pregnant and pregnancy goes x2'
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
        description: 'Never says no, and earn double on street',
        gender: [0]
    }
};

setup.getRandomTraits = function (count = 1) {
    var shuffledTraits = Object.keys(setup.traits).sort((a, b) => 0.5 - Math.random());

    return shuffledTraits.slice(0, count);
};
