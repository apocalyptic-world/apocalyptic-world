/*
 * Offering to help a nun (NPC church service - talk), once her focus is set: acts of faith together, a donation to
 * the church, one thing for each focus (a mission of mercy, talking about her flock, hearing her confession), and a
 * communion meal for feral nuns.
 * Each can be done once a day with each nun, and the donation once a day in all ($locationEvents, cleared at night).
 * Stat changes go through setup.nurseryEncounters, so <<nurseryEffects>> lists them under the links.
 */
setup.churchHelp = {
    /** Acts of faith: the stat the theme adds to on top, by focus (power: submission or corruption, either one) */
    faithStat: function (focus) {
        return { kind: 'happy', love: 'relationship', power: either('sub', 'corruption') }[focus];
    },
    /* Smallest donation the church takes, and goodwill: the base-10 log of the caps rounded up, at least DONATION_GOODWILL_MIN */
    DONATION_MIN: 10,
    DONATION_GOODWILL_MIN: 2,
    /* Mission of mercy: who needs help, and the aid the player can bring on top of his time */
    MERCY: [
        { id: 'sick', aid: { item: 'antibiotics', count: 1 } },
        { id: 'injured', aid: { item: 'bandage', count: 1 } },
        { id: 'raiders', aid: { caps: 20 } },
        { id: 'blight', aid: { item: 'food', count: 5 } },
        { id: 'storm', aid: { minutes: 60 } }
    ],
    MERCY_GOODWILL: 2,
    AID_GOODWILL: 2,
    /* Talking about her flock: how far her feelings must outrun theirs, and how close is close (below friends) */
    UNREQUITED_BY: 10,
    CLOSE_BELOW_FRIENDS: 10,
    STRANGER_MC_FROM: 50,
    /* Jobs that take a guest out past the walls in the day, where the player can't fetch them for a tour (hunters go out at night) */
    AWAY_JOBS: ['scavenging', 'people_hunter'],

    /** Which help is open with this nun today: { option: '' if open, or the reason it isn't } */
    blockedBy: function (nun, option) {
        if (option === 'donate') {
            if (variables().locationEvents.church_donation) return 'Already donated today';
            if ((variables().player.money ?? 0) < this.DONATION_MIN) return 'Need at least ' + this.DONATION_MIN + ' caps';
            return '';
        }
        if (variables().locationEvents[this.key(nun, option)]) return 'Already done today';
        if (option === 'mercy' && !((variables().player?.baseManagement?.settlers ?? 0) > 0)) return 'No settlers yet';
        if (option === 'communion' && !setup.cabinInventory.has('food')) return 'Need 1 food';
        return '';
    },

    mark: function (nun, option) {
        variables().locationEvents[option === 'donate' ? 'church_donation' : this.key(nun, option)] = true;
    },

    key: function (nun, option) {
        return 'church_help_' + option + '_' + nun.id;
    },

    /** Goodwill for a donation: 10-100 caps give 2, 101-1000 give 3, and so on */
    donationGoodwill: function (caps) {
        return Math.max(this.DONATION_GOODWILL_MIN, Math.ceil(Math.log10(caps)));
    },

    /** Why this many caps can't be given, or '' if they can */
    donationBlockedBy: function (caps) {
        if (!Number.isInteger(caps) || caps < this.DONATION_MIN) return 'The smallest donation is ' + this.DONATION_MIN + ' caps.';
        if (caps > (variables().player.money ?? 0)) return 'You don\'t have that many caps.';
        return '';
    },

    /* Gratitude after a donation: at or above GENEROUS caps it always moves them, below it a roll of a stat + caps / CAPS_PER_POINT */
    GENEROUS: 500,
    CAPS_PER_POINT: 5,
    /* Eve, not yet open to the MC, stirred by a power nun's devotion: corruption she gains if he takes them both */
    EVE_STIRRED_CORRUPTION: [5, 10],

    moved: function (stat, caps) {
        return caps >= this.GENEROUS || setup.percentageChance((stat ?? 0) + caps / this.CAPS_PER_POINT);
    },

    /*
     * Who is moved by a donation of caps, rolled once:
     *   eve:      Eve, already open to the MC (quests.sex), suggests a holy display of gratitude (corruption)
     *   nun:      a love or power nun feels it in herself (love: relationship, power: corruption)
     *   follows:  a nun not moved herself (holy, or a love or power nun whose roll failed) goes along with Eve's suggestion
     *             (her sexChance with the MC); threesome only
     *   stirred:  Eve isn't open yet, but a power nun's devotion stirs her; threesome only, raising her corruption
     *   pair:     [first, second] for the threesome when one is on offer and the scene exists for the two of them
     */
    gratitude: function (nun, caps) {
        const ce = setup.churchEncounters;
        const eve = variables().characters?.eve;
        const focus = setup.churchService.focus(nun);
        const nunOk = ce.mcOk(nun);
        const eveOpen = !!eve?.quests?.sex;
        const out = {};
        out.eve = eveOpen && this.moved(eve.corruption, caps);
        out.nun = nunOk && focus !== 'kind' && this.moved(focus === 'love' ? nun.relationship : nun.corruption, caps);
        out.follows = out.eve && !out.nun && nunOk && setup.percentageChance(setup.sexChance(nun));
        out.stirred = !!eve && !eveOpen && out.nun && focus === 'power';
        out.pair = (out.eve && (out.nun || out.follows)) || out.stirred ? this.gratitudePair(nun, eve) : null;
        return out;
    },

    /** Eve and the nun in the order the threesome scene expects, or null (no scene for them, or the incest policy) */
    gratitudePair: function (nun, eve) {
        if (variables().player?.baseManagement?.noIncest && setup.family.isIncest(nun, eve)) return null;
        return setup.sex.threesomePair([eve, nun]);
    },

    /** Eve's thanks; she has no NPC record, so her gain is logged with the settlement's (goodwill) */
    thankEve: function (low, high) {
        const eve = variables().characters.eve;
        const before = eve.relationship ?? 0;
        eve.relationship = Math.clamp(before + random(low, high), -100, 100);
        setup.nurseryEncounters.record(null, 'Eve relationship', eve.relationship - before);
    },

    mercyCase: function () {
        return this.MERCY.random();
    },

    /** What the aid costs, for the link: "1 antibiotics", "20 caps" or "1 hour" */
    aidText: function (aid) {
        if (aid.caps) return aid.caps + ' caps';
        if (aid.minutes) return (aid.minutes / 60) + ' hour';
        return aid.count + ' ' + setup.churchEncounters.itemName(aid.item).toLowerCase();
    },

    aidBlockedBy: function (aid) {
        if (aid.caps) return (variables().player.money ?? 0) < aid.caps ? 'Need ' + aid.caps + ' caps' : '';
        if (aid.item) return setup.cabinInventory.has(aid.item, aid.count) ? '' : 'Need ' + this.aidText(aid);
        return '';
    },

    giveAid: function (aid) {
        if (aid.caps) {
            variables().player.money -= aid.caps;
        } else if (aid.item) {
            setup.nurseryEncounters.consume({ [aid.item]: aid.count });
        }
    },

    /** Guests the player could bring to the church for a tour right now */
    tourable: function (nun) {
        const v = variables();
        return (v.guests ?? []).filter(npc => setup.churchEncounters.canTalk(npc, [nun])
            && !(this.AWAY_JOBS.includes(npc.assignedTo) && setup.isAtWork(npc, v.weather)));
    },

    /*
     * Someone the nun's heart is set on, for "how could your heart use tending": { kind, guest, desire } or null.
     *   closer:   she feels more for them than they do for her (by UNREQUITED_BY, or a friendship tier above theirs)
     *   stranger: they are close to the player, and she hasn't got to know them at all yet
     *   time:     they are close, or nearly, both ways
     * desire: whether the two of them could be more than friends (attracted both ways, the rules allowing it).
     */
    heart: function (nun) {
        const rb = setup.relationshipBetween;
        const friends = setup.eveningSchoolSocial.TUNING.FRIENDS;
        const mine = npc => nun.relationshipBetween?.stats?.[npc.id];
        const theirs = npc => npc.relationshipBetween?.stats?.[nun.id] ?? 0;
        const people = this.tourable(nun);
        const kinds = {
            closer: people.filter(npc => mine(npc) !== undefined
                && (mine(npc) - theirs(npc) > this.UNREQUITED_BY || (rb.tier(mine(npc)) >= 1 && rb.tier(mine(npc)) > rb.tier(theirs(npc))))),
            stranger: people.filter(npc => mine(npc) === undefined && (npc.relationship ?? 0) >= this.STRANGER_MC_FROM),
            time: people.filter(npc => (mine(npc) ?? 0) >= friends - this.CLOSE_BELOW_FRIENDS && theirs(npc) >= friends - this.CLOSE_BELOW_FRIENDS)
        };
        const open = Object.keys(kinds).filter(kind => kinds[kind].length);
        if (!open.length) {
            return null;
        }
        const kind = open.random();
        const guest = kinds[kind].random();
        return { kind: kind, guest: guest, desire: setup.churchEncounters.pairOk(nun, guest) };
    },

    /** A guest touring the church in working hours gets the rest of the day off */
    freeForTour: function (npc) {
        if (npc.assignedTo && setup.isAtWork(npc, variables().weather) && typeof npc.rest === 'undefined') {
            npc.rest = { days: 1, reason: 'church' };
            return true;
        }
        return false;
    }
};
