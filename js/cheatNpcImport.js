/**
 * Cheat menu: copy guests, slaves and nursery kids out of a "Save to Disk" file into the current game.
 * The file is only read and decoded in memory; it is never written to.
 *
 *   decode(text)    file text -> { guests, slaves, nursery, version } (NPCs already prepared), or throws a player-facing Error
 *   prepare(npc)    copy fitted to this game: same age, no job/class/bed state from the other household
 *   apply(entries)  [{ npc, type: 'guest'|'slave'|'nursery', mode: 'overwrite'|'newId' }] appended to $guests / $slaves / $nursery
 *   bindDialog()    wires up the "Cheatmenu - import NPCs" dialog
 */
setup.npcImport = {
    /** Import type -> story variable it goes into */
    lists: { guest: 'guests', slave: 'slaves', nursery: 'nursery' },

    decode: function (text) {
        let save = null;
        try {
            save = Serial.parse(LZString.decompressFromBase64(String(text ?? '').trim()));
        } catch (ex) {
            save = null;
        }
        if (save === null || typeof save !== 'object') {
            throw new Error('This file is not a save file. Choose a .save file made with "Save to Disk".');
        }
        if (Array.isArray(save.auto) && Array.isArray(save.slot)) {
            throw new Error('This is a saves bundle, which holds all of your browser saves at once. Load the save you want, use "Save to Disk" to export it on its own, then import that .save file.');
        }
        if (!save.state || !Array.isArray(save.state.delta)) {
            throw new Error('This file is not a single game save. Choose a .save file made with "Save to Disk".');
        }
        if (save.id !== Config.saves.id) {
            throw new Error('This save belongs to a different game.');
        }

        let vars = null;
        try {
            const history = State.deltaDecode(save.state.delta);
            vars = history[save.state.index ?? history.length - 1]?.variables ?? null;
        } catch (ex) {
            vars = null;
        }
        if (!vars) {
            throw new Error('The save file could not be read. It may be damaged.');
        }

        const srcDate = vars.gameDate instanceof Date ? vars.gameDate : null;
        const pick = list => (Array.isArray(list) ? list : [])
            .filter(npc => npc && typeof npc === 'object')
            .map(npc => this.prepare(npc, srcDate));
        return {
            guests: pick(vars.guests),
            slaves: pick(vars.slaves),
            nursery: pick(vars.nursery),
            version: save.metadata?.version ?? 'unknown'
        };
    },

    prepare: function (npc, srcDate) {
        let copy = clone(npc);

        // Keep her age: move the birth date by however far this game's clock is from the source save's
        const now = variables().gameDate;
        if (copy.birthDate instanceof Date && srcDate && now instanceof Date) {
            copy.birthDate = new Date(copy.birthDate.getTime() + (now.getTime() - srcDate.getTime()));
        } else if (!(copy.birthDate instanceof Date) && typeof copy.age === 'number') {
            copy.birthDate = setup.getBirthDate(copy.age);
            delete copy.age;
        }

        // Job, school/evening class and bed state belong to the other household
        delete copy.assignedTo;
        delete copy.teach;
        delete copy.teachAdvStudy;
        delete copy.noBed;
        delete copy.waitingForBed;
        delete copy.coldSnapOuting;

        // Fields older saves may lack (onSaveLoad.js only fixes up the save being loaded)
        copy.id ??= setup.generateUniqueKey(copy);
        copy.strength ??= 0;
        copy.endurance ??= 0;
        if (typeof copy.personality === 'undefined') {
            copy.personality = setup.personalityTraits(2);
        }
        if (typeof copy.likesGuys === 'undefined') {
            copy = setup.setSexuality(copy, 'straight');
        }
        if (!copy.clothes) {
            copy.clothes = setup.getRandomNpcClothes(copy) ?? {};
        }
        return copy;
    },

    /** Where an id already lives in this household: { list: 'guests'|'slaves'|'nursery', index, npc } or null. */
    findInHousehold: function (id) {
        const v = variables();
        for (const list of ['guests', 'slaves', 'nursery']) {
            const index = (v[list] ?? []).findIndex(n => n?.id === id);
            if (index > -1) {
                return { list, index, npc: v[list][index] };
            }
        }
        return null;
    },

    freshId: function (npc) {
        let id = setup.generateUniqueKey(npc);
        for (let n = 2; this.findInHousehold(id); n++) {
            id = setup.generateUniqueKey(npc) + '-' + n;
        }
        return id;
    },

    apply: function (entries) {
        const v = variables();
        const result = { guests: 0, slaves: 0, nursery: 0, replaced: 0, renamed: 0 };

        for (const entry of entries) {
            const target = this.lists[entry.type];
            const npc = entry.npc;
            const found = this.findInHousehold(npc.id);

            if (found && entry.mode === 'overwrite') {
                result.replaced++;
                if (found.list === target) {
                    v[target][found.index] = npc; // same list: keep her place (and companion slot)
                    continue;
                }
                if (found.list === 'guests') {
                    $.wiki('<<guestRemove ' + found.index + '>>');
                } else if (found.list === 'slaves') {
                    $.wiki('<<slaveRemove ' + found.index + '>>');
                } else {
                    v.nursery.splice(found.index, 1);
                }
            } else if (found) {
                npc.id = this.freshId(npc);
                result.renamed++;
            }
            (v[target] ??= []).push(npc);
            result[target]++;
        }

        // It's a cheat: make room for everyone instead of refusing
        if (v.guests.length > setup.guestRoom.limit()) {
            v.guesthouseLimit = v.guests.length;
        }
        if (v.slaves.length > (v.basementLimit ?? 3)) {
            v.basementLimit = v.slaves.length;
        }
        return result;
    },

    bindDialog: function () {
        const self = this;
        const $root = $('#npc-import');
        const $warning = $root.find('.npc-import-warning');
        const $body = $root.find('.npc-import-body');
        let loaded = null;
        let selected = new Set(); // 'guest:3', kept so Back from the conflict step restores the ticks

        const warn = function (message) {
            $warning.text(message).toggle(!!message);
        };

        const nameSpan = function (npc) {
            return $('<span>')
                .addClass('gender-' + setup.genderClass(npc))
                .css('color', npc.color || '')
                .text(npc.name || '(no name)');
        };

        const finish = function () {
            Dialog.close();
            Engine.play(State.passage);
        };

        const renderDone = function (result) {
            const parts = [];
            if (result.guests) parts.push(result.guests + ' guest' + (result.guests > 1 ? 's' : '') + ' added to the guest house');
            if (result.slaves) parts.push(result.slaves + ' slave' + (result.slaves > 1 ? 's' : '') + ' added to the basement');
            if (result.nursery) parts.push(result.nursery + ' kid' + (result.nursery > 1 ? 's' : '') + ' added to the nursery');
            if (result.replaced) parts.push(result.replaced + ' existing NPC' + (result.replaced > 1 ? 's' : '') + ' overwritten');
            if (result.renamed) parts.push(result.renamed + ' given a new id');
            $root.find('.npc-import-file').remove();
            $body.empty()
                .append($('<p>').text('Import complete: ' + parts.join(', ') + '.'))
                .append($('<button class="link-internal npc-import-button">').text('Done').on('click', finish));
        };

        const renderConflicts = function (entries) {
            const conflicts = entries.filter(e => self.findInHousehold(e.npc.id));
            if (!conflicts.length) {
                renderDone(self.apply(entries));
                return;
            }
            $body.empty().append($('<p>').text('These NPCs share an id with someone already in your household. Choose what to do with each:'));
            const typeName = { guests: 'guest', slaves: 'slave', nursery: 'nursery kid' };
            conflicts.forEach(function (entry, i) {
                const found = self.findInHousehold(entry.npc.id);
                const group = 'npcImportConflict' + i;
                const $row = $('<div class="npc-import-conflict">')
                    .append($('<div>')
                        .append(nameSpan(entry.npc))
                        .append(document.createTextNode(' (' + typeName[self.lists[entry.type]] + ' in the file) matches your ' + typeName[found.list] + ' '))
                        .append(nameSpan(found.npc)));
                [['newId', 'Add as a new NPC with a new id'], ['overwrite', 'Overwrite your existing NPC']].forEach(function ([mode, label]) {
                    $('<label>')
                        .append($('<input type="radio">').attr({ name: group, value: mode }).prop('checked', mode === 'newId')
                            .on('change', function () { entry.mode = mode; }))
                        .append(document.createTextNode(' ' + label))
                        .appendTo($row);
                });
                entry.mode = 'newId';
                $body.append($row);
            });
            $body
                .append($('<button class="link-internal npc-import-button">').text('Confirm import').on('click', function () {
                    renderDone(self.apply(entries));
                }))
                .append($('<button class="link-internal npc-import-button">').text('Back').on('click', renderLists));
        };

        const sections = {
            guest:   { title: 'Guests',       building: 'guesthouse', missing: 'You have no guest house yet, so guests cannot be imported.' },
            slave:   { title: 'Slaves',       building: 'basement',   missing: 'You have no basement yet, so slaves cannot be imported.' },
            nursery: { title: 'Nursery kids', building: 'nursery',    missing: 'You have no nursery yet, so nursery kids cannot be imported.' }
        };

        const capacityNote = function (type) {
            const v = variables();
            if (type === 'guest') {
                return 'Guest house: ' + v.guests.length + ' of ' + setup.guestRoom.limit() + ' beds used. More are added if your selection needs them.';
            }
            if (type === 'slave') {
                return 'Basement: ' + v.slaves.length + ' of ' + (v.basementLimit ?? 3) + ' cells used. More are added if your selection needs them.';
            }
            return 'Nursery: ' + (v.nursery ?? []).length + ' kids. Kids who are already 18 move to the guest house overnight when a bed is free.';
        };

        const renderSection = function (type, npcs) {
            const section = sections[type];
            const built = variables().game.location[section.building] ?? false;
            const $set = $('<fieldset class="npc-import-list">').attr('data-type', type)
                .append($('<legend>').text(section.title + ' in the file (' + npcs.length + ')'));

            if (!built) {
                $set.append($('<p class="npc-import-note">').text(section.missing));
            } else if (!npcs.length) {
                $set.append($('<p class="npc-import-note">').text('None.'));
            } else {
                $set.append($('<p class="npc-import-note">').text(capacityNote(type)));
                $set.append($('<div class="npc-import-all">')
                    .append($('<a>').text('Select all').on('click', () => $set.find('input[type=checkbox]').prop('checked', true)))
                    .append(document.createTextNode(' | '))
                    .append($('<a>').text('Select none').on('click', () => $set.find('input[type=checkbox]').prop('checked', false))));
                npcs.forEach(function (npc, i) {
                    const $label = $('<label class="npc-import-npc">')
                        .append($('<input type="checkbox">').attr('data-index', i).prop('checked', selected.has(type + ':' + i)))
                        .append(' ')
                        .append(nameSpan(npc))
                        .append($('<span class="npc-import-age">').text(' (' + setup.getAge(npc) + ')'));
                    if (self.findInHousehold(npc.id)) {
                        $label.append($('<span class="npc-import-dupe">').text(' already in your household'));
                    }
                    $set.append($label);
                });
            }
            return $set;
        };

        const renderLists = function () {
            warn('');
            $body.empty()
                .append($('<p class="npc-import-note">').text('Save made on version ' + loaded.version + '. Imported NPCs keep their age and start with no job.'))
                .append(renderSection('guest', loaded.guests))
                .append(renderSection('slave', loaded.slaves))
                .append(renderSection('nursery', loaded.nursery))
                .append($('<button class="link-internal npc-import-button">').text('Import selected').on('click', function () {
                    const entries = [];
                    selected = new Set();
                    $body.find('.npc-import-list').each(function () {
                        const type = $(this).attr('data-type');
                        const source = loaded[self.lists[type]];
                        $(this).find('input[type=checkbox]:checked').each(function () {
                            const index = Number($(this).attr('data-index'));
                            selected.add(type + ':' + index);
                            entries.push({ npc: clone(source[index]), type });
                        });
                    });
                    if (!entries.length) {
                        warn('Select at least one NPC to import.');
                        return;
                    }
                    warn('');
                    renderConflicts(entries);
                }));
        };

        $root.find('.npc-import-file').on('change', function () {
            const file = this.files[0];
            loaded = null;
            selected = new Set();
            warn('');
            $body.empty();
            if (!file) {
                return;
            }
            if (/\.savesbundle$/i.test(file.name)) {
                warn('This is a saves bundle, which holds all of your browser saves at once. Load the save you want, use "Save to Disk" to export it on its own, then import that .save file.');
                return;
            }
            const reader = new FileReader();
            reader.onload = function () {
                try {
                    loaded = self.decode(reader.result);
                } catch (ex) {
                    warn(ex.message);
                    return;
                }
                if (!loaded.guests.length && !loaded.slaves.length && !loaded.nursery.length) {
                    warn('This save has no guests, slaves or nursery kids to import.');
                    return;
                }
                renderLists();
            };
            reader.onerror = function () {
                warn('The file could not be read.');
            };
            reader.readAsText(file);
        });
    }
};
