/*
 * Church service, overnight: on top of the nightly happiness lift every working nun gives (js/sleep/processNpc.js),
 * each nun may do a little more for the household, by the way she serves (setup.churchService.focus).
 * Run once a night from the sleep widget, before the guest loop, so a guest she talks into staying is kept by
 * that night's leave check (keptTonight).
 *
 * Each impact in IMPACTS has:
 *   id:      unique name, also the key into TEXT
 *   focus:   'kind', 'love' or 'power'
 *   targets: function (nun, ctx), what it would work on tonight, or null if it can't happen
 *   apply:   function (nun, targets, ctx), makes the changes and returns the sleep message (use line() for the text),
 *            or a list of them: the main line, then any friendships it made, each on its own line
 * ctx holds { day, guests, served }: guests is everyone in the guest house but the nun, served adds the slaves when the
 * base policy lets nuns attend to them (setup.churchService.served). Holy and love impacts reach served; power ones
 * only guests, since the mistress already shapes the slaves, and only guests can be talked out of leaving.
 */
setup.churchNightly = {
    /* Chance out of 100 a nun does nothing extra (NONE), one thing (up to ONE) or two things (the rest) */
    CHANCE_NONE: 70,
    CHANCE_ONE: 90,
    /* Holy: jobs that wear on the people doing them (as the rest tick in processNpc counts them) */
    UNHAPPY_JOBS: ['milk_barn', 'nightclub', 'quarry', 'streets'],
    /* Love: guests who arrived fewer than this many days ago are still new */
    NEW_GUEST_DAYS: 30,
    /* Power: below these, a mind counts as stubborn or repressed */
    STUBBORN_BELOW: 20,
    REPRESSED_BELOW: 30,

    /*
     * What each impact says, as { say, feral }: feral nuns can't lead a group or talk anyone round, so they do it by
     * example. {nun} {he} {his} {him} are the nun, {guest} {gHe} {gHis} {gHim} the one guest, and [words] are the
     * key words that show who took part on hover.
     */
    TEXT: {
        needy: {
            say: '{nun} went out among the needy and the vulnerable of the settlement with what help {he} could give.',
            feral: '{nun} spent the day among the needy and the vulnerable of the settlement, sharing {his} food and curling up beside the ones who were alone.'
        },
        together: {
            say: '{nun} spent the evening encouraging the settlers and bringing them together.',
            feral: '{nun} roamed among the settlers all evening, and wherever {he} settled, people drifted over and stayed to talk to each other.'
        },
        support: {
            say: '{nun} held a [spiritual support group] for those in the hardest jobs.',
            feral: '{nun} waited at the gate for those coming back from the hardest jobs and pressed close to each of them, a quiet comfort that eased [several of them].'
        },
        unhappyStay: {
            say: '{nun} found {guest} packing to leave, miserable, and sat up with {gHim} until {gHe} agreed to stay <strong>one more day</strong>.',
            feral: '{nun} found {guest} packing to leave, miserable, then curled up on the half-packed bedroll and would not budge, until {guest} gave in and agreed to stay <strong>one more day</strong>.'
        },
        downtrodden: {
            say: '{nun} sought out [the downtrodden] of the household and lifted them up.',
            feral: '{nun} sought out [the downtrodden] of the household and kept close to them all day, an example of simple, wordless kindness.'
        },
        welcome: {
            say: '{nun} made [the newcomers] feel at home.',
            feral: '{nun} sniffed out [the newcomers] and claimed them as {his} own, an example of open-hearted welcome that put them at ease.'
        },
        distrustStay: {
            say: '{nun} caught {guest} at the door with {gHis} things, ready to give up on this place, and talked {gHim} into staying <strong>one more day</strong>.',
            feral: '{nun} caught {guest} at the door with {gHis} things, ready to give up on this place, and lay down across the doorway until {guest} agreed to stay <strong>one more day</strong>.'
        },
        intimacy: {
            say: '{nun} held an [intimacy support group] for the married.',
            feral: '{nun} set an example of unashamed tenderness that sent [the married couples] off to bed early and in each other\'s arms.'
        },
        connections: {
            say: '{nun} held a [new connections group] for those who had yet to make a friend here.',
            feral: '{nun} herded [the loners] of the household into one warm heap by the fire, and by the end of the evening they were talking to each other.'
        },
        devotion: {
            say: '{nun} led a [devotion prayer group].',
            feral: '{nun} set an example in unyielding devotion that moved [several in the household].'
        },
        stubborn: {
            say: '{nun} worked on [the stubborn minds] in the household, loosening them.',
            feral: '{nun} set an example of eager obedience that wore down [the stubborn minds] in the household.'
        },
        temptation: {
            say: '{nun} led a [temptation prayer group].',
            feral: '{nun} set an example in shameless temptation that stirred [several in the household].'
        },
        repressed: {
            say: '{nun} helped [the repressed] in the household let go a little.',
            feral: '{nun} set an example of uninhibited pleasure that loosened up [the repressed] in the household.'
        }
    },

    /** Called from the sleep widget, once a night (day is the new day) */
    nightly: function (day) {
        if (!setup.churchService.isActive()) {
            return;
        }
        for (const nun of setup.churchService.nuns()) {
            if (!this.working(nun, day)) {
                continue;
            }
            const roll = random(1, 100);
            const count = roll <= this.CHANCE_NONE ? 0 : roll <= this.CHANCE_ONE ? 1 : 2;
            if (!count) {
                continue;
            }
            const ctx = {
                day: day,
                guests: (variables().guests ?? []).filter(npc => npc.id !== nun.id),
                served: setup.churchService.served().filter(npc => npc.id !== nun.id)
            };
            const focus = setup.churchService.focus(nun);
            const options = this.IMPACTS
                .filter(impact => impact.focus === focus)
                .map(impact => ({ impact: impact, targets: impact.targets.call(this, nun, ctx) }))
                .filter(option => option.targets);
            for (const option of options.shuffle().slice(0, count)) {
                [].concat(option.impact.apply.call(this, nun, option.targets, ctx)).forEach(message => setup.sleepMessages.addJob(message, 'church'));
            }
        }
    },

    /** Whether the nun put in her day at the church (the same test as her nightly lift) and is staying herself */
    working: function (nun, day) {
        return typeof nun.sick === 'undefined'
            && !setup.churchEncounters.skipsWork(nun, day)
            && !setup.sleep.guestWouldLeave(nun);
    },

    /** Read by the leave check in processNpc: a nun talked this guest into one more day */
    keptTonight: function (npc, day) {
        return npc.churchStayDay === day;
    },

    IMPACTS: [
        {
            id: 'needy',
            focus: 'kind',
            targets: () => true,
            apply: function (nun) {
                const amount = random(1, 2);
                variables().player.goodwill = (variables().player.goodwill ?? 0) + amount;
                return this.line('needy', nun) + ' <strong>+' + amount + ' goodwill</strong>';
            }
        },
        {
            id: 'together',
            focus: 'kind',
            targets: () => (variables().player?.baseManagement?.settlers ?? 0) > 0 || null,
            apply: function (nun) {
                const amount = setup.churchEncounters.changeSettlementReputation(random(1, 2), false);
                return this.line('together', nun) + (amount ? ' <strong>+' + amount + ' settlement reputation</strong>' : '');
            }
        },
        {
            id: 'support',
            focus: 'kind',
            targets: function (nun, ctx) {
                const workers = ctx.served.filter(npc => this.UNHAPPY_JOBS.includes(npc.assignedTo));
                return workers.length >= 2 ? workers.shuffle().slice(0, random(2, 5)) : null;
            },
            apply: function (nun, workers) {
                const amount = this.gain(nun, 'happy', 1, 3);
                workers.forEach(npc => this.change(npc, 'happy', amount));
                return this.line('support', nun, { group: this.names(workers) }) + ' <strong>+' + amount + ' happy</strong>';
            }
        },
        {
            id: 'unhappyStay',
            focus: 'kind',
            targets: function (nun, ctx) {
                const leaving = ctx.guests.filter(npc => setup.sleep.guestWouldLeave(npc) && !this.keptTonight(npc, ctx.day)
                    && npc.happy < -70);
                return leaving.length ? leaving.random() : null;
            },
            apply: function (nun, guest, ctx) {
                guest.churchStayDay = ctx.day;
                return this.line('unhappyStay', nun, { guest: guest });
            }
        },
        {
            id: 'downtrodden',
            focus: 'kind',
            targets: function (nun, ctx) {
                const low = ctx.served.filter(npc => (npc.happy ?? 0) < 0);
                return low.length ? low : null;
            },
            apply: function (nun, guests) {
                const amount = this.gain(nun, 'happy', 3, 5);
                guests.forEach(npc => this.change(npc, 'happy', amount));
                return this.line('downtrodden', nun, { group: this.names(guests) }) + ' <strong>+' + amount + ' happy</strong>';
            }
        },
        {
            id: 'welcome',
            focus: 'love',
            targets: function (nun, ctx) {
                const fresh = ctx.served.filter(npc => {
                    const days = (npc.history ?? []).map(entry => entry.day).filter(d => typeof d === 'number');
                    return days.length && ctx.day - Math.min(...days) < this.NEW_GUEST_DAYS;
                });
                return fresh.length ? fresh : null;
            },
            apply: function (nun, guests) {
                const happy = this.gain(nun, 'happy', 1, 2), trust = random(2, 4), bond = random(1, 2);
                const messages = [];
                for (const npc of guests) {
                    this.change(npc, 'happy', happy);
                    this.change(npc, 'relationship', trust);
                    messages.push(...this.bond(npc, nun, bond));
                }
                return [this.line('welcome', nun, { group: this.names(guests) })
                    + ' <strong>+' + happy + ' happy, +' + trust + ' relationship</strong>', ...messages];
            }
        },
        {
            id: 'distrustStay',
            focus: 'love',
            targets: function (nun, ctx) {
                const leaving = ctx.guests.filter(npc => setup.sleep.guestWouldLeave(npc) && !this.keptTonight(npc, ctx.day)
                    && npc.relationship < 0);
                return leaving.length ? leaving.random() : null;
            },
            apply: function (nun, guest, ctx) {
                guest.churchStayDay = ctx.day;
                return this.line('distrustStay', nun, { guest: guest });
            }
        },
        {
            id: 'intimacy',
            focus: 'love',
            targets: function (nun, ctx) {
                const pairs = this.spousePairs(ctx.served);
                return pairs.length ? pairs : null;
            },
            apply: function (nun, pairs) {
                const amount = this.gain(nun, 'between', 2, 4);
                const messages = [];
                for (const [a, b] of pairs) {
                    messages.push(...this.bond(a, b, amount));
                }
                const couples = pairs.map(([a, b]) => a.name + ' and ' + b.name);
                return [this.line('intimacy', nun, { group: couples }) + ' <strong>+' + amount + ' to each other</strong>', ...messages];
            }
        },
        {
            id: 'connections',
            focus: 'love',
            targets: function (nun, ctx) {
                const friends = setup.eveningSchoolSocial.TUNING.FRIENDS;
                const lonely = ctx.served.filter(npc => !Object.values(npc.relationshipBetween?.stats ?? {}).some(value => value >= friends));
                return lonely.length >= 2 ? lonely.shuffle().slice(0, random(2, 5)) : null;
            },
            apply: function (nun, guests) {
                const amount = this.gain(nun, 'between', 3, 5), toNun = random(1, 3);
                const messages = [];
                guests.forEach((a, i) => guests.slice(i + 1).forEach(b => messages.push(...this.bond(a, b, amount))));
                guests.forEach(npc => messages.push(...this.bond(npc, nun, toNun)));
                return [this.line('connections', nun, { group: this.names(guests) })
                    + ' <strong>+' + amount + ' to each other</strong>', ...messages];
            }
        },
        {
            id: 'devotion',
            focus: 'power',
            targets: function (nun, ctx) {
                return this.group(this.adults(ctx), 2, 4);
            },
            apply: function (nun, guests) {
                const amount = this.gain(nun, 'sub', 1, 3);
                guests.forEach(npc => this.change(npc, 'sub', amount));
                return this.line('devotion', nun, { group: this.names(guests) }) + ' <strong>+' + amount + ' submission</strong>';
            }
        },
        {
            id: 'stubborn',
            focus: 'power',
            targets: function (nun, ctx) {
                return this.group(this.adults(ctx).filter(npc => (npc.sub ?? 0) < this.STUBBORN_BELOW), 1, 2);
            },
            apply: function (nun, guests) {
                const amount = this.gain(nun, 'sub', 3, 5);
                guests.forEach(npc => this.change(npc, 'sub', amount));
                return this.line('stubborn', nun, { group: this.names(guests) }) + ' <strong>+' + amount + ' submission</strong>';
            }
        },
        {
            id: 'temptation',
            focus: 'power',
            targets: function (nun, ctx) {
                return this.group(this.adults(ctx), 2, 4);
            },
            apply: function (nun, guests) {
                const amount = this.gain(nun, 'corruption', 1, 3);
                guests.forEach(npc => this.change(npc, 'corruption', amount));
                return this.line('temptation', nun, { group: this.names(guests) }) + ' <strong>+' + amount + ' corruption</strong>';
            }
        },
        {
            id: 'repressed',
            focus: 'power',
            targets: function (nun, ctx) {
                return this.group(this.adults(ctx).filter(npc => (npc.corruption ?? 0) < this.REPRESSED_BELOW), 1, 2);
            },
            apply: function (nun, guests) {
                const amount = this.gain(nun, 'corruption', 3, 5);
                guests.forEach(npc => this.change(npc, 'corruption', amount));
                return this.line('repressed', nun, { group: this.names(guests) }) + ' <strong>+' + amount + ' corruption</strong>';
            }
        }
    ],

    /** The impact's text for this nun (spoken, or by example if she is feral), filled in. opts: { group: names, guest } */
    line: function (id, nun, opts = {}) {
        const text = this.TEXT[id][setup.churchEncounters.isFeral(nun) ? 'feral' : 'say'];
        const guest = opts.guest;
        const words = {
            nun: nun.name, he: this.he(nun), his: this.his(nun), him: this.him(nun),
            guest: guest?.name, gHe: guest && this.he(guest), gHis: guest && this.his(guest), gHim: guest && this.him(guest)
        };
        return text
            .replace(/\{(\w+)\}/g, (match, key) => words[key] ?? match)
            .replace(/\[([^\]]+)\]/g, (match, label) => this.hover(opts.group ?? [], label));
    },

    /** label, with the names of who took part on hover */
    hover: function (names, label) {
        return '<span data-balloon-length="large" data-balloon-pos="up" aria-label="' + Util.escape(names.join(', ')) + '" style="border-bottom: 1px dotted">'
            + label + '</span>';
    },

    names: function (npcs) {
        return npcs.map(npc => npc.name);
    },

    /** A roll for what the nun does, shaded by her traits (setup.churchEncounters.NUN_TRAITS); she always manages at least 1 */
    gain: function (nun, effect, low, high) {
        return Math.max(1, random(low, high) + setup.churchEncounters.nunBonus(nun, effect));
    },

    adults: function (ctx) {
        return ctx.guests.filter(npc => setup.getAge(npc) >= 18);
    },

    /** from to high of the pool at random, or null if there aren't at least from */
    group: function (pool, from, high) {
        return pool.length >= from ? pool.shuffle().slice(0, random(from, high)) : null;
    },

    change: function (npc, stat, amount) {
        const low = ['happy', 'relationship'].includes(stat) ? -100 : 0;
        npc[stat] = Math.clamp((npc[stat] ?? 0) + amount, low, 100);
    },

    /** Both of them warm to each other by amount; returns any friendship messages it brings */
    bond: function (a, b, amount) {
        /* A nun's own ties are shaded by her warmth (setup.churchEncounters.tieBonus) */
        amount = Math.max(0, amount + setup.churchEncounters.tieBonus(a, b, amount));
        const before = setup.relationshipBetween.pairBefore(a, b);
        for (const [from, to] of [[a, b], [b, a]]) {
            from.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
            from.relationshipBetween.stats ??= {};
            from.relationshipBetween.stats[to.id] = Math.clamp((from.relationshipBetween.stats[to.id] ?? 0) + amount, -100, 100);
        }
        return setup.relationshipBetween.milestones(a, b, ' at the church', before, 'the church');
    },

    /**
     * Every pair of spouses among these people, none of them married to the MC: a husband and each wife, and the wives
     * of one household with each other.
     */
    spousePairs: function (guests) {
        const here = new Map(guests.map(npc => [npc.id, npc]));
        const pairs = [];
        const seen = new Set();
        const add = (a, b) => {
            const key = [a.id, b.id].sort().join('|');
            if (a !== b && !seen.has(key)) {
                seen.add(key);
                pairs.push([a, b]);
            }
        };
        for (const npc of guests) {
            const head = npc.family?.husband && npc.family.husband !== 'mc' ? here.get(npc.family.husband) : (npc.family?.wives?.length ? npc : null);
            if (!head) {
                continue;
            }
            const unit = [head].concat((head.family?.wives ?? []).map(id => here.get(id)).filter(Boolean));
            unit.forEach((a, i) => unit.slice(i + 1).forEach(b => add(a, b)));
        }
        return pairs;
    },

    he: npc => setup.pronounceWhat(npc),
    him: npc => setup.pronounceWho(npc),
    his: npc => setup.pronounceWhos(npc)
};
