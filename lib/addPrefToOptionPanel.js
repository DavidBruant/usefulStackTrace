"use strict";

module.exports = function addPrefToOptionPanel(optPan, prefDesc){
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