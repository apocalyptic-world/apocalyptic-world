/**
 * Creating people: setup.humans.newAdult (a random adult, or a kid coming of age) and setup.humans.newBorn (a baby of
 * a mother and maybe a father). Both start from setup.humans.humanBeing, the fields every person has.
 *
 * The functions return plain objects (no classes), as the game keeps them in story variables. They don't read
 * SugarCube state: the game date comes in as `now` and randomness as `rng` (a function like Math.random), so they can
 * be unit tested (test/humans.test.cjs). They do call the game's roll helpers (setup.ageRoll, setup.setSexuality, …).
 *
 * Widgets: <<newgirl>>, <<newguy>>, <<newtransgirl>>, <<newtransguy>> (widgets/npc/) and <<newchild>>
 * (widgets/npc/childbirth.tw) wrap these.
 */
setup.humans = (function () {
    /** Body parts by gender (0 woman, 1 man, 2 trans woman, 3 trans man): the one list of who has what. setup.sexActs
        (hasPussy / hasCock / hasBreasts) reads it through has() and adds only the MC, strap-ons and breasts from
        surgery (anyone with a breasts field). */
    const ANATOMY = Object.freeze({
        pussy: Object.freeze([0, 3]),
        breasts: Object.freeze([0, 2]),
        dick: Object.freeze([1, 2])
    });

    /** Traits a baby never gets from a parent: injuries, a wild upbringing and lactation. */
    const NOT_INHERITED = Object.freeze(['feral', 'crippled', 'milker']);

    /** Sizes for breasts and dicks. */
    const SIZES = Object.freeze(['small', 'medium', 'big']);

    /** Fields only kids have; removed when they come of age. */
    const CHILD_ONLY = Object.freeze(['teach', 'teachAdvStudy']);

    const FEMALE_NAMED = [0, 2];

    /* ---------- randomness (rng is a function returning [0, 1), like Math.random) ---------- */

    const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
    const pick = (rng, list) => list[Math.floor(rng() * list.length)];
    const chance = (rng, percent) => rng() * 100 < percent;

    /* ---------- helpers ---------- */

    /** True when someone of this gender has this body part ('pussy', 'breasts' or 'dick'). */
    function has(gender, part) {
        return (ANATOMY[part] ?? []).includes(gender);
    }

    /**
     * A random version 4 UUID, e.g. "3b241101-e2bb-4255-8caf-4136c566a962". Uses crypto.randomUUID where the page
     * allows it (https, localhost, file://) and builds one from crypto.getRandomValues otherwise.
     */
    function newId(cryptoApi = globalThis.crypto) {
        if (typeof cryptoApi?.randomUUID === 'function') {
            return cryptoApi.randomUUID();
        }
        const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;    // version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80;    // RFC 4122 variant
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    }

    /** A deep copy of plain data (objects, arrays, Dates, Sets, Maps). */
    function copyPlain(value) {
        if (value instanceof Date) return new Date(value.getTime());
        if (value instanceof Set) return new Set(Array.from(value, copyPlain));
        if (value instanceof Map) return new Map(Array.from(value, ([k, v]) => [copyPlain(k), copyPlain(v)]));
        if (Array.isArray(value)) return value.map(copyPlain);
        if (value && typeof value === 'object') {
            const out = {};
            for (const key of Object.keys(value)) out[key] = copyPlain(value[key]);
            return out;
        }
        return value;
    }

    /** A random birthday for someone who is `age` years old on `now` (same as setup.getBirthDate). */
    function birthDateFor(age, now, rng) {
        const latest = new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
        const earliest = new Date(now.getFullYear() - age - 1, now.getMonth(), now.getDate() + 1);
        return new Date(earliest.getTime() + rng() * (latest.getTime() - earliest.getTime()));
    }

    function namesFor(gender) {
        return FEMALE_NAMED.includes(gender) ? setup.npcFemaleNames : setup.npcMaleNames;
    }

    /** Removes body fields this person's gender doesn't have (e.g. a boy's pussy from the old <<newchild>>). */
    function fitBody(npc) {
        for (const part of Object.keys(ANATOMY)) {
            if (!has(npc.gender, part)) {
                delete npc[part];
            }
        }
        return npc;
    }

    /* ---------- the three creators ---------- */

    /**
     * The fields every person has, at any age. Body fields depend on gender: `pussy` (experience, starts at 0),
     * `breasts` and `dick` (sizes from body, when given) only exist for the genders that have them.
     * @param {{ gender: number, name: string, birthDate: Date, id?: string,
     *           looks?: { race?, naturalHair?, hair?, eyes?, beauty? }, body?: { breasts?, dick? } }} p
     */
    function humanBeing({ gender, name, birthDate, id = newId(), looks = {}, body = {} }) {
        const person = {
            id,
            gender,
            name,
            birthDate,

            race: looks.race ?? 'white',
            naturalHair: looks.naturalHair ?? 'brown',
            hair: looks.hair ?? looks.naturalHair ?? 'brown',
            eyes: looks.eyes ?? 'brown',
            beauty: looks.beauty ?? 50,

            relationship: 0,
            happy: 50,
            food: 100,
            horny: 0,
            sub: 0,
            corruption: 0,
            strength: 0,
            endurance: 0,

            location: null,
            assignedTo: null,
            talked: false,

            personality: [],
            likes: [],
            dislikes: [],
            traits: [],
            skills: [],
            quests: {},

            likesGuys: false,
            likesGirls: false,
            likesTGuys: false,
            likesTGirls: false,
            guys: 0,
            girls: 0,
            tguys: 0,
            tgirls: 0,
            anal: 0,
            bj: 0,
            dp: 0
        };
        if (has(gender, 'pussy')) person.pussy = 0;
        if (has(gender, 'breasts') && body.breasts) person.breasts = body.breasts;
        if (has(gender, 'dick') && body.dick) person.dick = body.dick;
        return person;
    }

    /**
     * A baby of mother (and father, when known), born on `now`. Doesn't change the parents: call linkFamily and
     * endPregnancy for that.
     * Looks come from the mother (race from either parent); girls get the mother's breast size and her traits
     * (without NOT_INHERITED) plus one random trait; everyone gets one of the father's traits. The baby is a virgin
     * with a straight placeholder orientation (the real one is rolled when they come of age, see newAdult).
     * @param {{ gender: number, mother: object, father?: object|null, now: Date, name?: string, rng?: () => number }} p
     */
    function newBorn({ gender, mother, father = null, now, name, rng = Math.random }) {
        const race = pick(rng, [mother.race, father?.race ?? mother.race]);
        const naturalHair = mother.naturalHair ?? mother.hair;
        const child = humanBeing({
            gender,
            name: name ?? pick(rng, namesFor(gender)),
            birthDate: new Date(now.getTime()),
            looks: {
                race,
                naturalHair,
                hair: naturalHair,
                eyes: setup.eyesRoll(race, naturalHair),
                beauty: mother.beauty
            },
            body: { breasts: mother.breasts }
        });

        Object.assign(child, {
            happy: randInt(rng, 40, 60),
            corruption: randInt(rng, 0, 50),
            sub: randInt(rng, 0, 30),
            horny: randInt(rng, 0, 30),
            strength: Math.round((mother.strength ?? 0) / 2),
            personality: setup.personalityTraits(pick(rng, [1, 2, 2])),
            virgin: true,
            orgasms: 0
        });
        child.likes = setup.getRandomGifts(pick(rng, [1, 2]));
        child.dislikes = setup.getRandomGifts(pick(rng, [1, 2]), child.likes);
        if (FEMALE_NAMED.includes(gender)) {
            child.likesGuys = true;
        } else {
            child.likesGirls = true;
        }
        child.clothes = setup.getRandomNpcClothes(child);

        if (FEMALE_NAMED.includes(gender)) {
            const inherited = (mother.traits ?? []).filter(t => !NOT_INHERITED.includes(t));
            const extra = setup.getRandomTraits(child, 1, (mother.traits ?? []).concat(NOT_INHERITED));
            child.traits = inherited.concat(extra ?? []);
        }
        if (father && Array.isArray(father.traits)) {
            const notFromFather = Object.keys(setup.traits ?? {}).filter(t => !father.traits.includes(t));
            const exclude = child.traits.concat(child.traitsLocked ?? [], notFromFather, NOT_INHERITED);
            const fromFather = setup.getRandomTraits({ gender }, 1, exclude);
            if (fromFather && fromFather.length) {
                child.traits.push(fromFather[0]);
            }
        }

        child.family = { mother: mother.id };
        if (mother.pregnancy_father) {
            child.family.father = mother.pregnancy_father === 'unknown' && typeof mother.pregnancy_event !== 'undefined'
                ? '(' + mother.pregnancy_event + ')'
                : mother.pregnancy_father;
        }
        return child;
    }

    /**
     * A random adult of `gender`; or, given `grownFrom` (a kid in the nursery), that same person coming of age.
     *
     * Coming of age returns a copy of the kid (same id, name, family, history, looks, traits, skills and stats) with
     * a rolled orientation (75% straight, 25% bisexual), still a virgin with no experience, a random dick size for those
     * who have one, clothes if missing, no child-only fields and no body fields their gender doesn't have.
     * @param {{ gender?: number, now: Date, name?: string, rng?: () => number }} p
     * @param {object} [grownFrom]
     */
    function newAdult({ gender, now, name, rng = Math.random } = {}, grownFrom) {
        if (grownFrom) {
            return comeOfAge(grownFrom, rng);
        }

        const age = setup.ageRoll();
        const race = setup.raceRoll();
        const naturalHair = setup.hairRoll(race, age, gender);
        const eyes = setup.eyesRoll(race, naturalHair);
        const orientation = setup.orientationRoll(gender);
        const hair = setup.dyeRoll(naturalHair);

        let beauty = randInt(rng, 20, 70);
        if (age <= 30) beauty = Math.min(beauty + 10, 100);
        if (age >= 50) beauty = Math.max(beauty - 10, 0);

        let npc = humanBeing({
            gender,
            name: name ?? pick(rng, namesFor(gender)),
            birthDate: birthDateFor(age, now, rng),
            looks: { race, naturalHair, hair, eyes, beauty },
            body: { breasts: pick(rng, SIZES), dick: pick(rng, SIZES) }
        });
        Object.assign(npc, {
            corruption: randInt(rng, 0, 50),
            strength: randInt(rng, 5, 15),
            sub: randInt(rng, 0, 30),
            happy: randInt(rng, 40, 60),
            food: randInt(rng, 10, 90),
            horny: randInt(rng, 0, 30),
            personality: setup.personalityTraits(pick(rng, [1, 2, 2]))
        });

        npc = setup.setSexuality(npc, orientation);
        npc.likes = setup.getRandomGifts(pick(rng, [1, 2]));
        npc.dislikes = setup.getRandomGifts(pick(rng, [1, 2]), npc.likes);
        if (chance(rng, 50)) {
            npc.skills = setup.getRandomSkills(npc);
        }

        if (gender === 1) {
            npc.strength = randInt(rng, 20, 40);
            npc.sub = randInt(rng, 5, 13);
        }
        if (gender === 0 || gender === 3) {
            npc.virgin = false;
            npc.orgasms = 0;
        }
        npc.clothes = setup.getRandomNpcClothes(npc);

        if (age <= 20 && chance(rng, 50)) {
            npc = setup.setToVirgin(npc);
        }

        if (gender === 1) {
            if ((npc.likesGuys || npc.likesTGirls) && chance(rng, 25)) {
                npc.traits = [pick(rng, ['analslut', 'cumslut', 'deepthroat'])];
            } else {
                npc.hair = npc.naturalHair;
            }
        } else if (chance(rng, 50)) {
            const count = chance(rng, 30) ? 2 : 1;
            const exclude = gender === 3 ? undefined : (npc.traitsLocked ?? []).concat(['feral']);
            npc.traits = setup.getRandomTraits(npc, count, exclude);
        }

        if (gender === 0 && !npc.virgin && chance(rng, 5)) {
            npc.piercedBoobs = true;
        }
        return npc;
    }

    function comeOfAge(kid, rng) {
        let adult = copyPlain(kid);
        adult = setup.setSexuality(adult, chance(rng, 75) ? 'straight' : 'bisexual');
        adult = setup.setToVirgin(adult);
        fitBody(adult);
        if (has(adult.gender, 'dick') && !adult.dick) {
            adult.dick = pick(rng, SIZES);
        }
        if (adult.clothes === undefined || adult.clothes === null) {
            adult.clothes = setup.getRandomNpcClothes(adult);
        }
        for (const field of CHILD_ONLY) {
            delete adult[field];
        }
        return adult;
    }

    /* ---------- the parents ---------- */

    /** Adds child to mother.family.kids (and father.family.kids, when there is a father). */
    function linkFamily(child, mother, father = null) {
        for (const parent of [mother, father]) {
            if (!parent) continue;
            parent.family ??= {};
            parent.family.kids ??= [];
            if (!parent.family.kids.includes(child.id)) {
                parent.family.kids.push(child.id);
            }
        }
        return child;
    }

    /** Clears the mother's pregnancy fields once every child is born, so a later pregnancy doesn't inherit them. */
    function endPregnancy(mother) {
        delete mother.pregnancy;
        delete mother.pregnancy_father;
        delete mother.pregnancy_event;
        return mother;
    }

    return Object.freeze({
        ANATOMY,
        NOT_INHERITED,
        SIZES,
        CHILD_ONLY,
        has,
        newId,
        copyPlain,
        fitBody,
        humanBeing,
        newBorn,
        newAdult,
        linkFamily,
        endPregnancy
    });
})();
