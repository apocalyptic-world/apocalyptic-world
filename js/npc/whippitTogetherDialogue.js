// Stat/injury effects of the reveal, independent of job - same tiers as setup.getWhippitDrunkTier.
setup.whippitTogetherTierEffects = {
    not_drunk: { happyDelta: 0, injuryChance: 0, sickDays: 0 },
    buzzed:    { happyDelta: 0, injuryChance: 0, sickDays: 0 },
    euphoric:  { happyDelta: 0, injuryChance: 0, sickDays: 0 },
    tipsy:     { happyDelta: 1, injuryChance: 0, sickDays: 0 },
    drunk:     { happyDelta: -1, injuryChance: 10, sickDays: 1 },
    drunk90:   { happyDelta: -2, injuryChance: 25, sickDays: 2 }
};

// Job-specific reveals when sharing the whippit balloon together, keyed by intoxication tier.
// Each entry is {text, needsCoworker}; needsCoworker lines reference "{coworker}" and are only
// eligible when setup.getWhippitCoworker() actually found someone to name.
setup.whippitTogetherDialogue = {
    streets: {
        not_drunk: [
            { text: "Business has been slow tonight. Not that I'm complaining about the break.", needsCoworker: false },
            { text: "Some guy tried to haggle me down to nothing earlier. Rookie mistake.", needsCoworker: false },
            { text: "My feet are killing me in these heels. Worth it for the money, but still.", needsCoworker: false },
            { text: "Quiet corner tonight. I'll take boring over the alternative any day.", needsCoworker: false },
            { text: "Someone offered me a 'discount' on protection again. Hard pass.", needsCoworker: false }
        ],
        buzzed: [
            { text: "I keep waving at cars that aren't even slowing down. Whatever, it's funny to me right now.", needsCoworker: false },
            { text: "This corner smells like garbage but honestly? Kind of endearing right now.", needsCoworker: false },
            { text: "I almost fell over laughing at a guy's terrible pickup line earlier.", needsCoworker: false },
            { text: "My ears are ringing a little. Or maybe that's just the whippit. Who's to say.", needsCoworker: false },
            { text: "Some idiot tried to lowball me for a handjob. I laughed right in his face.", needsCoworker: false }
        ],
        euphoric: [
            { text: "Okay, don't judge me, but I definitely have a client who tips extra just because I laugh at his jokes. I fake most of it.", needsCoworker: false },
            { text: "I told a guy my real name once. Rookie mistake. Still think about it sometimes.", needsCoworker: false },
            { text: "{coworker} once fell asleep mid-shift leaning straight up against the wall. I still bring it up.", needsCoworker: true },
            { text: "I may have flirted with a guy so hard he forgot to pay me. Had to remind him. Twice.", needsCoworker: false },
            { text: "{coworker} has this whole system for scaring off the weird ones. I still don't fully understand it but it works.", needsCoworker: true }
        ],
        tipsy: [
            { text: "I chased off a guy who got handsy by threatening him with a stiletto heel. Actually worked.", needsCoworker: false },
            { text: "I gave a client a discount just because he made me laugh. Bad business, great story.", needsCoworker: false },
            { text: "I flagged down a car just to ask directions. Scared the hell out of the driver.", needsCoworker: false },
            { text: "I told my last client exactly what I thought of him. Felt incredible.", needsCoworker: false },
            { text: "I did an actual twirl in the middle of the street. No reason. Just felt like it.", needsCoworker: false }
        ],
        drunk: [
            { text: "I forgot a client's name mid-sentence and just... called him 'buddy' for the rest of it.", needsCoworker: false },
            { text: "I started crying about nothing in front of a total stranger. Great look.", needsCoworker: false },
            { text: "I tripped off the curb in front of an actual client. Professional, I know.", needsCoworker: false },
            { text: "I said something about my ex out loud. To a client. I don't want to talk about it.", needsCoworker: false },
            { text: "I got dizzy enough that I had to sit down mid-shift. Not my finest hour.", needsCoworker: false }
        ],
        drunk90: [
            { text: "I got into a car without even recognizing the plates. I don't even remember why.", needsCoworker: false },
            { text: "{coworker} went off with a guy who gave everyone a bad feeling. I should've said something.", needsCoworker: true },
            { text: "I don't actually remember the last hour. That's never a good sign out here.", needsCoworker: false },
            { text: "{coworker} and I both went home with the same guy on separate nights. Neither of us knew until just now.", needsCoworker: true },
            { text: "I walked into traffic without looking. I don't even remember deciding to do that.", needsCoworker: false }
        ]
    },
    nightclub: {
        not_drunk: [
            { text: "Slow night at the wall tonight, but the music's good so I'm not complaining.", needsCoworker: false },
            { text: "Someone requested my favorite song. Small victories.", needsCoworker: false },
            { text: "I get more tips dancing between clients than from the actual job some nights.", needsCoworker: false },
            { text: "The bathroom line's insane tonight. Occupational hazard, I guess.", needsCoworker: false },
            { text: "I actually got to sit down and enjoy a drink earlier. Rare treat.", needsCoworker: false }
        ],
        buzzed: [
            { text: "I've been humming the same song on loop in my head all night and I don't even like it that much.", needsCoworker: false },
            { text: "I keep laughing at the bass line like it's telling jokes. Whippit's doing its job.", needsCoworker: false },
            { text: "Someone complimented my outfit and I just kept saying thank you over and over.", needsCoworker: false },
            { text: "I tried to dance between clients and nearly took someone out with my elbow.", needsCoworker: false },
            { text: "The lights in here look extra pretty right now. Not complaining.", needsCoworker: false }
        ],
        euphoric: [
            { text: "Okay, I definitely made up a fake name for a regular because I forgot his real one months ago and never corrected it.", needsCoworker: false },
            { text: "{coworker} has a whole ranking system for the regulars. I'm somehow always the harshest judge.", needsCoworker: true },
            { text: "I told someone tonight that I actually like this job some days. I don't know why that felt like a big confession.", needsCoworker: false },
            { text: "{coworker} and I have a bit where we guess who's going to tip well just from their shoes. We're never wrong.", needsCoworker: true },
            { text: "I definitely danced a little too enthusiastically to a song nobody else even seemed to notice was playing.", needsCoworker: false }
        ],
        tipsy: [
            { text: "I told a regular exactly what I think of his cologne. He laughed. I was serious.", needsCoworker: false },
            { text: "I climbed up on the bar just to see the room from up there. Worth it.", needsCoworker: false },
            { text: "I gave a client my honest opinion on his dance moves. Constructive criticism, really.", needsCoworker: false },
            { text: "I made up a whole fake backstory for myself tonight just to see if anyone would believe it. Someone did.", needsCoworker: false },
            { text: "I challenged a regular to a dance-off. I won. Obviously.", needsCoworker: false }
        ],
        drunk: [
            { text: "I forgot the words to my own go-to song mid-shift. Just started humming instead.", needsCoworker: false },
            { text: "I got weirdly emotional over a song that used to mean something. Had to step away for a second.", needsCoworker: false },
            { text: "I nearly walked into the wrong wall on my way to the bathroom. Wrong wall, wrong time.", needsCoworker: false },
            { text: "I told a regular something way too personal. I don't even remember deciding to say it.", needsCoworker: false },
            { text: "The lights started making me dizzy instead of pretty. Had to sit the last bit out.", needsCoworker: false }
        ],
        drunk90: [
            { text: "I don't actually remember the last client at the wall. That's never happened before.", needsCoworker: false },
            { text: "{coworker} went off with someone from the back rooms that even the bouncers don't trust. I should've stopped her.", needsCoworker: true },
            { text: "I nearly took a header off the stage trying to prove I could still dance straight.", needsCoworker: false },
            { text: "{coworker} and I both blacked out around the same time and neither of us can piece together what happened after.", needsCoworker: true },
            { text: "I wandered into the back hallway without even realizing I'd left the floor. That's not like me.", needsCoworker: false }
        ]
    },
    strip_club: {
        not_drunk: [
            { text: "Isabel actually complimented my set tonight. That woman doesn't hand those out easy.", needsCoworker: false },
            { text: "Some guy tried to sneak an extra song out of me without tipping. Nice try.", needsCoworker: false },
            { text: "Easiest shift I've had all week, honestly. Not that I'm complaining.", needsCoworker: false },
            { text: "I got a request for a song I actually like for once.", needsCoworker: false },
            { text: "Crowd's been generous tonight. I'll take it.", needsCoworker: false }
        ],
        buzzed: [
            { text: "I keep giggling at my own reflection in the mirror backstage. Whippit's definitely doing something.", needsCoworker: false },
            { text: "The pole feels extra slippery tonight. Or maybe that's just me.", needsCoworker: false },
            { text: "I told the DJ his last song choice was a crime and somehow he agreed.", needsCoworker: false },
            { text: "I can't stop smiling. My face is going to hurt tomorrow.", needsCoworker: false },
            { text: "Someone tipped in one-dollar bills like it was confetti. Kind of iconic, honestly.", needsCoworker: false }
        ],
        euphoric: [
            { text: "Okay, I definitely have a favorite regular I flirt with more than I should for free. Don't tell Isabel.", needsCoworker: false },
            { text: "{coworker} has a whole routine for scaring off the handsy ones without losing the tip. I need her to teach me.", needsCoworker: true },
            { text: "I told someone tonight I actually like performing. Felt weirdly vulnerable to say out loud.", needsCoworker: false },
            { text: "{coworker} and I have a bet going on who can get the biggest tip with the worst song. I'm losing badly.", needsCoworker: true },
            { text: "I definitely improvised half my set tonight and somehow it worked better than the planned version.", needsCoworker: false }
        ],
        tipsy: [
            { text: "I told a client exactly what I thought of his tipping habits. He actually tipped better after.", needsCoworker: false },
            { text: "I did a move I've never actually practiced. Landed it perfectly. No idea how.", needsCoworker: false },
            { text: "I told Isabel her new lighting rig is a little much. She agreed, surprisingly.", needsCoworker: false },
            { text: "I turned down a bad tipper mid-song. Isabel would be proud, actually.", needsCoworker: false },
            { text: "I improvised a whole bit with a chair that wasn't even part of my set. Crowd loved it.", needsCoworker: false }
        ],
        drunk: [
            { text: "I forgot the next move in my own routine mid-song. Had to fake my way through it.", needsCoworker: false },
            { text: "I got weirdly emotional about a song that used to mean something to me. Had to step off early.", needsCoworker: false },
            { text: "I nearly slipped off the pole. Caught myself, but my heart's still racing.", needsCoworker: false },
            { text: "I said something too honest to a regular. I don't even remember deciding to say it.", needsCoworker: false },
            { text: "The lights started making me dizzy instead of pretty. Cut my set short.", needsCoworker: false }
        ],
        drunk90: [
            { text: "I don't actually remember most of my last set. That's never happened before.", needsCoworker: false },
            { text: "{coworker} went off with someone in the private rooms that even Isabel doesn't trust. I should've said something.", needsCoworker: true },
            { text: "I actually did fall off the pole tonight. Just for a second, but still.", needsCoworker: false },
            { text: "{coworker} and I apparently both blacked out around the same time and neither of us can piece together what happened.", needsCoworker: true },
            { text: "I wandered backstage and couldn't remember why I'd gone back there. That's not like me.", needsCoworker: false }
        ]
    }
};
