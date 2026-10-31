/**
 * Guest house beds: the one place that knows how many beds there are and who has room.
 *
 *   $guesthouseLimit    number of beds (kept a plain number so saves stay simple; repaired on read)
 *   npc.noBed           a newborn placed in a full guest house. Cleared once a bed frees up; until then
 *                       the mother loses happiness every night, and a guest mother leaves with the baby.
 *   npc.waitingForBed   day a nursery kid turned adult with no free bed. The kid stays in $nursery, loses
 *                       happiness every night and leaves the settlement once it is at LEAVE_AT.
 */
setup.guestRoom = {
    DEFAULT: 3,
    MAX: 45,
    UPSET_PER_DAY: 20,
    LEAVE_AT: -100,

    /** Current bed count. Repairs undefined/NaN/too-low values (old saves, console edits). MAX only caps building, so cheated counts above it are kept. */
    limit: function () {
        const v = variables();
        let beds = Number(v.guesthouseLimit);
        if (!Number.isInteger(beds)) {
            beds = this.DEFAULT;
        }
        beds = Math.max(this.DEFAULT, beds);
        if (v.guesthouseLimit !== beds) {
            v.guesthouseLimit = beds;
        }
        return beds;
    },

    /** Add beds, never past MAX unless ignoreMax (cheat menu). Returns how many were actually added (0 when already at MAX). */
    addBeds: function (count = 1, ignoreMax = false) {
        const before = this.limit();
        variables().guesthouseLimit = ignoreMax ? before + count : Math.max(before, Math.min(this.MAX, before + count));
        return variables().guesthouseLimit - before;
    },

    isMaxed: function () {
        return this.limit() >= this.MAX;
    },

    /** Beds left to build before MAX. */
    bedsToBuild: function () {
        return Math.max(0, this.MAX - this.limit());
    },

    /** Guests who sleep in the guest house - wives living in the player's room (setup.spouseRoom) don't take a bed */
    occupants: function () {
        return (variables().guests ?? []).filter(g => !setup.spouseRoom.livesHere(g));
    },

    freeBeds: function () {
        return Math.max(0, this.limit() - this.occupants().length);
    },

    /** True when the guest house is built and has `count` free beds. Gate every guest-house offer with this. */
    hasRoom: function (count = 1) {
        return (variables().game.location.guesthouse ?? false) && this.freeBeds() >= count;
    },

    /** Newborns placed in a full guest house. */
    bedless: function () {
        return (variables().guests ?? []).filter(g => g.noBed);
    },

    /** True if npc is the mother of a newborn that has no bed (she leaves by the guest room rule, not the usual unhappiness one). */
    waitsForBed: function (npc) {
        return !!npc?.id && this.bedless().some(baby => baby.family?.mother === npc.id);
    },

    /**
     * Where a newborn goes: the nursery when there is one (no bed needed), else the guest house (flagged
     * noBed when it is full), else the basement. Returns 'nursery' | 'guest' | 'noBed' | 'basement'.
     */
    placeNewborn: function (child) {
        const v = variables();
        if (v.game.location.nursery ?? false) {
            (v.nursery ??= []).push(child);
            return 'nursery';
        }
        if (v.game.location.guesthouse ?? false) {
            if (this.freeBeds() < 1) {
                child.noBed = true;
            }
            v.guests.push(child);
            return child.noBed ? 'noBed' : 'guest';
        }
        v.slaves.push(child);
        return 'basement';
    },

    /**
     * Nightly, after guests have left: bedless newborns get a bed as soon as the house is no longer over capacity;
     * the mothers of the rest lose happiness. A guest mother who reaches LEAVE_AT leaves with her bedless babies.
     * Returns the $guests indices to remove, highest first (the caller runs <<guestLeft>> on each).
     */
    nightlyBedless: function () {
        const guests = variables().guests ?? [];
        const bedless = this.bedless();
        if (!bedless.length) {
            return [];
        }

        let settle = bedless.length - Math.max(0, guests.length - this.limit());
        for (const baby of bedless) {
            if (settle <= 0) {
                break;
            }
            delete baby.noBed;
            settle--;
            setup.sleepMessages.addMain(setup.displayName(baby) + ' finally has a bed of ' + setup.pronounceWhos(baby) + ' own in the guest house.');
        }

        const babiesByMother = {};
        for (const baby of this.bedless()) {
            const motherId = baby.family?.mother;
            if (motherId) {
                (babiesByMother[motherId] ??= []).push(baby);
            }
        }

        const leaving = [];
        for (const motherId in babiesByMother) {
            const mother = setup.getNpcById(motherId);
            if (!mother) {
                continue;
            }
            const babies = babiesByMother[motherId];
            const names = babies.map(b => setup.displayName(b)).join(' and ');
            mother.happy = Math.max(this.LEAVE_AT, (mother.happy ?? 0) - this.UPSET_PER_DAY);

            const motherIndex = guests.indexOf(mother);
            if (motherIndex > -1 && mother.happy <= this.LEAVE_AT) {
                leaving.push(motherIndex);
                for (const baby of babies) {
                    leaving.push(guests.indexOf(baby));
                }
                setup.sleepMessages.addMain('<span class="left">' + setup.displayName(mother) + ' left the settlement and took ' + names + ' along. There was never a bed for ' + (babies.length > 1 ? 'them' : setup.pronounceWho(babies[0])) + ' in the guest house.</span>');
            } else {
                setup.sleepMessages.addMain('<span class="warning">' + setup.displayName(mother) + ' is upset that ' + names + (babies.length > 1 ? ' still have' : ' still has') + ' no bed in the guest house <strong>(happy ' + mother.happy + ')</strong>.</span>');
            }
        }

        return leaving.filter(i => i > -1).sort((a, b) => b - a);
    },

    /** True when a nursery kid who turned adult has to wait for a bed: the guest house is built but full. */
    adultMustWait: function () {
        return (variables().game.location.guesthouse ?? false) && this.freeBeds() < 1;
    },

    /**
     * Nightly for a nursery kid who is 18 or older: 'move' when a guest house bed is free (or there is no guest house
     * yet, as before the bed limit), otherwise the kid stays in the nursery and gets upset ('wait') until LEAVE_AT,
     * when they leave the settlement ('leave').
     */
    nurseryAdultNight: function (npc, day) {
        if (!this.adultMustWait()) {
            delete npc.waitingForBed;
            delete npc.noBed; // a bedless baby later moved into the nursery (Nursery - built) must not come back flagged
            return 'move';
        }

        const firstNight = typeof npc.waitingForBed === 'undefined';
        if (firstNight) {
            npc.waitingForBed = day;
        }
        npc.happy = Math.max(this.LEAVE_AT, (npc.happy ?? 0) - this.UPSET_PER_DAY);

        if (npc.happy <= this.LEAVE_AT) {
            setup.sleepMessages.add('<span class="left">' + setup.displayName(npc) + ' gave up waiting for a bed in the guest house and left the settlement.</span>', 'nursery');
            return 'leave';
        }
        if (firstNight) {
            setup.sleepMessages.add('<span class="warning">' + setup.displayName(npc) + ' turned 18, but there is no free bed in the guest house. ' + setup.pronounceWhat(npc, true) + ' has to stay in the nursery and is getting upset <strong>(happy ' + npc.happy + ')</strong>.</span>', 'nursery');
        } else {
            setup.sleepMessages.add('<span class="warning">' + setup.displayName(npc) + ' is still stuck in the nursery waiting for a bed in the guest house and is getting more upset <strong>(happy ' + npc.happy + ')</strong>.</span>', 'nursery');
        }
        return 'wait';
    }
};
