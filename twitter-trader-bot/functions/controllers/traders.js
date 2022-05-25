const functions = require('firebase-functions');
const express = require('express');
const tradersApp = express();
tradersApp.use(express.json());

const dotenv = require('dotenv');
dotenv.config({path:'./config.env'});


tradersApp.get('/',  (req, res) => {
    const {Client} = require('pg');
    const client = new Client({
        connectionString: process.env.CONNECTION_STRING,
    });
    const query = 'SELECT * FROM "xuanzhenzhang/TraderTwitter"."trader_tweets";';
    client.connect()
        .then(() => client.query(query) )
        .then((results) => {
            if (results.rows.length == 0) {
                return res.status(400).json({
                    error: true,
                    message: 'There are no collections available',
                });
            } else {
                return res.status(200).json(results.rows);
            }
        })
        .catch((err) => res.status(500).json(err))
        .finally(() => client.end());
})

tradersApp.put('/',  (req, res) => {
    const tradersInfo = req.body;
    const {Client} = require('pg');
    const client = new Client({
        connectionString: process.env.CONNECTION_STRING,
        // connectionString: 'postgresql://xuanzhenzhang:3q7BY_FMBsghkUnxapC3dMgZ7ULzw@db.bit.io/xuanzhenzhang/TraderTwitter?sslmode=prefer',
    });
    let query = '';
    tradersInfo.data.forEach((traderInfo) => {
        const {traderId, lastTweetId, tweetIdList} = traderInfo;
        query += 'UPDATE "xuanzhenzhang/TraderTwitter"."trader_tweets" SET last_tweet_id=' + lastTweetId 
                + ', tweet_id_list=\'' + JSON.stringify(tweetIdList) + '\' WHERE trader_id=' + traderId + ';\n';
    });
    client.connect()
        .then(() => client.query(query) )
        .then((results) => {
            return res.status(200).json(results);
        })
        .catch((err) => res.status(500).json(err))
        .finally(() => client.end());
})


tradersApp.post('/',  (req, res) => {
    const tradersIds = req.body;
    const {Client} = require('pg');
    const client = new Client({
        connectionString: process.env.CONNECTION_STRING,
    });
    let query = '';
    tradersIds.data.forEach((traderId) => {
        query += 'INSERT INTO "xuanzhenzhang/TraderTwitter"."trader_tweets" (trader_id,tweet_id_list) VALUES (' + traderId + ', \'[]\');';
    });
    client.connect()
        .then(() => client.query(query) )
        .then((results) => {
            return res.status(200).json(results);
        })
        .catch((err) => res.status(500).json(err))
        .finally(() => client.end());
})

tradersApp.post('/:id',  (req, res) => {
    const traderId = req.params.id;
    const {Client} = require('pg');
    const client = new Client({
        connectionString: process.env.CONNECTION_STRING,
    });
    const query = 'INSERT INTO "xuanzhenzhang/TraderTwitter"."trader_tweets" (trader_id,tweet_id_list) VALUES (' + traderId + ', \'[]\');';
    client.connect()
        .then(() => client.query(query) )
        .then((results) => {
            return res.status(200).json(results);
        })
        .catch((err) => res.status(500).json(err))
        .finally(() => client.end());
})

exports.traders = functions.https.onRequest(tradersApp);
