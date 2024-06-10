setup.skills = {
    gardener: {
        title: 'Gardener',
        description: 'Gives additional bonus while assigned to the garden.'
    },
    woodcraft: {
        title: 'Woodcraft',
        description: 'Can gather more wood.'
    },
    scavenger: {
        title: 'Scavenger',
        description: 'More likely to find stuff, and less likely to get into trouble.'
    },
    shopkeeper: {
        title: 'Shopkeeper',
        description: 'Can work in shop and manage your goods.'
    },
    cook: {
        title: 'Cook',
        description: 'Decreases chance of rotten food.'
    },
    doctor: {
        title: 'Doctor',
        description: 'Decreases chance of miscarriage and heals people twice as fast.'
    },
    teacher: {
        title: "Teacher",
        description: "Can teach childrens in school"
    }
};

setup.getRandomSkills = function (count = 1) {
    var shuffledSkills = Object.keys(setup.skills).sort((a, b) => 0.5 - Math.random());

    return shuffledSkills.slice(0, count);
};

setup.hasDoctor = function() {
    if (!variables()?.game?.location?.hospital) {
        return false;
    }

    let guests = variables().guests;

    for (var i = 0; i < guests.length; i++) {
        if (guests[i].assignedTo === 'hospital') {
            return true;
        }
    }

    return false;
};

setup.getDoctors = function() {
    var tmpDoctors = [];
    for (var i = 0; i < variables().guests.length; i++) {
        if ((variables().guests[i].skills ?? []).includes('doctor')) {
            tmpDoctors.push(variables().guests[i]);
        }
    }
    return tmpDoctors;
};

