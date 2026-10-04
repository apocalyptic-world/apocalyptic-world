/**
 * Night: the world outside opens up after dark.
 *
 * On foot (Outside -> 'Explore - night') you choose to search with a light
 * (torch or lantern: better finds, but you can be seen) or keep to the dark
 * (stealth: fewer fights, fewer finds, sleepers are easier to take).
 * By car (Garage -> 'Car - Explore night') the car needs headlights.
 *
 * A trip is recorded on $player.nightTrip until the next sleep. It drives the
 * darkness penalty in fights and the energy cost of the late night.
 */
setup.night = {
    START_FROM: '20:00',
    START_TO: '23:00',
    FOOT_HOURS: 4,
    CAR_HOURS: 4,
    CAR_FUEL: 30,
    SLEEP_PENALTY_PER_HOUR: 10,
    DARK_DAMAGE: 0.75,

    /** Night trips can only be started in the evening window. */
    canStart: function () {
        return timeBetween(this.START_FROM, this.START_TO);
    },

    /** Best light available: a lantern needs a fuel can, a torch burns out after one night. */
    lightSource: function () {
        if (setup.cabinInventory.has('lantern') && setup.cabinInventory.has('fuel')) {
            return 'lantern';
        }
        if (setup.cabinInventory.has('torch')) {
            return 'torch';
        }
        return null;
    },

    useLight: function (light) {
        if (light === 'lantern') {
            setup.cabinInventory.drop('fuel', 1);
        } else if (light === 'torch') {
            setup.cabinInventory.drop('torch', 1);
        }
    },

    /** vehicle: 'foot' | 'car', mode: 'light' | 'dark' */
    startTrip: function (vehicle, mode, light) {
        variables().player.nightTrip = {
            day: variables().game.day,
            vehicle: vehicle,
            mode: mode,
            light: light || null
        };
    },

    trip: function () {
        return variables().player.nightTrip ?? null;
    },

    /** Out on a trip without light, and it is still night. */
    isDark: function () {
        const trip = this.trip();
        return !!trip && trip.mode === 'dark' && timeBetween('20:00', '06:00');
    },

    /** Where a night event sends you afterwards: foot trips end Outside, car trips in the Garage. */
    backPassage: function () {
        return this.trip()?.vehicle === 'car' ? 'Garage' : 'Outside';
    },

    hasHeadlights: function () {
        const car = variables().player.car ?? {};
        return !!car.headlights && !car.headlightsBroken;
    },

    /**
     * Loot tables for night finds. Each entry: [item, min, max, weight].
     * Rare entries have a low weight; the same item is never rolled twice.
     */
    lootTables: {
        building: [
            ['metal', 1, 3, 20], ['glass', 1, 2, 15], ['cloth', 1, 2, 15], ['rope', 1, 1, 10],
            ['fuel', 1, 1, 12], ['bullet_revolver', 2, 6, 12], ['car_part', 1, 1, 8], ['food', 1, 2, 10],
            ['gas_mask', 1, 1, 2], ['body_armor', 1, 1, 1]
        ],
        cache: [
            ['car_part', 1, 2, 15], ['bullet_revolver', 4, 10, 15], ['fuel', 1, 2, 15],
            ['bandage', 1, 2, 15], ['metal', 2, 4, 10], ['body_armor', 1, 1, 3]
        ],
        camp: [
            ['food', 2, 4, 20], ['fuel', 1, 1, 12], ['bullet_revolver', 2, 5, 12],
            ['rope', 1, 1, 10], ['cloth', 1, 2, 10], ['knife', 1, 1, 6]
        ],
        wreck: [
            ['car_part', 1, 1, 20], ['metal', 1, 2, 15], ['fuel', 1, 1, 10], ['glass', 1, 1, 8]
        ]
    },

    /**
     * Roll `rolls` distinct items from a loot table into the backpack.
     * Returns a readable list like "3 Metal, 1 Fuel can".
     */
    loot: function (table, rolls) {
        const pool = (this.lootTables[table] ?? []).slice();
        const found = [];
        for (let r = 0; r < rolls && pool.length; r++) {
            const total = pool.reduce((sum, entry) => sum + entry[3], 0);
            let pick = Math.random() * total;
            let index = 0;
            while (index < pool.length - 1 && pick >= pool[index][3]) {
                pick -= pool[index][3];
                index++;
            }
            const [item, min, max] = pool.splice(index, 1)[0];
            const count = randomInteger(min, max);
            variables().backpack.pickup(item, count);
            found.push(count + ' ' + (Item.get(item)?.name ?? item.replace(/_/g, ' ')).trim());
        }
        return found.join(', ');
    }
};
