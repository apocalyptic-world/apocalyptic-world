setup.sleepMessages = {
    messages: null,
    init: function() 
    {
        setup.sleepMessages.messages = {
            main: {},
            jobs: {},
            shop: {},
            rules: {}
        };
    },

    get: function()
    {
        return setup.sleepMessages.messages;
    },

    add: function(message, category, sub = '') {
        setup.sleepMessages.messages[category] ??= {};
        setup.sleepMessages.messages[category][sub] ??= [];
        setup.sleepMessages.messages[category][sub].push(message);
    },

    addMain: function(message)
    {
        setup.sleepMessages.add(message, 'main');
    },

    addShop: function(message)
    {
        setup.sleepMessages.add(message, 'shop');
    },

    addJob: function (message, job)
    {
        setup.sleepMessages.add(message, 'jobs', job);
    },

    count: function()
    {
        let count = 0;
        for (let _messageType in setup.sleepMessages.messages) {
            count += Object.keys(setup.sleepMessages.messages[_messageType]).length;
        }
        
        return count;
    }


};