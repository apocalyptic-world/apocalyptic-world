// Unit tests for js/npcs.js. Run with `npm test` (Node 18+).
// The game's js/ files expect a global `setup`, so each file is loaded into a sandbox that provides one.
// This file is .cjs on purpose: the Twee compiler bundles every .js it finds into the game.
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// globals: extra sandbox globals, e.g. a fake variables() for code that reads story variables
function loadGameScripts(files, globals = {}) {
    const context = { setup: {}, ...globals };
    vm.createContext(context);
    for (const file of files) {
        const fullPath = path.join(__dirname, '..', file);
        vm.runInContext(fs.readFileSync(fullPath, 'utf8'), context, { filename: fullPath });
    }
    return context;
}

// Sets and arrays made inside the sandbox are different classes from the ones here (instanceof Set fails across
// realms), so values the game code checks with instanceof are built in the sandbox, and results are copied out.
const sandbox = loadGameScripts(['js/npcs.js']);
const setup = sandbox.setup;
const { companionCount, companionInviteBonus, companionIds, parseLegacyCompanionKey } = setup.npcs;
const sandboxSet = values => vm.runInContext('(values) => new Set(values)', sandbox)(values);
const plain = value => JSON.parse(JSON.stringify(value));

function assertEmptyArray(value) {
    assert.ok(Array.isArray(value), 'expected an array');
    assert.strictEqual(value.length, 0);
}

test('companionCount: counts the keys of the $player.companions object', () => {
    assert.strictEqual(companionCount({}), 0);
    assert.strictEqual(companionCount({ 'guest:3': true }), 1);
    assert.strictEqual(companionCount({ 'guest:3': true, 'slave:0': true, 'character:blair': true }), 3);
});

test('companionCount: ignores entries that are set to a falsy value', () => {
    assert.strictEqual(companionCount({ 'guest:3': true, 'guest:4': false, 'slave:1': undefined, 'slave:2': null }), 1);
});

test('companionCount: accepts an array of ids', () => {
    assert.strictEqual(companionCount([]), 0);
    assert.strictEqual(companionCount(['ana', 'bea']), 2);
    assert.strictEqual(companionCount(['ana', null, '', undefined]), 1);
});

test('companionCount: accepts a Set of ids', () => {
    assert.strictEqual(companionCount(sandboxSet([])), 0);
    assert.strictEqual(companionCount(sandboxSet(['ana', 'bea', 'cid'])), 3);
});

test('companionCount: anything else counts as 0', () => {
    for (const value of [undefined, null, 0, 5, '', 'guest:3', true]) {
        assert.strictEqual(companionCount(value), 0, String(value));
    }
});

test('companionInviteBonus: no companions gives no bonus', () => {
    assert.strictEqual(companionInviteBonus({}), 0);
    assert.strictEqual(companionInviteBonus(undefined), 0);
});

test('companionInviteBonus: grows as the triangular number of the companion count', () => {
    const companions = n => Object.fromEntries(Array.from({ length: n }, (_, i) => ['guest:' + i, true]));
    assert.strictEqual(companionInviteBonus(companions(1)), 1);
    assert.strictEqual(companionInviteBonus(companions(2)), 3);
    assert.strictEqual(companionInviteBonus(companions(3)), 6);
    assert.strictEqual(companionInviteBonus(companions(4)), 10);
});

test('companionInviteBonus: is capped at 100', () => {
    assert.strictEqual(companionInviteBonus(Array.from({ length: 14 }, (_, i) => 'npc' + i)), 100);
    assert.strictEqual(companionInviteBonus(Array.from({ length: 50 }, (_, i) => 'npc' + i)), 100);
});

test('companionInviteBonus: the old `.length` bug — an object of companions is no longer treated as 0', () => {
    const playerCompanions = { 'guest:0': true, 'guest:1': true };
    assert.strictEqual(playerCompanions.length, undefined);
    assert.strictEqual(companionInviteBonus(playerCompanions), 3);
});

test('companionInviteBonus: works with the Set stored in $player.companions', () => {
    assert.strictEqual(companionInviteBonus(sandboxSet(['ana', 'bea', 'cid'])), 6);
});

test('parseLegacyCompanionKey: splits old position keys', () => {
    assert.deepStrictEqual(plain(parseLegacyCompanionKey('guest:3')), { type: 'guest', index: 3 });
    assert.deepStrictEqual(plain(parseLegacyCompanionKey('slave:0')), { type: 'slave', index: 0 });
});

test('parseLegacyCompanionKey: anything that is not a position key gives null', () => {
    for (const value of ['Anna731700000000', 'blair', 'guest:', 'guest:x', 'nursery:1', 'guest:3:1', '', undefined, null, 3]) {
        assert.strictEqual(parseLegacyCompanionKey(value), null, String(value));
    }
});

