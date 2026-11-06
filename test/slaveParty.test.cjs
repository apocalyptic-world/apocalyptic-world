// Regression tests for the slave party offer in views/cabin/Basement.tw (fixed in 0986db0b).
// Run with `npm test` (Node 18+).
//
// The bug: "Throw a party" was offered with 4 adult girls in the basement, but the party's first scene picks
// 2 girls *without a chastity belt*. With fewer than 2 such girls the scene had no second girl and errored.
// The fix added the scene's own filter to the offer condition. The logic lives in passages, not in js/, so these
// tests read both passages and check that the offer and the scene keep asking for the same girls.
// This file is .cjs on purpose: the Twee compiler bundles every .js it finds into the game.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

// The <<if>> right before the 'Throw a party' link
function offerCondition() {
    const basement = read('views/cabin/Basement.tw');
    const match = basement.match(/<<if ([^\n]*)>>\s*<<link 'Throw a party'>>/);
    assert.ok(match, "Basement.tw: no <<if>> found right before <<link 'Throw a party'>>");
    return match[1];
}

// The offer counts girls with `$slaves.filter(s => …).length >= N`
function offerGirls() {
    const match = offerCondition().match(/\$slaves\.filter\((s => [^)]*\)[^)]*)\)\.length >= (\d+)/);
    assert.ok(match, 'Basement.tw: the party offer no longer counts the girls the first scene needs');
    return { filter: match[1], count: Number(match[2]) };
}

// The first scene picks them with `setup.npcs.pick($slaves, N, s => …)`
function sceneGirls() {
    const scene = read('views/cabin/Basement/Basement - slave party.tw');
    const match = scene.match(/<<set _girlSlaves = setup\.npcs\.pick\(\$slaves, (\d+), (s => .*?)\)>>/);
    assert.ok(match, 'Basement - slave party.tw: _girlSlaves is no longer picked with setup.npcs.pick($slaves, N, s => …)');
    return { filter: match[2], count: Number(match[1]) };
}

// Turns the filter text from the passage into a function; ages come from a stubbed setup.getAge
function compileFilter(source) {
    const fakeSetup = { getAge: (npc) => npc.age };
    return new Function('setup', `return (${source});`)(fakeSetup);
}

const girl = (extra = {}) => ({ gender: 0, age: 25, ...extra });
const belted = girl({ chastityBelt: true });
const man = { gender: 1, age: 30 };
const minor = girl({ age: 16 });

test('slave party: the offer uses the same filter as the girls the first scene picks', () => {
    assert.strictEqual(offerGirls().filter, sceneGirls().filter);
});

test('slave party: the offer asks for at least as many girls as the first scene picks', () => {
    assert.ok(offerGirls().count >= sceneGirls().count,
        `offer needs ${offerGirls().count}, scene picks ${sceneGirls().count}`);
});

test('slave party: girls with a chastity belt, men and minors do not count', () => {
    const accepts = compileFilter(offerGirls().filter);
    assert.strictEqual(accepts(girl()), true, 'adult girl without a belt');
    assert.strictEqual(accepts(belted), false, 'girl with a chastity belt');
    assert.strictEqual(accepts(man), false, 'man');
    assert.strictEqual(accepts(minor), false, 'girl under 18');
});

test('slave party: 4 adult girls but only 1 without a belt is not enough (the original bug)', () => {
    const { filter, count } = offerGirls();
    const slaves = [girl(), belted, belted, belted, man, man, man];
    assert.ok(slaves.filter(compileFilter(filter)).length < count);
});

test('slave party: 2 adult girls without a belt are enough', () => {
    const { filter, count } = offerGirls();
    const slaves = [girl(), girl(), belted, belted, man];
    assert.ok(slaves.filter(compileFilter(filter)).length >= count);
});
