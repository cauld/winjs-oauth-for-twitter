/**
 * WinJS OAuth for Twitter
 * https://github.com/sebagomez/winjs-oauth-for-twitter
 * Copyright Manifold/Sebagomez 2012-2015. All rights reserved.
 * Apache License, Version 2.0
 */
(function () {
    "use strict";



    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

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

            Twitter.OAuth.getTwitterData();
           
        }
        if (args.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.webAuthenticationBrokerContinuation && WinJS.Application.webAuthenticatedHandler) {
        	return WinJS.Application.webAuthenticatedHandler(args.detail);
        }
    };

    app.onerror = Twitter.OAuth.handleException;

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
