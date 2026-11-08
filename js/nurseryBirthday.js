/*
 * Nursery birthdays: a caretaker suggests a small party the first time the player walks in on a child's birthday.
 * Everyone with a birthday that day shares the one party. Who comes depends on each child's age (see FRIENDS).
 * Passages: Nursery encounter - birthday, Nursery encounter - birthday gift.
 * $tmpEvent holds { cast: { carer }, birthdays: [ids], guests: [ids], optional: [ids], invited: [ids], giftIndex, gifted: { id: item name } }.
 * optional is parents the player has to send for first: slaves, anyone at work, and Characters. invited is those he has said yes to.
 * Distance doesn't matter: they knew what day it was and stayed close.
 */
setup.nurseryBirthday = {
    GUESTS_PER_SUPPLY: 5,
    MIN_SIBLING_AGE: 2,
    /* The caretakers can't stop for two hours while they're getting everyone up and out */
    EARLIEST_START: '09:00',
    /* School-age children are in class until then */
    AFTER_SCHOOL: '15:00',
    LAST_START: '19:00',
    /* Friends invited, from others in the same age range */
    FRIENDS: [
        { from: 3, to: 4, min: 2, max: 3 },
        { from: 5, to: 12, min: 2, max: 4 },
        { from: 13, to: 17, min: 3, max: 5 }
    ],
    SINGLE_MOM_BONUS: 3,

    /** Children having a birthday today. The day a baby is born doesn't count as one. */
    birthdayKids: function () {
        return setup.nurseryEncounters.healthyKids(1, 17).filter(kid => setup.npc.isBirthday(kid));
    },

    canHoldNow: function (kids) {
        const inClass = (variables().player.quests.school_built ?? false) && kids.some(kid => setup.getAge(kid) >= 5);
        return timeBetween(inClass ? this.AFTER_SCHOOL : this.EARLIEST_START, this.LAST_START);
    },

    /** Checked on each visit from the Youth district. Sets up $tmpEvent and returns true if the party comes up now. */
    start: function () {
        const v = variables();
        if (!setup.nurseryCare.isActive() || v.locationEvents.nursery_birthday) {
            return false;
        }
        const carers = setup.nurseryCare.atWork(v.weather);
        const kids = this.birthdayKids();
        if (!carers.length || !kids.length || !this.canHoldNow(kids)) {
            return false;
        }
        v.locationEvents.nursery_birthday = true;
        v.tmpEvent = {
            cast: { carer: carers.random().id },
            birthdays: kids.map(kid => kid.id),
            guests: this.guestList(kids).map(npc => npc.id),
            optional: this.optionalParents(kids).map(npc => this.personId(npc)),
            invited: [],
            giftIndex: 0,
            gifted: {}
        };
        return true;
    },

    /** Children who share a mother, or a father other than the player. His own children alone could fill the room. */
    siblings: function (kid) {
        const mother = kid.family?.mother;
        const father = kid.family?.father;
        return setup.nurseryEncounters.healthyKids(this.MIN_SIBLING_AGE, 17).filter(other => other !== kid
            && ((mother && other.family?.mother === mother) || (father && father !== 'mc' && other.family?.father === father)));
    },

    /** Adults free to walk into the nursery, the same people who can raise the idea of caretakers. Slaves aren't free to wander in. */
    freeParents: function () {
        return (variables().guests ?? []).filter(npc => setup.getAge(npc) >= 18 && !(npc.traits ?? []).includes('feral')
            && typeof npc.sick === 'undefined' && setup.nurseryCare.canApproach(npc));
    },

    /** The id to find someone by later. Some older Characters only go by their key in $characters. */
    personId: function (npc) {
        const characters = variables().characters ?? {};
        return npc.id ?? Object.keys(characters).find(key => characters[key] === npc);
    },

    /** How a parent stands for the party: { character, slave, working }, or null if they can't come at all. A caretaker is already in the room. */
    parentStatus: function (npc) {
        const v = variables();
        if (Object.values(v.characters ?? {}).includes(npc)) {
            return setup.npc.isLivingCharacter(npc) ? { character: true, slave: false, working: false } : null;
        }
        const school = setup.eveningSchool;
        const inHousehold = (v.guests ?? []).includes(npc) || (v.slaves ?? []).includes(npc);
        if (!inHousehold || typeof npc.sick !== 'undefined' || (npc.traits ?? []).includes('feral')) {
            return null;
        }
        const here = npc.assignedTo === 'caretaker';
        const working = !here && (setup.isAtWork(npc, v.weather) || school.attends(npc) || (school.isInstructor(npc) && school.isOpen()));
        return { character: false, slave: !here && (v.slaves ?? []).includes(npc), working: working };
    },

    attendingParents: function (kid) {
        return setup.nurseryEncounters.parents(kid).filter(npc => {
            const status = this.parentStatus(npc);
            return status && !status.character && !status.slave && !status.working;
        });
    },

    /** Parents who can only come if the player lets them, once each */
    optionalParents: function (kids) {
        const parents = kids.flatMap(kid => setup.nurseryEncounters.parents(kid)).filter(npc => {
            const status = this.parentStatus(npc);
            return status && (status.character || status.slave || status.working);
        });
        return parents.filter((npc, index) => parents.indexOf(npc) === index);
    },

    /** What the link says for a parent waiting on the player's say-so */
    inviteLabel: function (npc) {
        const status = this.parentStatus(npc);
        const name = setup.displayName(npc);
        if (!status) {
            return name;
        }
        if (status.character) {
            return 'Send word for ' + name + ' to come';
        }
        if (status.slave) {
            return 'Let ' + name + ' attend' + (status.working ? ' (takes the rest of the day off)' : '');
        }
        return 'Give ' + name + ' the rest of the day off to attend';
    },

    toggleInvite: function (id) {
        const invited = variables().tmpEvent.invited;
        const index = invited.indexOf(id);
        if (index < 0) {
            invited.push(id);
        } else {
            invited.splice(index, 1);
        }
    },

    /** Whoever was at work takes the rest of the day off */
    releaseInvited: function (npcs) {
        npcs.filter(npc => this.parentStatus(npc)?.working && typeof npc.rest === 'undefined').forEach(npc => {
            npc.rest = { days: 1, desc: 'Given the rest of the day off for a birthday party', id: 'resting' };
        });
    },

    friends: function (kid, taken) {
        const age = setup.getAge(kid);
        const band = this.FRIENDS.find(item => age >= item.from && age <= item.to);
        if (!band) {
            return [];
        }
        const solitary = setup.personality.has(kid, 'solitary') ? 1 : 0;
        const outgoing = setup.personality.has(kid, 'outgoing') ? 1 : 0;
        const count = random(Math.max(0, band.min - solitary), Math.max(0, band.max + outgoing - solitary));
        return setup.nurseryEncounters.healthyKids(band.from, band.to).filter(other => !taken.includes(other)).shuffle().slice(0, count);
    },

    /** Everyone at the party apart from the birthday children, once each */
    guestList: function (kids) {
        const invited = [...kids];
        const invite = npc => {
            if (!invited.includes(npc)) {
                invited.push(npc);
            }
        };
        kids.forEach(kid => {
            this.attendingParents(kid).forEach(invite);
            this.siblings(kid).forEach(invite);
        });
        kids.forEach(kid => this.friends(kid, invited).forEach(invite));
        return invited.filter(npc => !kids.includes(npc));
    },

    /** "Mia is turning 5" or "Mia and Tom are both turning 5, and Ann is turning 8" */
    agesLine: function (kids) {
        const ages = [...new Set(kids.map(kid => setup.getAge(kid)))];
        return ages.map(age => {
            const names = kids.filter(kid => setup.getAge(kid) === age).map(kid => kid.name);
            if (names.length === 1) {
                return names[0] + ' is turning ' + age;
            }
            const list = names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
            return list + (names.length === 2 ? ' are both turning ' : ' are all turning ') + age;
        }).join(', and ');
    },

    /** Parents at the party who could speak for it, mothers of the player's children first, then mothers, then fathers */
    partyParents: function (kids, guests) {
        const encounters = setup.nurseryEncounters;
        const parents = kids.flatMap(kid => encounters.parents(kid)).filter(npc => guests.includes(npc));
        const motherOf = (npc, kid) => !!kid.family?.mother && setup.getNpcById(kid.family.mother) === npc;
        const rank = npc => kids.some(kid => motherOf(npc, kid) && encounters.isOwnChild(kid)) ? 0 : kids.some(kid => motherOf(npc, kid)) ? 1 : 2;
        return parents.filter((npc, index) => parents.indexOf(npc) === index).sort((a, b) => rank(a) - rank(b));
    },

    /** ", ranging in age from 4 to 11", or ", age 7" when there's only one age to give */
    ageRange: function (kids) {
        const ages = kids.map(kid => setup.getAge(kid));
        const youngest = Math.min(...ages);
        const oldest = Math.max(...ages);
        if (youngest === oldest) {
            return kids.length > 1 ? ', all age ' + youngest : ', age ' + youngest;
        }
        return ', ranging in age from ' + youngest + ' to ' + oldest;
    },

    /** Who turns up, in the order they arrive: parents and siblings, then friends. Empty if nobody is coming. */
    arrivals: function (kids, guests, carer) {
        const parents = this.partyParents(kids, guests).filter(npc => npc !== carer);
        const siblings = guests.filter(npc => kids.some(kid => this.siblings(kid).includes(npc)));
        const friends = guests.filter(npc => setup.getAge(npc) < 18 && !siblings.includes(npc));
        const counted = (group, one, many) => '<strong>' + group.length + '</strong> ' + (group.length === 1 ? one : many) + this.ageRange(group);
        const lines = [];
        const family = parents.map(npc => setup.displayName(npc)).join(' and ');
        if (parents.length && siblings.length) {
            lines.push(family + ' ' + (parents.length === 1 ? 'is' : 'are') + ' the first to arrive, bringing ' + counted(siblings, 'sibling', 'siblings') + '.');
        } else if (parents.length) {
            lines.push(family + ' ' + (parents.length === 1 ? 'is' : 'are') + ' the first to arrive.');
        } else if (siblings.length) {
            lines.push('The family comes first: ' + counted(siblings, 'sibling', 'siblings') + '.');
        }
        if (friends.length === 1) {
            lines.push((lines.length ? 'Then ' : '') + (lines.length ? 'a friend comes in' : 'A friend comes in') + this.ageRange(friends) + '.');
        } else if (friends.length) {
            lines.push((lines.length ? 'Then come the friends: ' : 'The friends come in together: ') + counted(friends, 'child', 'children') + '.');
        }
        return lines.join(' ');
    },

    /** Resolves ids from $tmpEvent, skipping anyone who has gone */
    people: function (ids) {
        return (ids ?? []).map(id => setup.getNpcById(id)).filter(Boolean);
    },

    /** Under-5s won't keep still for long, so a party with only them is shorter. An older child brings it up to the full two hours. */
    partyHours: function (kids) {
        return kids.every(kid => setup.getAge(kid) <= 4) ? 1 : 2;
    },

    /** "1 hour" or "2 hours", for the text */
    partyLength: function (kids) {
        const hours = this.partyHours(kids);
        return hours + (hours === 1 ? ' hour' : ' hours');
    },

    /** Candy and soda needed, one of each per GUESTS_PER_SUPPLY guests or part of that */
    supplies: function (guestCount) {
        const amount = Math.max(1, Math.ceil(guestCount / this.GUESTS_PER_SUPPLY));
        return { candy: amount, soda: amount };
    },

    /** Treats make the children happier and do more for their behavior. Adult guests enjoy it the same either way. */
    holdParty: function (kids, guests, invited, treats) {
        const encounters = setup.nurseryEncounters;
        if (treats) {
            encounters.consume(this.supplies(guests.length));
        }
        this.releaseInvited(invited);
        kids.forEach(kid => encounters.change(kid, 'happy', treats ? 5 : 3, treats ? 7 : 4));
        guests.forEach(npc => {
            const isChild = setup.getAge(npc) < 18;
            encounters.change(npc, 'happy', isChild && !treats ? 1 : 3, isChild && !treats ? 2 : 4);
        });
        setup.nurseryBehavior.change(treats ? 5 : 3, treats ? 10 : 5);
    },

    /** The player says no. Hits harder when it's his own child. */
    refuseParty: function (kids, carer) {
        const encounters = setup.nurseryEncounters;
        kids.forEach(kid => {
            const scale = encounters.isOwnChild(kid) ? 2 : 1;
            const mother = kid.family?.mother && kid.family.mother !== 'mc' ? setup.getNpcById(kid.family.mother) : null;
            [kid, mother].filter(Boolean).forEach(npc => {
                encounters.change(npc, 'happy', -5 * scale, -3 * scale);
                encounters.change(npc, 'relationship', -5 * scale, -3 * scale);
            });
        });
        encounters.change(carer, 'happy', -6, -3);
    },

    /** What the player could give a child of this age */
    giftOptions: function (kid) {
        const age = setup.getAge(kid);
        if (age <= 4) return ['plush'];
        if (age <= 12) return ['plush', 'flower', 'necklace_cheap'];
        return age >= 15 ? ['necklace_cheap', 'cosmetics', 'knife', 'bow'] : ['necklace_cheap', 'cosmetics'];
    },

    giveGift: function (kid, item) {
        const encounters = setup.nurseryEncounters;
        setup.cabinInventory.drop(item);
        encounters.change(kid, 'happy', 5, 7);
        const parents = encounters.parents(kid);
        const singleMom = !encounters.isOwnChild(kid) && parents.length === 1 && parents[0] === setup.getNpcById(kid.family?.mother);
        parents.forEach(npc => encounters.change(npc, 'relationship', 3 + (singleMom ? this.SINGLE_MOM_BONUS : 0), 5 + (singleMom ? this.SINGLE_MOM_BONUS : 0)));
    },

    /** Only matters when the child is his own */
    skipGift: function (kid) {
        const encounters = setup.nurseryEncounters;
        if (!encounters.isOwnChild(kid)) {
            return;
        }
        encounters.change(kid, 'happy', -7, -5);
        encounters.parents(kid).forEach(npc => encounters.change(npc, 'relationship', -5, -3));
    }
};
