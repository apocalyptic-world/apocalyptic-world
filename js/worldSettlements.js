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
		BROTHEL_TOWN:       'brothel_town',
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
			defenseMultiplier: 1.4,
			description:       'A rough biker gang operating out of an old garage. Loud engines, short fuses.',
			canSlaveTrade:     false,
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
			defenseMultiplier: 0.9,
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
			defenseMultiplier: 0.7,
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
			defenseMultiplier: 0.6,
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
			defenseMultiplier: 1.0,
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
			defenseMultiplier: 1.6,
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
			defenseMultiplier: 0.8,
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
			defenseMultiplier: 2.0,
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
			defenseMultiplier: 0.7,
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
			defenseMultiplier: 0.5,
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
			defenseMultiplier: 1.1,
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
			defenseMultiplier: 1.5,
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
			defenseMultiplier: 0.8,
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
			defenseMultiplier: 1.3,
			description:       'An all-female warrior tribe. Fiercely independent and protective of their territory.',
			canSlaveTrade:     false,
			recruitDifficulty: 3,
		},
		brothel_town: {
			names:             ['The Den', 'Pleasure Haven', 'The Red Quarter', 'The Velvet Cage', 'Scarlet Town', "The Madam's House"],
			genderComp:        'mostly_female',
			baseRelationship:  20,
			sizeRange:         [20, 100],
			traits:            ['entertainment', 'well_informed', 'neutral_ground'],
			production:        { necklace_cheap: 2, alcohol: 2, condom: 2 },
			tradeGoods:        ['food', 'alcohol', 'necklace_cheap', 'sextoy', 'lube', 'condom', 'cosmetics', 'gagball', 'buttplug', 'chastity_belt', 'whippit', 'xanax'],
			wantsGoods:        ['alcohol', 'food', 'cosmetics', 'lube', 'cloth', 'piercing'],
			defenseMultiplier: 0.9,
			description:       'A settlement built around entertainment and services. Everyone comes here, nobody talks about it.',
			canSlaveTrade:     true,
			recruitDifficulty: 2,
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
			defenseMultiplier: 1.0,
			description:       'A settlement of scavengers who strip old buildings and vehicles for parts.',
			canSlaveTrade:     false,
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
		return {
			id:                'settlement_' + window.randomInteger(100000, 999999),
			type:              type,
			name:              names[window.randomInteger(0, names.length - 1)],
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
		setup.settlements.discover(s, variables().day || 0);

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
		return { success: true, relationGain: relationGain };
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
		const victory  = ratio >= (mode === 'raid' ? 0.6 : 1.0);

		let mcCasualtyChance = victory ? Math.floor(30 / ratio) : Math.floor(50 + 20 / ratio);
		mcCasualtyChance = Math.max(5, Math.min(mcCasualtyChance, 90));

		const spoils = {};
		if (victory) {
			const fraction = mode === 'siege' ? 1.0 : Math.min(ratio * 0.4, 0.6);
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
		if (outcome.victory) {
			s.population = Math.max(0, s.population - outcome.populationLoss);
			for (const res in outcome.spoils) {
				s.resources[res] = Math.max(0, (s.resources[res] || 0) - outcome.spoils[res]);
			}
			setup.settlements.modifyRelationship(s, -30, 'Raided by player');
			s.raidCooldown = currentDay + 7;
			setup.settlements.logEvent(s, 'Raided by player.');
			if (s.population === 0 || outcome.mode === 'siege') s.destroyed = true;
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
		return { success: true, newLevel: setup.settlements.getRelationshipLabel(s) };
	},

	offerTribute: function (s, totalValue) {
		const boost = Math.max(1, Math.floor(totalValue / 8));
		setup.settlements.modifyRelationship(s, boost, 'Tribute paid');
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
		}
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
		const namePool    = gender === 1 ? maleNames : femaleNames;
		const traitPool   = ['strong', 'fast', 'smart', 'charismatic', 'medic', 'fighter', 'farmer', 'mechanic', 'scout'];
		const shuffled    = traitPool.sort(function() { return Math.random() - 0.5; });

		const npc = {
			name:   namePool[window.randomInteger(0, namePool.length - 1)],
			gender: gender,
			origin: s.name,
			type:   s.type,
			traits: shuffled.slice(0, window.randomInteger(1, 2)),
		};

		s.population = Math.max(1, s.population - 1);
		setup.settlements.modifyRelationship(s, -2, 'Recruited member');
		return { success: true, npc: npc };
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
			return { success: false, reason: "They don't trust you enough to share information." };
		}
		const pool = [
			'Raiders have been spotted moving through the northern roads.',
			'A large herd passed through last week — resources are scarce.',
			'A military convoy was seen heading east three days ago.',
			'A new settlement has been spotted two days march from here.',
			'Someone has been watching the roads at night. Be careful.',
			'There are rumours of a well-stocked bunker to the south.',
			'A group of survivors fled from the direction of the old refinery.',
		];
		return { success: true, intel: pool[window.randomInteger(0, pool.length - 1)] };
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

		if (window.randomInteger(1, 100) <= 5) {
			setup.settlements.triggerRandomEvent(s, currentDay);
		}
	},

	triggerRandomEvent: function (s) {
		const events = [
			function () { setup.settlements.modifyRelationship(s, -5, 'Internal conflict'); setup.settlements.logEvent(s, 'A power struggle broke out inside the settlement.'); },
			function () { const loss = window.randomInteger(1, 5); s.population = Math.max(1, s.population - loss); setup.settlements.logEvent(s, 'Disease outbreak — ' + loss + ' people died.'); },
			function () { s.resources.food = Math.max(0, (s.resources.food || 0) - window.randomInteger(5, 15)); setup.settlements.logEvent(s, 'Food spoilage or bad harvest.'); },
			function () { const gain = window.randomInteger(1, 4); s.population += gain; setup.settlements.logEvent(s, gain + ' new arrivals joined the settlement.'); },
			function () { setup.settlements.modifyRelationship(s, 3, 'Settlement prospering'); setup.settlements.logEvent(s, 'The settlement is doing well this season.'); },
			function () { s.resources.metal = (s.resources.metal || 0) + window.randomInteger(5, 15); setup.settlements.logEvent(s, 'Scavengers returned with a supply cache.'); },
			function () { s.population = Math.max(1, s.population - window.randomInteger(1, 3)); s.resources.food = Math.max(0, (s.resources.food || 0) - window.randomInteger(5, 20)); setup.settlements.logEvent(s, 'Raiders hit the settlement.'); },
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
		return variables().worldSettlements || [];
	},

	save: function (list) {
		variables().worldSettlements = list;
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
		if ((variables().worldSettlements || []).length > 0) return;
		const day  = variables().day || 1;
		const list = setup.settlements.generateBatch(count || 12, day);
		setup.settlements.save(list);
	},

	/** Add a new settlement mid-game. */
	add: function (options) {
		const list = setup.settlements.getAll();
		const s    = setup.settlements.generate(Object.assign({ dayCreated: variables().day || 1 }, options || {}));
		list.push(s);
		setup.settlements.save(list);
		return s;
	},

	/** Run a daily tick on every settlement and save. */
	dailyUpdateAll: function () {
		const day  = variables().day || 1;
		const list = setup.settlements.getAll();
		for (let i = 0; i < list.length; i++) {
			setup.settlements.dailyUpdate(list[i], day);
		}
		setup.settlements.save(list);
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
			setup.settlements.applyAttackOutcome(s, outcome, variables().day || 1);
			setup.settlements.save(list);
		}
	},

	/** Mark a settlement as discovered by id and save. */
	discoverById: function (id) {
		const list = setup.settlements.getAll();
		const s    = list.find(function (s) { return s.id === id; });
		if (s) {
			setup.settlements.discover(s, variables().day || 1);
			setup.settlements.save(list);
		}
	},

};
