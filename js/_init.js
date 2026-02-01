setup.range = function (start, end) {
    return Array.apply(0, Array(end))
      .map((element, index) => index + start);
};

window.timeBetween = function (from, to) {
    const current = new Date(variables().gameDate);

    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);

    const minTime = new Date(current);
    minTime.setHours(fh, fm, 0, 0);

    const maxTime = new Date(current);
    maxTime.setHours(th, tm, 0, 0);

    if (to < from) {
        if (current < minTime) {
            minTime.setDate(minTime.getDate() - 1);
        } else {
            maxTime.setDate(maxTime.getDate() + 1);
        }
    }

    console.log(current);
    console.log(minTime);
    console.log(maxTime);
    console.log('------------');

    return current >= minTime && current < maxTime;
};