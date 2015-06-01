/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    // TODO: we shouldn't be loading this just to get Path, Buffer, etc.
    var Filer = require("thirdparty/filer/dist/filer.min");
    var Path = Filer.Path;
    var FilerBuffer = Filer.Buffer;
    var ChannelUtils = require("thirdparty/MessageChannel/ChannelUtils");
    var Handlers = require("filesystem/impls/filer/lib/handlers");
    var Content = require("filesystem/impls/filer/lib/content");
    var Async = require("utils/Async");
    var fnQueue = require("filesystem/impls/filer/lib/queue");
    var UUID = ChannelUtils.UUID;
    var allowArrayBufferTransfer;
    var port;

    // Remote filesystem callbacks
    var callbackQueue = {};

    function remoteFSCallbackHandler(e) {
        var data = e.data;
        var callbackItem = callbackQueue[data.callback];
        if(!callbackItem.persist) {
            delete callbackQueue[data.callback];
        }
        callbackItem.callback.apply(null, data.result);
    }

    function receiveMessagePort(e) {
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
            port.start();

            ChannelUtils.checkArrayBufferTransfer(port, function(err, isAllowed) {
                allowArrayBufferTransfer = isAllowed;
                port.addEventListener("message", remoteFSCallbackHandler, false);
                fnQueue.ready();
            });
        }
    }
    window.addEventListener("message", receiveMessagePort, false);

    // Request the that remote FS be setup
    window.parent.postMessage(JSON.stringify({type: "bramble:filer"}), "*");

    function proxyCall(fn, options, callback) {
        var id = UUID.generate();
        callbackQueue[id] = {
            callback: callback,
            persist: options.persist
        };

        fnQueue.exec(function() {
            var transferable;
            if (allowArrayBufferTransfer && options.transfer) {
                transferable = [options.transfer];
            }
            port.postMessage({method: fn, callback: id, args: options.args}, transferable);
        });
    }

    var proxyFS = {
        stat: function(path, callback) {
            proxyCall("stat", {args: [path]}, callback);
        },
        exists: function(path, callback) {
            proxyCall("exists", {args: [path]}, callback);
        },
        readdir: function(path, callback) {
            proxyCall("readdir", {args: [path]}, callback);
        },
        mkdir: function(path, callback) {
            proxyCall("mkdir", {args: [path]}, callback);
        },
        rmdir: function(path, callback) {
            proxyCall("rmdir", {args: [path]}, callback);
        },
        unlink: function(path, callback) {
            proxyCall("unlink", {args: [path]}, callback);
        },
        rename: function(path, callback) {
            proxyCall("rename", {args: [path]}, callback);
        },
        readFile: function(path, options, callback) {
            // Always do binary reads, and decode in callback if necessary
            proxyCall("readFile", {args: [path, {encoding: null}]}, function(err, data) {
                if(err) {
                    callback(err);
                    return;
                }

                data = new FilerBuffer(data);
                if(options === "utf8" || options.encoding === "utf8") {
                    data = data.toString("utf8");
                }

                callback(null, data);
            });
        },
        writeFile: function(path, data, encoding, callback) {
            // Always do binary write, and send ArrayBuffer over transport
            if (typeof(data) === "string") {
                data = new FilerBuffer(data, "utf8");
            }

            var buffer = data.buffer;
            var options = {
                args: [
                    path,
                    buffer,
                    {encoding: null}
                ],
                transfer: buffer
            };

            // We run the remote FS operation in parallel to rewriting and creating
            // a BLOB URL in Bramble, such that resources are ready when needed later.
            function runStep(fn) {
                var result = new $.Deferred();

                fn(function(err) {
                    if(err) {
                        result.reject(err);
                        return;
                    }
                    result.resolve();
                });

                return result.promise();
            }

            Async.doInParallel([
                function(callback) {
                    proxyCall("writeFile", options, callback);                    
                },
                function(callback) {
                    // Add a BLOB cache record for this filename
                    // only if it's not an HTML file
                    if(Content.isHTML(Path.extname(path))) {
                        callback();
                    }

                    Handlers.handleFile(path, data, function(err) {
                        if(err) {
                            callback(err);
                            return;
                        }
                        callback();
                    });
                }
            ], runStep, true);
        },
        watch: function(path, options, callback) {
            proxyCall("watch", {args: [path, options], persist: true}, callback);
        }
    };

    Filer.fs = function() {
        return proxyFS;
    };

    module.exports = Filer;
});
