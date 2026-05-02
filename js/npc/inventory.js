setup.npcInventoryMultipleItems = [
    'arrow'
];

setup.npcInventoryAdd = function (npc, item, amount = 1) {
    npc.inventory ??= {};
    npc.inventory[item] ??= 0;
    npc.inventory[item] += amount;
};

setup.npcInventoryRemove = function (npc, item, amount = 1) {
    npc.inventory[item] -= amount;
    if (npc.inventory[item] <= 0) {
        delete npc.inventory[item];
    }
};

setup.npcInventoryHas = function (npc, item) {
    const person = clone(npc);
    return (person.inventory ?? {})[item] ??= 0;
};

setup.npcInventoryCount = function (npc, item) {
    return setup.npcInventoryHas(npc, item);
};

setup.npcInventoryList = function (npc) {
    const person = clone(npc);
    const items = Object.keys(person.inventory ?? {});

    return items;
};

setup.npcDrink = function (npc, consumeChance = 50) {
    if (!setup.npcInventoryHas(npc, 'alcohol')) return;
    if (npc.pregnancy >= 7) return;
    const drunkCap = npc.happy >= 50 ? 55 : npc.happy >= 0 ? 60 : 70;
    if (npc.drunk > drunkCap) return;
    const drinkChance = npc.happy >= 50 ? 5 : npc.happy >= 0 ? 15 : 45;
    if (!setup.percentageChance(drinkChance)) return;
    npc.drunk = Math.min(99, npc.drunk + Math.floor(Math.random() * 36) + 20);
    npc.happy = Math.min(100, npc.happy + (npc.drunk <= 50 ? 1 : npc.drunk <= 75 ? 2 : npc.drunk < 95 ? 0 : -5));
    if (setup.percentageChance(consumeChance)) {
        setup.npcInventoryRemove(npc, 'alcohol');
    }
};