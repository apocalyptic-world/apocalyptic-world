$(document).on(':passagedisplay', function () {
    checkVideos();

    $('input[type="number"]').attr({
        "min" : 1
    }).keyup(function(e) {
        if (!Number($(this).val()) && $(this).val() !== '' || Number($(this).val()) && $(this).val() < 1) {
            $(this).val(1);
            return false;
        }
    });
});

$(document).on('click', (e) => {
    if ($(e.target).hasClass('macro-linkreplace')){
        checkVideos();
    }
});

$(document).scroll(function() {
    checkVideos();
});

function checkVideos() {
    setTimeout(function() {
        $('video').each(function(){
            $(this)[0].pause();
            $(this)[0].volume = SugarCube.settings.volume / 100;
            if(!SugarCube.settings.autoplay) {
                return;
            }
            if ($(this).visible()) {
                $(this)[0].play();
            } else {
                $(this)[0].pause();
            }
        });
    }, 500);
}

window.hasTime = function (hours, minutes, max = '23:59') {
    var current = new Date(variables().gameDate);
    var minTime = new Date(current);
    minTime.setHours(8);
    minTime.setMinutes(0);
    var maxTime = new Date(current);

    var maxTimeSplit = max.split(':');
    maxTime.setHours(maxTimeSplit[0]);
    maxTime.setMinutes(maxTimeSplit[1]);

    if(hours) {
        current.setHours(current.getHours() + hours);
    }
    if (minutes) {
        current.setMinutes(current.getMinutes() + minutes);
    }

    return current >= minTime && current <= maxTime;
};

window.isMetChar = function(name) {
    return (typeof variables().characters[name] !== 'undefined' && Object.keys(variables().characters[name]).length > 0 && typeof variables().characters[name].quests !== 'undefined');
};

window.randomInteger  = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

window.blackjackDeck = function() {
    var suits = ["Spades", "Hearts", "Diamonds", "Clubs"];
    var values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    var deck = new Array();
    for (var i = 0 ; i < values.length; i++)
    {
        for(var x = 0; x < suits.length; x++)
        {
            var weight = parseInt(values[i]);
            if (values[i] == "J" || values[i] == "Q" || values[i] == "K")
                weight = 10;
            if (values[i] == "A")
                weight = 11;
            var card = { value: values[i], vuit: suits[x], weight: weight };
            deck.push(card);
        }
    }

    return deck;
};

window.blackjackGiveCard = function(to) {
    var key = Math.floor((Math.random()*variables().blackjack.deck.length));

    to.push(variables().blackjack.deck[key]);
    variables().blackjack.deck.splice(key, 1);
};

window.blackjackCountCards  = function (who) {
    var count = 0;
    for (var bj_i = 0; bj_i < who.length; bj_i++) {
        count += parseInt(who[bj_i].weight);
    }

    return count;
};


setup.fightIsKilled = function (attacks) {
    for (var attacks_i = 0; attacks_i < attacks.length; attacks_i++) {
        if (attacks[attacks_i] !== 'hit') {
            return true;
        }
    }
    return false;
};

setup.perkHas = function (perk) {
    return typeof variables().player.perks !== 'undefined' && typeof variables().player.perks[perk] !== 'undefined';
};

setup.perkList = {
    drunk: {
        title: "You're drunk",
        desc: "You're drunk. Your strength is decreased and it's harder to get your dick hard",
        days: 0
    },
    beaten: {
        title: "Your body hurts",
        desc: "You got your ass beaten. Wake up with less energy",
        days: 3
    },
    bleeding: {
        title: "You're bleeding",
        desc: "You're bleeding. Use bandage or you will die",
        days: 2
    },
    fertility: {
        title: "Your sperm is overpowered",
        desc: "Doubles chance to impregnate",
        days: 0
    }
};

setup.gifts = {
    necklace_cheap: {
        rel: 4
    },
    flower: {
        rel: 3
    },
    cosmetics: {
        rel: 4
    },
    tobacco: {
        rel: 3
    },
    alcohol: {
        rel: 3
    },
    candy: {
        rel: 3
    },
    soda: {
        rel: 4
    },
    whippit: {
        rel: 5
    },
    xanax: {
        rel: 5
    },
    glue: {
        rel: 4
    },
    plush: {
        rel: 5
    },
    sextoy: {
        rel: 5
    }
};

