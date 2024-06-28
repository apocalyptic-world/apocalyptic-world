
/**
 * useful stuff for the help "sub-system"
 */
setup.help = {

    _skills: {
        /*
        <dt>Gardener  </dt><dd>Gives bonus food while assigned to garden/greenhouse. <span style="color: green">Learnable</span></dd>
        */
       cook: {
        /* name and desc from setup.skills */
        learnable: true,
        xtra: 'Useable only in kitchen assignment.',
       },
       doctor: {
        /* name from setup.skills */
        desc: 'A must skill to work in the hospital. Decreases chance of miscarriage, treats knife wounds and reduces sickdays',
        learnable: false,
        xtra: 'Without hospital, any guest with doctor skill will step in as doctor when needed.',
       },
       gardener: {
        /* name from setup.skills */
        desc: 'Gives bonus food while assigned to garden/greenhouse.',
        learnable: true,
        xtra: '',
       },
       sadistic: {
        name: 'Sadistic',
        desc: 'Not a skill but a trait. A must for the mistress job.',
        learnable: false,
        xtra: '',
       },
       scavenger: {
        /* name and desc from setup.skills */
        learnable: true,
        xtra: '',
       },
       shopkeeper: {
        /* name and desc from setup.skills */
        learnable: false,
        xtra: '',
       },
       teacher: {
        /* name and desc from setup.skills */
        /* learnable: ?, */
        xtra: '(No use yet)',
       },
       woodcraft: {
        /* name and desc from setup.skills */
        learnable: true,
        xtra: 'Required for the hunters.',
       },
    },
    _skillsOk: false,
    /**
     * Important skills and traits
     * @returns 
     */
    skills: function() {
        if(!this._skillsOk) {
            for(const skillID in setup.skills) {
                const skill = setup.skills[skillID];
                this._skills[skillID] ??= {};
                this._skills[skillID].name ??= skill.title;
                this._skills[skillID].desc ??= skill.description;
            }
            this._skillsOk = true;
        }
        return this._skills;
    },

};