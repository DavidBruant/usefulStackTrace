"use strict";

const { Cu } = require("chrome");

const tabs = require("sdk/tabs");

const trackStack = require('trackStack.js');

const getSDKTabContentWindow = require('getTabContentWindow.js');

const addPrefToOptionPanel = require('addPrefToOptionPanel.js');

let devtools;

try{
    devtools = Cu.import("resource:///modules/devtools/Loader.jsm");
}
catch(ex){
    console.log('first loading error', ex);
    try{
        devtools = Cu.import("resource:///modules/devtools/gDevTools.jsm");
    }
    catch(e){
        console.error('second loading error', e)
    }
}

/**
 * gDevTools is unique per Firefox instance... like this add-on
 */
const { gDevTools } = devtools;

const { prefs } = require("sdk/simple-prefs");


const ENABLED_PREF_KEY = 'enabled';
const OPTIONS_PANEL_ID = "options";
const OPTIONS_PANEL_READY_EVENT_NAME = OPTIONS_PANEL_ID+'-ready';

const customOptions = new Map();
customOptions.set(ENABLED_PREF_KEY, {
    id: ENABLED_PREF_KEY,
    label: 'Enable useful stack trace (may degrade JavaScript performance)',
    tooltip: 'enable it!',
    get value(){
        return prefs[ENABLED_PREF_KEY];
    },
    onChange: function(e){
        const { target: {checked} } = e;

        console.log('checked', checked);

        prefs[ENABLED_PREF_KEY] = checked;
    }
});


// Hacky. I shouldn't have to listen to whenever a panel is ready.
// I should have access to an OptionTool abstraction or something
gDevTools.on(OPTIONS_PANEL_READY_EVENT_NAME, function(wtfEventString, toolbox){
    // very ad-hoc https://github.com/mozilla/mozilla-central/blob/master/browser/devtools/framework/toolbox.js#L445
    //console.log(OPTIONS_PANEL_READY_EVENT_NAME, 'event', toolbox);

    const optionsPanel = toolbox.getPanel(OPTIONS_PANEL_ID);

    for(let [key, prefDesc] of customOptions){
        addPrefToOptionPanel(optionsPanel, prefDesc);
    }

});



/**
 * 
 * Add checkbox to new devtool option panel to enable usefulStackTrace (hope it's browser-wide)
    
    [] enable usefulStackTrace (may degrade JavaScript performance)

On new global in current tab (navigation, refresh...), if (devtools open in the current tab && usefulStackTrace pref enabled),
then use instrument with Debugger API-based script and show warning ("degrade perf, click to disable").

No cleaning. People can disable the pref (or close devtools) and refresh. This is cheap enough to be largely usable without being annoying.
 * 
 * */


//const P = Object.getPrototypeOf;

exports.main = function() {

    if(!(ENABLED_PREF_KEY in prefs)){
        console.log(ENABLED_PREF_KEY, 'pref does not exist')
    }
    else{
        console.log("'enabled' pref exists", prefs[ENABLED_PREF_KEY]);
    }

    tabs.on('ready', function(tab) {
        console.log("'enabled' pref", prefs[ENABLED_PREF_KEY]);

        if(tab.url === 'file:///home/david/gitRepo/usefulStackTrace/test/index.html'){
            var win = getSDKTabContentWindow(tab);
            trackStack(win);
        }
    });


    console.log('usefulStackTrace addon loaded without error');
};

