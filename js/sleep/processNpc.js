setup.sleep = setup.sleep || {};

// Per-NPC daily tick. All pure-data work that doesn't need <<include>> passages,
// $storage/.drop(), or <<guestLeft>>. Removals are deferred into opts.pendingRemovals
// so the caller can splice/guestLeft in reverse-index order after the loop ends.
setup.sleep.processNpc = function(npc, opts) {
    opts.shouldSkip = false;

    const type = opts.type;                    // 'slave' | 'guest' | 'character'
    const isGuest     = type === 'guest';
    const isSlave     = type === 'slave';
    const isCharacter = type === 'character';

    const { day, subDecayDisabled, isHeatWave, isSandStorm, isColdSnap,
            hasWorkingHospital, miscarriageChance, npcIndex,
            hasMilkwarden, hasElectricity, giveFood,
            randomScavengingItems } = opts;

    // ── Guest: should they leave? (checked before flag resets) ──────────────
    if (isGuest && (npc.relationship < 0 || npc.happy < -70) && setup.getAge(npc) >= 18) {
        setup.sleepMessages.addMain(
            npc.name + ' was missing in the morning, ' +
            setup.pronounceWhat(npc) + ' probably decided to leave this place.'
        );
        opts.pendingRemovals.push({ index: npcIndex });
        opts.shouldSkip = true;
        return;
    }

    // ── Daily flag reset ─────────────────────────────────────────────────────
    Object.assign(npc, {
        talked: false, milked: false, groped: false, washed: false,
        workout: false, gift: false, cosmetics: false, drunk: 0,
        offerSlave: false, sleeping: false, washedBathhouse: false
    });

    npc.stats = npc.stats || {};

    // ── Horny tick ───────────────────────────────────────────────────────────
    if (isSlave) {
        if (npc.horny < 90) npc.horny++;
    } else {
        if (npc.horny <= 90) npc.horny += window.randomInteger(1, 9);
        else npc.horny = 0;
    }

    // ── Slave/guest-only daily ticks ─────────────────────────────────────────
    if (!isCharacter) {
        if (npc.buttplug && npc.anal < 20) npc.anal++;

        setup.sleep.processDumbbell(npc, isHeatWave);

        if (typeof npc.washDays !== 'undefined') {
            npc.washDays--;
            if (npc.baseBeauty) npc.beauty = Math.max(npc.baseBeauty, npc.beauty - npc.washBeauty);
            else npc.beauty -= npc.washBeauty;
            if (npc.washDays <= 0) delete npc.washDays;
        }

        if (typeof npc.noPregnancyDays !== 'undefined') {
            npc.noPregnancyDays--;
            if (npc.noPregnancyDays <= 0) delete npc.noPregnancyDays;
        }

        if (npc.sub < 20 && !Object.keys(npc.clothes ?? {}).length && setup.percentageChance(50)) {
            npc.sub++;
        }

        if (isGuest && ((npc?.quests?.lastInteractionDay ?? 0) + 7) < day && !subDecayDisabled) {
            npc.sub = Math.max(0, (npc.sub ?? 0) - 1);
        }

        if (((npc?.quests?.lastInteractionDay ?? 0) + 14) < day && !subDecayDisabled) {
            npc.relationship = Math.max(-100, (npc.relationship ?? 0) - 1);
        }
    }

    // Pre-tick sick/rest — stored in opts so SC <<include>> jobs see morning values
    const isSick    = isCharacter ? false : typeof npc.sick !== 'undefined';
    const isDayOff  = isSick || (isCharacter ? false : typeof npc.rest !== 'undefined');
    opts.resultIsSick   = isSick;
    opts.resultIsDayOff = isDayOff;

    // ── Job logic ─────────────────────────────────────────────────────────────
    if (!isCharacter) {
        const job = npc.assignedTo;
        const sv  = State.variables;
        const tmp = State.temporary;

        // Kitchen: stat + cook skill
        if (job === 'kitchen' && !isSick) {
            npc.stats.kitchen = (npc.stats.kitchen ?? 0) + 1;
            if ((npc.skills ?? []).includes('teacher') && setup.percentageChance(30)) npc.stats.kitchen++;
            if (npc.stats.kitchen > 100 && !(npc.skills ?? []).includes('cook')) {
                npc.skills = npc.skills || [];
                npc.skills.push('cook');
                setup.sleepMessages.addJob('<span class="skill">Guest ' + npc.name + ' learned the cook skill</span>', 'kitchen');
            }
        }

        // Garden: heat-wave resets progress; otherwise stat + skill + food production
        // Slaves: original gate was !_isDayOff (undefined) = always true → no gate
        // Guests: gate is !isDayOff
        if (job === 'garden') {
            if (isHeatWave) {
                npc.gardenDay = 0;
            } else if (!isGuest || !isDayOff) {
                npc.stats.garden = (npc.stats.garden ?? 0) + 1;
                if ((npc.skills ?? []).includes('teacher') && setup.percentageChance(30)) npc.stats.garden++;
                if (npc.stats.garden > 100 && !(npc.skills ?? []).includes('gardener')) {
                    npc.skills = npc.skills || [];
                    npc.skills.push('gardener');
                    const label = isGuest ? 'gardening' : 'gardener';
                    setup.sleepMessages.addJob('<span class="skill">' + npc.name + ' learned the ' + label + ' skill</span>', 'garden');
                }
                npc.gardenDay = (npc.gardenDay ?? 0) + 1;
                let foodGive = giveFood;
                if ((npc.skills ?? []).includes('gardener')) foodGive += 2;
                if (npc.gardenDay >= 3) {
                    npc.gardenDay = 0;
                    if ((npc.traits ?? []).includes('hoarder')) foodGive = Math.max(1, Math.floor(foodGive / 2));
                    if (tmp.totals) tmp.totals.food = (tmp.totals.food ?? 0) + foodGive;
                    setup.cabinInventory.pickup('food', foodGive);
                    const period = isGuest ? '.' : '';
                    setup.sleepMessages.addJob(npc.name + ' managed to grow <strong>' + foodGive + '</strong> food in the garden' + period, 'garden');
                }
                if (setup.percentageChance(10)) {
                    if (tmp.totals) tmp.totals.wood = (tmp.totals.wood ?? 0) + 1;
                    setup.cabinInventory.pickup('wood', 1);
                    setup.sleepMessages.addJob(npc.name + ' managed to grow a small fruit tree while working in the garden. <strong class="iitem">+1 wood</strong>', 'garden');
                }
            }
        }

        // Milk barn (slaves only in practice; no gate on isGuest since slaves don't have isDayOff gate)
        if (job === 'milk_barn' && !isDayOff && hasMilkwarden) {
            if (typeof npc.milkingDay === 'undefined') npc.milkingDay = 0;
            if (npc.pregnancy < 7 && !(npc.traits ?? []).includes('milker')) {
                delete npc.assignedTo;
                setup.sleepMessages.addJob(npc.name + ' has dried out and produces no extra milk (for now). Unassigned from barn!', 'milk_barn');
            } else if (hasElectricity) {
                npc.milkingDay++;
                npc.happy = Math.max(-100, (npc.happy ?? 0) - 5);
                if (npc.milkingDay >= 3) {
                    setup.cabinInventory.pickup('milk', 1);
                    setup.sleepMessages.addJob(npc.name + ' filled a pack of milk', 'milk_barn');
                    npc.milkingDay = 0;
                    if (tmp.totals) { tmp.totals.milk = (tmp.totals.milk ?? 0) + 1; }
                }
            } else {
                setup.sleepMessages.addJob(npc.name + ' could not work as there was no electricity in the barn', 'milk_barn');
            }
        }

        // Streets
        if (job === 'streets' && !isDayOff && !isSandStorm && (!isColdSnap || setup.npcInventoryHas(npc, 'coat_wolf'))) {
            let chanceToDie = 5;
            if ((npc.strength ?? 0) > 20) chanceToDie = 3;
            else if ((npc.strength ?? 0) > 10) chanceToDie = 4;
            const domDeal = sv.characters.dom.quests.accepted_deal;
            if (domDeal) chanceToDie = 1;
            if (setup.npcInventoryHas(npc, 'knife')) chanceToDie--;

            if (setup.percentageChance(chanceToDie) && (!domDeal || setup.percentageChance(50))) {
                if (tmp.totals) tmp.totals.streetworker = (tmp.totals.streetworker ?? 0) - 1;
                const punct = isGuest ? '!' : '...';
                setup.sleepMessages.addJob(npc.name + ' <strong class="iitem">was found dead</strong> in the streets' + punct, 'streets');
                if (!sv.game.streetsKilledNpc) {
                    sv.game.streetsKilledNpc = Object.assign(clone(npc), { _killedDay: sv.game.day });
                }
                opts.pendingRemovals.push({ index: npcIndex });
                opts.shouldSkip = true;
                return;
            }

            if (setup.percentageChance(isGuest ? 20 : 10)) {
                setup.sleepMessages.addJob(npc.name + ' had a close call in the streets last night but made it back.', 'streets');
            }
            if (!(npc.traits ?? []).includes('cumslut') && !(npc.traits ?? []).includes('masochist')) {
                npc.happy = Math.max(-100, (npc.happy ?? 0) - 5);
            }
            if (window.randomInteger(0, 1) === 0) {
                if (!npc.chastityBelt) {
                    npc.virgin = false;
                    if (setup.percentageChance(50)) setup.jobs.applyJobAct(npc, 'pussy');
                }
                if (setup.percentageChance(50)) setup.jobs.applyJobAct(npc, 'bj');
                if (setup.percentageChance(20)) setup.jobs.applyJobAct(npc, 'anal');

                const earned = setup.jobs.getStreetsEarned(npc);
                sv.player.money += earned;
                if (tmp.totals) tmp.totals.caps = (tmp.totals.caps ?? 0) + earned;

                const msg = isGuest
                    ? npc.name + ' had a client in the streets. She got you <strong>' + earned + '</strong> caps'
                    : npc.name + ' had a client in the streets, ' + setup.pronounceWhat(npc) + ' got you <strong>' + earned + '</strong> caps';
                setup.sleepMessages.addJob(msg, 'streets');

                if (setup.pregnancyChance(npc) && !setup.npcInventoryHas(npc, 'condom') && !npc.chastityBelt) {
                    npc.pregnancy = 0;
                    npc.pregnancy_father = 'unknown';
                    npc.pregnancy_event = 'streets';
                }
            }
        }

        // Church: boosts all other guests' happy
        if (job === 'church' && isGuest && !isSick) {
            npc.stats.church = (npc.stats.church ?? 0) + 1;
            const guests = sv.guests;
            for (let ci = 0; ci < guests.length; ci++) {
                if (guests[ci].id !== npc.id) {
                    guests[ci].happy = Math.min(100, (guests[ci].happy ?? 0) + 1);
                }
            }
            setup.sleepMessages.addJob(npc.name + ' spent the day at the church, lifting the spirits of those around <strong>+1 happy to all guests</strong>.', 'church');
        }

        // Mistress: ticks sub/corruption of all slaves
        if (job === 'mistress' && isGuest && !isSick) {
            const slaves = sv.slaves;
            for (let mi = 0; mi < slaves.length; mi++) {
                if (setup.getAge(slaves[mi]) < 18) continue;
                if (setup.percentageChance(30) && slaves[mi].sub < 100) {
                    setup.sleepMessages.addJob(npc.name + ' increased ' + setup.displayName(slaves[mi]) + '\'s submission');
                    slaves[mi].sub = Math.min(100, (slaves[mi].sub ?? 0) + 1);
                }
                if (setup.percentageChance(20) && slaves[mi].corruption < 50) {
                    setup.sleepMessages.addJob(npc.name + ' increased ' + setup.displayName(slaves[mi]) + '\'s corruption');
                    slaves[mi].corruption = Math.min(100, (slaves[mi].corruption ?? 0) + 1);
                }
            }
        }

        // Attendant: beauty grooming + optional stimulation of all slaves
        // Slave attendant skips itself; guest attendant applies to all slaves
        if (job === 'attendant' && !isSick) {
            const slaves = sv.slaves;
            for (let ai = 0; ai < slaves.length; ai++) {
                if (isSlave && ai === npcIndex) continue;
                if (setup.getAge(slaves[ai]) < 18) continue;

                // Beauty: higher chance the more stale (washDays counts down from last wash)
                const wd = slaves[ai].washDays ?? 0;
                const washChance = wd >= 7 ? 0 : wd === 0 ? 35 : (7 - wd) * 2;
                const beautyMax  = (slaves[ai].baseBeauty ?? slaves[ai].beauty) + (slaves[ai].washBeauty ?? 1) * 7;
                if (slaves[ai].beauty < beautyMax && setup.percentageChance(washChance)) {
                    const wasFullyExpired = !slaves[ai].washDays;
                    const oldBeauty = slaves[ai].beauty;
                    setup.wash(slaves[ai], { beautyMultiplier: 7, washDays: 7 });
                    const gain = slaves[ai].beauty - oldBeauty;
                    if (gain > 0) {
                        if (!wasFullyExpired)
                            setup.sleepMessages.addJob(npc.name + ' bathed ' + setup.displayName(slaves[ai]) + ', ' + setup.pronounceWhat(slaves[ai]) + ' did not need much today');
                        else if (slaves[ai].washBeauty >= 2)
                            setup.sleepMessages.addJob(npc.name + ' bathed ' + setup.displayName(slaves[ai]) + ', ' + setup.pronounceWhat(slaves[ai]) + ' is back to ' + setup.pronounceWhos(slaves[ai]) + ' peak');
                        else
                            setup.sleepMessages.addJob(npc.name + ' bathed ' + setup.displayName(slaves[ai]) + ', ' + setup.pronounceWhat(slaves[ai]) + ' looks fresh and clean');
                    }
                }

                // Horny: 15% chance to raise by 7-15 if below 80 and stimulation is enabled
                if ((sv.player.baseManagement?.attendantStimulate ?? true) && slaves[ai].horny < 80 && setup.percentageChance(15)) {
                    let hornyGain = window.randomInteger(7, 15);
                    const slaveAttrToAtt = npc.gender === 0 ? slaves[ai].likesGirls
                                         : npc.gender === 1 ? slaves[ai].likesGuys
                                         : npc.gender === 2 ? slaves[ai].likesTGirls
                                         :                    slaves[ai].likesTGuys;
                    if (!slaveAttrToAtt) {
                        hornyGain = Math.ceil(hornyGain / 2);
                        slaves[ai].happy = Math.max(0, (slaves[ai].happy ?? 0) - window.randomInteger(0, 3));
                    }
                    slaves[ai].horny = Math.min(99, slaves[ai].horny + hornyGain);
                    const hornySuffix = slaves[ai].horny >= 80
                        ? ' ' + setup.pronounceWhat(slaves[ai])[0].toUpperCase() + setup.pronounceWhat(slaves[ai]).slice(1) + ' looks like ' + setup.pronounceWhat(slaves[ai]) + ' could use your attention...'
                        : '';
                    setup.sleepMessages.addJob(npc.name + ' got a little frisky with ' + setup.displayName(slaves[ai]) + ' in the shower, increasing ' + setup.pronounceWhos(slaves[ai]) + ' arousal.' + hornySuffix);

                    // Attendant gets a little aroused too if attracted to this slave
                    const attAttrToSlave = slaves[ai].gender === 0 ? npc.likesGirls
                                         : slaves[ai].gender === 1 ? npc.likesGuys
                                         : slaves[ai].gender === 2 ? npc.likesTGirls
                                         :                            npc.likesTGuys;
                    if (attAttrToSlave) npc.horny = Math.min(81, (npc.horny ?? 0) + window.randomInteger(2, 5));
                }

                // Happiness: 20% chance if attendant has Pacifist trait and slave is unhappy
                if ((npc.traits ?? []).includes('pacifist') && slaves[ai].happy < 50 && setup.percentageChance(20)) {
                    slaves[ai].happy = Math.min(100, (slaves[ai].happy ?? 0) + window.randomInteger(2, 5));
                    setup.sleepMessages.addJob(npc.name + ' pampered ' + setup.displayName(slaves[ai]) + ' while grooming, improving ' + setup.pronounceWhos(slaves[ai]) + ' happiness');
                }
            }
        }

        // Hunter (guests only, bow required)
        if (job === 'hunter' && isGuest && !isSick && setup.npcInventoryHas(npc, 'bow') &&
            !isSandStorm && (!isColdSnap || setup.npcInventoryHas(npc, 'coat_wolf'))) {
            let pct = 10;
            if (npc.strength > 50) pct += 25;
            else if (npc.strength > 20) pct += 10;
            let item = 'food';
            let count = window.randomInteger(2, 5);
            if (setup.percentageChance(20) || (setup.isFullMoon() && setup.percentageChance(40))) {
                item = 'pelt_wolf';
                count = window.randomInteger(1, 2);
            }
            if (setup.percentageChance(pct)) {
                if (tmp.totals) tmp.totals[item] = (tmp.totals[item] ?? 0) + count;
                setup.cabinInventory.pickup(item, count);
                setup.sleepMessages.addJob(npc.name + ' managed to get ' + count + ' ' + Item.get(item).name + ' while hunting.', 'hunting');
            }
        }

        // Scavenging: stat tick + full return logic (guests only)
        if (job === 'scavenging' && isGuest && !isSick && !isSandStorm && (!isColdSnap || setup.npcInventoryHas(npc, 'coat_wolf'))) {
            npc.stats.scavenging = (npc.stats.scavenging ?? 0) + 1;
            if ((npc.skills ?? []).includes('teacher') && setup.percentageChance(30)) npc.stats.scavenging++;
            if (npc.stats.scavenging > 100 && !(npc.skills ?? []).includes('scavenger')) {
                npc.skills = npc.skills || [];
                npc.skills.push('scavenger');
                setup.sleepMessages.addJob('<span class="skill">' + npc.name + ' learned the scavenger skill</span>', 'scavenging');
            }

            let chanceNotHome = 10;
            if (npc.strength >= 60) chanceNotHome -= 5;
            else if (npc.strength >= 40) chanceNotHome -= 3;
            else if (npc.strength >= 20) chanceNotHome -= 1;
            if ((npc.skills ?? []).includes('scavenger')) chanceNotHome -= 3;
            if (setup.npcInventoryHas(npc, 'knife')) chanceNotHome -= 1;
            if (setup.npcInventoryHas(npc, 'crossbow') || setup.npcInventoryHas(npc, 'bow')) chanceNotHome -= 1;
            chanceNotHome = Math.max(1, chanceNotHome);

            const hostiles = setup.settlements.getAll().filter(function(s) {
                return s.discovered && !s.destroyed && setup.settlements.isHostile(s);
            });
            if (hostiles.length && !(sv.game.capturedGuest ?? false) && setup.percentageChance(2) && npc.gender === 0) {
                const captor = hostiles[window.randomInteger(0, hostiles.length - 1)];
                captor.captiveId   = npc.id;
                captor.captiveName = npc.name;
                sv.game.capturedGuest = { npc: clone(npc), settlementId: captor.id, settlementName: captor.name };
                setup.settlements.modifyRelationship(captor, -5, 'Captured player\'s guest');
                setup.settlements.logEvent(captor, 'Captured one of the player\'s people during scavenging.');
                setup.settlements.save(setup.settlements.getAll());
                setup.sleepMessages.addMain(npc.name + ' didn\'t come home from scavenging. She was taken by ' + captor.name + '.');
                opts.pendingRemovals.push({ index: npcIndex });
                opts.shouldSkip = true;
                return;
            }

            if (setup.percentageChance(chanceNotHome) && sv.scavengingDidntReturn === null && !sv.pregnancyHappening && setup.percentageChance(30)) {
                // Store ID so SC can recompute the correct index after deferred removals
                opts.scavengingDidntReturnId = npc.id;
            } else {
                const randItem  = randomScavengingItems[window.randomInteger(0, randomScavengingItems.length - 1)];
                let giveCount = 1;
                if ((npc.skills ?? []).includes('scavenger') && setup.percentageChance(50)) giveCount++;
                if ((npc.traits ?? []).includes('hoarder')) giveCount = Math.max(0, Math.floor(giveCount / 2));
                if (giveCount > 0) {
                    if (tmp.totals) tmp.totals[randItem] = (tmp.totals[randItem] ?? 0) + giveCount;
                    setup.cabinInventory.pickup(randItem, giveCount);
                    setup.sleepMessages.addJob(npc.name + ' managed to collect <strong>' + giveCount + ' ' + Item.get(randItem).name + '</strong> while scavenging.', 'scavenging');
                } else {
                    setup.sleepMessages.addJob(npc.name + ' went scavenging but kept everything they found.', 'scavenging');
                }
            }

            if (setup.percentageChance(10) || (setup.isNewMoon() && setup.percentageChance(20))) {
                if (tmp.totals) tmp.totals.glowing_mushroom = (tmp.totals.glowing_mushroom ?? 0) + 1;
                setup.cabinInventory.pickup('glowing_mushroom', 1);
                setup.sleepMessages.addJob(npc.name + ' managed to find a mushroom among the debris while scavenging. <strong class="iitem">+1 glowing mushroom</strong>', 'scavenging');
            }
        }
    }

    // ── Sick tick ─────────────────────────────────────────────────────────────
    if (isSick) {
        npc.sick.days--;
        if (hasWorkingHospital) npc.sick.days--;
        if (npc.sick.days <= 0) delete npc.sick;
    }

    // ── Coldsnap sickness ─────────────────────────────────────────────────────
    if (!isCharacter) {
        const job2 = npc.assignedTo;
        if (isColdSnap && !isSick && !isDayOff && job2 &&
            ['garden', 'quarry', 'scavenging'].includes(job2) &&
            !setup.npcInventoryHas(npc, 'coat_wolf') &&
            setup.percentageChance(10)) {
            const days = window.randomInteger(3, 5);
            npc.sick = { days, desc: 'caught a cold working outside in freezing temperatures', id: 'coldsnap' };
            setup.sleepMessages.addMain(
                '<span class="warning">' + npc.name +
                ' caught a cold from working outside in the freezing cold. She will need ' +
                days + ' days to recover.</span>'
            );
        }

        // ── Rest tick ─────────────────────────────────────────────────────────
        if (typeof npc.rest !== 'undefined') {
            const unhappyJobs = ['milk_barn', 'nightclub', 'quarry', 'streets'];
            const gain = unhappyJobs.includes(npc.assignedTo) ? 5 : 2;
            npc.happy = Math.min(100, (npc.happy ?? 0) + gain);
            npc.rest.days--;
            if (npc.rest.days <= 0) delete npc.rest;
        }
    }

    // ── Pregnancy tick ────────────────────────────────────────────────────────
    if (typeof npc.pregnancy !== 'undefined') {
        npc.pregnancy++;
        if ((npc.traits ?? []).includes('breeder')) npc.pregnancy++;

        if (npc.pregnancy === 8) {
            let msg = npc.name + ' told you that <strong>she is pregnant</strong>.';
            const sv2 = State.variables;
            if (!isCharacter && npc.pregnancy_father !== 'mc') {
                msg += ' <strong>You ARE NOT the father!</strong>';
                if (!sv2.pregnancyStreetsHappening && npc.pregnancy_event === 'streets') {
                    sv2.pregnancyStreetsHappening = { type, id: npcIndex };
                }
            }
            setup.sleepMessages.addMain(msg);
            sv2.characters.vincent.quests.pregnancy = true;
            if (isCharacter && npcIndex === 'blair') {
                sv2.characters.blair.quests.pregnancy = true;
            }
        }

        // Miscarriage: slaves only (guests had _streetwork typo bug → always falsy)
        if (isSlave) {
            const isStreetWork = npc.assignedTo === 'streets' && !isDayOff;
            if (npc.pregnancy > 30 && isStreetWork && setup.percentageChance(miscarriageChance)) {
                const tmp3 = State.temporary;
                if (tmp3.totals) tmp3.totals.pregnancy = (tmp3.totals.pregnancy ?? 0) - 1;
                setup.sleepMessages.addMain(
                    npc.name + ' woke up with her blood all over her. <strong class="iitem">She had a miscarriage.</strong>'
                );
                npc.happy        = Math.max(-100, (npc.happy ?? 0) - 20);
                npc.relationship = Math.max(-100, (npc.relationship ?? 0) - 10);
                delete npc.pregnancy;
            }
        }

        if (typeof npc.pregnancy !== 'undefined' &&
            !State.variables.pregnancyHappening &&
            npc.pregnancy > 260 &&
            (npc.pregnancy > 280 || window.randomInteger(1, 3) === 3)) {
            if (hasWorkingHospital) {
                State.variables.pregnancysHappeningHospital.push({ type, id: npcIndex });
            } else {
                State.variables.pregnancyHappening = { type, id: npcIndex };
            }
        }
    }
};
