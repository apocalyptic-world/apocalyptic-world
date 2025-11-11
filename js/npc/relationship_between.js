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

    increaseByParty: function() 
    {
        for (let _guestI in this.guests) {
            let _guest = this.guests[_guestI];
            if (this.npc.id === _guest.id) {
                continue;
            }

            this.npc.relationshipBetween.stats[_guest.id]??=0;
            this.npc.relationshipBetween.stats[_guest.id] = Math.min(
                (this.npc.relationshipBetween.stats[_guest.id] + randomInteger(-5, 10)),
                100
            );
        }
    },

    increaseByAssignedTo: function() 
    {
        let colleagues = setup.getPersonsForLocation(variables().guests, this.npc.assignedTo);
        for (let i in colleagues) {
            let colleagueIndex = colleagues[i];
            if (this.npc.id === this.guests[colleagueIndex].id) {
                delete this.npc.relationshipBetween.stats[this.guests[colleagueIndex].id];
                continue;
            }

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

    setDislike: function() {
        let dislikeableGuests = [];

        for (let targetNpcId in this.npc.relationshipBetween.stats) {
            let stat = this.npc.relationshipBetween.stats[targetNpcId];
            let targetNpc = setup.getNpcById(targetNpcId);

            if (targetNpc && stat <= -70) {
                dislikeableGuests.push(targetNpcId);
            }
        }

        if (!dislikeableGuests.length) {
            return;
        }

        this.npc.relationshipBetween.dislikes = setup.getRandomElement(dislikeableGuests);
    },

    run: function() {
        let start = Date.now();
        this.guests = variables().guests;
        let guestsCount = this.guests.length;
    
        for (let i = 0; i < guestsCount; i++) {
            this.npc = this.guests[i];
            this._init();
            if (this._ignore()) {
                continue;
            }
            if (this.npc.assignedTo) {
                this.increaseByAssignedTo();
            }

            if (this.npc.relationshipBetween.likes !== null && this.npc.relationshipBetween.likes === this.npc.id) {
                delete this.npc.relationshipBetween.likes;
            }
            if (setup.percentageChance(5) && this.npc.relationshipBetween.likes === null) {
                this.setLike();
            }
        }

        let end = Date.now() - start;

        this.getMatches();
    },

    runParty: function() {
        let start = Date.now();
        this.guests = variables().guests;
        let guestsCount = this.guests.length;
    
        for (let i = 0; i < guestsCount; i++) {
            this.npc = this.guests[i];
            this._init();
            this.increaseByParty();

            if (this.npc.relationshipBetween.likes !== null && this.npc.relationshipBetween.likes === this.npc.id) {
                delete this.npc.relationshipBetween.likes;
            }
            if (setup.percentageChance(5) && this.npc.relationshipBetween.likes === null) {
                this.setLike();
            }
            if (setup.percentageChance(5) && this.npc.relationshipBetween.dislikes === null) {
                this.setDislike();
            }
        }

        let end = Date.now() - start;
    },

    getMatches: function(notMarried) {
        this.guests = variables().guests;
        let guestsCount = this.guests.length;
    
        let _matches = {};
        for (let i = 0; i < guestsCount; i++) {
            this.npc = this.guests[i];
            if (this.npc?.relationshipBetween?.likes) {
                _matches[this.npc.id] = this.npc.relationshipBetween.likes;
            }
        }

        let _matchesBetween = [];
        for (let _npc1Id in _matches) {
            let _npc2Id = _matches[_npc1Id];
            if ((_matches[_npc2Id] ?? false) === _npc1Id) {
                const npc1 = setup.getNpcById(_npc1Id);
                const npc2 = setup.getNpcById(_npc2Id);

                delete _matches[_npc2Id];

                if (notMarried && (npc1.married || npc2.married)) {
                    continue;
                }

                // Only male and female for now
                if (npc1.gender !== 1 || npc2.gender !== 0) {
                    continue;
                }

                _matchesBetween.push([_npc1Id, _npc2Id]);
            }
        }

        return _matchesBetween;
    }

};