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
                  admirer: null,
                  tempAdmirer: [],
                  sharedEvents: {},
                  ncpSCream: {},
                  celebratedBirthday: null,
                  bff: null
              };
              console.log("Initialized relationship for:", this.npc.id);
          }
          // Initialize relationship with MC if not already present
          if (typeof this.npc.relationshipBetween.stats['mc'] === 'undefined') {
              this.npc.relationshipBetween.stats['mc'] = 0; // or some default value
              console.log("Initialized relationship with MC for:", this.npc.id);
          }
          // Check if the family object exists before trying to access its properties
            if (this.npc.family) {
                // Initialize relationship stat with the spouse if married
                let spouseId = this.npc.family.husband || (this.npc.family.wives && this.npc.family.wives[0]);
                if (spouseId && typeof this.npc.relationshipBetween.stats[spouseId] === 'undefined') {
                    this.npc.relationshipBetween.stats[spouseId] = 50; // Example initial value
                    console.log(`Initialized relationship stat between ${this.npc.id} and spouse ${spouseId}`);
                }
            } else {
                console.log(`NPC ${this.npc.id} does not have a family object.`);
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
    formFriendshipOutsideAssignment: function(npcGroup) {
        let groupSize = npcGroup.length;
        for (let i = 0; i < groupSize; i++) {
            let npcA = npcGroup[i];
    
            // Ensure npcA is properly initialized
            this.npc = npcA;
            this._init();
            
            for (let j = 0; j < groupSize; j++) {
                if (i !== j) {
                    let npcB = npcGroup[j];
    
                    // Ensure npcB is properly initialized
                    this.npc = npcB;
                    this._init();
    
                    // Check if the relationship stats exist between npcA and npcB, and set if not
                    if (npcA.relationshipBetween.stats[npcB.id] === undefined) {
                        npcA.relationshipBetween.stats[npcB.id] = 5;
                        //console.log("rel: " + npcA.name + " is " +  npcA.relationshipBetween.stats[npcB.id]);
                    }
                    if (npcB.relationshipBetween.stats[npcA.id] === undefined) {
                        npcB.relationshipBetween.stats[npcA.id] = 5;
                        //console.log("rel: " + npcB.name + " is " + npcB.relationshipBetween.stats[npcA.id]);
                    }
                }
            }
        }
        this.handleDislikes(); // Ensure dislikes are updated
    },
    setBFF: function(npcA, npcB) {
        // Check if both NPCs have a relationship stat of 100 or higher with each other
        if (npcA.relationshipBetween.stats[npcB.id] >= 100 && npcB.relationshipBetween.stats[npcA.id] >= 100) {
            // Check if both NPCs have shared at least 5 events with each other
            if (npcA.relationshipBetween.sharedEvents[npcB.id] >= 5) {
                // Ensure neither NPC already has a BFF
                if (!npcA.relationshipBetween.bff && !npcB.relationshipBetween.bff) {
                    npcA.relationshipBetween.bff = npcB.id;
                    npcB.relationshipBetween.bff = npcA.id;
                    console.log(`${npcA.id} and ${npcB.id} are now best friends.`);
                } else {
                    console.log("One of the NPCs already has a BFF.");
                }
            } else {
                console.log("The NPCs haven't shared enough events to become BFFs.");
            }
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

        if (!npcA.relationshipBetween.tempAdmirer || npcA.relationshipBetween.tempAdmirer.length === 0) {
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
            npcA.relationshipBetween.admirer = npcB.id;
            console.log(npcA.id + " has added " + npcB.id + " as an admirer.");

            // Check if npcA is a wife before initiating transition
            if (npcA.family.husband) {
                this.initiateBackgroundEvents(npcA);
            }
        } else {
            console.log(`${npcA.id} already has an admirer, skipping.`);
        }
    },

    initiateBackgroundEvents: function(npcA) {
        if (!npcA.family || !npcA.family.husband) {
            //console.log(`${npcA.id} has no husband to argue with.`);
            return;
        }

        // Example flag or percentage chance setup
        let checkPregnancy = false;  
        let checkSharedEvents = false;
        let checkExistingChild = false;
    
        let chanceEvent = Math.random();
        if (chanceEvent <= 1) {
            checkPregnancy = true;  
            checkSharedEvents = true;
            checkExistingChild = true;
        }
    
        let conditionMet = false;
    
        // Optional check for pregnancy
        if (checkPregnancy) {
            let isPregnantByAdmirer = npcA.pregnancy && npcA.pregnancy_father === npcA.relationshipBetween.admirer;
            if (npcA.pregnancy && isPregnantByAdmirer) {
                console.log(`${npcA.id} is pregnant by the admirer, condition met.`);
                conditionMet = true;
            }
        }
    
        // Optional check for shared events
        if (checkSharedEvents) {
            let sharedEventsCount = npcA.relationshipBetween.sharedEvents?.[npcA.relationshipBetween.admirer] || 0;
            if (sharedEventsCount >= 9) { // Example threshold for shared events
                console.log(`${npcA.id} has shared enough events with the admirer, condition met.`);
                conditionMet = true;
            }
        }
    
        // Optional check for existing child with the admirer
        if (checkExistingChild) {
            let admirer = setup.getNpcById(npcA.relationshipBetween.admirer);
            let hasSharedChild = npcA.family.kids?.some(kidId => admirer?.family.kids?.includes(kidId));
            if (npcA.family.kids && admirer?.family.kids && hasSharedChild) {
                console.log(`${npcA.id} has a shared child with the admirer, condition met.`);
                conditionMet = true;
            }
        }
    
        // If none of the conditions are met, skip the transition
        if (!conditionMet) {
            console.log(`${npcA.id} does not meet any conditions, skipping transition.`);
            return;
        }
    
        // Proceed with initiating background events if a condition is met
        if (conditionMet) {
            if (!npcA.relationshipBetween.pendingEvents) {
                npcA.relationshipBetween.pendingEvents = {
                    eventCount: 4, 
                    currentEvent: 0, 
                    eventIntervalRange: [5, 15], 
                    lastEventDay: new Date(variables().gameDate).getTime(),
                };
    
                console.log(`${npcA.id} has started a transition period with her husband.`);
                console.log('Initialized pendingEvents:', npcA.relationshipBetween.pendingEvents);
            }
    
            this.handleBackgroundEvents(npcA);
        }
    },
    
    handleBackgroundEvents: function(npcA) {
        let events = npcA.relationshipBetween.pendingEvents;
        if (!events) return;
    
        // Ensure currentGameDay is properly referenced by converting gameDate to a numeric value
        let currentGameDay = new Date(variables().gameDate).getTime();
        //console.log(`Current game day (timestamp): ${currentGameDay}`);
    
        let daysSinceLastEvent = Math.floor((currentGameDay - events.lastEventDay) / (1000 * 60 * 60 * 24));
        console.log(`Days since last event for ${npcA.id}: ${daysSinceLastEvent}`);
    
        let nextEventInterval = Math.floor(Math.random() * (events.eventIntervalRange[1] - events.eventIntervalRange[0] + 1)) + events.eventIntervalRange[0];
        //console.log(`Next event interval for ${npcA.id}: ${nextEventInterval}`);
    
        if (daysSinceLastEvent >= nextEventInterval) {
            // Trigger an event to reduce relationship with the current husband
            let currentHusbandId = npcA.family.husband;
            if (currentHusbandId) {
                //console.log(`${npcA.id} is having an argument with husband ${currentHusbandId}.`);
                this.decrease(npcA, [currentHusbandId], 10); // Decrease relationship by 10 (or adjust as needed)
            }
    
            // Update event tracker
            events.currentEvent++;
            events.lastEventDay = currentGameDay;
            //console.log(`Updated event tracker. New current event: ${events.currentEvent}, New last event day: ${events.lastEventDay}`);
    
            // If all events are processed, finalize the divorce and transition
            if (events.currentEvent >= events.eventCount) {
                //console.log(`All events processed for ${npcA.id}. Finalizing divorce and transition.`);
                this.finalizeDivorceAndTransition(npcA);
                npcA.relationshipBetween.pendingEvents = null;
                //console.log(`Pending events cleared for ${npcA.id}.`);
            }
        } else {
            //console.log(`Not enough days passed for the next event for ${npcA.id}.`);
        }
    },

    finalizeDivorceAndTransition: function(npcA) {
        let currentHusbandId = npcA.family?.husband;
        let divorceDate = variables().gameDate;
        
        if (currentHusbandId) {
            let currentHusband = setup.getNpcById(currentHusbandId);
            
            // Add to ex-husbands
            if (!npcA.family.exHusbands) {
                npcA.family.exHusbands = [];
            }
            npcA.family.exHusbands.push({
                id: currentHusbandId,
                order: npcA.family.exHusbands.length + 1,
                divorceDate: divorceDate
            });
            
            // Remove husband property
            delete npcA.family.husband;
        
            // Update husband's family
            if (currentHusband?.family?.wives) {
                currentHusband.family.wives = currentHusband.family.wives.filter(wifeId => wifeId !== npcA.id);
            }
        
            console.log(`${npcA.id} is now divorced from ${currentHusbandId}.`);
        }
        
        // Promote Admirer to Fiance
        let newPartnerId = npcA.relationshipBetween?.admirer;
        if (newPartnerId) {
            npcA.relationshipBetween.fiance = newPartnerId;
            npcA.relationshipBetween.admirer = null; // Clear admirer after engagement
            console.log(`${npcA.id} is now engaged to ${newPartnerId}.`);
        }
    },

    initializeTransitionForExistingAdmirers: function() {
        console.log("Initializing transition for existing admirers...");
        
        for (let npc of variables().guests) {
            // Check if the process has already started for this NPC
            if (npc.relationshipBetween.pendingEvents) {
                console.log(`Pending events found for ${npc.id}. Checking if the process should be resumed...`);
                this.handleBackgroundEvents(npc);  // Attempt to handle existing pending events
                continue;  // Skip to the next NPC
            }
    
            // Check if npc has a family object, a husband, and a non-null admirer
            if (npc.family && npc.family.husband && npc.relationshipBetween.admirer) {
                let admirerId = npc.relationshipBetween.admirer;
                let admirer = setup.getNpcById(admirerId);
    
                if (admirer) {
                    console.log(`Found NPC ${npc.id} with existing admirer ${admirer.id} and husband ${npc.family.husband}. Initiating transition...`);
                    this.initiateBackgroundEvents(npc);
                } else {
                    console.log(`NPC ${npc.id} has an admirer ID but the admirer could not be found, skipping...`);
                }
            } else {
                //console.log(`NPC ${npc.id} does not have a husband or a valid admirer, skipping...`);
            }
        }
    
        console.log("Completed initialization check.");
    },
    initializeRelationshipsForMarriedNPCs: function() {
        console.log("Initializing relationship stats for already married NPCs...");
    
        for (let npc of variables().guests) { // Assuming `guests` holds all NPCs
            // Check if npc is defined and has a family
            if (npc && npc.family) {
                let spouseId = null;
    
                // Check if npc is female and has a husband
                if (npc.family.husband) {
                    spouseId = npc.family.husband;
                }
                // Check if npc is male and has wives
                else if (npc.family.wives && npc.family.wives.length > 0) {
                    spouseId = npc.family.wives[0]; // Assuming the first wife is the spouse in question
                }
    
                // If there's a spouseId, proceed with initializing relationship stats
                if (spouseId) {
                    if (!npc.relationshipBetween) {
                        npc.relationshipBetween = { stats: {} };
                    }
                    if (typeof npc.relationshipBetween.stats[spouseId] === 'undefined') {
                        npc.relationshipBetween.stats[spouseId] = 50; // Example initial value
                        let spouse = setup.getNpcById(spouseId);
                        if (spouse) {
                            if (!spouse.relationshipBetween) {
                                spouse.relationshipBetween = { stats: {} };
                            }
                            if (typeof spouse.relationshipBetween.stats[npc.id] === 'undefined') {
                                spouse.relationshipBetween.stats[npc.id] = 50;
                            }
                            console.log(`Initialized relationship stat between ${npc.id} and spouse ${spouse.id}`);
                        } else {
                            console.log(`Spouse with ID ${spouseId} not found for NPC ${npc.id}.`);
                        }
                    }
                } else {
                    console.log(`NPC ${npc.id} does not have a spouse, skipping...`);
                }
            } else {
                console.log(`NPC ${npc ? npc.id : 'undefined NPC'} does not have a family object, skipping...`);
            }
        }
    
        console.log("Completed initialization of relationship stats for married NPCs.");
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
   },
   trackNpcSCream: function(npcA, npcB) {
        // Ensure npcSCream property exists
        if (!npcA.relationshipBetween.npcSCream) {
            npcA.relationshipBetween.npcSCream = {};
        }
        if (!npcB.relationshipBetween.npcSCream) {
            npcB.relationshipBetween.npcSCream = {};
        }

        // Initialize the npcSCream event count if it doesn't exist
        if (!npcA.relationshipBetween.npcSCream[npcB.id]) {
            npcA.relationshipBetween.npcSCream[npcB.id] = 0;
        }
        if (!npcB.relationshipBetween.npcSCream[npcA.id]) {
            npcB.relationshipBetween.npcSCream[npcA.id] = 0;
        }

        // Increment the npcSCream event count
        npcA.relationshipBetween.npcSCream[npcB.id]++;
        npcB.relationshipBetween.npcSCream[npcA.id]++;

        console.log(`${npcB.id} and ${npcA.id} npcSCream: ${npcA.relationshipBetween.npcSCream[npcB.id]}`);
    }
};