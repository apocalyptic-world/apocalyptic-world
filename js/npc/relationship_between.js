setup.relationshipBetween = {
    npc: null,
    guests: null,
    guests18yo: null,
    _init: function() {
          if (typeof this.npc.relationshipBetween === 'undefined') {
              this.npc.relationshipBetween = {
                  stats: {},
                  likes: null,
                  dislikes: [],
                  admirer: [],
                  tempAdmirer: [],
                  sharedEvents: {},
                  celebratedBirthday: null
              };
              console.log("Initialized relationship for:", this.npc.id);
          }
          // Initialize relationship with MC if not already present
          if (typeof this.npc.relationshipBetween.stats['mc'] === 'undefined') {
              this.npc.relationshipBetween.stats['mc'] = 0; // or some default value
              console.log("Initialized relationship with MC for:", this.npc.id);
          }
      },
    _ignore: function() {
        if (this.npc.assignedTo === 'mistress') {
            return true;
        }
        return false;
    },
    increaseByAssignedTo: function() {
        if (!this.npc.assignedTo) {
            console.warn(`NPC ${this.npc.id} does not have an assignedTo property.`);
            return; // Exit the function if assignedTo is null or undefined
        }
    
        console.log("Increasing relationships by assignment for:", this.npc.id);
        let colleagues = setup.getPersonsForLocation(variables().guests, this.npc.assignedTo);
    
        for (let i in colleagues) {
            let colleagueIndex = colleagues[i];
            let colleagueId = this.guests[colleagueIndex].id;
    
            this.npc.relationshipBetween.stats[colleagueId] ??= 0;
            this.npc.relationshipBetween.stats[colleagueId] = Math.min(
                (this.npc.relationshipBetween.stats[colleagueId] + 1),
                100
            );
    
            this.handleDislikes(); // Ensure dislikes are updated
        }
    },
   // handles stats for relationships formed outside of the job
   increaseByNotAssignedTo: function() {
        console.log(`Processing NotAssignedTo for ${this.npc.id}`);
        
        // Ensure relationshipBetween and stats are initialized
        if (!this.npc.relationshipBetween || !this.npc.relationshipBetween.stats) {
            console.warn(`NPC ${this.npc.id} does not have relationshipBetween or stats defined.`);
            return;
        }

        // Loop through existing relationships only
        let existingRelationships = Object.keys(this.npc.relationshipBetween.stats);
        
        for (let guestId of existingRelationships) {
            // Skip 'mc' when processing guests
            if (guestId === 'mc') {
                continue;
            }

            let guest = variables().guests.find(g => g.id === guestId);

            // Check if the guest is not assigned to the same job
            if (guest && guest.assignedTo !== this.npc.assignedTo) {
                this.npc.relationshipBetween.stats[guestId] = Math.min(
                    (this.npc.relationshipBetween.stats[guestId] + 1),
                    100
                );
                console.log(`Increased relationship between NotAssignedTo ${this.npc.id} and ${guestId} to ${this.npc.relationshipBetween.stats[guestId]}`);
            }
        }

        // Handle the relationship with MC separately for each NPC
        this.npc.relationshipBetween.stats['mc'] ??= 0;
        this.npc.relationshipBetween.stats['mc'] = Math.min(
            (this.npc.relationshipBetween.stats['mc'] + 1),
            100
        );
        console.log(`Increased relationship between NotAssignedTo ${this.npc.id} and mc to ${this.npc.relationshipBetween.stats['mc']}`);

        this.handleDislikes(); // Ensure dislikes are updated
    },
    increase: function(npcA, targetNpcs, amount) {
       this.npc = npcA;
       this._init(); // Ensure npcA is properly initialized
       console.log("Increasing relationships for:", npcA.id, "with targets:", targetNpcs, "by amount:", amount);
       for (let targetNpcId of targetNpcs) {
           if (!(targetNpcId in npcA.relationshipBetween.stats)) {
               npcA.relationshipBetween.stats[targetNpcId] = 0; // Initialize relationship stat if not present
               console.log("Initialized stat for target:", targetNpcId);
           }
           npcA.relationshipBetween.stats[targetNpcId] = Math.min(
               (npcA.relationshipBetween.stats[targetNpcId] + amount),
               100
           );
           console.log("Updated stat for target:", targetNpcId, "New value:", npcA.relationshipBetween.stats[targetNpcId]);
           this.handleDislikes(); // Ensure dislikes are updated
       }
   },
   decrease: function(npcA, targetNpcs, amount) {
    console.trace("Decrease called for:", npcA.id, "targets:", targetNpcs, "amount:", amount);
    this.npc = npcA;
    this._init(); // Ensure npcA is properly initialized
    for (let targetNpcId of targetNpcs) {
        npcA.relationshipBetween.stats[targetNpcId] ??= 0;
        npcA.relationshipBetween.stats[targetNpcId] = Math.max(
            (npcA.relationshipBetween.stats[targetNpcId] - amount),
            -100
        );
        console.log("Updated stat for target:", targetNpcId, "New value:", npcA.relationshipBetween.stats[targetNpcId]);
        this.handleDislikes(); // Ensure dislikes are updated
    }
},
    setLike: function() {
        //console.log("Setting like for:", this.npc.id);
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
        console.log("Running daily routine");
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
    
            // Ensure relationshipBetween and stats are initialized
            if (this.npc.relationshipBetween && this.npc.relationshipBetween.stats) {
                this.increaseByNotAssignedTo();
            } else {
                console.warn(`NPC ${this.npc.id} does not have relationshipBetween or stats defined.`);
            }
    
            if (setup.percentageChance(5) && this.npc.relationshipBetween.likes === null) {
                this.setLike()
            }
        }
    
        let end = Date.now() - start;
    
        this.getMatches();
        console.log("Relationships run: " + end + " milliseconds");
    },
    getMatches: function() {
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
                _matchesBetween.push([_npc1Id, _npc2Id]);
                delete _matches[_npc2Id];
            }
        }

        return _matchesBetween;
    },

    // New functions added below

    handleDislikes: function() {
        if (!this.npc.relationshipBetween.dislikes) {
            this.npc.relationshipBetween.dislikes = [];
        }
        for (let targetNpcId in this.npc.relationshipBetween.stats) {
            if (this.npc.relationshipBetween.stats[targetNpcId] < -10) {
                if (!this.npc.relationshipBetween.dislikes.includes(targetNpcId)) {
                    this.npc.relationshipBetween.dislikes.push(targetNpcId);
                }
            } else {
                if (this.npc.relationshipBetween.dislikes && this.npc.relationshipBetween.dislikes.indexOf) {
                    let index = this.npc.relationshipBetween.dislikes.indexOf(targetNpcId);
                    if (index !== -1) {
                        this.npc.relationshipBetween.dislikes.splice(index, 1);
                    }
                }
            }
        }
    },
    formFriendshipOutsideAssignment: function(npcA, npcB) {
        npcA.relationshipBetween.stats[npcB.id] ??= 0;
        npcB.relationshipBetween.stats[npcA.id] ??= 0;
        npcA.relationshipBetween.stats[npcB.id] += 5;
        npcB.relationshipBetween.stats[npcA.id] += 5;
        this.handleDislikes(); // Ensure dislikes are updated
    },
    setBFF: function(npcA, npcB) {
        if (npcA.relationshipBetween.stats[npcB.id] >= 100 && npcB.relationshipBetween.stats[npcA.id] >= 100) {
            npcA.relationshipBetween.bff = npcB.id;
            npcB.relationshipBetween.bff = npcA.id;
        }
    },
    handleGroupActivity: function(npcGroup) {
       if (!npcGroup || npcGroup.length < 2) {
           console.error("Not enough NPCs for group activity.");
           return;
       }

       let groupSize = npcGroup.length;
       for (let i = 0; i < groupSize; i++) {
           let npcA = npcGroup[i];
           if (!npcA.relationshipBetween) {
               npcA.relationshipBetween = { stats: {}, likes: null, dislikes: [], admirer: [], sharedEvents: {} };
           }
           for (let j = 0; j < groupSize; j++) {
               if (i !== j) {
                   let npcB = npcGroup[j];
                   if (!npcB.relationshipBetween) {
                       npcB.relationshipBetween = { stats: {}, likes: null, dislikes: [], admirer: [], sharedEvents: {} };
                   }
                   npcA.relationshipBetween.stats[npcB.id] ??= 0;
                   npcB.relationshipBetween.stats[npcA.id] ??= 0;
                   npcA.relationshipBetween.stats[npcB.id] += 5;
                   npcB.relationshipBetween.stats[npcA.id] += 5;
                   npcA.relationshipBetween.sharedEvents[npcB.id] = (npcA.relationshipBetween.sharedEvents[npcB.id] || 0) + 1;
                   npcB.relationshipBetween.sharedEvents[npcA.id] = (npcB.relationshipBetween.sharedEvents[npcA.id] || 0) + 1;
                   console.log(`Shared events between ${npcA.id} and ${npcB.id}: ${npcA.relationshipBetween.sharedEvents[npcB.id]}`);
                   this.handleDislikes(); // Ensure dislikes are updated
               }
           }
       }
   },
   addToTempAdmirer: function(npcA, npcB) {
       // Ensure npcA is not adding itself as an admirer
       if (npcA.id === npcB.id) {
           return;
       }

       if (!npcA.relationshipBetween.tempAdmirer) {
           npcA.relationshipBetween.tempAdmirer = [];
       }

       // Check if npcB is already in the tempAdmirer list
       if (!npcA.relationshipBetween.tempAdmirer.some(admirer => admirer.id === npcB.id)) {
           let initialStat = 10;
           if (npcA.relationshipBetween.likes === npcB.id) {
               initialStat = 20;
           }
           npcA.relationshipBetween.tempAdmirer.push({ id: npcB.id, stat: initialStat });
           console.log(npcB.id + " has been added as a temporary admirer of " + npcA.id + " with an initial stat of " + initialStat);
       }
   },

   checkAdmirer: function(npcA) {
       if (npcA.relationshipBetween.tempAdmirer && npcA.relationshipBetween.tempAdmirer.length > 0) {
           let potentialAdmirers = [];
           for (let admirer of npcA.relationshipBetween.tempAdmirer) {
               if (admirer.stat >= 100) {
                   potentialAdmirers.push(admirer.id);
               } else {
                   // Update the stat in the tempAdmirer list
                   admirer.stat += 5; // Example increment, adjust as necessary
                   console.log("Updated admiration stat for " + admirer.id + " to " + admirer.stat);
               }
           }
           if (potentialAdmirers.length > 0) {
               let selectedAdmirerId = potentialAdmirers[Math.floor(Math.random() * potentialAdmirers.length)];
               npcA.relationshipBetween.admirer = selectedAdmirerId;
               console.log(selectedAdmirerId + " has been selected as the official admirer of " + npcA.id);
               npcA.relationshipBetween.tempAdmirer = []; // Clear the tempAdmirer list after selection
           }
       }

       // Additionally, check the official admirer list if needed
       if (npcA.relationshipBetween.admirer && npcA.relationshipBetween.admirer.length > 0) {
           for (let admirerId of npcA.relationshipBetween.admirer) {
               if (npcA.relationshipBetween.stats[admirerId] >= 100) {
                   let admirerNpc = setup.getNpcById(admirerId);
                   this.transitionToNewPartner(npcA, admirerNpc);
                   break; // Transition to a new partner and stop further checks
               }
           }
       }
   },
   checkAndSelectAdmirer: function(npcA) {
       console.log("Checking and selecting admirers for:", npcA.id);

       if (!npcA.relationshipBetween.tempAdmirer) {
           console.log("No tempAdmirers to check.");
           return;
       }

       let potentialAdmirers = [];
       for (let admirer of npcA.relationshipBetween.tempAdmirer) {
           if (admirer.stat >= 100) {
               potentialAdmirers.push(admirer.id);
           } else {
               admirer.stat += 5;
               console.log("Updated admiration stat for " + admirer.id + " to " + admirer.stat);
           }
       }

       if (potentialAdmirers.length > 0) {
           let selectedAdmirerId = potentialAdmirers[Math.floor(Math.random() * potentialAdmirers.length)];
           npcA.relationshipBetween.admirer = selectedAdmirerId;
           console.log(selectedAdmirerId + " has been selected as the official admirer of " + npcA.id);
           npcA.relationshipBetween.tempAdmirer = [];
       }
   },
   setAdmirer: function(npcA, npcB) {
       if (!npcA.relationshipBetween.admirer) {
           npcA.relationshipBetween.admirer = [];
       }
       if (!npcA.relationshipBetween.admirer.includes(npcB.id)) {
           npcA.relationshipBetween.admirer.push(npcB.id);
           console.log(npcA.id + " has added " + npcB.id + " as an admirer.");
       }
   },
   transitionToNewPartner: function(npcA, npcB) {
        if (npcA.relationshipBetween.likes) {
            this.initiateDivorce(npcA, setup.getNpcById(npcA.relationshipBetween.likes));
        }



        npcA.relationshipBetween.likes = npcB.id;
        npcB.relationshipBetween.likes = npcA.id;
        npcA.relationshipBetween.admirer = []; // Reset admirers after transition
    },
    initiateDivorce: function(npcA, npcB) {
        if (npcA && npcB) {
            npcA.relationshipBetween.likes = null;
            npcB.relationshipBetween.likes = null;

            if (npcA.relationshipBetween.bff === npcB.id) {
                npcA.relationshipBetween.bff = null;
            }
            if (npcB.relationshipBetween.bff === npcA.id) {
                npcB.relationshipBetween.bff = null;
            }

            npcA.relationshipBetween.stats[npcB.id] = -100;
            npcB.relationshipBetween.stats[npcA.id] = -100;

            console.log(`${npcA.id} and ${npcB.id} have divorced.`);
        }
    },
    // Used to manage birthday relationships
    adjustForBirthday: function() {
       if (this.npc.relationshipBetween.celebratedBirthday === true) {
           // Increase relationship if birthday was celebrated
           if (typeof this.npc.relationshipBetween.stats['mc'] !== 'undefined') {
               this.npc.relationshipBetween.stats['mc'] = Math.min(
                   this.npc.relationshipBetween.stats['mc'] + 10,
                   100
               );
           }
       } else if (this.npc.relationshipBetween.celebratedBirthday === false) {
           // Decrease relationship if birthday was not celebrated
           if (typeof this.npc.relationshipBetween.stats['mc'] !== 'undefined') {
               this.npc.relationshipBetween.stats['mc'] = Math.max(
                   this.npc.relationshipBetween.stats['mc'] - 10,
                   -100
               );
           }
       }
       console.log(`After adjustment for ${this.npc.id}: relationship with mc = ${this.npc.relationshipBetween.stats['mc']}`);
       // Reset birthday celebration status
       delete this.npc.relationshipBetween.celebratedBirthday;
   },

   checkBirthdays: function() {
    console.log("Checking birthdays for all guests.");
    this.guests = variables().guests;
    let guestsCount = this.guests.length;
    let currentDate = new Date(variables().gameDate);
    let yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    console.log("Current date:", currentDate);
    console.log("Yesterday's date:", yesterday);

    for (let i = 0; i < guestsCount; i++) {
        this.npc = this.guests[i];
        this._init();

        // Ensure birthDate exists and is valid
        if (!this.npc.birthDate) {
            console.warn(`Guest ${this.npc.id} does not have a birth date set.`);
            continue;
        }

        let birthDate = new Date(this.npc.birthDate);
        if (isNaN(birthDate)) {
            console.error(`Invalid birth date for guest ${this.npc.id}:`, this.npc.birthDate);
            continue;
        }

        //console.log(`Checking guest ${this.npc.id} with birth date: ${birthDate}`);
        if (birthDate.getDate() === yesterday.getDate() && birthDate.getMonth() === yesterday.getMonth()) {
            this.adjustForBirthday();
        }
    }
},
    // Used to create shared events and keep count of number of events
    trackSharedEventForGroup: function(npcGroup) {
       for (let i = 0; i < npcGroup.length; i++) {
           for (let j = i + 1; j < npcGroup.length; j++) {
               let npcA = npcGroup[i];
               let npcB = npcGroup[j];

               if (!npcA.relationshipBetween.sharedEvents) {
                   npcA.relationshipBetween.sharedEvents = {};
               }
               if (!npcB.relationshipBetween.sharedEvents) {
                   npcB.relationshipBetween.sharedEvents = {};
               }

               if (!npcA.relationshipBetween.sharedEvents[npcB.id]) {
                   npcA.relationshipBetween.sharedEvents[npcB.id] = 0;
               }
               if (!npcB.relationshipBetween.sharedEvents[npcA.id]) {
                   npcB.relationshipBetween.sharedEvents[npcA.id] = 0;
               }

               npcA.relationshipBetween.sharedEvents[npcB.id]++;
               npcB.relationshipBetween.sharedEvents[npcA.id]++;

               console.log(`Shared events between ${npcA.id} and ${npcB.id}: ${npcA.relationshipBetween.sharedEvents[npcB.id]}`);
           }
       }
   }
};