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
            description: 'Removes duplicate from settler invemtory. 2 bows is not better than 1 bow.'
        },
        hunter: {
            name: 'Hunter with no bow',
            description: 'Hunter with no bow works as a woodcutter; Might get a axe.'
        }
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




