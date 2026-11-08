/*
 * Text pools for nursery encounters that pick a topic. {kid} is the child's name; {he}, {him}, {his} and {He}, {His} are
 * the child's pronouns, filled in by setup.nurseryEncounters.fill.
 */
setup.nurseryEncounterText = {
    /* Bringing something to a student */
    forgotten: ['lunch pail', 'slate', 'reading primer', 'coat', 'sums book', 'pencil case'],

    /* Parental dispute, by the child's age. Neither side is wrong, and nothing here puts a child at any risk. */
    disputes: {
        infant: [
            {
                parent: 'Every time I come by, {kid} is crying in that cot and nobody has picked {him} up. A baby that small should be held when {he} cries.',
                carer: 'I hold {him} plenty. With this many in the room I have to let {him} fuss for a few minutes, and {he} has started settling on {his} own. That\'s good for {him}.'
            },
            {
                parent: 'You have {kid} on a schedule like it\'s a work detail. {He} should eat when {he} is hungry, whatever the time is.',
                carer: '{He} sleeps through most of the night now because of that schedule. If I feed every baby at every fuss, nobody in here sleeps at all.'
            },
            {
                parent: '{kid} is wrapped up so tight {he} can hardly move. Babies need to stretch.',
                carer: 'Wrapped up is the only way {he} stays asleep for more than ten minutes. {He} gets plenty of time to kick around when {he} is awake.'
            }
        ],
        little: [
            {
                parent: 'You cut {kid}\'s nap short again, and {he} was a wreck by supper. {He} needs {his} sleep at that age.',
                carer: 'If {he} sleeps all afternoon {he} is up half the night and keeps the others up too. A shorter nap means a better night for everybody.'
            },
            {
                parent: 'I don\'t like {kid} being kept at the table until {his} plate is clean. {He} knows when {he} is full.',
                carer: 'Food doesn\'t come easy out here, and {he} needs to learn that. {He} gets a small portion, and I only ask {him} to finish that much.'
            },
            {
                parent: 'I keep finding {kid} out in the yard with no shoes on. {He} is going to step on something.',
                carer: 'I check that yard every morning. Those shoes don\'t last long as it is, and {he} is happier and steadier on {his} feet without them.'
            }
        ],
        school: [
            {
                parent: '{kid} has been scrubbing pots every evening this week. {He} is a child, and {he} should get some time to be one.',
                carer: 'Everyone here takes a turn, and {he} is old enough to do {his} share. {He} still gets plenty of time to play once it\'s done.'
            },
            {
                parent: 'You let {kid} climb that old tree in the yard. {He} came home with both knees skinned, and {he} could have broken something.',
                carer: 'I was standing right underneath. {He} has to learn what {he} can and can\'t do, and I\'d rather it happen where I can see {him}.'
            },
            {
                parent: 'You took {kid}\'s book away at lights out. Of all the things to discourage, you picked reading?',
                carer: 'I\'m glad {he} likes to read, and {he} can have it back in the morning. {He} was nodding off over {his} breakfast, and by midday {he} was a misery to everyone.'
            }
        ],
        teen: [
            {
                parent: '{kid} is nearly grown, and you still have {him} in bed at the same hour as the younger ones. Give {him} some room.',
                carer: 'If {he} stays up, the rest of them want to know why they can\'t. {He} gets an extra half hour already, and that\'s as far as it goes while {he} sleeps in here.'
            },
            {
                parent: 'You have {kid} using the wood axe now? I never agreed to that.',
                carer: '{He} asked me to teach {him}, and {he} will need to know how sooner or later. I started {him} on small rounds and I stay right beside {him}.'
            },
            {
                parent: 'You keep leaving {kid} in charge of the little ones. That\'s your job, and {he} has {his} own life to get on with.',
                carer: 'It\'s an hour here and there, and it\'s good for {him}. {He} has grown up a lot since I started asking, and {he} told me {he} likes it.'
            }
        ]
    },

    /*
     * Rebellious teen. Each topic has what the player walks in on, then what each of them says.
     * lean is who has the better of it. Skipping is for school hours.
     */
    teenIssues: {
        teen: [
            {
                scene: '{kid} has lost {his} free evening for reading past lights out.',
                teen: 'I had the lamp turned down and I wasn\'t bothering anybody. You took away a whole evening over one book?',
                carer: 'The rule is lights out. If I let it go for you, I have to let it go for all of them.'
            },
            {
                scene: '{kid} has just been told to wash a stack of dishes over again, and from where you stand they look clean.',
                teen: 'There\'s nothing wrong with them! I did them right the first time. You just want me to be doing something.',
                carer: 'There\'s a smear on that top one. If a job is worth doing, it\'s worth doing properly.'
            },
            {
                scene: '{kid} is being blamed for a mess that, from the look of the small handprints all over it, one of the younger children made.',
                teen: 'I wasn\'t even in here! Ask anybody. Why is it always me?',
                carer: 'You were told to keep an eye on this room, so it comes back to you. Get the bucket.'
            }
        ],
        carer: [
            {
                scene: '{kid} was supposed to be watching the toddlers, and {he} wandered off and left them alone for most of an hour.',
                teen: 'They were fine! Nothing happened. I was only gone for a little while.',
                carer: 'You were gone for an hour, and nothing happening was pure luck. You gave me your word.'
            },
            {
                scene: '{kid} has been caught with a sack of food from the stores, on {his} way to share it with friends.',
                teen: 'It was only a bit of bread, and it\'s not like anyone was counting it.',
                carer: 'I count it. Everyone in this room eats out of that store, and you know exactly how short we get.'
            },
            {
                scene: '{kid} vanished all afternoon without telling anyone, and only just walked back in.',
                teen: 'I don\'t have to report to you every time I step outside. I\'m not a baby.',
                carer: 'I had two people out looking for you. There are things out there that would kill you, so yes, you do have to tell me.'
            }
        ],
        even: [
            {
                scene: '{kid} is refusing to go to bed when the younger children do.',
                teen: 'I\'m not tired, and I\'m not five. Why should I go to bed when they do?',
                carer: 'Because I have a room full of children to get down, and you keep them all awake. That\'s why.'
            },
            {
                scene: '{kid} has flatly refused {his} turn at the wash tub.',
                teen: 'I did it last time. And the time before that. Make somebody else do it for once.',
                carer: 'It\'s on the list and your name is next to it. I don\'t keep track of who did it when, I go by the list.'
            },
            {
                scene: '{kid} has been told off for teasing one of the younger kids and is answering back.',
                teen: 'It was a joke. They started it. You always take their side.',
                carer: 'I heard how you were talking to them. I don\'t care who started it. You\'re old enough to know better.'
            }
        ],
        skipping: [
            {
                scene: '{kid} should be in class right now, and {he} has been found behind the woodpile with a pack of cards.',
                teen: 'What\'s the point? I already know all that stuff. Nobody out there is going to ask me about sums.',
                carer: 'You\'ll be back at that desk in five minutes, and you can explain yourself to your teacher.'
            },
            {
                scene: '{kid} should be in class right now, and {he} is lying on a cot claiming a stomach ache, with a half-eaten apple in {his} hand.',
                teen: 'It came on really suddenly. I think I need to rest for the day.',
                carer: 'It came on right after breakfast, did it? And left you hungry enough for that? Up.'
            },
            {
                scene: '{kid} should be in class right now, and {he} strolled in as if it were a holiday.',
                teen: 'There was nothing happening today anyway. It\'s just review. It doesn\'t matter if I miss it.',
                carer: 'It matters if I say it matters. Your teacher is expecting you, and you know it.'
            }
        ],
        excused: [
            {
                scene: '{kid} has come back from school in the middle of the morning, and the caretaker has {him} by the sleeve, demanding to know why.',
                teen: 'The teacher sent me back for the box of chalk. I told you that! You can go and ask.',
                carer: 'I\'ve heard every excuse there is. You\'ll forgive me if I don\'t take your word for it.'
            },
            {
                scene: '{kid} has been found here during lessons, and {he} is carrying one of the younger children, who has a skinned knee.',
                teen: 'The little one fell on the way to school and wouldn\'t stop crying. What was I supposed to do, walk past?',
                carer: 'You were supposed to fetch an adult and then go to class. It\'s the third time you\'ve come up with a reason to miss lessons.'
            },
            {
                scene: '{kid} has been found here during lessons, pale and a little sweaty, and insists {he} was sent back because {he} felt ill.',
                teen: 'I was sick in the yard. I\'m not making it up. I feel terrible.',
                carer: 'You felt fine at breakfast. You always feel fine at breakfast.'
            }
        ]
    }
};
