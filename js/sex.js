setup.sex = {
    calcHornyIncrease: function(beauty, hornyIncrease)
    {
        let levels = [
            { name: "Beautiful", multiplier: 2 },
            { name: "Pretty", multiplier: 1.5 },
            { name: "Average", multiplier: 1 },
            { name: "Ugly", multiplier: 0.5 }
        ];
    
        let hornyPerStep = hornyIncrease * (0.5 + beauty / 200);
        let levelIndex = Math.max(0, Math.min(Math.floor(hornyPerStep / (hornyIncrease / 2)), levels.length - 1));
    
        return parseInt(hornyPerStep);
    }
}