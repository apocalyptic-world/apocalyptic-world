/*
 * Church encounters: scenes with a nun away from the church, picked by the way she serves (setup.churchService.focus).
 * Rolled when the player walks into a location (VISIT_CHANCE, or VISIT_CHANCE_AT for busy places). At most PER_LOCATION
 * per location, LOCATION_GAP_MINUTES apart, and one per nun each day, tracked in $locationEvents (cleared every night),
 * apart from the location's own random events.
 *
 * To add one, add an entry to LIST and create its passage:
 *   id:       unique name
 *   passage:  passage to send the player to
 *   location: where it happens: 'guesthouse', 'cabin' (the main cabin and its gate), 'district' (the street
 *             through the Youth district, where the household and settlers mingle), 'kitchen', 'shop', 'hospital',
 *             'nursery', 'bathhouse' or 'basement'. Nothing spicy in the nursery, the hospital or the district.
 *   focus:    which nuns it is for: 'kind', 'love', 'power' or 'any'
 *   ferals:   optional, 'yes' if feral nuns can be in it too, 'only' if it is only for them. Left out, they aren't.
 *   hours:    optional [from, to], when it can happen
 *   offDuty:  optional, true if it can happen while the nun is off duty (awake and well, anywhere in the settlement)
 *   settlers: optional, true if settlers are in the scene, so it needs the settlement to have some
 *   slaves:   optional, true if the nun tends to slaves in it, so it needs the base policy letting nuns serve them
 *   nun:      optional function (nun, ctx), anything else the nun herself needs
 *   cast:     function (nun, ctx), returns the NPCs in the scene as { nun, ... }, or null if it can't happen now.
 *             A role can be a list of NPCs ({ kids: [...] }); anyone gone by then is dropped from it.
 *   weight:   optional function (cast, ctx), how likely it is to be picked. DEFAULT_WEIGHT is an ordinary one.
 * The passage gets its NPCs back from setup.churchEncounters.cast(). Stat changes go through setup.nurseryEncounters
 * (change, changeBetween, record), so <<nurseryEffects>> can list them at the end, the same as the nursery scenes.
 */
