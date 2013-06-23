# usefulStackTrace

A little addon to have good error stack traces in Firefox.

# Make it work

To have this working:

1. Get [cfx](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/dev-guide/tutorials/getting-started-with-cfx.html)
1. run ````cfx xpi```` at the root of the directory
1. Install the add-on from files (In Firefox: file -> open -> (pick the xpi file))
1. [(after I've removed some ugly hardcoding)](https://github.com/DavidBruant/usefulStackTrace/blob/98d06390e7510841913d37c6ab2874fa99b0b250/lib/main.js#L102)
Open the [test/index.html](./test/index.html) file, open your console, click ````run````, notice the stack trace with arguments

# Licence

[MIT](./licence)