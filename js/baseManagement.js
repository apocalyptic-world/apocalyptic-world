setup.baseManagement = {
    electricity: {
        consumption: function ()
        {
            let consumption = 0;
            for (const _building in setup.baseManagement.electricity.list) {
                if (setup.baseManagement.electricity.list[_building] > 0) {
                    continue;
                }
                consumption += Math.abs(((variables().player?.baseManagement?.buildings[_building] ?? 0) * setup.baseManagement.electricity.list[_building]));
            }
            return consumption;
        },
        production: function ()
        {
            let production = 0;
            for (const _building in setup.baseManagement.electricity.list) {
                if (setup.baseManagement.electricity.list[_building] < 0) {
                    continue;
                }
                production += ((variables().player?.baseManagement?.buildings[_building] ?? 0) * setup.baseManagement.electricity.list[_building]);
            }
            return production;
        },
        total: function ()
        {
            return setup.baseManagement.electricity.production() - setup.baseManagement.electricity.consumption();
        },
        list: {
            solar_panel: 1,
            hospital: -5,
            house: -0.5
        },
    },
    defense: {
        description: function()
        {
            return 'Almost no defense. No walls, only some gates in the middle of the road.'
        }
    },
    population: {
        description: function()
        {
            return 'No visitors outside your people are living in your settlement.';
        },
        livingHousesCount: function ()
        {
            return (variables().player?.baseManagement?.buildings['house'] ?? 0); 
        }
    }
}

