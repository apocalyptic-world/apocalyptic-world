setup.relationshipRun = function() {
    let start = Date.now();
    for (let i = 0; i <= variables().guests.length; i++) {
        let npc = variables().guests[i];
        if (npc.assignedTo === 'mistress') {
            continue;
        }

    }

    let end = Date.now() - start;
    console.log("Relationships run: " + timeTaken + " milliseconds");
};