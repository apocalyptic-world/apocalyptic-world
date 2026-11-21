/* setup.npc part: life-event history (addHistory, labels) and the in-game calendar. setup.npc is spread over js/npc/*.js. */
Object.assign(setup.npc ??= {}, {
	/* Add a life-event entry to npc.history */
	addHistory: function(npc, event, extra) {
		if (!npc) return;
		npc.history = npc.history ?? [];
		const oneTimeEvents = ['virgin_lost', 'first_sex_mc'];
		if (oneTimeEvents.includes(event) && npc.history.some(h => h.event === event)) return;
		// an NPC can divorce and remarry: each marriage gets an entry, only a repeat of the current one is skipped
		if (event === 'married' && setup.npc.currentMarriage(npc)?.with === extra?.with) return;
		const entry = { event, day: variables().game?.day ?? 0 };
		if (extra) Object.assign(entry, extra);
		npc.history.push(entry);
	},

	/* Human-readable label for a history entry */
	historyLabel: function(entry) {
		const day = 'Day ' + entry.day + ': ';
		const withName = !entry.with ? ''
			: entry.with === 'mc' ? (variables().playerName ?? 'you')
			: (setup.npc.findById(entry.with)?.name ?? 'someone');
		switch (entry.event) {
			case 'virgin_lost':      return day + 'Lost virginity' + (withName ? ' to ' + withName : '');
			case 'married':          return day + 'Married ' + (withName || 'someone');
			case 'divorced':         return day + 'Divorced ' + (withName || 'someone');
			case 'first_sex_mc':     return day + 'First intimate moment with ' + (withName || 'you');
			case 'captured':         return day + 'Captured'
				+ (entry.reason === 'bounty' ? ' for a bounty' : entry.reason === 'intruder' ? ' sneaking into the settlement' : entry.reason === 'hunted' ? ' by your people hunter' : '')
				+ (entry.place ? ' at ' + entry.place : '');
			case 'rescued':          return day + 'Rescued' + (entry.place ? ' from ' + entry.place : '');
			case 'taken_in':         return day + 'Taken in' + (entry.place ? ' from ' + entry.place : '');
			case 'born': {
				// motherName/place: mothers who live elsewhere (settlement leaders) can't be looked up by id
				const mother = (entry.mother ? setup.npc.findById(entry.mother)?.name : null) ?? entry.motherName;
				return day + 'Born' + (mother ? ' to ' + mother : '') + (entry.place ? ' in ' + entry.place : '');
			}
			case 'tribute_accepted': return day + 'Accepted as tribute from ' + (entry.place ?? 'a settlement');
			case 'tribute_slave':    return day + 'Taken as tribute from ' + (entry.place ?? 'a settlement') + ', made a slave';
			case 'recruited':        return day + 'Recruited from ' + (entry.place ?? 'a settlement');
			case 'siege_captive':    return day + 'Taken captive after attack on ' + (entry.place ?? 'a settlement');
			case 'refugee':          return day + 'Arrived as refugee from fallen ' + (entry.place ?? 'a settlement');
			case 'raider_turned':    return day + 'Offered a home after attacking' + (entry.place ? ' from ' + entry.place : '');
			case 'invited':          return day + 'Invited to settlement';
			case 'bought':           return day + (entry.place ? 'Bought from ' + entry.place : 'Bought at slave market');
			case 'moved_to_guest':   return day + 'Moved to guest house';
			case 'moved_to_slave':   return day + 'Moved to basement';
			case 'grown_up':         return day + 'Grew up and joined settlement';
			case 'released':         return day + 'Released';
			case 'returned':         return day + 'Left, then came back';
			case 'found_words':      return day + 'Found words again';
			default:                 return day + entry.event;
		}
	},

	/* Convert a game-day number to an in-game Date */
	dayToDate: function(day) {
		if (day == null) return null;
		const gameDate = variables().gameDate;
		if (!gameDate) return null;
		const d = new Date(gameDate);
		d.setDate(d.getDate() + (day - (variables().game?.day ?? 0)));
		return d;
	},

	/* True if today is the NPC's birthday. Some Characters (Vincent, Dom, the horse) have no birthDate. */
	isBirthday: function(npc) {
		const today = variables().gameDate;
		return !!npc?.birthDate && npc.birthDate.getDate() === today.getDate() && npc.birthDate.getMonth() === today.getMonth();
	}
});
