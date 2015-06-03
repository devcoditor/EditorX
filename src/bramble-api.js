/*global require, define, test, expect, strictEqual, location */

define([
    // Change this to filer vs. filer.min if you need to debug Filer
    "thirdparty/filer/dist/filer.min",
    "thirdparty/MessageChannel/ChannelUtils",
    "thirdparty/MessageChannel/message_channel"
], function(Filer, ChannelUtils) {
    "use strict";    

    var FilerBuffer = Filer.Buffer;
    var UUID = ChannelUtils.UUID;

    function parseEventData(data) {
        try {
            data = JSON.parse(data);
            return data || {};
        } catch(err) {
            return {};
        }
    }

    /**
     * The `div` is the element, or id of an element to use when creating
     * the Bramble iframe. All existing contents of this element will be removed:
     *
     * var bramble = new Bramble(someDiv); // expects someDiv to be an existing element
     * var bramble = new Bramble('#some-div-id'); // selector for element
     * var bramble = new Bramble(); // will use document.body
     * 
     * You can pass various options as well:
     *
     * var bramble = new Bramble({...}); // uses document.body with given options
     * var bramble = new Bramble(elem, {...});
     *
     * You can enable or disable extensions using `options.extensions`:
     *
     * var bramble = new Bramble('#someDiv', {
     *   extensions: {
     *     enable: ['CodeFolding', 'WebPlatformDocs'], // Enable CodeFolding and WebPlatformDocs
     *     disable: ['QuickView'] // Disable QuickView
     *   }
     * }); 
     *
     * You can pass in a custom provider to use for Filer with `options.provider`,
     * and the Memory provider will be used by default:
     *
     * var bramble = new Bramble({provider: new Filer.FileSystem.providers.Memory()});
     */
    function Bramble(div, options) {
        var self = this;

        // Long-running callbacks for fs watch events
        var watches = {};

        // The channel port for communication with this instance
        var port;

        // Whether to transfer ownership of ArrayBuffers or not
        var allowArrayBufferTransfer;

        if (typeof div === "object"  && !(div instanceof HTMLElement)) {
            options = div;
            div = null;
        }
        options = options || {};

        self.id = "bramble-" + UUID.generate();

        var provider = options.provider || new Filer.FileSystem.providers.Memory();
        var fs = self.fs = new Filer.FileSystem(provider);

        function startEvents(win) {
            window.addEventListener("message", function(e) {
                var data = parseEventData(e.data);

                // When Bramble asks for initial content, reply but don't bother providing any
                if (data.type === "bramble:init") {
                    win.postMessage(JSON.stringify({type: "bramble:init", source: null}), "*");
                }
                // Listen for requests to setup the fs
                else if (data.type === "bramble:filer") {
                    setupChannel(win);
                }
                // Listen for Bramble to become ready/fully-loaded
                else if (data.type === "bramble:loaded") {
                    if (options.hideUntilReady) {
                        self.iframe.style.visibility = "visible";
                    }
                    if (typeof options.ready === "function") {
                        options.ready();
                    }
                }
            });
        }

        function createIFrame() {
            if (typeof div === "string") {
                div = document.querySelector(div);
            }

            if (!div) {
                div = document.body;
            }

            div.innerHTML = "<iframe id='" + self.id + "' frameborder='0' width='100%' height='100%'></iframe>";
            
            var iframe = self.iframe = document.getElementById(self.id);
            if (options.hideUntilReady) {
                iframe.style.visibility = "hidden";
            }

            var brambleWindow = iframe.contentWindow;

            startEvents(brambleWindow);

            var search;
            if (options.extensions) {
                // Override the extension list with what's in options
                var search = "";

                var enable = options.extensions.enable;
                if (enable && enable.length) {
                    search = "?";
                    search += "enableExtensions=" + enable.join(",");
                }

                var disable = options.extensions.disable;
                if (disable && disable.length) {
                    search += search.length ? "&" : "?";
                    search += "disableExtensions=" + disable.join(",");
                }
            } else {
                // Default to passing whatever is on the hosting window's search string
                search = window.location.search;
            }

            iframe.src = "index.html" + search;
        }

        if (document.readyState === "complete") {
            createIFrame();
        } else {
            document.addEventListener("DOMContentLoaded", function waitForDOM() {
                document.removeEventListener("DOMContentLoaded", waitForDOM, false);
                createIFrame();
            }, false);
        }

        function setupChannel(win) {
            var channel = new MessageChannel();
            ChannelUtils.postMessage(win,
                                     [JSON.stringify({type: "bramble:filer"}),
                                     "*",
                                     [channel.port2]]);
            port = channel.port1;
            port.start();

            ChannelUtils.checkArrayBufferTransfer(port, function(err, isAllowed) {
                allowArrayBufferTransfer = isAllowed;
                port.addEventListener("message", remoteFSCallbackHandler, false);                
            });
        }

        function getCallbackFn(id) {
            // If we have a long-running callback (fs.watch()) use that,
            // otherwise generate a new one.
            if(watches[id]) {
                return watches[id];
            }

            return function callback(err, result) {
                var transferable;

                // If the second arg is a Filer Buffer (i.e., wrapped Uint8Array),
                // get a reference to the underlying ArrayBuffer for transport.
                if (FilerBuffer.isBuffer(result)) {
                    result = result.buffer;

                    // If the browser allows transfer of ArrayBuffer objects over
                    // postMessage, add a reference to the transferables list.
                    if (allowArrayBufferTransfer) {
                        transferable = [result];
                    }
                }

                port.postMessage({callback: id, result: [err, result]}, transferable);
            };
        }

        function remoteFSCallbackHandler(e) {
            var data = e.data;
            var method = data.method;
            var callbackId = data.callback;
            var callback = getCallbackFn(callbackId);
            var args = data.args;

            // Most fs methods can just get run normally, but we have to deal with
            // ArrayBuffer vs. Filer.Buffer for readFile and writeFile, and persist
            // watch callbacks.
            switch(method) {
            case "writeFile":
                // Convert the passed ArrayBuffer back to a FilerBuffer
                args[1] = new FilerBuffer(args[1]);
                fs.writeFile.apply(fs, args.concat(callback));
                break;
            case "readFile":
                fs.readFile.apply(fs, args.concat(function(err, data) {
                    // Convert the FilerBuffer to an ArrayBuffer for transport
                    callback(err, data ? data.buffer : null);
                }));
                break;
            case "watch":
                // Persist watch callback until we get an unwatch();
                watches[callbackId] = callback;
                fs.watch.apply(fs, data.args.concat(callback));
                break;
            default:
                fs[data.method].apply(fs, data.args.concat(callback));
            }
        }
    }

    // We only support having a single instance in the page.
    var _instance;

    return {
        createInstance: function(div, options) {
            if (!_instance) {
                _instance = new Bramble(div, options);
            }
            return _instance;
        }
    };
});
