setup.range = function (start, end) {
    return Array.apply(0, Array(end))
      .map((element, index) => index + start);
};