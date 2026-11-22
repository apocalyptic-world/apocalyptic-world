/**
 * What a watching husband says while the MC has consenting sex with his wife (views/npc/fuck/mc/cuckReactions.tw,
 * included under Reactions in Mc fuck). Rolled at CHANCE percent, only when the husband is where the scene is:
 *   - the guest house (the wife was picked from the Guest house list), with the husband at home there: not at work,
 *     not at night school, not in the hospital
 *   - her workplace, with the husband working the same assignment right now (both in the forest, ...)
 *
 * Tone follows the husband's tier: 'low' sub is jealous and bitter but can't look away, 'mid' is conflicted and
 * aroused despite himself, 'high' is an eager, admiring cuckold. Relationship 50+ with the MC moves him up one tier.
 * The lines cover four themes, each with and without comparison to himself: how well the MC pleases her, how keenly
 * she pleases the MC, how hard she responds, and how big the MC looks inside or against her.
 *
 * LINES[key][tier]: key is the sex action (ALIASES share keys), 'climax' / 'pre_climax' by her horny like Reactions,
 * or 'generic'. %mcName% / %McName% become what the husband calls the MC, %wife% her name.
 * A feral husband gets a body-language bubble from FERAL instead (no tiers).
 */
setup.cuckReactions = {
	CHANCE: 35,

	/** Sub below LOW_SUB is 'low', below HIGH_SUB 'mid', otherwise 'high' */
	LOW_SUB: 35,
	HIGH_SUB: 70,
	/** Relationship with the MC that moves him up one tier */
	BUMP_RELATIONSHIP: 50,

	ALIASES: {
		pussy_fisting: '_fisting', anal_fisting: '_fisting',
		anal_fingering: '_ass_play', assjob: '_ass_play',
		cum_on_face: '_cum_on_body', cum_on_back: '_cum_on_body', cum_on_stomach: '_cum_on_body', grind_cum: '_cum_on_body',
		cum_in_mouth: '_cum_oral', cum_throat: '_cum_oral', cum_in_throat: '_cum_oral',
		anal_reverse: 'anal', bj_reverse: 'bj'
	},

	/** Her husband if he's watching this scene (adults only, consenting scenes only), or null */
	watcher(wife, V = variables()) {
		const husbandId = wife?.family?.husband;
		if (!husbandId || husbandId === 'mc' || V.sexForced || setup.getAge(wife) < 18) return null;
		const atHome = (V.guests ?? []).find(npc => npc && String(npc.id) === String(husbandId));
		const husband = atHome ?? (V.slaves ?? []).find(npc => npc && String(npc.id) === String(husbandId));
		if (!husband || husband.id === wife.id || setup.getAge(husband) < 18) return null;
		return this.present(wife, husband, !!atHome, V) ? husband : null;
	},

	/** Is husband where the scene with wife is happening? */
	present(wife, husband, isGuest, V) {
		if (typeof husband.sick !== 'undefined' && (V.game?.location?.hospital ?? false)) return false;
		const atWork = setup.isAtWork(husband, V.weather);
		if (wife.location === 'bedroom' && V.tmpGirlBack === 'Guest house') {
			return isGuest && !atWork && husband.location !== 'school';
		}
		return !!husband.assignedTo && husband.assignedTo === wife.location && atWork;
	},

	tier(husband) {
		const sub = husband.sub ?? 0;
		let tier = sub < this.LOW_SUB ? 0 : (sub < this.HIGH_SUB ? 1 : 2);
		if ((husband.relationship ?? 0) >= this.BUMP_RELATIONSHIP) tier = Math.min(tier + 1, 2);
		return ['low', 'mid', 'high'][tier];
	},

	/** { text, feral } for husband watching wife during action, or null */
	reaction(wife, husband, action, V = variables()) {
		const horny = wife.horny ?? 0;
		let key;
		if (horny >= 100 && setup.percentageChance(90)) key = 'climax';
		else if (horny >= 80 && setup.percentageChance(50)) key = 'pre_climax';
		else {
			key = this.ALIASES[action] ?? action;
			if (!Object.prototype.hasOwnProperty.call(this.LINES, key)) key = 'generic';
		}
		const pick = list => list[Math.floor(Math.random() * list.length)];
		if ((husband.traits ?? []).includes('feral')) {
			return { feral: true, text: pick(this.FERAL[key] ?? this.FERAL.generic) };
		}
		const lines = this.LINES[key][this.tier(husband)];
		if (!lines?.length) return null;
		return {
			feral: false,
			text: pick(lines)
				.replace(/%McName%/g, setup.npc.mcName(husband, true))
				.replace(/%mcName%/g, setup.npc.mcName(husband, false))
				.replace(/%wife%/g, wife.name)
		};
	},

	FERAL: {
		climax: [
			"goes utterly still as she cries out, then lets out a low, shuddering whine",
			"bares his teeth at you, then sinks back on his haunches, eyes never leaving her",
			"paces a tight circle, then crouches again to watch her shake",
			"throws his head back with a strangled howl as she comes apart beneath you"
		],
		pre_climax: [
			"creeps closer on all fours, nostrils flaring at her scent",
			"lets a low rumble build in his chest as her breathing quickens",
			"rocks on his heels, breathing as fast as she is",
			"digs his fingers into the floor, staring at her with wide, dark eyes"
		],
		generic: [
			"watches from the corner, head tilted, eyes fixed on her",
			"sniffs the air and lets out a soft, uncertain whine",
			"edges closer, then backs away again, unable to settle",
			"lets out a low growl, then falls silent and keeps watching",
			"presses his back to the wall, chest heaving as he watches",
			"circles the two of you slowly, then drops into a crouch to stare"
		]
	},

	LINES: {
		pussy: {
			low: [
				"*jaw clenched, eyes locked on the two of you* ...She never moans like that for me.",
				"*gripping his knees until his knuckles go white*",
				"Look at her, %mcName%...  Taking all of you like it's nothing.  *quietly* She always tells me I'm plenty.",
				"*muttering* Fine.  You're good at it.  Happy now?",
				"*staring* That look on her face...  I haven't put it there in years.",
				"*swallowing hard* You're bigger than me.  Don't think I can't see it from here."
			],
			mid: [
				"*shifting where he sits, flushed* I shouldn't be watching this...  *doesn't look away*",
				"Gods, look how deep you get, %mcName%...  I never reach that far in her.",
				"*breathing harder* %wife%...  you sound so different with him.",
				"*leaning forward despite himself* The way she's rolling her hips onto you...  she never does that with me.",
				"*rubbing his face* You stretch her so much more than I do...  and I can't stop watching it.",
				"I keep telling myself to leave.  *watching her clutch at you* I'm not going anywhere."
			],
			high: [
				"Yes...  Look at her, %mcName%.  You fill her up so much better than I ever could.",
				"*eagerly* Deeper, %mcName%!  She loves it deep, and I could never give her that.",
				"*watching with rapt attention* That's it, %wife%...  Show him how good he makes you feel.",
				"*whispering* Your cock looks perfect inside her, %mcName%...  so much bigger than mine.",
				"She never sounds like that with me...  *smiling* and she shouldn't.  You're the one who earned it.",
				"*leaning in close* Thank you, %mcName%...  She deserves a real man, and I get to watch."
			]
		},

		anal: {
			low: [
				"*face dark* She told me she'd never let anyone back there.  Including me.",
				"*hands clenched in his lap* ...Of course she lets you.",
				"*watching her push back against you* She's never been that eager for me in her life.",
				"*bitterly* Easy on her, %mcName%...  *quietly* ...not that she seems to want you to be."
			],
			mid: [
				"*swallowing* She's taking you in the ass...  I asked her for that for years.",
				"*shifting uncomfortably* Gods, look at her stretch around you...  how is she taking all of that?",
				"*breath catching* %wife%...  you're actually enjoying it...",
				"I should hate this.  *staring* Why don't I hate this?"
			],
			high: [
				"*watching eagerly* Look how she opens up for you, %mcName%...  She never gave me that, and now I know why.",
				"Go deeper, %mcName%...  She wants all of you, I can see it in her face.",
				"*breathless* Your cock looks huge buried in her ass...  mine would barely make her notice.",
				"*softly* Good girl, %wife%...  Take him all the way, just like he wants."
			]
		},

		dp: {
			low: [
				"*staring* All the way down her throat...  She gags if I even try half that.",
				"*hands shaking in his lap* ...She's taking every inch of you.",
				"*voice low* Her eyes are watering and she's still pulling you deeper..."
			],
			mid: [
				"*breathing hard* How is she fitting all of that down her throat?",
				"*watching her nose press against you* I didn't know she could do that...",
				"*quietly* I can see you in her throat...  Gods..."
			],
			high: [
				"*eagerly* All the way down, %wife%...  take every inch of him.",
				"Look at her, %mcName%, throat full of you and loving it...  she could swallow mine without noticing.",
				"*smiling* That's my wife...  she'd never go that deep for me."
			]
		},

		cum_in_pussy: {
			low: [
				"*goes rigid* ...Inside her.  You came inside my wife.",
				"*staring at the floor, then back up again* If she ends up carrying your child, %mcName%...",
				"*voice tight* She makes me pull out.  Every time.",
				"*a long breath through his nose, eyes fixed on the two of you*"
			],
			mid: [
				"*hoarse* You're filling her up...  right in front of me...",
				"*watching her shudder as you empty yourself into her* She's never held on to me like that when I finish.",
				"*face flushed* If she gets pregnant...  *trails off, unable to look away*",
				"I can see it dripping out of her...  *swallowing hard* there's so much more than I ever give her."
			],
			high: [
				"Yes...  fill her up, %mcName%.  Every drop where it belongs.",
				"*smiling* If she carries your baby, %mcName%, I'll raise it proudly.",
				"*admiring* Look at all of that...  She'll be full of you for hours.",
				"*softly* Breed her, %mcName%...  She's always wanted a man who could give her that."
			]
		},

		cum_in_ass: {
			low: [
				"*rigid* ...Inside her there too.",
				"*voice tight* She'll be feeling that all night.  Not me.  You."
			],
			mid: [
				"*swallowing hard* You filled her up back there...",
				"*watching her shiver* She's still pushing back against you..."
			],
			high: [
				"*smiling* Fill her ass, %mcName%...  claim every part of her.",
				"*softly* She'll be walking funny tomorrow...  and smiling the whole time."
			]
		},

		nipple_lick: {
			low: [
				"*arms folded tight* She always pushes me away when I try that.",
				"*watching her arch into your mouth* ...She never arches like that for me.",
				"*muttering* You don't have to put on a show, %mcName%."
			],
			mid: [
				"*leaning forward* Look how hard her nipples are...  She's never that sensitive for me.",
				"*quietly* She's holding your head there...  like she doesn't want you to stop.",
				"*shifting in place* Gods...  listen to her."
			],
			high: [
				"*eagerly* That's it, %mcName%...  She loves having her breasts worshipped by a real man.",
				"*smiling* Look how she's squirming for you...  You know exactly what she likes.",
				"*watching closely* She's never let me take my time like that.  Enjoy them, %mcName%."
			]
		},

		bj: {
			low: [
				"*jaw tight* She says it makes her jaw sore when I ask.",
				"*watching her take you deeper* ...She can barely fit you.  Must be nice.",
				"*bitterly* Look at her go.  Like she's starving.",
				"*staring at the wall, then helplessly back at her*",
				"*under his breath* She never looks up at me like that."
			],
			mid: [
				"*swallowing* Look at her lips stretched around you...  she's barely getting halfway.",
				"*flushed* She's moaning around your cock...  she never moans when she does me.",
				"*shifting* The way she's using her tongue on you...  where did she learn that?",
				"I keep comparing...  *quietly* and I keep losing."
			],
			high: [
				"*eagerly* Look at her, %mcName%...  she's never been that hungry for my cock.",
				"Your cock makes her mouth look so small, %mcName%...  mine fits easily.",
				"*admiring* She's working so hard for you.  Good girl, %wife%.  Show him how grateful you are.",
				"*softly* Let her worship you, %mcName%.  She's been dreaming about this.",
				"*watching rapt* Deeper, %wife%...  take all of him like you never could with me."
			]
		},

		handjob: {
			low: [
				"*watching her hands* Both hands, and she still can't cover all of you.  Great.",
				"*muttering* She gets bored doing that for me after a minute.",
				"*arms crossed, eyes fixed on her stroking you*"
			],
			mid: [
				"*swallowing* Her fingers don't even meet around you...",
				"*leaning forward* She's taking her time with you...  she rushes with me.",
				"*quietly* She's looking at your cock like it's a prize."
			],
			high: [
				"*eagerly* Look at that, %mcName%...  both hands and you're still sticking out the top.",
				"*admiring* She strokes you like she's grateful just to touch it.  She's right to be.",
				"Mine fits in one of her hands...  *laughing softly* yours barely fits in two."
			]
		},

		pussy_lick: {
			low: [
				"*tense* She never lets me down there for long.",
				"*watching her thighs clamp around your head* ...She's shaking already.",
				"*under his breath* Show-off."
			],
			mid: [
				"*breath catching* Gods, listen to her...  you've barely started.",
				"*watching her grind against your face* I've never got her that wet.",
				"*quietly* What are you doing to her with your tongue?"
			],
			high: [
				"*eagerly* That's it, %mcName%, eat her properly...  I never could make her squirm like that.",
				"*smiling* Listen to her...  you're making her sing.",
				"*watching closely* Teach me something, %mcName%...  *laughing softly* no, actually, just keep going."
			]
		},

		sn: {
			low: [
				"*staring* Both at once...  she's never even tried that with me.",
				"*jaw clenched* She's moaning around your cock while you lick her...  perfect."
			],
			mid: [
				"*flushed* She can't decide whether to moan or keep sucking...",
				"*shifting* The two of you are completely lost in each other..."
			],
			high: [
				"*eagerly* Look at her trying to keep your cock in her mouth while you eat her, %mcName%...",
				"*admiring* She's never been so busy and so happy at the same time."
			]
		},

		kissing: {
			low: [
				"*bristling* She doesn't kiss me like that anymore.",
				"*clears his throat pointedly, but nobody stops*",
				"*looking away, then back* ...That's a lot of tongue, %mcName%."
			],
			mid: [
				"*quietly* She's melting into you...",
				"*watching her hands slide into your hair* She used to kiss me like that.  A long time ago.",
				"*flushed* Gods...  just from kissing her..."
			],
			high: [
				"*smiling* Look how she melts for you, %mcName%...  she's never kissed me like that.",
				"*softly* Kiss her deeper...  she loves being wanted by you.",
				"*watching contentedly* She looks so happy in your arms."
			]
		},

		grind: {
			low: [
				"*watching her slide along your cock* ...It's not even inside her and she's already flushed.",
				"*arms crossed* Teasing you like that.  She never teases me."
			],
			mid: [
				"*leaning forward* She's grinding all over you...  she's so wet I can see it from here.",
				"*quietly* She's going crazy just rubbing against you..."
			],
			high: [
				"*eagerly* Look at her grind on you, %mcName%...  she can't wait to have you inside.",
				"*smiling* She's soaking your cock and you haven't even put it in."
			]
		},

		_fisting: {
			low: [
				"*pale* Your whole hand...  in my wife.",
				"*hands gripping his knees* She's...  she's actually taking it."
			],
			mid: [
				"*hoarse* I didn't know she could stretch that much...",
				"*staring* She's shaking all over...  I can't look away."
			],
			high: [
				"*breathless* Your whole hand, %mcName%...  and she's begging for more.",
				"*smiling* She's never been that open for me...  in any way."
			]
		},

		_ass_play: {
			low: [
				"*frowning* She slaps my hand away when I try that.",
				"*watching her push back against you* ...Apparently she likes it from you."
			],
			mid: [
				"*flushed* She's pushing back into you...",
				"*quietly* I always thought she didn't like that..."
			],
			high: [
				"*eagerly* She loves it when you play with her there, %mcName%...  she never told me.",
				"*smiling* Go on, %mcName%.  She's all yours, every part of her."
			]
		},

		_cum_on_body: {
			low: [
				"*staring at her, covered in you* ...She'd yell at me if I did that.",
				"*jaw tight* She's smiling.  She's actually smiling about it.",
				"*a long, slow breath through his teeth*"
			],
			mid: [
				"*swallowing* There's so much of it all over her...",
				"*flushed* She's...  rubbing it in...",
				"*quietly* She looks so proud of herself."
			],
			high: [
				"*admiring* Look at all that, %mcName%...  you covered her.",
				"*softly* You look beautiful like that, %wife%.  Marked by a real man.",
				"*smiling* So much more than I ever give her...  she's wearing it like a prize."
			]
		},

		_cum_oral: {
			low: [
				"*staring* She swallowed it.  She spits mine out.",
				"*jaw tight* She's licking her lips...  for you.",
				"*looks away, then back, unable to help himself*"
			],
			mid: [
				"*hoarse* She took all of it...",
				"*flushed* She's still cleaning you off...  she never does that for me.",
				"*quietly* She looks so satisfied."
			],
			high: [
				"*eagerly* Every drop, %wife%...  don't waste any of his.",
				"*smiling* She never swallows mine, %mcName%.  She drinks yours like a treat.",
				"*admiring* Look at her face...  she loved every drop."
			]
		},

		climax: {
			low: [
				"*goes completely still as she cries out* ...She's never screamed for me like that.",
				"*knuckles white* I've never made her cum like that.  Not once.",
				"*staring at her shaking body* ...So that's what it looks like.",
				"*bitterly* Congratulations, %mcName%.  You win."
			],
			mid: [
				"*hoarse* She's cumming...  she's really cumming...",
				"*watching her convulse around you* I didn't know she could do that.",
				"*breathing as hard as she is* Gods, %wife%...",
				"*quietly* I always thought she was faking a little...  now I know she was."
			],
			high: [
				"*eagerly* Yes!  Cum for him, %wife%!  Cum like you never cum for me!",
				"*beaming* Look at her shake, %mcName%...  you've completely undone her.",
				"*breathless* That's my wife cumming on your cock...  thank you.",
				"*softly* So that's what she sounds like when a real man finishes her."
			]
		},

		pre_climax: {
			low: [
				"*leaning forward despite himself* She's close...  I know that face.  I just rarely see it.",
				"*jaw tight* Don't you dare stop now, %mcName%...  *bitterly* she'd never forgive either of us.",
				"*gripping his knees* She's shaking..."
			],
			mid: [
				"*breathing hard* She's almost there...  I can see it...",
				"*quietly* Look at her toes curling...",
				"*flushed* She's begging you...  she's never begged me."
			],
			high: [
				"*eagerly* She's so close, %mcName%!  Don't stop, make her cum!",
				"*watching rapt* Take her over the edge, %mcName%...  she's been waiting for this.",
				"*whispering* Come on, %wife%...  cum for him..."
			]
		},

		generic: {
			low: [
				"*watching, jaw clenched*",
				"*shifting, unable to look away*",
				"...She never does that with me."
			],
			mid: [
				"*flushed, breathing harder as he watches*",
				"I shouldn't be enjoying this...",
				"*quietly* Look at her..."
			],
			high: [
				"*watching eagerly* You're so good with her, %mcName%.",
				"*smiling* She's so happy with you.",
				"That's it...  treat her right, %mcName%."
			]
		}
	}
};