setup.getRandomGifts = function (count = 1, exclude) {
    const _gifts = clone(setup.gifts);
    if (exclude) {
        for (let excludeGift in exclude) {
            delete _gifts[exclude[excludeGift]];
        }
    }
    var shuffledGifts = Object.keys(_gifts).sort((a, b) => 0.5 - Math.random());

    return shuffledGifts.slice(0, count);
};

setup.inventoryNpc = [
    'knife',
    'bow',
    'gas_mask',
    'axe',
    'dumbbell',
    'condom'
];

setup.inventoryManageable = {
    food: {
        price: 1,
        range: [1, 10],
        chance: 90
    },
    hay: {
        price: 1,
        range: [1, 5],
        chance: 80
    },
    wood: {
        price: 1,
        range: [1, 10],
        chance: 20
    },
    champagne: {
        price: 10,
        range: [1, 1],
        chance: 10
    },
    antibiotics: {
        price: 5,
        range: [1, 2],
        chance: 10
    },
    rope: {
        price: 1,
        range: [1,5],
        chance: 5
    },
    solar_panel: {
        price: 20,
        range: [1, 2],
        chance: 3
    },
    bandage: {
        price: 5,
        range: [1, 5],
        chance: 5
    },
    knife: {
        price: 30,
        range: [1, 1],
        chance: 2
    },
    glass: {
        price: 2,
        range: [1, 2],
        chance: 3
    },
    plastic: {
        price: 4,
        range: [2, 6],
        chance: 5
    },
    milk: {
        price: 1,
        range: [1, 10],
        chance: 90
    },
    towel: {
        price: 10,
        range: [1, 5],
        chance: 60
    },
    cloth: {
        price: 6,
        range: [1, 5],
        chance: 50
    }
};

setup.getPersonsForLocation = function (persons, location) {
    var tmpPersons = [];
    for (var i = 0 ; i < persons.length; i++) {
        if (persons[i].assignedTo === location) {
            tmpPersons.push(i);
        }
    }
    return tmpPersons;
};
/**
 * returns a list of actual NPCs, not just index in the list
 */
setup.getNpcsForLocation = function (persons, location) {
    const npcs = [];
    for (const npc of persons) {
        if (npc.assignedTo === location) {
            npcs.push(npc);
        }
    }
    return npcs;
};
setup.getBirthDate = function(yearsAgo) {
    var now = variables().gameDate;
    var earliestDate = new Date(now.getFullYear() - yearsAgo, 0, 1);
    var latestDate = new Date(now.getFullYear() - yearsAgo + 1, 0, 0);
    var randomTime = earliestDate.getTime() + Math.random() * (latestDate.getTime() - earliestDate.getTime());
    return new Date(randomTime);
};

setup.getAge = function(person, approx) {
    var startDate = person.birthDate;
    var startYear = startDate.getFullYear();
    var endYear = variables().gameDate.getFullYear();
    var startMonth = startDate.getMonth();
    var endMonth = variables().gameDate.getMonth();
    var startDay = startDate.getDate();
    var endDay = variables().gameDate.getDate();

    var yearsDiff = endYear - startYear;

    if (endMonth < startMonth || (endMonth === startMonth && endDay < startDay)) {
        yearsDiff--;
    }

    if (approx) {
        var approxAdd = window.randomInteger(-6,6);
        yearsDiff += approxAdd;
        if (yearsDiff < 18) {
            yearsDiff = 18;
        }
        yearsDiff = yearsDiff + ' (approx)';
    }

    return yearsDiff;
};


setup.assignedToCount = function(location) {
    var count = 0;
    for (var i = 0 ; i < variables().slaves.length; i++) {
        if (variables().slaves[i].assignedTo === location) {
            count++;
        }
    }
    for (var i = 0 ; i < variables().guests.length; i++) {
        if (variables().guests[i].assignedTo === location) {
            count++;
        }
    }

    return count;
};

setup.percentageChance = function(percentage) {
    var random = Math.random();
    var threshold = percentage / 100;
    return random < threshold;
};


setup.calculateDaysBetween = function (start, end) {
    var timezoneOffset = start.getTimezoneOffset() - end.getTimezoneOffset();
    var diff = end - start;
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var adjustedDays = days + (timezoneOffset / 60 / 24);
    return Math.round(adjustedDays,2);
};

setup.getRandomPersons = function(persons, limit = 2) {
    return shuffle(persons).slice(0, limit);
};

