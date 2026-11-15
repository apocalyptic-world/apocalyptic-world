/* setup.npc part: random Talk lines. getSayDialog for household NPCs (pools by state, traits and sex experience,
   filtered by attraction to the MC), getCharDialog for named characters. setup.npc is spread over js/npc/*.js. */
Object.assign(setup.npc ??= {}, {
	getSayDialog: function(npc) {
		const db = {
			survival: [
				"Every day is a fight. Some of us are just better at hiding it.",
				"Food. Water. Ammo. That's all that matters now."
			],
			emotional_positive: [
				"You give me hope... and that's rare.",
				"I didn't think I could smile again until I met you."
			],
			emotional_negative: [
				"Don't ask me how I'm doing. You already know the answer.",
				"It's easier not to feel anything at all."
			],
			philosophical: [
				"What even is 'humanity' anymore? Is it worth saving?",
				"I wonder if we were always doomed. The end just came quicker than expected."
			],
			sadistic: [
				"You should see their faces when they realize I'm not here to help.",
				"Screams echo beautifully, don't they?"
			],
			masochist: [
				"Pain is my therapy now.",
				"Bruises fade too fast. I almost miss them when they're gone.",
				"The sting is the only thing that reminds me I'm still here."
			],
			// added with masochist; aimed at the MC
			masochist_mc: [
				"Hurt me again. Make me feel like I still exist.",
				"Leave marks this time, %mcName%. I want to see them in the morning.",
				"Don't be gentle with me, %mcName%. Gentle never did anything for me."
			],
			affectionate: [
				"I feel safest when you're near. Don't go, %mcName%",
				"I saved you the last of the coffee, %mcName%. Don't tell the others.",
				"When you're out scavenging, I can't sleep until I hear you come back."
			],
			// added with affectionate; aimed at the MC
			affectionate_mc: [
				"You don't know how much I needed this… us.",
				"Stay with me tonight, %mcName%. Just... stay.",
				"I keep thinking about your hands on me. I hope that's not too much to admit."
			],
			hungry: [
				"I'm so damn hungry I could eat a dead rad-dog.",
				"I'd kill for a sandwich. Literally.",
				"My stomach's been growling so loud I thought it was the wolves.",
				"I caught myself eyeing the boot leather earlier. That's where I'm at.",
				"If someone doesn't feed me soon, %mcName%, I'm going to start chewing the furniture.",
				"I dreamed about bread last night. Just bread. I woke up angry."
			],
			horny_low: [
				"It's been a while… I could use a distraction.",
				"I've got urges I can't just ignore, you know?",
				"Nights out here are long. Too long to spend alone.",
				"I keep catching myself staring at people. It's getting embarrassing.",
				"Cold water doesn't help with this one. Believe me, I've tried.",
				"Funny how the end of the world didn't take the itch away."
			],
			horny_high: [
				"If you don't take me right now, I might explode.",
				"Let's not pretend this tension doesn't exist.",
				"Every time you walk past me, %mcName%, I forget what I was doing.",
				"Find us a door that locks, %mcName%. I'll take care of the rest.",
				"I can't think straight around you today, %mcName%. Do something about it.",
				"Skip the small talk, %mcName%. You know exactly what I need."
			],
			drunk: [
				"The world's a blur. Makes it easier to forget.",
				"Another drink? Sure. What's the worst that can happen?",
				"Is the floor moving, or is it just me? ...It's just me, isn't it.",
				"I love everyone right now. Even you, %mcName%. Especially you. Wait, what was I saying?",
				"This stuff tastes like gasoline. Pour me another.",
				"Don't let me near the stairs tonight, %mcName%. I mean it."
			],
			corrupted: [
				"I stopped pretending to care about 'good' a long time ago.",
				"Morality is for the dead. The rest of us just adapt."
			],
			mechanical: [
				"Fixed the generator again. I swear, it's held together with duct tape and hope.",
				"If I had proper tools, I could do wonders..."
			],
			fighter: [
				"The best part of a fight? That split-second when you know you've won.",
				"Violence is a language everyone understands."
			],
			cook: [
				"I made stew out of god knows what. But it tastes... edible.",
				"I miss real food. You know, not rat jerky and canned beans."
			],
			// not attracted to the MC (or not free to be), but submissive enough to go along
			submissive: [
				"You're not who I'd choose. But if you want me, I won't say no.",
				"Tell me what you want, %mcName%. I'll do it.",
				"You don't have to ask nicely, %mcName%. Just tell me.",
				"I don't need to want it. You want it, and that's enough.",
				"If that's what you want from me tonight, %mcName%, then fine.",
				"I'll do as I'm told, %mcName%. That's how it works between us."
			],

			// SEX STATS-BASED DIALOG
			sex_innocent: [
				"I've only done it a few times... is that bad?",
				"Sometimes I wonder if I'm still the same person after my first time."
			],
			sex_experienced: [
				"I've done more than I care to admit... but it kept me alive.",
				"Sex isn't new to me, it's just part of the game now."
			],
			// lewd lines by anatomy: vagina (women, trans men) or penis and anus (men, trans women); not about the MC
			// (lines about sex with the MC are in MC_MEMORIES below)
			sex_lewd_female: [
				"I'm dripping just thinking about it again...",
				"I used to blush at this stuff. Now I lose count of how many times I come in a week.",
				"Still sore from last night, and I'd go again right now if someone asked."
			],
			sex_lewd_male_trans: [
				"I get hard just thinking about last time...",
				"Last night left me sore in all the right places. I'd do it again.",
				"I've stopped pretending I don't want it. I want it all the time now."
			],
			// added with either lewd category above; all aimed at the MC
			sex_lewd_generic: [
				"Use me %mcName%. Ruin me. I live for that.",
				"Whenever you want me, %mcName%, however you want me. Just say the word.",
				"Bend me over anything you like, %mcName%. I won't complain.",
				"Mark me as yours, %mcName%, so everyone knows who I belong to.",
				"I don't care who hears us, %mcName%. Let them listen.",
				"Whatever you have in mind tonight, %mcName%, the answer is yes.",
				"Breed me again %mcName%... I need it."
			],
			sex_jaded: [
				"It doesn't mean anything to me anymore. Just another motion.",
				"I've stopped pretending I feel anything from it now."
			],
			family_child: [
				"I still remember when I used to fall asleep on your lap...",
				"You were always the one keeping me safe. I never said it back then, but thank you.",
				"Sometimes I wonder if things would be different if we never left home.",

				"You say you protected me, but look where we are now.",
				"I didn't ask to be born into this. You made choices, and I live with them.",
				"Do you even remember what it means to be a parent anymore?",

				"What were you like before everything fell apart? Were you different?",
				"Do you think I'd still be me if the world had stayed normal?",
				"Do you ever wish I hadn't been born into all this chaos?",

				"No matter what happens, I'm glad I have you. Really.",
				"I feel safe when you're nearby. I know I shouldn't admit it, but I do.",
				"You're not perfect, but you're all I have. And I need you.",

				"I learned to fight because I had to. Not because I wanted to.",
				"Softness gets you killed. You taught me that, remember?",
				"I don't have time to be a kid anymore, we both know that.",

				"Sometimes I feel like I've lost who I was. Do you even see me the same?",
				"Things have changed between us... and not always for the better.",
				"The choices we made... some lines can't be uncrossed, right?",

				"People underestimate me because I smile. That's their mistake.",
				"I'm not just your child. I'm my own person too, even if the world forgets that.",
				"I act confident so no one sees the cracks. But you see them, don't you?",

				"%mcNameUC%, remember when you tried to teach me how to fix that old generator? You were terrible at it.",
				"You always said I'd be stronger than you someday. I think that day came."
			],
			family_child_potion: [
				"You say you protected me, but look where we are now.",
				"I didn't ask to be born into this. You made choices, and I live with them.",
				"Do you even remember what it means to be a parent anymore?",

				"Do you ever wish I hadn't been born into all this chaos?",

				"No matter what happens, I'm glad I have you. Really.",
				"I feel safe when you're nearby. I know I shouldn't admit it, but I do.",
				"You're not perfect, but you're all I have. And I need you.",

				"I learned to fight because I had to. Not because I wanted to.",
				"I don't have time to be a kid anymore, we both know that.",

				"Sometimes I feel like I've lost who I was. Do you even see me the same?",
				"Things have changed between us... and not always for the better.",
				"The choices we made... some lines can't be uncrossed, right?",

				"People underestimate me because I smile. That's their mistake.",
				"I'm not just your child. I'm my own person too, even if the world forgets that.",
				"I act confident so no one sees the cracks. But you see them, don't you?",

				"It's strange, existing like this. One moment nothing, the next... all of this.",
				"I have your eyes, apparently. I noticed that in the mirror. I don't know how to feel about it.",
				"I know what I am. But I don't know who I am yet. Give me time.",
				"Don't expect me to pretend I have memories I don't. We both know how this happened.",
				"I don't have a past. Just this. Whatever this is."
			]
		}

		// Lines about sex the NPC had with the MC, by the part used. A memory is active when any of its metrics has at
		// least one act with the MC (setup.sexActs.countWithMc); acts with anyone else never count. To add lines about
		// another part, add a memory with its metrics (setup.sexActs metric names).
		const MC_MEMORIES = {
			pussy: {
				metrics: ['receivedPussyFucked', 'receivedDoublePenetrationVagina', 'receivedDoublePenetrationAssVagina'],
				lines: [
					"My pussy still remembers you, %mcName%. Don't keep me waiting too long.",
					"I touch myself thinking about the way you fucked me, %mcName%.",
					"I've been empty since last time, %mcName%. Come fill me up again."
				]
			},
			ass: {
				metrics: ['receivedAssFucked', 'receivedDoublePenetrationAss', 'receivedDoublePenetrationAssVagina'],
				lines: [
					"I can't stop thinking about you filling my ass again, %mcName%.",
					"My ass is yours whenever you want it, %mcName%.",
					"I was still walking funny the day after, %mcName%. Do it again."
				]
			}
		};

		let pool = [];

		const { corruption, happy, drunk, food, horny, relationship, location } = npc;
		// NPCs built by hand (runtime scripts, packs) can lack these; defaults are local, npc is not changed
		const traits = npc.traits ?? [];
		const skills = npc.skills ?? [];
		const personality = npc.personality ?? [];

		// "You give me hope…" / "Don't ask me how I'm doing…" are said to the MC by someone living with him by choice:
		// only guests (not slaves, nursery children, characters or strangers)
		const isGuest = npc.id != null && (variables().guests ?? []).some(guest => guest.id === npc.id);
		if (isGuest && happy > 40) pool.push(...db.emotional_positive);
		else if (isGuest && happy < -20) pool.push(...db.emotional_negative);

		if (corruption > 80) pool.push(...db.corrupted);
		if (drunk > 70) pool.push(...db.drunk);
		if (food < 3) pool.push(...db.hungry);

		if (horny >= 60) pool.push(...db.horny_high);
		else if (horny >= 20) pool.push(...db.horny_low);

		if (traits.includes("sadistic")) pool.push(...db.sadistic);
		if (traits.includes("masochist")) pool.push(...db.masochist, ...db.masochist_mc);
		if (relationship > 70 || traits.includes("breeder") || personality.includes("extravagant"))
			pool.push(...db.affectionate, ...db.affectionate_mc);

		if (location === "bedroom" && relationship > 60) pool.push(...db.affectionate, ...db.affectionate_mc);

		if (skills.includes("mechanic")) pool.push(...db.mechanical);
		if (skills.includes("fighter")) pool.push(...db.fighter);
		if (skills.includes("cook")) pool.push(...db.cook);

		if (npc.family && npc.family.father === "mc") {
			if (npc.grownByPotion) {
				pool.push(...db.family_child_potion);
			} else {
				const emotionalScore = (npc.happy ?? 0) - (npc.corruption ?? 0);
				const reflective = emotionalScore > 30;
				const jaded = emotionalScore < -10;

				if (reflective) {
					pool.push(...db.family_child.filter(line => line.includes("remember") || line.includes("glad")));
				} else if (jaded) {
					pool.push(...db.family_child.filter(line => line.includes("resent") || line.includes("lines")));
				} else {
					pool.push(...db.family_child);
				}
			}
		}

		// === Sex experience (setup.sexActs: acts with anyone, the MC included) ===
		if (setup.sexActs.hasAny(npc)) {
			const count = metric => setup.sexActs.count(npc, metric);
			const bj = count('givenBlowJob'), pussy = count('receivedPussyFucked'), anal = count('receivedAssFucked');
			const dp = count('givenDeepThroatCock');   // deepthroat
			const creampies = count('receivedVaginalCreampie');
			const totalActs = bj + pussy + anal + dp;

			if (totalActs <= 3) pool.push(...db.sex_innocent);
			else if (totalActs >= 10 && totalActs <= 30) pool.push(...db.sex_experienced);

			if (corruption >= 50) {
				// by anatomy: vagina for women (0) and trans men (3); penis and anus for men (1) and trans women (2)
				const hasVagina = setup.sexActs.hasPussy(npc);
				// penis and anus: penetrative sex in either direction (fucked in the ass, fucked an ass or a pussy)
				const penetrations = anal + count('givenFuckAss') + count('givenFuckPussy');
				const lewd = hasVagina
					? (creampies > 5 || bj >= 15 || pussy >= 10)
					: (bj >= 15 || penetrations >= 10);
				if (lewd) {
					pool.push(...(hasVagina ? db.sex_lewd_female : db.sex_lewd_male_trans));
					pool.push(...db.sex_lewd_generic);
				}
			}

			if (totalActs >= 30 && happy < -10)
				pool.push(...db.sex_jaded);
		}

		// One line from one active memory, so an NPC who did many things with the MC doesn't only talk about sex
		if (corruption >= 50) {
			const memories = Object.values(MC_MEMORIES)
				.filter(memory => memory.metrics.some(metric => setup.sexActs.countWithMc(npc, metric) >= 1));
			if (memories.length > 0) {
				const memory = memories[Math.floor(Math.random() * memories.length)];
				pool.push(memory.lines[Math.floor(Math.random() * memory.lines.length)]);
			}
		}

		// Lines where the NPC wants the MC only make sense if they would actually agree (setup.npcs.mcAttraction).
		// Someone not attracted but submissive enough gets lines of compliance instead.
		const toMc = new Set([
			...db.horny_high,
			...db.affectionate_mc,
			...db.masochist_mc,
			...Object.values(MC_MEMORIES).flatMap(memory => memory.lines),
			...db.sex_lewd_generic
		]);
		const willing = setup.getAge(npc) < 18 ? 'no' : setup.npcs.mcAttraction(npc).willing;
		if (willing !== 'desire' && pool.some(line => toMc.has(line))) {
			pool = pool.filter(line => !toMc.has(line));
			if (willing === 'submission') pool.push(...db.submissive);
		}

		if (pool.length < 3) pool.push(...db.philosophical);
		pool.push(...db.survival);

		const unique = [...new Set(pool)];
		return unique[Math.floor(Math.random() * unique.length)]
			.replace(/%mcNameUC%/g, setup.npc.mcName(npc, true))
    		.replace(/%mcName%/g, setup.npc.mcName(npc, false));
	},

	getCharDialog: function(npc, charKey) {
		const db = {
			blair: [
				"You keep finding excuses to talk to me, %mcName%. I'm not complaining.",
				"Don't give me that look unless you mean it. Actually... go ahead, give me that look.",
				"I made dinner, %mcName%. You should eat, then maybe I'll let you work off the calories.",
				"This place wouldn't survive a week without me and you know it.",
				"I catch you staring more than you think. It's cute.",
				"Careful, %mcName%. Spend enough time around me and you might start to enjoy it.",
				"%mcNameUC%, I've been stuck inside all day. Someone should make it worth my while.",
				"You're predictable in the best way, %mcName%. I always know exactly what you want.",
				"Go on, %mcName%, say something charming. I'll pretend to be surprised.",
				"I stopped by dad's farm yesterday. The fields are looking better than they have in years. I think those new seeds are actually working.",
				"Dad asked about you when I was at the farm. I told him you were keeping busy. He seemed satisfied with that.",
				"There's something grounding about going back to the farm. All that open land. Then I come back here and remember what we've built.",
				"Dad's still stubborn about doing everything himself, but the harvest this season gave him something to smile about.",
				"How much have we built in this season alone? The settlement is starting to feel like an actual community.",
				"I'm proud of what this place has become. Not many people get to say they were part of something that is actually working."
			],
			elsa: [
				"I tried fixing that latch on the shed door. I think I made it worse.",
				"I still wake up reaching for a weapon sometimes. Old habits.",
				"%mcNameUC%, the generator was making a noise earlier. I wasn't sure if I should touch it.",
				"Thank you for letting me stay, %mcName%. I know I haven't earned it yet.",
				"Some days the quiet feels safe. Other days it just feels like something's about to break it.",
				"%mcNameUC%, I keep meaning to ask if there's anything more useful I could be doing around here.",
				"I don't remember the last time I felt this settled, %mcName%. Is that strange?",
				"I was never good with people, but the machines here make sense to me.",
				"Before everything fell apart, I thought survival would feel different. More dramatic, maybe.",
				"I miss the cabin sometimes. The stillness of it. But stillness and safety aren't the same thing, and I know that now.",
				"I had a whole system back there, where everything lived, how I moved through the day. Starting over is harder than I expected.",
				"The woods were mine in a way this place isn't yet. But I think it could be, eventually.",
				"I keep almost mentioning the cabin like it's somewhere I can still go back to. Then I remember.",
				"There's more noise here than I'm used to. More people. I think I might actually be getting used to it."
			],
			eve_always: [
				"There's a passage about the body being a temple. I think I finally understand it, just not the way I was meant to.",
				"I was taught that wanting was a kind of weakness. I'm less convinced of that now, %mcName%.",
				"The settlement protects us. I try not to think too hard about the cost.",
				"Survival means compromise, %mcName%. I learned that before the world ended."
			],
			eve_rodger_alive: [
				"Rodger prays for all of us. Sometimes I wonder who prays for Rodger.",
				"I choose my words carefully here, %mcName%. Not because I'm afraid, because it matters.",
				"There are things I want that I've stopped letting myself name.",
				"I'm fine. That's what I say, and eventually it becomes true.",
				"Don't look at me like that, %mcName%. That kind of thing gets people hurt.",
				"I've built a life here. It's just not entirely the one I'd have chosen.",
				"Faith is useful. It keeps people calm. I understand why Rodger values it."
			],
			eve_rodger_dead: [
				"I spent years praying to feel less. I'm starting to think that was the wrong prayer.",
				"I still believe in something, %mcName%. I'm just no longer certain it asks me to be ashamed.",
				"I used to plan every word before I spoke it. With you, %mcName%, I forget to.",
				"I woke up this morning and realized I hadn't braced myself for the day. That's new.",
				"I was careful for so long that I forgot what it felt like to want something without a plan.",
				"He gave me safety. You give me something I don't have a name for yet. I think I prefer the nameless thing.",
				"I'm not the same person who made all those careful choices. I'm not sorry about that, %mcName%.",
				"I keep waiting to feel guilty, %mcName%. Mostly I just feel awake.",
				"There are things I would have called sin that feel like the most honest parts of me now.",
				"I didn't expect to find myself at the pulpit. But the flock needed someone, and I was there.",
				"Some mornings I stand in that church and feel the weight of everyone who comes through the door. It's a heavier kind of faith than what I was taught.",
				"They come to me with grief and hunger and fear, and I give them what I can. I'm not sure it's ever enough.",
				"The church is mine now in ways it never was before. I'm still learning what that means.",
				"I lead the prayers, but I'm still working through my own. Maybe that's what makes it honest, %mcName%."
			],
			isabel_always: [
				"I used to collect things I found beautiful. I've had to be more selective lately.",
				"There's a difference between being kept and being caged, %mcName%. I've lived in both.",
				"I'm more than what's been done to me, %mcName%. I just have to keep reminding myself of that.",
				"Even here, even like this, there's still beauty worth looking for."
			],
			isabel_dom_alive: [
				"Dom thinks owning me is the same as knowing me. He's wrong on both counts.",
				"Every day is a negotiation, %mcName%. I've gotten good at knowing what to offer.",
				"I think about what I'd do with real freedom sometimes, %mcName%. It's a dangerous habit.",
				"You look at me differently than he does, %mcName%. I notice everything."
			],
			isabel_dom_dead: [
				"%mcNameUC%, I know what it looks like when someone holds power through fear. I'm choosing a different way.",
				"I've been thinking about how to run this city, not the way he did, but the way it deserves.",
				"For the first time, I'm making decisions for people instead of having them made for me.",
				"I used to survive by understanding what people in power wanted. Now I'm learning what people without it need.",
				"Everything he built here, I'm rebuilding. Not the same, %mcName%, better.",
				"The city is mine now, %mcName%, in a way that doesn't make my skin crawl. That still surprises me."
			],
			laura: [
				"The last experiment went better than expected. Mostly.",
				"Pain is just information. The patient always forgets that in the moment.",
				"I've been perfecting a compound that should accelerate tissue repair. The side effects are negotiable, %mcName%.",
				"Most people flinch. I take that as a professional compliment.",
				"The body is just a machine, a beautiful, poorly designed machine.",
				"Come back when you have a medical question, %mcName%. Or a willing volunteer.",
				"%mcNameUC%, I've been awake for thirty-six hours. Everything is going fine.",
				"Proper surgical tools would be ideal. But you work with what you have.",
				"People call it unethical. I call it progress without bureaucracy.",
				"So much of what I've accomplished here wouldn't exist without your resources, %mcName%. I don't forget that.",
				"My work here has opened lines of research I'd completely written off. I'm glad we found each other.",
				"In the city I'd be pulling teeth with a pair of pliers and calling it medicine. What we have here is different. You made that possible.",
				"I've had breakthroughs in the last few months that I spent years chasing before. I couldn't have done that if you hadn't provided all of this."
			],
			vincent: [
				"Checked the perimeter this morning. Nothing new, that's either good news or it means they're being careful.",
				"I've survived worse odds. Doesn't mean I recommend them.",
				"Brought back some intel from the road. Buy me a drink first.",
				"I don't trust easy. But I trust what I can verify.",
				"You need eyes out there. I can be that, just keep the supplies coming.",
				"Most of the fights I've been in started because someone forgot to scout ahead.",
				"Sleep light. That's kept me alive longer than any weapon.",
				"I've seen settlements fall for smaller reasons than the ones you're worried about.",
				"There's a route out east that hasn't been picked over yet. We should move on it soon."
			],
			rodger: [
				"God does not abandon those who believe. Even here. Especially here.",
				"Our walls stand because He wills it. Our harvests feed us because He wills it.",
				"I have seen miracles, friend. This settlement is one of them.",
				"Doubt is the enemy's voice. I pray you recognize it for what it is.",
				"Every day of suffering is a day of character. We must be grateful.",
				"I have spoken to the Lord. He has plans for this place, for all of us.",
				"Faith is not weakness. It is the only armor that never rusts.",
				"We endure because we are meant to endure. That is not hope. That is certainty."
			],
			dom: [
				"I don't explain myself. I don't need to.",
				"Debts have a way of coming due. I'm patient.",
				"What I own, I keep. What I'm owed, I collect.",
				"You've been making decisions that affect my interests. I'd think carefully about that.",
				"This world runs on power. Everything else is just a story people tell themselves.",
				"I'm not angry. Anger's for people who aren't in control.",
				"You should be more careful about who's watching you.",
				"I always get what I came for. Always."
			],
			octavia: [
				"My people survived three winters without walls. We know how to endure.",
				"I read the tracks before I step where they lead. That's not caution, that's sense.",
				"The Blackthorn moves without sound. Worth remembering, %mcName%.",
				"I've seen what happens to those who underestimate the land, %mcName%. It's not fast.",
				"Trust must be earned on both sides of the door.",
				"%mcNameUC%, I don't speak unless I have something worth saying. You'd do well to listen.",
				"Out here, silence is a skill. Most people from settlements never learn it.",
				"Every scar on this land tells a story, %mcName%. I've been reading them for years.",
				"Within these walls is the last of my tribe. I say that plainly, because softening it doesn't change what it means.",
				"My tribe's songs die with me unless I teach them to someone. Some nights that weighs more than I can carry.",
				"I have thought about what it would mean to begin again, a new generation carrying the old blood. With you, that does not feel entirely impossible.",
				"My people were not just a family. They were a way of seeing the world. Perhaps you and I could build something that carries it forward."
			],
			harper: [
				"Nothing's free and everything's for sale. You'd know that if you'd been outside these walls.",
				"Don't let that smile fool you into thinking we're friends.",
				"I want a fair price. Not a good deal for you, a fair price for me.",
				"I've been doing this long enough to spot when someone's wasting my time.",
				"There's no shortage of things people need and no surplus of people willing to provide them.",
				"Come back when you've got something worth trading.",
				"Sentiment doesn't keep the lights on. Goods do.",
				"I've heard that pitch before. Everybody's got a story about why they deserve better."
			],
			negan: [
				"You don't want to find out what happens when I stop being in a good mood.",
				"I run things around here. That's not an opinion.",
				"I like you. Don't make me change my mind.",
				"The rules here are simple. You follow them, or you don't. One of those ends better.",
				"Lucille gets restless when I leave her alone too long.",
				"I've built something here. And I protect what I've built.",
				"Every mistake gets made once. I make sure of that."
			],
			ashley: [
				"I still think about what could have happened if you hadn't been there.",
				"Every time I see something good happen here, I remember it doesn't have to be this hard.",
				"I'm still figuring out where I fit in, but I'm glad I'm here.",
				"You've been kind to me. That means something. It really does.",
				"I keep waiting for the other shoe to drop. Maybe that's just habit now.",
				"I never thought I'd feel safe somewhere again. This is close.",
				"Whatever you need, I'm not forgetting what you did for me."
			],
			rose: [
				"There's more worth saving in this world than people give it credit for.",
				"I've been through enough to know what matters and what doesn't.",
				"Some days I just try to get through it. That's enough.",
				"You learn to appreciate the small things out here. You have to.",
				"I don't look back much. Doesn't help."
			],
			boris: [
				"Not much to say. The work gets done.",
				"Keep your head down and your powder dry. That's all.",
				"I've seen enough to know when to stay quiet.",
				"Doesn't matter what it was before. Matters what you do with it now.",
				"I'm not one for talk. Ask me when there's something that needs doing."
			]
		};

		let lines;
		if (charKey === 'isabel') {
			const domDead = variables().characters?.dom?.dead;
			lines = [
				...db.isabel_always,
				...(domDead ? db.isabel_dom_dead : db.isabel_dom_alive)
			];
		} else if (charKey === 'eve') {
			const rodgerDead = variables().characters?.rodger?.quests?.dead;
			lines = [
				...db.eve_always,
				...(rodgerDead ? db.eve_rodger_dead : db.eve_rodger_alive)
			];
		} else {
			lines = db[charKey];
		}
		if (!lines || lines.length === 0) {
			return npc.name ? "Hello, I'm " + npc.name + "." : "...";
		}
		return lines[Math.floor(Math.random() * lines.length)]
			.replace(/%mcName%/g, setup.npc.mcName(npc, false))
			.replace(/%mcNameUC%/g, setup.npc.mcName(npc, true));
	}
});
