// Unit tests for js/sex.js. Run with `npm test` (Node 18+).
// The game's js/ files expect a global `setup`, so each file is loaded into a sandbox that provides one.
// This file is .cjs on purpose: the Twee compiler bundles every .js it finds into the game.
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function loadGameScripts(files) {
    const context = { setup: {} };
    vm.createContext(context);
    for (const file of files) {
        const fullPath = path.join(root, file);
        vm.runInContext(fs.readFileSync(fullPath, 'utf8'), context, { filename: fullPath });
    }
    return context.setup;
}

const setup = loadGameScripts(['js/sex.js']);
const { isThreesomeImplemented, threesomePair } = setup.sex;

const GENDERS = ['female', 'male', 'transfemale', 'transmale'];
const female = { id: 'f', gender: 0 };
const male = { id: 'm', gender: 1 };
const male2 = { id: 'm2', gender: 1 };
const trans = { id: 't', gender: 2 };

// Arrays created inside the sandbox have their own Array prototype, so compare them as plain copies
const plain = (value) => (value === null ? null : [...value]);

test('isThreesomeImplemented: the four scenes that exist', () => {
    assert.ok(isThreesomeImplemented(female, female));
    assert.ok(isThreesomeImplemented(female, male));
    assert.ok(isThreesomeImplemented(female, trans));
    assert.ok(isThreesomeImplemented(trans, female));
});

test('isThreesomeImplemented: missing combinations', () => {
    assert.ok(!isThreesomeImplemented(male, female), 'male + female only works swapped');
    assert.ok(!isThreesomeImplemented(male, male2));
    assert.ok(!isThreesomeImplemented(trans, male));
    assert.ok(!isThreesomeImplemented(male, trans));
});

test('threesomePair: two men and no woman gives null (the reported crash)', () => {
    assert.strictEqual(threesomePair([male, male2]), null);
});

test('threesomePair: trans and man gives null', () => {
    assert.strictEqual(threesomePair([trans, male]), null);
});

test('threesomePair: puts the woman first for woman + man', () => {
    assert.deepStrictEqual(plain(threesomePair([male, female])), [female, male]);
    assert.deepStrictEqual(plain(threesomePair([female, male])), [female, male]);
});

test('threesomePair: with three willing NPCs, keeps the first implemented pair', () => {
    assert.deepStrictEqual(plain(threesomePair([female, male, male2])), [female, male]);
    assert.deepStrictEqual(plain(threesomePair([male, male2, female])), [female, male]);
    assert.deepStrictEqual(plain(threesomePair([female, trans, male])), [female, trans]);
});

test('threesomePair: maps ids back with toNpc', () => {
    const guests = [male, male2, female];
    assert.deepStrictEqual(plain(threesomePair([0, 1, 2], (i) => guests[i])), [2, 0]);
    assert.strictEqual(threesomePair([0, 1], (i) => guests[i]), null);
});

test('threesomePair: fewer than two NPCs gives null', () => {
    assert.strictEqual(threesomePair([]), null);
    assert.strictEqual(threesomePair([female]), null);
});

test('threesomeImplemented matches the gender branches in actions.tw', () => {
    const actions = fs.readFileSync(path.join(root, 'views/npc/fuck/mc_threesome/actions.tw'), 'utf8');
    const branches = [...actions.matchAll(/\$tmpGirl\.gender === (\d) && \$tmpGirl2\.gender === (\d)/g)]
        .map((m) => `${m[1]},${m[2]}`)
        .sort();
    const implemented = [...setup.sex.threesomeImplemented].map(([a, b]) => `${a},${b}`).sort();
    assert.deepStrictEqual(branches, implemented);
});

test('the comment table in js/sex.js lists every combination with the right status', () => {
    const source = fs.readFileSync(path.join(root, 'js/sex.js'), 'utf8');
    const rows = [...source.matchAll(/^\s*\* \| (\w+)\s+\| (\w+)\s+\| \S+\s+\| (implemented|not implemented)/gm)];
    assert.strictEqual(rows.length, GENDERS.length * GENDERS.length, 'one row per combination');
    for (const [, first, second, status] of rows) {
        const a = { gender: GENDERS.indexOf(first) };
        const b = { gender: GENDERS.indexOf(second) };
        // a reversed pair counts as implemented, because <<threesome>> swaps the partners
        const expected = isThreesomeImplemented(a, b) || isThreesomeImplemented(b, a) ? 'implemented' : 'not implemented';
        assert.strictEqual(status, expected, `${first} + ${second}`);
    }
});
