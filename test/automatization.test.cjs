// Unit tests for js/automatization.js. Run with `npm test` (Node 18+).
// The game's js/ files expect a global `setup`, so each file is loaded into a sandbox that provides one.
// This file is .cjs on purpose: the Twee compiler bundles every .js it finds into the game.
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function loadGameScripts(files) {
    const context = { setup: {} };
    vm.createContext(context);
    for (const file of files) {
        const fullPath = path.join(__dirname, '..', file);
        vm.runInContext(fs.readFileSync(fullPath, 'utf8'), context, { filename: fullPath });
    }
    return context.setup;
}

const setup = loadGameScripts(['js/automatization.js']);
const formatNpcList = setup.automatization.formatNpcList;

const ashley = { id: 'guest-1', name: 'Ashley' };
const elijah = { id: 'guest-2', name: 'Elijah' };
const otherAshley = { id: 'slave-7', name: 'Ashley' };

test('formatNpcList: NPC listed once prints only the name', () => {
    assert.strictEqual(formatNpcList([ashley]), 'Ashley');
});

test('formatNpcList: NPC wanting two arrows is shown once with a count', () => {
    assert.strictEqual(formatNpcList([ashley, ashley, elijah, elijah]), 'Ashley (x2), Elijah (x2)');
});

test('formatNpcList: mixes single and repeated entries, sorted by name', () => {
    assert.strictEqual(formatNpcList([elijah, ashley, ashley]), 'Ashley (x2), Elijah');
});

test('formatNpcList: different NPCs with the same name are not merged', () => {
    assert.strictEqual(formatNpcList([ashley, otherAshley, ashley]), 'Ashley, Ashley (x2)');
});

test('formatNpcList: empty list gives an empty string', () => {
    assert.strictEqual(formatNpcList([]), '');
});

test('formatNpcList: does not modify its input', () => {
    const list = [elijah, ashley, ashley];
    formatNpcList(list);
    assert.deepStrictEqual(list.map((n) => n.name), ['Elijah', 'Ashley', 'Ashley']);
});
