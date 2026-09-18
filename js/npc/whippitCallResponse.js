// Two-line call-and-response banter between two participants in the group whippit scene,
// keyed by job and by the pair's intoxication "band" combo. Bands: sober, buzzed (buzzed/
// euphoric), tipsy (tipsy/drunk), drunk90. Combo keys are alphabetically sorted band names
// joined with '_' (e.g. 'buzzed_sober'), so the same key covers either speaking order.
// Lines containing "{mcName}" are substituted with setup.npc.mcName() of one of the pair
// at selection time.
setup.getWhippitPairBand = function (drunk) {
    var d = drunk ?? 0;
    if (d <= 0) return 'sober';
    if (d <= 50) return 'buzzed';
    if (d <= 89) return 'tipsy';
    return 'drunk90';
};

setup.getWhippitPairComboKey = function (bandA, bandB) {
    return [bandA, bandB].sort().join('_');
};

setup.whippitCallResponse = {
    streets: {
        sober_sober: [
            ["You ever think about how weird it is, doing this stone sober?", "Every single day. Glad we've got this instead."],
            ["Feels different, getting high without a drink already in me.", "Cleaner high. I like it."],
            ["This corner's cursed tonight, I swear.", "It's the balloon talking. Corner's fine."],
            ["Careful, you're gonna use it all.", "There's plenty. Stop hovering."],
            ["I forgot how good this feels without chasing it with liquor.", "Right? Almost feels responsible, for once."]
        ],
        buzzed_buzzed: [
            ["Okay, why is everything funnier right now?", "Because it is. Don't question it."],
            ["I think I just laughed at a streetlamp.", "Same. Ten out of ten streetlamp."],
            ["You're doing that thing where you giggle at nothing.", "You're one to talk."],
            ["I feel like I'm floating a little.", "You're standing on a crate. That's why."],
            ["This is exactly what {mcName} promised us it'd be.", "Told you. Best part of the shift, hands down."]
        ],
        tipsy_tipsy: [
            ["Okay but you look really good under bad lighting right now.", "That's the whippit talking. Try again sober."],
            ["I could just melt into this wall right now.", "Save some melting for later, we've got company."],
            ["You're extra handsy when you're like this.", "You're extra pretty when I'm like this. Coincidence?"],
            ["I might actually love this job right now.", "Ask me again in an hour."],
            ["Come here, you're missing all the fun over there.", "I'm right here. You're just extra affectionate tonight."]
        ],
        drunk90_drunk90: [
            ["I don't even remember what we were talking about, but I like you.", "I like you too. Also I think I love this wall."],
            ["Is it just me or is everyone incredibly attractive right now?", "It's the drugs. Also, yes."],
            ["I would absolutely make out with you right now if my legs worked.", "Noted. Rain check when the room stops spinning."],
            ["I feel like we could take on the whole block right now.", "We can barely stand. Sit down before you hurt yourself."],
            ["You're the best thing {mcName} ever brought down to this corner.", "That's the drunk90 talking, but I'll take it."]
        ],
        buzzed_sober: [
            ["You're way further gone than me already.", "The night's young and so is my tolerance, apparently."],
            ["Slow down, some of us like being coherent.", "Coherent is overrated, come join me."],
            ["You're grinning like an idiot.", "I'm having a great time, actually."],
            ["I'll hold the balloon, you're already floating.", "Rude. Accurate, but rude."],
            ["Somebody's gotta stay sharp out here for {mcName}.", "Boo. Live a little."]
        ],
        sober_tipsy: [
            ["You've officially lost the plot.", "The plot lost me first, honestly."],
            ["You're not making any sense right now.", "I'm making perfect sense, you're just too sober to follow."],
            ["Careful, you're leaning.", "I'm leaning INTO the experience."],
            ["I don't know whether to laugh or worry.", "Laugh. Definitely laugh."],
            ["You okay over there?", "Never better. Everything's soft and funny."]
        ],
        drunk90_sober: [
            ["Okay, that's enough for you.", "I have never felt more alive in my entire life."],
            ["You need to sit down before you fall down.", "I could run a marathon right now. I won't, but I could."],
            ["I think you just declared love to the wall.", "The wall gets it. The wall understands me."],
            ["This is why {mcName} doesn't let you have the whole balloon.", "Worth it. Absolutely worth it."],
            ["Somebody keep an eye on this one.", "I'm fine. I'm great. I'm—"]
        ],
        buzzed_tipsy: [
            ["You're way ahead of me.", "Catch up then, slowpoke."],
            ["Everything's funny but you're also kind of hot right now.", "'Kind of'? I'll take it."],
            ["You're wobbling.", "You're staring. We're both having a great night."],
            ["I feel good. You look like you feel amazing.", "I feel incredible. Come find out."],
            ["Slow down, save some for the rest of us.", "No promises."]
        ],
        buzzed_drunk90: [
            ["Okay, you're on a whole different level than me.", "The level is fantastic up here, you should visit."],
            ["I don't think you can feel your face.", "I can't feel anything. It's incredible."],
            ["You just tried to hug the streetlamp.", "The streetlamp needed it."],
            ["You're kind of a lot right now, in a good way.", "I contain multitudes. Also I might fall over."],
            ["I'm a little worried about you.", "Don't be. Kiss me instead."]
        ],
        drunk90_tipsy: [
            ["You've officially out-drunk me and I didn't think that was possible.", "Anything's possible tonight, apparently."],
            ["You are extremely affectionate right now.", "You're extremely pretty right now. We're even."],
            ["I can't tell if you're flirting or just can't stand up straight.", "Why not both?"],
            ["Okay, that's the drugs talking.", "The drugs make excellent points though."],
            ["Somebody get this one some water before {mcName} sees.", "Somebody get me you, actually."]
        ]
    },
    nightclub: {
        sober_sober: [
            ["Doing this stone sober feels almost professional.", "Very responsible drug use. Very us."],
            ["This place is way too loud without something to take the edge off.", "Good thing we've got the balloon then."],
            ["You're way too serious for pre-buzz you.", "Someone's got to keep track of the tips."],
            ["This is nice, actually. Quiet, for once.", "Give it a minute."],
            ["I forgot how good a clear head feels before all this.", "Enjoy it while it lasts."]
        ],
        buzzed_buzzed: [
            ["Why does the bass suddenly make so much sense?", "It's always made sense. You're just listening now."],
            ["I keep smiling at nothing.", "You're smiling at me, actually. I'll take it."],
            ["This song is suddenly the best song ever written.", "It's mediocre and you know it."],
            ["I feel amazing right now.", "You look amazing right now."],
            ["Everything's got a nice little glow to it, thanks to {mcName}.", "That's the lights. Also maybe the balloon."]
        ],
        tipsy_tipsy: [
            ["You're extra touchy tonight.", "You're extra cute tonight. Coincidence?"],
            ["I could dance on this bar right now.", "Please don't. Actually, please do."],
            ["I forgot how good you look under these lights.", "That's just the whippit talking."],
            ["I might actually love this job tonight.", "Ask me again after the hangover."],
            ["Come dance with me, you're just standing there.", "I'm admiring the view, actually."]
        ],
        drunk90_drunk90: [
            ["I don't remember the last three songs, but I love you.", "I love you too. Also is the floor supposed to move?"],
            ["Everyone in here is suddenly gorgeous.", "It's the drugs. Also, yes, everyone is."],
            ["I would kiss you right now if I could stand straight.", "Noted. Rain check when the room stops spinning."],
            ["I feel like I could dance until sunrise.", "You can barely stand. Sit down before you fall."],
            ["You're the best part of this whole club {mcName} owns.", "That's the drunk90 talking, but I'll take it."]
        ],
        buzzed_sober: [
            ["You're way further gone than me already.", "The night's young and so is my tolerance, apparently."],
            ["Slow down, some of us are still working.", "Working is overrated. Come join me."],
            ["You're grinning like an idiot at the DJ.", "The DJ's having a moment. I'm having a moment."],
            ["I'll hold the balloon, you're already floating.", "Rude. Accurate, but rude."],
            ["Somebody's got to keep track of the register for {mcName}.", "Boo. Live a little."]
        ],
        sober_tipsy: [
            ["You've officially lost the plot.", "The plot lost me first, honestly."],
            ["None of what you just said made sense.", "It made perfect sense, you're just too sober to follow."],
            ["Careful, you're leaning on the bar.", "I'm leaning INTO the experience."],
            ["I don't know whether to laugh or worry about you.", "Laugh. Definitely laugh."],
            ["You okay over there?", "Never better. Everything's soft and funny."]
        ],
        drunk90_sober: [
            ["Okay, that's enough for you.", "I have never felt more alive in my entire life."],
            ["You need to sit down before you fall down.", "I could dance all night. I won't, but I could."],
            ["I think you just declared love to the bar.", "The bar gets it. The bar understands me."],
            ["This is why {mcName} doesn't let you have the whole balloon.", "Worth it. Absolutely worth it."],
            ["Somebody keep an eye on this one.", "I'm fine. I'm great. I'm—"]
        ],
        buzzed_tipsy: [
            ["You're way ahead of me.", "Catch up then, slowpoke."],
            ["Everything's funny but you're also kind of hot right now.", "'Kind of'? I'll take it."],
            ["You're wobbling on those heels.", "You're staring. We're both having a great night."],
            ["I feel good. You look like you feel amazing.", "I feel incredible. Come find out."],
            ["Slow down, save some for the rest of us.", "No promises."]
        ],
        buzzed_drunk90: [
            ["Okay, you're on a whole different level than me.", "The level is fantastic up here, you should visit."],
            ["I don't think you can feel your face.", "I can't feel anything. It's incredible."],
            ["You just tried to slow dance with a barstool.", "The barstool needed it."],
            ["You're kind of a lot right now, in a good way.", "I contain multitudes. Also I might fall over."],
            ["I'm a little worried about you.", "Don't be. Kiss me instead."]
        ],
        drunk90_tipsy: [
            ["You've officially out-drunk me and I didn't think that was possible.", "Anything's possible tonight, apparently."],
            ["You are extremely affectionate right now.", "You're extremely pretty right now. We're even."],
            ["I can't tell if you're flirting or just can't stand up straight.", "Why not both?"],
            ["Okay, that's the drugs talking.", "The drugs make excellent points though."],
            ["Somebody get this one some water before {mcName} sees.", "Somebody get me you, actually."]
        ]
    },
    strip_club: {
        sober_sober: [
            ["Doing this before a set feels almost professional.", "Very responsible. Very us."],
            ["This place is too quiet without a little chaos.", "Good thing we've got the balloon then."],
            ["You're way too serious for pre-buzz you.", "Someone's got to remember the set list."],
            ["This is nice, actually. Calm, for once.", "Give it a minute."],
            ["I forgot how good a clear head feels before all this.", "Enjoy it while it lasts."]
        ],
        buzzed_buzzed: [
            ["Why does the pole suddenly look so inviting?", "It always looks inviting. You're just noticing now."],
            ["I keep smiling at nothing.", "You're smiling at me, actually. I'll take it."],
            ["This song is suddenly the best routine music ever.", "It's mediocre and you know it."],
            ["I feel amazing right now.", "You look amazing right now."],
            ["Everything's got a nice little glow to it, courtesy of {mcName}.", "That's the stage lights. Also maybe the balloon."]
        ],
        tipsy_tipsy: [
            ["You're extra touchy tonight.", "You're extra cute tonight. Coincidence?"],
            ["I could do my whole set right now, easy.", "Please don't fall off the pole. Actually, please do a little."],
            ["I forgot how good you look under these lights.", "That's just the whippit talking."],
            ["I might actually love this job tonight.", "Ask me again after the hangover."],
            ["Come here, you're just standing there.", "I'm admiring the view, actually."]
        ],
        drunk90_drunk90: [
            ["I don't remember the last two songs, but I love you.", "I love you too. Also is the stage supposed to spin?"],
            ["Everyone in here is suddenly gorgeous.", "It's the drugs. Also, yes, everyone is."],
            ["I would kiss you right now if I could stand straight.", "Noted. Rain check when the room stops spinning."],
            ["I feel like I could dance until sunrise.", "You can barely stand. Sit down before you fall off the stage."],
            ["You're the best part of working for {mcName} and Isabel.", "That's the drunk90 talking, but I'll take it."]
        ],
        buzzed_sober: [
            ["You're way further gone than me already.", "The night's young and so is my tolerance, apparently."],
            ["Slow down, some of us still have a set to do.", "Sets are overrated. Come join me."],
            ["You're grinning like an idiot at nothing.", "I'm having a great time, actually."],
            ["I'll hold the balloon, you're already floating.", "Rude. Accurate, but rude."],
            ["Somebody's got to keep this place presentable for Isabel.", "Boo. Live a little."]
        ],
        sober_tipsy: [
            ["You've officially lost the plot.", "The plot lost me first, honestly."],
            ["None of what you just said made sense.", "It made perfect sense, you're just too sober to follow."],
            ["Careful, you're leaning on the pole.", "I'm leaning INTO the experience."],
            ["I don't know whether to laugh or worry about you.", "Laugh. Definitely laugh."],
            ["You okay over there?", "Never better. Everything's soft and funny."]
        ],
        drunk90_sober: [
            ["Okay, that's enough for you.", "I have never felt more alive in my entire life."],
            ["You need to sit down before you fall off that stage.", "I could dance all night. I won't, but I could."],
            ["I think you just declared love to the pole.", "The pole gets it. The pole understands me."],
            ["This is why {mcName} doesn't let you have the whole balloon.", "Worth it. Absolutely worth it."],
            ["Somebody keep an eye on this one before Isabel sees.", "I'm fine. I'm great. I'm—"]
        ],
        buzzed_tipsy: [
            ["You're way ahead of me.", "Catch up then, slowpoke."],
            ["Everything's funny but you're also kind of hot right now.", "'Kind of'? I'll take it."],
            ["You're wobbling in those heels.", "You're staring. We're both having a great night."],
            ["I feel good. You look like you feel amazing.", "I feel incredible. Come find out."],
            ["Slow down, save some for the rest of us.", "No promises."]
        ],
        buzzed_drunk90: [
            ["Okay, you're on a whole different level than me.", "The level is fantastic up here, you should visit."],
            ["I don't think you can feel your face.", "I can't feel anything. It's incredible."],
            ["You just tried to slow dance with the pole.", "The pole needed it."],
            ["You're kind of a lot right now, in a good way.", "I contain multitudes. Also I might fall over."],
            ["I'm a little worried about you.", "Don't be. Kiss me instead."]
        ],
        drunk90_tipsy: [
            ["You've officially out-drunk me and I didn't think that was possible.", "Anything's possible tonight, apparently."],
            ["You are extremely affectionate right now.", "You're extremely pretty right now. We're even."],
            ["I can't tell if you're flirting or just can't stand up straight.", "Why not both?"],
            ["Okay, that's the drugs talking.", "The drugs make excellent points though."],
            ["Somebody get this one some water before Isabel sees.", "Somebody get me you, actually."]
        ]
    }
};

// Picks a random {lineA, lineB} pair for the given job + two drunk values, with {mcName}
// substituted using npcForName (either participant works equally well).
setup.pickWhippitCallResponse = function (job, drunkA, drunkB, npcForName) {
    var bandA = setup.getWhippitPairBand(drunkA);
    var bandB = setup.getWhippitPairBand(drunkB);
    var key = setup.getWhippitPairComboKey(bandA, bandB);
    var pool = (setup.whippitCallResponse[job] ?? {})[key] ?? [];
    if (!pool.length) return null;
    var pair = pool[Math.floor(Math.random() * pool.length)];
    var mcName = setup.npc.mcName(npcForName);
    return [pair[0].replace('{mcName}', mcName), pair[1].replace('{mcName}', mcName)];
};
