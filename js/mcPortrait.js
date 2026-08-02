/* MC portrait override: updates <<you>> say boxes after each passage renders */
$(document).on(':passageend', function () {
    const portrait = State.variables.player && State.variables.player.portrait;
    if (!portrait) return;
    const src = portrait.includes('http')
        ? portrait
        : setup.ImagePath + 'custom_portraits/' + portrait;
    $('.you.say img').attr('src', src);
});
