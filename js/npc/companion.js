setup.companionGet = function(key)
{
    var splitKey = key.split(':');
    if (splitKey[0] === 'guest') {
        return variables().guests[splitKey[1]];
    }

    return variables().slaves[splitKey[1]];
}
