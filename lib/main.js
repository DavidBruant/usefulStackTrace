"use strict";

const data = require("sdk/self").data;
const tabs = require("sdk/tabs");

const trackStack = require('trackStack.js');

const getSDKTabContentWindow = require('getTabContentWindow.js');

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

getOptionsPanel().then(function(optionPanel){
    //console.log('optionPanel', Object.getOwnPropertyNames(optionPanel), '[[P]]:', Object.getOwnPropertyNames( Object.getPrototypeOf(optionPanel) ));
    var doc = optionPanel.panelDoc;
    console.log('doc', doc);
});


exports.main = function() {
    
    tabs.on('ready', function(tab) {
        if(tab.url === 'file:///home/david/gitRepo/usefulStackTrace/test/index.html'){
            var win = getSDKTabContentWindow(tab);
            trackStack(win);
        }
    });

};

console.log('usefulStackTrace addon loaded without error');