/* setup.npc part: marriage, exes and whether an NPC slept with the MC. setup.npc is spread over js/npc/*.js. */
Object.assign(setup.npc ??= {}, {
	isMarried: function (npc) {
		const fam = npc.family || {};
		return (
			(fam.wives && fam.wives.length > 0) ||
			(fam.husband && fam.husband !== "")
		);
	},

	areMarriedToEachOther: function (npcA, npcB) {
		const famA = npcA.family || {};
		const famB = npcB.family || {};

		const spousesA = [
			...(famA.wives || []),
			...(famA.husband ? [famA.husband] : [])
		];

		const spousesB = [
			...(famB.wives || []),
			...(famB.husband ? [famB.husband] : [])
		];

		return (
			spousesA.includes(npcB.id) ||
			spousesB.includes(npcA.id)
		);
	},

	canHaveSexBetween: function(npc1, npc2) {
		const AIsMarried = setup.npc.isMarried(npc1);
		const BIsMarried = setup.npc.isMarried(npc2);

		if (!AIsMarried && !BIsMarried) {
			return true;
		}

		if (setup.npc.areMarriedToEachOther(npc1, npc2)) {
			return true;
		}

		// 1% cheating
		return Math.random() <= 0.01;
	},

	/* True if a spouse id refers to someone who's gone for good.
	   Guests/slaves are simply removed when gone, so absence = lost.
	   Characters persist in $characters when dead — check the dead flag. */
	isSpouseLost: function(spouseId) {
		if (!spouseId || spouseId === 'mc') {
			return false;
		}
		const npc = setup.getNpcById(spouseId);
		if (!npc) return true;
		return (npc.dead ?? false) || (npc.quests?.dead ?? false);
	},

	/* True if npc is currently unmarried and has the MC in their exes */
	isExOfMc: function(npc) {
		return !npc.married && (npc.family?.exes ?? []).includes('mc');
	},

	/* True when the MC has had sex with npc: an act with the MC in her counters (setup.sexActs.hadSexWithMc), or proof
	   kept elsewhere: her history (first intimate moment, virginity lost to the MC), a marriage to the MC (current or
	   past), a pregnancy by him or a child by him. Old saves converted their mixed sex counter to "with others" (it
	   can't be split), so for them the history and family are what show it. findNpc resolves the kids' ids. */
	sleptWithMc: function(npc, findNpc = setup.getNpcById) {
		if (!npc) return false;
		if (setup.sexActs.hadSexWithMc(npc)) return true;
		if ((npc.history ?? []).some(h => h.event === 'first_sex_mc' || (h.event === 'virgin_lost' && h.with === 'mc'))) return true;
		if (npc.family?.husband === 'mc' || (npc.family?.exes ?? []).includes('mc')) return true;
		if (npc.pregnancy_father === 'mc') return true;
		return (npc.family?.kids ?? []).some(id => findNpc(id)?.family?.father === 'mc');
	},

	/* The history entry of the NPC's current marriage (the last 'married' with no 'divorced' after it), or null */
	currentMarriage: function(npc) {
		const history = npc.history ?? [];
		for (let i = history.length - 1; i >= 0; i--) {
			if (history[i].event === 'divorced') return null;
			if (history[i].event === 'married') return history[i];
		}
		return null;
	},

	/* The Date the NPC's current marriage began, or null */
	weddingDate: function(npc) {
		const entry = setup.npc.currentMarriage(npc);
		return entry ? setup.npc.dayToDate(entry.day) : null;
	},

	/* True if today is the NPC's wedding anniversary (a year after the marriage, same month+day) */
	isAnniversary: function(npc) {
		const wd = setup.npc.weddingDate(npc);
		if (!wd) return false;
		const today = variables().gameDate;
		return wd.getMonth() === today.getMonth() &&
		       wd.getDate()  === today.getDate()  &&
		       today.getFullYear() > wd.getFullYear();
	},

	/* Number of full in-game years married (meaningful on anniversary day) */
	yearsMarried: function(npc) {
		const wd = setup.npc.weddingDate(npc);
		return wd ? variables().gameDate.getFullYear() - wd.getFullYear() : 0;
	}
});
