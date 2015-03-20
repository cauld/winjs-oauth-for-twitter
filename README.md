WinJS OAuth for Twitter
=======================

Windows Library for JavaScript (WinJS) OAuth class for working 
with the Twitter API (v1.1).

WinJS projects do not allow for references to external JavaScript 
files so the main class file can be found in the /js folder.

The sample includes a complete solution that can be run with 
Visual Studio 2013 (>= Express edition).

As of March 20th 2015 this project is a [Universal app](https://msdn.microsoft.com/en-us/library/windows/apps/dn609832.aspx) running on both Windows 8.1 and Windows Phone 8.1

License
-------
Copyright Manifold - sebagomez 2012-2015. All rights reserved.

Apache License, Version 2.0

Sample Setup
------------
1. Update Shared/js/config.js with your Twitter app's consumer key & secret
    - This will take you through the web auth flow
3. Update your Shared/js/config.js with your app's callback URL (the one you set on Twitter app's config)
2. Update Shared/js/config.js with a user access token & secret either from 
one you already have or with one obtained after running the sample project once with just step 1.
    - This will bypass the web auth step and just execute a signed 
 request against the Twitter API.