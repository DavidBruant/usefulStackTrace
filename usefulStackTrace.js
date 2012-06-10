"use strict";

var win = gBrowser.selectedBrowser.contentWindow;
var doc = win.document;
var console = win.console;
var P = Object.getPrototypeOf;

// LIBRARY

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

var getObjectId = (function(){
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

// ACTUAL CODE

var dbg = new Debugger(win);
dbg.uncaughtExceptionHook = function(e){
    console.error('uncaughtExceptionHook', e, e.stack);
};
//allKeys(dbg);


var scripts = dbg.findScripts();
//console.log(scripts);


/*Debugger.Frame.prototype.onPop = function(completionValue){
    var frame = this;
    
    console.log("this.arguments", this.arguments);
    
    return completionValue; // forward
}*/


function copyArguments(args){
    return Array.prototype.map.call(args, function(e){ return e;});
}


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
                    console.log('Here is a useful stack trace:')
                    
                    console.group();
                    scripts.forEach(function(script, i){
                        //allKeys(script);
                        console.log(script.url, ': l.'+script.getOffsetLine(offsets[i]), frameNames[i], '(',  
                        'arguments', JSON.stringify(argCopies[i]), ')' );
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
    //allKeys(frame);
    //frameEnvIds(frame);

    var env = frame.environment;
    //allKeys(env);
    
    var names = env.names();
    console.log('names', names);
    
    frame.onPop = thringsHandlers.onPop;
};



var bpHandler = {
    hit: function(frame){
    
    }
};

// Save init values of all variables in this frame
// onEnterFrame = function (frame) {
// if (frame.type === "call") {

/*
var bps = 0
console.time('bp');
scripts.forEach(function(s){
    // console.log(s.url);
    var lineOffsets = s.getAllOffsets();    

    lineOffsets.forEach(function(o, line){
        if(Array.isArray(o)){
            o.forEach(function(offset){
                s.setBreakpoint(offset, bpHandler);
                bps++;
            });
        }
    });
});
console.timeEnd('bp');
console.log('breakpoints', bps);
*/







