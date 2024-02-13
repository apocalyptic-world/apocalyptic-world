/* game modification support */
setup.automatization = {
    rule: {
/*
        add: {
            name: 'Add',
            description: 'Add job tools to settlers, while stocks last. {}'
        },
        subtract: {
            name: 'Subtract',
            description: 'Add and remove job tools on settlers {}'
        },
*/
        dup: {
            name: 'No duplicates',
            description: 'Removes duplicates from settler inventory. 2 bows is not better than 1 bow.'
        },
        job: {
            name: 'Job change',
            description: 'When changing job (companions, assign to ...) give the settler a tool box for the new job.'
        },

        hunter: {
            name: 'Hunter with no bow',
            description: 'Hunter with no bow works as a woodcutter; Might get an axe instead.'
        },
        streetworker: {
            name: 'Streetworkers need rest',
            description: 'Very unhappy, sad street workers takes a day off by themselves'
        },

        buttplug: {
            name: 'Buttplug rotation',
            description: 'Settlers trade buttplugs between them as needed, thoroughly cleaned of course ;-)'
        },
        condom: {
            name: 'Condom rotation',
            description: 'Gives condoms to girls who need it and removes from other. Only streetworkers gets condoms for now.'
        },
        dumbbell: {
            name: 'Dumbbell rotation',
            description: 'Gives dumbbbels to low strength settlers (below 30) and removes from other.'
        },

/*
        grouptalk: {
            name: 'Group talk',
            description: 'Talk with (almost) all persons in a group. Saves clicks only! (WIP, not in game yet)'
        },
*/
    },

    job_tools: {
        companion:  ['knife', 'gas_mask'],
        forest:     ['axe'],
        garden:     [],
        guard:      ['knife'],
        hunter:     ['bow'],
        kitchen:    [],
        maid:       [],
        mistress:   [],
        none:       [],
        scavenging: ['knife'],
        shop:       [],
        streets:    ['knife'],
        mc:         ['knife', 'bow', 'gas_mask', 'axe'],
    }
};




