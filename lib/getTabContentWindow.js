"use strict";

const sdkTabToXulTab = require('sdkTabToXulTab');
const { getTabContentWindow } = require("sdk/tabs/utils");

module.exports = function getSDKTabContentWindow(sdkTab){
    return getTabContentWindow( sdkTabToXulTab(sdkTab) );
};
