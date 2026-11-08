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

    /* A like above this makes someone a close friend */
    CLOSE_FRIEND: 50,

    /* What friends lose when a guest leaves, as [friend, close friend]. happy is their happiness, trust their relationship with the MC. */
    departures: {
        killed:         { happy: [50, 80] },
        handed_over:    { happy: [50, 80], trust: [25, 50] },
        lost:           { happy: [40, 65] },
        thrown_out:     { happy: [25, 40] },
        betrayed:       { happy: [20, 35] },
        neglected:      { happy: [20, 35] },
        captured:       { happy: [15, 30] },
        marriage_ended: { happy: [15, 30] },
        walked_out:     { happy: [10, 20] },
        punished:       { happy: [10, 20] }, // a basement move her own actions earned
        moved:          { happy: [0, 5] },
        already_counted: { happy: [0, 0] }   // left with someone else, see reactToCoupleDeparture
    },

    /* Happiness change for friends when a captured guest's fate is settled, as [friend, close friend]. captured + abandoned adds up to killed. */
    CAPTURE_RESCUED: [15, 30],
    CAPTURE_ABANDONED: [35, 50],

    /* What a mother loses when her child is sold */
    CHILD_SOLD_HAPPY: 100,
    CHILD_SOLD_RELATIONSHIP: 100,

    /* Everyone on good terms with this NPC, as { npc, like }. Scores are per direction, so this reads what each of them thinks of her, not what she thinks of them. */
    friendsOf: function(target) {
        const sv = variables();
        const people = [...(sv.slaves ?? []), ...(sv.guests ?? []), ...(sv.nursery ?? []), ...Object.values(sv.characters ?? {})];
        return people
            .filter(person => person.id !== target.id && (person.relationshipBetween?.stats?.[target.id] ?? 0) > 0)
            .map(person => ({ npc: person, like: person.relationshipBetween.stats[target.id] }));
    },

    /* Friends react to one guest or several leaving; departure is a key of departures. Leaving together is one event: each friend reacts once, by her closer tie. */
    reactToDeparture: function(targets, departure) {
        const leaving = [].concat(targets).filter(Boolean);
        const reaction = this.departures[departure] ?? this.departures.walked_out;
        const closest = new Map();
        for (const target of leaving) {
            for (const friend of this.friendsOf(target)) {
                if (!leaving.some(person => person.id === friend.npc.id)) {
                    closest.set(friend.npc, Math.max(closest.get(friend.npc) ?? 0, friend.like));
                }
            }
        }
        for (const [npc, like] of closest) {
            const tier = like > this.CLOSE_FRIEND ? 1 : 0;
            npc.happy = Math.max(-100, (npc.happy ?? 0) - reaction.happy[tier]);
            if (reaction.trust) {
                npc.relationship = Math.max(-100, (npc.relationship ?? 0) - reaction.trust[tier]);
            }
        }
    },

    /* A couple leaving together. Slave spouses are left out, as slave removals have no impact. Remove each of them afterwards with 'already_counted'. */
    reactToCoupleDeparture: function(husband, wife, departure) {
        const guests = variables().guests ?? [];
        this.reactToDeparture([husband, wife].filter(npc => guests.some(guest => guest.id === npc?.id)), departure);
    },

    /* Friends react once a captured guest's fate is settled */
    reactToCaptureResolved: function(target, rescued) {
        for (const friend of this.friendsOf(target)) {
            const tier = friend.like > this.CLOSE_FRIEND ? 1 : 0;
            const change = rescued ? this.CAPTURE_RESCUED[tier] : -this.CAPTURE_ABANDONED[tier];
            friend.npc.happy = Math.max(-100, Math.min(100, (friend.npc.happy ?? 0) + change));
        }
    },

    /* The mother of a child sold to the baby merchant, if she is still around */
    reactToChildSold: function(child) {
        const motherId = child?.family?.mother;
        const mother = motherId && motherId !== 'mc' ? setup.getNpcById(motherId) : null;
        if (!mother) {
            return;
        }
        mother.happy = Math.max(-100, (mother.happy ?? 0) - this.CHILD_SOLD_HAPPY);
        mother.relationship = Math.max(-100, (mother.relationship ?? 0) - this.CHILD_SOLD_RELATIONSHIP);
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
            // Guests only: likes feed the guest wedding matcher, and a like on a slave (possible via night school) would never be returned or cleared
            let targetNpc = (variables().guests ?? []).find(g => String(g.id) === String(targetNpcId));
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

                // Only male and female for now; id1 must be the male (proposer)
                if (npc1.gender + npc2.gender !== 1) {
                    continue;
                }

                if ((npc1.traits ?? []).includes('feral') || (npc2.traits ?? []).includes('feral')) {
                    continue;
                }

                const maleId   = npc1.gender === 1 ? _npc1Id : _npc2Id;
                const femaleId = npc1.gender === 1 ? _npc2Id : _npc1Id;
                _matchesBetween.push([maleId, femaleId]);
            }
        }

        return _matchesBetween;
    }

};