setup.sleep = setup.sleep || {};

setup.sleep.processDumbbell = function(npc, isHeatWave) {
    if (npc.sick || isHeatWave) return;

    let training = false, percentInjury = 0, sickdays = 0, item = null;

    if (setup.npcInventoryHas(npc, 'dumbbell') && npc.strength < 30) {
        training = true;
        percentInjury = 0;
        sickdays = 2;
        item = 'dumbbell';
    } else if (setup.npcInventoryHas(npc, 'kettlebell') && npc.strength < 50) {
        training = true;
        percentInjury = -(7 * npc.strength ** 2) / 1000 - (49 * npc.strength) / 100 + 42;
        sickdays = 3;
        item = 'kettlebell';
    } else if (setup.npcInventoryHas(npc, 'dumbestbell') && npc.strength < 60) {
        training = true;
        percentInjury = -(7 * npc.strength ** 3) / 10000 + (63 * npc.strength ** 2) / 1000 - (133 * npc.strength) / 50 + 84;
        sickdays = 4;
        item = 'dumbestbell';
    }

    if (!training) return;

    if (setup.percentageChance(percentInjury)) {
        if (setup.percentageChance(42)) {
            const side = either('left', 'right');
            const reasons = [
                'got training soreness',
                'accidentally drops weight on toes',
                'trips and has a bad fall landing on ' + side + ' arm',
                ((npc.pregnancy ?? 0) > 180 ? 'falls backwards surprised when her unborn baby kicks' : 'got back-pain'),
            ];
            setup.sleepMessages.add('While working out with ' + item + ', ' + npc.name + ' ' + either(reasons) + '. Takes a sickday', 'main', '');
            npc.sick = { days: sickdays, desc: 'injured when working out', id: 'workout' };
        }
    } else {
        npc.strength++;
    }
};
