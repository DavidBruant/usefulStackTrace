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
    
    
    
module.exports = function trackStack(global){

    var doc = global.document;
    var console = global.console;
    
    var dbg = new Debugger(global);
    dbg.uncaughtExceptionHook = function(e){
        console.error('uncaughtExceptionHook', e, e.stack);
    };
    
    var scripts = dbg.findScripts();
    
    var thringsHandlers = (function(){
        var scripts = [];
        var offsets = [];
        var frameNames = [];
        var argCopies = [];
        
        return {
            onPop: function(completionValue){
                var frame = this;
                console.log('Leaving frame', frameName(frame), 'with completion value', completionValue);
                
                if('throw' in completionValue){
                    console.log('frame with error thrown detected!');
                    scripts.push(frame.script);
                    offsets.push(frame.offset);
                    frameNames.push(frameName(frame));
                    
                    var argCopy = copyArguments(frame.arguments);
                    //console.log('argCopy', JSON.stringify(argCopy));
                    argCopies.push(argCopy);
                    
                    if(frame.older === null){
                        console.group();
                        console.log('Good grief! An Uncaught Error!');
                        console.log('Error message:', completionValue.throw.getOwnPropertyDescriptor('message').value);
                        console.log('Here is a useful stack trace:');
                        
                        console.group();
                        scripts.forEach(function(script, i){
                            //allKeys(script);
                            console.log(script.url+': l.'+script.getOffsetLine(offsets[i]) +' '+
                                frameNames[i]+ '('+ argCopies[i].map(toArgumentString).join(', ') + ')' );
                        })
                        console.groupEnd();
                        
                        console.log("You're very welcome! Have a nice day :-)");
                        console.groupEnd();
                    }   
                }
            }
        };
    })();
    
    
    dbg.onEnterFrame = function(frame){
        console.log('Entering frame', frameName(frame));
    
        var env = frame.environment;
        var names = env.names();
        
        frame.onPop = thringsHandlers.onPop;
    };
    

};