setup.getRandomPersonIds = function(persons, limit = 2) {
    var randomIds = [];
    var randomPersonList = clone(persons);
    while (randomIds.length < limit && randomPersonList.length) {
        var randomIndex = Math.floor(Math.random() * randomPersonList.length);
        if (!randomIds.includes(randomIndex)) {
            randomIds.push(randomIndex);
            randomPersonList.splice(randomIndex, 1);
        }
    }

    return randomIds;
};

setup.generateUniqueKey = function(npc) {
    var timestamp = Date.now();
    var uniqueKey = npc.name + npc.beauty + timestamp.toString();
    return uniqueKey;
};

setup.getNpcAgeDescription = function(npc) {
    var age = setup.getAge(npc);
    if(npc.gender == 0 || npc.gender == 2) {
        if (age < 4) {
            return 'baby';
        } else if (age < 13) {
            return 'kid';
        } else if(age < 18) {
            return 'teenage girl';
        } else if(age < 25) {
            return 'young woman';
        } else if(age < 40) {
            return 'woman';
        } else if(age < 60) {
            return 'mature woman';
	}
        return 'old woman';
    }
	if (age < 4) {
		return 'baby';
	} else if (age < 13) {
		return 'kid';
	} else if(age < 18) {
		return 'teenage boy';
	} else if(age < 25) {
		return 'young man';
	} else if(age < 40) {
		return 'man';
	} else if(age < 60) {
		return 'mature man';
	}
	return 'old man';
};

setup.objectSort = function(unordered) {
    return Object.entries(unordered)
        .sort(([keyA], [keyB]) => keyA > keyB)
        .reduce((obj, [key,value]) => Object.assign(obj, {[key]: value}), {});
};

setup.objectSortReverse = function(unordered) {
    return Object.entries(unordered)
        .sort(([keyA], [keyB]) => keyA > keyB).reverse()
        .reduce((obj, [key,value]) => Object.assign(obj, {[key]: value}), {});
};

setup.pronounceWho = function(npc, capitalize = false) {
    if (npc.gender == 1 || npc.gender == 3 ) {
        if (capitalize) {
            return 'Him';
        }
        return 'him';
    }
    if (capitalize) {
        return 'Her';
    }
    return 'her';
};

setup.pronounceWhos = function(npc, capitalize = false) {
    if (npc.gender == 1 || npc.gender == 3 ) {
        if (capitalize) {
            return 'His';
        }
        return 'his';
    }
    if (capitalize) {
        return 'Her';
    }
    return 'her';
};

setup.pronounceWhat = function (npc, capitalize = false) {
    if (npc.gender == 1 || npc.gender == 3 ) {
        if (capitalize) {
            return 'He';
        }
        return 'he';
    }
    if (capitalize) {
        return 'She';
    }
    return 'she';
};

setup.getNpcById = function(id) {
    var npcList = variables().slaves.concat(variables().guests, (variables().nursery ?? []));
    for (var i = 0; i < npcList.length; i++) {
        if (npcList[i].id === id) {
            return npcList[i];
        }
    }

    for (var i in variables().characters) {
        if(variables().characters[i].id && variables().characters[i].id === id) {
            return variables().characters[i];
        }
    }

    if (id === 'mc') {
        return variables().player;
    }

    return null;
};

setup.getGuestIndexById = function(id) {
    var guests = variables().guests;
    for (var i = 0; i < guests.length; i++) {
        if (guests[i].id === id) {
            return i;
        }
    }
    return null;
};

window.ucfirst = function (text) {
    return text.slice(0,1).toUpperCase() + text.slice(1);
};

setup.getAvailablePersons18yo = function (persons) {
    var output = {};
    for (var i = 0; i < persons.length; i++) {
        if (setup.getAge(persons[i]) < 18) {
            continue;
        }
        if (typeof output[persons[i].gender] === 'undefined') {
            output[persons[i].gender] = [];
        }
        output[persons[i].gender].push(i);
    }

    return output;
};

setup.getAvailablePersons18yoVirgins = function (persons) {
    var output = {};
    for (var i = 0; i < persons.length; i++) {
        if (setup.getAge(persons[i]) < 18 || !persons[i].virgin) {
            continue;
        }
        if (typeof output[persons[i].gender] === 'undefined') {
            output[persons[i].gender] = [];
        }
        output[persons[i].gender].push(i);
    }

    return output;
};

setup.shopGetDefaultInput = function (item, type)
{
    if (
        typeof variables().player.manageGoods === 'undefined' ||
        typeof variables().player.manageGoods[item] === 'undefined' ||
        typeof variables().player.manageGoods[item][type] === 'undefined'
    ) {
        return 0;
    }

    return variables().player.manageGoods[item][type] ?? 0
};

