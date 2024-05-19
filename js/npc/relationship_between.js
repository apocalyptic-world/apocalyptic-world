setup.relationshipBetween = {
    npc: null,
    guests: null,
    guests18yo: null,
    _init: function() {
        if (typeof this.npc.relationshipBetween === 'undefined') {
            this.npc.relationshipBetween = {
                stats: {},
                likes: null,
                dislikes: []
            };
        }
    },
    _ignore: function() {
        if (this.npc.assignedTo === 'mistress') {
            return true;
        }

        return false;
    },

    increaseByAssignedTo: function() 
    {
        let colleagues = setup.getPersonsForLocation(variables().guests, this.npc.assignedTo);
        for (let i in colleagues) {
            let colleagueIndex = colleagues[i];
            this.npc.relationshipBetween.stats[this.guests[colleagueIndex].id]??=0;
            this.npc.relationshipBetween.stats[this.guests[colleagueIndex].id] = Math.min(
                (this.npc.relationshipBetween.stats[this.guests[colleagueIndex].id] + 1),
                100
            );
        }
    },

    setLike: function() {
        let likeableGuests = [];
        for (let targetNpcId in this.npc.relationshipBetween.stats) {
            let targetNpc = setup.getNpcById(targetNpcId);
            if (targetNpc && this.npc.relationshipBetween.stats[targetNpcId] === 100 && (
                (this.npc.likesGirls && targetNpc.gender === 0) || 
                (this.npc.likesGuys && targetNpc.gender === 1) || 
                (this.npc.likesTGirls && targetNpc.gender === 2)
            )) {
                likeableGuests.push(targetNpcId);
            }
        }

        if (!likeableGuests.length) {
            return;
        }

        this.npc.relationshipBetween.likes = setup.getRandomElement(likeableGuests);
    },

    run: function() {
        let start = Date.now();
        this.guests = variables().guests;
        this.guests18yo = setup.getAvailablePersons18yo(variables().guests);
        for (let i = 0; i < variables().guests.length; i++) {
            this.npc = variables().guests[i];
            this._init();
            if (this._ignore()) {
                continue;
            }
            if (this.npc.assignedTo) {
                this.increaseByAssignedTo();
            }

            if (setup.percentageChance(5) && this.npc.relationshipBetween.likes === null) {
                this.setLike()
            }
        }

        let end = Date.now() - start;
        console.log("Relationships run: " + end + " milliseconds");
    }
};