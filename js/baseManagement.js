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
            let isSandStorm = variables().weather?.sandStorm;
            let isRain = variables().weather?.weather === 'rain';
            let production = 0;
            for (const _building in setup.baseManagement.electricity.list) {
                if (setup.baseManagement.electricity.list[_building] < 0) {
                    continue;
                }
                let electricityIncrease = ((variables().player?.baseManagement?.buildings[_building] ?? 0) * setup.baseManagement.electricity.list[_building]);

                if (_building === 'solar_panel') {
                    if (isSandStorm) {
                        continue;
                    }
                    if (isRain) {
                        electricityIncrease = Math.round(electricityIncrease / 2, 0);
                    }
                }

                production += electricityIncrease;
            }
            return production;
        },
        storage: function() {
            return variables().player?.baseManagement?.electricityStorage ?? 0;
        },
        storageMax: function() {
            let max = 0;
            let esuEnergy = (variables().player?.baseManagement?.buildings.esu ?? 0) * 50;

            return max + esuEnergy;
        },
        total: function (withStorage)
        {
            let total = setup.baseManagement.electricity.production() - setup.baseManagement.electricity.consumption(); 
            if (withStorage) {
                total += setup.baseManagement.electricity.storage();
            }

            return total;
        },
        hasElectricity: function()
        {
            return setup.baseManagement.electricity.total(true) >= 0;
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
            const settlerCount = setup.baseManagement.population.settlersCount();
            if (settlerCount > 0) {
                return 'You have <strong>' + settlerCount + '</strong> settlers living in your settlement';
            }

            return 'No visitors outside your people are living in your settlement';
        },
        livingHousesCount: function ()
        {
            return (variables().player?.baseManagement?.buildings['house'] ?? 0); 
        },
        settlersCount: function ()
        {
            return (variables().player?.baseManagement?.settlers ?? 0);
        },
        hasFreeHouse: function() 
        {
            return (setup.baseManagement.population.livingHousesCount() * 3) - setup.baseManagement.population.settlersCount() > 0;
        }
    }
}

