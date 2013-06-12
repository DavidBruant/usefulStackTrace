"use strict";

const self = require('self');

//console.log("gDevTools props", Object.getOwnPropertyNames(gDevTools));

var optionsTool = getOptionsTool(gDevTools);

console.log('optionsTool props', Object.getOwnPropertyNames(optionsTool));

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

module.exports = function(gDevTools){

    if(Object(gDevTools) !== gDevTools)
        throw new TypeError('gDevTools should be an object ('+ gDevTools===null? "null" : typeof gDevTools +')');


    return {

        addDevPref: function({label, initValue }){


        },

        getDevPref: function(label){


        }

    }
}