const lists = {
    guest: [{ id: 'g0' }, { id: 'g1' }, { id: 'g2' }, { id: 'g3' }],
    slave: [{ id: 's0' }, { name: 'no id yet' }]
};

test('companionIds: converts old position keys to the ids of the NPCs at those positions', () => {
    assert.deepStrictEqual(plain(companionIds({ 'guest:3': true, 'slave:0': true }, lists)), ['g3', 's0']);
});

test('companionIds: drops position keys that point at nobody or at an NPC without an id', () => {
    assert.deepStrictEqual(plain(companionIds({ 'guest:9': true, 'slave:1': true, 'guest:1': true }, lists)), ['g1']);
    assert.deepStrictEqual(plain(companionIds({ 'guest:1': true })), []);
});

test('companionIds: skips falsy entries and keeps object keys that are already ids', () => {
    assert.deepStrictEqual(plain(companionIds({ 'guest:0': false, blair: true, 'guest:2': true }, lists)), ['blair', 'g2']);
});

test('companionIds: passes Sets and arrays of ids through, without duplicates or empty entries', () => {
    assert.deepStrictEqual(plain(companionIds(sandboxSet(['g1', 'blair']), lists)), ['g1', 'blair']);
    assert.deepStrictEqual(plain(companionIds(['g1', 'g1', '', null, undefined, 7, 'g2'])), ['g1', 'g2']);
});

test('companionIds: anything else gives an empty list', () => {
    for (const value of [undefined, null, 0, 'guest:3', true]) {
        assertEmptyArray(companionIds(value, lists));
    }
});

/* setup.companions (js/npc/companion.js) reads story variables, so it runs against a fake variables() */
function companionGame(state) {
    const v = state;
    const context = loadGameScripts(['js/npcs.js', 'js/npc/companion.js'], { variables: () => v });
    // a minimal setup.getNpcById, like the game's: guests, slaves, nursery, then characters by id or key
    context.setup.getNpcById = function (id) {
        for (const npc of [...(v.slaves ?? []), ...(v.guests ?? []), ...(v.nursery ?? [])]) {
            if (npc.id === id) return npc;
        }
        for (const key in (v.characters ?? {})) {
            if (v.characters[key].id === id || key === id) return v.characters[key];
        }
        return null;
    };
    v.player.companions = vm.runInContext('(c) => c instanceof Array ? new Set(c) : c', context)(v.player.companions);
    return { setup: context.setup, v, context };
}

function freshState(companions = []) {
    return {
        player: { companions },
        guests: [{ id: 'ana', name: 'Ana' }, { id: 'bea', name: 'Bea' }, { id: 'cid', name: 'Cid' }],
        slaves: [{ id: 'dee', name: 'Dee' }],
        nursery: [{ id: 'kid', name: 'Kid' }],
        characters: { blair: { id: 'blair', name: 'Blair' } }
    };
}

function assertNothing(value) {
    assert.ok(value === undefined || value === null, 'expected nothing, got ' + JSON.stringify(value));
}

function assertIds(game, expected) {
    assert.deepStrictEqual(plain(game.setup.companions.ids()), expected);
}

test('companions: add / has / remove work with NPCs, copies of NPCs and ids', () => {
    const game = companionGame(freshState());
    const { companions } = game.setup;
    assert.strictEqual(companions.add(game.v.guests[1]), true);
    assert.strictEqual(companions.add('dee'), true);
    assert.strictEqual(companions.has({ ...game.v.guests[1] }), true, 'a copy like $tmpGirl is found by id');
    assert.strictEqual(companions.has('ana'), false);
    assert.strictEqual(companions.count(), 2);
    assert.strictEqual(companions.remove('bea'), true);
    assertIds(game, ['dee']);
});

test('companions: add still accepts the old (list, index) form', () => {
    const game = companionGame(freshState());
    game.setup.companions.add('guest', 2);
    game.setup.companions.add('slave', 0);
    assertIds(game, ['cid', 'dee']);
});

test('companions: add refuses NPCs without an id and keeps no duplicates', () => {
    const game = companionGame(freshState());
    assert.strictEqual(game.setup.companions.add({ name: 'nobody' }), false);
    assert.strictEqual(game.setup.companions.add('guest', 9), false);
    game.setup.companions.add('ana');
    game.setup.companions.add(game.v.guests[0]);
    assertIds(game, ['ana']);
});

