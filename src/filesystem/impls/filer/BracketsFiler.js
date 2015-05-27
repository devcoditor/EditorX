/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    // Temporary MessageChannel shim for Firefox, see:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=952139
    if(!("MessageChannel" in window)) {
        require("thirdparty/MessageChannel/dist/message_channel");
    }

    // If you need to debug Filer for some reason, drop the .min below
    // TODO: we shouldn't be loading this just to get Path, Buffer, etc.
    var Filer = require("thirdparty/filer/dist/filer.min");
    var port;

    var callbackQueue = {};
    var callbackID = 1;

    function remoteFSHandler(e) {
        var data = e.data;
        var callbackItem = callbackQueue[data.callback];
        if(!callbackItem.persist) {
            delete callbackQueue[data.callback];
        }
        callbackItem.callback.apply(null, data.result);
    }

    function receiveMessagePort(e) {
        console.log('receiveMessagePort', e);
        var data = e.data;
        try {
            data = JSON.parse(data);
            data = data || {};
        } catch(err) {
            data = {};
        }

        if (data.type === "bramble:filer") {
            window.removeEventListener("message", receiveMessagePort, false);
            port = e.ports[0];
            port.onmessage = remoteFSHandler;
            runQueued();
        }
    }
    window.addEventListener("message", receiveMessagePort, false);

    // Request the that remote FS be setup 
    window.parent.postMessage(JSON.stringify({type: "bramble:filer"}), "*");

    var queue = [];
    function queueOrRun(operation) {
        if(port) {
            operation.call(null);
        } else {
            queue.push(operation);
        }
    }

    function runQueued() {
        console.log('runQueued');
        queue.forEach(function(operation) {
            operation.call(null);
        })
        queue = null;
    }

    function proxyCall(fn, args, callback, persist) {
        var id = callbackID++;
        callbackQueue[id] = {
            callback: callback,
            persist: !!persist
        };

        console.log("proxyCall", fn, id, args);
        queueOrRun(function() {
            debugger;
            port.postMessage({method: fn, callback: id, args: args});    
        })
    }

    var proxyFS = {
        stat: function(path, callback) {
            proxyCall("stat", [path], callback);
        },
        exists: function(path, callback) {
            proxyCall("exists", [path], callback);
        },
        readdir: function(path, callback) {
            proxyCall("readdir", [path], callback);
        },
        mkdir: function(path, callback) {
            proxyCall("mkdir", [path], callback);
        },
        rename: function(path, callback) {
            proxyCall("rename", [path], callback);
        },
        readFile: function(path, options, callback) {
            proxyCall("readFile", [path, options], callback);
        },
        writeFile: function(path, data, encoding, callback) {
            proxyCall("writeFile", [path, data, encoding], callback);
        },
        watch: function(path, options, callback) {
            proxyCall("watch", [path, options], callback, true);
        }
    };

    Filer.fs = function() {
        return proxyFS;
    };

    module.exports = Filer;
});
