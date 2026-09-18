setup.barDrinkNames = {
    fruity: [
        "Radslush Sunrise", "Mutant Melon Fizz", "Wasteland Wine Cooler", "Ashberry Splash",
        "Glowfruit Punch", "Rustwater Mimosa", "Scrapyard Sunset"
    ],
    strong: [
        "Rustgut Whiskey", "Fallout Fireball", "Ironclad Moonshine", "Widowmaker's Reserve",
        "Scorched Earth Stout", "Detonator's Delight", "Old Crater Bourbon"
    ]
};

// What she says when the MC asks her to pick, justifying her pick either way.
setup.barDrinkAskLines = {
    fruity: [
        "Something sweet, please — I like actually tasting what I'm drinking.",
        "Fruity, always. Anything that doesn't taste like paint thinner.",
        "Give me the sweet stuff. I've had enough of the harsh stuff for one lifetime.",
        "Fruity. I like pretending it's still a world where drinks came with little umbrellas."
    ],
    strong: [
        "Something with a kick, please. I want to actually feel it.",
        "Strong. If I'm drinking, I'm drinking.",
        "Give me the good stuff. Feels like it's been a hell of a week.",
        "Something that burns a little going down. Don't hold back."
    ]
};

// Her reaction to the relative strength of what each of you had, keyed 'her_him'.
setup.barDrinkComboReactions = {
    mild_mild: [
        "Mmm, this is actually really good. I could get used to drinking on shift.",
        "There's something fun about sneaking a drink in the middle of a shift like this.",
        "This is dangerously easy to drink. I can actually taste the fruit in this one.",
        "I like this. Feels a little illicit, having a drink while I'm supposed to be working."
    ],
    mild_strong: [
        "Wow, going straight for the hard stuff. Should I be impressed?",
        "Look at you, big man with your strong drink. I'm almost impressed.",
        "That's a lot of drink for a work break. I respect it, honestly.",
        "You really wanted to prove something with that one, huh? Cute."
    ],
    strong_mild: [
        "This one hits harder than I expected. Not complaining, just... noted.",
        "Okay, this is a lot stronger than I thought. Thank you, though. I needed this.",
        "Whew. Okay. That's a proper drink. I appreciate you not holding back on me.",
        "This is going straight to my head. In a good way, I think."
    ],
    strong_strong: [
        "Oh, we're both going hard tonight. I can respect that.",
        "Didn't expect you to keep up with me. I like it.",
        "How wild does the boss get, exactly? I might be about to find out.",
        "Okay, if we're both drinking like this, this shift just got a lot more interesting."
    ],
    abstain_mild: [
        "Not drinking? Suit yourself, more for me I guess.",
        "You're missing out, but okay. I'll enjoy this enough for both of us."
    ],
    abstain_strong: [
        "Staying sober while I do this? Smart. Somebody should be.",
        "Not drinking, huh? Guess someone's gotta keep an eye on the rest of us."
    ]
};

setup.barDrinkThankYouLines = [
    "Thanks for this, I mean it.",
    "This is exactly what I needed tonight.",
    "You didn't have to do this, but I'm glad you did.",
    "I needed a drink more than I realized.",
    "This is a nice break from the usual."
];

// Addendum reflecting how drunk she's getting. 'extraIfStrong' is appended only when her
// own drink was the strong type (whether picked directly or via the "ask" random result).
setup.barDrinkTierAddendums = {
    buzzed: {
        lines: [
            "The music actually sounds good right now. Or maybe that's just the drink.",
            "I'm really feeling the energy in here tonight.",
            "Everything's got a nice little buzz to it. Including me."
        ],
        extraIfStrong: null
    },
    euphoric: {
        lines: [
            "Okay, I'm definitely feeling that now. In a good way.",
            "I'm having a genuinely great time right now.",
            "This is hitting nicely. I feel great."
        ],
        extraIfStrong: null
    },
    tipsy: {
        lines: [
            "I feel amazing. Might regret this later when I'm back on the floor, though.",
            "I'm a little worried about how I'm going to finish my shift like this, honestly.",
            "Feeling really good right now. Hoping that lasts through the rest of the night."
        ],
        extraIfStrong: null
    },
    drunk: {
        lines: [
            "I'm having fun, but I don't feel that great, honeshtly.",
            "Okay, I think that wasn't my besht idea. Shtill having fun though.",
            "I'm good, I'm good. Jusht... the room's a little wobbly is all."
        ],
        extraIfStrong: "That shtrong one might've been a bit much for work, if I'm honesht."
    },
    drunk90: {
        lines: [
            "I don' even know if I'm havin' fun anymore, honeshtly.",
            "I think I had too much. I don' feel sho good.",
            "Everythin's kinda shpinny. Is it s'posed to do that?"
        ],
        extraIfStrong: "I'm ashtually worried I've had too much to be working right now."
    }
};
