/**
 * WinJS OAuth for Twitter
 * https://github.com/cauld/winjs-oauth-for-twitter
 * Copyright Manifold - sebagomez 2012-2015. All rights reserved.
 * Apache License, Version 2.0
 */

 (function () {
	"use strict"

	//Fetch a sample Twitter profile for demo purposes
	function _getSampleTwitterProfile(twitterOAuthInstance, callback) {
		var queryParams,
            url = 'https://api.twitter.com/1.1/users/show.json';

		queryParams = {
			'screen_name': 'microsoft'
		};

		twitterOAuthInstance.sendAuthorizedRequestForUser(url, 'GET', queryParams)
            .then(function (response) {
            	callback(response.results);
            })
            .done();
	}

	function _getTwitterData() {

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
		if (Twitter.OAuth.Config.userOAuthToken === '' || Twitter.OAuth.Config.userOAuthTokenSecret === '') {
			twitterOAuthInstance = new TwitterOAuth(Twitter.OAuth.Config.consumerKey, Twitter.OAuth.Config.consumerSecret, '', '', Twitter.OAuth.Config.callbackUrl);

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

					Twitter.OAuth.getSampleTwitterProfile(twitterOAuthInstance, function (profile) {
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
														Twitter.OAuth.Config.userOAuthToken, Twitter.OAuth.Config.userOAuthTokenSecret, Twitter.OAuth.Config.callbackUrl);

			Twitter.OAuth.getSampleTwitterProfile(twitterOAuthInstance, function (profile) {
				twitterResponseNode.innerHTML = JSON.stringify(profile);
			});
		}
	}

	function _handleException(error) {
		if (Windows.UI.Popups.MessageDialog) {
			var messageDialog = new Windows.UI.Popups.MessageDialog(error.detail.errorMessage, ":(");
			messageDialog.showAsync();
		}

		debugger; //Stop here while debugging

		return true;
	}

	WinJS.Namespace.define("Twitter.OAuth", {
		getTwitterData: _getTwitterData,
		getSampleTwitterProfile: _getSampleTwitterProfile,
		handleException: _handleException
	});

})();