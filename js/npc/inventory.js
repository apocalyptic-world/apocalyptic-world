setup.npcInventoryAdd = function (npc, item) {
    npc.inventory ??= {};
    npc.inventory[item] ??= 0;
    npc.inventory[item]++;
};

setup.npcInventoryRemove = function (npc, item) {
    npc.inventory[item]--;
    if (npc.inventory[item] <= 0) {
        delete npc.inventory[item];
    }
}

setup.npcInventoryHas = function (npc, item) {
    const person = clone(npc);
    return (person.inventory ??= {})[item] ??= 0;
}

setup.npcInventoryCount = function (npc, item) {
    return setup.npcInventoryHas(np, item);
}

setup.npcInventoryList = function (npc) {
    const person = clone(npc);
    const items = Object.keys(person.inventory ?? {});

    return items;
}