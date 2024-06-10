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
            description: 'Removes duplicates from settler inventory. 2 bows is not better than 1 bow.',
            help: 'When on:<ul>' +
                '<li>Prevents you from giving a settler duplicate items</li>' + 
                '<li>Morning check removes duplicates</li></ul>When off<ul>' +
                '<li>Morning check - other rules may remove duplicates relevant to the rule</li></ul>'
        },
        job: {
            name: 'Job change',
            description: 'When changing job (companions, assign to ...) give the settler a tool box for the new job and removes when unassigned.',
            help: 'When on: Toolbox with mandatory and optional tools for the job given when you assign to job and updated in the morning check<br/>When off: You have to do it yourselves!'
        },      

        hunter: {
            name: 'Hunter with no bow',
            description: 'Hunter with no bow works as a woodcutter; Might get an axe instead.',
            help: 'When off: Hunter with no bow does nothing'
        },
        streetworker: {
            name: 'Sex workers need rest',
            description: 'Very unhappy, sad street & nightclub workers takes a day off by themselves',
            help: ''
        },

        buttplug: {
            name: 'Butt plug rotation',
            description: 'Settlers trade butt plugs between them as needed, thoroughly cleaned of course ;-)',
            help: ''
        },
        condom: {
            name: 'Condom rotation',
            description: 'Gives condoms to girls who need it and removes from other. Only street workers gets condoms for now.',
            help: ''
        },
        dumbbell: {
            name: 'Dumbbell rotation',
            description: 'Gives dumbbells to low strength settlers (below 30) and removes from other.',
            help: ''
        },

        /*
                grouptalk: {
                    name: 'Group talk',
                    description: 'Talk with (almost) all persons in a group. Saves clicks only! (WIP, not in game yet)'
                },
        */
    },

    /**
     * Toolboxes for different jobs/assignemnt. Can be set here or as a tag
     * tool_<job> in "Inventory items.tw"
     */
    job_tools: {
        companion: ['knife', 'gas_mask', 'body_armor'],
        companion_slave: ['gas_mask'],
        forest: ['axe'],
        garden: [],
        guard: ['knife', 'body_armor'],
        hunter: ['bow'],
        kitchen: [],
        maid: [],
        mistress: [],
        nightclub: [],
        none: [],
        scavenging: ['knife', 'body_armor'],
        shop: [],
        teacher: [],
        streets: ['knife'],
        mc: ['knife', 'bow', 'gas_mask', 'axe', 'body_armor'],
    },

    _initDone: false,
    init: function() {
        if(this._initDone) {
            return;
        }

        // WORK 

        this._initDone = true;
        return;
    },
};