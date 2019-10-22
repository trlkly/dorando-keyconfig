# dorando-keyconfig

A modified version of [Dorando](http://mozilla.dorando.at/readme.html)'s tool to rebind keys in Mozilla apps. It is designed to be a drop-in replacement, and will keep your old settings. (See official version webpage for upgrade instructions.)

The only changes here are non-functional changes for compatibility with newer app versions, since Dorando is no longer maintaining the add-on.

Note that this add-on is _not_ compatible with Firefox 57 and newer, since it uses old add-on APIs that are no longer supported as of Firefox 57. However, it remains compatible with current versions of Thunderbird and SeaMonkey.

You can install this add-on from [addons.thunderbird.net](https://addons.thunderbird.net/thunderbird/addon/dorando-keyconfig) and [addons.palemoon.org](https://addons.palemoon.org/addon/keyconfig/). **If you are replacing Dorando's version of the add-on from 2011 or earlier with this version, make sure to uninstall Dorando's version before installing this one.**

## Working with the source code

To deploy the source code directly into Firefox, Thunderbird, or Mozilla, so that you can make changes here and then test them in the application without having to create and install a new XPI file:

1. Install the add-on normally from addons.mozilla.org.

2. Shut down the app.

3. Locate the "extensions" subdirectory of your app profile directory.

4. Locate the file "keyconfig@mozilla.dorando.at.xpi" in that directory and delete it.

5. Create a new text file called "keyconfig@mozilla.dorando.at" (note: no ".xpi" extension). In that file, put the full path to the directory this source code is in.

6. Locate the "prefs.js" file in your app profile directory.

7. Put this in it:

        user_pref("extensions.startupScanScopes", 5);

8. Restart the app from the command line with the argument `-purgecaches`.

9. Confirm that the add-on shows up in the add-ons listing.

Whenever you start the app with `-purgecaches` from this point forward, it will reload the current version of the add-on code from your source directory. It may also pick up your changes even when you don't specify `-purgecaches`, but the only way to be _certain_ that it will notice your changes is to specify that argument.

## Copyright

Dorando's original copyright is as follows:

>Copyright (c)  2004-2011  Dorando.
>Permission is granted to copy, distribute, and/or modify any part of this package.

The maintainers of this updated version of the add-on do not claim any additional copyright. In other words, the copyright above still applies.
