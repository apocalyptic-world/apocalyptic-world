setup.range = function (start, end) {
    return Array.apply(0, Array(end))
      .map((element, index) => index + start);
};

window.timeBetween = function (from, to) {
  var current = new Date(variables().gameDate);

  var minTime = new Date(current);
  var minTimeSplit = from.split(':');
  minTime.setHours(minTimeSplit[0]);
  minTime.setMinutes(minTimeSplit[1]);
  if (current.getHours() < 8) {
      minTime.setDate(minTime.getDate() - 1);
  }

  var maxTime = new Date(current);
  var maxTimeSplit = to.split(':');
  if (from > to) {
      maxTime.setDate(maxTime.getDate() + 1);
  }
  maxTime.setHours(maxTimeSplit[0]);
  maxTime.setMinutes(maxTimeSplit[1]);
  if (current.getHours() < 8) {
      maxTime.setDate(maxTime.getDate() - 1);
  }

  return current >= minTime && current < maxTime;
};
