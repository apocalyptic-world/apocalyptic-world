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
        if (variables().characters?.dom?.dead) {
            _moneyEarnedTax = 0;
        } else if (variables().characters?.dom?.quests.accepted_deal) {
            _moneyEarnedTax = 40;
        }

        _moneyEarned += Math.round((npc.sub ?? 0) / 25);
        _moneyEarned += Math.round((npc.beauty ?? 0) / 25);

        let _pussyBonus = Math.round((npc.pussy ?? 0) / 25);
        if (!npc.chastityBelt && (npc.traits ?? []).includes('tight_vagina')) {
            _pussyBonus *= 2;
        }
        _moneyEarned += _pussyBonus;
        _moneyEarned += Math.round((npc.anal ?? 0) / 25);

        if (npc.chastityBelt) {
            _moneyEarned = Math.max(1, _moneyEarned / 3);
        }

        _moneyEarned = parseInt(_moneyEarned);
        _moneyEarned = _moneyEarned - Math.round((_moneyEarnedTax / 100) * _moneyEarned, 0);

        return _moneyEarned;
    },

    /** A sex act with a client (an anonymous man) during a job: 'pussy', 'bj' or 'anal'. */
    applyJobAct(npc, actType, jobCategory = 'streets') {
        const client = setup.sexActs.someone();
        if (actType === 'pussy') setup.sexActs.fucksPussy(client, npc);
        else if (actType === 'bj') setup.sexActs.blowsCock(npc, client);
        else if (actType === 'anal') setup.sexActs.fucksAss(client, npc);

        const traits = npc.traits ?? [];
        if (actType === 'pussy' && traits.includes('tight_vagina') && setup.sexActs.count(npc, 'receivedPussyFucked') >= 100) {
            npc.traits.splice(traits.indexOf('tight_vagina'), 1);
            setup.sleepMessages.addJob(npc.name + ' lost the <strong>tight vagina</strong> trait after extensive work.', jobCategory);
        }
    }
}
