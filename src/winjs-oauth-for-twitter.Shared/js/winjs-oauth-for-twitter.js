/**
 * WinJS OAuth for Twitter v1.3
 * https://github.com/cauld/winjs-oauth-for-twitter
 * Copyright Manifold - sebagomez 2012-2015. All rights reserved.
 * Apache License, Version 2.0
 */

/*global Windows: false, WinJS: false, XMLHttpRequest: false */
/*jslint nomen: true, plusplus: true, sloppy: true, white: true */

var TwitterOAuth = WinJS.Class.define(
    //Constructor
    function (consumerKey, consumerSecret, accessToken, accessTokenSecret, callbackUrl) {
        this._consumerKey = consumerKey;
        this._consumerSecret = consumerSecret;

        //If we already have accessToken then doTwitterWebAuth can be avoided
        this._accessToken = accessToken || null;
        this._accessTokenSecret = accessTokenSecret || null;

        //Define the OAuth callback url, not normally important for desktop apps
        this._callbackURL = callbackUrl || null;
    },
    //instanceMembers
    {
        _authorizeURL: 'https://api.twitter.com/oauth/authorize',
        _requestTokenURL: 'https://api.twitter.com/oauth/request_token',
        _accessTokenURL: 'https://api.twitter.com/oauth/access_token',

        //Signs internal requests used during the process of access token retrieval 
        _sendAuthorizedRequest: function (url, method, headerParams, callback) {
            var authzHeader = this._getOAuthRequestHeaders(headerParams);

            this._xhrRequest(method, url, null, authzHeader, function (result, statusCode) {
            	callback(result, statusCode);
            });
        },

        _xhrRequest: function (method, url, postBody, authzHeader, callback) {
        	var self = this,
				request,
                extraResponseInfo;

            try {
            	request = new XMLHttpRequest();
                request.open(method, url, true);
                request.onreadystatechange = function () {
                    if (request.readyState === request.DONE) {
                        if (request.status === 200) {
                            //In v1.1 Twitter moved the API rate limit into the response headers
                            //Ref 1: https://dev.twitter.com/docs/rate-limiting-faq#checking
                            //Ref 2: https://dev.twitter.com/docs/rate-limiting/1.1/limits
                            extraResponseInfo = {
                                "X-Rate-Limit-Limit": request.getResponseHeader('X-Rate-Limit-Limit') || null,
                                "X-Rate-Limit-Remaining": request.getResponseHeader('X-Rate-Limit-Remaining') || null,
                                "X-Rate-Limit-Reset": request.getResponseHeader('X-Rate-Limit-Reset') || null
                            };

                            callback(request.responseText, 200, extraResponseInfo);
                        } else {
                        	throw self._processErrorResponse(request.responseText);
                        }
                    }
                };
                request.setRequestHeader("Authorization", authzHeader);

                if (method === 'GET' || postBody === null) {
                    request.send();
                } else {
                    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                    request.setRequestHeader("Content-length", postBody.length);
                    request.send(postBody);
                }
            } catch (err) {
                //console.log("Error sending request: " + err);
                callback(false, 500);
            }
        },

        _processErrorResponse: function (responseXmlError) {
        	var i = responseXmlError.indexOf('error code="') + 'error code="'.length;
        	var j = responseXmlError.indexOf('\"', i);
        	var code = responseXmlError.substring(i, j);
        	var m = responseXmlError.indexOf('>', j) + 1;
        	var n = responseXmlError.indexOf('<', m);
        	var msg = responseXmlError.substring(m, n);
        	return code + ': ' + msg;
        },

        //Generate an OAuth 1.0a HMAC-SHA1 signature for an HTTP request
        _generateHmacSha1Signature: function (sigBaseString, keyText) {
            var keyMaterial,
                macAlgorithmProvider,
                tbs,
                key,
                signatureBuffer,
                signature;

            keyMaterial = Windows.Security.Cryptography.CryptographicBuffer.convertStringToBinary(keyText, Windows.Security.Cryptography.BinaryStringEncoding.Utf8);
            macAlgorithmProvider = Windows.Security.Cryptography.Core.MacAlgorithmProvider.openAlgorithm("HMAC_SHA1");
            key = macAlgorithmProvider.createKey(keyMaterial);
            tbs = Windows.Security.Cryptography.CryptographicBuffer.convertStringToBinary(sigBaseString, Windows.Security.Cryptography.BinaryStringEncoding.Utf8);
            signatureBuffer = Windows.Security.Cryptography.Core.CryptographicEngine.sign(key, tbs);
            signature = Windows.Security.Cryptography.CryptographicBuffer.encodeToBase64String(signatureBuffer);

            return signature;
        },

        _getSortedKeys: function (obj) {
            var key,
                keys = [];

            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    keys[keys.length] = key;
                }
            }

            return keys.sort();
        },

        /** 
         * Assembles proper headers based on a series of provided tokens, secrets, and signatures
         * References: 
         * https://dev.twitter.com/docs/auth/authorizing-request
         * https://dev.twitter.com/docs/auth/creating-signature
         * Debug oauth signing errors here - https://dev.twitter.com/apps/3400014/oauth
         */
        _getOAuthRequestHeaders: function (headerParams) {
            var i,
                k,
                kv,
                sortedKeys,
                sigParams,
                sigBaseString,
                sigBaseStringParams = '',
                queryParamsKey,
                keyText,
                signature,
                headers,
                timestamp = Math.round(new Date().getTime() / 1000.0),
                nonce = Math.random();

            // Acquiring a request token
            nonce = Math.floor(nonce * 1000000000);

            sigParams = {
                oauth_callback: !headerParams.oauthTokenSecret ? encodeURIComponent(this._callbackURL) : "",
                oauth_consumer_key: headerParams.consumerKey,
                oauth_nonce: nonce,
                oauth_signature_method: 'HMAC-SHA1',
                oauth_timestamp: timestamp,
                oauth_token: headerParams.oauthToken || "",
                oauth_verifier: headerParams.oauthVerifier || "",
                oauth_version: '1.0'
            };

            //We need to combine the oauth params with any query params
            if (headerParams.queryParams) {
                for (queryParamsKey in headerParams.queryParams) {
                    if (headerParams.queryParams.hasOwnProperty(queryParamsKey)) {
                        sigParams[queryParamsKey] = headerParams.queryParams[queryParamsKey];
                    }
                }
            }

            // Compute base signature string and sign it.
            // This is a common operation that is required for all requests even after the token is obtained.
            // Parameters need to be sorted in alphabetical order
            // Keys and values should be URL Encoded.
            sortedKeys = this._getSortedKeys(sigParams);
            for (i = 0; i < sortedKeys.length; i++) {
                k = sortedKeys[i];
                kv = sigParams[sortedKeys[i]];
                if (kv && kv !== '') {
                    if (sigBaseStringParams !== '') {
                        sigBaseStringParams += '&';
                    }
                    sigBaseStringParams += k + '=' + kv;
                }
            }

            sigBaseString = headerParams.method + "&" + encodeURIComponent(headerParams.url) + "&" + encodeURIComponent(sigBaseStringParams);

            keyText = encodeURIComponent(headerParams.consumerSecret) + "&";
            if (headerParams.oauthTokenSecret) {
                keyText += encodeURIComponent(headerParams.oauthTokenSecret);
            }

            signature = this._generateHmacSha1Signature(sigBaseString, keyText);
            headers = "OAuth " + (!headerParams.oauthTokenSecret ? ("oauth_callback=\"" + encodeURIComponent(this._callbackURL) + "\", ") : "") +
                "oauth_consumer_key=\"" + headerParams.consumerKey +
                "\", oauth_nonce=\"" + nonce +
                "\", oauth_signature=\"" + encodeURIComponent(signature) +
                "\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"" + timestamp +
                (headerParams.oauthToken ? ("\", oauth_token=\"" + headerParams.oauthToken) : "") +
                (headerParams.oauthVerifier ? ("\", oauth_verifier=\"" + headerParams.oauthVerifier) : "") +
                "\", oauth_version=\"1.0\"";

            return headers;
        },

        //Gets a request token which is used to initiate a 3 legged oauth call
        _getRequestToken: function (callback) {
            var i,
                splits,
                headerParams,
                keyValPairs,
                requestToken,
                requestTokenSecret;

            headerParams = {
                consumerKey: this._consumerKey,
                consumerSecret: this._consumerSecret,
                url: this._requestTokenURL,
                method: 'POST'
            };

            this._sendAuthorizedRequest(this._requestTokenURL, 'POST', headerParams, function (response) {
                keyValPairs = response.split("&");

                //Grab the returned request tokens
                for (i = 0; i < keyValPairs.length; i++) {
                    splits = keyValPairs[i].split("=");
                    switch (splits[0]) {
                        case "oauth_token":
                            requestToken = splits[1];
                            break;
                        case "oauth_token_secret":
                            requestTokenSecret = splits[1];
                            break;
                    }
                }

                callback({
                    oauth_token: requestToken,
                    oauth_token_secret: requestTokenSecret
                });
            });
        },

        //Gets a user specific access token & secret which is used to sign requests on a users behalf
        _getAccessToken: function (requestToken, oauthVerifier, callback) {
            var i,
                splits,
                headerParams,
                keyValPairs,
                userAccessToken,
                userAccessTokenSecret,
                twitterUserId,
                screenName;

            headerParams = {
                consumerKey: this._consumerKey,
                consumerSecret: this._consumerSecret,
                oauthToken: requestToken,
                oauthVerifier: oauthVerifier,
                url: this._accessTokenURL,
                method: 'POST'
            };

            this._sendAuthorizedRequest(this._accessTokenURL, 'POST', headerParams, function (response) {
                if (response === false) {
                    //Request failes, most likely the user cancelled the request
                    callback(false);
                } else {
                    keyValPairs = response.split("&");

                    //Disect the important parts
                    for (i = 0; i < keyValPairs.length; i++) {
                        splits = keyValPairs[i].split("=");
                        switch (splits[0]) {
                            case "oauth_token":
                                userAccessToken = splits[1];
                                break;
                            case "oauth_token_secret":
                                userAccessTokenSecret = splits[1];
                                break;
                            case "user_id":
                                twitterUserId = splits[1];
                                break;
                            case "screen_name":
                                screenName = splits[1];
                                break;
                        }
                    }

                    callback({
                        oauth_token: userAccessToken,
                        oauth_token_secret: userAccessTokenSecret,
                        twitter_user_id: twitterUserId,
                        screen_name: screenName
                    });
                }
            });
        },

        setAccessToken: function (accessToken, accessTokenSecret) {
            this._accessToken = accessToken;
            this._accessTokenSecret = accessTokenSecret;
        },

        /**
         * Get approval for our app from the user.
         * Gets us approved access tokens for making future requests on the users behalf.
         * https://dev.twitter.com/docs/api/1/get/oauth/authorize
         **/
        doTwitterWebAuth: function (callback) {
            var self = this,
                i,
                splits,
                responseKeyValPairs,
                startURI,
                endURI,
                oauthVerifier;

            this._getRequestToken(function (requestTokenData) {

            	self.setAccessToken(requestTokenData.oauth_token, requestTokenData.oauth_token_secret);

                //Send the user to get app authorization
                startURI = new Windows.Foundation.Uri(self._authorizeURL + "?oauth_token=" + requestTokenData.oauth_token);
                endURI = new Windows.Foundation.Uri(self._callbackURL);
                //endURI = Windows.Security.Authentication.Web.WebAuthenticationBroker.getCurrentApplicationCallbackUri();

                if (Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAndContinue) { // Phone


                	WinJS.Application.webAuthenticatedHandler = function (eventObject) {
                		if (eventObject && eventObject.webAuthenticationResult && eventObject.webAuthenticationResult.responseData) {
                			self._continueAuthentication(eventObject.webAuthenticationResult.responseData, callback);
                		}
                	};

                	Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAndContinue(startURI, endURI);
                }
                else {
                	Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAsync(
					Windows.Security.Authentication.Web.WebAuthenticationOptions.none, startURI, endURI)
						.done(function (result) {
							var twitterResponseData = result.responseData,
								twitterResponseStatus = result.responseStatus;

							if (twitterResponseStatus === Windows.Security.Authentication.Web.WebAuthenticationStatus.errorHttp) {
								//console.log("Error returned: " + result.responseErrorDetail);
								callback(false);
							} else {
								self._continueAuthentication(twitterResponseData, callback);

								//The authorize request when successful will return an oauthVerifier
								//https://dev.twitter.com/docs/auth/authorizing-request
								//responseKeyValPairs = twitterResponseData.split("?")[1].split("&");

								////Disect the important parts
								//for (i = 0; i < responseKeyValPairs.length; i++) {
								//	splits = responseKeyValPairs[i].split("=");
								//	switch (splits[0]) {
								//		case "oauth_verifier":
								//			oauthVerifier = splits[1];
								//			break;
								//	}
								//}

								////With the user request token in hand we can request a perm user access token
								//self._getAccessToken(requestTokenData.oauth_token, oauthVerifier, function (accessTokenData) {
								//	if (accessTokenData === false) {
								//		//Request failes, most likely the user cancelled the request
								//		callback(false);
								//	} else {
								//		//Set this in the instance, but return as well so it can be saved off as needed
								//		self._accessToken = accessTokenData.oauth_token;
								//		self._accessTokenSecret = accessTokenData.oauth_token_secret;
								//		callback(accessTokenData);
								//	}
								//});
							}
						}, function (err) {
							//console.log("Error returned by WebAuth broker: " + err.message);
							callback(false);
						});
                }
            });
        },

    	//Continues with the authentication process
    	//returnedTokens is a string in form of oauth_token=ctcYVVmFXXXXXXXXXXXXXX&oauth_verifier=2DPvVYYYYYYYYYYYYYYYY0MbT2O
        _continueAuthentication: function (returnedTokens, callback) {
        	var self = this, oauthVerifier, oauthToken;
        	var responseKeyValPairs = returnedTokens.split("?")[1].split("&");

        	//Disect the important parts
        	for (i = 0; i < responseKeyValPairs.length; i++) {
        		splits = responseKeyValPairs[i].split("=");
        		switch (splits[0]) {
        			case "oauth_verifier":
        				oauthVerifier = splits[1];
        				break;
        			case "oauth_token":
        				oauthToken = splits[1];
        				break;
        		}
        	}

        	//With the user request token in hand we can request a perm user access token
        	self._getAccessToken(oauthToken, oauthVerifier, function (accessTokenData) {
        		if (accessTokenData === false) {
        			//Request failes, most likely the user cancelled the request
        			callback(false);
        		} else {
        			//Set this in the instance, but return as well so it can be saved off as needed
        			self._accessToken = accessTokenData.oauth_token;
        			self._accessTokenSecret = accessTokenData.oauth_token_secret;
        			callback(accessTokenData);
        		}
        	});
        },

        //Signs a request with the apps consumer secret & the users access token secret
        //Note: queryParms must be an object with key/value pairs (values should be urlencoded)
        sendAuthorizedRequestForUser: function (url, method, queryParams) {
            var self = this,
                promise,
                postBody = null,
                headerParams,
                authzHeader;

            promise = new WinJS.Promise(function (complete) {
                headerParams = {
                    consumerKey: self._consumerKey,
                    consumerSecret: self._consumerSecret,
                    oauthToken: self._accessToken,
                    oauthTokenSecret: self._accessTokenSecret,
                    url: url,
                    method: method
                };

                if (queryParams) {
                    headerParams.queryParams = queryParams;

                    var i = 0,
                        key,
                        queryString = '';

                    for (key in queryParams) {
                        if (queryParams.hasOwnProperty(key)) {
                            if (i > 0) {
                                queryString += '&';
                            }
                            queryString += key + '=' + queryParams[key];
                            i++;
                        }
                    }

                    if (method === 'GET') {
                        url += '?' + queryString;
                    } else {
                        postBody = queryString;
                    }
                }

                authzHeader = self._getOAuthRequestHeaders(headerParams);
                self._xhrRequest(method, url, postBody, authzHeader, function (results, statusCode, extraResponseInfo) {
                    complete({
                        results: results,
                        statusCode: statusCode,
                        extraResponseInfo: extraResponseInfo
                    });
                });
            });

            return promise;
        }
    },
    //staticMembers
    {}
);