/*
 * Truth or Dare - spin the bottle with the guests, at the fireplace (evening, needs a bottle) or at a
 * house party (after the champagne). Passages: 'Truth or dare - setup', 'Truth or dare', 'Truth or dare - end'.
 *
 *   $tod = { where, players: [guest ids], out: [ids], round, heat, angle, step, turn, log, mcSpent, pairs }
 *
 * Heat climbs every round and with how drunk the circle is: Mild -> Spicy -> Hot -> Wild. It decides which
 * dares can come up. A player does a dare when her boldness (corruption, drink, traits, and her relationship
 * with the MC for dares that involve him) reaches the dare's need; otherwise she takes a shot. At 95 drunk
 * she passes out. Pregnant women don't drink, so they take a truth instead.
 * Dare pictures reuse the existing generic action sets through setup.tod.showAs() - no new act images.
 * The morning after (hangovers, awkward breakfasts) runs from the sleep widget: setup.tod.nightly().
 */
setup.tod = {
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 4,
    ROUNDS: 14,
    PASS_OUT_AT: 95,
    TIERS: [
        { key: 'mild',  name: 'Mild',  from: 0,  need: 10 },
        { key: 'spicy', name: 'Spicy', from: 25, need: 30 },
        { key: 'hot',   name: 'Hot',   from: 50, need: 50 },
        { key: 'wild',  name: 'Wild',  from: 75, need: 70 }
    ],

    /* ── players ─────────────────────────────────────────────────────────── */

    npc: function (id) {
        return (variables().guests ?? []).find(g => g.id === id) ?? null;
    },

    canPlay: function (g) {
        if (!g || setup.getAge(g) < 18 || g.gender === 1 || (g.gender === 2 && !settings.transEnabled)) return false;
        if ((g.traits ?? []).includes('feral') || typeof g.sick !== 'undefined' || g.basementVoluntary) return false;
        if (setup.family.isBloodToMC(g)) return false;
        return !setup.isAtWork(g, variables().weather);
    },

    /** Guests who could join a game right now */
    pool: function () {
        return (variables().guests ?? []).filter(g => this.canPlay(g));
    },

    /** The few who drift over to the blanket: a random 5-7 of the pool, so a big guest house isn't one long list */
    circle: function () {
        const pool = this.pool();
        for (let i = pool.length - 1; i > 0; i--) {
            const j = window.randomInteger(0, i);
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, window.randomInteger(5, 7));
    },

    bottleItem: function () {
        if (setup.cabinInventory.has('champagne')) return 'champagne';
        if (setup.cabinInventory.has('alcohol')) return 'alcohol';
        return null;
    },

    /** Fireplace: evening, once a night, a bottle and at least two players */
    canStartAtFireplace: function () {
        const v = variables();
        return timeBetween('19:00', '01:00') && v.game.todDay !== v.game.day
            && !!this.bottleItem() && this.pool().length >= this.MIN_PLAYERS;
    },

    start: function (ids, where) {
        const v = variables();
        if (where !== 'party') {
            const bottle = this.bottleItem();
            if (bottle) setup.cabinInventory.drop(bottle, 1);
        }
        v.game.todDay = v.game.day;
        v.tod = { where: where, players: ids.slice(0, this.MAX_PLAYERS), out: [], round: 0, heat: where === 'party' ? 10 : 0,
                  angle: 0, step: 'spin', turn: null, log: [], mcSpent: false, pairs: [], dares: 0 };
        v.player.stats.tod_games = (v.player.stats.tod_games ?? 0) + 1;
    },

    active: function () {
        const t = variables().tod;
        return (t?.players ?? []).filter(id => !t.out.includes(id)).map(id => this.npc(id)).filter(Boolean);
    },

    /* ── heat & boldness ─────────────────────────────────────────────────── */

    tier: function () {
        const heat = variables().tod?.heat ?? 0;
        let tier = this.TIERS[0];
        for (const t of this.TIERS) if (heat >= t.from) tier = t;
        return tier;
    },

    tierIndex: function (key) {
        return this.TIERS.findIndex(t => t.key === key);
    },

    updateHeat: function () {
        const t = variables().tod;
        const players = this.active();
        const avgDrunk = players.length ? players.reduce((s, n) => s + (n.drunk ?? 0), 0) / players.length : 0;
        const base = (t.where === 'party' ? 10 : 0) + t.round * 6 + Math.round(avgDrunk * 0.35) + t.dares * 2;
        t.heat = Math.min(100, Math.max(t.heat, base));
    },

    boldness: function (npc, withMc) {
        let b = (npc.corruption ?? 0) * 0.6 + (npc.drunk ?? 0) * 0.5;
        const traits = npc.traits ?? [];
        if (traits.includes('nymphomaniac')) b += 15;
        if (traits.includes('cumslut') || traits.includes('masochist')) b += 5;
        if (setup.personality.has(npc, 'outgoing')) b += 10;
        if (setup.personality.has(npc, 'confident')) b += 5;
        if (setup.personality.has(npc, 'reserved') || setup.personality.has(npc, 'nervous')) b -= 10;
        if (withMc) b += (npc.relationship ?? 0) * 0.25;
        return Math.round(b);
    },

    /* ── names & pictures ────────────────────────────────────────────────── */

    name: function (who) {
        return who === 'mc' ? 'you' : (who?.name ?? 'someone');
    },

    /** A shallow copy of the NPC shown from another action set (poker, strip_club, nightclub, default) */
    showAs: function (npc, location) {
        return Object.assign({}, npc, { location: location || 'default' });
    },

    /** Circle of players around the bottle; the bottle turns to its new angle in <<done>> */
    circleHtml: function () {
        const t = variables().tod;
        const seats = [{ id: 'mc', name: 'You' }].concat(t.players.map(id => ({ id: id, npc: this.npc(id) })));
        const n = seats.length;
        let html = '<div class="tod-circle">';
        seats.forEach((s, i) => {
            const ang = (360 / n) * i - 90;
            // 36% from the centre keeps the side seats inside a phone-width circle
            const x = 50 + 36 * Math.cos(ang * Math.PI / 180);
            const y = 50 + 36 * Math.sin(ang * Math.PI / 180);
            const out = s.id !== 'mc' && t.out.includes(s.id);
            const hl = t.turn && (t.turn.target === s.id || t.turn.asker === s.id) ? (t.turn.target === s.id ? ' tod-target' : ' tod-asker') : '';
            let face;
            if (s.id === 'mc') {
                face = '<div class="tod-face tod-face-mc">YOU</div>';
            } else {
                const src = s.npc ? (s.npc.portrait || setup.npcGetPackPortrait(s.npc)) : null;
                face = src
                    ? '<div class="tod-face"><img src="' + ((src.includes('http') || src.includes('packs/')) ? src : setup.ImagePath + 'custom_portraits/' + src) + '"></div>'
                    : '<div class="tod-face tod-face-init">' + setup.getNpcInitials(s.npc?.name ?? '?') + '</div>';
            }
            html += '<div class="tod-seat' + (out ? ' tod-out' : '') + hl + '" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%">' + face
                + '<div class="tod-name">' + (s.id === 'mc' ? 'You' : (s.npc?.name ?? '?')) + (out ? ' (out)' : '') + '</div></div>';
        });
        // right after a spin the bottle starts from where it was and turns in <<done>>; otherwise it just points
        const startAngle = t.animate ? (t.prevAngle ?? 0) : (t.angle ?? 0);
        html += '<div class="tod-bottle" id="tod-bottle" data-angle="' + (t.angle ?? 0) + '" style="transform: translate(-50%,-50%) rotate(' + startAngle + 'deg)">'
            + '<svg viewBox="0 0 40 120" width="34" height="102"><rect x="14" y="2" width="12" height="10" rx="2" fill="#6d4c2f"/>'
            + '<path d="M15 12 h10 v18 q12 10 12 26 v54 q0 8 -8 8 h-18 q-8 0 -8 -8 v-54 q0 -16 12 -26 z" fill="#2f6b3a" stroke="#1d4426" stroke-width="2"/>'
            + '<rect x="7" y="62" width="26" height="22" fill="#d8c79a" opacity="0.85"/></svg></div>';
        html += '</div>';
        return html;
    },

    /* ── spinning ────────────────────────────────────────────────────────── */

    seatIndex: function (who) {
        const t = variables().tod;
        return who === 'mc' ? 0 : t.players.indexOf(who) + 1;
    },

    /** Picks who asks and who answers, turns the bottle to the one who answers */
    spin: function () {
        const t = variables().tod;
        t.round++;
        this.updateHeat();
        const seats = ['mc'].concat(this.active().map(n => n.id));
        // never the same one twice in a row, so nobody (you included) gets stuck under the bottle
        const free = seats.filter(s => s !== t.lastTarget);
        const pool = free.length ? free : seats;
        const target = pool[window.randomInteger(0, pool.length - 1)];
        t.lastTarget = target;
        const askers = seats.filter(s => s !== target);
        const asker = askers[window.randomInteger(0, askers.length - 1)];
        const n = 1 + t.players.length;
        t.prevAngle = t.angle;
        // the bottle neck points up at 0deg; seat i sits at (360/n)*i - 90 from the x axis, i.e. (360/n)*i from "up"
        t.angle = t.angle - (t.angle % 360) + 720 + (360 / n) * this.seatIndex(target);
        t.turn = { asker: asker, target: target };
        t.step = target === 'mc' ? 'mc_target' : (asker === 'mc' ? 'mc_asks' : 'npc_turn');
        return t.turn;
    },

    /* ── dares ───────────────────────────────────────────────────────────── */

    /*
     * partner: 'mc' (the dare involves you), 'npc' (another girl in the circle), 'self'.
     * img: [action set, action key] for <<actionImage>> on the target (null = the circle stays).
     * horny: your arousal; stat: sex stat the act raises on the target ('bj'/'pussy').
     */
    DARES: [
        { id: 'lap',       tier: 'mild',  partner: 'mc',   img: ['default', 'hug'], horny: 5, corruption: 1,
          ask: '%A% dared %T% to sit on your lap until the next spin.',
          done: '%T% laughed, climbed into your lap and wriggled until she got comfortable. Everyone watched your face.' },
        { id: 'dance',     tier: 'mild',  partner: 'self', img: ['nightclub', 'dance'], horny: 5, corruption: 1,
          ask: '%A% dared %T% to dance for everyone, no music.',
          done: '%T% got up and danced in the firelight, hips swaying to a song only she could hear, while the others clapped a beat for her.' },
        { id: 'cheek',     tier: 'mild',  partner: 'mc',   img: ['default', 'hug'], horny: 2, corruption: 1,
          ask: '%A% dared %T% to kiss you on the cheek.',
          done: '%T% leaned over and pressed a quick kiss to your cheek, then hid her face in her hands while the others whistled.' },
        { id: 'kiss_mc',   tier: 'spicy', partner: 'mc',   img: ['default', 'kissing'], horny: 8, corruption: 2, likesGuys: true,
          ask: '%A% dared %T% to kiss you. On the lips. With tongue.',
          done: '%T% crawled over, took your face in both hands and kissed you, slow and deep, until someone threw a pinecone at you both.' },
        { id: 'kiss_girl', tier: 'spicy', partner: 'npc',  img: ['default', 'threesome_f_kissing'], horny: 10, corruption: 2, girls: true, bond: 5,
          ask: '%A% dared %T% to kiss %P%. A real kiss.',
          done: '%T% leaned across the circle and kissed %P% on the mouth. It started as a joke and lasted a lot longer than a joke should.' },
        { id: 'flash',     tier: 'spicy', partner: 'self', img: ['poker', 'remove_top'], horny: 10, corruption: 2,
          ask: '%A% dared %T% to flash everyone for five seconds.',
          done: '%T% pulled her top up and counted out loud to five, grinning, tits bare in the firelight. Nobody else was counting.' },
        { id: 'lapdance',  tier: 'spicy', partner: 'mc',   img: ['strip_club', 'dancing'], horny: 12, corruption: 2, likesGuys: true,
          ask: '%A% dared %T% to give you a lap dance.',
          done: '%T% pushed you back against the log and danced over you, grinding slow in your lap until your cock was hard against her ass.' },
        { id: 'strip',     tier: 'hot',   partner: 'self', img: ['poker', 'undress_panties'], horny: 12, corruption: 3,
          ask: '%A% dared %T% to strip naked and stay that way.',
          done: '%T% stood up, peeled off everything piece by piece and tossed her panties at %A%. She sat back down naked, knees drawn up, cheeks burning.' },
        { id: 'touch',     tier: 'hot',   partner: 'self', img: ['default', 'masturbate'], horny: 15, corruption: 3, herHorny: 25,
          ask: '%A% dared %T% to touch herself in front of everyone.',
          done: '%T% leaned back on her elbows, slid a hand between her legs and rubbed her pussy while the whole circle watched, breathing harder with every second.' },
        { id: 'nipples',   tier: 'hot',   partner: 'mc',   img: ['default', 'nipple_lick'], horny: 12, corruption: 3, likesGuys: true,
          ask: '%A% dared %T% to let you suck her nipples.',
          done: '%T% bared her tits and pulled your head to them. You sucked one nipple, then the other, until she was squirming.' },
        { id: 'girl_tits', tier: 'hot',   partner: 'npc',  img: ['default', 'threesome_f_nipple_lick'], horny: 15, corruption: 3, girls: true, bond: 6,
          ask: '%A% dared %T% to suck %P%\'s tits.',
          done: '%T% pushed %P%\'s top up and closed her mouth over a nipple. %P% gasped and grabbed her hair, and neither of them looked at anyone else.' },
        { id: 'handjob',   tier: 'hot',   partner: 'mc',   img: ['default', 'handjob'], horny: 25, corruption: 3, likesGuys: true, cum: 'handjob',
          ask: '%A% dared %T% to jerk you off. Right here.',
          done: '%T% opened your pants, took your cock in her hand and stroked it slow and tight while the others leaned in to watch.' },
        { id: 'bj10',      tier: 'wild',  partner: 'mc',   img: ['default', 'bj'], horny: 30, corruption: 4, likesGuys: true, stat: 'bj', cum: 'mouth',
          ask: '%A% dared %T% to suck your cock for ten seconds.',
          done: '%T% knelt between your legs and took your cock in her mouth. The circle counted to ten. She kept going until twenty.' },
        { id: 'ride10',    tier: 'wild',  partner: 'mc',   img: ['default', 'pussy'], horny: 35, corruption: 4, likesGuys: true, female: true, notVirgin: true, stat: 'pussy', cum: 'pussy',
          ask: '%A% dared %T% to ride your cock for ten seconds.',
          done: '%T% straddled you, pulled her panties aside and sank down on your cock, all the way. She rode you hard while the circle counted, and didn\'t stop at ten.' },
        { id: 'girl_lick', tier: 'wild',  partner: 'npc',  img: ['default', 'threesome_f_pussy_lick'], horny: 20, corruption: 4, girls: true, partnerFemale: true, bond: 8,
          ask: '%A% dared %T% to lick %P%\'s pussy.',
          done: '%P% spread her legs on the blanket and %T% buried her face between them, licking her pussy until %P% was moaning loud enough to scare the birds.' }
    ],

    /** Dares the MC can be given by a girl */
    MC_DARES: [
        { id: 'mc_shirt',     tier: 'mild',  img: null, horny: 0, ask: '%A% dared you to take your shirt off.',
          done: 'You pulled your shirt over your head. %A% whistled. Somebody else said something about your scars.' },
        { id: 'mc_praise',    tier: 'mild',  img: null, horny: 0, praise: true, ask: '%A% dared you to say something nice about every girl in the circle.',
          done: 'You went around the circle one by one. By the end, everyone was smiling.' },
        { id: 'mc_kiss',      tier: 'spicy', img: ['default', 'kissing'], horny: 8, likesGuys: true, ask: '%A% dared you to kiss her. Properly.',
          done: 'You pulled %A% in and kissed her until she forgot it was a dare.' },
        { id: 'mc_strip',     tier: 'spicy', img: null, horny: 5, ask: '%A% dared you to strip down to your underwear.',
          done: 'You stripped to your underwear. The girls were not subtle about looking.' },
        { id: 'mc_nipples',   tier: 'hot',   img: ['default', 'nipple_lick'], horny: 12, likesGuys: true, ask: '%A% dared you to lick her nipples.',
          done: '%A% pulled her top down and you licked her nipples until they were hard and wet and she had to bite her lip.' },
        { id: 'mc_eat_pussy', tier: 'wild',  img: ['default', 'pussy_lick'], horny: 15, likesGuys: true, female: true, herHorny: 30,
          ask: '%A% dared you to eat her pussy. Right here, in front of everyone.',
          done: '%A% lay back and opened her legs. You went down on her and licked her pussy until her thighs were shaking around your head.' },
        { id: 'mc_fuck10',    tier: 'wild',  img: ['default', 'pussy'], horny: 35, likesGuys: true, female: true, notVirgin: true, stat: 'pussy', cum: 'pussy',
          ask: '%A% dared you to fuck her for ten seconds.',
          done: '%A% got on her back and pulled you on top of her. You slid your cock into her pussy and fucked her while the circle counted. Nobody kept count past seven.' }
    ],

    /** Is this dare possible for target (and its partner)? */
    dareFits: function (dare, target, partner) {
        const t = variables().tod;
        if (dare.likesGuys && !(target.likesGuys ?? true)) return false;
        if (dare.female && target.gender !== 0) return false;
        if (dare.notVirgin && (target.virgin || target.chastityBelt)) return false;
        if (dare.cum && t.mcSpent) return false;
        if ((dare.partner === 'mc' && dare.tier !== 'mild') && t.mcSpent && (dare.horny ?? 0) >= 20) return false;
        if (dare.girls) {
            if (!settings.lesbiansEnabled || !partner || !(target.likesGirls ?? false) || !(partner.likesGirls ?? false)) return false;
            if (dare.partnerFemale && partner.gender !== 0) return false;
            if (variables().player?.baseManagement?.noIncest && setup.family.isIncest(target, partner)) return false;
        }
        return true;
    },

    /** A girl from the circle to pair with the target for a girl-girl dare */
    pickPartner: function (target) {
        const others = this.active().filter(n => n.id !== target.id && (n.likesGirls ?? false));
        return others.length ? others[window.randomInteger(0, others.length - 1)] : null;
    },

    /** Dares that fit the target at or below the current heat; top tier first */
    options: function (target, count) {
        const top = this.tierIndex(this.tier().key);
        const opts = [];
        for (const dare of this.DARES) {
            const ti = this.tierIndex(dare.tier);
            if (ti > top) continue;
            const partner = dare.partner === 'npc' ? this.pickPartner(target) : null;
            if (dare.partner === 'npc' && !partner) continue;
            if (!this.dareFits(dare, target, partner)) continue;
            opts.push({ dare: dare, partner: partner, weight: ti === top ? 3 : (ti === top - 1 ? 2 : 1) });
        }
        // weighted shuffle, keep the hottest ones near the front
        opts.sort((a, b) => (b.weight + Math.random() * 2) - (a.weight + Math.random() * 2));
        return opts.slice(0, count);
    },

    mcDareOptions: function (asker) {
        const top = this.tierIndex(this.tier().key);
        return this.MC_DARES.filter(d => this.tierIndex(d.tier) <= top && this.dareFits(d, asker, null));
    },

    need: function (dare) {
        return this.TIERS[this.tierIndex(dare.tier)].need;
    },

    fill: function (text, asker, target, partner) {
        return text.replace(/%A%/g, asker === 'mc' ? 'You' : this.name(asker))
            .replace(/%T%/g, this.name(target)).replace(/%P%/g, partner ? this.name(partner) : 'you');
    },

    /* ── resolving a turn ────────────────────────────────────────────────── */

    /** The target refuses: a shot (or a truth, if she's pregnant). Returns the text. */
    refuse: function (target) {
        const t = variables().tod;
        if (typeof target.pregnancy !== 'undefined') {
            return target.name + ' shook her head, a hand on her belly. "Truth instead." Nobody argued.';
        }
        setup.drink(target, 1);
        if ((target.drunk ?? 0) >= this.PASS_OUT_AT && !t.out.includes(target.id)) {
            t.out.push(target.id);
            return target.name + ' took the shot instead, and then she was asleep against the log, mouth open, still holding the cup. She was out of the game.';
        }
        return target.name + ' shook her head, grabbed the bottle and took a long swallow instead. Everyone booed.';
    },

    /** Applies a completed dare to the target (and partner). Returns a short summary for the log. */
    applyDare: function (dare, target, partner) {
        const t = variables().tod;
        t.dares++;
        target.corruption = Math.min((target.corruption ?? 0) + (dare.corruption ?? 1), 100);
        target.happy = Math.min((target.happy ?? 0) + 2, 100);
        if (dare.herHorny) target.horny = Math.min((target.horny ?? 0) + dare.herHorny, 100);
        if (dare.partner === 'mc' || !dare.partner) target.relationship = Math.min((target.relationship ?? 0) + 1, 100);
        if (dare.stat) {
            target[dare.stat] = Math.min((target[dare.stat] ?? 0) + 5, 100);
            target.statsSex ??= {};
            target.statsSex[dare.stat] = (target.statsSex[dare.stat] ?? 0) + 1;
        }
        if (partner && dare.bond) {
            partner.corruption = Math.min((partner.corruption ?? 0) + 1, 100);
            for (const [a, b] of [[target, partner], [partner, target]]) {
                a.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
                a.relationshipBetween.stats ??= {};
                a.relationshipBetween.stats[b.id] = Math.max(-100, Math.min(100, (a.relationshipBetween.stats[b.id] ?? 0) + dare.bond));
            }
            if (!t.pairs.some(p => p.includes(target.id) && p.includes(partner.id))) t.pairs.push([target.id, partner.id]);
        }
    },

    /** An NPC asks an NPC: she picks truth or dare and what happens. Returns { kind, dare, partner, text, done } */
    npcTurn: function (asker, target) {
        const bold = this.boldness(target, false);
        const takesDare = typeof target.pregnancy === 'undefined' && (bold >= 40 || setup.percentageChance(Math.max(10, bold)));
        if (!takesDare) {
            return { kind: 'truth', truth: this.askTruth(asker, target) };
        }
        const opt = this.options(target, 1)[0];
        if (!opt) {
            return { kind: 'truth', truth: this.askTruth(asker, target) };
        }
        const need = this.need(opt.dare) - (opt.dare.partner === 'mc' ? 0 : 5);
        const withMc = opt.dare.partner === 'mc';
        const done = this.boldness(target, withMc) >= need;
        return { kind: 'dare', dare: opt.dare, partner: opt.partner, done: done };
    },

    /** Will the target do this dare the MC gave her? */
    willDo: function (dare, target) {
        return this.boldness(target, dare.partner === 'mc') >= this.need(dare);
    },

    /* ── truths ──────────────────────────────────────────────────────────── */

    TRUTHS: ['crush', 'gift', 'opinion', 'secret', 'virgin'],

    /** Asks the target a truth; applies what it reveals. Returns the text. */
    askTruth: function (asker, target, which) {
        const q = which || this.TRUTHS[window.randomInteger(0, this.TRUTHS.length - 1)];
        const askerName = asker === 'mc' ? 'You' : this.name(asker);
        const she = setup.pronounceWhat(target);
        const lies = this.boldness(target, false) < 25 && (target.drunk ?? 0) < 30 && setup.percentageChance(40);
        const head = {
            crush:   askerName + ' asked ' + target.name + ' who in the circle she would kiss, if she had to.',
            gift:    askerName + ' asked ' + target.name + ' what she would want, if she could have anything at all.',
            opinion: askerName + ' asked ' + target.name + ' what she really thought of you.',
            secret:  askerName + ' asked ' + target.name + ' for the dirtiest thing she had ever done.',
            virgin:  askerName + ' asked ' + target.name + ' how many men she had been with.'
        }[q] + ' ';
        if (lies) {
            return head + target.name + ' gave an answer nobody believed and took a sip to hide her smile.';
        }
        if (q === 'crush') {
            const others = this.active().filter(n => n.id !== target.id);
            let best = null, bestVal = 0;
            for (const n of others) {
                const val = target.relationshipBetween?.stats?.[n.id] ?? 0;
                if (val > bestVal) { best = n; bestVal = val; }
            }
            if ((target.relationship ?? 0) >= Math.max(50, bestVal) && (target.likesGuys ?? true)) {
                target.relationship = Math.min((target.relationship ?? 0) + 3, 100);
                return head + target.name + ' looked straight at you and didn\'t say anything. She didn\'t have to. <strong>(Relationship +3)</strong>';
            }
            if (best && (target.likesGirls ?? false)) {
                setup.tod.bond(target, best, 5);
                return head + target.name + ' looked at ' + best.name + ' a second too long, then said her name. ' + best.name + ' went red to the ears. <strong>(They like each other a little more)</strong>';
            }
            return head + target.name + ' said nobody here, and stuck her tongue out at all of you.';
        }
        if (q === 'gift') {
            const likes = Array.isArray(target.likes) ? target.likes.join(', ') : (target.likes || '');
            return head + (likes
                ? target.name + ' didn\'t have to think long. <strong>Favorite gifts: ' + likes + '</strong>.'
                : target.name + ' shrugged and said a hot bath and a full night\'s sleep.');
        }
        if (q === 'opinion') {
            const rel = target.relationship ?? 0;
            target.relationship = Math.min(rel + 2, 100);
            const ans = rel >= 80 ? ' said she would follow you anywhere. Then she looked embarrassed for having said it.'
                : rel >= 50 ? ' said you were a good man in a bad world, and better looking than you deserved.'
                : rel >= 20 ? ' said you were fair. Hard sometimes, but fair.'
                : rel >= 0 ? ' said she was still making up her mind about you.'
                : ' said she didn\'t trust you as far as she could throw you. It went quiet for a while.';
            return head + target.name + ans + ' <strong>(Relationship +2 for the honesty)</strong>';
        }
        if (q === 'secret') {
            const traits = target.traits ?? [];
            const confess = {
                analslut: 'admitted she likes it in the ass more than anywhere else',
                cumslut: 'admitted she gets off on a man finishing on her, or in her',
                masochist: 'admitted she likes it best when it hurts a little',
                deepthroat: 'admitted she can take a cock all the way down her throat, and proved she wasn\'t joking with a cucumber',
                breeder: 'admitted she wants a belly full of babies and doesn\'t much care whose',
                nymphomaniac: 'admitted she touches herself three times a day, minimum',
                squirter: 'admitted she soaks the sheets every time she comes',
                sensitive_tits: 'admitted she can come just from someone playing with her nipples'
            };
            const known = traits.filter(tr => confess[tr]);
            target.corruption = Math.min((target.corruption ?? 0) + 1, 100);
            if (!known.length) return head + target.name + ' thought hard and confessed a skinny-dip in a radioactive lake. Everyone agreed it counted.';
            const tr = known[window.randomInteger(0, known.length - 1)];
            return head + target.name + ' ' + confess[tr] + '. <strong>(Trait: ' + (setup.traits?.[tr]?.title ?? tr) + ')</strong>';
        }
        // virgin
        if (target.virgin) {
            return head + target.name + ' held up zero fingers and stared at the fire. ' + ucfirst(she) + ' is still a virgin.';
        }
        const count = (target.statsSex?.pussy ?? 0) + (target.statsSex?.anal ?? 0);
        return head + target.name + (count > 20 ? ' laughed and said she lost count a long time ago.' : ' counted on her fingers, gave up and said "enough."');
    },

    bond: function (a, b, amount) {
        for (const [x, y] of [[a, b], [b, a]]) {
            x.relationshipBetween ??= { stats: {}, likes: null, dislikes: [] };
            x.relationshipBetween.stats ??= {};
            x.relationshipBetween.stats[y.id] = Math.max(-100, Math.min(100, (x.relationshipBetween.stats[y.id] ?? 0) + amount));
        }
    },

    /* ── finale & end ────────────────────────────────────────────────────── */

    /** Girls ready to take things further with the MC (Wild heat only) */
    willing: function () {
        const t = variables().tod;
        if (!t || t.mcSpent || this.tier().key !== 'wild') return [];
        return this.active().filter(n => (n.likesGuys ?? true) && !n.chastityBelt && this.boldness(n, true) >= 60);
    },

    /** Remembers the night for the morning after and clears the game */
    finish: function () {
        const v = variables();
        const t = v.tod;
        if (!t) return;
        v.game.todAftermath = {
            day: v.game.day,
            drunk: t.players.filter(id => (this.npc(id)?.drunk ?? 0) >= 70),
            pairs: t.pairs.slice(0, 2)
        };
        if (t.dares >= 10) {
            v.player.stats.tod_wild_games = (v.player.stats.tod_wild_games ?? 0) + (this.tier().key === 'wild' ? 1 : 0);
        }
        delete v.tod;
    },

    /** Morning after: hangovers and awkward breakfasts. Called once a night from the sleep widget. */
    nightly: function () {
        const v = variables();
        const a = v.game.todAftermath;
        if (!a) return;
        delete v.game.todAftermath;
        for (const id of a.drunk) {
            const n = this.npc(id);
            if (!n) continue;
            n.happy = Math.max(-100, (n.happy ?? 0) - 3);
            setup.sleepMessages.addMain(n.name + ' woke up with a pounding head after last night\'s game. <strong>(Happy −3)</strong>');
        }
        for (const [x, y] of a.pairs) {
            const nx = this.npc(x), ny = this.npc(y);
            if (nx && ny) {
                setup.sleepMessages.addMain('At breakfast ' + nx.name + ' couldn\'t look ' + ny.name + ' in the eye. ' + ny.name + ' kept smiling into her cup.');
            }
        }
    }
};

