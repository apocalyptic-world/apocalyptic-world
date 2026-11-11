/**
 * Sex act counters for NPCs. Every NPC has two counters with the same metrics:
 *   npc.mainCharSexStats   acts with the MC
 *   npc.generalSexStats    acts with anyone else (other NPCs, street clients, kidnappers, …)
 * A metric is an act the NPC received ('received…'), gave ('given…') or did both at once with a partner ('mutual…').
 * The MC has no counters.
 *
 * Record an act with the function named after it, active (who does it) first, passive (who receives it) second:
 *   setup.sexActs.fucksPussy($player, $tmpGirl)     // the MC fucks her pussy
 *   setup.sexActs.blowsCock($tmpGirl, $player)      // she gives the MC a blowjob
 *   setup.sexActs.fucksAss($tmpGirl, $player)       // a sadistic woman pegs the MC (strap-on)
 *   setup.sexActs.fucksPussy(setup.sexActs.someone(), npc)   // an anonymous man (client, kidnapper)
 * Each call adds 1 to the metrics of the NPCs involved. The anatomy is checked first: an act someone can't do or
 * receive (a man getting his pussy licked) throws an Error. A strap-on (sadistic women and trans men, the basement
 * mistress) counts as a cock.
 *
 * Read with count(npc, metric), countWithMc(npc, metric), totalAss(npc) and hadSexWithMc(npc). Don't read or write
 * the counter objects directly.
 */
