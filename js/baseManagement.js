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
        hasElectricity: function()
        {
            return setup.baseManagement.electricity.production() && setup.baseManagement.electricity.total() >= 0;
        },
        list: {
            solar_panel: 1,
            hospital: -5,
            house: -0.5,
            milk_barn:-5
        },
    },
    defense: {
        description: function()
        {
            const _woodWalls = (variables().player?.baseManagement?.buildings['wood_wall'] ?? 0);
            if (_woodWalls >= 100) {
                return 'Around your settlement is wood wall. It will protect from small intruders and thieves.'
            }
            if (_woodWalls >= 50) {
                return 'More than half of your settlement is protected from intruders. They are still holes someone could get in.'
            }
            if (_woodWalls > 10) {
                return 'Small part of your settlement is behind walls. They are still big threats of intruders or thieves.'
            }
            
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

