var config      = require('./config.js')
    Twit        = require('twit')
    Slack       = require('node-slack')
    slack       = new Slack(config.slack.webhook_url,config.slack.options)
    instances   = [];


//setup twit
config.twitter.map(function(val) {
    console.log(val.username);

    instances.push({
        twit:     new Twit(val.keys),
        username: val.username
    });
});

instances.map(function(instance) {
    console.log('instance:' + instance.username);
    instance.stream = instance.twit.stream('user');
    instance.stream.on('tweet', function(tweet) {
        console.log(instance.username + ': ' +tweet.text);

        var twitter_url = 'https://twitter.com/' +tweet.user.screen_name + '/status/' + tweet.id_str;

        tweet.entities.urls.map(function(url) {
            tweet.text = tweet.text.replace(url.url,url.expanded_url);
        });

        var fields = [
            {
                value: tweet.text
            },
            {
                value: '<' +twitter_url+'>'
            }
        ];

        var attachment = [{
            author_name: tweet.user.name + ' @' + tweet.user.screen_name,
            author_icon: tweet.user.profile_image_url,
            author_link: twitter_url,
            fields: fields,
            fallback_text: tweet.text
        }];

        slack.send({
            unfurl_links: true,
            channel: '#general',
            username: instance.username,
            icon_emoji: instance.slack_emoji,
            text: '@' + tweet.user.screen_name + ' at ' + tweet.created_at,
            attachments: attachment
        });
    });
});
