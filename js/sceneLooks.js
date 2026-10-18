/**
 * Scene images that show a random NPC are drawn with ONE fixed look (race + hair). An event that uses such an image
 * only picks an NPC who fits it, so the picture never contradicts the NPC (same idea as Elsa's date, which only takes
 * white/latina NPCs with black/brown hair). Scenes that can't choose their NPC (sex screen, settlement leaders) use
 * neutral images instead (faces in shadow) and are not listed here.
 *
 * Hair values come from setup.hairRoll / dyeRoll in js/npc/npc.js (non-white races are rolled 'black').
 */
setup.sceneLooks = {
    // Library [Event] - caught reading (intro picture; the sex steps use <<actionImage>>): latina, dark hair in a ponytail
    library_reading: { race: ['latina'], hair: ['black', 'brown'] },
    // Library [Event] - she followed you (intro picture): black woman, black curly hair
    library_followed: { race: ['black'], hair: ['black'] },
    // Blair [Event] - House rules: the guest Blair clashes with is an asian woman with black hair
    house_rules_guest: { race: ['asian'], hair: ['black'] }
};

/** True when this NPC matches the look of the scene image (unknown key = no restriction). */
setup.fitsSceneLook = function (npc, key) {
    const look = setup.sceneLooks[key];
    if (!look) return true;
    if (!npc) return false;
    return (!look.race || look.race.includes(npc.race)) && (!look.hair || look.hair.includes(npc.hair));
};