setup.blinkScreen = function()
{
    $("#blink-screen").addClass('show').fadeOut(1400, function() {
        $(this).removeClass("show");
    });
};

setup.displayName = function (npc) {
    return '<span class="gender-' + setup.genderClass(npc) + '"><span class="glyph" data-balloon-length="medium" aria-label="Age: ' + setup.getAge(npc) + ', Beauty: ' + npc.beauty + ', Relationship: '+ npc.relationship+' ' + (npc.virgin ? ', (Virgin)' : '') + '" data-balloon-pos="up-left"><strong>' + npc.name + '</strong></span></span>';
};

setup.getNpcByKey = function (key) {
    var splitKey = key.split(':');
    if (splitKey[0] === 'guest') {
        return variables().guests[splitKey[1]];
    } else if (splitKey[0] === 'slave') {
        return variables().slaves[splitKey[1]];
    }

    return '???';
};

setup.sortObjectKeysDescending = function(obj) {
    const sortedKeys = Object.keys(obj).map(Number).sort((a, b) => b - a);

    const sortedObject = {};
    for (const key of sortedKeys) {
        sortedObject[key] = obj[key];
    }

    return sortedObject;
};

setup.getRandomPersonIdsGirls = function(persons, limit = 2) {
    var randomIds = [];
    var randomPersonList = clone(persons);
    while (randomIds.length < limit && randomPersonList.length) {
        var randomIndex = Math.floor(Math.random() * randomPersonList.length);
        if (!randomIds.includes(randomIndex)) {
            if ((randomPersonList[randomIndex] ?? false) && !randomPersonList[randomIndex].gender && setup.getAge(randomPersonList[randomIndex])) {
                randomIds.push(randomIndex);
            }
            randomPersonList.splice(randomIndex,1);
        }
    }

    return randomIds;
};

setup.getHornyPersons = function (persons) {
    var hornyPersons = {};
    for (var i = 0; i < persons.length; i++) {
        if (setup.getAge(persons[i]) >= 18 && persons[i].horny >= 80) {
            if (typeof hornyPersons[persons[i].gender] === 'undefined') {
                hornyPersons[persons[i].gender] = [];
            }
            hornyPersons[persons[i].gender].push(i);
        }
    }

    return hornyPersons;
};

setup.decrypt = function(encryptedText) {
    var decrypted = '';
    for (var i = 0; i < encryptedText.length; i++) {
        var char = encryptedText.charAt(i);
        if (char.match(/[a-zA-Z0-9]/)) {
            const charCode = char.charCodeAt(0);
            var offset = 0;

            if (char.match(/[a-z]/)) {
                offset = 97;
            } else if (char.match(/[A-Z]/)) {
                offset = 65;
            } else if (char.match(/[0-9]/)) {
                offset = 48;
            }

            var decryptedChar = String.fromCharCode(((charCode - offset - 1 + 36) % 36) + offset);
            decrypted += decryptedChar;
        } else {
            decrypted += char;
        }
    }
    return decrypted;
};

setup.getRandomElement = function(items) {
    return items[Math.floor(Math.random()*items.length)];
};

setup.commonValues = function(allArrays) {
	var array = allArrays[0] ?? [];
	var length = allArrays.length;
	for (var i = 1; i < length; i++) {
		array = array.filter(value => allArrays[i].includes(value));
	}
    return array;
};

setup.distinctValues = function(allArrays) {
	var array = [];
	var length = allArrays.length;

	for (var i = 0; i < length; i++) {
        var arrayLength = allArrays[i].length;

        for (var j = 0; j < arrayLength; j++) {
            var value = allArrays[i][j];

            if (!array.includes(value)){
                array.push(value);
            }
        }   
    }
    return array;
};

setup.propertyMatchIndexes = function(array, property, value = true, operator = '==') {
	if (operator == '==') {
		array = array.map((item, i) => (item[property] ?? false) == value ? i : -1);
	} else if (operator == '!=') {
		array = array.map((item, i) => (item[property] ?? false) != value ? i : -1);
	} else if (operator == '>') {
		array = array.map((item, i) => (item[property] ?? false) > value ? i : -1);
	} else if (operator == '<') {
		array = array.map((item, i) => (item[property] ?? false) < value ? i : -1);
	} else if (operator == '>=') {
		array = array.map((item, i) => (item[property] ?? false) >= value ? i : -1);
	} else if (operator == '<=') {
		array = array.map((item, i) => (item[property] ?? false) <= value ? i : -1);
	} else if (operator == 'includes') {
		array = array.map((item, i) => (item[property] ?? []).includes(value) ? i : -1);
	} else if (operator == '!includes') {
		array = array.map((item, i) => !(item[property] ?? []).includes(value) ? i : -1);
	} else {
		array = [];
	}
    return array.filter(index => index !== -1);
};

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}

	return array;
};

