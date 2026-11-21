/**
 * What an NPC says during sex with the MC, after one of his actions (views/npc/fuck/mc/Reactions.tw, which handles
 * feral NPCs, climax / pre-climax and the named characters' own passages first).
 *
 * REACTIONS[action] is a list of branches tried in order; the first one that applies is used:
 *   when(npc, V)  condition (V = story variables); may roll its own setup.percentageChance
 *   chance        percent roll, only made when `when` is true
 *   lines         one is picked at random; %mcName% / %McName% become setup.npc.mcName(npc) (capitalised)
 *   branches      a nested list, same rules (nothing applies: no reaction)
 *   use           the branches of another action (sn: half bj, half pussy_lick)
 * Actions that say the same as another one are in ALIASES ('_fisting', '_cum_oral', … are shared by several actions).
 * A branch without when/chance always applies (the "else").
 */
setup.sexReactions = {
	/** Actions that say the same as another one: action -> REACTIONS key. */
	ALIASES: {
		pussy_fisting: '_fisting', anal_fisting: '_fisting',
		anal_fingering: '_ass_play', assjob: '_ass_play',
		cum_on_face: '_cum_on_body', cum_on_back: '_cum_on_body', cum_on_stomach: '_cum_on_body',
		cum_in_mouth: '_cum_oral', cum_throat: '_cum_oral', cum_in_throat: '_cum_oral'
	},

	/** True when there are reactions for action. (hasOwnProperty, not Object.hasOwn: that needs iOS Safari 15.4+) */
	has(action) {
		const own = obj => Object.prototype.hasOwnProperty.call(obj, action);
		return own(this.ALIASES) || own(this.REACTIONS);
	},

	/**
	 * How npc is related to the MC for the family lines: 'daughter', 'sister', 'mother' or null (also null under the
	 * noIncest policy). Used here and in the threesome reactions (Threeactions.tw).
	 */
	relation(npc, V = variables()) {
		if (!npc || V.player?.baseManagement?.noIncest) return null;
		const pf = V.player?.family ?? {};
		const f = npc.family ?? {};
		if (f.father === 'mc') return 'daughter';
		const hasId = npc.id != null;
		// also a sister who shares a parent with the MC but is in neither siblings list
		if ((f.siblings ?? []).includes('mc') || (hasId && (pf.siblings ?? []).includes(npc.id)) || setup.family.mcSiblingType(npc)) return 'sister';
		// the MC's mother; 'mc' in kids alone counts only for a woman, so his father never speaks as his mother
		if (hasId && npc.id !== pf.father && (npc.id === pf.mother || ((f.kids ?? []).includes('mc') && (npc.gender === 0 || npc.gender === 2)))) return 'mother';
		return null;
	},

	/** The MC's wife, on a chance roll (percent), or anyone at a wedding (80%). */
	wife(npc, chance) {
		return (npc.family?.husband === 'mc' && setup.percentageChance(chance)) || (npc.location === 'wedding' && setup.percentageChance(80));
	},

	/** A reaction line for npc after action ('generic' when the action has none), or '' when no branch applies. */
	line(npc, action, V = variables()) {
		const key = this.has(action) ? (this.ALIASES[action] ?? action) : 'generic';
		const branches = this.REACTIONS[key];
		const lines = this.resolve(branches, npc, V);
		if (!lines) return '';
		return lines[Math.floor(Math.random() * lines.length)]
			.replace(/%McName%/g, setup.npc.mcName(npc, true))
			.replace(/%mcName%/g, setup.npc.mcName(npc, false));
	},

	/** The lines of the first branch that applies (following branches / use), or null. */
	resolve(branches, npc, V) {
		for (const branch of branches) {
			if (branch.when && !branch.when(npc, V)) continue;
			if (branch.chance != null && !setup.percentageChance(branch.chance)) continue;
			if (branch.use) return this.resolve(this.REACTIONS[branch.use], npc, V);
			if (branch.branches) return this.resolve(branch.branches, npc, V);
			return branch.lines;
		}
		return null;
	},

	REACTIONS: {
		pussy: [
			{ when: npc => (npc.pregnancy ?? 0) >= 8, chance: 35, lines: [
				"Mmmmh, I love how you're so careful with me right now, %mcName%...  You feel so good inside me.",
				"Ooh, %mcName%...  Everything's so much more sensitive carrying your baby, you fill me perfectly.",
				"Ahh, %mcName%...  Be gentle, but don't stop, I love how you feel inside me.",
				"Mmmhh, My body is so warm and full right now, %mcName%...   In every possible way...",
				"*sigh* %mcName%...  I feel you so deeply...  Everything's heightened when I'm carrying like this."
			] },
			{ when: npc => setup.sexReactions.wife(npc, 30), lines: [
				"Mmmmh, %mcName%...  My husband, inside me, this is everything.",
				"*sigh* You feel so right inside me, %mcName%...  Like you were made for me.",
				"Ahh, %mcName%...  I belong to you, and you belong inside me...",
				"Mmmhh, %mcName%...  Nobody else gets this, only you, only ever you.",
				"*wrapping around you* %McName%...  My husband feels so perfect inside me..."
			] },
			{ when: npc => npc.family?.husband && npc.family?.husband !== 'mc', chance: 40, lines: [
				"Mmmmh, %mcName%...  I know I shouldn't...  but you feel so much better than he does...",
				"*biting her lip* He can never know about this, %mcName%...  But I can't stop...",
				"Ahh, %mcName%...  This is so wrong...  so why does it feel so right?",
				"Mmmhh, %mcName%...  My husband doesn't make me feel like this...  not even close.",
				"*whispering* What are you doing to me, %mcName%...  I keep coming back for this..."
			] },
			{ when: npc => setup.companions.has(npc), chance: 35, lines: [
				"*sighing* You have my back out there every day, %mcName%...  In here you can have all of me.",
				"Out there we're partners.  In here, you can claim me anytime.",
				"*quietly* Every time we come back from the wastes I think about this, %mcName%...  Just this.",
				"The wasteland's a hard place...  I like you even harder, %mcName%.",
				"The wasteland is unforgiving...but you make me forget that for a while, %mcName%."
			] },
			{ when: npc => npc.location === 'kitchen', chance: 35, lines: [
				"Ahh, %mcName%!  Right here in the kitchen? This is so bad and so good!",
				"Mmmhh, %mcName%...  You bent me over the counter like I'm something on the menu...",
				"*gasping* The things we do in this kitchen, %mcName%...  If the household ever knew...",
				"Ahh, %mcName%!  You're so insatiable, I love it!"
			] },
			{ when: npc => npc.location === 'hospital', chance: 35, lines: [
				"Ahh, %mcName%!  This is definitely not standard procedure, but don't stop...",
				"Mmmhh, %mcName%...  The bedside manner here is exceptional...",
				"Mmmhh, yes, %mcName%...  This is just what the doctor ordered...",
				"*gasping* Is this covered by my treatment plan?  Because I want more...",
				"Ahh, %mcName%, this is just the injection I was hoping for..."
			] },
			{ when: npc => npc.location === 'maid', chance: 35, lines: [
				"Ahh, %mcName%!  I was supposed to be cleaning in here, not...  this...",
				"Mmmhh, %mcName%...  You caught me making the bed and now I'm...  this is much better.",
				"*gasping* I don't think this is in my job description, %mcName%...  but I'm not complaining...",
				"Ahh, %mcName%!  The bed was so tidy before you bent me over it..."
			] },
			{ when: npc => npc.location === 'church', chance: 35, lines: [
				"Mmmmh, %mcName%...  In this church we offer all of ourselves to what brings us closer to the divine...",
				"Ahh, %mcName%...  The body is a temple.  You are very welcome in mine.",
				"*sighing* Pleasure is a form of prayer here...  I have been praying for this, %mcName%...",
				"*gasping* Some churches say this is sin...  we say it is sacred...  *exhaling* so very sacred...",
				"Mmmhh...  Our faith holds that joy is holy, %mcName%...  you make me very devout right now...",
				"*exhaling slowly* The flesh is not something to be denied here.  It is to be celebrated.  *quietly* Celebrate me.",
				"Ahh, %mcName%...  *softly* The spirit is willing.  So is the flesh.  *exhaling* Very willing..."
			] },
			{ when: npc => npc.location === 'workout', chance: 35, lines: [
				"Ahh, %mcName%!  Already out of breath from training and now this, I love it!",
				"Mmmhh, %mcName%...  All that sweat and effort, this is the reward I deserve..",
				"*panting* You feel so good, %mcName%...  My heart's already racing, this just finishes me off.",
				"Ahh, %mcName%!  Best workout recovery routine I've ever had, you feel amazing!"
			] },
			{ when: npc => npc.location === 'car', chance: 35, lines: [
				"Ahh, %mcName%!  We barely fit in here, and yet it's perfect somehow!",
				"Mmmhh, %mcName%...  Cramped and sweaty and I love every second of it...",
				"*gasping* Anyone could see us through the windows, %mcName%...  That just makes it better, doesn't it?",
				"Ahh, %mcName%!  This backseat isn't big enough but somehow you fit perfectly inside me!"
			] },
			{ when: npc => npc.location === 'forest', chance: 35, lines: [
				"Ahh, %mcName%!  Out here in the open, it feels so primal!",
				"Mmmhh, %mcName%...  The trees, the air, you inside me, this is perfect.",
				"*gasping* Anyone could walk by, %mcName%...  I love the risk of it...",
				"I love this, %mcName%!  Out here in nature, raw and real, you feel incredible!"
			] },
			{ when: npc => npc.location === 'shower', chance: 35, lines: [
				"Ahh, %mcName%!  The hot water and you, I can barely stand!",
				"Mmmhh, %mcName%...  All wet and you're inside me, this is my favorite kind of shower.",
				"*gasping* The steam is already making me dizzy and you feel incredible, %mcName%...",
				"Ahh, %mcName%!  I came in here to get clean and you're making me so dirty!"
			] },
			{ when: npc => npc.location === 'massage', chance: 35, lines: [
				"Ahh, %mcName%!  This is a very thorough massage...",
				"Mmmhh, %mcName%...  I was so relaxed from your hands, and now you're inside me, perfection.",
				"*gasping* The oils, the warmth, and now this, %mcName%, you feel incredible...",
				"Ahh, %mcName%!  Your touch.. your passion.. it's all I need..."
			] },
			{ when: npc => npc.location === 'bathhouse', chance: 35, lines: [
				"Ahh, %mcName%!  The sauna heat and you inside me, my whole body is melting!",
				"Mmmhh, %mcName%...  Everything's already so hot and wet, and now this...",
				"*gasping* The steam makes everything feel so intense, %mcName%...  I can barely breathe.",
				"Oh, %mcName%!  The heat of your body feels so intense in here..."
			] },
			{ when: npc => npc.location === 'school', chance: 35, lines: [
				"Ahh, %mcName%!  This is not in the curriculum, but please don't stop...",
				"Mmmhh, %mcName%...  Yes, give me my lesson, right here on the desk...",
				"Ohh, %mcName%...  Talk about hot for teacher...",
				"*gasping* If anyone walked in right now, %mcName%...  Don't stop, I don't care!",
				"Ahh, %mcName%!  The teacher is receiving a very hands-on lesson today..."
			] },
			{ when: npc => npc.location === 'basement' && npc.type === 'guest', chance: 40, lines: [
				"Ahh, yes, %mcName%!  Bind me, claim me, show me who I belong to...",
				"Mmmhh, I love being taken down here, %mcName%...  This feels so dangerous and incredible.",
				"*gasping* The darkness, the ropes, and your cock.. Mmm, %mcName%...  Such a perfect combination...",
				"Yes, %mcName%!  Pound me!  Punish me!  Let me feel it all!"
			] },
			{ when: npc => npc.location === 'mistress', chance: 35, branches: [
				{ when: npc => (npc.sub ?? 0) < 20, lines: [
					"Mmmhh...  In this dungeon, I make the rules...  *gasping*  ...and right now the rule is that you keep going, %mcName%...",
					"*exhaling slowly* You're allowed in here because I allow it, %mcName%...  and I am allowing it very much right now...",
					"Ahh...  Look at you...  privileged enough to be inside your Mistress...  *quietly*  ...don't waste it, %mcName%.",
					"Mmmhh...  I set the pace, I set the rules...  *gasping*  ...and I say deeper, %mcName%...",
					"*with authority* You please me, %mcName%...  I'll let you know when you're done..."
				] },
				{ when: npc => (npc.sub ?? 0) <= 50, lines: [
					"Mmmhh, %mcName%...  I give the orders in this dungeon to everyone...  except you, and right now that's perfect.",
					"*exhaling* I press others against these walls...  *quietly*  ...and here I am, pressed against one for you, %mcName%...",
					"Ahh...  They hear me crack the whip down there...  *softly*  ...they'll never hear this side of me, %mcName%...",
					"Mmmhh, you walked into my dungeon and somehow became the only one I'd open the door for, %mcName%...",
					"*gasping* I don't let just anyone in here, %mcName%...  You know that.  Make it worth my while."
				] },
				{ lines: [
					"Mmmhh, %mcName%...  Take me however you want...  the dungeon, the power, all of it is yours...  so am I.",
					"*exhaling* I have spent years in control of every person in this dungeon...  *softly*  ...with you, I don't want to be.",
					"Ahh...  You are the master here, %mcName%...  and I give you this gladly...  take whatever you need from me.",
					"Mmmhh...  *pressing closer*  Command me as you please...  I will meet every desire, %mcName%...",
					"*quietly* My whip is on the wall...  my authority stays at the door...  in here, I am only yours, %mcName%."
				] }
			] },
			{ when: npc => npc.location === 'streets', chance: 35, lines: [
				"Ahh, %mcName%!  You're getting the full experience today, I'm not holding back for you.",
				"Mmmhh, %mcName%...  Usually I clock out in my head, but you're keeping me very present.",
				"*gasping* You're different from the others, %mcName%...  I really feel this...",
				"Ahh, %mcName%!  Let me show you just how much this pussy is worth..."
			] },
			{ when: npc => npc.location === 'strip_club', chance: 35, lines: [
				"Ahh, %mcName%!  This has gone so far beyond 'no hands', and I am completely fine with that.",
				"Mmmhh, %mcName%...  I know there are rules here, but you're worth breaking them for...",
				"*grinding on your lap* Is this the kind of lap dance you were looking for, %mcName%...",
				"*gasping* The music's still playing out there, %mcName%...  And I'm in here with you inside me...",
				"Ahh, %mcName%!  You wanted a private show, this is as private as it gets..."
			] },
			{ when: npc => npc.location === 'nightclub', chance: 70, lines: [
				"Mmmhh, %mcName%...  The tiles are cold and you're so warm inside me...  I'm not complaining.",
				"Ahh...  I came here to dance, %mcName%...  this is a much better use of the evening.",
				"*quietly* The bass is shaking the walls...  and you're deep inside me in a nightclub bathroom...  this is insane.",
				"Mmmhh...  I barely know you, %mcName%...  but this feels incredible.",
				"*gasping* This is completely reckless...  and I don't want to stop, %mcName%..."
			] },
			{ when: npc => npc.location === 'gloryhole', chance: 35, lines: [
				"Ahh...  Just your cock through a hole in the wall, %mcName%, and I can feel every inch inside me...",
				"Mmmhh...  I can't see your face but I'd know this cock anywhere, %mcName%, you fill me perfectly...",
				"*gasping* The wall, the hole, you on the other side, I can feel how deep you are...",
				"Ahh...  Just your manhood through this opening, and it's more than enough..."
			] },
			{ when: npc => npc.location === 'milk_barn', chance: 35, lines: [
				"Mmmhh...  *gasping*  ...everything at once...  the pull, the ache, and now you deep inside me...  *shaking*  ...I can't think straight, don't stop...",
				"Ahh, %mcName%...  *pressing back against you*  ...I was already so close to the edge when you walked in...  *breathlessly*  ...this is almost too much...",
				"*breathless* I'm already so sensitive...  and you feel so...  *gasping*  ...please don't stop...  please...",
				"Ohh...  *gripping the frame*  ...I can't reach you, I can't pull you closer...  *whimpering softly*  ...just give me more...",
				"Mmmhh, %mcName%...  *trembling*  ...I'm going to fall apart right here...  *exhaling*  ...and I don't mind at all.",
				"*softly* The whole barn disappears when you're inside me...  *gasping*  ...all I feel is you..."
			] },
			{ when: (npc, V) => setup.sexReactions.relation(npc, V) !== null, chance: 45, branches: [
				{ when: (npc, V) => setup.sexReactions.relation(npc, V) === 'daughter', lines: [
					"I know it's wrong, %mcName%... but it feels so right...",
					"Mmmh, %mcName%... doesn't family feel just perfect...",
					"The fact that it's you, %mcName%, makes it feel even better...",
					"I know we shouldn't, %mcName%... but that's what makes it so exciting...",
					"Mmmm, I bet mine feels much better than mom's does...",
					"Ahhh, yes, %mcName%, forbidden fruit really is the best...",
					"I was made for you, %mcName%..."
				] },
				{ when: (npc, V) => setup.sexReactions.relation(npc, V) === 'sister', lines: [
					"We grew up together, %mcName%, but who could have predicted we would be this close...",
					"I know we shouldn't, %mcName%...  but you feel better than anyone I've ever been with...",
					"My own brother, inside me...  *breathless*  ...the best secret we've ever kept...",
					"You feel so perfect inside me, %mcName%... like we were made for each other...",
					"Mmm, %mcName%...  family really does fit best, doesn't it...",
					"Nobody will believe what we get up to when nobody's watching, %mcName%...",
					"I always knew we were close...  *softly*  ...I didn't know it would feel like this...",
					"Forbidden fruit...  *gasping*  ...and you're the most forbidden of all, %mcName%..."
				] },
				{ lines: [
					"My own son, inside me...  *breathless*  ...I always knew you'd grow up to be something special...",
					"Mmm, %mcName%...  I made you, and now you're claiming me...  the circle of it all...",
					"I gave you life...  *gasping*  ...and you're giving me the time of my life...  I call that a fair trade...",
					"You fit so perfectly inside me, %mcName%... like you were made to fill me...",
					"You know your mother better than anyone, %mcName%...  and right now you know me completely...",
					"Forbidden fruit...  and I gave birth to it...  *quietly*  ...I'm not the least bit sorry...",
					"You came from me, %mcName%...  *softly*  ...and now you come back to me like this...",
					"I raised you so well...  *gasping*  ...so well, %mcName%..."
				] }
			] },
			{ lines: [
				"You feel so good inside me, %mcName%!",
				"You're the perfect fit, %mcName%...",
				"Yes.. you're such a stallion, %mcName%...",
				"You're so much better than a toy, %mcName%...",
				"Oooh, %mcName%, your cock fills me so perfectly...",
				"Yes!  Yes!  Harder, %mcName%!",
				"Ahh, mmmhh, yes! Fuck me %mcName%!  Give me more!",
				"Fuck! Yes, %mcName%, so deep...",
				"Ahh!  Hahhh!  Yes, %mcName%, I can't get enough of your cock!",
				"Mmmm... Deeper, %mcName%..."
			] }
		],

		anal: [
			{ when: npc => (npc.anal ?? 0) >= 20, branches: [
				{ when: npc => setup.sexReactions.wife(npc, 30), lines: [
					"Mmmhh, %mcName%...  My husband can have all of me, every part of me...",
					"*exhaling slowly* I love sharing this with you, %mcName%...  I belong to you.",
					"Ahh, %mcName%...  I love giving my husband everything...  Take it, it's yours.",
					"*gripping the sheets* This is my gift to you, %mcName%...  No part of me is off limits."
				] },
				{ when: npc => npc.family?.husband && npc.family?.husband !== 'mc', chance: 40, lines: [
					"*gasping* He's never brave enough to take me like this...  you are, %mcName%...",
					"Mmmhh, %mcName%...  My husband doesn't even know I like this...  you figured it out immediately.",
					"Ahh, %mcName%...  He'd never dare...  That's the difference between you two right there.",
					"*whispering* He doesn't get this from me...  but I can't say no to you, %mcName%..."
				] },
				{ when: npc => (npc.pregnancy ?? 0) >= 8, chance: 35, lines: [
					"*carefully* My pussy needs a little break right now...  this is my gift to you in the meantime, %mcName%.",
					"Mmmhh, %mcName%...  The baby gets the front...  you get the back.",
					"Ahh, %mcName%...  I'll never let you go without, and this way works for both of us...",
					"*slowly* I'm bigger than I used to be...  but this still works, and I still want you, %mcName%."
				] },
				{ when: npc => setup.companions.has(npc), chance: 35, lines: [
					"You trust me out there with your life, %mcName%...  I trust you with this.",
					"*exhaling* Partners everywhere, %mcName%...  Even here.  Even like this.",
					"*tensing* We've been through harder things together.  My ass is yours, %mcName%.",
					"Out in the field you always have me.  In here — *exhaling* — you have all of me."
				] },
				{ when: npc => npc.location === 'kitchen', chance: 35, lines: [
					"Ahh, %mcName%!  Taking me in the kitchen, right where I cook, this is so filthy!",
					"Mmmhh, %mcName%...  Bent over in here, taking you like this, I love it.",
					"*gasping* The things we do in this kitchen, %mcName%...  You feel so deep from this angle."
				] },
				{ when: npc => npc.location === 'hospital', chance: 35, lines: [
					"Ahh, %mcName%!  This is a very thorough examination...",
					"Mmmhh, %mcName%...  Yes, I need a very deep injection...",
					"*gasping* I love when you bend me over the hospital bed, %mcName%..."
				] },
				{ when: npc => npc.location === 'maid', chance: 35, lines: [
					"Ahh, %mcName%!  I came to clean the bedroom, not get my own pipes cleaned...  this is very unexpected...",
					"Mmmhh, %mcName%...  This is what happens when I drop the duster...",
					"*gasping* You're going to make me ruin the sheets I just changed, %mcName%..."
				] },
				{ when: npc => npc.location === 'church', chance: 35, lines: [
					"Ahh, %mcName%...  Our church teaches that all forms of devotion have their place...",
					"Mmmhh, %mcName%...  The sisters would be scandalized.  The elders would understand.",
					"*gasping* Every part of me is consecrated to this, %mcName%...  take what is offered freely...",
					"*slowly* We have a saying here...  the body holds no shame in the sight of the sacred.  *exhaling* None at all.",
					"Ahh...  deeper, %mcName%...  this too is a form of grace, I am certain of it...",
					"*quietly* I have offered far more modest things at the altar.  *gripping you* This feels more honest.",
					"Mmmhh...  The divine asks for nothing held back.  *exhaling* I hold nothing back, %mcName%..."
				] },
				{ when: npc => npc.location === 'workout', chance: 35, lines: [
					"Ahh, %mcName%!  Already worked my whole body during training, but my glutes were waiting for this!",
					"Mmmhh, %mcName%...  Yes, take me deeper.  I love getting my reps in with you...",
					"*panting* Mmm, nothing like a good stretch after a workout, %mcName%...  You feel so deep..."
				] },
				{ when: npc => npc.location === 'car', chance: 35, lines: [
					"Ahh, %mcName%!  If you thought the backseat was tight, how is my backdoor..?",
					"Mmmhh, %mcName%...  Anyone could see us through the window, I don't care, deeper!",
					"*gasping* The confined space makes you feel even bigger, %mcName%..."
				] },
				{ when: npc => npc.location === 'forest', chance: 35, lines: [
					"Ahh, %mcName%!  Bend me over against a tree!  It feels so raw and wild!",
					"Mmmhh, %mcName%...  Balls deep in my ass, where anyone could stumble on us.. Don't stop!",
					"*gasping* Claim my ass, right out here in nature, %mcName%...  This is so primal, I love it..."
				] },
				{ when: npc => npc.location === 'shower', chance: 35, lines: [
					"Ahh, %mcName%!  Do you like the hot water running down my back over your cock while you bury yourself inside me?",
					"Mmmhh, %mcName%...  All the steam and heat, and now getting filled like this, my knees are going to give out...",
					"*gasping* You're so deep, %mcName%...  The shower makes this feel even more intense..."
				] },
				{ when: npc => npc.location === 'massage', chance: 35, lines: [
					"Ahh, %mcName%!  The massage loosened everything up, and now this, perfect.",
					"Mmmhh, %mcName%...  The massage oils make you slide in so smoothly.. so good...",
					"*gasping* Mmmph, you're driving me into the massage table, %mcName%...  And I love it."
				] },
				{ when: npc => npc.location === 'bathhouse', chance: 35, lines: [
					"Ahh, %mcName%!  The sauna heat around me and your heat deep inside me, I'm going to melt completely!",
					"Mmmhh, %mcName%...  Everything is relaxed from the heat, and you slide so deep...",
					"*gasping* So hot, so steamy, and you in my ass, %mcName%...  This is perfect."
				] },
				{ when: npc => npc.location === 'school', chance: 35, lines: [
					"Yes, %mcName%!  Bend me over this desk and teach me a lesson!",
					"Mmmhh, %mcName%...  I love when you take over my ass.. I mean class...",
					"*gasping* Pin me against the chalkboard, %mcName%...  And let me feel you deep inside me..."
				] },
				{ when: npc => npc.location === 'basement' && npc.type === 'guest', chance: 35, lines: [
					"Ahh! *smack* Yes, %mcName%!  Own my ass, spank me again, harder!",
					"Mmmhh, take me, %mcName%...  Tie me up!  Claim me, in every way...",
					"*gasping* Spank me again, %mcName%...  Down here nobody hears, take everything...",
					"Ahh, %mcName%!  The ropes, the darkness, and your cock filling my ass.  Perfection...",
					"Mmmhh, %mcName%...  You brought me down here to use me, so use me..."
				] },
				{ when: npc => npc.location === 'mistress', chance: 35, branches: [
					{ when: npc => (npc.sub ?? 0) < 20, lines: [
						"*controlled breath* I'll allow this...  *gasping*  ...because it pleases your Mistress to allow it, %mcName%...",
						"Ahh...  Even here, even like this, I decide who gets this from me...  I've decided it's you, %mcName%.",
						"Mmmhh...  Don't think this means you've taken something from me, %mcName%...  I'm giving it...  there's a difference.",
						"*gripping the wall* Your Mistress permits you to continue, %mcName%...  *gasping*  ...and that is high praise...",
						"Ahh...  I command this dungeon...  and I command you to go deeper, %mcName%..."
					] },
					{ when: npc => (npc.sub ?? 0) <= 50, lines: [
						"*carefully controlled breath* I use the strap-on on the others, %mcName%...  this is reserved for you alone.",
						"Ahh...  I could stop you if I wanted to, %mcName%...  *quietly*  ...I don't want to.",
						"Mmmhh...  The dungeon mistress taking it instead of giving it...  *gasping*  Only for you, %mcName%...",
						"*gripping the chains on the wall* Everything I do to them...  *breathless*  ...you do to me...  and I let you, %mcName%.",
						"Ahh...  This is not in anyone's job description...  *softly*  ...but I'm not stopping you, %mcName%..."
					] },
					{ lines: [
						"*exhaling* Take all of me, %mcName%...  everything I withhold from the others...  it's yours, freely given.",
						"Ahh...  My Master...  *softly*  I offer this willingly...  every part of me is at your pleasure.",
						"Mmmhh...  I hold power over everyone in this dungeon...  *gasping*  ...and I surrender all of it to you, %mcName%...",
						"*quietly* You don't need to take anything from me, %mcName%...  I will give you whatever you ask...  always.",
						"Ahh...  *pressing back*  More, %mcName%...  I am yours...  use me as you please..."
					] }
				] },
				{ when: npc => npc.location === 'streets', chance: 35, lines: [
					"Ahh, %mcName%!  This is a special service, but for you, absolutely worth it.",
					"Yes, %mcName%... Even though it's a job, I love feeling you in my ass...",
					"Mmmhh, %mcName%... Let me show you why this ass is worth every penny...",
					"*gasping* You like it rough, %mcName%...  I can work with that..."
				] },
				{ when: npc => npc.location === 'strip_club', chance: 35, lines: [
					"Ahh, %mcName%!  This is what I call a pole dance...",
					"Mmmhh, %mcName%...  Nobody takes a private dance to the.. depth that you do...",
					"*gasping* We left the rules behind ages ago, %mcName%.  Nothing is off limits..."
				] },
				{ when: npc => npc.location === 'nightclub', chance: 70, lines: [
					"Ahh, %mcName%...  I came here to dance, not to end up like this in a bathroom stall...  but here we are.",
					"*bracing against the wall* Mmmhh...  You're incredibly confident for someone I met an hour ago, %mcName%...",
					"*gasping* The bass through the tiles...  your hands on my hips...  this is completely surreal, %mcName%...",
					"Ahh...  You barely said ten words to me out there, %mcName%...  and now you're all the way in...",
					"*quiet moan* If anyone walks in right now...  *gasping*  ...don't stop, %mcName%, don't stop..."
				] },
				{ when: npc => npc.location === 'gloryhole', chance: 35, lines: [
					"Mmmhh...  Even through the wall, %mcName%, you're so deep in my ass, I can feel every inch...",
					"*gasping* Your cock feels perfect through the hole, filling me completely...",
					"Ahh...  The wall between us makes it more intense somehow, you feel incredible deep inside me...",
					"*pushing back* I'd know this cock anywhere, %mcName%, even through a glory hole, take me deeper..."
				] },
				{ when: npc => npc.location === 'milk_barn', chance: 35, lines: [
					"*gripping the frame* Ahh, %mcName%...  held completely still and you're right there behind me...  *gasping*  ...I have no choice but to feel every single thing...",
					"Mmmhh...  *trembling*  ...I was already so wound up...  and now you're inside me too...  *breathlessly*  ...it's almost too much...",
					"Ohh...  *straining toward you*  ...I want to push back, I want to give you more...  *whimpering*  ...take what I can't reach to give you...",
					"*quietly* I was already so close to losing it...  and then you walked in and...  *gasping*  ...everything goes quiet except you, %mcName%...",
					"Ahh, %mcName%...  *shaking*  ...please tell me this is what you wanted...  *softly*  ...I want so much to be what you want...",
					"*exhaling slowly* Right here, just like this...  *barely audible*  ...don't stop...  please don't stop..."
				] },
				{ when: (npc, V) => setup.sexReactions.relation(npc, V) !== null, chance: 45, branches: [
					{ when: (npc, V) => setup.sexReactions.relation(npc, V) === 'daughter', lines: [
						"It's so naughty %mcName%.. but it feels so right....",
						"Mmmm, %mcName%.. doesn't forbidden ass feel the best...?",
						"Yes, %mcName%, let me feel that special cock deep inside me..",
						"You know this ass was made just for you, %mcName%...",
						"I bet mom doesn't let you do this, does she?",
						"All of my holes belong to you, %mcName%.  You know why...",
						"I was made for you, %mcName%..."
					] },
					{ when: (npc, V) => setup.sexReactions.relation(npc, V) === 'sister', lines: [
						"We share so many things, %mcName%...  *gasping*  ...but this has to be the most forbidden one...",
						"Mmmm, %mcName%...  siblings who share everything...  I mean everything...",
						"I let nobody else back here...  *breathless*  ...but you're not just anyone, %mcName%...",
						"It's wrong...  *gasping*  ...which is exactly why it feels this good...",
						"My own brother...  *whispering*  ...all the way in...  I'm not complaining, %mcName%...",
						"You know, growing up sharing the same roof...  *breathless*  ...I always wondered if we'd end up here...",
						"Forbidden fruit hits different when it's your own blood, %mcName%..."
					] },
					{ lines: [
						"My own son, taking me here...  *breathless*  ...you've grown into quite the man, %mcName%...",
						"I gave you everything when you were little...  *gasping*  ...and I'm still giving everything, %mcName%...",
						"You belong to me more than anyone...  *quietly*  ...so I suppose I belong to you too...",
						"My body made yours, %mcName%...  *breathless*  ...and now yours claims mine...  the poetry of it...",
						"Forbidden?  Perhaps...  *gasping*  ...but I raised a man who takes what he wants, and I admire that...",
						"Mmm, %mcName%...  you certainly know how to handle your mother...",
						"Every part of me was always yours to have, %mcName%..."
					] }
				] },
				{ when: npc => (npc.virgin ?? false), chance: 40, lines: [
					"I'm so glad we have this loophole, %mcName%!",
					"I love being able to feel you inside me, %mcName%.  This way works so well.",
					"It feels so good here,  %mcName%... I don't see how the other way could be much better.",
					"Mmmm, %mcName%.. I love being so pure and so dirty at the same time..."
				] },
				{ lines: [
					"You feel so good in my ass, %mcName%!",
					"It's a little tight, %mcName%... but I can take it.",
					"Mmmm, %mcName%, do you like when I clench my ass like that?",
					"Oooh, yes, deeper %mcName%, deeper...",
					"Ah!  Mmf! Harder, %mcName%! Ngh, yes! Harder!",
					"*pushing back* Mmmph!  Yes, %mcName%, I love when you take me deeper!",
					"Hahh, yes!  Oooh, fill me, %mcName%!  Fill my ass!",
					"Mmmmh, %mcName%, your cock feels perfect in my ass.",
					"Ahh, %mcName%, does my ass feel good on your cock?",
					"Mmph.. you're so deep, %mcName%.  I love it..."
				] }
			] },
			{ when: npc => (npc.traits ?? []).includes('masochist'), lines: [
				"Ahh! Ungh! %McName%, it hurts, but don't stop!",
				"Ow! It's too tight, %mcName%!  Give me more...",
				"Mmph! Keep going, %mcName%!  I like it rough...",
				"*pushing back* Nnng!  I can do it, %mcName%!  I'll be good for you!",
				"Hahh, %mcName%, keep going.  Stretch me out like I deserve..."
			] },
			{ lines: [
				"Ahh! Ungh! %McName%, that's too much, please be gentle!",
				"Ow! It's too tight, %mcName%!  I need a break...",
				"Mmph! Hold on, %mcName%!  I'm not ready for this..",
				"Hahh, %mcName%, slow down.  Please get the lube..."
			] }
		],

		cum_in_pussy: [
			{ when: npc => (npc.traits ?? []).includes('breeder') && !((npc.pregnancy ?? 0) >= 8), chance: 50, lines: [
				"*gasping* Yes, %mcName%!  Breed me, give me every drop, I want it all!",
				"Mmmhh, fill me up, %mcName%...  I want to feel new life growing inside me.",
				"Ohh, %mcName%!  Yes, plant your seed deep, let me feel your essence where it belongs...",
				"*trembling* Give it all to me, %mcName%...  Every last drop, make me yours completely.",
				"Ahh, %mcName%!  Nothing feels more right than this, fill me, breed me!"
			] },
			{ when: npc => (npc.traits ?? []).includes('infertile'), chance: 25, lines: [
				"*soft sigh* I love when you fill me, %mcName%...  Even if it won't take, it still feels incredible.",
				"Mmm, %mcName%...  Feeling your warmth inside me...  that alone is enough.",
				"Ohhh, %mcName%...  Even if it never leads to anything, this feeling is everything.",
				"*whispering* Yes, cum inside me, %mcName%...  It won't make a baby, but it makes me feel complete."
			] },
			{ when: npc => (npc.pregnancy ?? 0) >= 8, chance: 40, lines: [
				"*gasping* You're adding to what's already there, %mcName%...  So warm, so deep...",
				"Ohh, %mcName%!  Already carrying your baby and filling me up again, I love it.",
				"Mmmhh, yes, cum inside me, %mcName%...  I'm already round with you, what's a little more?",
				"*shivering* %McName%...  Even with a baby inside me, your warmth makes me feel complete..."
			] },
			{ when: npc => setup.sexReactions.wife(npc, 30), lines: [
				"*sigh* %McName%...  My husband filling me up, it's exactly where you belong.",
				"Mmmmhh, I love feeling you inside me like this, %mcName%...  all of you.",
				"Ohh, %mcName%...  I love feeling your essence filling me, reminding me that I belong to you...",
				"*trembling* Yes, fill me, %mcName%...  Your wife loves every second of this..."
			] },
			{ when: npc => npc.family?.husband && npc.family?.husband !== 'mc', chance: 40, lines: [
				"*gasping* He never cums this deep, %mcName%...  What am I doing...",
				"Ohhh, %mcName%!  He'll never know, and I'll never forget this...",
				"Mmmm, %mcName%, you'r'e playing with fire.  I shouldn't love the danger this much, but it feels so good...",
				"Mmmhh, %mcName%...  I should feel guilty, but all I feel is how good this is...",
				"*shuddering* You're cumming inside me, %mcName%...  My husband can never find out..."
			] },
			{ when: npc => setup.companions.has(npc), chance: 35, lines: [
				"*inhaling slowly* You've kept me alive out there...  *quietly* I'll carry whatever you give me in here, %mcName%.",
				"Warm...  %mcName%...  *softly* After everything out there, this is what I wanted to come home to.",
				"*catching breath* I love when you claim me like this, %mcName%.  It makes me feel like a true Companion.",
				"*exhaling* Yes, %mcName%...  I love feeling the heat of your power filling me..."
			] },
			{ when: (npc, V) => setup.sexReactions.relation(npc, V) !== null, chance: 45, branches: [
				{ when: (npc, V) => setup.sexReactions.relation(npc, V) === 'daughter', lines: [
					"*gasps* You came inside me, %mcName%!  You're so naughty..",
					"%McName%!  You're gonna make me a mommy if you keep doin' that...",
					"Oh, %mcName%, I can feel how much you love your forbidden fruit...",
					"Ahhh, %mcName%, yes.. put that seed where it really belongs...",
					"So naughty, %mcName%.  What will our family tree look like?",
					"Mmmh, %mcName%, I love when you fill me with what made me...",
					"Ohhh, %mcName%, I was made for your seed..."
				] },
				{ when: (npc, V) => setup.sexReactions.relation(npc, V) === 'sister', lines: [
					"*shivering* You came inside me, %mcName%...  your own sister...  we are absolutely terrible...",
					"Mmmh...  siblings who share everything...  *gasping*  ...and I mean everything...",
					"What would people say...  *softly*  ...I honestly don't care right now, %mcName%...",
					"Your seed, inside your sister...  *breathless*  ...forbidden fruit at its finest...",
					"You know this makes us even closer, %mcName%...  *quietly*  ...if that was even possible...",
					"I always knew this would happen eventually...  *sighing*  ...and it was worth every second of the wait, %mcName%...",
					"So wrong...  *exhaling*  ...so, so right..."
				] },
				{ lines: [
					"*gasping* You came inside your own mother, %mcName%...  *softly*  ...and I'm not the least bit sorry...",
					"You came from me once...  *exhaling*  ...and now you come back inside me...  full circle, %mcName%...",
					"Mmmh...  I gave you life...  *quietly*  ...and right now I'd give you anything, %mcName%...",
					"So naughty, my son...  *breathless*  ...so very naughty...  and I'll take some credit for that...",
					"Your seed where it all began...  *softly*  ...I can't think of a better place for it, %mcName%...",
					"What will the family tree look like...  *quietly*  ...I suppose we'll find out...",
					"Your mother receives you completely, %mcName%...  *softly*  ...as she always has..."
				] }
			] },
			{ when: npc => npc.location === 'gloryhole', chance: 35, lines: [
				"*shivering* You came inside me through the wall, %mcName%...  I can feel you throbbing from in here...",
				"Mmmhh...  Your cum is so warm inside me, %mcName%...  Just a hole in the wall between us and you still claim me completely...",
				"*gasping* I can feel everything, %mcName%, every pulse, even through this..."
			] },
			{ when: npc => npc.location === 'strip_club', chance: 35, lines: [
				"Ahh, %mcName%!  I'm going to be out there dancing with your hot cum still inside me...",
				"Mmmhh, %mcName%...  I can't believe how far we went, but you're worth breaking every rule...",
				"*shuddering on your lap as you fill her* Hahh.. I guess this is the kind of lap dance you were looking for, %mcName%...",
				"*gasping* The music is still pumping out there, %mcName%.. They have no idea what you just did inside me...",
				"Mmm, %mcName%, only you get to claim me in the club like this..."
			] },
			{ when: npc => npc.location === 'nightclub', chance: 70, lines: [
				"Mmmhh...  *exhaling*  Your cum inside me in a nightclub bathroom...  I don't even know your last name, %mcName%...",
				"*shivering* I have to go back out there now...  *softly*  with you still inside me...  knowing what just happened...",
				"Ahh...  The bass is still going out there...  and you just came inside me...  this night went places I didn't expect.",
				"*catching her breath* I was out there dancing an hour ago, %mcName%...  *quietly*  How did I end up here...",
				"Mmmhh...  *tilting her head back*  That was completely reckless...  and I loved every second of it, %mcName%..."
			] },
			{ when: npc => npc.location === 'mistress', chance: 35, branches: [
				{ when: npc => (npc.sub ?? 0) < 20, lines: [
					"*exhaling* Warm inside your Mistress...  *quietly*  ...consider that a reward, %mcName%.  You've earned it.",
					"Mmmhh...  I decided to let you do that, %mcName%...  *softly*  ...I want you to understand the distinction.",
					"Ahh...  *catching her breath*  You came inside your Mistress...  *quietly*  ...that is a privilege not given lightly.",
					"*tilting her head* Good...  *softly*  ...very good, %mcName%...  I may permit this again.",
					"Mmmhh...  Warm and deep...  *quietly*  ...because I allowed it...  remember who holds the power in this dungeon, %mcName%."
				] },
				{ when: npc => (npc.sub ?? 0) <= 50, lines: [
					"Mmmhh...  *exhaling slowly*  You claimed me, %mcName%...  I claim everyone in this dungeon...  only you claim me.",
					"*quietly*  Warm inside me...  I don't give this to anyone, %mcName%...  You know how rare that is.",
					"Ahh...  *catching her breath*  The master marks his territory...  *softly*  ...I won't pretend I mind.",
					"*leaning against the wall*  I've spent years being untouchable in here, %mcName%...  *softly*  ...and then there's you.",
					"Mmmhh...  *tilting her head*  Nobody else gets that from me...  not the prisoners, not anyone...  just you, %mcName%."
				] },
				{ lines: [
					"*exhaling slowly* You have claimed me completely, %mcName%...  I am yours...  every part of me...  and I am glad.",
					"Mmmhh...  *softly*  Fill me as you wish...  the master of this dungeon fills his Mistress however he pleases...",
					"Ahh...  *trembling*  I give this to you freely, %mcName%...  I give you everything freely...  always.",
					"*leaning into him* You are the true master here...  *quietly*  ...and I have never been so willing to be claimed.",
					"Mmmhh...  *tilting her head back*  Take everything, %mcName%...  every room in this dungeon, every chain...  and me."
				] }
			] },
			{ when: npc => npc.location === 'streets', chance: 35, lines: [
				"*shivering* You came inside me, %mcName%...  Nobody else gets that without protection..",
				"Mmmhh...  Your cum is so warm inside me, %mcName%...  Even out here in the street you still claim me completely...",
				"*gasping* You already paid, %mcName%. This is an extra deposit..."
			] },
			{ when: npc => npc.location === 'church', chance: 35, lines: [
				"*exhaling slowly* Sacred...  the giving of life is the most holy act there is, %mcName%...  and you just gave it freely...",
				"Mmmhh, %mcName%...  Our church celebrates this above all else.  You have participated in something ancient and good.",
				"*quietly* Be fruitful...  *exhaling* ...I have always taken that scripture very literally, %mcName%.",
				"Warm and deep inside me, %mcName%...  *softly* This is how life begins.  This is the holiest thing.",
				"*sighing* The womb is a temple and you just left an offering, %mcName%...  it is received with gratitude..."
			] },
			{ when: npc => npc.location === 'milk_barn', chance: 35, lines: [
				"*exhaling slowly* Ohh...  *softly*  ...warm and deep inside me, %mcName%...  *trembling*  ...I feel so completely yours right now...",
				"Mmmhh...  *shaking gently*  ...I can feel every pulse of it...  *quietly*  ...stay in me a little longer...",
				"Ahh...  *softly*  ...I was already so wound up...  and then this...  *breathlessly*  ...you always know exactly how to undo me, %mcName%...",
				"*pressing into you as much as she can* Mmmhh...  *quietly*  ...warm everywhere...  *exhaling*  ...I don't want this to end.",
				"*whispering* %mcName%...  *shaking*  ...everything at once...  *softly*  ...I don't know where one feeling ends and the other begins...",
				"Ohh...  *trembling*  ...still aching from the pull, and warm now, and so full...  *quietly*  ...I feel so much right now...",
				"*quietly amused* They send me here to give milk...  *shaking*  ...and here you are, leaving yours inside me...  *softly*  ...I think I got the better end of today.",
				"*laughing softly* I spend all afternoon giving what I make...  *warmly*  ...and you give something back...  *exhaling*  ...this is the only kind of cream I want to keep.",
				"*gasping* A milk girl who gets to receive her own cream...  *trembling*  ...I could get very used to you coming to me here, %mcName%...",
				"*softly* Everything in this barn produces...  *exhaling slowly*  ...and now you've made your own contribution...  *quietly*  ...I'll keep every drop of this one."
			] },
			{ lines: [
				"Mmmmhh, it feels so warm inside me %mcName%...",
				"Yes, fill me up, %mcName%! It feels so good.",
				"Mmm, I feel you throbbing inside me, %mcName%...",
				"Oooh, I feel you cumming so hard, %mcName%!",
				"Ahh, yes, %mcName%, your cum feels so good inside me...",
				"Oh! Mmmm, %mcName%, so much cum, so deep inside me...",
				"Ahh, Ooh! So much cum, %mcName%.  Somebody really likes my pussy...",
				"Mmmmh, %mcName%, I love the feeling of your cum inside me...",
				"I love when you breed me, %mcName%.",
				"Oh %mcName%, it feels so good filling me up..."
			] }
		],

		nipple_lick: [
			{ when: npc => npc.location === 'milk_barn', chance: 60, lines: [
				"*gasping softly as you disconnect her* Ohh...  *breathlessly*  ...couldn't wait, could you, %mcName%?  *warmly*  ...I was hoping you wouldn't...",
				"*looking down at you* Mmmhh...  *quietly amused*  ...the machine gets all afternoon and you get a minute...  *pressing closer*  ...let's make it count.",
				"*shivering* The machine is so cold...  your mouth is so warm...  *exhaling slowly*  ...there is no comparison, %mcName%...",
				"*arching into you* Ohh...  *softly*  ...I'm so full right now, so sensitive...  *trembling*  ...and your tongue right there is...  *gasping*  ...perfect...",
				"*exhaling* Mmmhh...  *threading fingers into your hair*  ...I've been giving all afternoon and now you're taking for yourself...  *softly*  ...good.  Take more.",
				"*quietly* They're yours, %mcName%...  *pressing toward you*  ...take your time...  take everything you want...",
				"*softly* I've been so full...  so long...  *arching toward you*  ...and the machine doesn't care...  *quietly*  ...but your mouth does.  Please don't stop.",
				"*watching you, trembling* Mmmhh...  *softly*  ...do I taste the way you wanted?  *quietly*  ...I've been thinking about this all afternoon...",
				"*breathless* Is this what you came for, %mcName%?  *pressing closer*  ...tell me I'm giving you what you wanted...",
				"*cradling your head gently* Mmmhh...  *softly*  ...let me give you this...  *quietly*  ...I have so much, and I want so much to share it with you, %mcName%..."
			] },
			{ when: npc => ((npc.traits ?? []).includes('milker') || (npc.pregnancy ?? 0) >= 60), chance: 60, lines: [
				"Mmmhh, %mcName%...  Careful, I'm sensitive, and you're going to make me leak...",
				"Ohh, %mcName%!  My nipples are so tender right now, and your tongue feels exquisite...",
				"*cradling your head* Mmmm, %McName%... Do you like my milk?  It's all yours...",
				"Mmmm, %mcName%...  Your mouth feels so perfect.  Have a taste...",
				"Careful, %mcName%, they're full, I might give you a squirt...",
				"*whimpering* They're so sensitive and full, %mcName%... I love when you suck on them..."
			] },
			{ when: npc => (npc.pregnancy ?? 0) >= 8, chance: 45, lines: [
				"Mmmmh, %mcName%...  They've gotten so sensitive lately, your tongue is incredible right now.",
				"Ohh, %mcName%!  Everything's more intense since...  since this...  don't stop.",
				"*sharp intake* %McName%...  So tender right now, that feels amazing...",
				"Mmmhh, %mcName%...  You know exactly how to make me feel good, especially now..."
			] },
			{ lines: [
				"Mmmmh, %mcName%, that feels so good...",
				"Ohhh, %mcName%...  Right there, keep going...",
				"*sighing* %McName%...  Your tongue does magical things...",
				"Mmmm, %mcName%, I love when you pay attention to them...",
				"Ahh, %mcName%!  You know exactly what I like..."
			] }
		],

		bj: [
			{ when: npc => setup.sexReactions.wife(npc, 30), lines: [
				"Mmmh.. %mcName%...  Your wife loves doing this for you...",
				"Mmm, %mcName%.  My husband deserves this treatment.",
				"*kissing up and down* I love you, %mcName%...  Every part of you...",
				"Mmmhh, I love how you taste, %mcName%...  Don't rush, I want to enjoy this."
			] },
			{ when: npc => npc.family?.husband && npc.family?.husband !== 'mc', chance: 40, lines: [
				"*muffled* Mmmhh, %mcName%...  I shouldn't be doing this...  but I can't stop.",
				"Mmm, %mcName%...  My husband doesn't know how I get on my knees for you...",
				"*kissing up the shaft* You taste different from him, %mcName%...  Better...",
				"Mmmhh, %mcName%...  This is the most honest thing I've done all week..."
			] },
			{ when: npc => setup.companions.has(npc), chance: 35, lines: [
				"*muffled* Mmmhh, %mcName%...  After a rough run I've thought about doing this for you.  So let me.",
				"Mmm, %mcName%...  You fight for me out there.  I'll do this for you in here.",
				"*kissing slowly* Partners don't have to ask twice, %mcName%...",
				"*muffled* Mmmhh...  The harder it gets out there, the more I want to do something good when we get back..."
			] },
			{ when: npc => npc.location === 'kitchen', chance: 35, lines: [
				"Ahh, %mcName%!  I just love when you're on the menu!",
				"Mmmhh, %mcName%...  This is my favorite snack...",
				"*grinning* I was hoping for a treat, %mcName%, but you've given me a feast...",
				"Ahh, %mcName%, the cook always gets to have a taste..."
			] },
			{ when: npc => npc.location === 'hospital', chance: 35, lines: [
				"*muffled* Mmmhh, %mcName%...  It's time for your oral treatment...",
				"Mmm, %mcName%...  A specimen like this deserves my.. closest attention.",
				"*grinning* I'll always open up and say 'Ahh' for you, %mcName%...",
				"*kissing slowly* The Hippocratic oath says do no harm.  This is doing you nothing but good..."
			] },
			{ when: npc => npc.location === 'maid', chance: 35, lines: [
				"*muffled* Mmmhh, %mcName%...  I hope you don't mind me waking you up like this...",
				"Mmm, %mcName%...  The cleaning can wait.  This needs my immediate attention.",
				"*smiling* Mmm, a cock like this makes me love this job, %mcName%...",
				"*licking slowly* The last thing in the bedroom for me to get nice and clean..."
			] },
			{ when: npc => npc.location === 'church', chance: 35, lines: [
				"*muffled* Mmmhh, %mcName%...  A form of communion they did not teach in seminary...",
				"Mmm, %mcName%...  In this church, we kneel for many purposes.  I prefer this one.",
				"*muffled* The sacred and the sensual are not so far apart here, %mcName%...  not far at all...",
				"*kissing slowly* I offer this with full devotion.  Body.  Soul.  *muffled* Both.",
				"Mmm...  the flesh is holy text here, %mcName%...  let me read you very carefully...",
				"*muffled* Mmmhh...  Every act of giving is an act of worship.  *slowly* Consider yourself worshipped.",
				"*looking up* I have said many prayers on my knees.  None as sincere as this one, %mcName%..."
			] },
			{ when: npc => npc.location === 'car', chance: 35, lines: [
				"*muffled* Mmmhh, %mcName%...  In the car, with the windows fogging up, love it.",
				"Mmm, %mcName%.  Anyone who walks by is going to know exactly what's happening in here.",
				"*muffled* Mmm, %mcName%, maybe we should try this while you're driving...",
				"Mmmhh, %mcName%...  Buckle up, this is going to be a good ride."
			] },
			{ when: npc => npc.location === 'shower', chance: 35, lines: [
				"*muffled* Mmmhh, %mcName%...  On my knees in the shower for you, the water feels amazing.",
				"Mmm, %mcName%.  All warm and wet in here, and so are you...",
				"*muffled* The steam, the heat, and you in my mouth, %mcName%...  Perfect.",
				"Mmmhh, %mcName%...  I love being on my knees for you in the shower like this..."
			] },
			{ when: npc => npc.location === 'school', chance: 35, lines: [
				"*muffled* Mmmhh, %mcName%...  On my knees at school...  If anybody walked in...",
				"Mmm, %mcName%, are you ready for my oral exam..?",
				"*muffled* I'll do anything for extra credit, %mcName%...  Anything...",
				"*kissing up and down the shaft* Mmmhh, %mcName%, this cock deserves an A+..."
			] },
			{ when: npc => npc.location === 'mistress', chance: 35, branches: [
				{ when: npc => (npc.sub ?? 0) < 20, lines: [
					"*looking up* Your Mistress decides who she kneels for, %mcName%...  *deliberately*  ...you should feel honoured.",
					"Mmmhh...  *pausing*  I set the pace...  I set the depth...  I am still the one in command here, %mcName%.",
					"*controlled*  The others kneel for me...  I kneel for you because I choose to, %mcName%...  don't confuse that for weakness.",
					"Mmm...  *looking up with authority*  Your Mistress will take her time with this...  you wait.",
					"*firmly*  You don't push my head, you don't rush me...  your Mistress decides what she does and when, %mcName%..."
				] },
				{ when: npc => (npc.sub ?? 0) <= 50, lines: [
					"*looking up* I put men in collars, %mcName%...  and here I am on my knees for you.  Don't read too much into it.",
					"Mmmhh...  *pulling back slightly*  I take orders from no one in this dungeon...  *leaning back in*  ...except you.",
					"*deliberate, controlled*  The others get the whip...  you get this, %mcName%...  consider yourself privileged.",
					"Mmm...  *looking up*  Don't mistake this for submission, %mcName%...  *pause*  ...all right, maybe just this once.",
					"*wrapping her hand around the base*  I command this dungeon...  and I'll take my time with this..."
				] },
				{ lines: [
					"*looking up* Take what you need, %mcName%...  I am here to please the master of this dungeon...  in whatever way he asks.",
					"Mmmhh...  *quietly*  I give this willingly...  every bit of authority I carry downstairs means nothing up here with you.",
					"*softly* Use me however pleases you, %mcName%...  my hands, my mouth, everything I have is yours.",
					"Mmm...  *looking up*  Tell me what you want...  I will give it without hesitation, %mcName%.",
					"*taking him deeper*  My power, my pride, my Mistress title...  *quietly*  ...all of it kneels here for you, %mcName%..."
				] }
			] },
			{ when: npc => npc.location === 'streets', chance: 35, lines: [
				"Mmmh.. %mcName%...  You've got a really nice one, this one I actually don't mind.",
				"Mmm, you taste good, %mcName%.  That's a first out here.",
				"*kissing the tip* Mmm, %mcName%, I can enjoy my time with a cock like this...",
				"Mmmhh, %mcName%... Let me show you what a million dollar mouth feels like..."
			] },
			{ when: npc => npc.location === 'strip_club', chance: 35, lines: [
				"*muffled* Mmmhh, %mcName%...  This is very much against club policy...",
				"Mmm, %mcName%.  A cock like this is worth breaking some rules for...",
				"*kneeling between your legs* Is this the kind of private dance you were looking for, %mcName%...",
				"Mmmhh, %mcName%...  The music out there, and your cock in my mouth..."
			] },
			{ when: npc => npc.location === 'nightclub', chance: 70, lines: [
				"*looking up* %mcName%...  I've never done this in a bathroom before.  There's a first time for everything.",
				"*muffled* Mmmhh...  One dance and somehow I'm on my knees for you...  you move fast, %mcName%...",
				"Mmm...  *pausing*  The crowd has no idea where I disappeared to...  *leaning back in*  and I love that.",
				"*breathless* The bass is going right through the floor, %mcName%...  I can feel it in my knees...",
				"*looking up* I barely know you, %mcName%...  but something about tonight made me say yes to all of this..."
			] },
			{ when: npc => npc.location === 'gloryhole', chance: 35, lines: [
				"*muffled* Mmm...  I pressed my lips to this hole and here you are, %mcName%, I'd know this cock anywhere...",
				"Mmm...  All I can see is what's coming through this wall, and what a sight it is...",
				"*kissing the tip* Who needs to see your face when you have something this beautiful to look at...",
				"*muffled* Mmmhh...  I can taste you, %mcName%, it's definitely you..."
			] },
			{ when: npc => npc.location === 'milk_barn', chance: 35, lines: [
				"*pausing, breathless* Mmmhh, %mcName%...  *softly*  ...I've been so wound up in here alone, and the moment you walk in, all I want is to taste you...",
				"*looking up* You came to me...  *pressing forward as far as she can*  ...let me show you how much I wanted you to...",
				"Mmmhh...  *closing her eyes*  ...I'd stay right here for you no matter what...  *softly*  ...just like this...",
				"*breathlessly* I was already aching...  and then your hands in my hair...  *quietly*  ...I want to give you everything I have, %mcName%...",
				"*looking up at you* Everything else in this barn just...  *softly*  ...disappears when you're here...  *exhaling*  ...this is what I've been waiting for."
			] },
			{ lines: [
				"Mmmh.. you taste so good, %mcName%...",
				"Mmmm, %mcName%.  You feel so good in my mouth!",
				"Do you like when I do this with my tongue, %mcName%?",
				"*kissing up and down* Mmm, I love your cock, %mcName%, so much.",
				"*muffled* Mmmmf, I wuv how your balls feel in my mouf, %mcName%.",
				"Mmmm, %mcName%.  Do you like it better when I suck on the tip, or roll your balls on my tongue..?",
				"*muffled* Am I doing it right, %mcName%?"
			] }
		],

		dp: [
			{ when: npc => setup.sexReactions.wife(npc, 30), lines: [
				"*muffled* Nng, %mcName%...  My husband knows exactly how to use every inch of me...",
				"Mmmmhh, I love giving you everything, %mcName%!"
			] },
			{ when: npc => npc.family?.husband && npc.family?.husband !== 'mc', chance: 40, lines: [
				"*muffled* Gulck! Nng, %mcName%...  I'm doing things with you my husband doesn't even know exist...",
				"Mmmmhh, %mcName%!  He'd never dare, but you go right to the edge..."
			] },
			{ when: npc => setup.companions.has(npc), chance: 35, lines: [
				"*muffled* Nng, %mcName%...  Out in the wastes you push every limit.  In here you push mine.",
				"Mmmmhh, %mcName%!  You never ask for less than everything out there — good thing I can give it in here too..."
			] },
			{ lines: [
				"*muffled* Nng, you feeb so goob im my froat, %mcName%...",
				"Mmmmhh, I love taking the whole thing, %mcName%!",
				"Nnghh, yes, pull my hair while you fill my throat, %mcName%!",
				"*unintelligible* Gulck! Mmmphh! Nngh! *gasp!* That's so deep, %mcName%..."
			] }
		],

		kissing: [
			{ when: npc => setup.sexReactions.wife(npc, 40), lines: [
				"*sigh* %McName%...  My husband kisses me like I'm the only thing in the world.",
				"Mmmm, %mcName%...  I love you, every time we kiss I'm reminded of that.",
				"*moaning softly* %McName%...  I love belonging to you...",
				"Mmmmhh, %mcName%...  I could kiss you forever and never get tired of it.",
				"*melting into you* %McName%...  You make me feel so safe..."
			] },
			{ when: npc => npc.family?.husband && npc.family?.husband !== 'mc', chance: 40, lines: [
				"*whispering* %McName%...  I shouldn't be kissing you like this...",
				"Mmmm, %mcName%...  His kisses never felt like yours do...",
				"*melting against you* %McName%... Kissing you makes me feel like I belong...",
				"*moaning softly* %McName%...  I feel passion in your lips that I can never find at home...",
				"Mmmmhh, %mcName%...  I know it's wrong, but I don't want to stop...",
				"*pulling away slightly* ...I'm sorry...  *leaning back in* ...no I'm not."
			] },
			{ when: npc => setup.companions.has(npc), chance: 35, lines: [
				"*softly* Out there you're the person I trust most.  In here...  *kissing you again* ...I think that's still true, %mcName%.",
				"Mmmm, %mcName%...  We can never get this close out there.  I feel safe with you...",
				"*pulling you closer* The wasteland doesn't get everything.  Some things are just ours."
			] },
			{ when: npc => npc.location === 'mistress', chance: 35, branches: [
				{ when: npc => (npc.sub ?? 0) < 20, lines: [
					"*pulling back slightly* Your Mistress decides when she's kissed, %mcName%...  *leaning back in*  ...and right now she decides yes.",
					"Mmmhh...  *quietly*  I allow this...  *against your lips*  ...don't forget that it is an allowance.",
					"*with a small smile* You are the only one in this dungeon who gets this from me, %mcName%...  consider that a title of its own.",
					"Ahh...  *softly*  I command everything down there with this mouth...  *quietly*  ...and right now I want to do this instead.",
					"*gripping your collar lightly* Your Mistress will kiss you now, %mcName%...  *leaning in slowly*  ...pay attention."
				] },
				{ when: npc => (npc.sub ?? 0) <= 50, lines: [
					"Mmmhh...  *pulling back an inch*  I don't do this, %mcName%...  *leaning back in*  ...except with you.  Don't ask why.",
					"*quietly* I give commands with this mouth all day...  *against your lips*  ...right now I'd rather do this.",
					"Ahh...  The leather and the whip and the iron fist...  *softly*  ...and then you walk in and all of that goes quiet.",
					"*almost reluctant*  You're the only one in this dungeon I'd let this close, %mcName%...  *kissing you again*  ...make it count.",
					"Mmmhh...  *pulling you closer*  Nobody downstairs would believe it...  *quietly*  ...and nobody will know."
				] },
				{ lines: [
					"Mmmhh...  *sighing softly*  I am yours, %mcName%...  completely...  kiss me as long as you want.",
					"*quietly* The iron I carry in that dungeon...  *against your lips*  ...it dissolves the moment you touch me.  I don't mind.",
					"Ahh...  *leaning into you*  Everything I am belongs to you, %mcName%...  my power, my loyalty...  this too.",
					"*softly* Take your time, %mcName%...  I am not going anywhere...  I am exactly where I want to be.",
					"Mmmhh...  *pulling you closer*  My Master...  *quietly*  ...this is the only command I ever want from you."
				] }
			] },
			{ when: npc => npc.location === 'streets', chance: 35, lines: [
				"*shivering* Mmmhh, %mcName%...  You know you're the only one who gets to kiss me like that..",
				"Mmmhh...  I love kissing you, %mcName%...  It makes me forget I'm working...",
				"*giggling* Careful, %mcName%, someone might think we're a couple..."
			] },
			{ when: npc => npc.location === 'strip_club', chance: 35, lines: [
				"*shivering* Mmmhh, %mcName%...  You know you're the only one who gets to kiss me like that..",
				"Mmmhh...  I love kissing you, %mcName%...  It makes me forget I'm working...",
				"*giggling* Careful, %mcName%, someone might think we're a couple..."
			] },
			{ when: npc => npc.location === 'nightclub', chance: 70, lines: [
				"Mmmhh...  *pulling back slightly*  I came for the music, %mcName%...  and you somehow ended up being the best part.",
				"*breathless* You taste like the drink you bought me...  I want more, %mcName%...",
				"*leaning back in* The bass, the crowd, and this...  *against your lips*  everything feels right.",
				"Ahh...  I found you on the dance floor an hour ago, %mcName%...  *quietly*  I'm very glad I did.",
				"Mmm...  *whispering*  This is completely reckless...  I'm kissing a stranger in a nightclub bathroom...  *smiling*  worth it."
			] },
			{ when: npc => npc.location === 'milk_barn', chance: 35, lines: [
				"Mmmhh...  *straining softly toward you*  ...I can't pull you closer the way I want to...  *against your lips*  ...so don't you dare pull away...",
				"*breathlessly* You always find me...  *pressing into the kiss*  ...even here, like this...  *softly*  ...especially here, like this...",
				"Ohh, %mcName%...  *exhaling against you*  ...a stolen moment in the middle of all of this...  *quietly*  ...I needed this more than I realized...",
				"*softly* Everything else keeps going...  *leaning into you*  ...but this...  this makes it all feel like something else entirely...",
				"Mmmhh...  *unable to reach back*  ...it's cruel, not being able to hold you...  *pressing closer*  ...just stay right here, %mcName%..."
			] },
			{ when: (npc, V) => setup.sexReactions.relation(npc, V) !== null, chance: 45, branches: [
				{ when: (npc, V) => setup.sexReactions.relation(npc, V) === 'daughter', lines: [
					"*softly* Only you kiss me like this, %mcName%...  *against your lips*  ...the best goodnight kisses ever...",
					"Mmmm...  You feel like home, %mcName%...  *pulling you closer*  ...the only place I ever want to be...",
					"*breathing softly* You shouldn't make me feel like this, %mcName%...  *kissing you again*  ...I keep coming back anyway...",
					"There's love in this kiss...  *whispering*  ...the kind I'm not supposed to have for you...  *softly*  ...and I always want more of it...",
					"*against your lips* My own father...  *sigh*  ...and nobody else will ever make me feel the way you do, %mcName%..."
				] },
				{ when: (npc, V) => setup.sexReactions.relation(npc, V) === 'sister', lines: [
					"*quietly* Nobody knows me the way you do, %mcName%...  *against your lips*  ...and nobody kisses me the way you do either...",
					"Mmmm...  It's still love, %mcName%...  *kissing you slowly*  ...just more than it used to be...",
					"*softly* We share everything...  *whispering*  ...and I mean everything, %mcName%...",
					"*breathless* We always come back to this...  *kissing you again*  ...and I never want to stop...",
					"*pulling back slightly* We shouldn't...  *leaning back in*  ...we always do anyway, %mcName%..."
				] },
				{ lines: [
					"*softly* My son...  *against your lips*  ...the only one who kisses me like I matter completely...",
					"Mmmm...  I gave you everything from the start, %mcName%...  *kissing you slowly*  ...and I keep finding more to give...",
					"*breathing softly* I raised you with so much love, %mcName%...  *against your lips*  ...and it turns out some of it lives here...",
					"*trembling* My boy, grown into a man who knows exactly how to hold me...  *softly*  ...I'm not sorry, %mcName%...",
					"*pulling you close* This love was always ours, %mcName%...  *quietly*  ...it just found a new shape..."
				] }
			] },
			{ lines: [
				"Mmmmhhh, %mcName%...",
				"I love you, %mcName%.",
				"Mmmm, %mcName%, so sensual...",
				"Mmmh, %mcName%, your lips set me on fire...",
				"Mmmmh, %mcName%, I love kissing you...",
				"*moaning into your lips* Oh, %mcName%...",
				"I love your kisses so much, %mcName%..."
			] }
		],

		handjob: [
			{ when: npc => npc.location === 'gloryhole', chance: 35, lines: [
				"Mmm...  Just your cock through this hole, what a specimen, I could do this all day...",
				"*stroking* I'd know this manhood anywhere, %mcName%, even through a wall, so hard, so thick...",
				"Does that feel good through there, %mcName%?  I wish I could see your face right now...",
				"*squeezing gently* The way it twitches when I grip it...  beautiful..."
			] },
			{ lines: [
				"Does that feel good, %mcName%..?",
				"*bites her lip* Wow...You're so big, %mcName%. ",
				"Mmmh, so hard, and so thick, %mcName%, I can't get enough of this cock. ",
				"Ooh, he jumped.  I think he likes me, %mcName%. ",
				"What do you like better, %mcName%, when I squeeze the tip, or massage the balls..?",
				"Do you like it fast, %mcName%, or nice and slow..?",
				"This cock is special, %mcName%..."
			] }
		],

		pussy_lick: [
			{ when: npc => (npc.virgin ?? false), chance: 40, lines: [
				"Oooh, %mcName%, I love how good you can make me feel, while still saving myself...",
				"Do you like my flower, %mcName%? I keep it pure for you...",
				"That feels so good, %mcName%... Who needs a dick?",
				"Mmmmh, %mcName%.. You make me feel so pure and special..."
			] },
			{ when: npc => npc.location === 'kitchen', chance: 35, lines: [
				"Ahh, %mcName%!  I just love being on the menu!",
				"Mmmhh, %mcName%...  Show me how much you like my cooking...",
				"*gasping* I know you wanted a snack, %mcName%, but I had no idea...",
				"Ahh, %mcName%!  Taste me, devour me!"
			] },
			{ when: npc => npc.location === 'milk_barn', chance: 35, lines: [
				"Mmmhh, %mcName%...  *gasping*  ...I'm already trembling and now your mouth is right there...  *gripping the frame*  ...ohh...  don't stop...",
				"Ohh, %McName%  I can't move toward you, I can't pull you in...  *shaking*  ...please just don't stop...",
				"*breathless* Already aching, and now your tongue right there and...  *gasping*  ...I'm going to lose my mind in here...",
				"Mmmhh...  *quietly*  ...the whole long afternoon...  and then you come in and do that...  *shaking*  ...everything else just disappears...",
				"Ahh...  *gripping the frame above her*  ...I can only take what you give me...  *barely a whisper*  ...and what you're giving me is perfect, %mcName%..."
			] },
			{ lines: [
				"Are you enjoying my peach, %mcName%?",
				"%McName%, your tongue gives me the tingles....",
				"Ahh!  Ahh! Right there, %mcName%...",
				"Ooh, yes, %mcName%, your tongue feels amazing on my clit!",
				"Mmmmh, just like that, %mcName%.  You have the best tongue...",
				"Ahh, yes, %mcName%, wiggle your tongue like that.",
				"Do I taste good, %mcName%?"
			] }
		],

		sn: [
			{ chance: 50, use: "bj" },
			{ use: "pussy_lick" }
		],

		_fisting: [
			{ lines: [
				"Nnngh!  I can't believe you fit the whole thing, %mcName%!",
				"%McName%, that's a really tight fit....",
				"Ahh!  Ahh! So full, %mcName%...",
				"Now I feel like a puppet, %mcName%.."
			] }
		],

		anal_reverse: [
			{ when: npc => (npc.traits ?? []).includes('sadistic'), chance: 60, lines: [
				"Yeah, take it, %mcName%. Take it like a bitch!",
				"*Spank* Your ass is mine, %mcName%...",
				"*thrusting* You like it rough, %mcName%?  I'll make you beg...",
				"Mmm, tight!  Just the way I like it, %mcName%."
			] },
			{ when: npc => !npc.gender, lines: [
				"Do you like getting pegged, %mcName%?",
				"Mmm, you make me wish I had a real one, %mcName%...",
				"You like switching things up, %mcName%?"
			] },
			{ lines: [
				"Mmmh, you've got the best ass, %mcName%!",
				"Ahhh, your ass feels so good on my cock, %mcName%!",
				"Nngh, yes!  Squeeze my cock with your ass, %mcName%...",
				"Do you like how my cock feels inside you, %mcName%?",
				"Ahh, yes, %mcName%.  I love this ass!",
				"Mmm, ahhh, so warm, so tight, %mcName%.. I love how you feel inside..",
				"Mmmm... take it deeper, %mcName%..."
			] }
		],

		bj_reverse: [
			{ when: npc => (npc.traits ?? []).includes('sadistic'), chance: 60, lines: [
				"Yeah, suck it, %mcName%. Suck it like a bitch!",
				"Enough talking, %mcName%.  Use that mouth for what it's good for!",
				"Mmm, take it, %mcName%! Take it all the way down your throat...",
				"Mmmm, you look so good down on your knees, %mcName%.."
			] },
			{ when: npc => !npc.gender, lines: [
				"Get that toy nice and wet, %mcName%!",
				"Damn, this makes me wish I had a real one, %mcName%...",
				"You like that hard rubber in your mouth, %mcName%?"
			] },
			{ lines: [
				"Damn, you've got the best mouth skills, %mcName%!",
				"Yes, your lips feel so good on my cock, %mcName%!",
				"Mmm, yes!  Tease my cock with your tongue, %mcName%...",
				"Do you like how my cock tastes, %mcName%?",
				"Ahh, yes.  Right there on the tip, %mcName%... and now suck my balls...",
				"Mmm, %mcName%, does it feel good in your mouth?",
				"Mmmm... show me how deep you can take it, %mcName%..."
			] }
		],

		_ass_play: [
			{ when: npc => npc.location === 'gloryhole', chance: 35, lines: [
				"*wiggle* I can feel your hand reaching through to me, or is it me pushing back to you, either way...",
				"Mmm...  Reaching through the wall for me like that, %mcName%, I like where this is going...",
				"*gasping* From the other side of this wall, right there, yes..."
			] },
			{ when: npc => npc.location === 'massage', chance: 45, lines: [
				"Ahh, %mcName%!  I didn't think you were going to massage me there..",
				"Mmmhh, %mcName%...  You're making me squirm on the table...",
				"*gasping* This feels like an advanced technique, %mcName%...  And I love it."
			] },
			{ lines: [
				"Oh this feels naughty, %mcName%, but I like it...",
				"Oooh, %mcName%, getting playful back there.",
				"Mmmm, I like when you play with my ass, %mcName%.",
				"*ass wiggle* You like how that feels, %mcName%? Are you looking for more..?"
			] }
		],

		_cum_on_body: [
			{ when: npc => npc.location === 'gloryhole', chance: 35, lines: [
				"*gasping* You shot right through the hole, all over me, I leaned in just for that...",
				"Mmmhh...  Warm and all over me, %mcName%, I pressed up against this wall just for a moment like this...",
				"*wiping* I had to get close to this hole to get that, and it was absolutely worth it, %mcName%...",
				"*giggles* The things I do pressed up against a wall for you, %mcName%..."
			] },
			{ when: npc => npc.location === 'church', chance: 35, lines: [
				"*gasping* Warm...  all over me...  *softly* I receive this anointing with gratitude, %mcName%...",
				"Mmmhh...  *exhaling* Like a baptism.  I am marked.  I am blessed, %mcName%.",
				"*looking down at herself* You have consecrated me.  *quietly* I feel it.  Every drop a benediction.",
				"Ahh...  warm and covering me...  our rites speak of being washed by what is given freely...  *softly* I understand that now.",
				"*holding still* Don't wipe it away yet, %mcName%...  let me wear this blessing a little longer..."
			] },
			{ when: npc => npc.location === 'milk_barn', chance: 35, lines: [
				"*looking down, breathless* Mmmhh, %mcName%...  *softly*  ...warm all over me and I can't wipe it away, I can't even move...  *quietly*  ...I don't want to...",
				"Ahh...  *shaking slightly*  ...still held here, still aching, and now this too...  *exhaling*  ...you make me feel so completely undone...",
				"*softly* I'll wear this for the rest of my time here...  *looking up at you*  ...and think of nothing but this moment, %mcName%...",
				"Mmmhh...  *trembling, unable to move*  ...warm everywhere...  *quietly*  ...I want you to know I loved every second of it.",
				"*exhaling slowly* The barn goes on and I'm just...  *softly*  ...glowing...  *quietly*  ...thank you for coming to me here, %mcName%.",
				"*looking down with a soft laugh* The barn makes its cream every day...  *touching herself lightly*  ...and here's a batch I didn't expect...  *quietly*  ...this one's mine to keep.",
				"*amused, breathless* All day I give what my body makes...  *exhaling*  ...I love it when you give something back...  *softly*  ...I like this kind of trade.",
				"*quietly* I'm usually producing the milk...  *looking down, warmly*  ...and now I've got yours all over me...  *softly*  ...I'm not complaining at all.",
				"*softly* The finest cream this barn has seen all day...  *exhaling*  ...and I get to wear it...  *quietly*  ...leave it a while, %mcName%..."
			] },
			{ lines: [
				"Do I look pretty, %mcName%?",
				"Mmmmhh, it feels so nice and warm, %mcName%...",
				"Yes, %mcName%, paint me with your cum...",
				"Ooh, %mcName%, that feels so nice on my skin...",
				"Ohh, so much cum, %mcName%, you're such a stud.",
				"I think I'll need another shower after this, %mcName%.",
				"*giggles* It's all over me, %mcName%.  I guess you had a good time.",
				"I think you got some in my hair, %mcName%.",
				"Mmm, I hear this is very good for the skin, %mcName%.",
				"You've marked me %mcName%... I'm all yours..."
			] }
		],

		_cum_oral: [
			{ when: npc => npc.location === 'gloryhole', chance: 35, lines: [
				"*swallowing* Mmm...  I pressed my lips right to that hole, and you filled my mouth perfectly, %mcName%...",
				"Nghk, mmmf... *gulp*...  I can't see you but I can taste you, and you taste incredible...",
				"*licking lips* Not a drop wasted, I made sure of that, %mcName%...",
				"Mmmhh...  All of it, right through the hole, right into my mouth, perfect..."
			] },
			{ when: npc => npc.location === 'kitchen', chance: 35, lines: [
				"*swallowing* Mmmm, %mcName%!  Only the best cream for this chef...",
				"Mmmhh, %mcName%...  Nice of you to give the cook a treat...",
				"Mmmm, so nice, %mcName%...  You've been eating those berries I gave you...",
				"*licking the tip clean* Ahh, %mcName%, a good cook always cleans up after a meal..."
			] },
			{ when: npc => npc.location === 'church', chance: 35, lines: [
				"*swallowing slowly* Mmmhh...  Our sacrament is wine.  Yours is better, %mcName%.",
				"Nghk, mmmf...  *gulp*...  *quietly* This is my communion.  I receive it with a full and willing heart.",
				"*licking lips* Every drop received, %mcName%...  just as we are taught — waste nothing that is given in grace.",
				"Mmmhh...  *exhaling* The cup is offered and the cup is drunk.  *softly* Amen.",
				"*looking up* I have taken the sacrament many times, %mcName%...  this vintage is my favorite by far."
			] },
			{ when: npc => npc.location === 'milk_barn', chance: 35, lines: [
				"*swallowing, eyes closing* Mmmhh, %mcName%...  *softly*  ...warm and slow...  *exhaling*  ...I'd stay here all afternoon for that.",
				"*looking up at you* Ahh...  *quietly*  ...still aching, still here...  and then you gave me that...  *licking her lips*  ...it was worth everything.",
				"Mmmhh...  *savoring it*  ...still so sensitive...  and now this warmth...  *softly*  ...yours is sweeter than anything else in here, %mcName%.",
				"*exhaling slowly* Still here, still aching, and now that warmth...  *looking up*  ...I feel so satisfied, %mcName%.",
				"*licking her lips, quietly* Mmmhh...  *softly*  ...stay a little longer...  even just like this...  *exhaling*  ...I don't want you to go yet.",
				"*licking her lips slowly* We make milk in here all day...  *softly amused*  ...but yours is the only batch worth tasting, %mcName%.",
				"*swallowing with a quiet laugh* I'm something of an expert in milk quality...  *exhaling*  ...and I can tell you, yours is exceptional.",
				"*softly* The settlement gets everything I make in here...  *licking her lips*  ...but this batch...  *quietly*  ...this one I took for myself.",
				"*breathing slowly* The finest thing this barn has produced all day...  *looking up*  ...and it came from you...  *smiling softly*  ...no wonder you're the master..."
			] },
			{ lines: [
				"Mmmm.. you taste so good, %mcName%!",
				"Do you want me to swallow, %mcName%?",
				"Nghk, mmmf.. *gulp* Yummy...",
				"Mmmm.. yes, %mcName%, fill my mouth...",
				"Mmmmh, %mcName%, let me lick you clean...",
				"*opens mouth* Look, %mcName%. Now you see it. *swallows* Now you don't!",
				"*licking* Mmmm, %mcName%, I don't want to miss any...",
				"Yumm, %mcName%, I love tasting your cum...",
				"*swallows and giggles* Mmmm, no babies this time, %mcName%.",
				"Mmmm %mcName%, I love your cum..."
			] }
		],

		cum_in_ass: [
			{ when: npc => npc.location === 'gloryhole', chance: 35, lines: [
				"*gasping* Through the wall, deep inside me...  I can feel you throbbing, %mcName%...",
				"Mmmhh...  You filled my ass perfectly through this hole, %mcName%, I can feel every drop...",
				"*trembling* The wall between us doesn't stop me from feeling every pulse, %mcName%..."
			] },
			{ lines: [
				"*gasps* You came so deep inside me, %mcName%!",
				"Mmmmhh, it feels so warm inside my ass %mcName%...",
				"Ahh, I feel your cock throbbing inside me, %mcName%...",
				"Oooh, I feel you cumming so hard in my ass, %mcName%!",
				"Ahh, yes, %mcName%, your cum feels so good filling my ass.",
				"Oh! Mmmm, %mcName%, so much cum, so deep in my belly...",
				"Ahh, Ooh! Cumming so hard, %mcName%.  Somebody really likes my ass.",
				"Mmmmh, %mcName%, I love the feeling of your cum in my ass...",
				"Mmm, %mcName%, I love feeling your cock throb against my ring.",
				"Oh %mcName%, I feel it throbbing inside me..."
			] }
		],

		grind: [
			{ when: npc => (npc.virgin ?? false), chance: 60, lines: [
				"Mmmhh, %mcName%...  I love how close we get like this...  just not all the way...",
				"*catching her breath* Oh...  %mcName%...  You feel so good against me, right there...",
				"Ahh, %mcName%...  So close...  *exhaling*  ...I like that we stop here...",
				"Mmmm, %mcName%...  You're so hard against me...  this feels amazing without...  you know.",
				"*whispering* You could just...  *gasping*  ...no, like this is perfect, %mcName%..."
			] },
			{ when: npc => setup.sexReactions.wife(npc, 30), lines: [
				"Mmmhh, %mcName%...  I love when you tease me like this...  my husband knows exactly what he's doing.",
				"*sighing* You're so hard against my pussy, %mcName%...  Just slide in, you know I want you to...",
				"Ahh, %mcName%...  My husband torturing me with his cock...  I love it...",
				"*grinding back* Mmmhh, %mcName%...  You're going to make me beg, aren't you..."
			] },
			{ when: npc => (npc.family?.husband && npc.family?.husband !== 'mc'), chance: 40, lines: [
				"*gasping* He never teases me like this, %mcName%...  You're already making me wetter than he ever does...",
				"Mmmhh, %mcName%...  Rubbing against me like that...  *quietly*  ...this is already better than anything he does...",
				"*biting her lip* I shouldn't want to pull you inside...  *exhaling*  ...but I do, %mcName%..."
			] },
			{ when: npc => (npc.pregnancy ?? 0) >= 8, chance: 40, lines: [
				"*exhaling* Mmmhh, %mcName%...  I love this right now...  gentle and close...",
				"Ahh, %mcName%...  You feel so warm against me...  this is perfect for how I am right now.",
				"*softly* Yes, %mcName%...  Just like that...  your body against mine..."
			] },
			{ lines: [
				"Mmmhh, %mcName%...  I can feel how hard you are against my pussy...  it's driving me crazy.",
				"Ahh, %mcName%!  You're rubbing right where I want you...  please don't stop.",
				"*gasping* You're so warm against me, %mcName%...  Just a little further and you'd be inside me...",
				"Mmmm, %mcName%...  The way you grind against me...  I can feel every inch of you...",
				"*hips rolling* Ahh, %mcName%...  Don't tease me like this...  *exhaling*  ...actually, don't stop...",
				"*whimpering* Mmmhh, %mcName%...  You feel so good right there...  I'm so wet already...",
				"*gripping you* Ahh, %mcName%...  You're right there...  right against me...  you're making me shake...",
				"Ohhh, %mcName%...  *rolling her hips*  ...this is torture...  the best kind of torture..."
			] }
		],

		grind_cum: [
			{ when: npc => (npc.virgin ?? false), chance: 60, lines: [
				"*exhaling slowly* Mmmhh, %mcName%...  Warm on my stomach...  I like that you kept your promise.",
				"Ahh, %mcName%...  *looking down*  I can feel how much you wanted to go further...",
				"*softly* Mmmm, %mcName%...  That's so warm...  thank you for stopping here.",
				"*catching her breath* Ohh, %mcName%...  You're so hot against me...  *quietly*  ...this was enough."
			] },
			{ when: npc => setup.sexReactions.wife(npc, 35), lines: [
				"*gasping* Mmmhh, %mcName%...  All that teasing and then this...  you drive me crazy.",
				"Ahh, %mcName%!  *looking down*  Look what you did to me, my husband...",
				"*sighing happily* Mmmm, %mcName%...  So warm on my skin...  I love every bit of you."
			] },
			{ lines: [
				"*gasping* Mmmhh, %mcName%...  So warm...  *looking down*  You were right there and you still pulled back...",
				"Ahh, %mcName%!  *exhaling*  I felt every second of that...  the heat of you against me, and then this...",
				"*shivering* Ohhh, %mcName%...  Your cum on my stomach...  *quietly*  ...you had me so close already.",
				"Mmmhh, %mcName%...  *running a finger through it*  ...so much...  all that just from grinding against me?",
				"*catching her breath* Ahh, %mcName%...  Warm on my skin...  I love when you lose control like that.",
				"*softly* Mmmm, %mcName%...  I can feel the heat of it...  *exhaling*  ...you were right at my entrance the whole time..."
			] }
		],

		generic: [
			{ lines: [
				"That feels so good, %mcName%!",
				"Don't stop, %mcName%.  Just like that!",
				"Oh yes, %mcName%!  More...",
				"Yes, right there, %mcName%. I love that...",
				"Mmmh, %mcName%, that feels so good.",
				"Yes! Ahh! Keep going, %mcName%!",
				"Oh I like that, %mcName%.",
				"*panting* Ohhh, %mcName%...",
				"*moaning* Mmmm, %mcName%, don't ever stop...",
				"Mmmmhh... %mcName%..."
			] }
		]
	}
};