setup.sexActs = (function () {
    const RECEIVED = [
        'VaginalCreampie', 'AssCreampie', 'PussyFingering', 'PussyFisting', 'AssFingering', 'AssFisting',
        'DoublePenetrationAssVagina', 'DoublePenetrationVagina', 'DoublePenetrationAss',
        'BlowJob', 'LickPussy', 'EatAss', 'DeepThroatCock', 'PussyFucked', 'AssFucked', 'PussyDildo', 'AssDildo',
        'Grind', 'CumInMouth', 'CumFacial', 'CumTits', 'CumStomach', 'CumPussy', 'CumAss', 'CumBack', 'NippleLick'
    ].map(name => 'received' + name);
    const GIVEN = [
        'FuckAss', 'FuckPussy', 'BlowJob', 'LickPussy', 'EatAss', 'DeepThroatCock',
        'HandJob', 'TitJob', 'FootJob', 'AssJob', 'Grind', 'NippleLick'
    ].map(name => 'given' + name);
    /** Acts where both partners give and receive at the same time: recorded the same way on both. */
    const MUTUAL = ['SixtyNine'].map(name => 'mutual' + name);
    const METRICS = Object.freeze([...RECEIVED, ...GIVEN, ...MUTUAL]);
    const ASS_METRICS = Object.freeze(METRICS.filter(metric => /Ass/.test(metric)));
    const COUNTERS = { mc: 'mainCharSexStats', others: 'generalSexStats' };

    /* ---------- anatomy (gender: 0 female, 1 male, 2 trans female, 3 trans male; the MC is male) ---------- */

    const isMc = person => person != null && (person.id === 'mc' || person === variables().player);
    /** Women and trans men with a strap-on: sadistic ones, and whoever works as the basement mistress. The game has no
        strap-on item, so by game mechanics the strap-on is a penis for them (they penetrate and get blowjobs). */
    const usesStrapOn = person => !isMc(person) && [0, 3].includes(person?.gender)
        && ((person?.traits ?? []).includes('sadistic') || person?.assignedTo === 'mistress');
    const hasCock = person => isMc(person) || [1, 2].includes(person?.gender) || usesStrapOn(person);
    const hasPussy = person => !isMc(person) && [0, 3].includes(person?.gender);
    const hasBreasts = person => !isMc(person) && [0, 2].includes(person?.gender);
    const canPenetrate = hasCock;

    const who = person => (isMc(person) ? 'the MC' : (person?.name ?? 'someone') + ' (gender ' + person?.gender + ')');

    function check(act, ok, person, what) {
        if (!ok) {
            throw new Error('setup.sexActs.' + act + ': ' + who(person) + ' ' + what);
        }
    }

    /* ---------- counters ---------- */

    function counter(npc, withMc) {
        for (const key of Object.values(COUNTERS)) {
            npc[key] ??= {};
            for (const metric of METRICS) {
                npc[key][metric] ??= 0;
            }
        }
        return npc[withMc ? COUNTERS.mc : COUNTERS.others];
    }

    /** Adds 1 to metric for person (unless it's the MC or an anonymous partner, who have no counters). */
    function increment(person, metric, withMc) {
        if (!metric || isMc(person) || person?.anonymous) {
            return;
        }
        counter(person, withMc)[metric]++;
    }

    /** Records an act: givenMetric for active, receivedMetric for passive. withMc: the MC took part (by default:
        active or passive is the MC; acts with more partners pass it). */
    function record(active, passive, givenMetric, receivedMetric, withMc = isMc(active) || isMc(passive)) {
        increment(active, givenMetric, withMc);
        increment(passive, receivedMetric, withMc);
    }

    /* ---------- acts ---------- */

    const acts = {
        /* penetration */
        fucksPussy: function (active, passive) {
            check('fucksPussy', canPenetrate(active), active, 'has no cock or strap-on');
            check('fucksPussy', hasPussy(passive), passive, 'has no pussy');
            record(active, passive, 'givenFuckPussy', 'receivedPussyFucked');
        },
        fucksAss: function (active, passive) {
            check('fucksAss', canPenetrate(active), active, 'has no cock or strap-on');
            record(active, passive, 'givenFuckAss', 'receivedAssFucked');
        },
        /* two partners at once; each active also gets their own fuck metric */
        doublePenetratesPussyAndAss: function (pussyActive, assActive, passive) {
            check('doublePenetratesPussyAndAss', canPenetrate(pussyActive), pussyActive, 'has no cock or strap-on');
            check('doublePenetratesPussyAndAss', canPenetrate(assActive), assActive, 'has no cock or strap-on');
            check('doublePenetratesPussyAndAss', hasPussy(passive), passive, 'has no pussy');
            const withMc = [pussyActive, assActive, passive].some(isMc);
            record(pussyActive, passive, 'givenFuckPussy', 'receivedDoublePenetrationAssVagina', withMc);
            record(assActive, passive, 'givenFuckAss', null, withMc);
        },
        doublePenetratesPussy: function (active1, active2, passive) {
            check('doublePenetratesPussy', canPenetrate(active1), active1, 'has no cock or strap-on');
            check('doublePenetratesPussy', canPenetrate(active2), active2, 'has no cock or strap-on');
            check('doublePenetratesPussy', hasPussy(passive), passive, 'has no pussy');
            const withMc = [active1, active2, passive].some(isMc);
            record(active1, passive, 'givenFuckPussy', 'receivedDoublePenetrationVagina', withMc);
            record(active2, passive, 'givenFuckPussy', null, withMc);
        },
        doublePenetratesAss: function (active1, active2, passive) {
            check('doublePenetratesAss', canPenetrate(active1), active1, 'has no cock or strap-on');
            check('doublePenetratesAss', canPenetrate(active2), active2, 'has no cock or strap-on');
            const withMc = [active1, active2, passive].some(isMc);
            record(active1, passive, 'givenFuckAss', 'receivedDoublePenetrationAss', withMc);
            record(active2, passive, 'givenFuckAss', null, withMc);
        },
        fingersPussy: function (active, passive) {
            check('fingersPussy', hasPussy(passive), passive, 'has no pussy');
            record(active, passive, null, 'receivedPussyFingering');
        },
        fistsPussy: function (active, passive) {
            check('fistsPussy', hasPussy(passive), passive, 'has no pussy');
            record(active, passive, null, 'receivedPussyFisting');
        },
        fingersAss: function (active, passive) {
            record(active, passive, null, 'receivedAssFingering');
        },
        fistsAss: function (active, passive) {
            record(active, passive, null, 'receivedAssFisting');
        },
        dildoesPussy: function (active, passive) {
            check('dildoesPussy', hasPussy(passive), passive, 'has no pussy');
            record(active, passive, null, 'receivedPussyDildo');
        },
        dildoesAss: function (active, passive) {
            record(active, passive, null, 'receivedAssDildo');
        },

        /* oral */
        blowsCock: function (active, passive) {
            check('blowsCock', hasCock(passive), passive, 'has no cock');
            record(active, passive, 'givenBlowJob', 'receivedBlowJob');
        },
        deepThroatsCock: function (active, passive) {
            check('deepThroatsCock', hasCock(passive), passive, 'has no cock');
            record(active, passive, 'givenDeepThroatCock', 'receivedDeepThroatCock');
        },
        licksPussy: function (active, passive) {
            check('licksPussy', hasPussy(passive), passive, 'has no pussy');
            record(active, passive, 'givenLickPussy', 'receivedLickPussy');
        },
        eatsAss: function (active, passive) {
            record(active, passive, 'givenEatAss', 'receivedEatAss');
        },
        licksNipples: function (active, passive) {
            record(active, passive, 'givenNippleLick', 'receivedNippleLick');
        },

        /* with hands, feet, breasts, body */
        givesHandJob: function (active, passive) {
            check('givesHandJob', hasCock(passive), passive, 'has no cock');
            record(active, passive, 'givenHandJob', null);
        },
        givesFootJob: function (active, passive) {
            check('givesFootJob', hasCock(passive), passive, 'has no cock');
            record(active, passive, 'givenFootJob', null);
        },
        givesTitJob: function (active, passive) {
            check('givesTitJob', hasBreasts(active), active, 'has no breasts');
            check('givesTitJob', hasCock(passive), passive, 'has no cock');
            record(active, passive, 'givenTitJob', null);
        },
        givesAssJob: function (active, passive) {
            check('givesAssJob', hasCock(passive), passive, 'has no cock');
            record(active, passive, 'givenAssJob', null);
        },
        grinds: function (active, passive) {
            check('grinds', hasPussy(active), active, 'has no pussy');
            record(active, passive, 'givenGrind', 'receivedGrind');
        },

        /* both at once: no active or passive, anyone can (everyone has a cock, a strap-on or a pussy) */
        sixtyNine: function (partner1, partner2) {
            record(partner1, partner2, 'mutualSixtyNine', 'mutualSixtyNine');
        },

        /* cum (active: who cums) */
        cumsInPussy: function (active, passive) {
            check('cumsInPussy', hasCock(active), active, 'has no cock');
            check('cumsInPussy', hasPussy(passive), passive, 'has no pussy');
            record(active, passive, null, 'receivedVaginalCreampie');
        },
        cumsInAss: function (active, passive) {
            check('cumsInAss', hasCock(active), active, 'has no cock');
            record(active, passive, null, 'receivedAssCreampie');
        },
        cumsInMouth: function (active, passive) {
            check('cumsInMouth', hasCock(active), active, 'has no cock');
            record(active, passive, null, 'receivedCumInMouth');
        },
        cumsOnFace: function (active, passive) {
            check('cumsOnFace', hasCock(active), active, 'has no cock');
            record(active, passive, null, 'receivedCumFacial');
        },
        cumsOnTits: function (active, passive) {
            check('cumsOnTits', hasCock(active), active, 'has no cock');
            check('cumsOnTits', hasBreasts(passive), passive, 'has no breasts');
            record(active, passive, null, 'receivedCumTits');
        },
        cumsOnStomach: function (active, passive) {
            check('cumsOnStomach', hasCock(active), active, 'has no cock');
            record(active, passive, null, 'receivedCumStomach');
        },
        cumsOnPussy: function (active, passive) {
            check('cumsOnPussy', hasCock(active), active, 'has no cock');
            check('cumsOnPussy', hasPussy(passive), passive, 'has no pussy');
            record(active, passive, null, 'receivedCumPussy');
        },
        cumsOnAss: function (active, passive) {
            check('cumsOnAss', hasCock(active), active, 'has no cock');
            record(active, passive, null, 'receivedCumAss');
        },
        cumsOnBack: function (active, passive) {
            check('cumsOnBack', hasCock(active), active, 'has no cock');
            record(active, passive, null, 'receivedCumBack');
        }
    };

    /* ---------- sex scenes (one-on-one, threesome, foursome): each act counts once per scene ---------- */

    /** One-on-one scene action keys (views/npc/fuck/mc/actions.tw, buttons.tw) → acts between the MC and npc. */
    const MC_SCENE_ACTIONS = {
        bj: (mc, npc) => acts.blowsCock(npc, mc),
        dp: (mc, npc) => acts.deepThroatsCock(npc, mc),             // 'dp' is deepthroat in the scenes
        sn: (mc, npc) => acts.sixtyNine(mc, npc),
        pussy_lick: (mc, npc) => acts.licksPussy(mc, npc),
        ass_eat: (mc, npc) => acts.eatsAss(mc, npc),
        bj_reverse: (mc, npc) => acts.blowsCock(mc, npc),           // a sadistic woman's strap-on counts as a cock
        anal_reverse: (mc, npc) => acts.fucksAss(npc, mc),
        pussy: (mc, npc) => acts.fucksPussy(mc, npc),
        anal: (mc, npc) => acts.fucksAss(mc, npc),
        pussy_fingering: (mc, npc) => acts.fingersPussy(mc, npc),
        pussy_fisting: (mc, npc) => acts.fistsPussy(mc, npc),
        anal_fingering: (mc, npc) => acts.fingersAss(mc, npc),
        anal_fisting: (mc, npc) => acts.fistsAss(mc, npc),
        pussy_dildo: (mc, npc) => acts.dildoesPussy(mc, npc),
        handjob: (mc, npc) => acts.givesHandJob(npc, mc),
        footjob: (mc, npc) => acts.givesFootJob(npc, mc),
        titjob: (mc, npc) => acts.givesTitJob(npc, mc),
        assjob: (mc, npc) => acts.givesAssJob(npc, mc),
        grind: (mc, npc) => acts.grinds(npc, mc),
        nipple_lick: (mc, npc) => acts.licksNipples(mc, npc),
        cum_in_pussy: (mc, npc) => acts.cumsInPussy(mc, npc),
        cum_in_ass: (mc, npc) => acts.cumsInAss(mc, npc),
        cum_in_mouth: (mc, npc) => acts.cumsInMouth(mc, npc),
        cum_in_throat: (mc, npc) => acts.cumsInMouth(mc, npc),
        cum_throat: (mc, npc) => acts.cumsInMouth(mc, npc),
        cum_on_face: (mc, npc) => acts.cumsOnFace(mc, npc),
        cum_on_tits: (mc, npc) => acts.cumsOnTits(mc, npc),
        cum_on_stomach: (mc, npc) => acts.cumsOnStomach(mc, npc),
        grind_cum: (mc, npc) => acts.cumsOnStomach(mc, npc),        // "Cum on stomach" while grinding
        cum_on_pussy: (mc, npc) => acts.cumsOnPussy(mc, npc),
        cum_on_ass: (mc, npc) => acts.cumsOnAss(mc, npc),
        assjob_cum: (mc, npc) => acts.cumsOnAss(mc, npc),
        cum_on_back: (mc, npc) => acts.cumsOnBack(mc, npc)
    };

    /** Finishes: each one is its own event (the MC has to get back to full arousal first), so unlike the ongoing acts,
        which the scene re-renders on every click, they count every time, not once per scene. */
    const FINISHES = new Set([
        'cum_in_pussy', 'cum_in_ass', 'cum_in_mouth', 'cum_in_throat', 'cum_throat', 'cum_on_face', 'cum_on_tits',
        'cum_on_stomach', 'grind_cum', 'cum_on_pussy', 'cum_on_ass', 'assjob_cum', 'cum_on_back'
    ]);

    /** Group scene stat categories (the stats / stats2 / stats3 of the threesome and foursome actions). */
    const MC_SCENE_CATEGORIES = {
        bj: (mc, npc) => acts.blowsCock(npc, mc),
        dp: (mc, npc) => acts.deepThroatsCock(npc, mc),
        pussy: (mc, npc) => acts.fucksPussy(mc, npc),
        anal: (mc, npc) => acts.fucksAss(mc, npc)
    };

    /** Group scene actions that need more than their stat categories: key → acts between the MC and girls [1, 2(, 3)]. */
    const GROUP_SCENE_ACTIONS = {
        sn: (mc, girls) => {
            if (girls.length === 2) {
                // threesome: "You lick %name%'s pussy, while she licks %name2%'s pussy (or sucks her dick), who is
                // sucking yours" (girl 2's blowjob is her 'bj' category)
                acts.licksPussy(mc, girls[0]);
                if (hasPussy(girls[1])) acts.licksPussy(girls[0], girls[1]);
                else acts.blowsCock(girls[0], girls[1]);
            } else {
                // foursome: the MC and girl 1 sixty-nine, girls 2 and 3 "lick each other"
                acts.sixtyNine(mc, girls[0]);
                acts.sixtyNine(girls[1], girls[2]);
            }
        }
    };

    /** Mistress scene action keys (views/npc/fuck/mistress/fuck.tw) → acts between the mistress and the slave. */
    const MISTRESS_SCENE_ACTIONS = {
        mistress_handjob: (mistress, slave) => acts.givesHandJob(slave, mistress),
        mistress_footjob: (mistress, slave) => acts.givesFootJob(slave, mistress),
        mistress_titjob: (mistress, slave) => acts.givesTitJob(slave, mistress),
        mistress_face_strapon: (mistress, slave) => acts.fucksPussy(slave, mistress),   // the slave wears it on the face
        mistress_pussy_lick: (mistress, slave) => acts.licksPussy(mistress, slave),
        mistress_licked: (mistress, slave) => acts.licksPussy(slave, mistress),         // "Sit on face"
        mistress_bj: (mistress, slave) => acts.blowsCock(slave, mistress),      // her strap-on counts as a cock
        mistress_dp: (mistress, slave) => acts.deepThroatsCock(slave, mistress),
        mistress_rimjob: (mistress, slave) => acts.eatsAss(slave, mistress),
        mistress_pussy: (mistress, slave) => acts.fucksPussy(mistress, slave),
        mistress_anal_fingering: (mistress, slave) => acts.fingersAss(mistress, slave),
        mistress_anal: (mistress, slave) => acts.fucksAss(mistress, slave),
        mistress_anal_fisting: (mistress, slave) => acts.fistsAss(mistress, slave)
    };

    function onceThisScene(npc, key, recordIt) {
        const done = (variables().sexActsThisScene ??= {});
        const id = (npc?.id ?? npc?.name ?? '?') + ':' + key;
        if (done[id]) {
            return;
        }
        done[id] = true;
        recordIt();
    }

    /* ---------- reading ---------- */

    const countIn = (npc, key, metric) => Number(npc?.[key]?.[metric]) || 0;

    function checkMetric(metric) {
        if (!METRICS.includes(metric)) {
            throw new Error('setup.sexActs: unknown metric ' + metric);
        }
    }

    /* ---------- old saves: statsSex (mixed) and sexStats (MC) ---------- */

    // best effort: only what has a clear meaning; anything else (and anything the NPC's anatomy rules out) is dropped
    const LEGACY = {
        statsSex: {
            counter: COUNTERS.others,   // mixed the MC with everyone else, so it can't be split
            metrics: {
                bj: 'givenBlowJob', sn: 'mutualSixtyNine', dp: 'givenDeepThroatCock',
                pussy: 'receivedPussyFucked', pussy_fisting: 'receivedPussyFisting',
                anal: 'receivedAssFucked', anal_fingering: 'receivedAssFingering', anal_fisting: 'receivedAssFisting'
            }
        },
        sexStats: {
            counter: COUNTERS.mc,
            metrics: {
                creampies: 'receivedVaginalCreampie', pussy: 'receivedPussyFucked',
                bj: 'givenBlowJob', anal: 'receivedAssFucked'
            }
        }
    };
    const NEEDS_PUSSY = /Pussy|Vagina/;
    const NEEDS_COCK_RECEIVED = /^received(BlowJob|DeepThroatCock)$/;

    function legacyAllowed(npc, metric) {
        if (metric.startsWith('received') && NEEDS_PUSSY.test(metric)) return hasPussy(npc);
        if (NEEDS_COCK_RECEIVED.test(metric)) return hasCock(npc);
        return true;
    }

    return Object.freeze({
        ...acts,

        METRICS,
        ASS_METRICS,

        hasCock,
        hasPussy,
        hasBreasts,
        canPenetrate,

        /** An anonymous partner with no counters (a street client, a kidnapper). */
        someone: function (gender = 1) {
            return Object.freeze({ anonymous: true, gender, name: 'someone' });
        },

        /** Starts a sex scene: from now on, each scene action counts once per NPC. */
        startScene: function () {
            variables().sexActsThisScene = {};
        },

        /** Records a one-on-one scene action ($sexAction) between the MC and npc: once per scene, except finishes
            (FINISHES), which count every time. */
        mcSceneAction: function (actionKey, npc) {
            const recordIt = MC_SCENE_ACTIONS[actionKey];
            if (!recordIt) {
                return;
            }
            if (FINISHES.has(actionKey)) {
                recordIt(variables().player, npc);
            } else {
                onceThisScene(npc, actionKey, () => recordIt(variables().player, npc));
            }
        },

        /** Records a group scene stat category ('bj', 'dp', 'pussy', 'anal') between the MC and npc, once per scene. */
        mcSceneCategory: function (category, npc) {
            const recordIt = MC_SCENE_CATEGORIES[category];
            if (recordIt) {
                onceThisScene(npc, 'category:' + category, () => recordIt(variables().player, npc));
            }
        },

        /** Records a threesome / foursome action ($sexAction) between the MC and the girls, once per scene (only actions
            whose stat categories don't tell the whole story; see GROUP_SCENE_ACTIONS). */
        groupSceneAction: function (actionKey, ...girls) {
            const recordIt = GROUP_SCENE_ACTIONS[actionKey];
            if (recordIt) {
                onceThisScene(girls[0], 'group:' + actionKey, () => recordIt(variables().player, girls));
            }
        },

        /** Records a mistress scene action ($sexAction) between the mistress and the slave, once per scene. */
        mistressSceneAction: function (actionKey, mistress, slave) {
            const recordIt = MISTRESS_SCENE_ACTIONS[actionKey];
            if (recordIt) {
                onceThisScene(slave, actionKey, () => recordIt(mistress, slave));
            }
        },

        /** How many times npc did or received metric, with anyone (both counters). */
        count: function (npc, metric) {
            checkMetric(metric);
            return countIn(npc, COUNTERS.mc, metric) + countIn(npc, COUNTERS.others, metric);
        },

        /** How many times npc did or received metric with the MC. */
        countWithMc: function (npc, metric) {
            checkMetric(metric);
            return countIn(npc, COUNTERS.mc, metric);
        },

        /** All ass-related acts (every metric with "Ass" in its name), with anyone. */
        totalAss: function (npc) {
            return ASS_METRICS.reduce((sum, metric) => sum + this.count(npc, metric), 0);
        },

        /** True when npc has any act recorded with the MC. */
        hadSexWithMc: function (npc) {
            return METRICS.some(metric => countIn(npc, COUNTERS.mc, metric) > 0);
        },

        /**
         * The data for the NPC info table: every metric above 0, split by counter, plus the summary numbers.
         *   { received: [{ metric, withMc, others }], given: [...], mutual: [...], total, ass, sleptWithMc }
         */
        metricsTable: function (npc) {
            const rows = prefix => METRICS
                .filter(metric => metric.startsWith(prefix))
                .map(metric => ({ metric, withMc: countIn(npc, COUNTERS.mc, metric), others: countIn(npc, COUNTERS.others, metric) }))
                .filter(row => row.withMc + row.others > 0);
            return {
                received: rows('received'),
                given: rows('given'),
                mutual: rows('mutual'),
                total: METRICS.reduce((sum, metric) => sum + this.count(npc, metric), 0),
                ass: this.totalAss(npc),
                sleptWithMc: this.hadSexWithMc(npc)
            };
        },

        /** True when npc has any act recorded at all. */
        hasAny: function (npc) {
            return METRICS.some(metric => this.count(npc, metric) > 0);
        },

        /**
         * Converts an NPC from an old save: statsSex → generalSexStats, sexStats → mainCharSexStats (best effort, see
         * LEGACY), then deletes the old counters. Returns true if anything was converted.
         */
        migrateLegacyCounters: function (npc) {
            let changed = false;
            for (const [oldKey, { counter: newKey, metrics }] of Object.entries(LEGACY)) {
                const old = npc?.[oldKey];
                if (!old || typeof old !== 'object') {
                    continue;
                }
                counter(npc, false);
                for (const [oldMetric, newMetric] of Object.entries(metrics)) {
                    const value = Number(old[oldMetric]) || 0;
                    if (value > 0 && legacyAllowed(npc, newMetric)) {
                        npc[newKey][newMetric] += value;
                    }
                }
                delete npc[oldKey];
                changed = true;
            }
            return changed;
        }
    });
})();
