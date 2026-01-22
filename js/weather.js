setup.weather = {
    isColdSpan: function() {
        return variables().weather?.coldSnap ?? false;
    }
};