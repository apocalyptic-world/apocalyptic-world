// Evening school: adult guests and slaves learn skills from guest instructors, 18:00-21:00.
// Instructors: guest.assignedTo = 'instructor-<class>' (one per class).
// Students:    guest/slave.teach = 'undecided' | '<class>' (nursery kids use teach for day school).
setup.eveningSchool = {
    classes: ['mechanic', 'shopkeeper', 'doctor', 'teacher', 'cook'],
    hours: { from: '18:00', to: '21:00' },

    // Class card icons (HTML entities).
    icons: {
        mechanic: '&#x1F527;',
        shopkeeper: '&#x1F4B0;',
        doctor: '&#x2695;&#xFE0F;',
        teacher: '&#x270F;&#xFE0F;',
        cook: '&#x1F35E;',
    },

    // Instructor activity, shown after the instructor's name. 'teaching' when the class has students.
    texts: {
        teaching: {
            mechanic: [
                'is walking the class through a stripped-down carburetor on the workbench.',
                'is sketching an engine diagram on the board, labeling each part.',
                'is showing how to patch a radiator hose with salvaged rubber.',
                'is passing around a corroded spark plug, explaining what went wrong.',
                'is demonstrating how to bleed a brake line, sleeves rolled up.',
            ],
            shopkeeper: [
                'is running a mock trade at the front desk, haggling over a tin of beans.',
                'is teaching the class how to tally a ledger by lamplight.',
                'is explaining how to spot a counterfeit cap.',
                'is walking through how to price salvage by what it can fix.',
                'is quizzing students on the fair trade value of ammunition.',
            ],
            doctor: [
                'is demonstrating how to clean and dress a wound on a volunteer.',
                'is laying out a battered first aid kit, naming each item.',
                'is teaching how to splint a broken arm with scrap wood.',
                'is explaining how to tell infection from ordinary swelling.',
                'is drilling the class on taking a pulse and counting breaths.',
            ],
            teacher: [
                'is showing how to break a lesson into small, repeatable steps.',
                'is having a student lead the lesson, taking notes from the back of the room.',
                'is explaining how to keep a room of restless children focused.',
                'is reviewing a stack of hand-written lesson plans with the class.',
                'is walking through how to teach reading with only a single book.',
            ],
            cook: [
                'is showing how to stretch a single rabbit into a meal for ten.',
                'is demonstrating how to smoke and salt meat so it keeps.',
                'is passing around wild herbs, naming the safe ones and the deadly ones.',
                'is teaching how to bake flatbread on a hot stone.',
                'is explaining how to tell when canned food has gone bad.',
            ],
        },
        idle: {
            mechanic: [
                'is leaning against the workbench, wiping grease from a wrench while waiting for students.',
                'is laying out salvaged engine parts in neat rows for the next lesson.',
            ],
            shopkeeper: [
                'is idly counting caps at the front desk, waiting for students to arrive.',
                'is chalking up a price list of common trade goods for the next lesson.',
            ],
            doctor: [
                'is sitting by the supply shelf, waiting for students to show up.',
                'is rolling bandages and sorting what is left of the medicine for the next lesson.',
            ],
            teacher: [
                'is perched on the edge of the desk, waiting for students to arrive.',
                'is copying out lesson plans by hand for the next class.',
            ],
            cook: [
                'is tending a small pot on the stove, waiting for students to arrive.',
                'is sorting dried herbs and spices into jars for the next lesson.',
            ],
        },
    },

    instructorClass: function (npc) {
        const job = (npc && npc.assignedTo) || '';
        return job.startsWith('instructor-') ? job.slice('instructor-'.length) : null;
    },

    isInstructor: function (npc) {
        return this.instructorClass(npc) !== null;
    },

    isEnrolled: function (npc) {
        return !!(npc && npc.teach) && !this.isInstructor(npc);
    },

    // Indices into $guests of all assigned instructors.
    instructorIndices: function () {
        const guests = variables().guests ?? [];
        const indices = [];
        for (let i = 0; i < guests.length; i++) {
            if (this.isInstructor(guests[i])) {
                indices.push(i);
            }
        }
        return indices;
    },

    // Classes that currently have an instructor assigned.
    instructedClasses: function () {
        const guests = variables().guests ?? [];
        return this.instructorIndices().map(i => this.instructorClass(guests[i]));
    },

    // Night school extension built (unlocked by 'Event - Youth district - night school').
    isBuilt: function () {
        const v = variables();
        return !!((v.game.location.school ?? false) && v.player.quests?.evening_school_built);
    },

    // Night school built and at least one instructor assigned (ignores the time of day).
    hasInstructors: function () {
        return this.isBuilt() && this.instructorIndices().length > 0;
    },

    // ── Introduction event ──────────────────────────────────────────────────
    // Building cost of the night school extension.
    buildCost: { wood: 30, metal: 5, rope: 2, cloth: 3 },

    canAffordBuild: function () {
        return Object.keys(this.buildCost).every(k => setup.cabinInventory.count(k) >= this.buildCost[k]);
    },

    // Building takes 2 hours, can only start 09:00-22:00, and waits for the day school to let out at 15:00.
    buildHours: 2,
    buildWindow: { from: '09:00', to: '22:00' },
    daySchoolHours: { from: '09:00', to: '15:00' },

    canStartBuild: function () {
        return timeBetween(this.buildWindow.from, this.buildWindow.to);
    },

    buildWaitsForSchool: function () {
        return timeBetween(this.daySchoolHours.from, this.daySchoolHours.to);
    },

    payBuild: function () {
        for (const [item, count] of Object.entries(this.buildCost)) {
            setup.cabinInventory.drop(item, count);
        }
        const date = variables().gameDate;
        if (this.buildWaitsForSchool()) {
            const [h, m] = this.daySchoolHours.to.split(':').map(Number);
            date.setHours(h, m, 0, 0);
        }
        date.setHours(date.getHours() + this.buildHours);
        variables().player.quests.evening_school_built = true;
    },

    // Adult, non-feral guests with the teacher skill who aren't the kids' teacher: who can pitch the idea.
    introCandidates: function () {
        return (variables().guests ?? []).filter(g => setup.getAge(g) >= 18
            && !(g.traits ?? []).includes('feral')
            && (g.skills ?? []).includes('teacher')
            && g.assignedTo !== 'school');
    },

    // Night-class skills other than teacher, with the day job each one goes with.
    tradeJobs: { doctor: 'hospital', mechanic: 'garage', shopkeeper: 'shop', cook: 'kitchen' },

    /**
     * Cast for the introduction event:
     *   npc        - the guest pitching it (prefers one who also has a trade skill)
     *   focus      - one of npc's trade skills, or null
     *   others     - up to 2 other guests with trade skills: [{ npc, skill }]
     *   backup     - an NPC working a trade job (or the kids' teacher): { npc, job }, or null
     *   dayTeacher - guest assigned to the day school, or null
     */
    introCast: function () {
        const guests = variables().guests ?? [];
        const trades = Object.keys(this.tradeJobs);
        const tradesOf = npc => trades.filter(s => (npc.skills ?? []).includes(s));

        const candidates = this.introCandidates();
        if (!candidates.length) return null; // the Youth district trigger checks this; guard any other way in
        const preferred = candidates.filter(g => tradesOf(g).length);
        const npc = setup.getRandomElement(preferred.length ? preferred : candidates);
        const focus = tradesOf(npc).length ? setup.getRandomElement(tradesOf(npc)) : null;

        // Prefer the skill that matches the job they actually work, so the anecdote fits.
        const others = guests.filter(g => g.id !== npc.id && tradesOf(g).length).shuffle().slice(0, 2).map(g => {
            const skills = tradesOf(g);
            return { npc: g, skill: skills.find(s => this.tradeJobs[s] === g.assignedTo) ?? setup.getRandomElement(skills) };
        });

        const dayTeacher = guests.find(g => g.assignedTo === 'school') ?? null;
        const tradeWorkers = guests.concat(variables().slaves ?? [])
            .filter(g => g.id !== npc.id && Object.values(this.tradeJobs).includes(g.assignedTo));
        const backupNpc = tradeWorkers.length ? setup.getRandomElement(tradeWorkers) : dayTeacher;
        const backup = backupNpc ? { npc: backupNpc, job: backupNpc.assignedTo } : null;

        return { npc, focus, others, backup, dayTeacher };
    },

    isOpen: function () {
        return this.hasInstructors() && timeBetween(this.hours.from, this.hours.to);
    },

    /** Everyone enrolled in cls (guests, then slaves), whether or not they're in class right now. */
    enrolledIn: function (cls) {
        const v = variables();
        return (v.guests ?? []).concat(v.slaves ?? []).filter(npc => npc.teach === cls && this.isEnrolled(npc));
    },

    /** Status line for the School bulletin notice, shown whenever no evening session is running. */
    noticeStatus: function () {
        const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const date = variables().gameDate;
        const now = date.getHours() * 60 + date.getMinutes();
        const open = toMin(this.hours.from);
        const close = toMin(this.hours.to);

        if (now >= open && now < close) {
            return 'Classes run tonight until 9pm, but no instructors have been assigned yet.';
        }
        if (now >= close) {
            return 'Closed for the night. Classes resume tomorrow at 6pm.';
        }
        const wait = open - now;
        if (wait > 12 * 60) return 'Closed for the night. Classes resume at 6pm.';
        const hours = Math.round(wait / 60);
        const when = wait < 60 ? wait + (wait === 1 ? ' minute' : ' minutes')
            : hours === 1 ? 'about an hour'
            : 'about ' + hours + ' hours';
        return 'Opening in ' + when + '.';
    },

    // Companions are keyed by list index ('guest:3', 'slave:1'); match by id so copies like $tmpGirl work too.
    isCompanion: function (npc) {
        const v = variables();
        const lists = { guest: v.guests ?? [], slave: v.slaves ?? [] };
        return Object.keys(v.player.companions ?? {}).some(function (key) {
            const [type, index] = key.split(':');
            return lists[type] !== undefined && lists[type][index]?.id === npc.id;
        });
    },

    // Students in class right now (guests first, then slaves), optionally only those taking cls.
    // Returns [{ type: 'guest' | 'slave', index, npc }].
    students: function (cls) {
        const v = variables();
        const result = [];
        for (const [type, list] of [['guest', v.guests ?? []], ['slave', v.slaves ?? []]]) {
            for (let i = 0; i < list.length; i++) {
                const npc = list[i];
                if ((cls === undefined || npc.teach === cls) && this.isEnrolled(npc) && this.attends(npc)) {
                    result.push({ type: type, index: i, npc: npc });
                }
            }
        }
        return result;
    },

    // True if npc takes part in evening class at all (instructor or student), ignoring the time of day.
    eligible: function (npc) {
        if (!npc || !(this.isInstructor(npc) || this.isEnrolled(npc))) return false;
        if (setup.getAge(npc) < 18 || typeof npc.sick !== 'undefined') return false;
        if (!this.hasInstructors()) return false;
        return !this.isCompanion(npc);
    },

    // True if npc is sitting in (or teaching) an evening class right now.
    attends: function (npc) {
        return this.eligible(npc) && timeBetween(this.hours.from, this.hours.to);
    },

    /**
     * Location icons for the School tile in Widget - grid during evening class:
     * instructors first (with their class icon as a badge), then guest students, then slave students.
     * Same shape as the grid's worker avatars, plus b (badge html) and bc (badge class).
     */
    gridAvatars: function () {
        if (!this.isOpen()) return [];
        const guests = variables().guests ?? [];
        const avatar = (npc, cls) => ({
            src: (npc.portrait || setup.npcGetPackPortrait(npc)) || null,
            i: setup.getNpcInitials(npc.name),
            g: npc.gender ?? 0,
            c: npc.color || null,
            n: (npc.name || '') + (cls ? ' (' + cls + ' instructor)' : ''),
            b: cls ? this.icons[cls] : null,
            bc: cls ? 'es-class-' + cls : null,
        });
        const instructors = this.instructorIndices()
            .map(i => guests[i])
            .filter(npc => this.attends(npc))
            .map(npc => avatar(npc, this.instructorClass(npc)));
        return instructors.concat(this.students().map(s => avatar(s.npc, null)));
    },

    /** True if npc (or a copy like $tmpGirl) was approached at the night school during class. */
    isAtNightSchool: function (npc) {
        return !!npc && npc.location === 'school' && this.attends(npc);
    },

    /**
     * Everyone else in evening class right now (instructors first, then guest and slave students),
     * as group-sex partners for npc: [{ type: 'guest' | 'slave', index, npc }].
     */
    classmates: function (npc) {
        const guests = variables().guests ?? [];
        const instructors = this.instructorIndices()
            .filter(i => this.attends(guests[i]))
            .map(i => ({ type: 'guest', index: i, npc: guests[i] }));
        return instructors.concat(this.students()).filter(e => e.npc.id !== npc.id);
    },

    // ── Overnight ───────────────────────────────────────────────────────────
    // The sleep cycle resets drunk and ticks sickness before the school runs, so
    // tonight's class is captured first (beginNight) and read back afterwards.

    // Stat each class trains (same keys the day jobs use).
    skillStats: {
        mechanic: 'garage',
        shopkeeper: 'shop',
        doctor: 'hospital',
        teacher: 'school',
        cook: 'kitchen',
    },

    // { attended: Set of npc ids, instructors: { class: npc id }, drunk: { npc id: drunk },
    //   roster: [{ id, type: 'guest'|'slave', role: 'instructor'|'student', cls }] }  (cls null for 'undecided')
    night: null,

    /** Call at the start of the sleep cycle, before any NPC is processed. */
    beginNight: function () {
        const v = variables();
        const night = { attended: new Set(), instructors: {}, drunk: {}, roster: [] };
        for (const [type, list] of [['guest', v.guests ?? []], ['slave', v.slaves ?? []]]) {
            for (const npc of list) {
                if (!this.eligible(npc)) continue;
                night.attended.add(npc.id);
                if (this.isInstructor(npc)) {
                    const cls = this.instructorClass(npc);
                    night.instructors[cls] = npc.id;
                    night.roster.push({ id: npc.id, type: type, role: 'instructor', cls: cls });
                } else {
                    night.drunk[npc.id] = npc.drunk ?? 0;
                    night.roster.push({ id: npc.id, type: type, role: 'student', cls: this.classes.includes(npc.teach) ? npc.teach : null });
                }
            }
        }
        this.night = night;
    },

    /** Share of a job's output lost to class hours; at least 10% for juggling both. */
    jobLoss: function (job) {
        const hours = setup.outsideWorkHours[job];
        if (!hours) return 0.1;
        const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const start = toMin(hours.from);
        let end = toMin(hours.to);
        if (end <= start) end += 1440;
        const classStart = toMin(this.hours.from);
        const classEnd = toMin(this.hours.to);
        let overlap = 0;
        for (const shift of [0, 1440]) {
            overlap += Math.max(0, Math.min(end, classEnd + shift) - Math.max(start, classStart + shift));
        }
        return Math.max(0.1, overlap / (end - start));
    },

    /** Job output after evening class; apply after setup.personality.output. Never drops a real result to zero. */
    output: function (npc, amount) {
        if (!amount || amount < 1 || !this.night || !this.night.attended.has(npc.id) || this.isInstructor(npc)) {
            return amount;
        }
        return Math.max(1, setup.personality.round(amount * (1 - this.jobLoss(npc.assignedTo))));
    },

    /** Nightly skill progress for adult students whose class had an instructor present. */
    nightlyLearning: function () {
        const night = this.night;
        if (!night) return;
        const v = variables();
        const has = (npc, ...traits) => traits.some(t => setup.personality.has(npc, t));

        for (const npc of (v.guests ?? []).concat(v.slaves ?? [])) {
            if (!night.attended.has(npc.id) || this.isInstructor(npc)) continue;
            const cls = npc.teach;
            const instructorId = night.instructors[cls];
            if (!this.skillStats[cls] || !instructorId) continue; // undecided, or no instructor in class tonight
            const instructor = setup.getNpcById(instructorId);
            if (!instructor) continue;

            const name = setup.displayName(npc);
            const teacherName = setup.displayName(instructor);
            const reasons = [];
            let gain = 1;

            if ((npc.teachAdvStudy ?? 0) > 0) {
                let chance = has(instructor, 'careless') ? 20 : 35;
                if (has(npc, 'organized', 'curious')) chance *= 2;
                if (setup.percentageChance(chance)) {
                    gain++;
                    reasons.push('advanced study');
                }
                npc.teachAdvStudy--;
            }
            if (has(instructor, 'critical') && setup.percentageChance(25)) {
                gain++;
                npc.happy = Math.max(-100, (npc.happy ?? 0) - 3);
                reasons.push(teacherName + "'s demanding teaching");
            }
            if (has(instructor, 'efficient', 'organized') && setup.percentageChance(20)) {
                gain++;
                reasons.push(teacherName + "'s well-run lessons");
            }
            if (has(instructor, 'friendly', 'compassionate') && setup.percentageChance(25)) {
                npc.happy = Math.min(100, (npc.happy ?? 0) + 1);
            }
            if (reasons.length) {
                setup.sleepMessages.addJob(name + ' learned a little extra in ' + cls + ' class today due to ' + reasons.join(' and ') + '.', 'school');
            }
            if (setup.percentageChance(night.drunk[npc.id] ?? 0)) {
                gain--;
                setup.sleepMessages.addJob(name + ' partied a little too hard and forgot some of what ' + setup.pronounceWhat(npc) + ' learned in ' + cls + ' class.', 'school');
            }

            const stat = this.skillStats[cls];
            npc.stats ??= {};
            npc.stats[stat] = Math.max(0, (npc.stats[stat] ?? 0) + gain);

            if (npc.stats[stat] >= 100 && !(npc.skills ?? []).includes(cls)) {
                (npc.skills ??= []).push(cls);
                setup.sleepMessages.addJob('<span class="skill">' + npc.name + ' learned the ' + cls + ' skill in evening class' + this.proudParents(npc, instructor) + '</span>', 'school');
            }
        }
        this.night = null;
    },

    /**
     * Tail for a 'learned the skill' message, used by the day and evening school:
     * '. Mom is very proud, and Maria is to be commended!' (parents gain 5 happy, the instructor 3).
     * instructor is optional; returns '' when there is nobody to mention.
     */
    proudParents: function (npc, instructor) {
        const names = [];
        for (const parentId of [npc.family?.mother, npc.family?.father]) {
            if (!parentId || parentId === 'mc') continue;
            const parent = setup.getNpcById(parentId);
            if (!parent) continue;
            parent.happy = Math.min(100, (parent.happy ?? 0) + 5);
            names.push(parent.name);
        }
        const parts = [];
        if (names.length) parts.push(names.join(' and ') + (names.length === 1 ? ' is' : ' are') + ' very proud');
        if (instructor) {
            instructor.happy = Math.min(100, (instructor.happy ?? 0) + 3);
            parts.push(instructor.name + ' is to be commended'); // plain name: the line is styled as a whole (span.skill)
        }
        return parts.length ? '. ' + parts.join(', and ') + '!' : '';
    },
};
