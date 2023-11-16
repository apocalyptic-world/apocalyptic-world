/* simple calculations for phases of moon, new and full
    good enough for a game
    */
setup.calcPhaseOfMoon = function (current = variables().gameDate) {
    const lunar_month = 29.53059;
    /* last new moon before the game starts Tue, 25 Oct 2022 10:45:21 GMT */
    const new_moon = new Date("25 Oct 2022 10:45:21 GMT");
    const ms_diff = current.getUTCMilliseconds() - new_moon.getUTCMilliseconds();
    const msInADay = 86400000; /* 1000*60*60*24 */
    const days_diff = ms_diff/msInADay;
    return days_diff % lunar_month; /* 0..lunar_month, full in the middle, new in the ends */
};

setup.isFullMoon = function (current = variables().gameDate) {
    const moonphase = setup.calcPhaseOfMoon(current)
    return (14 < moonphase && moonphase < 16) 
}; 

setup.isNewMoon = function (current = variables().gameDate) {
    const moonphase = setup.calcPhaseOfMoon(current)
    return (1 < moonphase || moonphase > 29) 
}; 
