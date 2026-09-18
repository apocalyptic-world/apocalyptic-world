// Reactions when a whippit high hits on top of an existing alcohol buzz.
// Tiers mirror setup.drunkDescription's buzzed/euphoric/tipsy/drunk bands, with an
// extra severe split at drunk >= 90 for the most dangerous outcomes.
// Lines use {HeOrShe}/{heOrShe}/{hisOrHer}/{himOrHer}/{himOrHerself} placeholders,
// swapped in by the caller via setup.pronounceWhat/Whos/Who for the NPC's gender.
setup.whippitDrunkReactions = {
    buzzed: {
        happyDelta: 0,
        injuryChance: 0,
        lines: [
            "{HeOrShe} starts trying to talk in a robot voice and can't stop laughing at {himOrHerself}.",
            "{HeOrShe} attempts a little dance, stumbles, and just keeps dancing anyway.",
            "{HeOrShe} tells you a joke that doesn't make any sense and then forgets the punchline halfway through.",
            "{HeOrShe} stares at {hisOrHer} own hand like it's the most fascinating thing {heOrShe}'s ever seen.",
            "{HeOrShe} hums a tune that isn't a real song and insists it's {hisOrHer} new favorite."
        ]
    },
    euphoric: {
        happyDelta: 0,
        injuryChance: 0,
        lines: [
            "{HeOrShe} loudly declares {hisOrHer} love for you, then immediately forgets {heOrShe} said it.",
            "{HeOrShe} tries to explain something philosophical and it comes out as complete nonsense.",
            "{HeOrShe} gets a fit of the giggles and can't explain what's so funny even when you ask.",
            "{HeOrShe} starts telling you way too much about {hisOrHer} day, unprompted and unfiltered.",
            "{HeOrShe} strikes a dramatic pose and nearly topples over doing it."
        ]
    },
    tipsy: {
        happyDelta: 1,
        injuryChance: 0,
        lines: [
            "{HeOrShe} tries a cartwheel and mostly lands it, collapsing into laughter right after.",
            "{HeOrShe} dares {himOrHerself} into something silly and actually goes through with it, cackling the whole time.",
            "{HeOrShe} climbs up on something {heOrShe} probably shouldn't, just to see the view, laughing the entire time.",
            "{HeOrShe} strikes up a conversation with someone who isn't there and finds {himOrHerself} hilarious.",
            "{HeOrShe} tries to prove {heOrShe} can still walk a straight line and fails spectacularly, howling with laughter."
        ]
    },
    drunk: {
        happyDelta: -1,
        injuryChance: 10,
        lines: [
            "{HeOrShe} trips over {hisOrHer} own feet and knocks something over, going quiet and self-conscious right after.",
            "{HeOrShe} says something {heOrShe} clearly regrets the second it leaves {hisOrHer} mouth, and the mood sours fast.",
            "{HeOrShe} gets weepy out of nowhere, and the good high curdles into something heavier.",
            "{HeOrShe} starts an argument with nobody in particular and can't seem to let it go.",
            "{HeOrShe} stumbles into something hard enough to bruise, wincing through the last of {hisOrHer} buzz."
        ]
    },
    drunk90: {
        happyDelta: -2,
        injuryChance: 25,
        lines: [
            "{HeOrShe} tries to climb something {heOrShe} has no business climbing and nearly goes down with it.",
            "{HeOrShe} thinks somebody is talking trash and almost takes a swing before you manage to pull {himOrHer} back.",
            "{HeOrShe} swings at something — or someone — that was never actually a threat, and it almost goes badly.",
            "{HeOrShe} loses {hisOrHer} balance completely and goes down hard before you can catch {himOrHer}.",
            "{HeOrShe} gets careless around something sharp or heavy nearby, and it's pure luck nothing worse happens."
        ]
    }
};

// Returns 'not_drunk' | 'buzzed' | 'euphoric' | 'tipsy' | 'drunk' | 'drunk90' for a given drunk value (0-100+).
setup.getWhippitDrunkTier = function (drunk) {
    var d = drunk ?? 0;
    if (d <= 0) return 'not_drunk';
    if (d >= 90) return 'drunk90';
    if (d >= 76) return 'drunk';
    if (d >= 51) return 'tipsy';
    if (d >= 26) return 'euphoric';
    return 'buzzed';
};

// Fills in an NPC's gendered pronouns for a whippitDrunkReactions line's {HeOrShe}/{heOrShe}/
// {hisOrHer}/{himOrHer}/{himOrHerself} placeholders.
setup.fillWhippitPronouns = function (line, npc) {
    return line
        .split('{HeOrShe}').join(setup.pronounceWhat(npc, true))
        .split('{heOrShe}').join(setup.pronounceWhat(npc))
        .split('{hisOrHer}').join(setup.pronounceWhos(npc))
        .split('{himOrHerself}').join(setup.pronounceWho(npc) + 'self')
        .split('{himOrHer}').join(setup.pronounceWho(npc));
};

// Goodwill from offering whippit, based on how drunk she already is: keeping her at
// euphoric or below is a kindness (+1); pushing her to drunk90 costs goodwill (-2).
// Tipsy/drunk are the neutral middle ground. Doesn't account for injury - add that separately.
setup.getWhippitTierGoodwill = function (tier) {
    if (['not_drunk', 'buzzed', 'euphoric'].includes(tier)) return 1;
    if (tier === 'drunk90') return -2;
    return 0;
};

// Returns a random NPC (guest or slave) sharing npc's job and currently at work, or null.
setup.getWhippitCoworker = function (npc, weather) {
    var pool = (variables().guests ?? []).concat(variables().slaves ?? []);
    var candidates = pool.filter(function (o) {
        return o.id !== npc.id && o.assignedTo === npc.assignedTo && setup.isAtWork(o, weather);
    });
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
};