/* convert map.keys() to a regular list since sugarcube is stupid when it comess to Map */
setup.mapKeys2list = function(map) {
    const list = [];
    for(const key of map.keys()) {
        list.push(key);
    };
    return list;
};

/*
    chapel, simple inventory lacks hasTag(), hasAnyTag() but have the parameter tags
    - _item.hasTag(tag) <=> _item.tags.includes(tag)
    - _item.hasAnyTag(tag) <=> setup.includesAny(_item.tags, tags)
    - _item.hasAllTag(tag) <=> setup.includesAll(_item.tags, tags)

    Of course these utility functions will work for any arrrays
*/

setup.includesAny = function(have, want) {
    return want.some(i => have.includes(i));
};
setup.includesAll = function(have, want) {
    return want.every(i => have.includes(i));
}; 

setup.sexChance = function (person, gender = 1, beauty) {
    var likesList = ['likesGirls','likesGuys','likesTGirls','likesTGuys'];
    var appeal = (beauty ?? person.relationship);

	if ((person.traits ?? []).includes('nymphomaniac')) {
		return 100;
	} else if (!person[likesList[gender]]) {
		return Math.floor(Math.max(person.sub, person.drunk ?? 0)/2);
	} else {
		return Math.max(appeal, person.horny, person.sub, person.drunk ?? 0);
	}
};

setup.suicideChance = function (person) {
    var happy = Math.max(-100, Math.min(100, person.happy));
    var sub = Math.max(0, Math.min(100, person.sub));

    if (happy >= 0) {
        return 0;
    }

    let baseChance = -happy;
    let subMultiplier = 1 - sub / 100;
    let finalChance = Math.max(2, Math.min(100, baseChance * subMultiplier));

    return finalChance;
  }

  setup.pregnancyChance = function (person, fertility = false) {
    var chance = 0;
    var age = setup.getAge(person);
    var breeder = (person.traits ?? []).includes('breeder');

    if(typeof person.pregnancy !== 'undefined' || person.gender) {
        return 0;
    }

    if(age < 18) {
        return 0;
    } else if(age < 25) {
        chance = 24;
    } else if(age < 40) {
        chance = 16;
    } else if(age < 60) {
        chance = 8;
    }

    if(breeder) {
        chance = Math.min(100, chance*2);
    }

    if(fertility) {
        chance = Math.min(100, chance*2);
    }

    return chance;
};

setup.drink = function (person, glass = 1, alcohol = 25) {
    alcohol = Math.max(alcohol + window.randomInteger(0, 5) - window.randomInteger(0, 5), 0);
    var resistance = 1 + (person.endurance ?? 0) / 200;
    person.drunk = (person.drunk ?? 0) + Math.round(glass * alcohol / resistance);

	return person;
};

setup.drunkDescription = function (person) {
    const desc = ['buzzed', 'euphoric', 'tipsy', 'drunk'];
    var drunk = person.drunk ?? 0;
    var state = Math.floor((drunk - 1) / 25);

    if (drunk == 0) {
        return 'sober';
    } else if (drunk > 100) {
        return 'wasted';
    } else {
        return desc[state];
    }
};

window.openTab = function(evt, name) {
    var i, tabcontent, tablinks;
  
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    document.getElementById(name).style.display = "block";
    evt.currentTarget.className += " active";
  }

  /**
   * pretty prints a fractional number
   * @param   {Number} n         fractional number to pretty print
   * @param   {Number} divisor   
   * @returns {String}           pretty print version of n
   */
setup.ppFraction = function(n, divisor = 3) {
    const intPart  = Math.trunc(n);
    const quotient = Math.abs(n - intPart);
    const dividend = Math.round(quotient*divisor);
    const fractext = dividend ? '&nbsp;<span class="frac"><sup>' + dividend  + '</sup><span>&frasl;</span><sub>' + divisor + '</sub></span>': '';
    const inttext =  intPart  ? intPart : '';
    return inttext + fractext;
}

setup.getKeyByValue = function(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }
