setup.fight = {
    simulateFight: function(fighter, enemy) {
        const fightOutcomes = {
            MaleVsMale: {
              win: [
                "[Male A] dodges a heavy strike and counters with a knee to [Male B]'s ribs, dropping him to the ground for the win.",
                "A flurry of punches from [Male A] overwhelms [Male B], forcing the referee to call the fight. [Male A] stands victorious.",
                "With a brutal punch to the jaw, [Male A] sends [Male B] crashing into the cage wall, as the crowd roars in approval."
              ],
              lose: [
                "[Male B] takes a hard hit but catches [Male A] in a chokehold, forcing him to tap out in defeat.",
                "[Male B] bides his time and delivers a crushing uppercut, sending [Male A] to the ground, knocked out cold.",
                "[Male B] counters a wild swing from [Male A], landing a decisive blow that leaves [Male A] defenseless and defeated."
              ]
            },
            FemaleVsFemale: {
              win: [
                "[Female A] slips under [Female B]'s strike and lands a spinning kick to her head, claiming the win with precision.",
                "With quick reflexes, [Female A] dodges a punch and brings [Female B] down with a devastating armbar submission.",
                "[Female A] unleashes a barrage of punches, leaving [Female B] unable to defend, securing her victory in the cage."
              ],
              lose: [
                "[Female B] takes control, grappling [Female A] into a rear-naked choke, forcing her to tap out.",
                "[Female B] lands a series of strikes, overwhelming [Female A] until she collapses, unable to continue.",
                "[Female B] catches [Female A] off guard with a powerful kick to the torso, dropping her to the floor and ending the fight."
              ]
            },
            emaleVsMale: {
              win: [
                "[Female A] evades [Male B]'s heavy attacks and counters with an elbow strike to his face, bringing him to his knees for the win.",
                "[Female A] uses her agility to outmaneuver [Male B], locking him into an armbar until he taps out.",
                "With surprising strength, [Female A] catches [Male B] in a guillotine choke, forcing him to submit to the shock of the audience."
              ],
              lose: [
                "[Male B] uses his size to overpower [Female A], slamming her into the cage wall before delivering the final blow.",
                "[Male B] takes advantage of his reach, landing a solid punch that knocks [Female A] out cold.",
                "After a long exchange, [Male B] catches [Female A] with a knee strike, leaving her unable to stand and ending the fight."
              ]
            }
          }


        const fightType = (fighter.gender === 0 ? 'Female' : 'Male') + 'Vs' + (enemy.gender === 0 ? 'Female' : 'Male');
        
        const fighterWins = fighter.strength > enemy.strength;
        
        const outcomeType = (fighterWins ? 'win' : 'lose');
        
        const result = fightOutcomes[fightType][outcomeType][Math.floor(Math.random() * fightOutcomes[fightType][outcomeType].length)];
        
        const text = result.replace(/\[Male A\]/g, setup.displayName(fighter)).replace(/\[Male B\]/g, setup.displayName(enemy))
                     .replace(/\[Female A\]/g, setup.displayName(fighter)).replace(/\[Female B\]/g, setup.displayName(enemy));

        return {
            'win2': fighterWins,
            'text': text
        };
      }
};