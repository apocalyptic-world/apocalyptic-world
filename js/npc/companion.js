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
     * All companions who has a certain skill
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
            const npc = variables()[list][index] ?? {};
            if ((npc.skills ?? []).includes(skill)) {
                skilledCompanions.push(npc);
            }
        }
        return skilledCompanions;
    },

    /**
     * all doctors
     * @param {companion} companions 
     * @returns  [npc]  npcs
     */
    getDoctors: function(companions = variables().player.companions) {
        return setup.companions.getBySkill(companions, 'doctor');
    },

    /**
     * count companions
     * @param {companion}   companions 
     * @returns {int} number of companions
     */
    count: function(companions = variables().player.companions) {
        return Object.keys(companions).length;
    },

    /**
     * Check if the companions in the list is valid or not
     * @param {companion} companions 
     * @returns {boolean}      valid list or not
     */
    check: function(companions = variables().player.companions) {
        for(const companionKey in companions) {
            const splitKey = companionKey.split(':');
            const list = splitKey[0] + 's'; // guests or slaves
            const index = splitKey[1];
            const npc = variables()[list][index];
            if (typeof npc === 'undefined') {
                return false;
            }
        }
        return true;
    },

    /**
     * check if we have the right number of companions with right strength
     * @param {companion} companions 
     * @param {int}       amount        number of companions
     * @param {int}       minstrength   minimium strength needed
     * @returns {boolean}
     */
    sanctuary_infiltration: function(companions = variables().player.companions, amount = 4, minstrength = 40) {
        if(setup.companions.count(companions) !== amount ) {
            return false;
        }
        for(const companionKey in companions) {
            const splitKey = companionKey.split(':');
            const list = splitKey[0] + 's'; // guests or slaves
            const index = splitKey[1];
            const npc = variables()[list][index] ?? {};
            if ((npc.strength ?? 0) < minstrength) {
                return false;
            }
        }
        return true;
    }
};