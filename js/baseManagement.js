setup.baseManagement = {
    buildings: {
        solar_panel: {
			show: true,
			title: "Solar panel",
			description: "Connect solar panel to grid. Generates electricity",
			required: {
				solar_panel: 1
			},
			energy: 20,
			after: function() {
                variables().player.baseManagement ??= {};
                variables().player.baseManagement.buildings ??= {};
                variables().player.baseManagement.buildings.solar_panel ??= 0;
                variables().player.baseManagement.buildings.solar_panel++;
			},
			goto: "Settlement management",
            currentCount: true
		},
    },
    electricity: {
        consumption: function ()
        {
            return 0;
        },
        production: function ()
        {
            return variables().player?.baseManagement?.buildings?.solar_panel ?? 0;
        },
        total: function ()
        {
            return setup.baseManagement.electricity.production() - setup.baseManagement.electricity.consumption();
        }
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
            return 0;
        }
    }
}