test('companions: a companion stays the same NPC after someone before them leaves the list', () => {
    const game = companionGame(freshState(['cid']));
    game.v.guests.splice(0, 1);
    assert.strictEqual(game.setup.companionGet('cid').name, 'Cid');
    assert.strictEqual(game.setup.companions.list()[0].name, 'Cid');
});

test('companions: list skips ids that point at nobody, prune drops them', () => {
    const game = companionGame(freshState(['ana', 'gone', 'blair']));
    assert.deepStrictEqual(plain(game.setup.companions.list().map(n => n.name)), ['Ana', 'Blair']);
    assert.strictEqual(game.setup.companions.check(), false);
    assert.strictEqual(game.setup.companions.prune(), 1);
    assertIds(game, ['ana', 'blair']);
    assert.strictEqual(game.setup.companions.check(), true);
});

test('companions: set() converts an old position-key object in place', () => {
    const state = freshState();
    state.player.companions = { 'guest:1': true, 'slave:0': true };
    const game = companionGame(state);
    assert.strictEqual(game.setup.companions.has('bea'), true);
    assert.ok(vm.runInContext('(c) => c instanceof Set', game.context)(game.v.player.companions));
    assertIds(game, ['bea', 'dee']);
});

test('companionGet: resolves ids, characters and old position keys', () => {
    const game = companionGame(freshState());
    assert.strictEqual(game.setup.companionGet('bea').name, 'Bea');
    assert.strictEqual(game.setup.companionGet('blair').name, 'Blair');
    assert.strictEqual(game.setup.companionGet('guest:2').name, 'Cid');
    assert.strictEqual(game.setup.companionGet('slave:0').name, 'Dee');
    assertNothing(game.setup.companionGet('nobody'));
    assertNothing(game.setup.companionGet(undefined));
});

test('companions: where / listOf tell which list holds an NPC', () => {
    const game = companionGame(freshState());
    const { companions } = game.setup;
    assert.deepStrictEqual(plain(companions.where('cid')), { list: 'guest', index: 2 });
    assert.deepStrictEqual(plain(companions.where('dee')), { list: 'slave', index: 0 });
    assert.deepStrictEqual(plain(companions.where('kid')), { list: 'nursery', index: 0 });
    assert.deepStrictEqual(plain(companions.where('blair')), { list: 'character', key: 'blair' });
    assert.strictEqual(companions.where('nobody'), null);
    assert.strictEqual(companions.listOf('dee'), 'slave');
    assert.strictEqual(companions.listOf('nobody'), null);
});

test('companions: focus sets $tmpGirl and only the matching write-back id', () => {
    const game = companionGame(freshState());
    const { v } = game;
    v.slaveId = 0; v.childId = 3;
    assert.strictEqual(game.setup.companions.focus('bea'), v.guests[1]);
    assert.strictEqual(v.tmpGirl, v.guests[1]);
    assert.strictEqual(v.guestId, 1);
    assert.ok(!('slaveId' in v) && !('charId' in v) && !('childId' in v));

    game.setup.companions.focus('blair');
    assert.strictEqual(v.charId, 'blair');
    assert.ok(!('guestId' in v));
    assertNothing(game.setup.companions.focus('nobody'));
});

test('companions: getBySkill / getHorny / sanctuary_infiltration read the companions', () => {
    const state = freshState(['ana', 'bea', 'dee']);
    Object.assign(state.guests[0], { skills: ['doctor'], horny: 80, gender: 0, strength: 50 });
    Object.assign(state.guests[1], { skills: ['mechanic'], horny: 10, gender: 0, strength: 50 });
    Object.assign(state.slaves[0], { skills: ['doctor'], horny: 90, gender: 0, strength: 30 });
    const game = companionGame(state);
    const { companions } = game.setup;
    assert.deepStrictEqual(plain(companions.getDoctors().map(n => n.id)), ['ana', 'dee']);
    assert.deepStrictEqual(plain(companions.getBySkill(undefined, 'mechanic').map(n => n.id)), ['bea']);
    assert.deepStrictEqual(plain(companions.getHorny(50)), { 0: ['ana'] }, 'only guests count, like before');
    assert.strictEqual(companions.sanctuary_infiltration(undefined, 3, 40), false, 'Dee is too weak');
    assert.strictEqual(companions.sanctuary_infiltration(undefined, 3, 30), true);
    assert.strictEqual(companions.sanctuary_infiltration(undefined, 2, 30), false, 'wrong number of companions');
});

test('companions: clear empties them and leaves a saved copy alone', () => {
    const game = companionGame(freshState(['ana']));
    game.v.player.companionsHome = game.v.player.companions;
    game.setup.companions.clear();
    assert.strictEqual(game.setup.companions.count(), 0);
    assert.deepStrictEqual(Array.from(game.v.player.companionsHome), ['ana']);
});
