/*
 * The longer ways the player can help a caretaker from "Offer to help with nursery care":
 * keeping the kids occupied, and tutoring school-age children after class.
 * The scene itself is in NPC offer nursery help.tw.
 */
setup.nurseryHelp = {
    /* Percent chance that one of the kids stands out while the player helps keep them occupied */
    EXEMPLARY_CHANCE: 30,
    TUTOR_INT: 50,
    TUTOR_FROM: '15:00',
    TUTOR_TO: '19:00',
    TUTOR_MAX_STUDENTS: 2,
    /* Extra skill points when the player brings a book along */
    BOOK_BONUS: 2,
    /* Extra skill points when the caretaker is a teacher, or a teacher who also has the skill being taught */
    TEACHER_BONUS: 1,
    TEACHER_SKILL_BONUS: 2,
    /* Where a caretaker who has the skill would have learned it, for the tutoring scene */
    SKILL_EXPERIENCE: {
        gardener: 'working the garden',
        cook: 'cooking',
        doctor: 'tending the sick',
        woodcraft: 'working in the woods',
        shopkeeper: 'running a shop'
    },

    /* Day school subjects and the stat each one trains, same as Sleep - school. 'random' students study all of them. */
    SUBJECTS: {
        gardener: 'garden',
        cook: 'kitchen',
        doctor: 'hospital',
        teacher: 'school',
        woodcraft: 'forest',
        shopkeeper: 'shop'
    },

    /** Children in the room right now. School-age kids are in class during school hours. */
    kidsPresent: function () {
        const encounters = setup.nurseryEncounters;
        const inClass = encounters.currentSlot() === 'schoolHours' && (variables().player.quests.school_built ?? false);
        return encounters.healthyKids(0, 17).filter(kid => !(inClass && setup.getAge(kid) >= 5));
    },

    /** A child old enough to be praised for behaving, or null if nobody stood out */
    rollExemplary: function () {
        const kids = this.kidsPresent().filter(kid => setup.getAge(kid) >= 3);
        return kids.length && setup.percentageChance(this.EXEMPLARY_CHANCE) ? kids.random() : null;
    },

    /** Whether tutoring would be on offer if the player were clever enough */
    tutoringOffered: function () {
        return timeBetween(this.TUTOR_FROM, this.TUTOR_TO)
            && (variables().player.quests.school_built ?? false)
            && this.subjects().length > 0;
    },

    tutorBlockedBy: function () {
        return (variables().player.int ?? 0) >= this.TUTOR_INT ? '' : 'Need intelligence ' + this.TUTOR_INT + '+';
    },

    hasSkill: function (kid, subject) {
        return (kid.skills ?? []).includes(subject);
    },

    /** School-age children studying this subject (or studying at random) who don't have the skill yet */
    students: function (subject) {
        return setup.nurseryEncounters.healthyKids(5, 17).filter(kid => {
            const studying = kid.teach ?? 'random';
            return (studying === 'random' || studying === subject) && !this.hasSkill(kid, subject);
        });
    },

    /** Subjects with at least one student who could use the help */
    subjects: function () {
        return Object.keys(this.SUBJECTS).filter(subject => this.students(subject).length > 0);
    },

    /** Progress toward the skill, 0 to 100 */
    progress: function (kid, subject) {
        return kid.stats?.[this.SUBJECTS[subject]] ?? 0;
    },

    /**
     * What a caretaker brings to a tutoring session: 'skill' for a teacher who also has the skill being taught,
     * 'teacher' for a teacher, or '' for anyone else. Teaching the teacher skill itself counts once.
     */
    teacherHelp: function (carer, subject) {
        if (!carer || !this.hasSkill(carer, 'teacher')) {
            return '';
        }
        return subject !== 'teacher' && this.hasSkill(carer, subject) ? 'skill' : 'teacher';
    },

    /**
     * One hour of tutoring. Skill points can go past 100, but the skill itself is only learned overnight (graduate).
     * Returns { points: { kid: points gained }, relationship: { kid: relationship gained } }.
     */
    tutor: function (kids, subject, useBook, carer) {
        const encounters = setup.nurseryEncounters;
        const stat = this.SUBJECTS[subject];
        const gained = { points: {}, relationship: {} };
        const help = this.teacherHelp(carer, subject);
        const teacherBonus = help === 'skill' ? this.TEACHER_SKILL_BONUS : help ? this.TEACHER_BONUS : 0;
        if (useBook) {
            setup.cabinInventory.drop('book');
        }
        for (const kid of kids) {
            const points = random(1, 2) + (useBook ? this.BOOK_BONUS : 0) + teacherBonus;
            kid.stats ??= {};
            kid.stats[stat] = (kid.stats[stat] ?? 0) + points;
            gained.relationship[kid.id] = encounters.changeKin(kid, 1, 2);
            gained.points[kid.id] = points;
        }
        return gained;
    },

    /**
     * Text for <<linkdesc>> from [label, amount] pairs, e.g. "Happiness +3 &bull; Relationship +4".
     * Anything that didn't move is left out. With who, the line starts with "who: ".
     */
    effects: function (pairs, who) {
        const text = pairs.filter(([, amount]) => amount)
            .map(([label, amount]) => label + ' ' + (amount > 0 ? '+' : '') + amount)
            .join(' &bull; ');
        return text && who ? who + ': ' + text : text;
    },

    /**
     * Nightly, from Sleep - school: any school-age child with 100+ points in a subject learns that skill,
     * whether or not tonight's lesson went well and whether or not there is a teacher.
     */
    graduate: function (teacher) {
        for (const kid of setup.nurseryCare.kidsAged(5, 17)) {
            for (const subject of Object.keys(this.SUBJECTS)) {
                if (this.progress(kid, subject) >= 100 && !this.hasSkill(kid, subject)) {
                    kid.skills ??= [];
                    kid.skills.push(subject);
                    const proud = setup.eveningSchool.proudParents(kid, teacher);
                    setup.sleepMessages.addJob('<span class="skill">' + kid.name + ' learned the ' + subject + ' skill' + proud + '</span>', 'school');
                }
            }
        }
    }
};
