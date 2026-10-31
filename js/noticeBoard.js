/*
 * Notice Board: a plank by the gate (later the Town Hall) where guests, settlers, allied settlements and
 * strangers pin requests, and the men of the guest house ask for a helping hand. Unlocks once 5+ settlers
 * live in the settlement (Event - Notice board).
 *
 *   $noticeBoard = { day, rep, streak, lastDoneDay, crateDay, nextId, posted: [request], counts: {cat: n},
 *                    failed, recent: [{ day, title, ok }], legendDone, legendPending, flags: {} }
 *   request = { id, key, cat, gold, title, note, giverId, giverName, giverGender, otherId, otherName, settlementId,
 *               posted, taken, deadline, need: { item: n }, data: {} }
 *
 * Every morning (setup.noticeBoard.nightly) untaken notes older than 2 days come down, missed deadlines cost
 * the guest who asked a little happiness, and new notes go up to fill the free slots. Disputes are judged
 * straight from the board; leaving one unjudged for 2 days lets it boil over (happiness only).
 * Finishing requests builds the leader reputation: tiers add slots and small passive bonuses, a 7-day
 * streak earns a supply crate, Legend brings a unique recruit. Passages: 'Notice board', 'Notice board -
 * result', 'Notice board - ledger', 'Notice board - fight won/lost', 'Event - Notice board', 'Event - Notice
 * board legend'.
 */
