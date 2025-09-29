setup.skills = {
    gardener: {
        title: 'Gardener',
        description: 'Gives additional bonus while assigned to the garden.',
        learnable: true
    },
    woodcraft: {
        title: 'Woodcraft',
        description: 'Can gather more wood.',
        learnable: true,
        descriptionExtra: 'Required for the hunters.' 
    },
    scavenger: {
        title: 'Scavenger',
        description: 'More likely to find stuff, and less likely to get into trouble.',
        learnable: true
    },
    shopkeeper: {
        title: 'Shopkeeper',
        description: 'Can work in shop and manage your goods.',
        learnable: false
    },
    cook: {
        title: 'Cook',
        description: 'Decreases chance of rotten food and for milkwarden',
        learnable: true,
        descriptionExtra: 'Useable for kitchen and milk farm assignment.'
    },
    doctor: {
        title: 'Doctor',
        description: 'Decreases chance of miscarriage and heals people twice as fast.',
        learnable: false,
        descriptionExtra: 'A must skill to work in the hospital. Decreases chance of miscarriage, treats knife wounds and reduces sickdays'
    },
    teacher: {
        title: "Teacher",
        learnable: false,
        description: "Can teach childrens in school"
    },
    mechanic: {
        title: "Mechanic",
        description: "Good with mechanics. Sometimes able to fix cars without needing parts",
        learnable: false,
    },
    fighter: {
        title: "Fighter",
        description: "Has advantages in cage fights",
        learnable: true,
    }
};

setup.getRandomSkills = function (count = 1) {
    var shuffledSkills = Object.keys(setup.skills).sort((a, b) => 0.5 - Math.random());

    return shuffledSkills.slice(0, count);
};

/** 
 * @returns has working hospital with assigned doctor?
 */
setup.hasWorkingHospital = function() {
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

/**
 * Has a hospital or guests with doctor skill
 * @returns 
 */
setup.hasDoctor = function() {
    return setup.hasWorkingHospital() || setup.getDoctors().length;
};

/**
 * All guests with the doctor skill
 * @returns [npc]
 */
setup.getDoctors = function() {
    var tmpDoctors = [];
    for (var i = 0; i < variables().guests.length; i++) {
        if ((variables().guests[i].skills ?? []).includes('doctor')) {
            tmpDoctors.push(variables().guests[i]);
        }
    }
    return tmpDoctors;
};

