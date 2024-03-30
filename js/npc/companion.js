setup.companionGet = function(key)
{
    var splitKey = key.split(':');
    if (splitKey[0] === 'guest') {
        return variables().guests[splitKey[1]];
    }

    return variables().slaves[splitKey[1]];
};

/**
 * "namespace" for companions-list help functions
 */
setup.companions = {
    /**
     * All companions who has a certain skills
     * @param {companion} companions
     * @param {string} skill                   
     * @returns [npc]  npcs                      
     */
    getBySkill: function(companions = variables().player.companions, skill = '') {
        const skilledCompanions = [];
        for(const companionKey in companions) {
            const splitKey = companionKey.split(':');
            const list = splitKey[0] + 's'; // guests or slaves
            const index = splitKey[1];
            const npc = variables()[list][index];
            if ((npc.skills ?? []).includes('doctor')) {
                skilledCompanions.push(npc);
            }
        }
        return skilledCompanions;
    },

    /**
     * all doctors
     * @param {companions} companions 
     * @returns  [npc]  npcs
     */
    getDoctors: function(companions = variables().player.companions) {
        return setup.companions.getBySkill(companions, 'doctor');
    },

    /**
     * count companions
     * @param {companions}   companions 
     * @returns {int} number of companions
     */
    count: function(companions = variables().player.companions) {
        return Object.keys(companions).length;
    },
};