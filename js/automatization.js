/* game modification support */
setup.automatization = {
    rule: {
        add: {
            name: 'Add',
            description: 'Add job tools to settlers, while stocks last.'
        },
        subtract: {
            name: 'Subtract',
            description: 'Add and remove job tools on settlers'
        },
        job: {
            name: 'Job change',
            description: 'When changing job (companions, assign to ...) update the settlers inventory.'
        },
        dup: {
            name: 'No duplicates',
            description: 'Removes duplicates from settler inventory. 2 bows is not better than 1 bow.'
        },
        hunter: {
            name: 'Hunter with no bow',
            description: 'Hunter with no bow works as a woodcutter; Might get an axe.'
        },
        streetworker: {
            name: 'Streetworkers need rest',
            description: 'Very unhappy, sad street workers takes a day off by themselves'
        },
        grouptalk: {
            name: 'Group talk',
            description: 'Talk with (almost) all persons in a group. Saves clicks only! (WIP, not in game yet)'
        },
        buttplug: {
            name: 'Buttplug rotation',
            description: 'Settlers trade buttplugs between then as needed, thoroughly cleaned of course ;-)'
        },
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




