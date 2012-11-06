WinJS OAuth for Twitter
=======================

Windows Library for JavaScript (WinJS) OAuth class for working 
with the Twitter API (v1.1).

WinJS projects do not allow for references to external JavaScript 
files so the main class file can be found in the /js folder.

The sample includes a complete solution that can be run with 
Visual Studio 2012 (>= Express edition).

License
-------
Copyright Manifold 2012. All rights reserved.

Apache License, Version 2.0

Sample Setup
------------
1. Update js/config.js with your Twitter app's consumer key & secret
    - This will take you through the web auth flow
2. Update js/config.js with a user access token & secret either from 
one you already have or with one obtained after running the sample project once with just step 1.
    - This will bypass the web auth step and just execute a signed 
 request against the Twitter API.