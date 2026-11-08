/*
 * Nursery caretakers: adult guests and slaves looking after the nursery full time.
 * A mother raises the idea once the nursery has grown, and the player chooses whether to set it up.
 * $player.nurseryCare holds { behavior, toys, snacks } and only exists once it has been set up.
 * A caretaker's own npc.nurseryCare holds { ward: child's id, favored: [children's ids] }.
 */
setup.nurseryCare = {
    START_SUPPLIES: ['food', 'glue', 'wood', 'plush'],
    TALK_POPULATION: 10,
    WARD_RELATIONSHIP: 40,
    WARD_SUBMISSION: 60,
    WARD_MAX_CARETAKERS: 2,
    /* Away from the settlement, or tied to one spot, while on shift */
    TALK_AWAY_JOBS: ['quarry', 'forest', 'scavenging', 'school', 'hospital', 'streets', 'nightclub', 'strip_club'],

    isActive: function () {
        return !!variables().player.nurseryCare;
    },

    /** Children only: grown kids waiting for a bed in the guest house don't count */
    kids: function () {
        return (variables().nursery ?? []).filter(kid => setup.getAge(kid) < 18);
    },

    kidsAged: function (from, to) {
        return this.kids().filter(kid => {
            const age = setup.getAge(kid);
            return age >= from && age <= to;
        });
    },

    /** Most caretakers the nursery can have right now */
    maxCaretakers: function () {
        const count = this.kids().length;
        if (count >= 100) return Infinity;
        return Math.max(2, (Math.floor(count / 20) + 1) * 2);
    },

    maxLabel: function () {
        const max = this.maxCaretakers();
        return max === Infinity ? 'No max' : 'Max ' + max;
    },

    /** Everyone assigned to the job, on shift or not */
    caretakers: function () {
        const v = variables();
        return (v.guests ?? []).concat(v.slaves ?? []).filter(npc => npc.assignedTo === 'caretaker');
    },

    onDuty: function () {
        const hours = setup.outsideWorkHours.caretaker;
        return timeBetween(hours.from, hours.to);
    },

    atWork: function (weather) {
        return this.caretakers().filter(npc => setup.isAtWork(npc, weather));
    },

    canAssign: function (npc) {
        return this.isActive()
            && setup.getAge(npc) >= 18
            && !(npc.traits ?? []).includes('feral')
            && npc.assignedTo !== 'caretaker'
            && this.caretakers().length < this.maxCaretakers();
    },

    /** Around the settlement and free to walk into the nursery right now */
    canApproach: function (npc) {
        const school = setup.eveningSchool;
        if (school.attends(npc) || (school.isInstructor(npc) && school.isOpen())) {
            return false;
        }
        return !(this.TALK_AWAY_JOBS.includes(npc.assignedTo) && setup.isAtWork(npc, variables().weather));
    },

    /** What the speaker has to do with the nursery, which decides how they talk about it */
    talkRole: function (npc) {
        const kids = this.kids();
        if (kids.some(kid => kid.family?.mother === npc.id)) return 'mother';
        if (kids.some(kid => kid.family?.father === npc.id)) return 'father';
        return [0, 2].includes(npc.gender) ? 'woman' : 'man';
    },

    /**
     * Who can raise the idea: always a guest, since slaves aren't free to wander in. Mothers of nursery
     * children and nuns first, then fathers, then women, then men. Empty if nobody qualifies right now.
     */
    talkCast: function () {
        const guests = (variables().guests ?? []).filter(npc =>
            setup.getAge(npc) >= 18 && !(npc.traits ?? []).includes('feral') && typeof npc.sick === 'undefined' && this.canApproach(npc));
        const tiers = [
            guests.filter(npc => this.talkRole(npc) === 'mother' || npc.assignedTo === 'church'),
            guests.filter(npc => this.talkRole(npc) === 'father'),
            guests.filter(npc => this.talkRole(npc) === 'woman'),
            guests
        ];
        return tiers.find(tier => tier.length) ?? [];
    },

    /** Rolled on each visit from the Youth district */
    shouldTalk: function () {
        const count = this.kids().length;
        return !this.isActive()
            && !(variables().player.quests.nursery_care_talk ?? false)
            && count >= this.TALK_POPULATION
            && this.onDuty()
            && this.talkCast().length > 0
            && setup.percentageChance(Math.min(99, count * 2));
    },

    missingSupplies: function () {
        return this.START_SUPPLIES
            .filter(item => !setup.cabinInventory.has(item))
            .map(item => Item.get(item).name.toLowerCase());
    },

    activate: function () {
        if (this.isActive() || this.missingSupplies().length) {
            return;
        }
        this.START_SUPPLIES.forEach(item => setup.cabinInventory.drop(item));
        const kids = this.kids();
        const happy = kids.reduce((sum, kid) => sum + (kid.happy ?? 0), 0);
        variables().player.nurseryCare = {
            behavior: kids.length ? Math.clamp(Math.round(happy / kids.length), -100, 100) : 0,
            toys: 1,
            snacks: 10
        };
    },

    /** Percent chance a toy wears out tonight: 20 with the best behavior, nearly 87 with the worst */
    toyWearChance: function (behavior) {
        return 20 + (100 - behavior) / 3;
    },

    /** How many toys wear out when it happens: 1-2, plus a 50/50 chance of one more for every full 100 kids */
    toysWorn: function () {
        let worn = random(1, 2);
        for (let i = Math.floor(this.kids().length / 100); i > 0; i--) {
            worn += random(0, 1);
        }
        return worn;
    },

    /* Snacks eaten each week: one for every SNACK_KIDS children, at least one and at most SNACK_WEEKLY_MAX */
    SNACK_KIDS: 7,
    SNACK_WEEKLY_MAX: 15,

    weeklySnacks: function () {
        const count = this.kids().length;
        return count ? Math.clamp(Math.floor(count / this.SNACK_KIDS), 1, this.SNACK_WEEKLY_MAX) : 0;
    },

    /** Nursery indices in the order picked on the Nursery page */
    sortedIndices: function () {
        const v = variables();
        const nursery = v.nursery ?? [];
        const sorter = setup.npcSortedIndices(nursery, v.nsortBy);
        if (v.nsortBy === 'M') {
            sorter.sort((a, b) => {
                const mA = setup.getNpcById(nursery[a].family?.mother)?.name ?? 'zzz';
                const mB = setup.getNpcById(nursery[b].family?.mother)?.name ?? 'zzz';
                return mA < mB ? -1 : mA > mB ? 1 : 0;
            });
        } else if (v.nsortBy === 'A') {
            sorter.sort((a, b) => setup.getAge(nursery[b]) - setup.getAge(nursery[a]));
        }
        return sorter;
    },

    /** This caretaker's ward, or null if they have none or the child has left the nursery. Goes by id, since $tmpGirl can be a stale copy. */
    wardOf: function (npc) {
        const record = (npc.id ? setup.getNpcById(npc.id) : null) ?? npc;
        const id = record.nurseryCare?.ward;
        return id ? this.kids().find(kid => kid.id === id) ?? null : null;
    },

    /** The caretakers currently looking after this child as a ward */
    wardHolders: function (kid) {
        return this.caretakers().filter(npc => npc.nurseryCare?.ward === kid.id);
    },

    wardHasRoom: function (kid) {
        return this.wardHolders(kid).length < this.WARD_MAX_CARETAKERS;
    },

    /** The player's children this caretaker could take on, leaving out the one they already have */
    wardCandidates: function (npc) {
        const current = this.wardOf(npc);
        const nursery = variables().nursery ?? [];
        return this.sortedIndices()
            .map(index => nursery[index])
            .filter(kid => kid.id && setup.getAge(kid) < 18 && setup.nurseryEncounters.isOwnChild(kid) && kid !== current);
    },

    /** Whether to show the button at all */
    wardOffered: function (npc) {
        return this.isActive() && npc.assignedTo === 'caretaker' && (!!this.wardOf(npc) || this.wardCandidates(npc).length > 0);
    },

    canAppointWard: function (npc) {
        return (npc.relationship ?? 0) >= this.WARD_RELATIONSHIP || (npc.sub ?? 0) >= this.WARD_SUBMISSION;
    },

    /** Why this caretaker can't be given a new ward right now, or an empty string if they can */
    wardPickBlockedBy: function (npc) {
        if (!this.wardCandidates(npc).some(kid => this.wardHasRoom(kid))) {
            return 'No other child available';
        }
        return this.canAppointWard(npc) ? '' : 'Need relationship ' + this.WARD_RELATIONSHIP + '+ or submission ' + this.WARD_SUBMISSION + '+';
    },

    /** Why the button is disabled. A current ward can always be removed, so it stays open for them. */
    wardBlockedBy: function (npc) {
        return this.wardOf(npc) ? '' : this.wardPickBlockedBy(npc);
    },

    wardLabel: function (npc) {
        const ward = this.wardOf(npc);
        return ward ? 'Change/remove ward (' + ward.name + ')' : 'Appoint a ward for extra care';
    },

    setWard: function (npc, kid) {
        npc.nurseryCare ??= { ward: null, favored: [] };
        npc.nurseryCare.ward = kid.id;
    },

    clearWard: function (npc) {
        if (npc.nurseryCare) {
            npc.nurseryCare.ward = null;
        }
    },

    /** Someone who left the job gives up their ward, as does anyone whose ward grew up or left the nursery */
    clearLapsedWards: function () {
        const v = variables();
        for (const npc of (v.guests ?? []).concat(v.slaves ?? [])) {
            if (npc.nurseryCare?.ward && (npc.assignedTo !== 'caretaker' || !this.wardOf(npc))) {
                npc.nurseryCare.ward = null;
            }
        }
    },

    /** Called once a night from the sleep widget, before the nursery loop */
    nightly: function () {
        const care = variables().player.nurseryCare;
        if (!care) {
            return;
        }
        this.clearLapsedWards();
        setup.nurseryEncounters.log = null;
        const workers = this.caretakers().filter(npc => typeof npc.sick === 'undefined' && typeof npc.rest === 'undefined');
        for (const npc of workers) {
            npc.stats ??= {};
            npc.stats.caretaker = (npc.stats.caretaker ?? 0) + 1;
        }
        setup.nurseryOvernight.run(workers);
        if (care.toys > 0 && setup.percentageChance(this.toyWearChance(care.behavior))) {
            const worn = Math.min(care.toys, this.toysWorn());
            care.toys -= worn;
            setup.sleepMessages.addJob((worn === 1 ? 'A toy' : '<strong>' + worn + '</strong> toys') + ' in the nursery wore out. <strong>' + care.toys + '</strong> left.', 'nursery');
        }
        if (care.snacks > 0 && variables().gameDate.getDay() === 1) {
            const used = Math.min(care.snacks, this.weeklySnacks());
            if (used > 0) {
                care.snacks -= used;
                setup.sleepMessages.addJob('The nursery went through <strong>' + used + '</strong> snack supply this week. <strong>' + care.snacks + '</strong> left.', 'nursery');
            }
        }
        setup.nurseryBehavior.run(workers);
        setup.nurseryMishaps.run();
    },

    /** Which pool of text a caretaker draws from right now */
    pool: function () {
        const v = variables();
        const hour = v.gameDate.getHours();
        const window = hour < 9 ? 'morning' : hour < 15 ? 'day' : hour < 17 ? 'afterschool' : hour < 19 ? 'evening' : 'bedtime';
        const schoolKids = (v.player.quests.school_built ?? false) ? this.kidsAged(5, 17) : [];

        if (window === 'morning' && schoolKids.length) {
            return { key: 'morningSchool', kids: schoolKids };
        }
        if (window === 'afterschool' && schoolKids.length) {
            return { key: 'afterSchool', kids: schoolKids };
        }
        if (window === 'evening' || window === 'bedtime') {
            const groups = [
                { key: window + 'Little', kids: this.kidsAged(0, 5) },
                { key: window + 'Kids', kids: this.kidsAged(6, 12) },
                { key: window + 'Teens', kids: this.kidsAged(13, 17) }
            ].filter(group => group.kids.length);
            return groups.length ? groups.random() : { key: 'tending', kids: [] };
        }
        const little = this.kidsAged(0, 4);
        return little.length ? [{ key: 'dayLittle', kids: little }, { key: 'tending', kids: [] }].random() : { key: 'tending', kids: [] };
    },

    /** What this caretaker is up to, to follow their name. used collects the lines and kids already taken on this visit. */
    text: function (npc, used) {
        const pool = this.pool();
        const pick = list => {
            const fresh = list.filter(item => !used.includes(item));
            const item = (fresh.length ? fresh : list).random();
            used.push(item);
            return item;
        };
        const line = pick(this.TEXT[pool.key]);
        const kid = pool.kids.length && line.includes('{kid}') ? pick(pool.kids.map(k => k.name)) : 'one of the children';
        const he = setup.pronounceWhat(npc);
        const his = setup.pronounceWhos(npc);
        const tokens = { kid: kid, he: he, his: his, him: setup.pronounceWho(npc), He: ucfirst(he), His: ucfirst(his) };
        return line.replace(/\{(\w+)\}/g, (match, token) => tokens[token] ?? match);
    },

    TEXT: {
        morningSchool: [
            'is lining the school-age kids up by the door, checking that everyone has their shoes on the right feet.',
            'is hunting for a missing slate while {kid} insists it was right there a minute ago.',
            'is making sure the older ones have eaten and washed their faces before class.',
            'is helping {kid} finish a half-done lesson over a quick breakfast.',
            'is counting heads at the door and sending the school crowd off in pairs.'
        ],
        dayLittle: [
            'is on the floor with the little ones, stacking blocks so they can knock them down again.',
            'is singing to a circle of toddlers, and most of them are even trying to sing along.',
            'is teaching {kid} the names of the colors, and {his} patience is paying off.',
            'is walking the little ones around the yard, stopping at every interesting rock.',
            'is settling the youngest ones down for their nap, one blanket at a time.',
            'is trying to talk {kid} down from a tantrum over a toy nobody else even wanted.',
            'is mopping up a spilled cup while two toddlers make a break for the door.'
        ],
        tending: [
            'is tidying the toy shelf and sorting what still works from what needs mending.',
            'is folding the day\'s washing into neat stacks, one for each bed.',
            'is sweeping the floor, chasing crumbs out from under every cot.',
            'is patching a torn blanket by the window, where the light is best.',
            'is taking stock of the supply shelf and noting what is running low.'
        ],
        afterSchool: [
            'is at the long table, helping {kid} through the day\'s homework.',
            'is collecting satchels and listening to three different versions of what happened at school.',
            'is getting the kids coming in from school to hang up their coats and wash their hands.',
            'is quizzing the school crowd on their letters while they unwind.',
            'is letting the school crowd run off some energy in the yard before homework.'
        ],
        eveningLittle: [
            'is telling the little ones a story, doing all the voices.',
            'is playing a clapping game with {kid}, who shrieks with laughter every round.',
            'is showing the little ones how to put the toys back where they belong, and it is almost working.',
            'is helping the little ones through their supper, one spoonful at a time.',
            'is washing small hands and faces in a basin before the evening settles in.',
            'is coaxing {kid} to eat something other than bread, without much success.',
            'is separating two little ones who both decided the same toy was theirs.'
        ],
        eveningKids: [
            'is refereeing a noisy game in the yard, and everyone seems to be having a good time.',
            'is teaching {kid} how to tie a proper knot, and the result is holding up well.',
            'is reading aloud to a group of kids, who keep begging for one more chapter.',
            'is assigning the evening chores and checking them off as they get done.',
            'is setting out the table while a few of the kids carry plates.',
            'has sent {kid} to scrub the pots after catching some rough play at the table.',
            'is sitting {kid} down for a quiet talk about telling the truth.'
        ],
        eveningTeens: [
            'is showing {kid} how to mend a torn shirt, and they are trading jokes as they work.',
            'is listening to {kid} talk through plans for the years ahead.',
            'is playing cards with the teenagers and losing on purpose, though nobody is fooled.',
            'is going over the week\'s chore list with the teenagers.',
            'is keeping half an eye on the teenagers as they talk in their usual corner.',
            'has taken away {kid}\'s free evening over a chore left undone, and is not hearing any arguments.',
            'is having a firm word with {kid} about how to speak to the younger kids.'
        ],
        bedtimeLittle: [
            'is tucking in the little ones, pulling each blanket up to the chin.',
            'is humming a lullaby until {kid} finally stops asking for water.',
            'is checking under a cot for monsters, at {kid}\'s very serious request.'
        ],
        bedtimeKids: [
            'is herding the younger kids through washing up and into bed.',
            'is finishing one last chapter, as promised, while eyelids start to droop around the room.',
            'is settling a whispered argument between two bunks so everyone can get some sleep.'
        ],
        bedtimeTeens: [
            'is reminding the teenagers for the second time that it is getting late.',
            'is negotiating lights-out with {kid}, who has several arguments prepared.',
            'is making a last round of the older kids\' beds and blowing out the lamps.'
        ]
    }
};
