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
      help:
        'When on:<ul>' +
        '<li>Prevents you from giving a settler duplicate items</li>' +
        '<li>Morning check removes duplicates</li></ul>When off<ul>' +
        '<li>Morning check - other rules may remove duplicates relevant to the rule</li></ul>',
    },
    job: {
      name: 'Job change',
      description:
        'When changing job (companions, assign to ...) give the settler a tool box for the new job and removes when unassigned.',
      help: 'When on: Toolbox with mandatory and optional tools for the job given when you assign to job and updated in the morning check<br/>When off: You have to do it yourselves!',
    },

    hunter: {
      name: 'Hunter with no bow',
      description: 'Hunter with no bow works as a woodcutter; Might get an axe instead.',
      help: 'When off: Hunter with no bow does nothing',
    },
    streetworker: {
      name: 'People in unhappy jobs need rest',
      description: 'People with jobs that make them unhappy needs rest. If the happyness falls below some happiness value then they takes a day off by themselves',
      help: 'This includes dairy cattle, sex workers on the street & nightclub',
    },

    buttplug: {
      name: 'Butt plug rotation',
      description: 'Settlers trade butt plugs between them as needed, thoroughly cleaned of course ;-)',
      help: 'When on: Removes buttplug when anal score >= 20; Adds buttplug if submission >= 20 & anal < 20 ',
    },
    condom: {
      name: 'Condom rotation',
      description:
        'Gives condoms to girls who need it and removes from other. Only street workers gets condoms for now.',
      help: '',
    },
    dumbbell: {
      name: 'Dumbbell rotation',
      description: 'Gives dumbbells/dumberbells/dumbestbells to settlers that benefit and removes from other.',
      help: 'Dumbbell works for strength below 30, dumberbells 50 and dumbestbells 60',
    },

    /*
                grouptalk: {
                    name: 'Group talk',
                    description: 'Talk with (almost) all persons in a group. Saves clicks only! (WIP, not in game yet)'
                },
        */
  },

  /**
   * Toolboxes for different jobs/assignment. Can be set here or as a tag
   * tool_<job> in "Inventory items.tw" -- To be worked on later
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
  init: function () {
    if (this._initDone) {
      return;
    }
    // WORK
    this._initDone = true;
    return;
  },

  /**
   * for happyIcons on automatization tab and happyness for taking a day off...
   */
  sexworker_levels: {
    off: [],
    very_sad: ['very_sad'],
    sad: ['very_sad', 'sad'],
    normal: ['very_sad', 'sad', 'normal'],
    happy: ['very_sad', 'sad', 'normal', 'happy'],
    very_happy: ['very_sad', 'sad', 'normal', 'happy', 'very_happy'],
  },

  sexworkerDayOffText: {
    off: 'Off - No sexworkers or dairy cattle takes a day off by themselves',
    very_sad: 'Very sad, dairy cattle, unhappy street & nightclub workers takes a day off by themselves',
    sad: 'Sad dairy cattle, unhappy street & nightclub workers takes a day off by themselves',
    normal: 'Sad and normal-happy dairy cattle, street & nightclub workers takes a day off by themselves',
    happy: 'All but very happy dairy cattle, street & nightclub workers takes a day off by themselves',
    very_happy: 'On - All dairy cattle & sexworkers will take a day off themselves all the time',
  },

  /**
   *
   * @param {*} npc
   * @returns boolean
   */
  sexworkerDayOffCheck: function (npc) {
    const _streetworkerSettings = variables().automatization.streetworker ?? 0;
    const rulelevel = parseInt(_streetworkerSettings * 1);
    const autolevel = ['off', 'very_sad', 'sad', 'normal', 'happy', 'very_happy'][rulelevel];
    const happylevel = setup.automatization.sexworker_levels[autolevel];
    return happylevel.includes(setup.getNpcHappyLevel(npc));
  },

  buttplugGender: ['Women', 'Men', 'Trans women', 'Trans men', 'Other'],
};
