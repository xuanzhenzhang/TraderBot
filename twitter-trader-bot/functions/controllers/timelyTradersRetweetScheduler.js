const functions = require("firebase-functions");
const { traderInfoDict } = require("../config/config");
const assert = require("../helpers/assert");

exports.timely_traders_retweet_scheduler = functions.pubsub
  .schedule("every 5 minutes")
  .onRun((context) => {
    const axios = require("axios");
    const rwClient = require("../clients/twitterApiClient.js");
    const tradersInfoUrl =
      "https://us-central1-traderbot-2dbe5.cloudfunctions.net/traders";
    axios
      .get(tradersInfoUrl)
      .then((tradersInfo) => {
        const newTweetsInfoPromises = [];
        const tradersInfoToUpdate = [];
        if (tradersInfo == null || tradersInfo.data == null) {
          console.log("TradersInfo is null");
          return;
        }
        tradersInfo.data.forEach((traderInfo) => {
          const traderId = traderInfo.trader_id;
          const lastTweetId = traderInfo.last_tweet_id;
          let newTweetsUrl = "";
          if (lastTweetId == null) {
            newTweetsUrl =
              "https://api.twitter.com/2/users/" +
              traderId +
              "/tweets?max_results=5";
          } else {
            newTweetsUrl =
              "https://api.twitter.com/2/users/" +
              traderId +
              "/tweets?since_id=" +
              lastTweetId;
          }
          newTweetsInfoPromises.push(rwClient.get(newTweetsUrl));
        });
        Promise.all(newTweetsInfoPromises)
          .then((results) => {
            if (results.length != tradersInfo.data.length) {
              console.log(
                "Length mismatch between traders' info and traders' tweets"
              );
              return;
            }
            for (let i = 0; i < tradersInfo.data.length; i++) {
              // No new tweets!
              if (
                results[i] == null ||
                results[i].meta == null ||
                results[i].meta.result_count == 0
              ) {
                continue;
              }
              const traderInfo = tradersInfo.data[i];
              const traderId = traderInfo.trader_id;
              const lastTweetId = traderInfo.last_tweet_id;
              let updatedTweetIdList = [];
              const tweetIdList = traderInfo.tweet_id_list;
              const traderNewTweets = results[i].data;
              const traderTweetLatestId = results[i].meta.newest_id;
              assert(
                traderNewTweets != null && traderTweetLatestId != null,
                "traderNewTweets and traderTweetLatestId should not be null"
              );
              traderNewTweets.forEach((traderNewTweet) => {
                const traderNewTweetId = traderNewTweet.id;
                const traderNewTweetText = traderNewTweet.text;
                const isReplyTweet = traderNewTweetText.charAt(0) == "@";
                /* 
                  newestId may not be equal to last id in the tweetIdList 
                  since may not retweet non-trade tweets in the future 
                */
                // if (traderNewTweetId != lastTweetId && !isReplyTweet) {
                if (
                  filterTweets(
                    traderId,
                    traderNewTweetText,
                    traderNewTweetId,
                    lastTweetId
                  )
                ) {
                  if (tweetIdList == null) {
                    updatedTweetIdList.push(traderNewTweetId);
                  } else {
                    tweetIdList.push(traderNewTweetId);
                  }
                  const postUrl =
                    "https://api.twitter.com/2/users/1504363325886328835/retweets";
                  rwClient
                    .post(postUrl, { tweet_id: traderNewTweetId })
                    .catch((err) => {
                      return err;
                    });
                }
                // }
              });
              if (tweetIdList != null) {
                updatedTweetIdList = tweetIdList;
              }
              tradersInfoToUpdate.push({
                traderId: traderId,
                lastTweetId: traderTweetLatestId,
                tweetIdList: updatedTweetIdList,
              });
            }
            return tradersInfoToUpdate;
          })
          .then((tradersInfoToUpdate) => {
            if (
              tradersInfoToUpdate != null &&
              tradersInfoToUpdate.length == 0
            ) {
              return;
            }
            axios
              .put(tradersInfoUrl, { data: tradersInfoToUpdate })
              .then(() => {})
              .catch((err) => {
                return err;
              });
          })
          .catch((err) => {
            return err;
          });
      })
      .catch((err) => {
        return err;
      });
  });

function filterTweets(
  traderId,
  traderNewTweetText,
  traderNewTweetId,
  lastTweetId
) {
  if (
    traderInfoDict[traderId] == "HsakaTrades" ||
    traderInfoDict[traderId] == "GCRClassic" ||
    traderInfoDict[traderId] == "GiganticRebirth" ||
    traderInfoDict[traderId] == "HighStakesCap"
  ) {
    return true;
  }
  const isReplyTweet = traderNewTweetText.charAt(0) == "@";
  if (traderNewTweetId != lastTweetId && !isReplyTweet) {
    return true;
  }
  return false;
}

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
