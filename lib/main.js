"use strict";

const { Cu } = require("chrome");
const tabs = require("sdk/tabs");
const { prefs } = require("sdk/simple-prefs");

const trackStack = require('trackStack.js');
const getSDKTabContentWindow = require('getTabContentWindow.js');
const addPrefToOptionPanel = require('addPrefToOptionPanel.js');
const sdkTabToXulTab = require('sdkTabToXulTab');
const devToolsOpen = require('devToolsOpen');

const ENABLED_PREF_KEY = 'enabled';
const OPTIONS_PANEL_ID = "options";
const OPTIONS_PANEL_READY_EVENT_NAME = OPTIONS_PANEL_ID+'-ready';

const P = Object.getPrototypeOf;

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



exports.main = function(){

    var tracked = new WeakMap();
    var events = require("sdk/system/events");
    events.on("content-document-global-created", function({type, subject, data}){
        console.log(type, 'event');
        const currentTabGlobal = getSDKTabContentWindow(tabs.activeTab);
        if(currentTabGlobal === subject &&
            prefs[ENABLED_PREF_KEY] &&
            devToolsOpen(devtools, sdkTabToXulTab(tabs.activeTab)))
        {
            console.info('Pref on and devtools open. Tracking') // TODO Move this warning to the DevTool console
            if(!tracked.has(currentTabGlobal)){
                trackStack(currentTabGlobal);
                tracked.set(currentTabGlobal, true)
            }
        }

    }, true);

    console.log('usefulStackTrace addon loaded without error');
};

