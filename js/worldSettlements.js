setup.settlements = {

	// -------------------------------------------------------------------------
	// CONSTANTS
	// -------------------------------------------------------------------------

	types: {
		BIKER_GANG:         'biker_gang',
		SURVIVOR_CAMP:      'survivor_camp',
		MONASTERY:          'monastery',
		CONVENT:            'convent',
		TRADING_POST:       'trading_post',
		RAIDER_CAMP:        'raider_camp',
		CULT_COMPOUND:      'cult_compound',
		MILITARY_BASE:      'military_base',
		FARMING_COMMUNITY:  'farming_community',
		MEDICAL_COLONY:     'medical_colony',
		TRIBAL_VILLAGE:     'tribal_village',
		PRISON_COLONY:      'prison_colony',
		NOMAD_CARAVAN:      'nomad_caravan',
		AMAZONIAN_TRIBE:    'amazonian_tribe',
		SCAVENGER_DEN:      'scavenger_den',
	},

	relationship: {
		HOSTILE:    'hostile',     // -100 to -60
		UNFRIENDLY: 'unfriendly',  //  -59 to -20
		NEUTRAL:    'neutral',     //  -19 to  19
		FRIENDLY:   'friendly',    //   20 to  59
		ALLIED:     'allied',      //   60 to 100
	},

	genderComp: {
		ALL_MALE:      'all_male',
		MOSTLY_MALE:   'mostly_male',
		MIXED:         'mixed',
		MOSTLY_FEMALE: 'mostly_female',
		ALL_FEMALE:    'all_female',
	},

	// Prices for items that don't appear in any setup.items.shop entry
	_extraPrices: {
		duck_tape: 8, book: 20, body_armor: 100,
	},

	/**
	 * Look up an item's base price from setup.items.shop, falling back to
	 * _extraPrices, then a default of 10.  Result is cached after first call.
	 */
	getItemPrice: function (itemName) {
		if (!setup.settlements._priceCache) {
			const cache = {};
			for (const shopName in setup.items.shop) {
				for (let i = 0; i < setup.items.shop[shopName].length; i++) {
					const entry = setup.items.shop[shopName][i];
					if (!(entry.name in cache)) {
						cache[entry.name] = entry.price;
					}
				}
			}
			setup.settlements._priceCache = cache;
		}
		return setup.settlements._priceCache[itemName]
			|| setup.settlements._extraPrices[itemName]
			|| 10;
	},

	// -------------------------------------------------------------------------
	// TYPE CONFIG
	// -------------------------------------------------------------------------

	typeConfig: {
		biker_gang: {
			names:             ['Iron Wolves', 'Rust Devils', 'Chrome Reapers', 'Dead Riders', 'Hellfire Crew', 'Bone Grinders'],
			genderComp:        'mostly_male',
			baseRelationship:  -40,
			sizeRange:         [15, 80],
			traits:            ['armed', 'aggressive', 'road_savvy'],
			production:        { fuel: 3, alcohol: 2, bullet_revolver: 2 },
			tradeGoods:        ['fuel', 'alcohol', 'knife', 'bullet_revolver', 'axe'],
			wantsGoods:        ['car_part', 'metal', 'rope', 'duck_tape', 'food'],
			defenseMultiplier: 1.9,
			description:       'A rough biker gang operating out of an old garage. Loud engines, short fuses.',
			canSlaveTrade:     true,
			recruitDifficulty: 3,
		},
		survivor_camp: {
			names:             ['Haven', 'Refuge', 'Shelter', 'Safe Harbor', 'Crossroads Camp', 'The Gathering', 'Last Stop'],
			genderComp:        'mixed',
			baseRelationship:  0,
			sizeRange:         [10, 60],
			traits:            ['cautious', 'resourceful'],
			production:        { food: 2, wood: 2, cloth: 1 },
			tradeGoods:        ['food', 'wood', 'cloth', 'rope', 'bandage'],
			wantsGoods:        ['bandage', 'knife', 'bullet_revolver', 'fuel', 'plastic'],
			defenseMultiplier: 1.2,
			description:       'A mixed group of survivors who banded together for safety after the collapse.',
			canSlaveTrade:     false,
			recruitDifficulty: 1,
		},
		monastery: {
			names:             ["Saint Dominic's", 'The Brotherhood', 'Order of the New Dawn', 'Monastery of St. Jude', 'The Cloister', 'The Hermitage'],
			genderComp:        'all_male',
			baseRelationship:  10,
			sizeRange:         [8, 40],
			traits:            ['religious', 'disciplined', 'peaceful'],
			production:        { food: 3, alcohol: 2, bandage: 1 },
			tradeGoods:        ['food', 'alcohol', 'bandage', 'cloth', 'hay', 'book'],
			wantsGoods:        ['book', 'glass', 'glue', 'cloth', 'metal'],
			defenseMultiplier: 1.0,
			description:       'A community of monks living by strict religious codes, farming the land and preserving old knowledge.',
			canSlaveTrade:     false,
			recruitDifficulty: 2,
		},
		convent: {
			names:             ['Sisters of Mercy', 'The Sisterhood', "Order of St. Claire", 'Blessed Refuge', 'The Abbey', 'Sisters of the Last Light'],
			genderComp:        'all_female',
			baseRelationship:  10,
			sizeRange:         [8, 40],
			traits:            ['religious', 'disciplined', 'healing'],
			production:        { food: 2, bandage: 3, cloth: 2 },
			tradeGoods:        ['food', 'bandage', 'cloth', 'fertility_potion'],
			wantsGoods:        ['glass', 'plastic', 'metal', 'food', 'cloth'],
			defenseMultiplier: 0.8,
			description:       'A convent of nuns providing sanctuary and medical care, guided by old religious doctrine.',
			canSlaveTrade:     false,
			recruitDifficulty: 2,
		},
		trading_post: {
			names:             ['The Crossroads', 'Market Hub', 'Trade Junction', 'The Exchange', "Merchant's Rest", 'The Bazaar', 'The Hub'],
			genderComp:        'mixed',
			baseRelationship:  20,
			sizeRange:         [20, 150],
			traits:            ['mercantile', 'neutral_ground', 'well_informed'],
			production:        { necklace_cheap: 2, wedding_ring: 1, food: 1 },
			tradeGoods:        ['food', 'bandage', 'knife', 'fuel', 'metal', 'plastic', 'necklace_cheap', 'wedding_ring', 'alcohol', 'cloth', 'solar_panel'],
			wantsGoods:        ['food', 'bandage', 'cloth', 'metal', 'fuel', 'car_part'],
			defenseMultiplier: 1.4,
			description:       'A bustling trading post where merchants and travellers meet. Neutral ground by unspoken agreement.',
			canSlaveTrade:     true,
			recruitDifficulty: 1,
		},
		raider_camp: {
			names:             ['The Pit', 'Skull Hollow', 'Bloodrock', 'Desolation Row', 'Gravemound', "Butcher's Yard"],
			genderComp:        'mostly_male',
			baseRelationship:  -70,
			sizeRange:         [10, 60],
			traits:            ['aggressive', 'violent', 'opportunistic'],
			production:        { knife: 2, bullet_revolver: 2 },
			tradeGoods:        ['knife', 'axe', 'bullet_revolver', 'gas_mask', 'body_armor'],
			wantsGoods:        ['fuel', 'alcohol', 'bandage', 'food', 'car_part'],
			defenseMultiplier: 2.2,
			description:       'A brutal raider camp that preys on travellers and any settlement too weak to fight back.',
			canSlaveTrade:     true,
			recruitDifficulty: 4,
		},
		cult_compound: {
			names:             ['The Flock', 'New Eden', 'Promised Land', 'The Revelation', 'Circle of Truth', 'The Chosen'],
			genderComp:        'mixed',
			baseRelationship:  -20,
			sizeRange:         [15, 80],
			traits:            ['fanatical', 'isolationist', 'charismatic_leader'],
			production:        { food: 3, cloth: 1, flower: 1 },
			tradeGoods:        ['food', 'cloth', 'flower'],
			wantsGoods:        ['book', 'food', 'cloth', 'candle', 'flower'],
			defenseMultiplier: 1.1,
			description:       'A cult compound led by a charismatic figure. Outsiders are viewed with deep suspicion — or as potential converts.',
			canSlaveTrade:     false,
			recruitDifficulty: 3,
		},
		military_base: {
			names:             ['Fort Valor', 'Camp Steel', 'Firebase Omega', 'Redoubt Alpha', 'The Garrison', 'Fortress Knox'],
			genderComp:        'mostly_male',
			baseRelationship:  -10,
			sizeRange:         [30, 200],
			traits:            ['disciplined', 'armed', 'fortified', 'hierarchical'],
			production:        { knife: 2, bullet_revolver: 4, fuel: 2 },
			tradeGoods:        ['knife', 'bullet_revolver', 'fuel', 'bandage', 'gas_mask', 'body_armor'],
			wantsGoods:        ['metal', 'plastic', 'fuel', 'food', 'bandage', 'solar_panel'],
			defenseMultiplier: 2.7,
			description:       'A heavily fortified military installation. Strict rules, heavy armament, no sense of humour.',
			canSlaveTrade:     false,
			recruitDifficulty: 4,
		},
		farming_community: {
			names:             ['Greenfield', 'Harvest Ridge', 'Prairie Home', 'Sundown Farm', 'Bountiful Valley', 'The Grange'],
			genderComp:        'mixed',
			baseRelationship:  15,
			sizeRange:         [15, 100],
			traits:            ['agricultural', 'peaceful', 'community'],
			production:        { food: 5, wood: 2, hay: 2, alcohol: 1, milk: 1 },
			tradeGoods:        ['food', 'wood', 'hay', 'alcohol', 'cloth', 'rope', 'milk', 'tobacco'],
			wantsGoods:        ['axe', 'rope', 'bandage', 'metal', 'fuel', 'plastic'],
			defenseMultiplier: 1.0,
			description:       'A farming community that has managed to cultivate crops and raise animals in the ruins of the old world.',
			canSlaveTrade:     false,
			recruitDifficulty: 1,
		},
		medical_colony: {
			names:             ['Hippocrates Haven', 'The Clinic', 'Medfield', 'New Asclepius', "Healer's Rest", 'The Infirmary'],
			genderComp:        'mostly_female',
			baseRelationship:  30,
			sizeRange:         [10, 50],
			traits:            ['healing', 'knowledgeable', 'humanitarian'],
			production:        { bandage: 5, fertility_potion: 1, xanax: 1 },
			tradeGoods:        ['bandage', 'fertility_potion', 'pregnancy_speed_potion', 'xanax'],
			wantsGoods:        ['glass', 'plastic', 'metal', 'food', 'cloth', 'book'],
			defenseMultiplier: 0.7,
			description:       'A medical facility staffed by doctors and nurses trying to preserve medical knowledge and save lives.',
			canSlaveTrade:     false,
			recruitDifficulty: 2,
		},
		tribal_village: {
			names:             ['The Tribe', 'Stonewood', "Eagle's Roost", 'River Clan', 'Thornwood', 'The Circle', 'Wolf Den'],
			genderComp:        'mixed',
			baseRelationship:  -5,
			sizeRange:         [20, 120],
			traits:            ['traditional', 'territorial', 'nature'],
			production:        { food: 3, wood: 2, bandage: 1 },
			tradeGoods:        ['food', 'wood', 'bandage', 'cloth', 'rope'],
			wantsGoods:        ['metal', 'knife', 'bandage', 'cloth', 'rope', 'axe'],
			defenseMultiplier: 1.5,
			description:       'A tribal village with its own laws and customs. Outsiders must earn their trust.',
			canSlaveTrade:     false,
			recruitDifficulty: 2,
		},
		prison_colony: {
			names:             ['The Pens', 'Irongate', 'The Colony', 'Coldwater', 'The Yard', 'Block Zero'],
			genderComp:        'mostly_male',
			baseRelationship:  -50,
			sizeRange:         [40, 200],
			traits:            ['dangerous', 'organised_crime', 'brutal'],
			production:        { metal: 3, wood: 2, plastic: 1 },
			tradeGoods:        ['metal', 'plastic', 'knife', 'bullet_revolver', 'rope'],
			wantsGoods:        ['food', 'alcohol', 'tobacco', 'fuel', 'bandage'],
			defenseMultiplier: 2.0,
			description:       'A former prison now run by the inmates, operating like a brutal organised crime syndicate.',
			canSlaveTrade:     true,
			recruitDifficulty: 5,
		},
		nomad_caravan: {
			names:             ['The Wanderers', 'Road Merchants', 'The Caravan', "Drifters' Guild", 'The Convoy', 'The Roadband'],
			genderComp:        'mixed',
			baseRelationship:  10,
			sizeRange:         [10, 50],
			traits:            ['mobile', 'mercantile', 'well_informed'],
			production:        { necklace_cheap: 2, car_part: 1, wedding_ring: 1 },
			tradeGoods:        ['bandage', 'food', 'cloth', 'fuel', 'metal', 'necklace_cheap', 'solar_panel', 'car_part', 'energy_drink'],
			wantsGoods:        ['food', 'fuel', 'bandage', 'rope', 'duck_tape'],
			defenseMultiplier: 1.1,
			description:       'A caravan of nomadic traders. They carry rare goods between settlements and know every road.',
			canSlaveTrade:     false,
			recruitDifficulty: 2,
		},
		amazonian_tribe: {
			names:             ['The Valkyrie', 'Daughters of Eve', 'Iron Sisters', 'Warrior Women', 'The Matriarchy', 'Sisterhood of Blood'],
			genderComp:        'all_female',
			baseRelationship:  -30,
			sizeRange:         [15, 80],
			traits:            ['warrior', 'territorial', 'matriarchal'],
			production:        { food: 2, wood: 2, cloth: 1 },
			tradeGoods:        ['food', 'wood', 'cloth', 'rope'],
			wantsGoods:        ['metal', 'bandage', 'knife', 'rope', 'cloth'],
			defenseMultiplier: 1.8,
			description:       'An all-female warrior tribe. Fiercely independent and protective of their territory.',
			canSlaveTrade:     false,
			recruitDifficulty: 3,
		},
		scavenger_den: {
			names:             ['The Heap', 'Rust Town', 'Salvage Yard', 'The Dump', 'Tech Graveyard', 'Junkyard Dogs'],
			genderComp:        'mixed',
			baseRelationship:  -10,
			sizeRange:         [10, 60],
			traits:            ['resourceful', 'suspicious', 'tech_savvy'],
			production:        { metal: 2, plastic: 2, glass: 1, fuel: 1, duck_tape: 1 },
			tradeGoods:        ['metal', 'plastic', 'glass', 'rope', 'duck_tape', 'fuel', 'solar_panel', 'car_part'],
			wantsGoods:        ['food', 'alcohol', 'bandage', 'rope', 'cloth'],
			defenseMultiplier: 1.4,
			description:       'A settlement of scavengers who strip old buildings and vehicles for parts.',
			canSlaveTrade:     true,
			recruitDifficulty: 2,
		},
	},

	// -------------------------------------------------------------------------
	// GENERATION
	// -------------------------------------------------------------------------

	/** Create a single randomly generated settlement data object. */
	generate: function (options) {
		options = options || {};
		const typeList = Object.keys(setup.settlements.typeConfig);
		const type     = options.type || typeList[window.randomInteger(0, typeList.length - 1)];
		const config   = setup.settlements.typeConfig[type];

		const population  = options.forcePopulation || window.randomInteger(config.sizeRange[0], config.sizeRange[1]);
		const relOffset   = window.randomInteger(-15, 15);
		const relationship = Math.max(-100, Math.min(100, (options.relationship !== undefined ? options.relationship : config.baseRelationship) + relOffset));

		const resources = {};
		for (const res in config.production) {
			const rate       = config.production[res];
			resources[res]   = window.randomInteger(rate * 3, rate * 10);
		}

		const names = config.names;
		const baseName = names[window.randomInteger(0, names.length - 1)];
		const usedNames = setup.settlements.getAll().map(function(s) { return s.name; });
		let finalName = baseName;
		if (usedNames.includes(baseName)) {
			let n = 1;
			while (usedNames.includes(baseName + ' - Outpost #' + n)) { n++; }
			finalName = baseName + ' - Outpost #' + n;
		}
		return {
			id:                'settlement_' + window.randomInteger(100000, 999999),
			type:              type,
			name:              finalName,
			discovered:        false,
			destroyed:         false,
			dayCreated:        options.dayCreated || 0,
			population:        population,
			genderComp:        config.genderComp,
			relationship:      relationship,
			resources:         resources,
			production:        Object.assign({}, config.production),
			defenseMultiplier: config.defenseMultiplier,
			raidCooldown:      0,
			traits:            config.traits.slice(),
			flags:             {},
			recentEvents:      [],
			leader:            null,
		};
	},

	generateBatch: function (count, dayCreated) {
		const list = [];
		for (let i = 0; i < count; i++) {
			list.push(setup.settlements.generate({ dayCreated: dayCreated || 0 }));
		}
		return list;
	},

	// -------------------------------------------------------------------------
	// RELATIONSHIP
	// -------------------------------------------------------------------------

	getRelationshipLevel: function (s) {
		if (s.relationship <= -60) return 'hostile';
		if (s.relationship <= -20) return 'unfriendly';
		if (s.relationship <   20) return 'neutral';
		if (s.relationship <   60) return 'friendly';
		return 'allied';
	},

	getRelationshipLabel: function (s) {
		const labels = { hostile: 'Hostile', unfriendly: 'Unfriendly', neutral: 'Neutral', friendly: 'Friendly', allied: 'Allied' };
		return labels[setup.settlements.getRelationshipLevel(s)];
	},

	isHostile:    function (s) { return s.relationship <= -60; },
	isUnfriendly: function (s) { return s.relationship > -60 && s.relationship <= -20; },
	isNeutral:    function (s) { return s.relationship > -20 && s.relationship <  20; },
	isFriendly:   function (s) { return s.relationship >= 20  && s.relationship <  60; },
	isAllied:     function (s) { return s.relationship >= 60; },

	/** Settlements hostile enough to raid the player's base (on cooldown). */
	getRaidableByCandidates: function (currentDay) {
		return setup.settlements.getAll().filter(function (s) {
			return s.discovered && !s.destroyed &&
				setup.settlements.isHostile(s) &&
				(currentDay || 0) >= (s.settlementRaidDay || 0) + 14;
		});
	},

	/** Friendly/allied settlements that might send a trader to the cabin. */
	getTraderCandidates: function (currentDay) {
		var traderTypes = ['trading_post', 'nomad_caravan', 'farming_community', 'survivor_camp', 'medical_colony', 'monastery'];
		return setup.settlements.getAll().filter(function (s) {
			return s.discovered && !s.destroyed &&
				(setup.settlements.isFriendly(s) || setup.settlements.isAllied(s)) &&
				traderTypes.indexOf(s.type) !== -1 &&
				(currentDay || 0) >= (s.traderVisitDay || 0) + 7;
		});
	},

	modifyRelationship: function (s, delta, reason) {
		s.relationship = Math.max(-100, Math.min(100, s.relationship + delta));
		if (reason) setup.settlements.logEvent(s, 'Relationship ' + (delta >= 0 ? '+' : '') + delta + ': ' + reason);
		return s.relationship;
	},

	// -------------------------------------------------------------------------
	// DISCOVERY & SCOUTING
	// -------------------------------------------------------------------------

	discover: function (s, day) {
		if (!s.discovered) {
			s.discovered = true;
			s.dayCreated = s.dayCreated || (day || 0);
		}
	},

	/** Scout from a distance without making contact. Returns an info object. */
	scout: function (s) {
		setup.settlements.discover(s, (variables().game && variables().game.day) || 0);

		const detected = setup.settlements.isHostile(s) && window.randomInteger(1, 100) <= 30;
		if (detected) setup.settlements.modifyRelationship(s, -5, 'Caught scouting');

		return {
			detected:     detected,
			type:         s.type,
			name:         s.name,
			population:   setup.settlements.getPopulationDescription(s),
			gender:       setup.settlements.getGenderDescription(s),
			relationship: setup.settlements.getRelationshipLabel(s),
			defense:      setup.settlements.getDefenseDescription(s),
			topResources: setup.settlements.getTopResources(s, 3),
			traits:       s.traits.slice(),
		};
	},

	// -------------------------------------------------------------------------
	// TRADE
	// -------------------------------------------------------------------------

	canTrade: function (s) {
		return !s.destroyed && s.relationship > -20;
	},

	/** Price multiplier applied to all trades. Below 1 = discount, above 1 = markup. */
	getTradeModifier: function (s) {
		if (setup.settlements.isAllied(s))     return 0.70;
		if (setup.settlements.isFriendly(s))   return 0.85;
		if (setup.settlements.isNeutral(s))    return 1.00;
		if (setup.settlements.isUnfriendly(s)) return 1.40;
		return 2.00;
	},

	/**
	 * What the settlement is selling.
	 * Returns array of { item, quantity, priceEach } for items they have in stock.
	 */
	getTradeOffer: function (s) {
		if (!setup.settlements.canTrade(s)) return null;

		const config   = setup.settlements.typeConfig[s.type];
		const modifier = setup.settlements.getTradeModifier(s);
		const goods    = [];

		for (let i = 0; i < config.tradeGoods.length; i++) {
			const item      = config.tradeGoods[i];
			const available = Math.floor((s.resources[item] || 0) * 0.5);
			if (available > 0) {
				goods.push({
					item:      item,
					quantity:  available,
					priceEach: Math.ceil(setup.settlements.getItemPrice(item) * modifier),
				});
			}
		}
		return goods;
	},

	/**
	 * What the settlement wants to receive.
	 * Returns array of { item, priceEach } — the price they will pay (always above base).
	 * Offering wanted goods is how barter works: MC gives these, takes tradeGoods in return.
	 */
	getWantsOffer: function (s) {
		if (!setup.settlements.canTrade(s)) return null;

		const config        = setup.settlements.typeConfig[s.type];
		const wantsPremium  = 1.5;  // they pay 50 % above base price for items they need
		const goods         = [];

		for (let i = 0; i < config.wantsGoods.length; i++) {
			const item = config.wantsGoods[i];
			goods.push({
				item:      item,
				priceEach: Math.ceil(setup.settlements.getItemPrice(item) * wantsPremium),
			});
		}
		return goods;
	},

	/**
	 * Execute a trade.  Two modes:
	 *
	 * Cap trade  — MC pays caps, receives items:
	 *   offered:   { caps: N }
	 *   requested: [{ item, quantity }, ...]
	 *
	 * Barter trade — MC gives goods, receives goods (no caps change hands):
	 *   offered:   [{ item, quantity }, ...]   ← items MC is handing over
	 *   requested: [{ item, quantity }, ...]   ← items MC wants back
	 *
	 * For barter the total value of offered goods (at wantsPremium price if wanted,
	 * else base price) must cover the total value of requested goods (at sell price).
	 * Returns { success, reason, relationGain }.
	 */
	executeTrade: function (s, offered, requested) {
		if (!setup.settlements.canTrade(s)) return { success: false, reason: 'They refuse to trade with you.' };

		const config   = setup.settlements.typeConfig[s.type];
		const modifier = setup.settlements.getTradeModifier(s);

		// Validate settlement has enough of what MC wants
		for (let i = 0; i < requested.length; i++) {
			const req = requested[i];
			if ((s.resources[req.item] || 0) < req.quantity) {
				return { success: false, reason: "They don't have enough " + req.item + '.' };
			}
		}

		// Calculate offered value (wanted items get premium valuation)
		let offeredValue = 0;
		for (let i = 0; i < offered.length; i++) {
			const o        = offered[i];
			const isWanted = config.wantsGoods.indexOf(o.item) !== -1;
			const price    = setup.settlements.getItemPrice(o.item) * (isWanted ? 1.5 : 1.0);
			offeredValue  += price * o.quantity;
		}

		// Calculate requested value (what MC is buying)
		let requestedValue = 0;
		for (let i = 0; i < requested.length; i++) {
			const r         = requested[i];
			requestedValue += Math.ceil(setup.settlements.getItemPrice(r.item) * modifier) * r.quantity;
		}

		if (offeredValue < requestedValue) {
			return { success: false, reason: "They don't think that's a fair trade." };
		}

		// Transfer goods
		for (let i = 0; i < offered.length; i++) {
			const o = offered[i];
			s.resources[o.item] = (s.resources[o.item] || 0) + o.quantity;
		}
		for (let i = 0; i < requested.length; i++) {
			const r = requested[i];
			s.resources[r.item] = Math.max(0, (s.resources[r.item] || 0) - r.quantity);
		}

		// Bonus relationship if MC offered wanted goods
		let relationGain = 1;
		for (let i = 0; i < offered.length; i++) {
			if (config.wantsGoods.indexOf(offered[i].item) !== -1) {
				relationGain = 3;
				break;
			}
		}

		setup.settlements.modifyRelationship(s, relationGain, 'Completed trade');
		s.tradeCount    = (s.tradeCount || 0) + 1;
		s.lastContactDay = (variables().game && variables().game.day) || 1;
		if (s.type === 'trading_post' && s.tradeCount % 3 === 0) {
			setup.settlements.modifyRelationship(s, 5, 'Loyal customer reward');
			setup.settlements.logEvent(s, 'Rewarded loyal customer with a relationship bonus.');
		}
		return { success: true, relationGain: relationGain, tradeCount: s.tradeCount };
	},

	// -------------------------------------------------------------------------
	// COMBAT & RAIDING
	// -------------------------------------------------------------------------

	getDefenseStrength: function (s) {
		if (s.destroyed) return 0;
		const warriorRatios = { all_male: 0.70, mostly_male: 0.60, mixed: 0.45, mostly_female: 0.35, all_female: 0.40 };
		const ratio    = warriorRatios[s.genderComp] || 0.45;
		const warriors = Math.floor(s.population * ratio);
		return Math.floor(warriors * s.defenseMultiplier * 10);
	},

	canBeRaided: function (s, currentDay) {
		return !s.destroyed && (currentDay || 0) >= s.raidCooldown;
	},

	/**
	 * Simulate the outcome of an attack without modifying state.
	 * mode: 'raid' (quick hit) | 'siege' (full assault)
	 */
	calculateAttackOutcome: function (s, attackStrength, mode) {
		mode = mode || 'raid';
		const defense  = setup.settlements.getDefenseStrength(s);
		const ratio    = attackStrength / Math.max(defense, 1);
		const victory  = ratio >= (mode === 'raid' ? 0.75 : 1.0);

		let mcCasualtyChance = victory ? Math.floor(30 / ratio) : Math.floor(50 + 20 / ratio);
		mcCasualtyChance = Math.max(5, Math.min(mcCasualtyChance, 90));

		const spoils = {};
		if (victory) {
			const fraction = mode === 'siege' ? 1.0 : Math.min(ratio * 0.2, 0.35);
			for (const res in s.resources) {
				const taken = Math.floor(s.resources[res] * fraction);
				if (taken > 0) spoils[res] = taken;
			}
		}

		return {
			victory:        victory,
			mode:           mode,
			ratio:          ratio,
			mcCasualtyChance: mcCasualtyChance,
			populationLoss: victory ? Math.floor(s.population * (mode === 'siege' ? 0.40 : 0.15)) : Math.floor(s.population * 0.05),
			spoils:         spoils,
		};
	},

	/** Apply a pre-calculated attack outcome to the settlement. */
	applyAttackOutcome: function (s, outcome, currentDay) {
		currentDay = currentDay || 0;
		s.attackCount = (s.attackCount || 0) + 1;
		if (outcome.victory) s.attackVictories = (s.attackVictories || 0) + 1;
		if (outcome.victory) {
			s.population = Math.max(0, s.population - outcome.populationLoss);
			for (const res in outcome.spoils) {
				s.resources[res] = Math.max(0, (s.resources[res] || 0) - outcome.spoils[res]);
			}
			setup.settlements.modifyRelationship(s, -30, 'Raided by player');
			s.raidCooldown = currentDay + 7;
			setup.settlements.logEvent(s, 'Raided by player.');
			if (s.leader && window.randomInteger(1, 100) <= 30) {
				setup.settlements.logEvent(s, 'Leader ' + s.leader.name + ' was killed in the raid.');
				s.leader = null;
			}
			if (s.population === 0 || outcome.mode === 'siege') s.destroyed = true;
			// Reputation: same-type settlements hear about the attack
			const allS = setup.settlements.getAll();
			for (let j = 0; j < allS.length; j++) {
				if (allS[j].id !== s.id && allS[j].type === s.type && !allS[j].destroyed) {
					allS[j].relationship = Math.max(-100, allS[j].relationship - 5);
				}
			}
		} else {
			setup.settlements.modifyRelationship(s, -10, 'Failed raid attempt');
			setup.settlements.logEvent(s, 'Repelled a raid attempt.');
		}
	},

	// -------------------------------------------------------------------------
	// DIPLOMACY
	// -------------------------------------------------------------------------

	/**
	 * Attempt a diplomatic approach.
	 * approach: 'friendly_greeting' | 'trade_offer' | 'gift' | 'show_of_force' | 'apology'
	 */
	negotiate: function (s, approach, giftValue) {
		if (s.destroyed) return { success: false, reason: 'Nothing remains of this settlement.' };

		const actions = {
			friendly_greeting: { delta: 5,                                      threshold: -40, reason: 'Friendly approach' },
			trade_offer:       { delta: 8,                                      threshold: -20, reason: 'Trade proposal' },
			gift:              { delta: Math.floor((giftValue || 0) / 5),       threshold: -60, reason: 'Gift offered' },
			show_of_force:     { delta: -10,                                    threshold: null, reason: 'Intimidation' },
			apology:           { delta: 15,                                     threshold: -80, reason: 'Apology offered' },
		};

		const action = actions[approach];
		if (!action) return { success: false, reason: 'Unknown approach.' };

		if (action.threshold !== null && s.relationship < action.threshold) {
			return { success: false, reason: 'They are too hostile to listen.' };
		}

		setup.settlements.modifyRelationship(s, action.delta, action.reason);
		s.lastContactDay = (variables().game && variables().game.day) || 1;
		return { success: true, newLevel: setup.settlements.getRelationshipLabel(s) };
	},

	offerTribute: function (s, totalValue) {
		const boost = Math.max(1, Math.floor(totalValue / 8));
		setup.settlements.modifyRelationship(s, boost, 'Tribute paid');
		s.lastContactDay = (variables().game && variables().game.day) || 1;
		return { success: true, relationshipGain: boost };
	},

	/** After military victory, demand a one-time tribute payment. */
	demandTribute: function (s) {
		if (s.flags.tributeDemanded) return { success: false, reason: 'Tribute has already been demanded.' };
		if (s.relationship > -30)    return { success: false, reason: 'They are not beaten enough to accept tribute.' };

		const tribute = {};
		for (const res in s.resources) {
			tribute[res]   = Math.floor(s.resources[res] * 0.25);
			s.resources[res] = Math.max(0, s.resources[res] - tribute[res]);
		}
		s.flags.tributeDemanded = true;
		setup.settlements.modifyRelationship(s, 10, 'Accepted tribute demand');
		return { success: true, tribute: tribute };
	},

	requestAlliance: function (s) {
		if (setup.settlements.isAllied(s))    return { success: false, reason: 'You are already allied.' };
		if (!setup.settlements.isFriendly(s)) return { success: false, reason: 'They are not ready to form an alliance.' };

		const success = window.randomInteger(1, 100) <= 60;
		if (success) {
			s.relationship = Math.max(s.relationship, 60);
			setup.settlements.logEvent(s, 'Alliance formed with player.');
			// Cooperative types get a small relationship boost from allies of the same kind
			const cooperativeTypes = ['survivor_camp', 'farming_community', 'monastery', 'convent', 'medical_colony', 'trading_post', 'nomad_caravan', 'tribal_village'];
			if (cooperativeTypes.indexOf(s.type) !== -1) {
				const allS = setup.settlements.getAll();
				for (let j = 0; j < allS.length; j++) {
					if (allS[j].id !== s.id && allS[j].type === s.type && !allS[j].destroyed) {
						allS[j].relationship = Math.min(100, allS[j].relationship + 3);
					}
				}
			}
		}
		if (success) s.lastContactDay = (variables().game && variables().game.day) || 1;
		return { success: success, reason: success ? 'Alliance formed.' : 'They declined the alliance offer.' };
	},

	// -------------------------------------------------------------------------
	// RECRUITMENT
	// -------------------------------------------------------------------------

	getRecruitableCount: function (s) {
		if (!setup.settlements.isFriendly(s) && !setup.settlements.isAllied(s)) return 0;
		const difficulty = setup.settlements.typeConfig[s.type].recruitDifficulty || 2;
		return Math.max(0, Math.floor(s.population * 0.05 / difficulty));
	},

	/** Recruit one person from the settlement. Returns { success, npc }. */
	recruit: function (s) {
		if (setup.settlements.getRecruitableCount(s) <= 0) {
			return { success: false, reason: 'No one is willing to leave.' };
		}

		const gender = setup.settlements.rollRecruitGender(s);
		const maleNames   = ['Marcus', 'Cole', 'Rex', 'Duke', 'Ivan', 'Seth', 'Zane', 'Leon', 'Bruno', 'Colt'];
		const femaleNames = ['Vera', 'Maya', 'Jade', 'Sasha', 'Nora', 'Iris', 'Kira', 'Leah', 'Dena', 'Skye'];
		const namePool = gender === 1 ? maleNames : femaleNames;
		const name     = namePool[window.randomInteger(0, namePool.length - 1)];

		s.population = Math.max(1, s.population - 1);
		setup.settlements.modifyRelationship(s, -2, 'Recruited member');
		return { success: true, gender: gender, name: name };
	},

	rollRecruitGender: function (s) {
		if (s.genderComp === 'all_male')      return 1;
		if (s.genderComp === 'all_female')    return 0;
		if (s.genderComp === 'mostly_male')   return window.randomInteger(1, 100) <= 75 ? 1 : 0;
		if (s.genderComp === 'mostly_female') return window.randomInteger(1, 100) <= 75 ? 0 : 1;
		return window.randomInteger(0, 1);
	},

	// -------------------------------------------------------------------------
	// SPECIAL INTERACTIONS
	// -------------------------------------------------------------------------

	/** Buy or sell slaves — only at settlements that allow it. */
	tradeSlaves: function (s, action, count) {
		count = count || 1;
		const config = setup.settlements.typeConfig[s.type];
		if (!config.canSlaveTrade) return { success: false, reason: "This settlement doesn't deal in slaves." };
		if (!setup.settlements.canTrade(s)) return { success: false, reason: "They won't deal with you." };

		const modifier = setup.settlements.getTradeModifier(s);
		if (action === 'buy')  return { success: true, count: count, price: Math.ceil(50 * count * modifier) };
		if (action === 'sell') {
			setup.settlements.modifyRelationship(s, 2, 'Slave sale');
			return { success: true, count: count, value: Math.floor(40 * count) };
		}
		return { success: false, reason: 'Unknown action.' };
	},

	/** Get intelligence on nearby threats. Requires friendly standing. */
	getIntelligence: function (s) {
		if (!setup.settlements.isFriendly(s) && !setup.settlements.isAllied(s)) {
			return { success: false, reason: "They don't trust you enough to share information.", revealed: null };
		}
		const pool = [
			'Raiders have been spotted moving through the northern roads.',
			'A large herd passed through last week — resources are scarce.',
			'A military convoy was seen heading east three days ago.',
			'Someone has been watching the roads at night. Be careful.',
			'There are rumours of a well-stocked bunker to the south.',
			'A group of survivors fled from the direction of the old refinery.',
			'The eastern route has been quieter lately. Something changed out there.',
		];
		// 25 % chance to reveal a new or previously undiscovered settlement
		if (window.randomInteger(1, 100) <= 25) {
			const newS = setup.settlements.revealSettlement();
			if (newS) {
				return {
					success:  true,
					intel:    'There\'s a group called ' + newS.name + ' operating not far from here — ' + (setup.settlements.typeConfig[newS.type] || {}).description + ' They pointed you toward the location.',
					revealed: newS,
				};
			}
		}
		return { success: true, intel: pool[window.randomInteger(0, pool.length - 1)], revealed: null };
	},

	/**
	 * Reveal a settlement via intel: prefer surfacing an existing undiscovered one,
	 * otherwise generate a new one (capped at 20 total). Returns null if nothing to reveal.
	 */
	revealSettlement: function () {
		const list        = setup.settlements.getAll();
		const undiscovered = list.filter(function (s) { return !s.discovered && !s.destroyed; });
		if (undiscovered.length > 0) {
			const pick    = undiscovered[window.randomInteger(0, undiscovered.length - 1)];
			pick.discovered = true;
			setup.settlements.save(list);
			return pick;
		}
		if (list.length < 20) {
			const s       = setup.settlements.generate({ dayCreated: (variables().game && variables().game.day) || 1 });
			s.discovered  = true;
			list.push(s);
			setup.settlements.save(list);
			return s;
		}
		return null;
	},

	// -------------------------------------------------------------------------
	// SUPPLY MISSIONS
	// -------------------------------------------------------------------------

	/** Generate a one-time supply mission for the settlement. Returns the mission object (not yet committed to s). */
	generateMission: function (s) {
		const config = setup.settlements.typeConfig[s.type];
		const wants  = config.wantsGoods;
		if (!wants || !wants.length) return null;
		const item     = wants[window.randomInteger(0, wants.length - 1)];
		const quantity = window.randomInteger(1, 2);
		const reward   = Math.ceil(setup.settlements.getItemPrice(item) * quantity * 2.5 + 25);
		return {
			item:     item,
			quantity: quantity,
			reward:   reward,
			givenDay: (variables().game && variables().game.day) || 1,
		};
	},

	/** True if the mission was offered more than 10 days ago. */
	isMissionExpired: function (s, currentDay) {
		if (!s.activeMission) return false;
		return (currentDay || 0) > (s.activeMission.givenDay || 0) + 10;
	},

	/** Invest caps into a settlement to grow its population and stockpiles. */
	investInSettlement: function (s, caps) {
		if (s.destroyed) return { success: false, reason: 'Nothing remains.' };
		const popGain = Math.max(1, Math.floor(caps / 20));
		s.population  = Math.min(s.population + popGain, 500);
		for (const res in s.production) {
			s.resources[res] = Math.min((s.resources[res] || 0) + s.production[res] * 5, 200);
		}
		s.lastInvestDay  = (variables().game && variables().game.day) || 0;
		s.lastContactDay = s.lastInvestDay;
		setup.settlements.modifyRelationship(s, 5, 'Player invested in settlement');
		return { success: true, popGain: popGain };
	},

	/** Complete the active mission. Clears it from the settlement and returns payout info. */
	completeMission: function (s) {
		if (!s.activeMission) return { success: false, reason: 'No active mission.' };
		const result = {
			success:  true,
			item:     s.activeMission.item,
			quantity: s.activeMission.quantity,
			reward:   s.activeMission.reward,
		};
		s.activeMission = null;
		setup.settlements.modifyRelationship(s, 10, 'Completed supply mission');
		return result;
	},

	/** Ask allied settlement to send fighters to defend your base. */
	requestReinforcements: function (s) {
		if (!setup.settlements.isAllied(s)) return { success: false, reason: 'Only allies will send reinforcements.' };

		const fighters = Math.max(1, Math.floor(s.population * 0.10));
		s.population   = Math.max(5, s.population - fighters);
		setup.settlements.modifyRelationship(s, -5, 'Sent reinforcements');
		return { success: true, fighters: fighters, description: s.name + ' sent ' + fighters + ' fighters to help you.' };
	},

	// -------------------------------------------------------------------------
	// SIMULATION
	// -------------------------------------------------------------------------

	dailyUpdate: function (s, currentDay) {
		if (s.destroyed) return;

		for (const res in s.production) {
			s.resources[res] = Math.min((s.resources[res] || 0) + s.production[res], 200);
		}

		// Slow natural drift toward zero
		if (s.relationship > 0) s.relationship = Math.max(0, +(s.relationship - 0.1).toFixed(1));
		if (s.relationship < 0) s.relationship = Math.min(0, +(s.relationship + 0.1).toFixed(1));

		// Entrenched hostility: no contact for 7+ days drifts relationship further negative every 10 days
		// Neglected alliances: no contact for 30+ days slowly erodes relationship every 7 days (floor: friendly)
		const daysSinceContact = currentDay - (s.lastContactDay || 0);
		if (s.relationship <= -30 && daysSinceContact >= 7 && currentDay % 10 === 0) {
			s.relationship = Math.max(-100, s.relationship - 1);
		}
		if (s.relationship >= 60 && daysSinceContact >= 30 && currentDay % 7 === 0) {
			s.relationship = Math.max(30, s.relationship - 1);
		}

		if (window.randomInteger(1, 100) <= 5) {
			setup.settlements.triggerRandomEvent(s, currentDay);
		}

		if (s.population <= 10 && !s.destroyed && window.randomInteger(1, 100) <= 3) {
			s.destroyed = true;
			s.population = 0;
			setup.settlements.logEvent(s, 'The settlement has collapsed and ceased to exist.');
		}
	},

	triggerRandomEvent: function (s) {
		const events = [
			function () { setup.settlements.modifyRelationship(s, -5, 'Internal conflict'); setup.settlements.logEvent(s, 'A power struggle broke out inside the settlement.'); },
			function () { const loss = window.randomInteger(1, 5); s.population = Math.max(1, s.population - loss); setup.settlements.logEvent(s, 'Disease outbreak — ' + loss + ' people died.'); },
			function () { s.resources.food = Math.max(0, (s.resources.food || 0) - window.randomInteger(5, 15)); setup.settlements.logEvent(s, 'Food spoilage or bad harvest.'); },
			function () {
				const foodCap = Math.max(15, (s.resources.food || 0) * 3);
				if (s.population < foodCap) {
					const gain = window.randomInteger(1, 4);
					s.population += gain;
					setup.settlements.logEvent(s, gain + ' new arrivals joined the settlement.');
				} else {
					setup.settlements.logEvent(s, 'Population growth stalled — food supply can\'t support more people.');
				}
			},
			function () { setup.settlements.modifyRelationship(s, 3, 'Settlement prospering'); setup.settlements.logEvent(s, 'The settlement is doing well this season.'); },
			function () { s.resources.metal = (s.resources.metal || 0) + window.randomInteger(5, 15); setup.settlements.logEvent(s, 'Scavengers returned with a supply cache.'); },
			function () {
				s.population = Math.max(1, s.population - window.randomInteger(1, 3));
				s.resources.food = Math.max(0, (s.resources.food || 0) - window.randomInteger(5, 20));
				setup.settlements.logEvent(s, 'Raiders hit the settlement.');
				if (s.discovered && (setup.settlements.isFriendly(s) || setup.settlements.isAllied(s))) {
					s.callForHelp = true;
					s.callForHelpNotified = false;
				}
			},
		];
		events[window.randomInteger(0, events.length - 1)]();
	},

	// -------------------------------------------------------------------------
	// DISPLAY / INFO
	// -------------------------------------------------------------------------

	getPopulationDescription: function (s) {
		if (s.population <= 15)  return 'tiny';
		if (s.population <= 40)  return 'small';
		if (s.population <= 100) return 'medium-sized';
		if (s.population <= 300) return 'large';
		return 'sprawling';
	},

	getGenderDescription: function (s) {
		const desc = { all_male: 'all men', mostly_male: 'mostly men', mixed: 'men and women', mostly_female: 'mostly women', all_female: 'all women' };
		return desc[s.genderComp] || 'mixed';
	},

	getDefenseDescription: function (s) {
		const str = setup.settlements.getDefenseStrength(s);
		if (str <  50)  return 'barely defended';
		if (str < 150)  return 'lightly defended';
		if (str < 400)  return 'moderately defended';
		if (str < 800)  return 'well defended';
		return 'heavily fortified';
	},

	getDescription: function (s) {
		return (setup.settlements.typeConfig[s.type] || {}).description || 'An unknown settlement.';
	},

	getSummary: function (s) {
		return {
			id:           s.id,
			name:         s.name,
			type:         s.type,
			population:   s.population,
			popSize:      setup.settlements.getPopulationDescription(s),
			gender:       setup.settlements.getGenderDescription(s),
			relationship: setup.settlements.getRelationshipLabel(s),
			defense:      setup.settlements.getDefenseDescription(s),
			topResources: setup.settlements.getTopResources(s, 3),
			traits:       s.traits.slice(),
			destroyed:    s.destroyed,
		};
	},

	getTopResources: function (s, n) {
		return Object.keys(s.resources)
			.filter(function (res) { return s.resources[res] > 0; })
			.sort(function (a, b) { return s.resources[b] - s.resources[a]; })
			.slice(0, n || 3);
	},

	logEvent: function (s, message) {
		s.recentEvents.push(message);
		if (s.recentEvents.length > 5) s.recentEvents.shift();
	},

	// -------------------------------------------------------------------------
	// STORE  (SugarCube variables bridge)
	// -------------------------------------------------------------------------

	getAll: function () {
		return setup.worldSettlements || [];
	},

	save: function (list) {
		setup.worldSettlements = list;
	},

	getById: function (id) {
		const list = setup.settlements.getAll();
		for (let i = 0; i < list.length; i++) {
			if (list[i].id === id) return list[i];
		}
		return null;
	},

	getByType: function (type) {
		return setup.settlements.getAll().filter(function (s) { return s.type === type; });
	},

	getDiscovered: function () {
		return setup.settlements.getAll().filter(function (s) { return s.discovered && !s.destroyed; });
	},

	getHostile: function () {
		return setup.settlements.getAll().filter(function (s) { return setup.settlements.isHostile(s) && !s.destroyed; });
	},

	getTradeable: function () {
		return setup.settlements.getAll().filter(function (s) { return setup.settlements.canTrade(s) && s.discovered; });
	},

	getAllied: function () {
		return setup.settlements.getAll().filter(function (s) { return setup.settlements.isAllied(s) && !s.destroyed; });
	},

	/** First-time world init. Safe to call on every new game — won't overwrite an existing world. */
	init: function (count) {
		if ((setup.worldSettlements || []).length > 0) return;
		const day  = (variables().game && variables().game.day) || 1;
		const list = setup.settlements.generateBatch(count || 12, day);
		setup.settlements.save(list);
	},

	/** Add a new settlement mid-game. */
	add: function (options) {
		const list = setup.settlements.getAll();
		const s    = setup.settlements.generate(Object.assign({ dayCreated: (variables().game && variables().game.day) || 1 }, options || {}));
		list.push(s);
		setup.settlements.save(list);
		return s;
	},

	/** Run a daily tick on every settlement and save. Returns event arrays for morning messages. */
	dailyUpdateAll: function () {
		const day  = (variables().game && variables().game.day) || 1;
		const list = setup.settlements.getAll();
		const newlyDestroyed    = [];
		const needsHelp         = [];
		const refugees          = [];
		const newUltimatums     = [];
		const expiredUltimatums = [];
		const starving          = [];
		const womanDemands      = [];
		const expiredWomanDemands = [];
		const newBlackmails       = [];
		const expiredBlackmails   = [];
		const abductionCandidates = [];
		const desperateDeals      = [];
		const tributeOffers       = [];

		for (let i = 0; i < list.length; i++) {
			const s = list[i];
			const prevPop    = s.population;
			const wasDestroyed = !!s.destroyed;
			setup.settlements.dailyUpdate(s, day);

			if (!wasDestroyed && s.destroyed && s.discovered) {
				newlyDestroyed.push(s.name);
				const survivors = Math.max(1, Math.min(4, Math.floor(prevPop * 0.1)));
				refugees.push({ id: s.id, name: s.name, count: survivors, type: s.type });
			}

			if (s.callForHelp && !s.callForHelpNotified) {
				needsHelp.push({ id: s.id, name: s.name });
				s.callForHelpNotified = true;
			}

			if (s.discovered && !s.destroyed) {
				// Ultimatum: check for expiry first
				if (s.ultimatumActive && day > (s.ultimatumDay || 0) + 3) {
					s.ultimatumActive = false;
					s.ultimatumCooldown = day + 21;
					s.settlementRaidDay = 0;
					expiredUltimatums.push({ id: s.id, name: s.name });
				} else if (!s.ultimatumActive && day >= (s.ultimatumCooldown || 0) &&
				           setup.settlements.isHostile(s) &&
				           setup.settlements.getDefenseStrength(s) > 150 &&
				           window.randomInteger(1, 100) <= 2) {
					s.ultimatumActive  = true;
					s.ultimatumDay     = day;
					s.ultimatumAmount  = 500;
					newUltimatums.push({ id: s.id, name: s.name, amount: 500 });
				}

				// Famine: food-producing settlement running dry
				if ((s.production.food || 0) > 0 &&
				    (s.resources.food || 0) < 5 &&
				    day >= (s.famineNotifiedDay || 0) + 7) {
					starving.push({ id: s.id, name: s.name });
					s.famineNotifiedDay = day;
				}

				// Woman demand
				if (s.womanDemandActive && day > (s.womanDemandDay || 0) + 3) {
					s.womanDemandActive   = false;
					s.womanDemandCooldown = day + 30;
					s.settlementRaidDay   = 0;
					expiredWomanDemands.push({ id: s.id, name: s.name });
				} else if (!s.womanDemandActive && day >= (s.womanDemandCooldown || 0) &&
				           setup.settlements.isHostile(s) && s.relationship < -70 &&
				           setup.settlements.getDefenseStrength(s) > 200 &&
				           window.randomInteger(1, 100) <= 1) {
					s.womanDemandActive = true;
					s.womanDemandDay    = day;
					womanDemands.push({ id: s.id, name: s.name });
				}

				// Blackmail
				if (s.blackmailActive && day > (s.blackmailDay || 0) + 4) {
					s.blackmailActive   = false;
					s.blackmailCooldown = day + 30;
					expiredBlackmails.push({ id: s.id, name: s.name });
				} else if (!s.blackmailActive && day >= (s.blackmailCooldown || 0) &&
				           s.relationship > -60 && s.relationship < 40 &&
				           window.randomInteger(1, 100) <= 1) {
					s.blackmailActive = true;
					s.blackmailDay    = day;
					newBlackmails.push({ id: s.id, name: s.name, amount: 300 });
				}

				// Targeted abduction (1% chance, strong hostile)
				if (!s.abductionAttempt && day >= (s.abductionCooldown || 0) &&
				    setup.settlements.isHostile(s) && s.relationship < -60 &&
				    window.randomInteger(1, 100) <= 1) {
					s.abductionAttempt = true;
					s.abductionDay     = day;
					abductionCandidates.push({ id: s.id, name: s.name });
				}

				// Desperate deal: starving neutral-ish settlement offers a person for aid
				if (s.desperateDealActive && day > (s.desperateDealDay || 0) + 5) {
					s.desperateDealActive   = false;
					s.desperateDealCooldown = day + 60;
				} else if (!s.desperateDealActive && day >= (s.desperateDealCooldown || 0) &&
				           (s.production.food || 0) > 0 && (s.resources.food || 0) < 5 &&
				           s.relationship > -20 && s.relationship < 50 &&
				           window.randomInteger(1, 100) <= 2) {
					s.desperateDealActive = true;
					s.desperateDealDay    = day;
					desperateDeals.push({ id: s.id, name: s.name });
				}

				// Tribute gift: allied tribal/cult settlements send a woman periodically
				const tributeTypes = ['tribal_village', 'amazonian_tribe', 'cult_compound'];
				if (setup.settlements.isAllied(s) &&
				    tributeTypes.indexOf(s.type) !== -1 &&
				    day >= (s.lastTributeDay || 0) + 45 &&
				    window.randomInteger(1, 100) <= 30) {
					s.lastTributeDay = day;
					tributeOffers.push({ id: s.id, name: s.name, type: s.type });
				}
			}
		}

		setup.settlements.save(list);
		return { destroyed: newlyDestroyed, needsHelp, refugees, newUltimatums, expiredUltimatums,
		         starving, womanDemands, expiredWomanDemands, newBlackmails, expiredBlackmails,
		         abductionCandidates, desperateDeals, tributeOffers };
	},

	/** Pay an active ultimatum demand. */
	payUltimatum: function (s) {
		if (!s.ultimatumActive) return { success: false, reason: 'No active ultimatum.' };
		s.ultimatumActive   = false;
		s.ultimatumCooldown = ((variables().game && variables().game.day) || 1) + 21;
		setup.settlements.modifyRelationship(s, 15, 'Player paid ultimatum demand');
		setup.settlements.logEvent(s, 'Player paid the demanded tribute. Threat withdrawn.');
		return { success: true };
	},

	/** Player sends emergency food to a starving settlement. */
	sendEmergencyFood: function (s, amount) {
		s.resources.food    = (s.resources.food || 0) + amount;
		s.famineNotifiedDay = (variables().game && variables().game.day) || 1;
		setup.settlements.modifyRelationship(s, 10, 'Player sent emergency food');
		setup.settlements.logEvent(s, 'Player sent emergency food supplies during a shortage.');
		return { success: true };
	},

	/** Resolve a woman demand: clears the flag and starts cooldown. */
	resolveWomanDemand: function (s, satisfied) {
		s.womanDemandActive   = false;
		s.womanDemandCooldown = ((variables().game && variables().game.day) || 1) + 30;
		if (satisfied) {
			setup.settlements.modifyRelationship(s, 20, 'Woman tribute paid');
			setup.settlements.logEvent(s, 'Player sent a woman as demanded.');
		} else {
			setup.settlements.logEvent(s, 'Demand refused — consequences incoming.');
		}
	},

	/** Resolve blackmail: satisfied = true means paid, false = ignored (triggers retaliation). */
	resolveBlackmail: function (s, satisfied) {
		s.blackmailActive   = false;
		s.blackmailCooldown = ((variables().game && variables().game.day) || 1) + 30;
		if (satisfied) {
			setup.settlements.modifyRelationship(s, 5, 'Blackmail paid');
			setup.settlements.logEvent(s, 'Player paid the blackmail demand.');
		} else {
			// Sell intel: boost a random hostile settlement's raid readiness
			const hostiles = setup.settlements.getAll().filter(function (h) {
				return h.id !== s.id && !h.destroyed && setup.settlements.isHostile(h) && h.discovered;
			});
			if (hostiles.length > 0) {
				const target = hostiles[window.randomInteger(0, hostiles.length - 1)];
				target.settlementRaidDay = 0;
			}
			setup.settlements.logEvent(s, 'Sold intel on player base to enemies.');
		}
	},

	/** Resolve targeted abduction: clears attempt flag, starts cooldown. */
	resolveAbduction: function (s, taken) {
		s.abductionAttempt  = false;
		s.abductionCooldown = ((variables().game && variables().game.day) || 1) + 21;
		if (taken) {
			s.population = Math.min(s.population + 1, 500);
			setup.settlements.modifyRelationship(s, 5, 'Abduction succeeded');
			setup.settlements.logEvent(s, 'Abducted someone from the player base.');
		} else {
			setup.settlements.modifyRelationship(s, -15, 'Abduction repelled');
			setup.settlements.logEvent(s, 'Raid to abduct someone was repelled.');
		}
	},

	/** Generate or return cached slaves for sale. Refreshes every 7 days. */
	generateSlavesForSale: function (s, currentDay) {
		if (s.slavesForSale && (s.slavesForSaleDay || 0) + 7 > (currentDay || 0)) {
			return s.slavesForSale;
		}
		const count = window.randomInteger(1, 3);
		const fNames = ['Mia', 'Lena', 'Cara', 'Ivy', 'Sable', 'Rin', 'Cass', 'Vela', 'Mara', 'Trix', 'Anya', 'Reva'];
		const priceBases = { raider_camp: 150, prison_colony: 120, biker_gang: 175, scavenger_den: 100 };
		const base = priceBases[s.type] || 140;
		const slaves = [];
		for (let i = 0; i < count; i++) {
			slaves.push({
				name:  fNames[window.randomInteger(0, fNames.length - 1)],
				age:   window.randomInteger(18, 32),
				price: base + window.randomInteger(-20, 60),
			});
		}
		s.slavesForSale    = slaves;
		s.slavesForSaleDay = currentDay || 0;
		const list = setup.settlements.getAll();
		setup.settlements.save(list);
		return slaves;
	},

	/** Modify relationship for a settlement by id and save. */
	modifyRelationshipById: function (id, delta, reason) {
		const list = setup.settlements.getAll();
		const s    = list.find(function (s) { return s.id === id; });
		if (s) {
			setup.settlements.modifyRelationship(s, delta, reason);
			setup.settlements.save(list);
		}
	},

	/** Apply attack outcome for a settlement by id and save. */
	applyAttackById: function (id, outcome) {
		const list = setup.settlements.getAll();
		const s    = list.find(function (s) { return s.id === id; });
		if (s) {
			setup.settlements.applyAttackOutcome(s, outcome, (variables().game && variables().game.day) || 1);
			setup.settlements.save(list);
		}
	},

	/** Mark a settlement as discovered by id and save. */
	discoverById: function (id) {
		const list = setup.settlements.getAll();
		const s    = list.find(function (s) { return s.id === id; });
		if (s) {
			setup.settlements.discover(s, (variables().game && variables().game.day) || 1);
			setup.settlements.save(list);
		}
	},

	// -------------------------------------------------------------------------
	// LEADER GENERATION
	// -------------------------------------------------------------------------

	leaderTitles: {
		biker_gang:        { male: ['President', 'Road Captain', 'Pack Leader'],          female: ['President', 'Road Queen', 'Pack Leader'] },
		survivor_camp:     { male: ['Elder', 'Coordinator', 'Camp Leader'],               female: ['Elder', 'Coordinator', 'Camp Leader'] },
		monastery:         { male: ['Father Superior', 'Brother Prior', 'Abbot'],         female: ['Father Superior', 'Brother Prior', 'Abbot'] },
		convent:           { male: ['Mother Superior', 'Sister Superior', 'Abbess'],      female: ['Mother Superior', 'Sister Superior', 'Abbess'] },
		trading_post:      { male: ['Trade Master', 'Hub Director', 'Market Overseer'],   female: ['Trade Master', 'Hub Director', 'Market Overseer'] },
		raider_camp:       { male: ['Boss', 'Warlord', 'Chieftain'],                      female: ['Boss', 'Warlord', 'Chieftain'] },
		cult_compound:     { male: ['The Shepherd', 'The Prophet', 'High Elder'],         female: ['The Shepherd', 'The Prophet', 'High Elder'] },
		military_base:     { male: ['Commander', 'Colonel', 'General'],                   female: ['Commander', 'Colonel', 'General'] },
		farming_community: { male: ['Mayor', 'Steward', 'Community Elder'],               female: ['Mayor', 'Steward', 'Community Elder'] },
		medical_colony:    { male: ['Chief Physician', 'Head Doctor', 'Director'],        female: ['Chief Physician', 'Head Doctor', 'Director'] },
		tribal_village:    { male: ['Chieftain', 'Elder Chief', 'War Chief'],             female: ['Matriarch', 'Elder Chief', 'Wise Woman'] },
		prison_colony:     { male: ['Boss', 'Warden', 'The Overseer'],                   female: ['Boss', 'Warden', 'The Overseer'] },
		nomad_caravan:     { male: ['Caravan Master', 'Road Boss', 'Lead Merchant'],      female: ['Caravan Master', 'Road Boss', 'Lead Merchant'] },
		amazonian_tribe:   { male: ['War Mother', 'Matriarch', 'Battle Queen'],           female: ['War Mother', 'Matriarch', 'Battle Queen'] },
		scavenger_den:     { male: ['Salvage Chief', 'Den Master', 'Junk Boss'],          female: ['Salvage Chief', 'Den Master', 'Junk Boss'] },
	},

	leaderDialogs: {
		raider_camp: {
			intro:          ["You've got nerve walking up here alone. Say what you came to say.", "We don't get visitors. We get targets. Which are you?"],
			greeting_ok:    ["We've heard worse. You're still breathing, so that's something.", "Fine. Keep talking."],
			greeting_fail:  ["Turn around. Now.", "We don't do friendly."],
			trade_ok:       ["What are you offering? Don't waste my time.", "We trade. But on our terms."],
			trade_fail:     ["We're not looking for business partners.", "Come back when you've got leverage."],
			gift_accept:    ["Caps talk. Everything else is noise.", "A gesture. It's noted. Don't push it."],
		},
		biker_gang: {
			intro:          ["We don't get many visitors who leave the same way they came in. What do you want?", "State your business. We've got roads to cover."],
			greeting_ok:    ["Not bad for an outsider. What's your angle?", "You know how to talk to people. Noted."],
			greeting_fail:  ["We don't trust smiles. Especially from strangers.", "Save the friendliness. We're not interested."],
			trade_ok:       ["We move fuel and gear. If you've got something we need, we'll deal.", "Fair trade is the only trade we do. What've you got?"],
			trade_fail:     ["We don't commit to arrangements with people we don't know.", "Come back after we've seen you around a while."],
			gift_accept:    ["Now we're speaking the same language.", "Caps. Practical. I can work with that."],
		},
		survivor_camp: {
			intro:          ["We're cautious around strangers. It's kept us alive.", "A lot of people claim to be friendly. Most aren't. What do you want?"],
			greeting_ok:    ["You seem decent enough. That's more than we usually get.", "We'll hear you out. That's a start."],
			greeting_fail:  ["We've been burned by friendly strangers before.", "Not today. Come back when we've had time to think."],
			trade_ok:       ["We trade when we can. What are you proposing?", "A trade arrangement could work. Tell me more."],
			trade_fail:     ["We're not ready to commit to outside arrangements yet.", "Let's get to know each other first."],
			gift_accept:    ["This helps. More than you know.", "We don't forget people who help us out here."],
		},
		monastery: {
			intro:          ["Peace be with you, traveller. What brings you to our gates?", "We welcome all who come in peace. Are you one such person?"],
			greeting_ok:    ["A civil greeting. It is appreciated.", "May your intentions be as kind as your words."],
			greeting_fail:  ["Forgive us. Trust is earned slowly here.", "We are cautious. That is not personal, only wise."],
			trade_ok:       ["We trade what we grow and what we preserve. What would you offer?", "Commerce serves the community. We are open to discussion."],
			trade_fail:     ["We would need to know you better before making arrangements.", "Our trust is not extended quickly. Return when you have earned it."],
			gift_accept:    ["Generosity is its own reward. Thank you.", "The Lord provides — sometimes through unexpected hands."],
		},
		convent: {
			intro:          ["We do not turn away those who come with good intentions. State yours.", "Our doors are open to those who respect what we have built here."],
			greeting_ok:    ["A respectful approach. We can work with that.", "You conduct yourself well. That matters to us."],
			greeting_fail:  ["We have learned to be careful. Do not take it personally.", "We are not ready to extend ourselves to strangers."],
			trade_ok:       ["We have medicine and food to offer. What can you bring us?", "Trade done fairly serves everyone. Let us discuss."],
			trade_fail:     ["We need time before we can commit to anything with outsiders.", "Come back. Slowly earn our trust."],
			gift_accept:    ["Your generosity will not be forgotten.", "Thank you. It means more than its value."],
		},
		trading_post: {
			intro:          ["Welcome. We do business with everyone here — that's the policy.", "No politics, no factions. Just trade. You're in the right place."],
			greeting_ok:    ["Pleasant enough. Now, what are you buying or selling?", "Nice manners. Good for business."],
			greeting_fail:  ["We've dealt with worse. But we're still cautious.", "Everything starts somewhere. Try again."],
			trade_ok:       ["Now we're talking. What do you need and what can you offer?", "Fair trade builds good relationships. Let's see what we can do."],
			trade_fail:     ["Come back when you've got something concrete to propose.", "We deal in specifics. Vague interest doesn't move product."],
			gift_accept:    ["Caps are always welcome. Good start.", "You know how to do business. Good."],
		},
		cult_compound: {
			intro:          ["The Chosen do not receive outsiders lightly. State your purpose and it will be judged.", "You stand at the edge of a new world. Tread carefully."],
			greeting_ok:    ["Your words are... acceptable. The Shepherd will hear more.", "You have not come to mock us. That is noted."],
			greeting_fail:  ["The faithful do not open themselves to all who knock.", "Leave. The Shepherd is not ready to receive you."],
			trade_ok:       ["We share what we have with those deemed worthy.", "What you offer must serve the community. What is it?"],
			trade_fail:     ["We are not ready to trust the outside world with our needs.", "The community must decide. Return another time."],
			gift_accept:    ["A gesture of goodwill. The Shepherd approves.", "Material things are fleeting. But this gesture is noted."],
		},
		military_base: {
			intro:          ["Identify yourself and state your purpose. You have thirty seconds.", "This is a restricted area. You're here because we allowed it. Don't waste our time."],
			greeting_ok:    ["Civilian. Not a threat. For now.", "Minimal formality. Fine. Get to the point."],
			greeting_fail:  ["We don't do pleasantries. Move on.", "Next time, skip the preamble."],
			trade_ok:       ["We have materiel. What are you offering in exchange?", "Supply lines are everything. What's on the table?"],
			trade_fail:     ["We don't establish supply arrangements with uncleared civilians.", "Clearance takes time. You don't have it yet."],
			gift_accept:    ["Payment noted. Your status is being reviewed.", "Caps don't buy clearance. But they help."],
		},
		farming_community: {
			intro:          ["We don't see many strangers out here. Passing through, or is there something you need?", "We're a quiet community. We'd like to keep it that way. What brings you here?"],
			greeting_ok:    ["You seem harmless enough. That's a good sign.", "We appreciate people who don't lead with a weapon."],
			greeting_fail:  ["We've been wary since the raiders came through last season. Can't help it.", "Not today. We need time."],
			trade_ok:       ["We grow more than we need most seasons. What are you looking to exchange?", "Fair trade is how we've stayed alive. What have you got?"],
			trade_fail:     ["Let's take this one step at a time. Get to know each other first.", "We're careful about outside arrangements. Come back."],
			gift_accept:    ["Every little helps out here. Thank you.", "Kindness isn't forgotten in a place like this."],
		},
		medical_colony: {
			intro:          ["We're a medical facility, not a fort. If you're hurt, we can help. If not, what do you need?", "Our priority is care, not commerce. But we can't survive on goodwill alone. What are you here for?"],
			greeting_ok:    ["Calm and civil. That's a good sign after the week we've had.", "We deal with enough pain. A pleasant approach is appreciated."],
			greeting_fail:  ["We're careful. It's a habit. Don't take it personally.", "Everyone who's hurt us seemed friendly at first."],
			trade_ok:       ["Medicine is scarce everywhere. What can you bring us that we actually need?", "We can offer treatment and supplies. But our needs are specific. Interested?"],
			trade_fail:     ["We need to verify who we're dealing with before arranging anything.", "Trust first. Arrangements second."],
			gift_accept:    ["Caps help us keep the lights on. Genuinely, thank you.", "Resources like this go directly to patient care."],
		},
		tribal_village: {
			intro:          ["Outsiders must earn the right to speak here. Begin by telling us who you are.", "The spirits watch all who enter. Be honest in your purpose."],
			greeting_ok:    ["You speak without deception. The elders have noticed.", "A stranger who does not rush. Interesting."],
			greeting_fail:  ["Our trust is not given. It is earned.", "The elders are not ready. Return when the season changes."],
			trade_ok:       ["We trade what the land provides. What do you bring in return?", "Exchange is sacred — it must be equal. What are you proposing?"],
			trade_fail:     ["You are still a stranger to us. Come back when you are not.", "The spirits have not confirmed your intentions yet."],
			gift_accept:    ["An offering. The spirits accept it.", "You understand how things are done. That is good."],
		},
		prison_colony: {
			intro:          ["Nobody comes through the gate without a reason. What's yours?", "We run a tight operation here. No room for passengers. What do you want?"],
			greeting_ok:    ["You've got manners. Unusual. What do you want?", "Fine. You didn't come in shooting. That puts you ahead of most."],
			greeting_fail:  ["We don't do friendly. Not with outsiders.", "Save it. We've heard every approach."],
			trade_ok:       ["We've got manpower and material. What are you bringing?", "Business is business. What's the arrangement?"],
			trade_fail:     ["We don't make deals with people we don't know.", "Not yet. Earn it."],
			gift_accept:    ["Cold hard caps. Now we're talking.", "Money talks. The rest is noise."],
		},
		nomad_caravan: {
			intro:          ["We move fast and trade fair. That's the deal. What are you after?", "You caught us at a rest stop. Lucky timing. What do you need?"],
			greeting_ok:    ["An honest approach. We've seen worse.", "Good instincts — we respond to civil better than most."],
			greeting_fail:  ["We've been on the road too long to take risks with strangers.", "We're not unfriendly. Just careful."],
			trade_ok:       ["We carry a bit of everything. What are you looking for?", "Name what you've got. We'll tell you if there's a deal to be made."],
			trade_fail:     ["We've got enough arrangements on this route already.", "Come back next time we roll through."],
			gift_accept:    ["Caps smooth every road. Appreciated.", "You know how to open a conversation. Good."],
		},
		amazonian_tribe: {
			intro:          ["Men who come in peace are tolerated. Choose your words carefully.", "State your purpose. We don't have patience for those who waste our time."],
			greeting_ok:    ["You carry yourself without arrogance. Unusual.", "Acceptable. What do you want?"],
			greeting_fail:  ["Your kind has given us little reason for warmth.", "We are not impressed by pleasantries."],
			trade_ok:       ["We trade for metal and tools. What can you offer?", "We take what we need. But fair exchange is respected."],
			trade_fail:     ["We don't extend trust easily. Not to outsiders.", "Return when you have proven yourself."],
			gift_accept:    ["Practical. We respect that.", "An offering of value. It has been received."],
		},
		scavenger_den: {
			intro:          ["You're either a customer or you're in the way. Which is it?", "We find things other people lose. You looking to buy, sell, or leave?"],
			greeting_ok:    ["Fine. You're not here to cause trouble. What do you need?", "Direct enough. We can work with that."],
			greeting_fail:  ["We don't warm up to strangers fast. That's policy.", "Try again another time."],
			trade_ok:       ["We deal in salvage — parts, materials, tech. What are you offering?", "Everything has a price here. What's the trade?"],
			trade_fail:     ["Come back with something worth our time.", "We deal in specifics. What've you actually got?"],
			gift_accept:    ["Caps. Always useful.", "We'll remember this. Good way to start."],
		},
	},

};
