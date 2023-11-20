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

/* In cabin we have both $storage and $backpack */
setup.cabinInvCount = function (item) {
    const storeAvailable = variables().game.location.shop ?? false;
    return  (storeAvailable ? variables().storage.count(item) : 0) + variables().backpack.count(item);
}

setup.cabinInvHas = function (item, count=1) {
    return setup.cabinInvCount(item) >= count;
}

setup.cabinInvDrop = function (item, count=1) {
    const storeAvailable = variables().game.location.shop ?? false;
    const backpack = variables().backpack;
    if (storeAvailable) {
        const storage = variables().storage;
        storage.transfer(backpack, item, count);
    } 
    backpack.drop(item, count);
}
/* && */