/*
 * Turn flow. Every choice resolves here and navigates back to 'Truth or dare', which only shows $tod.
 *   spin -> npc_turn (resolved at once) | mc_asks (offer) | mc_target -> mc_truth | mc_dare -> result -> spin
 *   $tod.result = { text, imgNpcId, img: [set, action], cum: 'handjob'|'mouth'|'pussy'|null, cumNpcId }
 */
Object.assign(setup.tod, {
    addMcHorny: function (n) {
        const p = variables().player;
        const add = setup.perkHas('drunk') ? Math.round(n / 2) : n;
        p.horny = Math.min(100, Math.max(0, (p.horny ?? 0) + add));
    },

    dareById: function (id) {
        return this.DARES.find(d => d.id === id) || this.MC_DARES.find(d => d.id === id) || null;
    },

    /** Spin link: picks the turn and prepares whatever the screen needs */
    doSpin: function () {
        const t = variables().tod;
        t.result = null;
        this.spin();
        t.animate = true;
        if (t.step === 'npc_turn') {
            this.resolveNpcTurn();
        } else if (t.step === 'mc_asks') {
            const target = this.npc(t.turn.target);
            t.offer = this.options(target, 3).map(o => ({ id: o.dare.id, partner: o.partner?.id ?? null }));
        }
    },

    /** Builds the result of a dare the target did (or refused) */
    dareResult: function (dare, asker, target, partner, done) {
        const t = variables().tod;
        let text = this.fill(dare.ask, asker, target, partner) + ' ';
        if (!done) {
            text += this.refuse(target);
            if (typeof target.pregnancy !== 'undefined') {
                text += '<br /><br />' + this.askTruth(asker, target);
            }
            t.result = { text: text, imgNpcId: null, img: null, cum: null };
        } else {
            text += this.fill(dare.done, asker, target, partner);
            this.applyDare(dare, target, partner);
            if (dare.horny) this.addMcHorny(dare.horny);
            if (dare.partner === 'mc' && dare.tier !== 'mild') target.horny = Math.min((target.horny ?? 0) + 10, 100);
            t.result = { text: text, imgNpcId: target.id, img: dare.img, cum: dare.cum ?? null, cumNpcId: target.id };
        }
        t.step = 'result';
    },

    resolveNpcTurn: function () {
        const t = variables().tod;
        const asker = this.npc(t.turn.asker), target = this.npc(t.turn.target);
        const turn = this.npcTurn(asker, target);
        if (turn.kind === 'truth') {
            t.result = { text: turn.truth, imgNpcId: null, img: null, cum: null };
            t.step = 'result';
        } else {
            this.dareResult(turn.dare, asker, target, turn.partner, turn.done);
        }
    },

    mcAsksTruth: function (which) {
        const t = variables().tod;
        t.result = { text: this.askTruth('mc', this.npc(t.turn.target), which), imgNpcId: null, img: null, cum: null };
        t.step = 'result';
    },

    mcAsksDare: function (index) {
        const t = variables().tod;
        const o = t.offer[index];
        const dare = this.dareById(o.id), target = this.npc(t.turn.target), partner = o.partner ? this.npc(o.partner) : null;
        this.dareResult(dare, 'mc', target, partner, this.willDo(dare, target));
    },

    /** Choice label for a dare the MC can give */
    dareLabel: function (o) {
        const dare = this.dareById(o.id);
        const partner = o.partner ? this.npc(o.partner) : null;
        const p = partner ? partner.name : 'you';
        const labels = {
            lap: 'Dare her to sit on your lap', dance: 'Dare her to dance for everyone', cheek: 'Dare her to kiss you on the cheek',
            kiss_mc: 'Dare her to kiss you with tongue', kiss_girl: 'Dare her to kiss ' + p + ' on the lips',
            flash: 'Dare her to flash her tits', lapdance: 'Dare her to give you a lap dance',
            strip: 'Dare her to strip naked', touch: 'Dare her to finger her pussy in front of everyone',
            nipples: 'Dare her to let you suck her nipples', girl_tits: 'Dare her to suck ' + p + '\'s tits',
            handjob: 'Dare her to jerk your cock', bj10: 'Dare her to suck your cock for ten seconds',
            ride10: 'Dare her to ride your cock for ten seconds', girl_lick: 'Dare her to lick ' + p + '\'s pussy'
        };
        return (labels[dare.id] ?? dare.id) + ' (' + this.TIERS[this.tierIndex(dare.tier)].name + ')';
    },

    /** NPC asks the MC: truth */
    mcTargetTruth: function () {
        const t = variables().tod;
        t.mcQuestion = this.active().length >= 2 && setup.percentageChance(60) ? 'prettiest' : 'think';
        t.step = 'mc_truth';
    },

    answerPrettiest: function (id) {
        const t = variables().tod;
        const asker = this.npc(t.turn.asker);
        const chosen = this.npc(id);
        chosen.relationship = Math.min((chosen.relationship ?? 0) + 5, 100);
        chosen.happy = Math.min((chosen.happy ?? 0) + 3, 100);
        for (const n of this.active()) {
            if (n.id !== chosen.id) n.happy = Math.max(-100, (n.happy ?? 0) - 2);
        }
        t.result = { text: (asker ? asker.name : 'Someone') + ' asked who the prettiest girl in the circle was. You said <strong>' + chosen.name + '</strong>. '
            + chosen.name + ' beamed. The others threw pinecones at you. <strong>(' + chosen.name + ': relationship +5. The others are a little jealous.)</strong>',
            imgNpcId: null, img: null, cum: null };
        t.step = 'result';
    },

    answerThink: function (yes) {
        const t = variables().tod;
        const asker = this.npc(t.turn.asker);
        let text = asker.name + ' asked if you had ever thought about her, that way. ';
        if (yes) {
            asker.relationship = Math.min((asker.relationship ?? 0) + 3, 100);
            asker.corruption = Math.min((asker.corruption ?? 0) + 1, 100);
            text += 'You said yes, and held her eyes while you said it. She looked away first, smiling. <strong>(Relationship +3)</strong>';
        } else {
            asker.happy = Math.max(-100, (asker.happy ?? 0) - 2);
            text += 'You said no. She laughed it off a little too fast.';
        }
        t.result = { text: text, imgNpcId: null, img: null, cum: null };
        t.step = 'result';
    },

    /** NPC asks the MC: dare - she picks one */
    mcTargetDare: function () {
        const t = variables().tod;
        const asker = this.npc(t.turn.asker);
        const opts = this.mcDareOptions(asker);
        const top = this.tierIndex(this.tier().key);
        const best = opts.filter(d => this.tierIndex(d.tier) === top);
        const pool = best.length && setup.percentageChance(70) ? best : opts;
        t.mcDare = pool.length ? pool[window.randomInteger(0, pool.length - 1)].id : 'mc_shirt';
        t.step = 'mc_dare';
    },

    mcDoesDare: function () {
        const t = variables().tod;
        const asker = this.npc(t.turn.asker);
        const dare = this.dareById(t.mcDare);
        t.dares++;
        asker.relationship = Math.min((asker.relationship ?? 0) + 3, 100);
        asker.corruption = Math.min((asker.corruption ?? 0) + (this.tierIndex(dare.tier) + 1), 100);
        if (dare.herHorny) asker.horny = Math.min((asker.horny ?? 0) + dare.herHorny, 100);
        if (dare.horny) this.addMcHorny(dare.horny);
        if (dare.praise) {
            for (const n of this.active()) n.relationship = Math.min((n.relationship ?? 0) + 1, 100);
        }
        if (dare.stat) {
            asker[dare.stat] = Math.min((asker[dare.stat] ?? 0) + 5, 100);
            asker.statsSex ??= {};
            asker.statsSex[dare.stat] = (asker.statsSex[dare.stat] ?? 0) + 1;
        }
        t.result = { text: this.fill(dare.ask, asker, 'mc', null) + ' ' + this.fill(dare.done, asker, 'mc', null),
            imgNpcId: dare.img ? asker.id : null, img: dare.img, cum: dare.cum ?? null, cumNpcId: asker.id };
        t.step = 'result';
    },

    mcRefusesDare: function () {
        const t = variables().tod;
        const asker = this.npc(t.turn.asker);
        const dare = this.dareById(t.mcDare);
        setup.drink(variables().player, 1);
        t.result = { text: this.fill(dare.ask, asker, 'mc', null) + ' You shook your head and took a long pull from the bottle instead. ' + asker.name + ' called you a coward.',
            imgNpcId: null, img: null, cum: null };
        t.step = 'result';
    },

    nextRound: function () {
        const t = variables().tod;
        t.result = null;
        t.offer = null;
        t.turn = null;
        t.step = 'spin';
    },

    /** True when the game is over on its own: everyone passed out or the rounds ran out */
    over: function () {
        const t = variables().tod;
        return !t || this.active().length === 0 || t.round >= this.ROUNDS;
    }
});
