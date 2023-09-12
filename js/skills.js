setup.skills = {
    gardener: {
        title: 'Gardener',
        description: 'Gives additional bonus while assigned to garden'
    },
    woodcraft: {
        title: 'Woodcraft',
        description: 'Can gather more wood'
    },
    scavenger: {
        title: 'Scavenger',
        description: 'More likely to find stuff, and less likely to get into trouble'
    },
    shopkeeper: {
        title: 'Shopkeeper',
        description: 'Can work in shop and manage your goods'
    },
    cook: {
        title: 'Cook',
        description: 'Decreases chance of rotten food'
    },
    doctor: {
        title: 'Doctor',
        description: 'Decreases chance of miscarriage and sickness days goes x2 faster'
    }
};

setup.getRandomSkills = function (count = 1) {
    var shuffledSkills = Object.keys(setup.skills).sort((a, b) => 0.5 - Math.random());

    return shuffledSkills.slice(0, count);
};

setup.hasDoctor = function() {
    for (var i = 0; i < guests.length; i++) {
        if ((guests[i].skills ?? []).includes('doctor')) {
            return true;
        }
    }

    return false;
}