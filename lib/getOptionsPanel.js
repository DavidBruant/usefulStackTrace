"use strict";

/*
 15:49    davidbruant    dcamp It seems that the tools are so well encapsulated that I can't access them from gDevTools
 15:49    davidbruant    I can access their description (used to initialize the tools), but not the tools
 15:49    davidbruant    am I missing a bit of API?
 15:51    davidbruant    For instance, I'd like to access the OptionPanel instance used in the dev tools to add an option
 15:51    dcamp    davidbruant: probably - in aurora gDevTools.jsm also exports a 'devtools' object.
 15:51    dcamp    davidbruant: that 'devtools' object has a 'require' property
 15:52    dcamp    ah
 15:52    dcamp    hrm
 15:52    dcamp    that might be annoying, because there's actually one of those per mainToolbox.
 15:53    dcamp    you can get a Map of all the toolboxes with gDevTools._toolboxes, and listen for the creation of new
                   ones with gDevTools.on("mainToolbox-ready")
 15:54    dcamp    that is a Map of Toolbox objects from browser/devtools/framework/mainToolbox.js
 15:54    dcamp    from there you should be able to getPanel("options");
 15:55    dcamp    I think that'll give you back an OptionPanel instance?
 15:56    davidbruant    yep it appears so
 15:57    davidbruant    I imagine that mainToolbox-ready only happens once at browser startup?
 15:57    dcamp    it happens whenever a mainToolbox is opened
 15:58    davidbruant    ok great
 15:58    davidbruant    I was getting worried of race conditions (if the addon runs after the mainToolbox-ready event)
 15:59    dcamp    you can iterate gDevTools._toolboxes to get the list of toolboxes that were opened before your addon connected
 15:59    dcamp    and then follow mainToolbox-ready to get the rest

 => The OptionsPanel instance is created lazily so that doesn't work. Needs to listen to gDevTools' 'options-ready'
 */

const { defer } = require('sdk/core/promise');

const { Cu } = require("chrome");

const OPTIONS_PANEL_ID = "options";
const OPTIONS_PANEL_READY_EVENT_NAME = OPTIONS_PANEL_ID+'-ready';

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

const { gDevTools } = devtools;

const optionsPanelDef = defer();

let optionsPanel;

// very ad-hoc https://github.com/mozilla/mozilla-central/blob/master/browser/devtools/framework/toolbox.js#L445
gDevTools.on(OPTIONS_PANEL_READY_EVENT_NAME, function(wtfEventString, toolbox){
    console.log(OPTIONS_PANEL_READY_EVENT_NAME, 'event', toolbox);

    optionsPanel = toolbox.getPanel(OPTIONS_PANEL_ID);

    optionsPanelDef.resolve(optionsPanel);
});


/**
 * returns a promise for the OptionsPanel instance
 */
module.exports = function(){
    return optionsPanelDef.promise;
}