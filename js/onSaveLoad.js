
Save.onSave.add(function (save, details) {
    if (details.type === 'disk') {
        save.metadata = {};
        save.metadata.settings = clone(settings);
    }
});

Save.onLoad.add(function (save) {

    if (save.metadata && save.metadata.settings) {
        for (const name in save.metadata.settings) {
            if (settings[name] !== save.metadata.settings[name]) {
                settings[name] = save.metadata.settings[name]
                const s = Setting.get(name);
                if (s.hasOwnProperty('onChange')) {
                    s.onChange.call();
                }
            }
        }
        Setting.save();
    }


    let variables = save.state.history[save.state.index].variables; // shortcut to be used when we cleanup

    // Cleanup old variables
    var _oldVariables = [
        'cellSlaveIds',
        'assignedToStreets',
        'assignedToGreenhouse',
        'addHorny',
        'addDay',
        'charsInGrid',
        'energyPenalty',
        'foundItem',
        'giveFood',
        'icon',
        'isDisabled',
        'randomEnemy',
        'workingInGarden',
        'showSlavesCount',
        'sleepAction',
        'sleepDead',
        'talkedAbout',
        'tmpGirlkey',
        'undergroundEvent',
        'url',
        'wantedGender',
        'wantedLink',
        'wantedPerson',
        'wantedPron',
        'wantedPron2',
        'wantedPsg',
    ];
    for (var _i = 0; _i <= _oldVariables.length; _i++) {
        if (typeof save.state.history[save.state.index].variables[_oldVariables[_i]] !== 'undefined') {
            delete save.state.history[save.state.index].variables[_oldVariables[_i]];
        }
    }


    // Default

    if (typeof save.state.history[save.state.index].variables.game.location.nursery !== 'undefined') {
        save.state.history[save.state.index].variables.game.location.youth_district = true;
    }
    if ((variables.game.location.nursery ?? false) || (variables.game.location.library ?? false)) {
        variables.game.location.youth_district = true;
    }

    if (typeof save.state.history[save.state.index].variables.characters.dom === 'undefined') {
        save.state.history[save.state.index].variables.characters.dom = {
            quests: {},
            relationship: 0
        };
    }
    if (typeof save.state.history[save.state.index].variables.characters.dom !== 'undefined') {
        save.state.history[save.state.index].variables.characters.dom.name ??= 'Dom';
        save.state.history[save.state.index].variables.characters.dom.id ??= 'dom';
        save.state.history[save.state.index].variables.characters.dom.family ??= { wives: ['isabel'] };
    }

    if (typeof save.state.history[save.state.index].variables.characters.isabel !== 'undefined') {
        save.state.history[save.state.index].variables.characters.isabel.canFuck = true;
        save.state.history[save.state.index].variables.characters.isabel.likesGuys = true;
        save.state.history[save.state.index].variables.characters.isabel.likesGirls = true;
        save.state.history[save.state.index].variables.characters.isabel.likesTGuys = false;
        save.state.history[save.state.index].variables.characters.isabel.likesTGirls = false;

        save.state.history[save.state.index].variables.characters.isabel.id ??= 'isabel';
        save.state.history[save.state.index].variables.characters.isabel.family ??= { husband: 'dom'};
        if (typeof save.state.history[save.state.index].variables.characters.isabel.submission !== 'undefined') {
            save.state.history[save.state.index].variables.characters.isabel.sub = 60;
            delete save.state.history[save.state.index].variables.characters.isabel.submission;
        }

        if (
            typeof save.state.history[save.state.index].variables.charId !== 'undefined' && 
            save.state.history[save.state.index].variables.charId === 'isabel' && 
            typeof save.state.history[save.state.index].variables.tmpGirlViewBack === 'undefined'
        ) {
            save.state.history[save.state.index].variables.tmpGirlViewBack = 'Isabel room';
        }
        if (typeof variables.characters.isabel.pregnancy !== 'undefined') {
            variables.characters.isabel.pregnancy_father ??= 'mc';
        }

    }

    if (typeof save.state.history[save.state.index].variables.characters.blair !== 'undefined') {
        save.state.history[save.state.index].variables.characters.blair.id ??= 'blair';
        save.state.history[save.state.index].variables.characters.blair.family ??= {};
        save.state.history[save.state.index].variables.characters.blair.family.father ??= 'vincent';
        delete variables.characters.blair.family.mother;
        save.state.history[save.state.index].variables.characters.blair.likesGuys = true;
        save.state.history[save.state.index].variables.characters.blair.likesGirls = false;
        save.state.history[save.state.index].variables.characters.blair.likesTGuys = false;
        save.state.history[save.state.index].variables.characters.blair.likesTGirls = false;
        if (typeof variables.characters.blair.pregnancy !== 'undefined') {
            variables.characters.blair.pregnancy_father ??= 'mc';
        }
    }

    if (typeof save.state.history[save.state.index].variables.characters.vincent !== 'undefined') {
        save.state.history[save.state.index].variables.characters.vincent.name ??= 'Vincent';
        save.state.history[save.state.index].variables.characters.vincent.id   ??= 'vincent';
        save.state.history[save.state.index].variables.characters.vincent.family ??= {kids: ['blair'] };
    }

    if ((save.state.history[save.state.index].variables.game.location.settlement ?? false) && (save.state.history[save.state.index].variables.characters.octavia ?? false) && typeof save.state.history[save.state.index].variables.characters.octavia.quests === 'undefined') {
        save.state.history[save.state.index].variables.characters.octavia.quests = {};
    }
    if (typeof save.state.history[save.state.index].variables.workersLimitGarden === 'undefined') {
        save.state.history[save.state.index].variables.workersLimitGarden = 8;
    }
    if (save.state.history[save.state.index].variables.workersLimitGarden !== 8) {
        save.state.history[save.state.index].variables.workersLimitGarden = 8;
    }
    if (typeof save.state.history[save.state.index].variables.characters.blair === 'undefined') {
        save.state.history[save.state.index].variables.characters.blair = {};
    }

    if (typeof save.state.history[save.state.index].variables.game.cabinName !== 'undefined') {
        save.state.history[save.state.index].variables.game.showFlag = true;
    }

    if (typeof save.state.history[save.state.index].variables.storage === 'undefined') {
        save.state.history[save.state.index].variables.game.showFlag = true;
    }

    if (typeof save.state.history[save.state.index].variables.startDate === 'undefined') {
        save.state.history[save.state.index].variables.startDate = new Date(save.state.history[save.state.index].variables.gameDate);
        var dateOffset = (24*60*60*1000) * save.state.history[save.state.index].variables.game.day;
        save.state.history[save.state.index].variables.startDate.setTime(save.state.history[save.state.index].variables.startDate.getTime() - dateOffset);
    }

    if ((save.state.history[save.state.index].variables.tmpGirl ?? null) && !Array.isArray(save.state.history[save.state.index].variables.tmpGirl.traits ?? [])) {
        save.state.history[save.state.index].variables.tmpGirl.traits = [];
    }
    if ((save.state.history[save.state.index].variables.tmpGirl ?? null) && !Array.isArray(save.state.history[save.state.index].variables.tmpGirl.skills ?? [])) {
        save.state.history[save.state.index].variables.tmpGirl.skills = [];
    }

    if ((save.state.history[save.state.index].variables.tmpGirl ?? null)) {
        for (var saveTmpGirlSkillI = 0; saveTmpGirlSkillI < (save.state.history[save.state.index].variables.tmpGirl.skills ?? []).length; saveTmpGirlSkillI++) {
            if (setup.traits.hasOwnProperty(save.state.history[save.state.index].variables.tmpGirl.skills[saveTmpGirlSkillI])) {
                if (typeof save.state.history[save.state.index].variables.tmpGirl.traits === 'undefined') {
                    save.state.history[save.state.index].variables.tmpGirl.traits = [];
                }
                save.state.history[save.state.index].variables.tmpGirl.traits.push(save.state.history[save.state.index].variables.tmpGirl.skills[saveTmpGirlSkillI]);
                save.state.history[save.state.index].variables.tmpGirl.skills.splice(saveTmpGirlSkillI, 1);
                saveTmpGirlSkillI--;
            }
        }
    
        for (var saveTmpGirlTraitI = 0; saveTmpGirlTraitI < (save.state.history[save.state.index].variables.tmpGirl.traits ?? []).length; saveTmpGirlTraitI++) {
            if (setup.skills.hasOwnProperty(save.state.history[save.state.index].variables.tmpGirl.traits[saveTmpGirlTraitI])) {
                if (typeof save.state.history[save.state.index].variables.tmpGirl.skills === 'undefined') {
                    save.state.history[save.state.index].variables.tmpGirl.skills = [];
                }
                save.state.history[save.state.index].variables.tmpGirl.skills.push(save.state.history[save.state.index].variables.tmpGirl.traits[saveTmpGirlTraitI]);
                save.state.history[save.state.index].variables.tmpGirl.traits.splice(saveTmpGirlTraitI, 1);
                saveTmpGirlTraitI--;
            } else if (save.state.history[save.state.index].variables.tmpGirl.traits[saveTmpGirlTraitI] === 'scavanger') {
                if (typeof save.state.history[save.state.index].variables.tmpGirl.skills === 'undefined') {
                    save.state.history[save.state.index].variables.tmpGirl.skills = [];
                }
                save.state.history[save.state.index].variables.tmpGirl.skills.push('scavenger');
                save.state.history[save.state.index].variables.tmpGirl.traits.splice(saveTmpGirlTraitI, 1);
                saveTmpGirlTraitI--;
            }
        }
          
        if (typeof save.state.history[save.state.index].variables.tmpGirl.likesGuys === 'undefined') {
		save.state.history[save.state.index].variables.tmpGirl = setup.setSexuality(save.state.history[save.state.index].variables.tmpGirl, 'straight');
        }
		
	if (typeof save.state.history[save.state.index].variables.tmpGirl.orientation !== 'undefined') {
		delete save.state.history[save.state.index].variables.tmpGirl.orientation;
        }
		
	if (typeof save.state.history[save.state.index].variables.tmpGirl.personality === 'undefined') {  
            save.state.history[save.state.index].variables.tmpGirl.personality = setup.personalityTraits(2);
        }

	if (typeof save.state.history[save.state.index].variables.tmpGirl.eyes === 'undefined') {  
            save.state.history[save.state.index].variables.tmpGirl.eyes = setup.eyesRoll(save.state.history[save.state.index].variables.tmpGirl.race, save.state.history[save.state.index].variables.tmpGirl.hair);
        }
        
        if (typeof save.state.history[save.state.index].variables.tmpGirl.happy === 'undefined') {
            save.state.history[save.state.index].variables.tmpGirl.happy = randomInteger(0, 40);
        }

	if (typeof save.state.history[save.state.index].variables.tmpGirl.likes === 'undefined') {
            save.state.history[save.state.index].variables.tmpGirl.likes = setup.getRandomGifts(either(1, 2));
			save.state.history[save.state.index].variables.tmpGirl.dislikes = setup.getRandomGifts(either(1, 2), save.state.history[save.state.index].variables.tmpGirl.likes);
        }

        if (typeof save.state.history[save.state.index].variables.tmpGirl.submission !== 'undefined') {
            save.state.history[save.state.index].variables.tmpGirl.sub = 60;
            delete save.state.history[save.state.index].variables.tmpGirl.submission;
        }
    }

    save.state.history[save.state.index].variables.characters.rodger = (save.state.history[save.state.index].variables.characters.rodger ?? {});
    save.state.history[save.state.index].variables.characters.eve = (save.state.history[save.state.index].variables.characters.eve ?? {});
    if (typeof save.state.history[save.state.index].variables.characters.eve.name !== 'undefined' ) {
        save.state.history[save.state.index].variables.characters.eve.quests ??= {};
        save.state.history[save.state.index].variables.characters.eve.id ??= 'eve';
        if (variables.characters.eve.id !== 'eve') {
            variables.characters.eve.id   = 'eve';
        }
        save.state.history[save.state.index].variables.characters.eve.family ??= { husband: 'rodger'};
        save.state.history[save.state.index].variables.characters.rodger.name ??= 'Rodger';
        save.state.history[save.state.index].variables.characters.rodger.id ??= 'rodger';
        save.state.history[save.state.index].variables.characters.rodger.family ??= { wives: ['eve'] };

    }

    if (typeof save.state.history[save.state.index].variables.guests === 'undefined') {
        save.state.history[save.state.index].variables.guests = [];
        save.state.history[save.state.index].variables.guesthouseLimit = 3;
    }
    if (typeof save.state.history[save.state.index].variables.basementLimit === 'undefined') {
        save.state.history[save.state.index].variables.basementLimit = Math.max(3, save.state.history[save.state.index].variables.slaves.length);
    }
    if (typeof save.state.history[save.state.index].variables.companionsLimit === 'undefined') {
        save.state.history[save.state.index].variables.companionsLimit = 6;
    }
    if (typeof save.state.history[save.state.index].variables.player.reputation_bounty_hunter === 'undefined') {
        save.state.history[save.state.index].variables.player.reputation_bounty_hunter = 0;
    }

    if (!(save.state.history[save.state.index].variables.player.companions ?? false)) {
        save.state.history[save.state.index].variables.player.companions = {};
    }
    if (!(save.state.history[save.state.index].variables.player.stats ?? false)) {
        save.state.history[save.state.index].variables.player.stats = {};
    }
    variables.player.id ??= 'mc';

    for(var varsSlaveI = 0; varsSlaveI < save.state.history[save.state.index].variables.slaves.length; varsSlaveI++) {
        if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].orgasms === 'undefined') {
            save.state.history[save.state.index].variables.slaves[varsSlaveI].orgasms = 0;
            save.state.history[save.state.index].variables.slaves[varsSlaveI].guys = 1;
        }
	if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].likesGuys === 'undefined') {
		save.state.history[save.state.index].variables.slaves[varsSlaveI] = setup.setSexuality(save.state.history[save.state.index].variables.slaves[varsSlaveI], 'straight');
        }
		
	if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].orientation !== 'undefined') {
		delete save.state.history[save.state.index].variables.slaves[varsSlaveI].orientation;
        }

        if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].happy === 'undefined') {
            save.state.history[save.state.index].variables.slaves[varsSlaveI].happy = randomInteger(0, 30);
        }
        
        if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].personality === 'undefined') {
            save.state.history[save.state.index].variables.slaves[varsSlaveI].personality = setup.personalityTraits(2);
        }
		if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].eyes === 'undefined') {  
            save.state.history[save.state.index].variables.slaves[varsSlaveI].eyes = setup.eyesRoll(save.state.history[save.state.index].variables.slaves[varsSlaveI].race, save.state.history[save.state.index].variables.slaves[varsSlaveI].hair);
        }

        if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].id === 'undefined') {
            save.state.history[save.state.index].variables.slaves[varsSlaveI].id = setup.generateUniqueKey(save.state.history[save.state.index].variables.slaves[varsSlaveI])
        }
        if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].pregnancy !== 'undefined') {
            save.state.history[save.state.index].variables.characters.vincent.quests.pregnancy = true;
        }

        if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].endurance === 'undefined') {
            save.state.history[save.state.index].variables.slaves[varsSlaveI].endurance = 0;
        }

        if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].birthDate === 'undefined') {
            save.state.history[save.state.index].variables.slaves[varsSlaveI].birthDate = setup.getBirthDate(save.state.history[save.state.index].variables.slaves[varsSlaveI].age);
            delete save.state.history[save.state.index].variables.slaves[varsSlaveI].age;
        }

        if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].race === 'undefined') {
            save.state.history[save.state.index].variables.slaves[varsSlaveI].race = 'white';
            save.state.history[save.state.index].variables.slaves[varsSlaveI].breasts = 'medium';
        }

	if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].likes === 'undefined') {
            save.state.history[save.state.index].variables.slaves[varsSlaveI].likes = setup.getRandomGifts(either(1, 2));
            save.state.history[save.state.index].variables.slaves[varsSlaveI].dislikes = setup.getRandomGifts(either(1, 2), save.state.history[save.state.index].variables.slaves[varsSlaveI].likes);
        }

        for (var saveSlaveTraitI = 0; saveSlaveTraitI < (save.state.history[save.state.index].variables.slaves[varsSlaveI].traits ?? []).length; saveSlaveTraitI++) {
            if (setup.skills.hasOwnProperty(save.state.history[save.state.index].variables.slaves[varsSlaveI].traits[saveSlaveTraitI])) {
                if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].skills === 'undefined') {
                    save.state.history[save.state.index].variables.slaves[varsSlaveI].skills = [];
                }
                save.state.history[save.state.index].variables.slaves[varsSlaveI].skills.push(save.state.history[save.state.index].variables.slaves[varsSlaveI].traits[saveSlaveTraitI]);
                save.state.history[save.state.index].variables.slaves[varsSlaveI].traits.splice(saveSlaveTraitI, 1);
                saveSlaveTraitI--;
            } else if (save.state.history[save.state.index].variables.slaves[varsSlaveI].traits[saveSlaveTraitI] === 'scavanger') {
                if (typeof save.state.history[save.state.index].variables.slaves[varsSlaveI].skills === 'undefined') {
                    save.state.history[save.state.index].variables.slaves[varsSlaveI].skills = [];
                }
                save.state.history[save.state.index].variables.slaves[varsSlaveI].skills.push('scavenger');
                save.state.history[save.state.index].variables.slaves[varsSlaveI].traits.splice(saveSlaveTraitI, 1);
                saveSlaveTraitI--;
            }
        }
    }

    if (typeof save.state.history[save.state.index].variables.characters.blair.quests !== 'undefined' && typeof save.state.history[save.state.index].variables.characters.blair.quests.missing_friend_talked_day === 'undefined') {
        save.state.history[save.state.index].variables.characters.blair.quests.missing_friend_talked_day = save.state.history[save.state.index].variables.game.day;
    }

    if (typeof save.state.history[save.state.index].variables.locationEvents === 'undefined') {
        save.state.history[save.state.index].variables.locationEvents = {};
    }

    for(var saveGuestI = 0; saveGuestI < save.state.history[save.state.index].variables.guests.length; saveGuestI++) {
        if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].strength === 'undefined') {
            save.state.history[save.state.index].variables.guests[saveGuestI].strength = 0;
        }

        if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].birthDate === 'undefined') {
            save.state.history[save.state.index].variables.guests[saveGuestI].birthDate = setup.getBirthDate(save.state.history[save.state.index].variables.guests[saveGuestI].age);
            delete save.state.history[save.state.index].variables.guests[saveGuestI].age;
        }

        if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].id === 'undefined') {
            save.state.history[save.state.index].variables.guests[saveGuestI].id = setup.generateUniqueKey(save.state.history[save.state.index].variables.guests[saveGuestI]);
        }

        if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].race === 'undefined') {
            save.state.history[save.state.index].variables.guests[saveGuestI].race = 'white';
            save.state.history[save.state.index].variables.guests[saveGuestI].breasts = 'medium';
        }

	if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].likes === 'undefined') {
            save.state.history[save.state.index].variables.guests[saveGuestI].likes = setup.getRandomGifts(either(1, 2));
            save.state.history[save.state.index].variables.guests[saveGuestI].dislikes = setup.getRandomGifts(either(1, 2), save.state.history[save.state.index].variables.guests[saveGuestI].likes);
        }

	if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].likesGuys === 'undefined') {
		save.state.history[save.state.index].variables.guests[saveGuestI] = setup.setSexuality(save.state.history[save.state.index].variables.guests[saveGuestI], 'straight');
        }
		
	if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].orientation !== 'undefined') {
		delete save.state.history[save.state.index].variables.guests[saveGuestI].orientation;
        }

        if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].happy === 'undefined') {
            save.state.history[save.state.index].variables.guests[saveGuestI].happy = randomInteger(0, 40);
        }

        if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].personality === 'undefined') {
            save.state.history[save.state.index].variables.guests[saveGuestI].personality = setup.personalityTraits(2);
        }
		
		if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].eyes === 'undefined') {  
            save.state.history[save.state.index].variables.guests[saveGuestI].eyes = setup.eyesRoll(save.state.history[save.state.index].variables.guests[saveGuestI].race, save.state.history[save.state.index].variables.guests[saveGuestI].hair);
        }

        if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].endurance === 'undefined') {
            save.state.history[save.state.index].variables.guests[saveGuestI].endurance = 0;
        }

        for (var saveGuestTraitI = 0; saveGuestTraitI < (save.state.history[save.state.index].variables.guests[saveGuestI].traits ?? []).length; saveGuestTraitI++) {
            if (setup.skills.hasOwnProperty(save.state.history[save.state.index].variables.guests[saveGuestI].traits[saveGuestTraitI])) {
                if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].skills === 'undefined') {
                    save.state.history[save.state.index].variables.guests[saveGuestI].skills = [];
                }
                save.state.history[save.state.index].variables.guests[saveGuestI].skills.push(save.state.history[save.state.index].variables.guests[saveGuestI].traits[saveGuestTraitI]);
                save.state.history[save.state.index].variables.guests[saveGuestI].traits.splice(saveGuestTraitI, 1);
                saveGuestTraitI--;
            } else if (save.state.history[save.state.index].variables.guests[saveGuestI].traits[saveGuestTraitI] === 'scavanger') {
                if (typeof save.state.history[save.state.index].variables.guests[saveGuestI].skills === 'undefined') {
                    save.state.history[save.state.index].variables.guests[saveGuestI].skills = [];
                }
                save.state.history[save.state.index].variables.guests[saveGuestI].skills.push('scavenger');
                save.state.history[save.state.index].variables.guests[saveGuestI].traits.splice(saveGuestTraitI, 1);
                saveGuestTraitI--;
            }
        }

    }

    for(var saveCharI in save.state.history[save.state.index].variables.characters) {
        if (typeof save.state.history[save.state.index].variables.characters[saveCharI].age !== 'undefined' && typeof save.state.history[save.state.index].variables.characters[saveCharI].birthDate === 'undefined') {
            save.state.history[save.state.index].variables.characters[saveCharI].birthDate = setup.getBirthDate(save.state.history[save.state.index].variables.characters[saveCharI].age);
            delete save.state.history[save.state.index].variables.characters[saveCharI].age;
        }
        if (typeof save.state.history[save.state.index].variables.characters[saveCharI].race === 'undefined') {
            save.state.history[save.state.index].variables.characters[saveCharI].race = 'white';
            save.state.history[save.state.index].variables.characters[saveCharI].breasts = 'medium';
        }

	if (typeof save.state.history[save.state.index].variables.characters[saveCharI].likes === 'undefined') {
            save.state.history[save.state.index].variables.characters[saveCharI].likes = setup.getRandomGifts(either(1, 2));
            save.state.history[save.state.index].variables.characters[saveCharI].dislikes = setup.getRandomGifts(either(1, 2), save.state.history[save.state.index].variables.characters[saveCharI].likes);
        }

        if (!Array.isArray(save.state.history[save.state.index].variables.characters[saveCharI].traits ?? [])) {
            save.state.history[save.state.index].variables.characters[saveCharI].traits = [];
        }
        if (!Array.isArray(save.state.history[save.state.index].variables.characters[saveCharI].skills ?? [])) {
            save.state.history[save.state.index].variables.characters[saveCharI].skills = [];
        }

	if (typeof save.state.history[save.state.index].variables.characters[saveCharI].likesGuys === 'undefined') {
		save.state.history[save.state.index].variables.characters[saveCharI] = setup.setSexuality(save.state.history[save.state.index].variables.characters[saveCharI], 'straight');
        }
		
	if (typeof save.state.history[save.state.index].variables.characters[saveCharI].orientation !== 'undefined') {
		delete save.state.history[save.state.index].variables.characters[saveCharI].orientation;
        }

        if (typeof save.state.history[save.state.index].variables.characters[saveCharI].eyes === 'undefined') {  
            save.state.history[save.state.index].variables.characters[saveCharI].eyes = setup.eyesRoll(save.state.history[save.state.index].variables.characters[saveCharI].race, save.state.history[save.state.index].variables.characters[saveCharI].hair);
        }
    }

    for(var saveNurseryI in save.state.history[save.state.index].variables.nursery ?? []) {
        if (typeof save.state.history[save.state.index].variables.nursery[saveNurseryI].id === 'undefined') {
            save.state.history[save.state.index].variables.nursery[saveNurseryI].id = setup.generateUniqueKey(save.state.history[save.state.index].variables.nursery[saveNurseryI]);
        }

        for (var saveNurseryTraitI = 0; saveNurseryTraitI < (save.state.history[save.state.index].variables.nursery[saveNurseryI].traits ?? []).length; saveNurseryTraitI++) {
            if (setup.skills.hasOwnProperty(save.state.history[save.state.index].variables.nursery[saveNurseryI].traits[saveNurseryTraitI])) {
                if (typeof save.state.history[save.state.index].variables.nursery[saveNurseryI].skills === 'undefined') {
                    save.state.history[save.state.index].variables.nursery[saveNurseryI].skills = [];
                }
                save.state.history[save.state.index].variables.nursery[saveNurseryI].skills.push(save.state.history[save.state.index].variables.nursery[saveNurseryI].traits[saveNurseryTraitI]);
                save.state.history[save.state.index].variables.nursery[saveNurseryI].traits.splice(saveNurseryTraitI, 1);
                saveNurseryTraitI--;
            } else if (save.state.history[save.state.index].variables.nursery[saveNurseryI].traits[saveNurseryTraitI] === 'scavanger') {
                if (typeof save.state.history[save.state.index].variables.nursery[saveNurseryI].skills === 'undefined') {
                    save.state.history[save.state.index].variables.nursery[saveNurseryI].skills = [];
                }
                save.state.history[save.state.index].variables.nursery[saveNurseryI].skills.push('scavenger');
                save.state.history[save.state.index].variables.nursery[saveNurseryI].traits.splice(saveNurseryTraitI, 1);
                saveNurseryTraitI--;
            } else {
                save.state.history[save.state.index].variables.nursery[saveNurseryI].traits.splice(saveNurseryTraitI, 1);
                saveNurseryTraitI--;
            }
        }

        for (var saveNurserySkillI = 0; saveNurserySkillI < (save.state.history[save.state.index].variables.nursery[saveNurseryI].skills ?? []).length; saveNurserySkillI++) {
            if (setup.traits.hasOwnProperty(save.state.history[save.state.index].variables.nursery[saveNurseryI].skills[saveNurserySkillI])) {
                if (typeof save.state.history[save.state.index].variables.nursery[saveNurseryI].traits === 'undefined') {
                    save.state.history[save.state.index].variables.nursery[saveNurseryI].traits = [];
                }
                save.state.history[save.state.index].variables.nursery[saveNurseryI].traits.push(save.state.history[save.state.index].variables.nursery[saveNurseryI].skills[saveNurserySkillI]);
                save.state.history[save.state.index].variables.nursery[saveNurseryI].skills.splice(saveNurserySkillI, 1);
                saveNurserySkillI--;
            }
        }
    }

    for(var saveWantedI = 0; saveWantedI < (save.state.history[save.state.index].variables.wanted ?? []).length; saveWantedI++) {
        if (typeof save.state.history[save.state.index].variables.wanted[saveWantedI].birthDate === 'undefined') {
            save.state.history[save.state.index].variables.wanted[saveWantedI].birthDate = setup.getBirthDate(save.state.history[save.state.index].variables.wanted[saveWantedI].age);
            delete save.state.history[save.state.index].variables.wanted[saveWantedI].age;
        }

        if (typeof save.state.history[save.state.index].variables.wanted[saveWantedI].race === 'undefined') {
            save.state.history[save.state.index].variables.wanted[saveWantedI].race = 'white';
            save.state.history[save.state.index].variables.wanted[saveWantedI].breasts = 'medium';
        }

	if (typeof save.state.history[save.state.index].variables.wanted[saveWantedI].likes === 'undefined') {
            save.state.history[save.state.index].variables.wanted[saveWantedI].likes = setup.getRandomGifts(either(1, 2));
            save.state.history[save.state.index].variables.wanted[saveWantedI].dislikes = setup.getRandomGifts(either(1, 2), save.state.history[save.state.index].variables.wanted[saveWantedI].likes);
        } 
    }

    if ((variables.locationEvents.bathhouse ?? false) && !variables.backpack.has('blueprint_hot_tub')) {
        /* fix for older saves $locationEvents.bathhouse is true but blueprint not in backpack. */
        variables.backpack.pickup('blueprint_hot_tub', 1);
    }

    /* obselete variables */
    delete 
        save.state.history[save.state.index].variables.workbenchItems,
        save.state.history[save.state.index].variables.shopItems,
        save.state.history[save.state.index].variables.actionText;
});
