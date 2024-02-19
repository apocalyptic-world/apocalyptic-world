/**
 * Extra info for items
 */
setup.items = {
    /**
     * what scavening can find
     */
    scavenging : ['plastic', 'glass', 'rope', 'duck_tape', 'necklace_cheap', 'cloth', 'metal', 'fuel'],
    /**
     * sold/bought in shops
     */
    shop : {
        farm: [
            {name:'food',price:1, sell: false},
            {name:'wood',price:1},
            {name:'axe', price:20},
            {name:'rope',price:10},
            {name:'alcohol',price:6,sell:false},
            {name:'tobacco',price:6,sell:false},
            {name:'glue',price:8,sell:false},
            {name:'soda',price:8,sell:false},
            // name:'milk', price:10, sell:false
        ],
        settlement: [
            {name:'wood',price:1},
            {name:'hay',price:1,sell:false},
            {name:'flower',price:6,sell:false},
            {name:'candy',price:6,sell:false},
            {name:'necklace_cheap',price:8,sell:false},
            {name:'plush',price:10,sell:false}
        ],
        underground: [
            {name:'bandage',price:10},
            {name:'knife',price:50, ratio:2},
            {name:'solar_panel',price:25, buyprice:30},
            {name:'fertility_potion', price: 15},
            {name:'pregnancy_speed_potion', price: 30},
            {name:'plastic', price: 10, sell: false},
            {name:'hair_dye_kit', price: 10},
            {name:'buttplug', price: 30},
            {name:'cloth', price: 5},
            {name:'piercing',price:10},
            {name:'cosmetics',price:8,sell:false},
            {name:'sextoy',price:10,sell:false},
            {name:'whippit',price:10,sell:false},
            {name:'xanax',price:10,sell:false},
            {name:'condom',price:12,sell:false},
            {name:'chastity_belt',price:30,sell:false},
        ],
        sanctuary: [
            {name:'metal',price:10,sell:false},
            {name:'bullet_revolver',price:10,sell:false},
            {name:'piercing',price:10},
            {name:'wedding_ring', price:10},
            {name:'gas_mask', price: 50, buy:false},
            {name:'fuel', price: 40, sell:false}
        ],
    },
    /**
     * Items shops sells and hero might buy.
     * Used for help-function
     * 
     * returns {shopname}[itemname...]
     */
    shopSells : function() {
        if(typeof setup.items.shopItems === 'undefined') {
            setup.items.shopItems = {};
            const shopItems = setup.items.shopItems;
            for(const shopname in setup.items.shop) {
                shopItems[shopname] = [];
                for(const item of setup.items.shop[shopname]) {
                    if(item.buy ?? true) {
                        shopItems[shopname].push(item.name);
                    }
                }
                if(shopname == 'farm') {
                    shopItems[shopname].push('milk');
                }
            }
        }
        return setup.items.shopItems;
    },
};


