/**
 * Extra info for items
 */
setup.items = {
    /**
     * what scavening can find
     */
    scavenging : ['plastic', 'glass', 'rope', 'duck_tape', 'necklace_cheap', 'cloth', 'metal', 'fuel', 'book'],
    scavenging_chance: {
        'gas_mask': 20,
        'body_armor': 10
    },
    scavenging_max: {
        'book': 50
    },
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
            {name:'lube',price:10,sell:false},
            {name:'glass',price:15,sell:false},
            {name:'energy_drink',price:5,sell:false},
            {name:'gagball',price:15,sell:false},
        ],
        sanctuary: [
            {name:'metal',price:10,sell:false},
            {name:'bullet_revolver',price:10,sell:false},
            {name:'piercing',price:10},
            {name:'wedding_ring', price:10},
            {name:'gas_mask', price: 50, buy:false},
            {name:'fuel', price: 40, sell:false}
        ],
        cage_fight: [
            {name:'milk', price:4, sell:true, buy:false}
        ],
        race_stadium: [
            {name:'car_part', price:50, sell:false, buy:true}
        ]
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

    /**
     * The tag-functions semms to be missing in chapel simple inventory lib version v3.0.0-beta1, 2022-07-25. 
     * But ok in version v3.0.0, 2024-02-20
     */
    simple_inventory_missing: {
        // tags
        hasTag: function(tag) {
            // has the indicated tag, _tags not working
            return this.tags.includes(tag);
        },

        hasAllTags: function() {
            // has all the indicated tags
            return this.tags.includesAll([].slice.call(arguments).flat(Infinity));
        },

        hasAnyTags: function() {
            // has any of the indicated tags
            return this.tags.includesAny([].slice.call(arguments).flat(Infinity));
        },
    },
    simple_inv_fix: function() {
        if(!Item.prototype.hasOwnProperty('hasTag')) {
            /* Item.extendProtype doesn't seem to work either */
            /*Item.extendProtype(setup.items.simple_inventory_missing); */
            Item.prototype.hasTag = setup.items.simple_inventory_missing.hasTag;
            Item.prototype.hasAllTags = setup.items.simple_inventory_missing.hasAllTags;
            Item.prototype.hasAnyTags = setup.items.simple_inventory_missing.hasAnyTags;

        }
    },
};
