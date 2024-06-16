/**
 *  In cabin we have both $storage and $backpack */
setup.cabinInventory = {
    count: function (item) {
        const storeAvailable = variables().game.location.shop ?? false;
        return  (storeAvailable ? variables().storage.count(item) : 0) + variables().backpack.count(item);
    },

    has: function (item, count=1) {
        return this.count(item) >= count;
    },

    drop: function (item, count=1) {
        const storeAvailable = variables().game.location.shop ?? false;
        const backpack = variables().backpack;
        if (storeAvailable) {
            variables().storage.transfer(backpack, item, count);
        } 
        backpack.drop(item, count);
    },

    pickup: function (item, count=1) {
        if (variables().game.location.shop ?? false) {
            variables().storage.pickup(item, count);
        } else {
            variables().backpack.pickup(item, count);
        }
    },

    to_npc: function(npc, item, count=1) {
        count = Math.min(count, setup.cabinInventory.count(item));
        if (count <= 0) {return;};
        setup.npcInventoryAdd(npc, item, count);
        setup.cabinInventory.drop(item, count);
    },

    from_npc: function(npc, item, count=1) {
        count = Math.min(count, setup.npcInventoryCount(npc, item));
        if (count <= 0) {return;};
        setup.npcInventoryRemove(npc, item, count);
        setup.cabinInventory.pickup(item, count);
    },
};
/**
 * As cabinInventory but also checks inventory of npcs
 */
setup.cabinNpcInv = {
    count: function (item, npcs = []) {
        const cabinCount =  setup.cabinInventory.count(item);
        let npcCount = 0;
        for (const npc of npcs) {
            npcCount += setup.npcInventoryCount(npc, item);
        }
        return cabinCount + npcCount;
    },

    drop: function (item, count=1, npcs = []) {
        const cabinCount = setup.cabinInventory.count(item);
        if (cabinCount >= count, npcs = []) {
            setup.cabinInventory.drop(item, count);
            return;
        }
        setup.cabinInventory.drop(item, cabinCount);
        count -= cabinCount;
        for (const npc of npcs) {
            let npcCount = setup.npcInventoryCount(npc, item);
            if (npcCount >= count) {
                setup.npcInventoryRemove(npc, item, count);
                return;
            } else if (count) {
                setup.npcInventoryRemove(npc, item, npcCount);
                count -= npcCount;
            }
        }
        
    },
}

