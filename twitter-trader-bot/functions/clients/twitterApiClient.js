const {TwitterApi} = require("twitter-api-v2");
// const dotenv = require("dotenv");
// dotenv.config({path:'./config.env'});

const client = new TwitterApi({
    appKey: '5UHUgQsUCzCpLJnQUNzlMv5K2',
    appSecret: 'hZqUFQDesXkNM6q6hukM2BMrA95Quzg3XeL9hWAoLFrNcoaDxQ',
    accessToken: '1504363325886328835-01KM0QOrNAp2Ixbpy8j7ILn9Wpu1QL',
    accessSecret: '6ewYLzt5tSfodPOG9Xv6k2pZS7XdOLPMCSPp2zYAExfNr'
})

// const client = new TwitterApi({
//     appKey:process.env.TWITTER_CONSUMER_KEY,
//     appSecret:process.env.TWITTER_CONSUMER_SECRET,
//     accessToken:process.env.TWITTER_ACCESS_KEY,
//     accessSecret:process.env.TWITTER_ACCESS_SECRET
// })

const rwClient = client.readWrite

module.exports = rwClient
