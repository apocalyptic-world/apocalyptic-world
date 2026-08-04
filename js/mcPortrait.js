/* Patch <<you>> to resolve MC portrait at render time, like sayNpc does */
$(document).one(':passageend', function () {
    var youMacro = Macro.get('you');
    if (!youMacro) return;
    youMacro.handler = function () {
        var portrait = State.variables.player && State.variables.player.portrait;
        var src = portrait
            ? (portrait.startsWith('http') ? portrait : setup.ImagePath + 'custom_portraits/' + portrait)
            : undefined;
        setup.say(this.output, 'you', this.payload[0].contents, src);
    };
});
