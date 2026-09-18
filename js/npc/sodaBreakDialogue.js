// Job-specific soda-break reveals, keyed by mood tone. Lines containing "{mcName}" are
// substituted with setup.npc.mcName($tmpGirl) at selection time (see NPC offer soda.tw).
setup.sodaBreakDialogue = {
    garden: {
        positive: [
            "Found a good rhythm today — didn't even notice the sun until you called me over.",
            "The new sprouts are coming in stronger than I expected, {mcName}. Feels good to watch something grow for once.",
            "One of the others and I got the whole east row weeded before noon. Nice to work alongside someone who actually pulls their weight.",
            "Caught a break in the heat around midday, {mcName}. Small thing, but it made the whole shift easier.",
            "Every time something actually grows out here, it feels like a tiny victory against all this dust, {mcName}."
        ],
        neutral: [
            "Same as any other day — dig, water, weed, repeat. Keeps the hands busy.",
            "The soil's still stubborn in the east bed, {mcName}. We'll get it sorted eventually.",
            "Nothing much to report. Plants don't care what mood you're in.",
            "Spent most of the morning checking for pests, {mcName}. Found a few, dealt with them.",
            "It's honest work, {mcName}. Not exciting, but it's something."
        ],
        negative: [
            "The heat out here really gets to me some days. I just needed a minute, that's all.",
            "Lost half a row to the dry spell before I could get water to it. Feels like it doesn't matter how hard I try sometimes, {mcName}.",
            "My back's been aching for days now. I didn't want to make a thing of it, but... it helps to say it out loud, {mcName}.",
            "One of the others snapped at me over nothing today. I know everyone's stretched thin, but it still stung.",
            "Some days this place just feels like it's grinding me down a little more, {mcName}. I just needed someone to hear that."
        ]
    },
    forest: {
        positive: [
            "Found a whole cluster of mushrooms nobody had picked over yet. Felt like actually winning something today.",
            "The woods were quiet and easy today, {mcName} — no wolves, no trouble, just work.",
            "Got a good haul of wood cut before midday. Feels good to have something to show for the effort.",
            "There's something almost peaceful out here under the trees, {mcName}, when nothing's trying to kill you.",
            "One of the others showed me a faster way to strip bark. Small thing, but it made the day easier, {mcName}."
        ],
        neutral: [
            "Same trees, same axe, same routine. Keeps me out of trouble.",
            "Didn't find much worth bringing back today, {mcName}. That's how it goes sometimes.",
            "The forest's been quiet lately. Can't tell if that's good or just waiting.",
            "Spent most of the day just gathering, {mcName}. Nothing eventful.",
            "It is what it is out here, {mcName}. Wood doesn't chop itself."
        ],
        negative: [
            "Thought I heard something moving in the brush earlier. Probably nothing, but it had me on edge all day.",
            "My hands are blistered from the axe again. I didn't want to complain, but it's been rough, {mcName}.",
            "Came back with less than I hoped. Feels like this stretch of forest's been picked clean.",
            "It gets lonely out there among the trees. I just needed to talk to someone for a minute, {mcName}.",
            "I keep thinking about the people we've lost to the wolves. Some days it's hard to shake that out here, {mcName}."
        ]
    },
    quarry: {
        positive: [
            "Broke a good vein of stone today — the kind that makes the whole shift feel worth it.",
            "Got the cart loaded faster than usual, {mcName}. Small win, but I'll take it.",
            "One of the others and I traded off on the heavy lifting today. Made the work almost bearable.",
            "There's a strange satisfaction in seeing a pile of good stone at the end of the day, {mcName}.",
            "No cave-ins, no injuries, good haul, {mcName}. Can't ask for much more out here."
        ],
        neutral: [
            "Same rock, same dust, same ache in my arms. Another day at the quarry.",
            "Nothing much happened, {mcName}. Just chipped away at the rock face like always.",
            "The stone's harder in this section. Slower going, but steady.",
            "Kept my head down and got through the shift, {mcName}. That's about it.",
            "It's tiring work, but it's work, {mcName}. Can't complain too much."
        ],
        negative: [
            "My arms feel like lead after today. I didn't want to make a fuss, but it's a lot some days.",
            "Almost got hit by a falling rock earlier. Shook me up more than I let on, {mcName}.",
            "The dust out here gets into everything — my lungs, my eyes. Some days it's just miserable.",
            "One of the others got hurt today. Nothing serious, but it reminded me how dangerous this place is, {mcName}.",
            "I just feel worn down lately. It helps to have someone to say that to, {mcName}."
        ]
    },
    milk_barn: {
        positive: [
            "The pump's been running smooth today, no tugging or catching. Makes the hours go a lot easier.",
            "You always make sure I'm fed and comfortable out here, {mcName}. I know it could be a lot worse than this.",
            "I've gotten used to the rhythm of it, honestly, {mcName}. It's almost peaceful once you stop fighting it.",
            "One of the other girls is tethered a few feet over — we talk to pass the time. Helps more than you'd think.",
            "I don't mind this as much as I used to. You look after us here, {mcName}, and that counts for something."
        ],
        neutral: [
            "Same as always — hooked up, cycle runs, hours pass. I've stopped counting them.",
            "Nothing much to report, {mcName}. The machine does its work, I let it.",
            "It's warm in here today. Not much else going on.",
            "I just sit with it until the shift's over, {mcName}. Keeps my mind elsewhere.",
            "It's steady, at least, {mcName}. I know what to expect from it."
        ],
        negative: [
            "My chest is sore by the end of most shifts. I don't like to make a fuss about it, but it adds up.",
            "Being tethered to this thing for hours really wears on you. I just needed a minute where I wasn't hooked to something, {mcName}.",
            "I go a little numb sitting here so long. It's not terrible, but it's not nothing either. Just needed to say that out loud.",
            "Some days I feel more like the machine's than my own. I know that probably sounds strange to say to you, {mcName}.",
            "It's hard some days, being what this job makes me. I just needed a moment where someone saw me as more than that, {mcName}."
        ]
    }
};

// Returns 'positive' | 'neutral' | 'negative', weighted by happy (-100 to 100).
// Positive/negative weight scales with happy so both are always reachable (min ~1%),
// neutral holds a flat baseline chance regardless of mood.
setup.pickDialogueTone = function (happy) {
    var h = happy ?? 0;
    var posW = Math.max(1, Math.round(1 + 97 * ((h + 100) / 200)));
    var negW = Math.max(1, Math.round(1 + 97 * ((100 - h) / 200)));
    var neuW = 15;
    var total = posW + negW + neuW;
    var roll = Math.random() * total;
    if (roll < posW) return 'positive';
    if (roll < posW + neuW) return 'neutral';
    return 'negative';
};
