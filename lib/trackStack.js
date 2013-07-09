"use strict";

// LIBRARY

const {Cu} = require("chrome");
const { addDebuggerToGlobal } = Cu.import("resource://gre/modules/jsdebugger.jsm");
addDebuggerToGlobal(this);

const P = Object.getPrototypeOf;
//console.log('Debugger:', typeof Debugger, Object.getOwnPropertyNames(Debugger), Object.getOwnPropertyNames(P(Debugger)))

// Safer and more declarative replacement for resumption value
Debugger.Resumption = {
    return : function(value){
        return {return: value};
    },
    yield : function(value){
        return {yield: value};
    },
    throw : function(value){
        return {throw: value};
    },
    stop : null,
    continue : undefined
};

function allKeys(o){
    console.group()
    while(o !== null){
        console.log(Object.getOwnPropertyNames(o))
        o = P(o)
    }
    console.groupEnd()
}

function frameName(f){
    return f.type === 'call' ?
        f.callee.name :
        f.type ;
}

const getObjectId = (function(){
    var wm = new WeakMap();
    var id = 1;
    return function (frame){
        if(wm.has(frame))
            return wm.get(frame);
        else{
            wm.set(frame, id);
            return id++;
        }
    };
})();

function frameEnvIds(frame){
    var env = frame.environment;
    var ids = [];

    while(env){
        ids.push(getObjectId(env));
        env = env.parent;
    }

    console.log('environments of frame', frameName(frame), ':',ids.join(' → '));
}


Debugger.Object.prototype.toString = function(){
    var object = this;
    var jsonableCopy = {};
    //allKeys(this);

    object.getOwnPropertyNames().forEach(function(prop){
        var desc = object.getOwnPropertyDescriptor(prop);
        jsonableCopy[prop] = desc.value;
    });

    return JSON.stringify(jsonableCopy);
};
Debugger.Object.prototype.toJSON = Debugger.Object.prototype.toString;




function copyArguments(args){
    return Array.prototype.map.call(args, function(e){ return e;});
}

function toArgumentString(v){
    if(v === null)
        return 'null';
    if(typeof v === 'function')
        return 'function '+v.name;
    if(typeof v === 'object')
        return JSON.stringify(v);
    if(typeof v === 'string')
        return "'"+v+"'";

    return String(v);
}


function completionThrowValueToString(t){
    return (Object(t) === t && t.message) ? t.message : String(t);
}


module.exports = function trackStack(global){

    var doc = global.document;
    var console = global.console;

    var dbg = new Debugger(global);
    dbg.uncaughtExceptionHook = function(e){
        console.error('uncaughtExceptionHook', e, e.stack);
    };

    var scripts = dbg.findScripts();

    var uncaughtErrorFramePopHandler = (function(){
        var frameData = [];

        return function(completionValue){
            var frame = this;
            //console.log('Leaving frame', frameName(frame), 'with completion value', completionValue);

            var thisFrameData = {};

            if('throw' in completionValue){
                console.log('frame with error thrown detected!');
                thisFrameData.script = frame.script;
                thisFrameData.offset = frame.offset;
                thisFrameData.frameNames = frameName(frame);

                var argCopy = copyArguments(frame.arguments);
                //console.log('argCopy', JSON.stringify(argCopy));
                thisFrameData.argCopies = argCopy;

                frameData.push(thisFrameData);

                // inline <script>s run after the HTML parser have frame.type === "global"
                if(frame.older === null || frame.older.type === 'global'){
                    console.group();
                    console.error('Good grief! An Uncaught Error!');
                    console.error('Error message:', completionThrowValueToString(completionValue.throw) );

                    console.group();
                    frameData.forEach(function(f){
                        const {offset, frameNames, script, argCopies} = f;

                        console.error(script.url+': l.'+script.getOffsetLine(offset) +' '+
                            frameNames + '('+ argCopies.map(toArgumentString).join(', ') + ')' );
                    });
                    console.groupEnd();

                    console.groupEnd();
                }
            }
        };
    })();


    dbg.onEnterFrame = function(frame){
        //console.log('Entering frame', frameName(frame));

        var env = frame.environment;
        var names = env.names();

        frame.onPop = uncaughtErrorFramePopHandler;
    };


};
