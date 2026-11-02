// Unit tests for js/npcs.js. Run with `npm test` (Node 18+).
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

// Deterministic Park–Miller generator, so random tests are repeatable
function seededRng(seed = 42) {
    let state = seed;
    return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

const setup = loadGameScripts(['js/npcs.js']);
const pick = setup.npcs.pick;

test('pick: asking for more items than exist returns them all instead of looping forever', () => {
    assert.strictEqual(pick([1, 2], 5).length, 2);
    assert.strictEqual(pick([1, 2, 3], 3).length, 3);
});

test('pick: returns distinct items', () => {
    for (let run = 0; run < 200; run++) {
        const picked = pick([1, 2, 3, 4, 5, 6], 4, null, seededRng(run + 1));
        assert.strictEqual(new Set(picked).size, 4);
    }
});

test('pick: never mutates the input list', () => {
    const list = [1, 2, 3, 4, 5];
    pick(list, 3, null, seededRng());
    pick(list, 5, x => x > 1, seededRng(7));
    assert.deepStrictEqual(list, [1, 2, 3, 4, 5]);
});

test('pick: only returns items that pass the filter', () => {
    assert.deepStrictEqual(pick([1, 2, 3, 4], 9, x => x % 2 === 0).sort(), [2, 4]);
    assert.strictEqual(pick([1, 3, 5], 2, x => x % 2 === 0).length, 0);
});

test('pick: returns the items themselves, not copies or indices', () => {
    const ana = { id: 'ana' };
    const bea = { id: 'bea' };
    const picked = pick([ana, bea], 2);
    assert.ok(picked.includes(ana) && picked.includes(bea));
});

test('pick: defaults to one item', () => {
    assert.strictEqual(pick([1, 2, 3]).length, 1);
});

test('pick: zero, negative, fractional and missing counts', () => {
    assert.strictEqual(pick([1, 2, 3], 0).length, 0);
    assert.strictEqual(pick([1, 2, 3], -2).length, 0);
    assert.strictEqual(pick([1, 2, 3], 2.9).length, 2);
    assert.strictEqual(pick([1, 2, 3], NaN).length, 0);
});

test('pick: empty or non-array input gives an empty result', () => {
    assert.strictEqual(pick([], 3).length, 0);
    for (const input of [undefined, null, 'abc', { length: 2 }]) {
        const result = pick(input, 2);
        assert.ok(Array.isArray(result));
        assert.strictEqual(result.length, 0);
    }
});

test('pick: uses the rng it is given', () => {
    // rng always 0 → no swaps → the first n items, in order
    assert.deepStrictEqual(pick([1, 2, 3, 4], 2, null, () => 0), [1, 2]);
    // rng just below 1 → always swaps with the last remaining item
    assert.deepStrictEqual(pick([1, 2, 3, 4], 2, null, () => 0.9999), [4, 1]);
});

test('pick: an rng that returns exactly 1 does not produce undefined', () => {
    const picked = pick([1, 2, 3], 3, null, () => 1);
    assert.strictEqual(picked.length, 3);
    assert.ok(picked.every(x => x !== undefined));
});

test('pick: same seed gives the same result', () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8];
    assert.deepStrictEqual(pick(list, 4, null, seededRng(99)), pick(list, 4, null, seededRng(99)));
});

test('pick: every item is roughly equally likely', () => {
    const list = ['a', 'b', 'c', 'd', 'e'];
    const counts = Object.fromEntries(list.map(x => [x, 0]));
    const rng = seededRng(2026);
    const runs = 50000;
    for (let run = 0; run < runs; run++) {
        counts[pick(list, 1, null, rng)[0]]++;
    }
    const expected = runs / list.length;
    for (const item of list) {
        assert.ok(Math.abs(counts[item] - expected) < expected * 0.05, `${item} picked ${counts[item]} times, expected about ${expected}`);
    }
});