setup.churchEncounters = {
    /* Percent chance per visit that something happens, if any nun has a scene she could be in */
    VISIT_CHANCE: 25,
    /* Lower chances for places the player passes through all day, so their scenes aren't all used up by mid-morning */
    VISIT_CHANCE_AT: { cabin: 12, guesthouse: 12 },
    /* In-game minutes between two scenes at the same location, so the second one comes later in the day */
    LOCATION_GAP_MINUTES: 240,
    DEFAULT_WEIGHT: 10,
    /* Scenes a location can have in a day, so one nun's scene doesn't shut the others out of a place */
    PER_LOCATION: 2,
    /* Reconciling: base chance, +/- per trait, +EXPERIENCE_STEP for every EXPERIENCE_DAYS nights served at the church */
    RECONCILE_BASE: 50,
    RECONCILE_UP: 10,
    RECONCILE_DOWN: 5,
    /* A careless nun's chance at anything that can fail is this much lower (it replaces her RECONCILE_DOWN) */
    CARELESS_PENALTY: 10,
    /* An energetic nun can be in this many scenes a day; others in one */
    ENERGETIC_SCENES: 2,
    RECONCILE_MAX: 99,
    EXPERIENCE_STEP: 2,
    EXPERIENCE_DAYS: 20,
    /* Comforting looks for someone below this happiness, the needy talk for someone at or above this horny */
    UNHAPPY_BELOW: 70,
    NEEDY_FROM: 50,
    /* Things a guest might lean on, in the order they're offered */
    VICES: ['xanax', 'whippit', 'alcohol'],
    LIKES: ['likesGirls', 'likesGuys', 'likesTGirls', 'likesTGuys'],
    /* Jobs worked at or near the cabin, whose workers might take a break by it during the day (loveBreak) */
    BREAK_JOBS: ['garden', 'guard', 'hunter', 'garage', 'kitchen', 'shop', 'maid', 'attendant', 'mistress'],
    /* When each outside job comes back through the gate: from the end of the shift, for two hours */
    RETURNS: { garden: ['16:00', '18:00'], forest: ['18:00', '20:00'], quarry: ['18:00', '20:00'], scavenging: ['20:00', '22:00'] },
    /* A guest at or above this submission takes being caught out meekly */
    MEEK_FROM: 20,
    /* A worker at or above either of these makes the first move on their own */
    FORWARD_SUB: 20,
    FORWARD_CORRUPTION: 30,
    /* A husband below this submission, or a wife below this corruption, objects before the nun talks them round */
    PROTEST_SUB: 30,
    PROTEST_CORRUPTION: 30,
    /* A nun at or above this corruption suggests a different kind of penance */
    CORRUPT_NUN_FROM: 40,
    /* Days pregnant before a nun looks after someone, and before she helps them get around too */
    EXPECTING_FROM: 30,
    HEAVY_FROM: 180,
    /* Days before settlers try bullying a feral nun again, once the player has stood up for her */
    BULLY_COOLDOWN: 7,
    /* Days left on a patient before the nun's visit is worth a scene, and the fewest it can bring them down to */
    PATIENT_DAYS_FROM: 2,
    PATIENT_DAYS_MIN: 1,
    /* Nursery: the children's ages, how many it takes, and how many join in */
    NURSERY_AGES: [3, 12],
    NURSERY_KIDS_FROM: 3,
    NURSERY_KIDS: [5, 10],
    /* Jobs that keep a guest out all night, coming home in the morning */
    NIGHT_WORK: ['strip_club', 'nightclub', 'streets'],
    /* A feral nun can sense a guest ovulating: women under this age, once a cycle each */
    FERTILE_AGE_BELOW: 45,
    FERTILE_COOLDOWN: 28,
    /* Sermon: a nun at or above either of these offers herself; percent chance a settler is moved to join in */
    SERMON_OFFER_SUB: 20,
    SERMON_OFFER_CORRUPTION: 40,
    SERMON_JOIN_CHANCE: 35,
    /* What the household can give: { item: count }, or caps */
    DONATIONS: [{ item: 'food', count: 10 }, { item: 'wood', count: 20 }, { item: 'cloth', count: 5 }, { caps: 30 }],
    /* Small but real offenses, as "caught ..." */
    OFFENSES: [
        { text: 'pocketing extra rations from the kitchen stores' },
        { text: "copying another student's answers in evening class", evening: true },
        { text: 'cheating at cards to win a week of somebody else\'s soap' },
        { text: 'taking tools from the workbench without asking, and breaking one' },
        { text: 'slipping off from chores and letting someone else take the blame' }
    ],

    LIST: [
        {
            id: 'holyMediation',
            passage: 'Church encounter - holy mediation',
            location: 'guesthouse',
            focus: 'kind',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const pairs = self.pairs(self.guestsHere([nun]), (a, b) => self.between(a, b) < 0 || self.between(b, a) < 0);
                if (!pairs.length) {
                    return null;
                }
                const [first, second] = pairs.random();
                return { nun: nun, first: first, second: second };
            }
        },
        {
            id: 'holyComfort',
            passage: 'Church encounter - holy comfort',
            location: 'guesthouse',
            focus: 'kind',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const low = self.guestsHere([nun]).filter(npc => (npc.happy ?? 0) < self.UNHAPPY_BELOW);
                if (!low.length) {
                    return null;
                }
                return { nun: nun, guest: low.reduce((a, b) => (b.happy ?? 0) < (a.happy ?? 0) ? b : a) };
            }
        },
        {
            id: 'loveMediation',
            passage: 'Church encounter - love mediation',
            location: 'guesthouse',
            focus: 'love',
            cast: function (nun) {
                const self = setup.churchEncounters;
                /* Drawn to each other; whether anything can come of it is checked when it comes up */
                const pairs = self.pairs(self.guestsHere([nun]), (a, b) => self.attracted(a, b));
                if (!pairs.length) {
                    return null;
                }
                const [first, second] = pairs.random();
                return { nun: nun, first: first, second: second };
            }
        },
        {
            id: 'powerConfession',
            passage: 'Church encounter - power confession',
            location: 'guesthouse',
            focus: 'power',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const guests = self.guestsHere([nun]);
                if (!guests.length) {
                    return null;
                }
                const guest = guests.random();
                /* Whoever the confession is about, if anyone in the household is someone they could have been with */
                const partners = self.household().filter(npc => npc !== guest && npc !== nun && self.pairOk(guest, npc));
                const cast = { nun: nun, guest: guest };
                if (partners.length) {
                    cast.partner = partners.random();
                }
                return cast;
            }
        },
        {
            id: 'powerNeedy',
            passage: 'Church encounter - power needy',
            location: 'guesthouse',
            focus: 'power',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const needy = self.guestsHere([nun]).filter(npc => (npc.horny ?? 0) >= self.NEEDY_FROM);
                if (!needy.length) {
                    return null;
                }
                return { nun: nun, guest: needy.reduce((a, b) => (b.horny ?? 0) > (a.horny ?? 0) ? b : a) };
            }
        },
        {
            id: 'holyWelcome',
            passage: 'Church encounter - holy welcome',
            location: 'cabin',
            focus: 'kind',
            ferals: 'yes',
            hours: ['16:00', '21:00'],
            offDuty: true,
            cast: function (nun) {
                const workers = setup.churchEncounters.returningWorkers([nun], setup.churchService.servesSlaves());
                return workers.length ? { nun: nun, worker: workers.random() } : null;
            }
        },
        {
            id: 'loveBreak',
            passage: 'Church encounter - love break',
            location: 'cabin',
            focus: 'love',
            ferals: 'yes',
            hours: ['08:00', '18:00'],
            cast: function (nun) {
                const workers = setup.churchEncounters.breakWorkers([nun], setup.churchService.servesSlaves());
                return workers.length ? { nun: nun, worker: workers.random() } : null;
            }
        },
        {
            id: 'holyExpecting',
            passage: 'Church encounter - holy expecting',
            location: 'guesthouse',
            focus: 'kind',
            ferals: 'yes',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const expecting = self.guestsHere([nun]).filter(npc => (npc.pregnancy ?? -1) >= self.EXPECTING_FROM);
                return expecting.length ? { nun: nun, guest: expecting.random() } : null;
            }
        },
        {
            id: 'loveOffense',
            passage: 'Church encounter - love offense',
            location: 'cabin',
            focus: 'love',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const guests = self.guestsHere([nun]);
                if (!guests.length) {
                    return null;
                }
                const cast = { nun: nun, guest: guests.random() };
                /* A stern nun of the power path, if there is one, for the guest to be glad didn't catch them */
                const stern = setup.churchService.nuns().filter(npc => npc !== nun && npc !== cast.guest && setup.churchService.focus(npc) === 'power' && self.stern(npc));
                if (stern.length) {
                    cast.stern = stern.random();
                }
                return cast;
            }
        },
        {
            id: 'loveCouples',
            passage: 'Church encounter - love couples',
            location: 'district',
            focus: 'love',
            settlers: true,
            nun: nun => setup.churchEncounters.mcOk(nun),
            cast: function (nun) {
                const self = setup.churchEncounters;
                /* They go off to the guest house together afterwards, so it has to be a pair the rules allow */
                const couples = self.couples(self.guestsHere([nun])).filter(([a, b]) => self.pairOk(a, b));
                if (!couples.length) {
                    return null;
                }
                const [first, second] = couples.random();
                return { nun: nun, first: first, second: second };
            }
        },
        {
            id: 'powerPillory',
            passage: 'Church encounter - power pillory',
            location: 'district',
            focus: 'power',
            ferals: 'yes',
            /* A pacifist won't take a cane to anyone, however stern */
            nun: nun => setup.churchEncounters.stern(nun) && !setup.churchEncounters.hasTrait(nun, 'pacifist'),
            cast: function (nun) {
                const guests = setup.churchEncounters.guestsHere([nun]);
                return guests.length ? { nun: nun, guest: guests.random() } : null;
            }
        },
        {
            id: 'powerFavor',
            passage: 'Church encounter - power favor',
            location: 'cabin',
            focus: 'power',
            hours: ['16:00', '21:00'],
            offDuty: true,
            cast: function (nun) {
                const workers = setup.churchEncounters.returningWorkers([nun]);
                return workers.length ? { nun: nun, worker: workers.random() } : null;
            }
        },
        {
            id: 'powerCouple',
            passage: 'Church encounter - power couple',
            location: 'guesthouse',
            focus: 'power',
            cast: function (nun) {
                const self = setup.churchEncounters;
                /* A wife and husband, with the wife someone the player could be with once her husband agrees */
                const couples = self.couples(self.guestsHere([nun]))
                    .map(pair => pair.slice().sort((a, b) => a.gender - b.gender))
                    .filter(([wife, husband]) => wife.gender === 0 && husband.gender === 1 && self.mcOkWithSpouse(wife));
                if (!couples.length) {
                    return null;
                }
                const [wife, husband] = couples.random();
                return { nun: nun, wife: wife, husband: husband };
            }
        },
        {
            id: 'holyDonationKitchen',
            passage: 'Church encounter - holy donation',
            location: 'kitchen',
            focus: 'kind',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const v = variables();
                const cooks = setup.getNpcsForLocation((v.guests ?? []).concat(v.slaves ?? []), 'kitchen')
                    .filter(npc => self.canTalk(npc, [nun]) && setup.isAtWork(npc, v.weather));
                return cooks.length ? { nun: nun, host: cooks[0] } : null;
            }
        },
        {
            id: 'holyDonationShop',
            passage: 'Church encounter - holy donation',
            location: 'shop',
            focus: 'kind',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const keepers = setup.getNpcsForLocation(variables().guests ?? [], 'shop').filter(npc => self.canTalk(npc, [nun]));
                return keepers.length ? { nun: nun, host: keepers[0] } : null;
            }
        },
        {
            id: 'holyHospital',
            passage: 'Church encounter - holy hospital',
            location: 'hospital',
            focus: 'kind',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const v = variables();
                if (!(v.game.location.hospital ?? false)) {
                    return null;
                }
                /* Slaves only if the base policy lets nuns attend to them */
                const patients = setup.churchService.served().filter(npc => npc !== nun
                    && setup.getAge(npc) >= 18
                    && !self.isFeral(npc)
                    && (npc.sick?.days ?? 0) >= self.PATIENT_DAYS_FROM);
                if (!patients.length) {
                    return null;
                }
                const doctors = setup.getNpcsForLocation(v.guests ?? [], 'hospital').filter(npc => npc !== nun && setup.isAtWork(npc, v.weather));
                return { nun: nun, patient: patients.random(), doctors: doctors };
            }
        },
        {
            id: 'holyNursery',
            passage: 'Church encounter - holy nursery',
            location: 'nursery',
            focus: 'kind',
            ferals: 'yes',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const v = variables();
                /* The school-age ones are in class during school hours, if there is a school */
                const inClass = timeBetween('09:00', '15:00') && (v.player.quests.school_built ?? false);
                const kids = setup.nurseryEncounters.healthyKids(self.NURSERY_AGES[0], inClass ? 4 : self.NURSERY_AGES[1]).filter(kid => !kid.sleeping);
                if (kids.length < self.NURSERY_KIDS_FROM) {
                    return null;
                }
                const count = Math.min(kids.length, random(self.NURSERY_KIDS[0], self.NURSERY_KIDS[1]));
                const carers = setup.nurseryCare.isActive() ? setup.nurseryCare.atWork(v.weather).filter(npc => npc !== nun) : [];
                return { nun: nun, kids: kids.shuffle().slice(0, count), carers: carers };
            }
        },
        {
            id: 'holyNightWorker',
            passage: 'Church encounter - holy night worker',
            location: 'guesthouse',
            focus: 'kind',
            hours: ['08:00', '11:00'],
            cast: function (nun) {
                const self = setup.churchEncounters;
                const workers = self.guestsHere([nun]).filter(npc => self.NIGHT_WORK.includes(npc.assignedTo));
                return workers.length ? { nun: nun, guest: workers.random() } : null;
            }
        },
        {
            id: 'loveBath',
            passage: 'Church encounter - love bath',
            location: 'bathhouse',
            focus: 'love',
            ferals: 'yes',
            /* Off duty too, so she can be there for the evening slots on the schedule, as late as the mistress's (22-24) */
            offDuty: true,
            hours: ['08:00', '24:00'],
            cast: function (nun) {
                const self = setup.churchEncounters;
                /* Someone bathing in their slot on the schedule, drawn to the nun, with the rules allowing it */
                const bathers = (variables().guests ?? []).filter(npc => npc.location === 'bathhouse'
                    && self.canTalk(npc, [nun])
                    && self.likes(npc, nun)
                    && self.pairOk(npc, nun, nun));
                return bathers.length ? { nun: nun, guest: bathers.random() } : null;
            }
        },
        {
            id: 'feralFertile',
            passage: 'Church encounter - feral fertile',
            location: 'guesthouse',
            focus: 'love',
            ferals: 'only',
            cast: function (nun) {
                const self = setup.churchEncounters;
                const day = variables().game.day;
                const fertile = self.guestsHere([nun]).filter(npc => npc.gender === 0
                    && setup.getAge(npc) < self.FERTILE_AGE_BELOW
                    && !npc.virgin
                    && setup.canGetPregnant(npc)
                    && self.mcOk(npc)
                    && (npc.churchFertile?.day ?? -Infinity) + self.FERTILE_COOLDOWN <= day);
                return fertile.length ? { nun: nun, guest: fertile.random() } : null;
            }
        },
        {
            id: 'powerSermon',
            passage: 'Church encounter - power sermon',
            location: 'district',
            focus: 'power',
            settlers: true,
            nun: nun => setup.churchEncounters.mcOk(nun),
            cast: function (nun) {
                return { nun: nun };
            }
        },
        {
            id: 'powerDebate',
            passage: 'Church encounter - power debate',
            location: 'district',
            focus: 'power',
            cast: function (nun) {
                const scholars = setup.churchEncounters.scholarsOnBreak([nun], setup.churchService.servesSlaves());
                return scholars.length ? { nun: nun, scholar: scholars.random() } : null;
            }
        },
        {
            id: 'feralBare',
            passage: 'Church encounter - feral bare',
            location: 'district',
            focus: 'power',
            ferals: 'only',
            settlers: true,
            cast: function (nun) {
                return { nun: nun };
            }
        },
        {
            id: 'powerLesson',
            passage: 'Church encounter - power lesson',
            location: 'guesthouse',
            focus: 'power',
            nun: nun => setup.churchEncounters.mcOk(nun),
            cast: function (nun) {
                const self = setup.churchEncounters;
                const workers = self.guestsHere([nun]).filter(npc => self.NIGHT_WORK.includes(npc.assignedTo));
                if (!workers.length) {
                    return null;
                }
                return { nun: nun, workers: workers.shuffle().slice(0, random(1, Math.min(2, workers.length))) };
            }
        },
        {
            id: 'feralBullied',
            passage: 'Church encounter - feral bullied',
            location: 'district',
            focus: 'any',
            ferals: 'only',
            settlers: true,
            nun: nun => (nun.churchService?.bullyCooldownUntil ?? 0) <= variables().game.day,
            cast: function (nun) {
                return { nun: nun };
            }
        },
        {
            id: 'basementComfort',
            passage: 'Church encounter - basement comfort',
            location: 'basement',
            focus: 'kind',
            slaves: true,
            cast: function (nun) {
                const self = setup.churchEncounters;
                const low = self.slavesHere().filter(npc => (npc.happy ?? 0) < self.UNHAPPY_BELOW);
                if (!low.length) {
                    return null;
                }
                return { nun: nun, slave: low.reduce((a, b) => (b.happy ?? 0) < (a.happy ?? 0) ? b : a) };
            }
        },
        {
            id: 'basementExpecting',
            passage: 'Church encounter - basement expecting',
            location: 'basement',
            focus: 'kind',
            ferals: 'yes',
            slaves: true,
            cast: function (nun) {
                const self = setup.churchEncounters;
                const expecting = self.slavesHere().filter(npc => (npc.pregnancy ?? -1) >= self.EXPECTING_FROM);
                return expecting.length ? { nun: nun, slave: expecting.random() } : null;
            }
        },
        {
            id: 'basementNightWorker',
            passage: 'Church encounter - basement night worker',
            location: 'basement',
            focus: 'kind',
            hours: ['08:00', '11:00'],
            slaves: true,
            cast: function (nun) {
                const self = setup.churchEncounters;
                const workers = self.slavesHere().filter(npc => self.NIGHT_WORK.includes(npc.assignedTo));
                return workers.length ? { nun: nun, slave: workers.random() } : null;
            }
        }
    ],

    locationKey: function (location) {
        return 'church_' + location;
    },

    /* When the location's last scene started (game time in ms), for LOCATION_GAP_MINUTES */
    locationTimeKey: function (location) {
        return 'church_' + location + '_at';
    },

    nunKey: function (npc) {
        return 'church_nun_' + npc.id;
    },

    /*
     * Nuns who could be in this scene now. A nun on duty has the run of the settlement, tending to people wherever
     * they are, so these scenes find her out on an errand during her shift. Off duty she isn't in service, unless the
     * scene says otherwise.
     */
    nunsFor: function (item, ctx) {
        const v = variables();
        const ferals = item.ferals ?? 'no';
        return setup.churchService.nuns().filter(npc => npc.id
            && (v.locationEvents[this.nunKey(npc)] ?? 0) < (this.hasTrait(npc, 'energetic') ? this.ENERGETIC_SCENES : 1)
            && (ferals === 'yes' || (ferals === 'only') === this.isFeral(npc))
            && (item.focus === 'any' || setup.churchService.focus(npc) === item.focus)
            && (setup.isAtWork(npc, v.weather) || (item.offDuty && this.awake(npc)))
            && (!item.nun || item.nun(npc, ctx)));
    },

    /** Up and about somewhere in the settlement: not asleep, not sick */
    awake: function (npc) {
        return !npc.sleeping && typeof npc.sick === 'undefined';
    },

    /* The passage the last successful roll picked, for a roll made inside an <<if>> condition (Wood cabin) */
    rolled: null,

    /** Picks an encounter for this visit and returns its passage, or null if nothing happens */
    roll: function (location) {
        const v = variables();
        if (!setup.churchService.isActive() || (v.locationEvents[this.locationKey(location)] ?? 0) >= this.PER_LOCATION) {
            return null;
        }
        const lastAt = v.locationEvents[this.locationTimeKey(location)];
        if (lastAt !== undefined && v.gameDate.getTime() - lastAt < this.LOCATION_GAP_MINUTES * 60000) {
            return null;
        }
        const ctx = { location: location };
        const options = [];
        const hasSettlers = (variables().player?.baseManagement?.settlers ?? 0) > 0;
        for (const item of this.LIST.filter(entry => entry.location === location
            && (!entry.hours || timeBetween(entry.hours[0], entry.hours[1]))
            && (!entry.settlers || hasSettlers)
            && (!entry.slaves || setup.churchService.servesSlaves()))) {
            const fits = this.nunsFor(item, ctx);
            if (fits.length) {
                const cast = item.cast(fits.random(), ctx);
                if (cast) {
                    options.push({ encounter: item, cast: cast });
                }
            }
        }
        if (!options.length || !setup.percentageChance(this.VISIT_CHANCE_AT[location] ?? this.VISIT_CHANCE)) {
            return null;
        }
        const picked = setup.nurseryOvernight.pickWeighted(options, option => option.encounter.weight ? option.encounter.weight(option.cast, ctx) : this.DEFAULT_WEIGHT, 1)[0];
        const ids = {};
        Object.keys(picked.cast).forEach(role => {
            const who = picked.cast[role];
            ids[role] = Array.isArray(who) ? who.map(npc => npc.id) : who.id;
        });
        v.locationEvents[this.locationKey(location)] = (v.locationEvents[this.locationKey(location)] ?? 0) + 1;
        v.locationEvents[this.locationTimeKey(location)] = v.gameDate.getTime();
        v.locationEvents[this.nunKey(picked.cast.nun)] = (v.locationEvents[this.nunKey(picked.cast.nun)] ?? 0) + 1;
        v.tmpEvent = { cast: ids };
        this.rolled = picked.encounter.passage;
        return picked.encounter.passage;
    },

    /** The NPCs of the current encounter, or null if one of them is gone. Also starts the effect log. */
    cast: function () {
        setup.nurseryEncounters.startLog();
        const ids = variables().tmpEvent?.cast ?? {};
        const cast = {};
        for (const role of Object.keys(ids)) {
            if (Array.isArray(ids[role])) {
                cast[role] = ids[role].map(id => setup.getNpcById(id)).filter(Boolean);
                continue;
            }
            cast[role] = setup.getNpcById(ids[role]);
            if (!cast[role]) {
                return null;
            }
        }
        return ids.nun ? cast : null;
    },

    /** An adult who can hold a conversation and is up and about, other than the ones left out */
    canTalk: function (npc, leaveOut = []) {
        return npc.id && !leaveOut.includes(npc) && setup.getAge(npc) >= 18 && !this.isFeral(npc) && this.awake(npc);
    },

    isFeral: function (npc) {
        return (npc.traits ?? []).includes('feral');
    },

    /** Adult guests at the guest house right now who can hold a conversation, other than the ones left out */
    guestsHere: function (leaveOut = []) {
        return (variables().guests ?? []).filter(npc => npc.id
            && !leaveOut.includes(npc)
            && setup.getAge(npc) >= 18
            && !this.isFeral(npc)
            && setup.nurseryEncounters.atGuestHouse(npc));
    },

    /** Adult slaves in the basement right now who can hold a conversation: not out at work, in class or in hospital */
    slavesHere: function (leaveOut = []) {
        const v = variables();
        return (v.slaves ?? []).filter(npc => npc.id
            && !leaveOut.includes(npc)
            && setup.getAge(npc) >= 18
            && !this.isFeral(npc)
            && !npc.sleeping
            && npc.location !== 'school'
            && !setup.isAtWork(npc, v.weather)
            && !((v.game.location.hospital ?? false) && typeof npc.sick !== 'undefined'));
    },

    /** Adults living in the household, for who someone might have been with */
    household: function () {
        const v = variables();
        return (v.guests ?? []).concat(v.slaves ?? []).filter(npc => npc.id && setup.getAge(npc) >= 18);
    },

    /** Every pair from the list that passes test */
    pairs: function (npcs, test) {
        const found = [];
        for (let i = 0; i < npcs.length; i++) {
            for (let j = i + 1; j < npcs.length; j++) {
                if (test(npcs[i], npcs[j])) {
                    found.push([npcs[i], npcs[j]]);
                }
            }
        }
        return found;
    },

    between: function (from, to) {
        return from.relationshipBetween?.stats?.[to.id] ?? 0;
    },

    /** Whether npc is attracted to people of other's gender */
    likes: function (npc, other) {
        return !!npc[this.LIKES[other.gender]];
    },

    /** Drawn to each other, both ways, with the game settings allowing it */
    attracted: function (a, b) {
        return this.likes(a, b) && this.likes(b, a) && this.settingsAllow(a, b);
    },

    /** Whether the game settings allow these two together */
    settingsAllow: function (a, b) {
        const trans = [a, b].some(npc => [2, 3].includes(npc.gender));
        const femme = npc => [0, 2].includes(npc.gender);
        if (trans && !settings.transEnabled) return false;
        if (femme(a) && femme(b) && !settings.lesbiansEnabled) return false;
        if (!femme(a) && !femme(b) && !settings.gaysEnabled) return false;
        return true;
    },

    /** Whether npc's marriage lets them be with other: the MC's spouses never with a man, anyone else's only with that spouse */
    marriageAllows: function (npc, other) {
        if (setup.npc.areMarriedToEachOther(npc, other)) {
            return true;
        }
        if (npc.family?.husband === 'mc') {
            return [0, 2].includes(other.gender);
        }
        const spouses = (npc.family?.wives ?? []).concat(npc.family?.husband ? [npc.family.husband] : []);
        return spouses.every(id => setup.npc.isSpouseLost(id));
    },

    /**
     * Whether two NPCs can be together under the settlement's rules: adults, no chastity belt, the game settings,
     * the incest, no sex and wedlock policies, and their marriages. Attraction both ways, unless waive names one of
     * them whose own attraction doesn't count (a nun putting her faith first).
     */
    pairOk: function (a, b, waive = null) {
        const policy = variables().player?.baseManagement ?? {};
        if (!a || !b || a === b || setup.getAge(a) < 18 || setup.getAge(b) < 18) return false;
        if (a.chastityBelt || b.chastityBelt || [a, b].some(npc => npc.gender === 3)) return false;
        if (!this.settingsAllow(a, b)) return false;
        if (policy.noSex) return false;
        if (policy.noIncest && setup.family.isIncest(a, b)) return false;
        if (!this.marriageAllows(a, b) || !this.marriageAllows(b, a)) return false;
        const mixed = [a, b].some(npc => npc.gender === 1) && [a, b].some(npc => [0, 2].includes(npc.gender));
        if (policy.noOutOfMarriageSex && mixed && !setup.npc.areMarriedToEachOther(a, b)) return false;
        return (a === waive || this.likes(a, b)) && (b === waive || this.likes(b, a));
    },

    /** Whether the MC can be with npc: attracted to him (setup.npcs.mcAttraction covers incest and marriage), adult, no belt */
    mcOk: function (npc) {
        if (!npc || setup.getAge(npc) < 18 || npc.chastityBelt) return false;
        if (npc.gender === 1 && !settings.gaysEnabled) return false;
        if ([2, 3].includes(npc.gender) && !settings.transEnabled) return false;
        return setup.npcs.mcAttraction(npc).attracted;
    },

    /** A shallow copy of npc for <<actionImage>>, drawn from place's action images (falls back to 'default'), leaving her own location alone */
    pictured: function (npc, place = 'default') {
        return Object.assign({}, npc, { location: place });
    },

    /** Why the MC's offer can't go ahead right now, or '' if it can */
    mcBlockedBy: function () {
        return (variables().player.energy ?? 0) <= 30 ? 'Not enough energy' : '';
    },

    /*
     * A threesome with the MC. Both have to want him; they don't have to want each other (a woman can join him with
     * another woman she isn't drawn to), but the incest policy still holds between them. Returns [first, second]
     * in the order the scene expects, or null.
     */
    threesome: function (a, b) {
        if (!this.mcOk(a) || !this.mcOk(b)) return null;
        if (variables().player?.baseManagement?.noIncest && setup.family.isIncest(a, b)) return null;
        return setup.sex.threesomePair([a, b]);
    },

    /** The foursome scene is written for women only */
    foursomeOk: function (npcs) {
        const policy = variables().player?.baseManagement ?? {};
        return npcs.every(npc => npc.gender === 0 && this.mcOk(npc))
            && this.pairs(npcs, (a, b) => policy.noIncest && setup.family.isIncest(a, b)).length === 0;
    },

    /** Whether nun is going along with partners she isn't drawn to, which costs her a little submission */
    nunYields: function (nun, partners) {
        return partners.some(npc => !this.likes(nun, npc));
    },

    /*
     * Passage and $tmpEvent for watching guests together in the existing guest house scenes, or null if there's no
     * scene for that mix. npcs are 2 or 3 guests, already checked with pairOk.
     */
    guestScene: function (npcs) {
        const guests = variables().guests;
        const at = npc => guests.indexOf(npc);
        if (npcs.some(npc => at(npc) < 0)) {
            return null;
        }
        const of = gender => npcs.filter(npc => npc.gender === gender).map(at);
        const [f, m, t] = [of(0), of(1), of(2)];
        const count = [f.length, m.length, t.length].join('');
        const scenes = {
            /* f m t */
            '200': ['Guesthouse [Event] - female on female', f],
            '110': ['Guesthouse [Event] - male on female', { femaleGuestIds: f, maleGuestIds: m }],
            '020': ['Guesthouse [Event] - male on male', m],
            '101': ['Guesthouse [Event] - transfemale on female', [f, t]],
            '011': ['Guesthouse [Event] - male on transfemale', [t, m]],
            '002': ['Guesthouse [Event] - transfemale on transfemale', t],
            '300': ['Guesthouse [Event] - female on female', f],
            '210': ['Guesthouse [Event] - male on females', { femaleGuestIds: f, maleGuestIds: m }],
            '120': ['Guesthouse [Event] - males on female', { femaleGuestIds: f, maleGuestIds: m }],
            '111': ['Guesthouse [Event] - male on female and transfemale', [f, t, m]]
        };
        const scene = scenes[count];
        return scene ? { passage: scene[0], tmpEvent: scene[1] } : null;
    },

    /** Starts watching a guest scene from guestScene() */
    watch: function (scene) {
        const v = variables();
        delete v.randEvent;
        v.tmpEvent = clone(scene.tmpEvent);
        Engine.play(scene.passage);
    },

    /** The same as the scene's own ending, for when the player leaves them to it: happier, satisfied, closer to each other */
    offstage: function (npcs) {
        const guests = variables().guests;
        const log = setup.nurseryEncounters.log;
        npcs.forEach(npc => {
            setup.nurseryEncounters.change(npc, 'happy', 5, 5);
            npc.horny = 0;
        });
        const before = this.pairs(npcs, () => true).map(([a, b]) => [a, b, this.between(a, b), this.between(b, a)]);
        const ids = npcs.map(npc => guests.indexOf(npc));
        setup.relationshipBetween.afterGuestSex(ids, ids.map(id => [id, ids.filter(other => other !== id)]), false);
        if (log) {
            before.forEach(([a, b, ab, ba]) => {
                log.push({ npc: a, other: b, stat: 'between', amount: this.between(a, b) - ab });
                log.push({ npc: b, other: a, stat: 'between', amount: this.between(b, a) - ba });
            });
        }
    },

    /*
     * Sets up the MC's scene with these guests (1 to 3); the passage then calls <<fuck>>, <<threesome>>, <<foursome>>
     * or goes to NPC punish. place is where it happens ('bedroom', 'church' or 'basement'), back is where the player
     * goes afterwards. Away from the bedroom, the first one's location is put back when the scene ends.
     */
    prepareMc: function (npcs, place = 'bedroom', back = 'Guest house') {
        const v = variables();
        const slots = [['guestId', 'charId', 'tmpGirl', 'slaveId'], ['guestId2', 'charId2', 'tmpGirl2', 'slaveId2'], ['guestId3', 'charId3', 'tmpGirl3', 'slaveId3']];
        ['guestId', 'slaveId', 'charId', 'slaveId2', 'charId2', 'slaveId3', 'charId3', 'guestId2', 'guestId3', 'randEvent', 'tmpEvent', 'oldTmpGirlLocation', 'punishType', 'prevPunish', 'punishCount'].forEach(key => delete v[key]);
        if (place !== 'bedroom') {
            v.oldTmpGirlLocation = npcs[0].location ?? 'guesthouse';
        }
        /* Guests by their place in $guests, slaves by theirs in $slaves; a named character (Eve) by her key in $characters */
        npcs.forEach((npc, i) => {
            const charKey = Object.keys(v.characters ?? {}).find(key => v.characters[key] === npc);
            if (charKey) {
                v[slots[i][1]] = charKey;
            } else if ((v.slaves ?? []).includes(npc)) {
                v[slots[i][3]] = v.slaves.indexOf(npc);
            } else {
                v[slots[i][0]] = v.guests.indexOf(npc);
            }
            v[slots[i][2]] = npc;
            npc.location = place;
        });
        v.tmpGirl.rape = false;
        v.tmpGirlBack = back;
        v.tmpGirlViewBack = typeof v.charId !== 'undefined' ? 'NPC view - character' : (typeof v.slaveId !== 'undefined' ? 'NPC view' : 'NPC view - guest');
        v.sexForced = false;
    },

    /** Takes npc down to the basement to be punished (NPC punish), coming back to the guest's view afterwards */
    punish: function (npc, back) {
        this.prepareMc([npc], 'basement', back);
        variables().tmpGirlViewBack = 'Church encounter - after punishment';
        Engine.play('NPC punish');
    },

    hasTrait: function (npc, trait) {
        return (npc.traits ?? []).includes(trait) || setup.personality.has(npc, trait);
    },

    /** Sadistic or critical: hard on people who step out of line */
    stern: function (npc) {
        return this.hasTrait(npc, 'sadistic') || this.hasTrait(npc, 'critical');
    },

    /** Workers coming back through the gate from an outside job they went out to today; slaves too if withSlaves */
    returningWorkers: function (leaveOut = [], withSlaves = false) {
        const v = variables();
        return (v.guests ?? []).concat(withSlaves ? v.slaves ?? [] : []).filter(npc => {
            const back = this.RETURNS[npc.assignedTo];
            const schedule = setup.outsideWorkHours[npc.assignedTo];
            return back && schedule
                && !leaveOut.includes(npc)
                && setup.getAge(npc) >= 18
                && !this.isFeral(npc)
                && this.awake(npc)
                && timeBetween(back[0], back[1])
                && !setup.workBlocked(npc, npc.assignedTo, v.weather, schedule.blockedBy);
        });
    },

    /**
     * Workers on a break by the cabin (BREAK_JOBS): on shift now if the job keeps hours, or simply about if it doesn't
     * (guards, hunters waiting for the night, the shopkeeper). Slaves too if withSlaves.
     */
    breakWorkers: function (leaveOut = [], withSlaves = false) {
        const v = variables();
        return (v.guests ?? []).concat(withSlaves ? v.slaves ?? [] : []).filter(npc => this.BREAK_JOBS.includes(npc.assignedTo)
            && !leaveOut.includes(npc)
            && setup.getAge(npc) >= 18
            && !this.isFeral(npc)
            && this.awake(npc)
            && typeof npc.rest === 'undefined'
            && (!setup.outsideWorkHours[npc.assignedTo] || setup.isAtWork(npc, v.weather)));
    },

    /**
     * Doctors and librarians at work right now, who might step out for a walk on their break, and evening school
     * instructors out and about before their class (powerDebate). Slaves too if withSlaves.
     */
    scholarsOnBreak: function (leaveOut = [], withSlaves = false) {
        const v = variables();
        const school = setup.eveningSchool;
        return (v.guests ?? []).concat(withSlaves ? v.slaves ?? [] : []).filter(npc => !leaveOut.includes(npc)
            && setup.getAge(npc) >= 18
            && !this.isFeral(npc)
            && this.awake(npc)
            && (['hospital', 'librarian'].includes(npc.assignedTo)
                ? setup.isAtWork(npc, v.weather)
                : school.isInstructor(npc) && !timeBetween(school.hours.from, school.hours.to)));
    },

    /** Married couples among these NPCs, as [a, b] */
    couples: function (npcs) {
        return this.pairs(npcs, (a, b) => setup.npc.areMarriedToEachOther(a, b));
    },

    /**
     * Whether the MC could be with this married NPC once her spouse agrees to it: the same as mcOk, except that
     * being married to someone else doesn't stand in the way. She still has to like men (or not need to).
     */
    mcOkWithSpouse: function (npc) {
        if (this.mcOk(npc)) return true;
        if (!npc || setup.getAge(npc) < 18 || npc.chastityBelt || npc.gender !== 0) return false;
        const attraction = setup.npcs.mcAttraction(npc);
        return attraction.blocker === 'married'
            && (!!npc.likesGuys || (npc.traits ?? []).includes('nymphomaniac') || setup.npc.isExOfMc(npc));
    },

    /** A relationship change one way only, from one NPC toward another; shaded: a nun's own ties get tieBonus (off for byNunChanges lists, which have it already) */
    changeToward: function (from, to, low, high, shaded = true) {
        const bonus = shaded ? this.tieBonus(from, to, low) : 0;
        [low, high] = [low + bonus, high + bonus].map(n => bonus < 0 ? Math.max(0, n) : n);
        from.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
        from.relationshipBetween.stats ??= {};
        const before = from.relationshipBetween.stats[to.id] ?? 0;
        from.relationshipBetween.stats[to.id] = Math.clamp(before + random(low, high), -100, 100);
        const amount = from.relationshipBetween.stats[to.id] - before;
        const log = setup.nurseryEncounters.log;
        if (log && amount) {
            log.push({ npc: from, other: to, stat: 'between', amount });
        }
    },

    /** Something npc likes that the player has on hand, or null */
    likedGift: function (npc) {
        return (npc.likes ?? []).find(item => Item.get(item) && setup.cabinInventory.has(item)) ?? null;
    },

    /** What npc was caught doing, as "caught ..." */
    offense: function (npc) {
        return this.OFFENSES.filter(entry => !entry.evening || setup.eveningSchool.eligible(npc)).random().text;
    },

    /** A worker the nun sent back out with fresh heart brings in one extra of what their job makes, that night */
    boostWork: function (npc) {
        npc.churchBoostDay = variables().game.day;
    },

    /** Called from the nightly tick (day is the new day): pays out boostWork */
    payWorkBoost: function (npc, day, scavengingItems) {
        if (npc.churchBoostDay === undefined) {
            return;
        }
        const boosted = npc.churchBoostDay === day - 1;
        delete npc.churchBoostDay;
        const made = { garden: 'food', forest: 'wood', quarry: either('coal', 'stone'), scavenging: (scavengingItems ?? []).length ? scavengingItems.random() : null }[npc.assignedTo];
        if (!boosted || !made) {
            return;
        }
        setup.cabinInventory.pickup(made, 1);
        const totals = State.temporary.totals;
        if (totals) {
            totals[made] = (totals[made] ?? 0) + 1;
        }
        setup.sleepMessages.addJob(npc.name + ' went back to work with fresh heart after the welcome at the gate. <strong class="iitem">+1 ' + Item.get(made).name + '</strong>', npc.assignedTo);
    },

    /** "10 food" or "30 caps", for a DONATIONS entry */
    donationText: function (gift) {
        return gift.caps ? gift.caps + ' caps' : gift.count + ' ' + this.itemName(gift.item).toLowerCase();
    },

    /** Why the household can't give this right now, or '' if it can */
    donationBlockedBy: function (gift) {
        if (gift.caps) {
            return (variables().player.money ?? 0) < gift.caps ? 'not enough caps' : '';
        }
        return setup.cabinInventory.has(gift.item, gift.count) ? '' : 'not enough ' + this.itemName(gift.item).toLowerCase();
    },

    donate: function (gift) {
        if (gift.caps) {
            variables().player.money -= gift.caps;
        } else {
            setup.nurseryEncounters.consume({ [gift.item]: gift.count });
        }
    },

    /** Takes days off a patient's time sick, never below PATIENT_DAYS_MIN. Returns how many it took. */
    heal: function (npc, days) {
        if (!npc.sick) {
            return 0;
        }
        const before = npc.sick.days;
        npc.sick.days = Math.max(this.PATIENT_DAYS_MIN, before - days);
        const taken = before - npc.sick.days;
        if (taken) {
            setup.nurseryEncounters.record(npc, 'sick', -taken);
        }
        return taken;
    },

    /** Marks npc as ovulating today (Church encounter - feral fertile): setup.pregnancyChance doubles for her */
    markFertile: function (npc) {
        npc.churchFertile = { day: variables().game.day, inside: false };
    },

    /** Called from setup.pregnancyChance: whether npc is ovulating today, noting that someone finished inside her */
    fertileToday: function (person) {
        if (person.churchFertile?.day !== variables().game.day) {
            return false;
        }
        person.churchFertile.inside = true;
        return true;
    },

    /** A feral nun the player turned on hides in the church and doesn't work that night */
    hide: function (nun) {
        nun.churchService ??= {};
        nun.churchService.hidingDay = variables().game.day;
    },

    /** Called from the nightly tick (day is the new day): whether the nun spent the day hiding instead of working */
    skipsWork: function (nun, day) {
        return nun.churchService?.hidingDay === day - 1;
    },

    /*
     * How a nun's temperament shades her work (user's table): points added to both ends of a range.
     *   happy, between, sub, corruption: what she does for or to someone else (between: helping two others get along)
     *   ownSub, ownCorruption: her own submission or corruption going up, whoever causes it
     *   upset: softens what she does when she punishes or upsets someone
     * Traits are personality traits or game traits (hasTrait). Bonuses already written into a scene stand apart.
     */
    NUN_TRAITS: {
        happy: { compassionate: 1, friendly: 1, critical: -1, sadistic: -1, extravagant: -1, hoarder: -1 },
        between: { compassionate: 1, inventive: 1, hoarder: -1 },
        /* her own ties: any gain in how she and someone else feel about each other, both ways, whoever causes it (tieBonus) */
        ownBetween: { friendly: 1, critical: -1 },
        sub: { critical: 1, sadistic: 1, nervous: -1 },
        corruption: { nymphomaniac: 1, cautious: -1 },
        ownSub: { masochist: 1, reserved: 1 },
        ownCorruption: { curious: 1 },
        upset: { compassionate: 1 }
    },

    nunBonus: function (nun, effect) {
        return Object.entries(this.NUN_TRAITS[effect]).reduce((sum, [trait, points]) => sum + (this.hasTrait(nun, trait) ? points : 0), 0);
    },

    /**
     * [low, high] for a change the nun makes to npc (or one made to her, if npc is the nun), shaded by her traits.
     * A gain never becomes a loss, and a softened loss never becomes a gain. punishing: a gain that comes from her
     * punishing someone (the submission from a pillory), which compassion softens too.
     */
    nunRange: function (nun, npc, stat, low, high, punishing = false) {
        let bonus = 0;
        if (npc === nun) {
            bonus = low > 0 && stat === 'sub' ? this.nunBonus(nun, 'ownSub')
                : low > 0 && stat === 'corruption' ? this.nunBonus(nun, 'ownCorruption') : 0;
        } else if (high < 0) {
            bonus = this.nunBonus(nun, 'upset');
        } else if (low > 0 && ['happy', 'sub', 'corruption'].includes(stat)) {
            bonus = this.nunBonus(nun, stat) - (punishing ? this.nunBonus(nun, 'upset') : 0);
        }
        if (high < 0) {
            return [Math.min(0, low + bonus), Math.min(0, high + bonus)];
        }
        return [Math.max(0, low + bonus), Math.max(0, high + bonus)];
    },

    /** setup.nurseryEncounters.change, for a change the nun brings about (or that happens to her) */
    byNun: function (nun, npc, stat, low, high, punishing = false) {
        const [from, to] = this.nunRange(nun, npc, stat, low, high, punishing);
        return setup.nurseryEncounters.change(npc, stat, from, to);
    },

    /**
     * Points added to a gain in relationshipBetween between a and b when one of them is a nun (ownBetween, both ways).
     * low is the gain's low end: nothing for a loss. Two nuns together count both.
     */
    tieBonus: function (a, b, low) {
        if (!(low > 0)) {
            return 0;
        }
        return [a, b].filter(npc => npc?.assignedTo === 'church').reduce((sum, nun) => sum + this.nunBonus(nun, 'ownBetween'), 0);
    },

    /** setup.nurseryEncounters.changeBetween, for the nun helping two others get along */
    betweenByNun: function (nun, a, b, low, high) {
        const bonus = this.nunBonus(nun, 'between');
        return setup.nurseryEncounters.changeBetween(a, b, low + bonus, high + bonus);
    },

    /** A held-back change list (applyChanges) with the nun's traits worked in; ties between two others count as her helping them */
    byNunChanges: function (nun, changes) {
        return changes.map(c => {
            if (c.other) {
                const bonus = c.npc === nun || c.other === nun ? this.tieBonus(c.npc, c.other, c.low) : this.nunBonus(nun, 'between');
                const [low, high] = [c.low + bonus, c.high + bonus].map(n => bonus < 0 && c.low > 0 ? Math.max(0, n) : n);
                return Object.assign({}, c, { low: low, high: high, shaded: true });
            }
            const [low, high] = this.nunRange(nun, c.npc, c.stat, c.low, c.high, !!c.punishing);
            return Object.assign({}, c, { low: low, high: high });
        });
    },

    /** Chance that the guests patch things up on their own, from the nun's temperament and time at the church */
    reconcileChance: function (nun) {
        const has = trait => setup.personality.has(nun, trait);
        const up = ['compassionate', 'organized', 'confident'].filter(has).length * this.RECONCILE_UP;
        const down = ['nervous', 'critical'].filter(has).length * this.RECONCILE_DOWN + (has('careless') ? this.CARELESS_PENALTY : 0);
        const experience = Math.floor((nun.stats?.church ?? 0) / this.EXPERIENCE_DAYS) * this.EXPERIENCE_STEP;
        return Math.clamp(this.RECONCILE_BASE + up - down + experience, 0, this.RECONCILE_MAX);
    },

    /** The first thing on the VICES list that npc likes, or null */
    vice: function (npc) {
        return this.VICES.find(item => (npc.likes ?? []).includes(item)) ?? null;
    },

    itemName: function (item) {
        return Item.get(item)?.name ?? item;
    },

    /*
     * Makes changes held back until the player picks a link: [{ npc, stat, low, high }], or { npc, other, low, high }
     * for how npc feels about other.
     */
    applyChanges: function (changes) {
        changes.forEach(c => c.other
            ? this.changeToward(c.npc, c.other, c.low, c.high, !c.shaded)
            : setup.nurseryEncounters.change(c.npc, c.stat, c.low, c.high));
    },

    /** "Anna: Corruption +3 to +5 &bull; Beth: Submission +1 to +2" for changes not made yet (see applyChanges) */
    changesText: function (changes) {
        const signed = n => (n > 0 ? '+' : '') + n;
        const range = c => (c.low === c.high ? signed(c.low) : signed(c.low) + ' to ' + signed(c.high));
        const byNpc = new Map();
        changes.forEach(c => {
            if (!byNpc.has(c.npc)) {
                byNpc.set(c.npc, []);
            }
            const label = c.other ? 'Relationship with ' + setup.displayName(c.other) : (setup.nurseryEncounters.STAT_LABELS[c.stat] ?? ucfirst(c.stat));
            byNpc.get(c.npc).push(label + ' ' + range(c));
        });
        return [...byNpc.entries()].map(([npc, parts]) => setup.displayName(npc) + ': ' + parts.join(', ')).join(' &bull; ');
    },

    /** Records a change to one of the player's own stats, for the effect lines */
    changePlayer: function (stat, amount) {
        const player = variables().player;
        player[stat] = (player[stat] ?? 0) + amount;
        setup.nurseryEncounters.record(null, stat, amount);
    },

    /**
     * Changes the settlement's reputation (how settlers see it as a place to live, 0 to 100, unset counts as 50) and
     * records it for the effect lines (unless record is false, e.g. at night). Returns the change made: 0 without base
     * management or at the limit.
     */
    changeSettlementReputation: function (amount, record = true) {
        const base = variables().player?.baseManagement;
        if (!base) {
            return 0;
        }
        const before = base.settlementReputation ?? 50;
        base.settlementReputation = Math.clamp(before + amount, 0, 100);
        const applied = base.settlementReputation - before;
        if (record) {
            setup.nurseryEncounters.record(null, 'settlementReputation', applied, amount);
        }
        return applied;
    }
};
