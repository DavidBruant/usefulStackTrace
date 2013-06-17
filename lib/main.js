"use strict";

const { Cu } = require("chrome");

const data = require("sdk/self").data;
const tabs = require("sdk/tabs");

const trackStack = require('trackStack.js');

const getSDKTabContentWindow = require('getTabContentWindow.js');

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


const { addDevToolPref } = require('devToolsPrefs.js')(gDevTools);

/**
 * 
 * Add checkbox to new devtool option panel to enable usefulStackTrace (hope it's browser-wide)
    
    [] enable usefulStackTrace (may degrade JavaScript performance)

On new global in current tab (navigation, refresh...), if (devtools open in the current tab && usefulStackTrace pref enabled),
then use instrument with Debugger API-based script and show warning ("degrade perf, click to disable").

No cleaning. People can disable the pref (or close devtools) and refresh. This is cheap enough to be largely usable without being annoying.
 * 
 * */

//const devToolsConveniences = require('devToolsPrefs.js');
const getOptionsPanel = require('getOptionsPanel.js');

getOptionsPanel(gDevTools).then(function(optionPanel){
    //console.log('optionPanel', Object.getOwnPropertyNames(optionPanel), '[[P]]:', Object.getOwnPropertyNames( Object.getPrototypeOf(optionPanel) ));
    var doc = optionPanel.panelDoc;
    console.log('doc', doc);
});


exports.main = function() {

    addDevToolPref({
        id: 'enabled',
        label: 'useful stack trace enabled',
        tooltip: 'enable it!',
        value: false,
        onChange: function(v){
            console.log('Changing usf-stck-trac enabled pref to', v);
        }

    })

    tabs.on('ready', function(tab) {
        if(tab.url === 'file:///home/david/gitRepo/usefulStackTrace/test/index.html'){
            var win = getSDKTabContentWindow(tab);
            trackStack(win);
        }
    });



};

console.log('usefulStackTrace addon loaded without error');