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
}

setup.npcInventoryHas = function (npc, item) {
    const person = clone(npc);
    return (person.inventory ??= {})[item] ??= 0;
}

setup.npcInventoryCount = function (npc, item) {
    return setup.npcInventoryHas(npc, item);
}

setup.npcInventoryList = function (npc) {
    const person = clone(npc);
    const items = Object.keys(person.inventory ?? {});

    return items;
}
