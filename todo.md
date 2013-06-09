Add checkbox to new devtool option panel to enable usefulStackTrace (hope it's browser-wide)
    
    [] enable usefulStackTrace (may degrade JavaScript performance)

On new global in current tab (navigation, refresh...), if (devtools open in the current tab && usefulStackTrace pref enabled), then use instrument with Debugger API-based script and show warning ("degrade perf, click to disable").

No cleaning. People can disable the pref (or close devtools) and refresh. This is cheap enough to be largely usable without being annoying.
