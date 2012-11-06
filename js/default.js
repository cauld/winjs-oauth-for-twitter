/**
 * WinJS OAuth for Twitter
 * https://github.com/cauld/twitter-oauth-for-winjs
 * Apache License, Version 2.0
 */

(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    //Fetch a sample Twitter profile for demo purposes
    function getSampleTwitterProfile(twitterOAuthInstance, callback) {
        var queryParams,
            url = 'https://api.twitter.com/1.1/users/show.json';

        queryParams = {
            'screen_name': 'microsoft'
        };

        twitterOAuthInstance.sendAuthorizedRequestForUser(url, 'GET', queryParams)
            .then(function (results) {
                callback(results);
            })
            .done();
    }

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());

            //IMPORTANT: Update twitterConsumerKey, twitterConsumerSecret, userOAuthToken, userOAuthTokenSecret
            //with your info to experiment.  If you don't have the user access tokens you'll get some the first 
            //time through.
            var errMsg,
                dialog,
                accessTokensNode = document.getElementById('access_tokens'),
                twitterResponseNode = document.getElementById('twitter-response'),
                twitterOAuthInstance;

            //If the user has yet to approve your app then launch the web auth form,
            //do the handshake, and get their approved token info now...
            if (Twitter.OAuth.Config.userOAuthToken === '' || Twitter.OAuth.Config.userOAuthToken === '') {
                twitterOAuthInstance = new TwitterOAuth(Twitter.OAuth.Config.consumerKey, Twitter.OAuth.Config.consumerSecret);

                twitterOAuthInstance.doTwitterWebAuth(function (usersTwitterOauthInfo) {
                    if (usersTwitterOauthInfo) {
                        /* 
                        The OAuth instance is automatically updated with the access token info we were just granted.
                        This allows us to make signed requests on the users behalf.  These keys are
                        permanent unless revoked by the user, so in your app you'll probably want to store them for
                        future requests. 
                        */
                        twitterResponseNode.innerHTML = usersTwitterOauthInfo;

                        //Output the tokens as well just for reference
                        accessTokensNode.innerHTML = JSON.stringify(usersTwitterOauthInfo);
                        accessTokensNode.className = ''; //show it

                        getSampleTwitterProfile(twitterOAuthInstance, function (profile) {
                            twitterResponseNode.innerHTML = JSON.stringify(profile);
                        });
                    } else {
                        errMsg = 'Twitter authentication failed or was cancelled!';
                        dialog = Windows.UI.Popups.MessageDialog(errMsg);
                        dialog.showAsync();
                    }
                });
            } else {
                //With all the neccesary credentials in place we can make signed requests to Twitter on the user's behalf
                twitterOAuthInstance = new TwitterOAuth(Twitter.OAuth.Config.consumerKey, Twitter.OAuth.Config.consumerSecret,
                                                            Twitter.OAuth.Config.userOAuthToken, Twitter.OAuth.Config.userOAuthTokenSecret);

                getSampleTwitterProfile(twitterOAuthInstance, function (profile) {
                    twitterResponseNode.innerHTML = profile;
                });
            }
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.start();
})();
