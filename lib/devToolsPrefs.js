"use strict";

//console.log("gDevTools props", Object.getOwnPropertyNames(gDevTools));

//var optionsTool = getOptionsTool(gDevTools);

//console.log('optionsTool props', Object.getOwnPropertyNames(optionsTool));

//var devtools = devtools.require("");

/*const { Loader } = Cu.import("resource://gre/modules/commonjs/toolkit/loader.js", {});

const { XPCOMUtils } = Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const loaderGlobals = {
    console: console,
    //_Iterator: function(){},//Iterator,
    loader: {
        lazyGetter: XPCOMUtils.defineLazyGetter.bind(XPCOMUtils),
        lazyImporter: XPCOMUtils.defineLazyModuleGetter.bind(XPCOMUtils)
    }
};


// Making require accept internal Firefox modules... or something of this kind
// http://www.oxymoronical.com/blog/2013/02/The-Add-on-SDK-is-now-in-Firefox
// http://work.erikvold.com/jetpack/2013/06/03/old-school-to-jetpack-all-gain-no-pain.html

const loader = Loader.Loader({
    modules: {
        "toolkit/loader": Loader
    },
    paths: {
        "devtools": "resource:///modules/devtools",
        "": "resource://gre/modules/commonjs/"
    },
    globals: loaderGlobals,
    resolve: function(id, base) {
        if (id == "chrome" || id.startsWith("@"))
            return id;
        return Loader.resolve(id, base);
    }
});

// fake requirer uri scriptish:// (it's used for relative requires and error messages)
newRequire = Loader.Require(loader, Loader.Module("main", ""));*/

//console.log('devtools keys', Object.keys(devtools));

// add pref to a DevTools object
// will add it to all OptionsPanel created (add an "addon pref" section first)


/* package.json pref:

 "preferences": [
 {
 "name": "enabled",
 "title": "Enabled",
 "description": "Toggle to enable or disable the pref",
 "type": "bool",
 "value": false
 }
 ],

 */

const prefs = require("sdk/preferences/service");
const ADDON_ID = require('sdk/self').id;


const OPTIONS_PANEL_ID = "options";
const OPTIONS_PANEL_READY_EVENT_NAME = OPTIONS_PANEL_ID+'-ready';


function prefInternalId(id){
    // https://addons.mozilla.org/en-US/developers/docs/sdk/latest/modules/sdk/simple-prefs.html#Using%20the%20Preferences%20Service%20to%20Access%20Simple%20Prefs
    return ['extensions', ADDON_ID, id].join('.');
}


function addPrefToOptionPanel(optPan, prefDesc){
    const doc = optPan.panelDoc;
    const {id, label, tooltip, value, onChange} = prefDesc;

    const ADDON_PREF_AREA_ID = "addon-options-group";
    // create area for addon prefs
    let addonOptionsGroup = doc.getElementById(ADDON_PREF_AREA_ID);
    if(!addonOptionsGroup){

        let optPanelHbox = doc.getElementById('options-panel');

        // <vbox id="?" class="options-vertical-pane" flex="1">
        const addonPrefArea = doc.createElement('vbox');
        addonPrefArea.classList.add("options-vertical-pane");
        addonPrefArea.setAttribute("flex", "1");

        // <label>
        const labelEl = doc.createElement("label");
        labelEl.setAttribute("value", "Addon preferences");

        addonPrefArea.appendChild(labelEl);

        // <vbox id="context-options" class="options-groupbox">
        addonOptionsGroup = doc.createElement('vbox');
        addonOptionsGroup.classList.add("options-groupbox");
        addonOptionsGroup.id = ADDON_PREF_AREA_ID;

        addonPrefArea.appendChild(addonOptionsGroup);


        optPanelHbox.appendChild(addonPrefArea);
    }



    const checkbox = doc.createElement("checkbox");
    checkbox.setAttribute("id", id);
    checkbox.setAttribute("label", label);
    checkbox.setAttribute("tooltiptext", tooltip || "");
    checkbox.setAttribute("checked", value);
    checkbox.addEventListener("command", onChange);

    addonOptionsGroup.appendChild(checkbox);

}


module.exports = function(gDevTools){

    if(Object(gDevTools) !== gDevTools)
        throw new TypeError('gDevTools should be an object ('+ gDevTools===null? "null" : typeof gDevTools +')');

    const customOptions = new Map();

    // Hacky. I shouldn't have to listen to whenever a panel is ready.
    // I should have access to an OptionTool abstraction or something
    gDevTools.on(OPTIONS_PANEL_READY_EVENT_NAME, function(wtfEventString, toolbox){
        // very ad-hoc https://github.com/mozilla/mozilla-central/blob/master/browser/devtools/framework/toolbox.js#L445
        console.log(OPTIONS_PANEL_READY_EVENT_NAME, 'event', toolbox);

        const optionsPanel = toolbox.getPanel(OPTIONS_PANEL_ID);

        for(let [key, prefDesc] of customOptions){
            addPrefToOptionPanel(optionsPanel, prefDesc);
        }

    });

    return {

        addDevToolPref: function(prefDesc){
            const {id, label, tooltip, value, onChange} = prefDesc;

            if(customOptions.has(id))
                throw new Error("There is already a pref with id '"+id+"'");

            prefs.set( prefInternalId(id), value );


            customOptions.set(id, {id:id, label:label, tooltip: tooltip, value:value, onChange:onChange});
        },

        getDevToolPref: function(id){
            return customOptions.get(id);
        }

    }
}