setup.noticeBoard = {
    UNLOCK_SETTLERS: 5,
    AVAILABLE_DAYS: 2,
    GOLD_CHANCE: 5,
    STREAK_DAYS: 7,
    MISSED_HAPPY: -5,
    MAX_SLOTS: 6,
    TIERS: [
        { key: 'unknown',   name: 'Unknown',   from: 0,   bonus: '3 notes on the board' },
        { key: 'reliable',  name: 'Reliable',  from: 15,  bonus: '+1 note on the board' },
        { key: 'respected', name: 'Respected', from: 40,  bonus: 'Guests are a little happier every day' },
        { key: 'renowned',  name: 'Renowned',  from: 80,  bonus: '+1 note on the board, settlements trade 5% cheaper' },
        { key: 'legend',    name: 'Legend',    from: 150, bonus: 'Gold notices twice as often, someone special comes looking for you' }
    ],
    CATS: {
        wish:     { name: 'Guest wish',        icon: '&#x1F4AC;', img: 'places/cabin/nb_wish.jpg' },
        help:     { name: 'Helping hand',      icon: '&#x1F528;', img: 'places/forest/chop_wood1.webp' },
        dispute:  { name: 'Dispute',           icon: '&#x2696;&#xFE0F;', img: 'places/cabin/nb_dispute.jpg' },
        settler:  { name: 'Settler problem',   icon: '&#x1F3E0;', img: 'places/cabin/nb_settler.jpg' },
        contract: { name: 'Settlement contract', icon: '&#x1F4DC;', img: 'places/cabin/nb_contract.jpg' },
        stranger: { name: 'Stranger',          icon: '&#x1F6B6;', img: 'places/cabin/nb_stranger.jpg' }
    },

    /* ── state ───────────────────────────────────────────────────────────── */

    state: function () {
        return variables().noticeBoard ?? null;
    },

    isOpen: function () {
        return !!this.state();
    },

    introReady: function () {
        return !this.isOpen() && (variables().player?.baseManagement?.settlers ?? 0) >= this.UNLOCK_SETTLERS && !!variables().game?.cabinName;
    },

    hasTownHall: function () {
        return (variables().player?.baseManagement?.buildings?.town_hall ?? 0) > 0;
    },

    /** Opens the board (intro event): three notes, one of them an easy guest wish */
    open: function () {
        const v = variables();
        v.noticeBoard = { day: v.game.day, rep: 0, streak: 0, lastDoneDay: -10, crateDay: -10, nextId: 1, posted: [],
                          counts: {}, failed: 0, recent: [], legendDone: false, legendPending: false, flags: {} };
        const easy = this.make('rations') || this.make('clothes') || this.make('gift');
        if (easy) this.state().posted.push(easy);
        this.fill(3);
    },

    tierIndex: function () {
        const rep = this.state()?.rep ?? 0;
        let idx = 0;
        this.TIERS.forEach((t, i) => { if (rep >= t.from) idx = i; });
        return idx;
    },

    tier: function () {
        return this.TIERS[this.tierIndex()];
    },

    nextTier: function () {
        return this.TIERS[this.tierIndex() + 1] ?? null;
    },

    slots: function () {
        const ti = this.tierIndex();
        return Math.min(this.MAX_SLOTS, 3 + (ti >= 1 ? 1 : 0) + (ti >= 3 ? 1 : 0) + (this.hasTownHall() ? 1 : 0));
    },

    /** Renowned and above: settlements trade 5% cheaper (setup.settlements.getTradeModifier) */
    tradeDiscount: function () {
        return this.isOpen() && this.tierIndex() >= 3 ? 0.95 : 1;
    },

    open_count: function () {
        return (this.state()?.posted ?? []).length;
    },

    /* ── helpers ─────────────────────────────────────────────────────────── */

    guest: function (id) {
        return (variables().guests ?? []).find(g => g.id === id) ?? null;
    },

    /** Adult guests who can pin a note. who: 'women' (women and trans women), 'men' (men and trans men), or everyone */
    adultGuests: function (who) {
        return (variables().guests ?? []).filter(g => setup.getAge(g) >= 18 && !(g.traits ?? []).includes('feral')
            && (!who || (who === 'men') === [1, 3].includes(g.gender ?? 0)));
    },

    /** A man from the guest house for a helping-hand note */
    pickHelper: function () {
        const g = this.rand(this.adultGuests('men').filter(g => !this.busy(g.id) && typeof g.rest === 'undefined'));
        return g ? { giver: g } : null;
    },

    rand: function (list) {
        return list.length ? list[window.randomInteger(0, list.length - 1)] : null;
    },

    itemName: function (id) {
        try { return Item.get(id).name; } catch (e) { return id; }
    },

    itemExists: function (id) {
        try { return !!Item.get(id); } catch (e) { return false; }
    },

    needText: function (need) {
        return Object.keys(need ?? {}).map(k => need[k] + ' ' + this.itemName(k)).join(', ');
    },

    hasNeed: function (need) {
        return Object.keys(need ?? {}).every(k => setup.cabinInventory.count(k) >= need[k]);
    },

    takeNeed: function (need) {
        for (const k of Object.keys(need ?? {})) setup.cabinInventory.drop(k, need[k]);
    },

    friendlySettlements: function () {
        return setup.settlements.getAll().filter(s => s.discovered && !s.destroyed && (s.relationship ?? 0) >= 20);
    },

    daysLeft: function (req) {
        return req.deadline === null || req.deadline === undefined ? null : req.deadline - variables().game.day;
    },

    /** Is a guest already the giver (or other side) of a note on the board? */
    busy: function (id) {
        return (this.state()?.posted ?? []).some(r => r.giverId === id || r.otherId === id);
    },

    /* ── templates ───────────────────────────────────────────────────────── */

    /*
     * pick()   -> data for a new note, or null when it can't be posted right now
     * build(d) -> { title, note, need?, deadline (days after taking, or for 'judge' notes after posting) }
     * mode: 'give' (hand over items), 'scene' (spend time doing it; when() limits the hours),
     *       'judge' (choices straight from the board, no taking), 'fight' (go and fight)
     * reward / resolve: what finishing it does; resolve returns { text, reward?, img?, ok? }
     * Texts and labels: %G% the giver's name, %They% %they% %Them% %them% %Their% %their% %themself% the giver's
     * she/he, her/him, her/his, herself/himself (see fillText)
     */
    TEMPLATES: {
        /* ── guest wishes ── */
        gift: {
            cat: 'wish', weight: 4, mode: 'give',
            pick: nb => {
                const g = nb.rand(nb.adultGuests().filter(g => !nb.busy(g.id) && (g.likes ?? []).filter(l => nb.itemExists(l)).length));
                return g ? { giver: g, item: nb.rand(g.likes.filter(l => nb.itemExists(l))) } : null;
            },
            build: (nb, d) => ({ title: d.giver.name + ' wishes for a gift: ' + nb.itemName(d.item),
                note: 'If anyone finds something like this out there - ' + nb.itemName(d.item).toLowerCase() + ' - I would be very, very grateful.', need: { [d.item]: 1 }, deadline: 3 }),
            reward: { rel: 5, happy: 8, rep: 2 },
            done: 'You gave %G% the %ITEM%. %They% held on to it with both hands and smiled like it was the first good day in a month.'
        },
        clothes: {
            cat: 'wish', weight: 3, mode: 'give',
            pick: nb => { const g = nb.rand(nb.adultGuests().filter(g => !nb.busy(g.id))); return g ? { giver: g } : null; },
            build: (nb, d) => ({ title: d.giver.name + ' needs cloth for ' + setup.pronounceWhos(d.giver) + ' clothes', note: 'My clothes are falling apart at the seams. Three pieces of cloth would fix them.', need: { cloth: 3 }, deadline: 4 }),
            reward: { rel: 4, happy: 8, rep: 2 },
            done: '%G% spent the evening by the lamp with a needle, and the next morning %they% showed off %their% patched clothes like they were brand new.'
        },
        rations: {
            cat: 'wish', weight: 3, mode: 'give',
            pick: nb => { const g = nb.rand(nb.adultGuests().filter(g => !nb.busy(g.id))); return g ? { giver: g } : null; },
            build: (nb, d) => ({ title: d.giver.name + ' asks for extra rations', note: 'I am always hungry. Could I get a little extra? Three rations would carry me through the week.', need: { food: 3 }, deadline: 3 }),
            reward: { rel: 3, happy: 8, rep: 2 },
            done: 'You left three rations on %G%\'s bed. %They% ate one on the spot, sitting on the floor, and hid the other two under %their% pillow.'
        },
        dayoff: {
            cat: 'wish', weight: 3, mode: 'scene', label: 'Give %them% two days off',
            pick: nb => { const g = nb.rand(nb.adultGuests().filter(g => !nb.busy(g.id) && g.assignedTo && !/companion/.test(g.assignedTo) && typeof g.rest === 'undefined')); return g ? { giver: g } : null; },
            build: (nb, d) => ({ title: d.giver.name + ' asks for two days off', note: 'I have worked every single day since I got here. Two days. That is all I am asking for.', deadline: 2 }),
            reward: { rel: 3, happy: 12, rep: 2 },
            act: (nb, req, g) => { g.rest = { days: 2, reason: 'dayoff' }; },
            done: 'You told %G% to take two days for %themself%. %They% slept until noon, then spent the afternoon doing absolutely nothing, and looked better for it than %they% had in weeks.'
        },
        hottub: {
            cat: 'wish', weight: 2, mode: 'scene', label: 'Spend the evening with her in the hot tub', hours: 1,
            when: () => timeBetween('19:00', '02:00'), whenText: 'evening (19:00 - 02:00)',
            pick: nb => {
                if (!(variables().game.location?.hottub ?? false)) return null;
                const g = nb.rand(nb.adultGuests('women').filter(g => !nb.busy(g.id) && (g.likesGuys ?? true) && (g.relationship ?? 0) >= 40));
                return g ? { giver: g } : null;
            },
            build: (nb, d) => ({ title: d.giver.name + ' wants a night in the hot tub with you', note: 'Just us, some hot water, and nobody knocking. Tonight?', deadline: 3 }),
            reward: { rel: 8, happy: 10, rep: 2 },
            img: 'places/bathhouse/hottub_relax.jpg',
            done: 'You sank into the hot water with %G% under the stars. She leaned back against you, warm and slippery, and talked about everything and nothing until the water started to cool.'
        },
        crib: {
            cat: 'wish', weight: 3, mode: 'give',
            pick: nb => { const g = nb.rand(nb.adultGuests('women').filter(g => !nb.busy(g.id) && (g.pregnancy ?? -1) >= 90)); return g ? { giver: g } : null; },
            build: (nb, d) => ({ title: d.giver.name + ' needs a crib for the baby', note: 'The baby is coming and there is nowhere to put it. Some wood and cloth for a crib, please.', need: { wood: 5, cloth: 2 }, deadline: 5 }),
            reward: { rel: 5, happy: 10, rep: 3 },
            done: 'You built a crib out of the wood and padded it with cloth. %G% ran her hand along the rail for a long time without saying anything.'
        },
        bartrip: {
            cat: 'wish', weight: 2, mode: 'scene', label: 'Take her to the bar (20 caps)', hours: 3, caps: 20,
            when: () => timeBetween('18:00', '23:00'), whenText: 'evening (18:00 - 23:00)',
            pick: nb => {
                if (!(variables().game.location?.bar ?? false)) return null;
                const g = nb.rand(nb.adultGuests('women').filter(g => !nb.busy(g.id) && (g.relationship ?? 0) >= 20));
                return g ? { giver: g } : null;
            },
            build: (nb, d) => ({ title: d.giver.name + ' wants a night out at the bar', note: 'I have not seen the city lights in months. Take me for a drink in the underground city?', deadline: 4 }),
            reward: { rel: 8, happy: 10, rep: 2 },
            img: 'places/underground/bar.jpg',
            done: 'You took %G% down to the bar in the underground city. She drank, laughed too loud, danced with a stranger and then with you, and fell asleep on your shoulder on the way back.'
        },
        spar: {
            cat: 'wish', weight: 2, mode: 'scene', label: 'Spar with %them% (1 hour, 20 energy)', hours: 1, energy: 20,
            when: () => timeBetween('08:00', '20:00'), whenText: 'daytime (08:00 - 20:00)',
            pick: nb => { const g = nb.rand(nb.adultGuests().filter(g => !nb.busy(g.id) && (g.strength ?? 0) < 60)); return g ? { giver: g } : null; },
            build: (nb, d) => ({ title: d.giver.name + ' wants you to teach ' + setup.pronounceWho(d.giver) + ' to fight', note: 'If somebody grabs me out there, I want to be able to do more than scream. Teach me?', deadline: 4 }),
            reward: { rel: 4, happy: 5, rep: 2 },
            img: 'places/cabin/workout_strength.webp',
            act: (nb, req, g) => { g.strength = Math.min((g.strength ?? 0) + 3, 100); },
            done: 'You spent an hour in the yard with %G%, showing %them% how to break a grip and where to hit. %They% ended up in the dirt a dozen times and got up every time. <strong>(%Their% strength +3)</strong>'
        },

        /* ── helping hands (the men of the guest house) ── */
        firewood: {
            cat: 'help', weight: 3, mode: 'scene', label: 'Split wood with %them% (2 hours, 20 energy)', hours: 2, energy: 20,
            when: () => timeBetween('07:00', '19:00'), whenText: 'daytime (07:00 - 19:00)',
            pick: nb => nb.pickHelper(),
            build: (nb, d) => ({ title: d.giver.name + ' needs a hand with the firewood', note: 'Somebody dragged half a forest of logs behind the shed and left them there. Two axes, one afternoon, and we stay warm all month. You in?', deadline: 3 }),
            reward: { rel: 3, happy: 4, rep: 2, items: { wood: 10 } },
            img: 'places/forest/chop_wood1.webp',
            done: 'You took turns at the chopping block with %G% until your shoulders burned. By the end the split wood was stacked higher than either of you, and %they% clapped you on the back like an old friend.'
        },
        stone: {
            cat: 'help', weight: 2, mode: 'scene', label: 'Haul stone with %them% (3 hours, 25 energy)', hours: 3, energy: 25,
            when: () => timeBetween('07:00', '18:00'), whenText: 'daytime (07:00 - 18:00)',
            pick: nb => nb.pickHelper(),
            build: (nb, d) => ({ title: d.giver.name + ' found good building stone', note: 'An old wall came down by the quarry road. Good square stones, just lying there. I can\'t move them on my own.', deadline: 3 }),
            reward: { rel: 3, happy: 4, rep: 2, items: { stone: 8 } },
            img: 'places/explore/quarry.jpg',
            done: 'You and %G% loaded the cart until the axle groaned, then dragged it home between you. Your back would remember it tomorrow, but the stone pile by the shed had never looked better.'
        },
        hunt: {
            cat: 'help', weight: 2, mode: 'scene', label: 'Go hunting with %them% (4 hours, 25 energy)', hours: 4, energy: 25,
            when: () => timeBetween('05:00', '11:00'), whenText: 'morning (05:00 - 11:00)',
            pick: nb => nb.pickHelper(),
            build: (nb, d) => ({ title: d.giver.name + ' found deer tracks by the creek', note: 'Fresh tracks, a big buck by the size of them. I need a second man to drive it toward me. Early, before it moves on.', deadline: 2 }),
            reward: { rel: 4, happy: 6, rep: 2, items: { food: 6 } },
            resolve: () => setup.percentageChance(65)
                ? { text: 'You circled wide through the wet ferns and drove the buck straight at %G%. %They% didn\'t miss. You carried it home on a pole between you, and the guest house ate well that night.', img: 'places/forest/deer_dead.webp' }
                : { text: 'You crept through the ferns for hours. Right at the end a branch cracked under your boot, and the buck was gone in two leaps. %G% just laughed: "Next time you stay downwind."', reward: { rel: 2, happy: 2, rep: 1 }, img: 'places/forest/deer_runaway.webp' }
        },
        scrap: {
            cat: 'help', weight: 2, mode: 'scene', label: 'Watch %their% back (3 hours, 15 energy)', hours: 3, energy: 15,
            when: () => timeBetween('07:00', '18:00'), whenText: 'daytime (07:00 - 18:00)',
            pick: nb => nb.pickHelper(),
            build: (nb, d) => ({ title: d.giver.name + ' knows where there is scrap metal', note: 'There is an old station wagon in the ditch past the crossroads, still full of good metal. I need somebody watching my back while I cut it apart.', deadline: 3 }),
            reward: { rel: 3, happy: 4, rep: 2, items: { metal: 4 } },
            img: 'places/explore_car/companion_siphon_wreck.jpg',
            resolve: () => setup.percentageChance(80)
                ? { text: 'You kept an eye on the road while %G% worked the old wreck with a hacksaw and a crowbar. Nobody came. You both walked home with your arms full of metal.' }
                : { text: 'Halfway through, two ragged scavengers came up the road and eyed the pile of metal. You stood up and let them get a good look at you. They kept walking, but %G% had to leave half the pile behind to get home before dark. %They% didn\'t say much on the way, but %they% wouldn\'t forget it.', reward: { rel: 6, happy: 4, rep: 2, items: { metal: 2 } } }
        },
        roof: {
            cat: 'help', weight: 2, mode: 'give',
            pick: nb => nb.pickHelper(),
            build: (nb, d) => ({ title: d.giver.name + ' wants to fix the leaking roof', note: 'Every time it rains we put buckets out in the guest house. Bring me wood and some metal sheets and I will patch it for good.', need: { wood: 6, metal: 2 }, deadline: 4 }),
            reward: { rel: 3, happy: 4, rep: 3, happyAll: 2 },
            img: 'places/cabin/workbench.jpg',
            done: 'You hauled the wood and the metal up the ladder, and %G% spent the whole day up there hammering. The next time it rained, nobody needed a bucket.'
        },

        /* ── disputes ── */
        theft: {
            cat: 'dispute', weight: 2, mode: 'judge',
            pick: nb => nb.pickPair(),
            build: (nb, d) => ({ title: d.a.name + ' accuses ' + d.b.name + ' of theft', note: d.a.name + ' says her necklace went missing and ' + d.b.name + ' was the last one near her bed. ' + d.b.name + ' swears she never touched it.', deadline: 2, instigator: 'b' }),
            judgeText: { a: 'You ruled for %A%. %B% handed back a necklace from under her mattress without a word.', b: 'You ruled for %B%. The necklace turned up the next day behind %A%\'s own bed.', both: 'You told them both you were sick of it and gave each of them a week of latrine duty.' }
        },
        bed: {
            cat: 'dispute', weight: 2, mode: 'judge',
            pick: nb => nb.pickPair(),
            build: (nb, d) => ({ title: d.a.name + ' and ' + d.b.name + ' are fighting over a bed', note: 'The bed by the window. Both of them claim it. It already came to hair pulling once.', deadline: 2, instigator: Math.random() < 0.5 ? 'a' : 'b' }),
            judgeText: { a: 'The window bed went to %A%. %B% dragged her things to the other end of the room, sulking loudly.', b: 'The window bed went to %B%. %A% muttered about it for the rest of the day.', both: 'You moved both of them away from the window and gave the bed to someone else. Neither of them was happy, but at least they agreed on something.' }
        },
        jealousy: {
            cat: 'dispute', weight: 2, mode: 'judge',
            pick: nb => nb.pickPair(g => (g.likesGuys ?? true) && (g.relationship ?? 0) >= 50),
            build: (nb, d) => ({ title: d.a.name + ' and ' + d.b.name + ' are fighting over you', note: d.a.name + ' caught ' + d.b.name + ' coming out of your room. There was shouting. There may be more.', deadline: 2, instigator: 'a' }),
            judgeText: { a: 'You took %A%\'s side. %B% cried in the bathhouse, and %A% wore a smug little smile all evening.', b: 'You took %B%\'s side. %A% slammed every door she walked through for the rest of the day.', both: 'You sat them both down and told them nobody owns you. It went about as well as you expected, but the shouting stopped.' }
        },
        slacker: {
            cat: 'dispute', weight: 2, mode: 'judge',
            pick: nb => nb.pickPair(null, g => !!g.assignedTo),
            build: (nb, d) => ({ title: d.a.name + ' says ' + d.b.name + ' doesn\'t pull her weight', note: d.a.name + ' says ' + d.b.name + ' sleeps half the day while everyone else works. ' + d.b.name + ' says she is just slower.', deadline: 2, instigator: 'b' }),
            judgeText: { a: 'You backed %A%. %B% was out of bed before dawn the next day, glaring at everyone.', b: 'You backed %B%. %A% said fine, but she said it the way people say things that are not fine.', both: 'You doubled both of their chores for a week. The house was very clean and very quiet.' }
        },

        /* ── settler problems (Town Hall) ── */
        well: {
            cat: 'settler', weight: 3, mode: 'give',
            pick: nb => nb.hasTownHall() ? {} : null,
            build: () => ({ title: 'The settlers\' well has collapsed', note: 'The east well caved in. We need stone and timber to shore it up before the summer.', need: { stone: 10, wood: 5 }, deadline: 5 }),
            reward: { goodwill: 3, caps: 20, rep: 3 },
            done: 'Your stone and timber went down the well shaft by the cartload. By evening the settlers were drawing clean water again, and somebody pressed a pouch of caps into your hand.'
        },
        sickchild: {
            cat: 'settler', weight: 2, mode: 'give',
            pick: nb => nb.hasTownHall() ? {} : null,
            build: () => ({ title: 'A settler\'s child is sick', note: 'Our boy has had a fever for four days. We have nothing left to give him. Please.', need: { antibiotics: 1 }, deadline: 3 }),
            reward: { goodwill: 4, rep: 3 },
            done: 'You brought the antibiotics yourself. Three days later the boy was running between the houses again, and his mother would not stop thanking you.'
        },
        wolves: {
            cat: 'settler', weight: 2, mode: 'scene', label: 'Guard the pens tonight (2 hours, 20 energy)', hours: 2, energy: 20,
            when: () => timeBetween('18:00', '02:00'), whenText: 'night (18:00 - 02:00)',
            pick: nb => nb.hasTownHall() ? {} : null,
            build: () => ({ title: 'Wolves at the settlers\' pens', note: 'Something is taking our chickens at night. The tracks are wolf. Someone with a weapon, please.', deadline: 4 }),
            reward: { goodwill: 3, rep: 3, items: { pelt_wolf: 1 } },
            img: 'places/cabin/nb_settler.jpg',
            resolve: (nb, req) => {
                const p = variables().player;
                const armed = setup.cabinInventory.has('crossbow') || setup.cabinInventory.has('sword') || setup.cabinInventory.has('knife');
                if ((p.strength ?? 0) >= 30 || armed || setup.percentageChance(50)) {
                    return { ok: true, text: 'You waited in the dark behind the pens until the wolf came slinking in under the fence. It did not leave. The settlers skinned it in the morning and brought you the pelt.' };
                }
                return { ok: false, reward: { goodwill: 1, rep: 1 }, text: 'You waited half the night. When the wolf finally came it was faster than you, and it got away with a chicken in its jaws. At least the settlers saw you try.' };
            }
        },
        landquarrel: {
            cat: 'settler', weight: 2, mode: 'judge', settlerChoices: true,
            pick: nb => nb.hasTownHall() ? {} : null,
            build: () => ({ title: 'Two settler families fight over a field', note: 'The Hollands and the Petrovs both say the field by the creek is theirs. Somebody has to decide before somebody gets hurt.', deadline: 3 }),
            judgeText: { a: 'You gave the field to the Hollands. The Petrovs took it badly, but they took it.', b: 'You gave the field to the Petrovs. The Hollands grumbled and moved their fence back.', both: 'You split the field down the middle with a line of stones. Both families said it was unfair, which is how you knew it was fair.' }
        },

        /* ── settlement contracts ── */
        delivery: {
            cat: 'contract', weight: 3, mode: 'give',
            pick: nb => {
                const s = nb.rand(nb.friendlySettlements());
                if (!s) return null;
                const amounts = { food: 8, metal: 4, cloth: 4, glass: 3, rope: 3, bandage: 2, fuel: 2, plastic: 4, book: 2, duck_tape: 2, glue: 2, car_part: 1 };
                const wants = (setup.settlements.typeConfig[s.type]?.wantsGoods ?? []).filter(i => amounts[i] && nb.itemExists(i));
                const item = nb.rand(wants.length ? wants : ['food']);
                return { settlement: s, item: item, n: amounts[item] ?? 4 };
            },
            build: (nb, d) => ({ title: d.settlement.name + ' needs ' + nb.itemName(d.item).toLowerCase(), note: 'We are short on ' + nb.itemName(d.item).toLowerCase() + '. Bring us ' + d.n + ' and we pay well.', need: { [d.item]: d.n }, deadline: 5,
                caps: Math.max(15, Math.round(setup.settlements.getItemPrice(d.item) * d.n * 1.3)) }),
            reward: { settlementRel: 8, rep: 4 },
            done: 'You drove the %ITEM% over to %S%. They counted it twice and paid in full.'
        },
        escort: {
            cat: 'contract', weight: 2, mode: 'fight', label: 'Escort the caravan (4 hours)', hours: 4, enemies: [2, 0, 1],
            pick: nb => { const s = nb.rand(nb.friendlySettlements()); return s ? { settlement: s } : null; },
            build: (nb, d) => ({ title: 'Escort a caravan from ' + d.settlement.name, note: 'Our traders need an armed escort through the ruins. Raiders have been watching the road.', deadline: 4, caps: 60 }),
            reward: { settlementRel: 10, rep: 4 },
            img: 'places/cabin/nb_ambush.jpg',
            wonText: 'The raiders came out of the ruins exactly where the traders said they would. They did not get a single crate. %S% paid you at the end of the road.',
            lostText: 'The raiders were too many. You came to in the ditch with the caravan gone. %S% was not happy, but they did not blame you.'
        },
        raiders: {
            cat: 'contract', weight: 2, mode: 'fight', label: 'Clear out the raider camp (3 hours)', hours: 3, enemies: [3, 0, 2],
            pick: nb => { const s = nb.rand(nb.friendlySettlements()); return s ? { settlement: s } : null; },
            build: (nb, d) => ({ title: d.settlement.name + ' wants a raider camp cleared', note: 'A raider camp moved in near our water. We are not fighters. You are.', deadline: 5, caps: 80 }),
            reward: { settlementRel: 12, rep: 5 },
            img: 'places/cabin/nb_ambush.jpg',
            wonText: 'You hit the raider camp at dawn. When the shouting stopped there were no more raiders near the water. %S% sent you their thanks and a sack of caps.',
            lostText: 'The raider camp was better dug in than anyone said. You crawled out of there alive and not much more.'
        },
        medicine: {
            cat: 'contract', weight: 2, mode: 'give',
            pick: nb => { const s = nb.rand(nb.friendlySettlements()); return s ? { settlement: s } : null; },
            build: (nb, d) => ({ title: d.settlement.name + ' asks for bandages', note: 'Sickness in our camp and nothing to dress the wounds. Two bandages would save lives.', need: { bandage: 2 }, deadline: 3, caps: 40 }),
            reward: { settlementRel: 8, rep: 4 },
            done: 'You brought the bandages to %S%. Their healer took them like they were made of gold.'
        },

        /* ── strangers ── */
        water: {
            cat: 'stranger', weight: 2, mode: 'judge', strangerChoices: ['Give him a ration', 'Send him away'],
            pick: () => ({}),
            build: () => ({ title: 'A thirsty traveller at the gate', note: 'An old man has been sitting at the gate since dawn, lips cracked, asking for anything to eat or drink.', deadline: 1 }),
            judgeText: { a: 'You gave him a ration and a cup of water. He ate slowly, thanked you three times and went on his way. The guards who saw it talked about it all day.', b: 'You sent him away. He did not argue. He just got up and walked on.' },
            choiceReward: { a: { goodwill: 1, rep: 1, cost: { food: 1 } }, b: {} }
        },
        backpack: {
            cat: 'stranger', weight: 2, mode: 'judge', strangerChoices: ['Buy the tip (20 caps)', 'Not interested'],
            pick: () => ({}),
            build: () => ({ title: 'A scavenger sells a tip', note: 'A scavenger says he knows where a dead man\'s pack is lying, untouched. Twenty caps for the location.', deadline: 2 }),
            judgeText: { b: 'You told him you were not interested. He shrugged and went to find someone else.' },
            choiceReward: { b: {} },
            fights: {
                trap: { enemies: [2, 0, 1], reward: { rep: 1, items: { metal: 2, cloth: 2, bandage: 1 } },
                    wonText: 'The "dead man" was bait, and his friends were waiting in the gas station. They were not waiting long enough. Afterwards you took their packs instead.',
                    lostText: 'The "dead man" was bait. His friends left you in the ditch with empty pockets and a lesson about tips.' }
            }
        },
        merchant_thanks: {
            cat: 'stranger', weight: 5, mode: 'judge', strangerChoices: ['Meet him'], once: 'merchant_thanks',
            pick: () => { const q = variables().player?.quests ?? {}; return (q.wounded_merchant_helped_day !== undefined && variables().game.day - q.wounded_merchant_helped_day >= 7) ? {} : null; },
            build: () => ({ title: 'The merchant you saved is back', note: 'A trader with a healed arm asks for the man who patched him up on the road.', deadline: 3 }),
            judgeText: { a: 'It was the merchant you found bleeding by the road. He shook your hand for a long time and unloaded a crate of goods at your gate. "I said I would pay you back."' },
            choiceReward: { a: { goodwill: 2, rep: 2, caps: 60, items: { food: 6, rope: 2, bandage: 1 } } }
        },
        merchant_payback: {
            cat: 'stranger', weight: 5, mode: 'judge', strangerChoices: ['Pay them 50 caps', 'Fight them'], once: 'merchant_payback',
            pick: () => { const q = variables().player?.quests ?? {}; return (q.wounded_merchant_looted_day !== undefined && variables().game.day - q.wounded_merchant_looted_day >= 7) ? {} : null; },
            build: () => ({ title: 'Two men are asking for you at the gate', note: 'Two armed men say you robbed their cousin on the road and left him for dead. They want to talk.', deadline: 2 }),
            judgeText: { a: 'You paid them fifty caps. They counted it, spat in the dirt and left. The guards watched them all the way to the treeline.' },
            choiceReward: { a: { cost: { caps: 50 } } },
            fights: {
                b: { enemies: [2, 0, 2], reward: { rep: 1 }, lostCost: { caps: 50 },
                    wonText: 'You walked out of the gate and told them to try it. They tried it. The cousin would have to settle for an apology from somebody else.',
                    lostText: 'They beat you bloody in front of your own gate and took fifty caps out of your pocket. "Now we\'re even."' }
            }
        },

        /* ── gold notices ── */
        cache: {
            cat: 'stranger', gold: true, weight: 1, mode: 'scene', label: 'Follow the map (4 hours, 30 energy)', hours: 4, energy: 30,
            when: () => timeBetween('06:00', '18:00'), whenText: 'daytime (06:00 - 18:00)',
            pick: () => ({}),
            build: () => ({ title: 'A map to a pre-war cache', note: 'A dying scavenger left a hand-drawn map at the gate: a sealed cellar under a collapsed pharmacy, never opened.', deadline: 4 }),
            reward: { rep: 6, caps: 100, items: { antibiotics: 2, car_part: 1, body_armor: 1 } },
            img: 'places/cabin/nb_gold.jpg',
            done: 'The map was good. Under the rubble of the pharmacy you found a steel door, and behind it a cellar nobody had touched since the world ended.'
        },
        vip: {
            cat: 'contract', gold: true, weight: 1, mode: 'fight', label: 'Escort her (4 hours)', hours: 4, enemies: [3, 0, 2],
            pick: () => ({}),
            build: () => ({ title: 'A trader\'s daughter needs safe passage', note: 'A rich trader will pay handsomely for an armed escort for his daughter to the next town. Discreet. Today.', deadline: 2, caps: 150 }),
            reward: { rep: 6, items: { body_armor: 1 } },
            img: 'places/cabin/nb_gold.jpg',
            wonText: 'They came for her twice on the road, and twice they went home short of men. Her father paid exactly what he promised, and a little more.',
            lostText: 'You lost her at the bridge. Her father\'s men found her the next day, alive. Nobody paid you anything.'
        }
    },

    /** Two women from the guest house for a dispute (filters per side); nb_dispute.jpg shows two women */
    pickPair: function (bothFilter, bFilter) {
        const pool = this.adultGuests('women').filter(g => !this.busy(g.id) && (!bothFilter || bothFilter(g)));
        const bs = pool.filter(g => !bFilter || bFilter(g));
        const b = this.rand(bs);
        if (!b) return null;
        const a = this.rand(pool.filter(g => g.id !== b.id));
        return a ? { a: a, b: b } : null;
    },

    /** Builds one note from a template, or null */
    make: function (key) {
        const tpl = this.TEMPLATES[key];
        if (!tpl) return null;
        if (tpl.once && this.state()?.flags?.[tpl.once]) return null;
        const d = tpl.pick(this);
        if (!d) return null;
        const b = tpl.build(this, d);
        const st = this.state();
        const req = {
            id: st ? st.nextId++ : 1, key: key, cat: tpl.cat, gold: !!tpl.gold, title: b.title, note: b.note,
            posted: variables().game.day, taken: tpl.mode === 'judge', deadline: tpl.mode === 'judge' ? variables().game.day + (b.deadline ?? 2) : null,
            days: b.deadline ?? 3, need: b.need ?? null, caps: b.caps ?? 0, instigator: b.instigator ?? null, data: {}
        };
        if (d.giver) { req.giverId = d.giver.id; req.giverName = d.giver.name; req.giverGender = d.giver.gender ?? 0; }
        if (d.a) { req.giverId = d.a.id; req.giverName = d.a.name; req.giverGender = d.a.gender ?? 0; req.otherId = d.b.id; req.otherName = d.b.name; }
        if (d.settlement) { req.settlementId = d.settlement.id; req.settlementName = d.settlement.name; }
        if (d.item) req.data.item = d.item;
        return req;
    },

    /** Posts new notes until the board is full */
    fill: function (max) {
        const st = this.state();
        const limit = max ?? this.slots();
        let guard = 0;
        while (st.posted.length < limit && guard++ < 30) {
            // gold notices only come up now and then (twice as often for a Legend)
            const goldRoll = setup.percentageChance(this.GOLD_CHANCE * (this.tierIndex() >= 4 ? 2 : 1));
            const pool = Object.keys(this.TEMPLATES).filter(k => {
                const t = this.TEMPLATES[k];
                if (t.gold && !goldRoll) return false;
                return !st.posted.some(r => r.key === k);
            });
            const total = pool.reduce((s, k) => s + this.TEMPLATES[k].weight, 0);
            let roll = Math.random() * total, key = null;
            for (const k of pool) { roll -= this.TEMPLATES[k].weight; if (roll <= 0) { key = k; break; } }
            const req = key ? this.make(key) : null;
            if (req) st.posted.push(req);
        }
    },

    find: function (id) {
        return (this.state()?.posted ?? []).find(r => r.id === id) ?? null;
    },

    remove: function (id) {
        const st = this.state();
        st.posted = st.posted.filter(r => r.id !== id);
    },

    /** Take a note down off the board and start its deadline */
    take: function (id) {
        const r = this.find(id);
        if (!r) return;
        r.taken = true;
        r.deadline = variables().game.day + r.days;
    },

    turnDown: function (id) {
        this.remove(id);
    },

    /* ── finishing ───────────────────────────────────────────────────────── */

    fillText: function (text, req) {
        // the giver's pronouns; notes from before giverGender existed were all written by women
        const p = { gender: req.giverGender ?? 0 };
        const self = [1, 3].includes(p.gender) ? 'himself' : 'herself';
        return (text ?? '').replace(/%G%/g, req.giverName ?? 'her').replace(/%A%/g, req.giverName ?? '').replace(/%B%/g, req.otherName ?? '')
            .replace(/%S%/g, req.settlementName ?? 'the settlement').replace(/%ITEM%/g, req.data?.item ? this.itemName(req.data.item).toLowerCase() : '')
            .replace(/%They%/g, setup.pronounceWhat(p, true)).replace(/%they%/g, setup.pronounceWhat(p))
            .replace(/%Them%/g, setup.pronounceWho(p, true)).replace(/%them%/g, setup.pronounceWho(p))
            .replace(/%Their%/g, setup.pronounceWhos(p, true)).replace(/%their%/g, setup.pronounceWhos(p))
            .replace(/%themself%/g, self);
    },

    /** Applies a reward object; returns a short summary like "+5 relationship with Mia, +3 reputation" */
    applyReward: function (req, reward) {
        const v = variables();
        const st = this.state();
        const parts = [];
        const g = req.giverId ? this.guest(req.giverId) : null;
        if (g && reward.rel) { g.relationship = Math.min((g.relationship ?? 0) + reward.rel, 100); parts.push('+' + reward.rel + ' relationship with ' + g.name); }
        if (g && reward.happy) { g.happy = Math.min((g.happy ?? 0) + reward.happy, 100); parts.push('+' + reward.happy + ' happy'); }
        if (reward.happyAll) {
            for (const n of (v.guests ?? [])) n.happy = Math.min((n.happy ?? 0) + reward.happyAll, 100);
            parts.push('+' + reward.happyAll + ' happy for everyone in the guest house');
        }
        if (reward.goodwill) { v.player.goodwill = (v.player.goodwill ?? 0) + reward.goodwill; parts.push('+' + reward.goodwill + ' goodwill'); }
        const caps = (reward.caps ?? 0) + (reward.useReqCaps === false ? 0 : (req.caps ?? 0));
        if (caps) { v.player.money += caps; parts.push('+' + caps + ' caps'); }
        for (const k of Object.keys(reward.items ?? {})) { setup.cabinInventory.pickup(k, reward.items[k]); parts.push('+' + reward.items[k] + ' ' + this.itemName(k)); }
        if (reward.settlementRel && req.settlementId) {
            const s = setup.settlements.getById(req.settlementId);
            if (s) {
                setup.settlements.modifyRelationship(s, reward.settlementRel, 'Notice board: ' + req.title);
                setup.settlements.save(setup.settlements.getAll());
                parts.push('+' + reward.settlementRel + ' relationship with ' + s.name);
            }
        }
        const rep = (reward.rep ?? 0) + (req.gold ? 3 : 0);
        // remember the tier before the reputation goes up, so complete() can announce a tier-up
        if (this._tierBefore === undefined) this._tierBefore = this.tierIndex();
        if (rep) { st.rep += rep; parts.push('+' + rep + ' reputation'); }
        return parts.join(', ');
    },

    /** Bookkeeping when a note is done: counts, streak, crate, recent list. Returns extra text (crate, tier up). */
    complete: function (req, ok) {
        const v = variables();
        const st = this.state();
        const day = v.game.day;
        const tierBefore = this._tierBefore ?? this.tierIndex();
        this._tierBefore = undefined;
        this.remove(req.id);
        if (req.key && this.TEMPLATES[req.key]?.once) st.flags[this.TEMPLATES[req.key].once] = day;
        st.recent.unshift({ day: day, title: req.title, ok: ok !== false });
        st.recent = st.recent.slice(0, 12);
        if (ok === false) {
            st.failed++;
            return '';
        }
        st.counts[req.cat] = (st.counts[req.cat] ?? 0) + 1;
        st.counts.total = (st.counts.total ?? 0) + 1;
        if (req.gold) st.counts.gold = (st.counts.gold ?? 0) + 1;
        if (st.lastDoneDay !== day) {
            st.streak = st.lastDoneDay === day - 1 ? st.streak + 1 : 1;
            st.lastDoneDay = day;
        }
        let extra = '';
        if (st.streak > 0 && st.streak % this.STREAK_DAYS === 0 && st.crateDay !== day) {
            st.crateDay = day;
            const crate = { food: 10, bandage: 2, rope: 2 };
            for (const k of Object.keys(crate)) setup.cabinInventory.pickup(k, crate[k]);
            v.player.money += 50;
            extra += '<br /><br /><strong>' + this.STREAK_DAYS + ' days in a row!</strong> The settlers left a supply crate at your door: +10 food, +2 bandages, +2 rope, +50 caps.';
        }
        if (this.tierIndex() > tierBefore) {
            extra += '<br /><br /><strong>Your reputation grew: you are now ' + this.tier().name + '.</strong> ' + this.tier().bonus + '.';
            if (this.tierIndex() >= 4 && !st.legendDone) st.legendPending = true;
        }
        return extra;
    },

    /** Hand over the items of a 'give' note */
    give: function (id) {
        const req = this.find(id);
        const tpl = this.TEMPLATES[req.key];
        this.takeNeed(req.need);
        const g = req.giverId ? this.guest(req.giverId) : null;
        if (tpl.act && g) tpl.act(this, req, g);
        const rewardText = this.applyReward(req, tpl.reward ?? {});
        const extra = this.complete(req, true);
        this.setResult(req, this.fillText(tpl.done, req), rewardText, extra, tpl.img);
    },

    /** Do a 'scene' note (time/energy/caps paid by the passage link) */
    doScene: function (id) {
        const req = this.find(id);
        const tpl = this.TEMPLATES[req.key];
        const g = req.giverId ? this.guest(req.giverId) : null;
        if (tpl.caps) variables().player.money -= tpl.caps;
        if (tpl.act && g) tpl.act(this, req, g);
        let text = this.fillText(tpl.done, req), reward = tpl.reward ?? {}, ok = true, img = tpl.img;
        if (tpl.resolve) {
            const r = tpl.resolve(this, req);
            text = this.fillText(r.text, req);
            if (r.reward) reward = r.reward;
            if (r.img) img = r.img;
            ok = r.ok !== false;
        }
        const rewardText = this.applyReward(req, reward);
        const extra = this.complete(req, ok);
        this.setResult(req, text, rewardText, extra, img);
    },

    /** Judge a dispute / settler quarrel / stranger note. choice: 'a' | 'b' | 'both' | 'basement' */
    judge: function (id, choice) {
        const req = this.find(id);
        const tpl = this.TEMPLATES[req.key];
        const v = variables();
        let text = this.fillText(tpl.judgeText?.[choice] ?? '', req), rewardText = '';
        if (tpl.cat === 'dispute') {
            const a = this.guest(req.giverId), b = this.guest(req.otherId);
            const win = choice === 'a' ? a : (choice === 'b' ? b : null), lose = choice === 'a' ? b : (choice === 'b' ? a : null);
            if (win && lose) {
                win.happy = Math.min((win.happy ?? 0) + 8, 100); win.relationship = Math.min((win.relationship ?? 0) + 3, 100);
                lose.happy = Math.max(-100, (lose.happy ?? 0) - 8); lose.relationship = Math.max(-100, (lose.relationship ?? 0) - 3);
                setup.tod.bond(win, lose, -5);
            } else if (choice === 'both') {
                for (const n of [a, b].filter(Boolean)) {
                    n.sub = Math.min((n.sub ?? 0) + 5, 100); n.happy = Math.max(-100, (n.happy ?? 0) - 5); n.relationship = Math.max(-100, (n.relationship ?? 0) - 2);
                }
            }
            rewardText = this.applyReward(req, { rep: 2 });
            v.player.stats.nb_disputes = (v.player.stats.nb_disputes ?? 0) + 1;
        } else if (tpl.cat === 'settler') {
            rewardText = this.applyReward(req, { goodwill: choice === 'both' ? 2 : 1, rep: 3 });
        } else {
            const cr = tpl.choiceReward?.[choice] ?? {};
            for (const k of Object.keys(cr.cost ?? {})) {
                if (k === 'caps') v.player.money = Math.max(0, v.player.money - cr.cost[k]);
                else setup.cabinInventory.drop(k, cr.cost[k]);
            }
            rewardText = this.applyReward(req, cr);
        }
        const extra = this.complete(req, true);
        this.setResult(req, text, rewardText, extra, null);
    },

    /** The No infighting policy: the instigator of a dispute goes to the basement */
    judgeBasement: function (id) {
        const req = this.find(id);
        const who = this.guest(req.instigator === 'a' ? req.giverId : req.otherId);
        const other = this.guest(req.instigator === 'a' ? req.otherId : req.giverId);
        if (other) other.happy = Math.min((other.happy ?? 0) + 5, 100);
        variables().player.goodwill = (variables().player.goodwill ?? 0) - 1;
        const rewardText = this.applyReward(req, { rep: 2 });
        const extra = this.complete(req, true);
        this.setResult(req, 'You said there would be no more fighting under your roof, and you meant it. ' + (who ? who.name : 'She') + ' started it, so ' + (who ? who.name : 'she') + ' went down to the basement. The house was very quiet that night.',
            rewardText + ', −1 goodwill', extra, null);
        return who;
    },

    /** Enemies for a fight note: [men, women, knives]. kind = a fight started from a choice (tpl.fights[kind]) */
    fightEnemies: function (id, kind) {
        const req = this.find(id);
        const tpl = this.TEMPLATES[req.key];
        return (kind ? tpl.fights?.[kind]?.enemies : tpl.enemies) ?? [2, 0, 1];
    },

    /** After a fight: won or lost. kind as in fightEnemies */
    fightResult: function (id, won, kind) {
        const req = this.find(id);
        if (!req) return;
        const tpl = this.TEMPLATES[req.key];
        const f = kind ? (tpl.fights?.[kind] ?? {}) : tpl;
        if (won) {
            const rewardText = this.applyReward(req, f.reward ?? tpl.reward ?? {});
            const extra = this.complete(req, true);
            this.setResult(req, this.fillText(f.wonText, req), rewardText, extra, tpl.img);
        } else {
            let lostText = '';
            if (f.lostCost?.caps) {
                const v = variables();
                v.player.money = Math.max(0, v.player.money - f.lostCost.caps);
                lostText = '−' + f.lostCost.caps + ' caps';
            }
            const extra = this.complete(req, false);
            this.setResult(req, this.fillText(f.lostText, req), lostText, extra, tpl.img);
        }
    },

    /** The backpack tip: pay 20 caps, then find the pack or walk into a trap (fight) */
    backpackTip: function (id) {
        const req = this.find(id);
        variables().player.money = Math.max(0, variables().player.money - 20);
        if (setup.percentageChance(20)) {
            req.data.trap = true;
            return 'trap';
        }
        const loot = {}, pool = ['metal', 'cloth', 'rope', 'glass', 'plastic', 'bandage', 'duck_tape', 'food', 'fuel'];
        for (let i = 0; i < 4; i++) { const it = this.rand(pool); loot[it] = (loot[it] ?? 0) + 1; }
        const rewardText = this.applyReward(req, { rep: 1, caps: 30, items: loot });
        const extra = this.complete(req, true);
        this.setResult(req, 'You paid and followed his directions to a ditch behind an old gas station. The dead man was still there, and so was his pack.', rewardText, extra, 'places/cabin/nb_stranger.jpg');
        return 'loot';
    },

    setResult: function (req, text, rewardText, extra, img) {
        this.state().lastResult = { title: req.title, cat: req.cat, gold: req.gold, text: text, reward: rewardText, extra: extra ?? '', img: img ?? null };
    },

    /* ── nightly ─────────────────────────────────────────────────────────── */

    nightly: function () {
        const st = this.state();
        if (!st) return;
        const v = variables();
        const day = v.game.day;
        const kept = [];
        let posted = 0;
        for (const r of st.posted) {
            const tpl = this.TEMPLATES[r.key];
            if (!tpl) continue;
            // the giver left, or the settlement is gone: the note is pointless
            if ((r.giverId && !this.guest(r.giverId)) || (r.otherId && !this.guest(r.otherId))
                || (r.settlementId && !setup.settlements.getById(r.settlementId))) continue;
            if (tpl.mode === 'judge' && r.deadline !== null && day > r.deadline) {
                if (tpl.cat === 'dispute') {
                    const a = this.guest(r.giverId), b = this.guest(r.otherId);
                    for (const n of [a, b].filter(Boolean)) n.happy = Math.max(-100, (n.happy ?? 0) - 10);
                    if (a && b) setup.tod.bond(a, b, -10);
                    setup.sleepMessages.addMain('<span class="warning">Nobody settled it, so ' + r.giverName + ' and ' + r.otherName + ' settled it themselves - loudly. (Both happy −10)</span>');
                }
                continue;
            }
            if (!r.taken && day - r.posted > this.AVAILABLE_DAYS) continue;
            if (r.taken && r.deadline !== null && day > r.deadline) {
                st.failed++;
                st.streak = 0;
                const g = r.giverId ? this.guest(r.giverId) : null;
                if (g && ['wish', 'help'].includes(tpl.cat)) {
                    g.happy = Math.max(-100, (g.happy ?? 0) + this.MISSED_HAPPY);
                    setup.sleepMessages.addMain('<span class="warning">You never got round to it: "' + r.title + '". ' + g.name + ' is disappointed. (Happy ' + this.MISSED_HAPPY + ')</span>');
                } else {
                    setup.sleepMessages.addMain('<span class="warning">The deadline passed: "' + r.title + '".</span>');
                }
                continue;
            }
            if (r.taken && r.deadline === day) {
                setup.sleepMessages.addMain('Notice board: <strong>"' + r.title + '"</strong> is due today.');
            }
            kept.push(r);
        }
        st.posted = kept;
        // streak broken by a day without finishing anything
        if (st.lastDoneDay < day - 1) st.streak = 0;
        // Respected and above: guests trust the house
        if (this.tierIndex() >= 2) {
            for (const g of (v.guests ?? [])) g.happy = Math.min((g.happy ?? 0) + 1, 100);
        }
        const before = st.posted.length;
        this.fill();
        posted = st.posted.length - before;
        if (posted > 0) {
            setup.sleepMessages.addMain('Notice board: <strong>' + posted + ' new ' + (posted === 1 ? 'note' : 'notes') + '</strong> pinned up overnight.');
        }
    },

    /* ── card helpers for the 'Notice board' passage ────────────────────── */

    mode: function (req) {
        return this.TEMPLATES[req.key]?.mode ?? 'give';
    },

    /** "Comes down tomorrow", "Due in 2 days", ... */
    statusText: function (req) {
        const day = variables().game.day;
        if (this.mode(req) === 'judge') {
            const left = req.deadline - day;
            return left <= 0 ? 'Decide today' : 'Decide within ' + (left + 1) + ' days';
        }
        if (!req.taken) {
            const left = this.AVAILABLE_DAYS - (day - req.posted);
            return (left <= 0 ? 'Comes down tomorrow' : 'Up for ' + (left + 1) + ' more days') + ' &middot; ' + req.days + ' days to finish once taken';
        }
        const left = req.deadline - day;
        return left <= 0 ? '<span class="nb-due">Due today</span>' : 'Due in ' + left + (left === 1 ? ' day' : ' days');
    },

    /** Who pinned it */
    signature: function (req) {
        if (req.cat === 'dispute') return 'reported by the guest house';
        if (req.giverName) return req.giverName;
        if (req.settlementName) return req.settlementName;
        if (req.cat === 'settler') return 'the settlers';
        return 'left at the gate';
    },

    rewardPreview: function (req) {
        const tpl = this.TEMPLATES[req.key];
        if (this.mode(req) === 'judge') return tpl.cat === 'dispute' ? 'Settle it before it boils over' : '';
        const r = tpl.reward ?? {};
        const parts = [];
        if (r.rel) parts.push('relationship');
        if (r.happy) parts.push('happiness');
        if (r.happyAll) parts.push('everyone\'s happiness');
        if (r.goodwill) parts.push('goodwill');
        const caps = (r.caps ?? 0) + (req.caps ?? 0);
        if (caps) parts.push(caps + ' caps');
        if (r.settlementRel) parts.push('their trust');
        for (const k of Object.keys(r.items ?? {})) parts.push(this.itemName(k).toLowerCase());
        const rep = (r.rep ?? 0) + (req.gold ? 3 : 0);
        if (rep) parts.push('+' + rep + ' reputation');
        return parts.join(', ');
    },

    needHtml: function (req) {
        if (!req.need) return '';
        return Object.keys(req.need).map(k => {
            const have = setup.cabinInventory.count(k);
            return '<span class="' + (have >= req.need[k] ? 'nb-have' : 'nb-missing') + '">' + req.need[k] + ' ' + this.itemName(k) + ' (' + have + ')</span>';
        }).join(', ');
    },

    /** Can the scene be done right now? { ok, why } */
    sceneCheck: function (req) {
        const tpl = this.TEMPLATES[req.key];
        const p = variables().player;
        if (tpl.when && !tpl.when()) return { ok: false, why: 'only in the ' + tpl.whenText };
        if (tpl.energy && (p.energy ?? 0) < tpl.energy) return { ok: false, why: 'not enough energy (' + tpl.energy + ')' };
        if (tpl.caps && (p.money ?? 0) < tpl.caps) return { ok: false, why: 'not enough caps (' + tpl.caps + ')' };
        if (tpl.hours && !hasTime(tpl.hours)) return { ok: false, why: 'not enough time left today' };
        const g = req.giverId ? this.guest(req.giverId) : null;
        if (g && typeof g.sick !== 'undefined') return { ok: false, why: g.name + ' is sick' };
        return { ok: true, why: '' };
    },

    /** Choices for a 'judge' note: [{ key, label }] */
    choices: function (req) {
        const tpl = this.TEMPLATES[req.key];
        if (tpl.cat === 'dispute') {
            const out = [{ key: 'a', label: 'Side with ' + req.giverName }, { key: 'b', label: 'Side with ' + req.otherName }, { key: 'both', label: 'Punish them both' }];
            if (variables().player?.baseManagement?.noInfighting && setup.runaways.canDragToBasement()) {
                out.push({ key: 'basement', label: 'Throw ' + (req.instigator === 'a' ? req.giverName : req.otherName) + ' in the basement (No infighting)' });
            }
            return out;
        }
        if (tpl.settlerChoices) {
            return [{ key: 'a', label: 'Give the field to the Hollands' }, { key: 'b', label: 'Give the field to the Petrovs' }, { key: 'both', label: 'Split the field between them' }];
        }
        const keys = ['a', 'b'];
        return (tpl.strangerChoices ?? []).map((label, i) => ({ key: keys[i], label: label })).filter(c => {
            if (req.key === 'water' && c.key === 'a') return setup.cabinInventory.has('food');
            if (req.key === 'backpack' && c.key === 'a') return (variables().player.money ?? 0) >= 20;
            if (req.key === 'merchant_payback' && c.key === 'a') return (variables().player.money ?? 0) >= 50;
            return true;
        });
    },

    /** Does this judge choice start a fight? */
    choiceFight: function (req, key) {
        return !!this.TEMPLATES[req.key]?.fights?.[key];
    },

    /* ── legend ──────────────────────────────────────────────────────────── */

    legendReady: function () {
        const st = this.state();
        return !!st && st.legendPending && !st.legendDone;
    }
};
