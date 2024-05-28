setup.jobs = {
    getStreetsEarned(npc)
    {
        let _moneyEarned = 0;
        if (!npc.gender) {
            _moneyEarned = randomInteger(4, 8);
        } else if (npc.gender == 2) {
            _moneyEarned = randomInteger(2, 6);
        } else {
            _moneyEarned = randomInteger(0, 4);
        }

        if ((npc.traits ?? []).includes('nymphomaniac')) {
            _moneyEarned = _moneyEarned * 2;
        }

        let _moneyEarnedTax = 80;
        if (variables().characters?.dom?.quests.accepted_deal) {
            _moneyEarnedTax = 40;
        }

        _moneyEarned += Math.round(npc.sub / 25, 0);
        _moneyEarned += Math.round(npc.beauty / 25, 0);

        if (typeof npc.pussy !== 'undefined') {
            _moneyEarned += Math.round(npc.pussy / 25, 0);
        }

        _moneyEarned += Math.round(npc.anal / 25, 0);

        if (npc.chastityBelt) {
            _moneyEarned = Math.max(1, _moneyEarned / 3);
        }

        _moneyEarned = parseInt(_moneyEarned);
        _moneyEarned = _moneyEarned - Math.round((_moneyEarnedTax / 100) * _moneyEarned, 0);

        return _moneyEarned;
    }
}