"use strict";

function run(){
    var a = 1;
    var o = {e:1, f:'a'};
    
    function f(s){
        throw new Error('yo');
    }
    
    function g(o){
        return f(6) + 2 + a;
    }

    o.g = g;
    return String(g({a:1, h:8}));
}