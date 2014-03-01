"use strict";

// LIBRARY

const {Cu} = require("chrome");
const { addDebuggerToGlobal } = Cu.import("resource://gre/modules/jsdebugger.jsm");

//Only used for webconsole tweak at bottom:
var {devtools} = Cu.import("resource://gre/modules/devtools/Loader.jsm", {});
var {WebConsoleFrame} = devtools["require"]("devtools/webconsole/webconsole");

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
        f.callee.name || '(anonymous)':
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
	// Why does this do too-much-recursion, Firefox 28?
    var object = this;
    var jsonableCopy = {};
    //allKeys(this);
    object.getOwnPropertyNames().forEach(function(prop){
		var desc = object.getOwnPropertyDescriptor(prop);//Missing a parameter?
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
        return JSON.stringify(v); // useless. The object is a Debugger.Object
    if(typeof v === 'string')
        return "'"+v+"'";

    return String(v);
}


function completionThrowValueToString(t){
    if(t instanceof Debugger.Object){
        if(t.class === 'Error')
            return t.getOwnPropertyDescriptor('message').value;

        return String(t);
    }
    else
        return String(t);
}


module.exports = function trackStack(global){

    var doc = global.document;
    var console = global.console;

    var dbg = new Debugger(global);
    dbg.uncaughtExceptionHook = function(e){
        console.error('uncaughtExceptionHook', e, e.stack);
    };

    // stack tracking data and methods //
    var frameData = [];
    var trackedError;

    function reinit(){
        frameData = [];
        trackedError = undefined;
    }

    function isCurrentlyTracking(){
        return frameData.length >= 1;
    }
    /// stack tracking data and methods //


    dbg.onEnterFrame = function(frame){
        if(isCurrentlyTracking()) // apparently, the tracked error was caught and a function was called after that
            reinit();

        frame.onPop = function uncaughtErrorFramePopHandler(completionValue){
            var frame = this;

            if('throw' in completionValue){
                var thrownValue = completionValue.throw;

                if(isCurrentlyTracking()){
                    if(!Object.is(trackedError, thrownValue)){
                        // a different error than the currently tracked is being thrown
                        reinit();
                        trackedError = thrownValue;
                    }
                }
                else{
                    trackedError = thrownValue;
                }

                frameData.push({
                    script : frame.script,
                    offset : frame.offset,
                    frameName : frameName(frame),
                    argCopies : copyArguments(frame.arguments)
                });

                // inline <script>s run after the HTML parser have frame.type === "global"
                if(frame.older === null || frame.older.type === 'global'){
                    console.group();
                    console.error('Uncaught error! Error message:', completionThrowValueToString(thrownValue) );

                    frameData.reverse().forEach(function(f){
                        const {offset, frameName, script, argCopies} = f;

                        console.error(script.url+': l.'+script.getOffsetLine(offset) +' '+
                            frameName + '('+ argCopies.map(toArgumentString).join(', ') + ')' );
                    });

                    console.groupEnd();
                    reinit()
                }
            }
            else{
                // different sort of completion value: the error was caught
                reinit();
            }
        };
    };


};

// Optional: lets user click and directly get to the file.
// Modify this function to make the link a link to the file, not here:
if (typeof WebConsoleFrame.prototype.originalCreateMsg === 'function') {
	//ok, already fixed
} else {
	WebConsoleFrame.prototype.originalCreateMsg = WebConsoleFrame.prototype.logConsoleAPIMessage;
	WebConsoleFrame.prototype.logConsoleAPIMessage = 
	function(aMessage) {
		if (aMessage.filename.startsWith("resource://") && aMessage.filename.endsWith('trackStack.js')) {
			//These must match the lines above or console.group, console.error('Uncaught error! Error message:'...
			if (aMessage.lineNumber == 175 || aMessage.lineNumber == 176) {
				aMessage.filename = '';
				aMessage.lineNumber = '';
			} else if (aMessage && aMessage.arguments.length) {
				//This file! Give it the actual content file's filename, lineNumber:
				let pieces = aMessage.arguments[0].split(': l.');
				if (pieces.length>1) {
					aMessage.filename = pieces[0];
					aMessage.lineNumber = 1*(pieces[1].split(' ')[0]);
				}
			}
		}
		let res = WebConsoleFrame.prototype.originalCreateMsg.call(this,aMessage);
		// ^ Call original with expected params.
		return res;
	}
}
