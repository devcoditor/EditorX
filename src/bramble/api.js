/*
 * Copyright (c) 2015 Bramble Contributors. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*global define, HTMLElement, MessageChannel, addEventListener, removeEventListener */

define([
    // Change this to filer vs. filer.min if you need to debug Filer
    "thirdparty/filer/dist/filer.min",
    "bramble/ChannelUtils",
    "bramble/thirdparty/EventEmitter/EventEmitter.min",
    "bramble/thirdparty/MessageChannel/message_channel"
], function(Filer, ChannelUtils, EventEmitter) {
    "use strict";    

    // PROD URL for Bramble, which can be changed below
    var PROD_BRAMBLE_URL = "https://mozillathimblelivepreview.net/bramble/dist/index.html";

    var FilerBuffer = Filer.Buffer;
    var UUID = ChannelUtils.UUID;

    // Logging function, replaced in Bramble.load() if options.debug is true
    var debug = function(){};

    function parseEventData(data) {
        debug("parseEventData", data);
        try {
            data = JSON.parse(data);
            return data || {};
        } catch(err) {
            debug("parseEventData error", err);
            return {};
        }
    }

    /**
     * The Filer FileSystem for Bramble is created early, and exposed statically
     * on Bramble below.
     */
    var _fs = new Filer.FileSystem();

    /**
     * The `div` is the element, or id of an element to use when creating
     * the Bramble iframe. All existing contents of this element will be removed:
     *
     * var bramble = new Bramble(someDiv);        // expects someDiv to be an existing element
     * var bramble = new Bramble('#some-div-id'); // selector for element
     * var bramble = new Bramble();               // will use document.body
     * 
     * You can pass various options as well:
     *
     * var bramble = new Bramble({...}); // uses document.body with given options
     * var bramble = new Bramble(elem, {...});
     *
     * Options available include:
     *   url: <String> a URL to use when loading the Bramble iframe (defaults to prod)
     *   locale: <String> the locale Brackets should use
     *   extensions: {
     *       enable: <Array(String)> a list of extensions to enable
     *       disable: <Array(String)> a list of extensions to disable
     *   }
     *   hideUntilReady: <Boolean> whether to hide Bramble until it's fully loaded.
     *   ready: <Function> a function to be called when Bramble is fully loaded.
     */
    function Bramble(div, options) {
        var self = this;

        // The id used for the iframe element
        var _id = "bramble-" + UUID.generate();

        // The iframe that will host Bramble
        var _iframe;

        // Long-running callbacks for fs watch events
        var _watches = {};

        // The channel port for communication with this instance
        var _port;

        // The iframe's window, for postMessage
        var _brambleWindow;

        // Whether to transfer ownership of ArrayBuffers or not
        var _allowArrayBufferTransfer;

        // Various bits of private state we want to track, updated via events
        var _currentFullPath;
        var _currentFilename;
        var _sidebarVisible;
        var _sidebarWidth;
        var _firstPaneWidth;
        var _secondPaneWidth;
        var _currentPreviewMode;

        var _readyState;
        function setReadyState(newState) {
            debug("setReadyState", _readyState, newState);
            _readyState = newState;
        }
        self.getReadyState = function() { return _readyState; };
        setReadyState(Bramble.NOT_LOADED);

        // Public getters for state. Most of these aren't useful until bramble.ready()
        self.getID = function() { return _id; };
        self.getIFrame = function() { return _iframe; };
        self.getFullPath = function() { return _currentFullPath; };
        self.getFilename = function() { return _currentFilename; };
        self.getPreviewMode = function() { return _currentPreviewMode; };
        self.getSidebarVisible = function() { return _sidebarVisible; };
        self.getLayout = function() {
            return {
                sidebarWidth: _sidebarWidth,
                firstPaneWidth: _firstPaneWidth,
                secondPaneWidth: _secondPaneWidth
            };
        };

        if (typeof div === "object"  && !(div instanceof HTMLElement)) {
            options = div;
            div = null;
        }
        options = options || {};

        function startEvents(win) {
            addEventListener("message", function(e) {
                var data = parseEventData(e.data);

                // When Bramble is ready for the filesystem to be mounted, it will let us know
                if (data.type === "bramble:readyToMount") {
                    debug("bramble:readyToMount");
                    setReadyState(Bramble.MOUNTABLE);

                    // See if we have a cached mount function that we can run
                    if (typeof self._mount === "function") {
                        self._mount();
                        delete self._mount;
                    }
                }
                // Listen for requests to setup the fs
                else if (data.type === "bramble:filer") {
                    debug("bramble:filer");
                    setupChannel(win);
                }
                // Listen for Bramble to become ready/fully-loaded
                else if (data.type === "bramble:loaded") {
                    debug("bramble:loaded");
                    if (options.hideUntilReady) {
                        _iframe.style.visibility = "visible";
                    }
                    if (typeof options.ready === "function") {
                        setReadyState(Bramble.READY);
                        options.ready();
                    }

                    // Set intial state
                    _currentFullPath = data.fullPath;
                    _currentFilename = data.filename;
                    _sidebarVisible = data.sidebarVisible;
                    _sidebarWidth = data.sidebarWidth;
                    _firstPaneWidth = data.firstPaneWidth;
                    _secondPaneWidth = data.secondPaneWidth;
                    _currentPreviewMode = data.previewMode;
                }
                // Anything else is some kind of event we need to re-trigger
                // and alter internal state.
                else {
                    // Strip the "bramble:*" namespace off event name
                    var eventName = data.type.replace(/^bramble:/, '');
                    delete data.type;

                    // Update internal state before firing event
                    if (eventName === "layout") {
                        _sidebarWidth = data.sidebarWidth;
                        _firstPaneWidth = data.firstPaneWidth;
                        _secondPaneWidth = data.secondPaneWidth;
                    } else if (eventName === "activeEditorChange") {
                        _currentFullPath = data.fullPath;
                        _currentFilename = data.filename;
                    } else if (eventName === "previewModeChange") {
                        _currentPreviewMode = data.mode;
                    } else if (eventName === "sidebarChange") {
                        _sidebarVisible = data.visible;
                    }

                    debug("triggering remote event", eventName, data);
                    self.trigger(eventName, [data]);
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

            div.innerHTML = "<iframe id='" + _id +
                            "' frameborder='0' width='100%' height='100%'></iframe>";
            
            _iframe = document.getElementById(_id);            
            if (options.hideUntilReady) {
                _iframe.style.visibility = "hidden";
            }

            _brambleWindow = _iframe.contentWindow;
            startEvents(_brambleWindow);

            var search = "";
            if (options.extensions) {
                // Override the extension list with what's in options
                var enable = options.extensions.enable;
                if (enable && enable.length) {
                    search += "?enableExtensions=" + enable.join(",");
                }

                var disable = options.extensions.disable;
                if (disable && disable.length) {
                    search += search.length ? "&" : "?";
                    search += "disableExtensions=" + disable.join(",");
                }
            } else {
                // If the user requests it, copy the search string from the hosting window
                if (options.useLocationSearch) {
                    search = window.location.search;
                }
            }

            if (options.locale) {
                search += search.length ? "&" : "?";
                search += options.locale;
            }

            setReadyState(Bramble.LOADING);

            // Allow custom URL to Bramble's index.html, default to prod
            var iframeUrl = (options.url ? options.url : PROD_BRAMBLE_URL) + search;
            debug("setting iframe src", iframeUrl);
            _iframe.src = iframeUrl;
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function waitForDOM() {
                document.removeEventListener("DOMContentLoaded", waitForDOM, false);
                createIFrame();
            }, false);
        } else {
            createIFrame();
        }

        self.mount = function(path, callback) {
            function _mount() {
                setReadyState(Bramble.MOUNTING);

                // Make sure the path we were given exists in the filesystem, and is a dir
                _fs.stat(path, function(err, stats) {
                    if (err) {
                        debug("mount stat error", err);
                        setReadyState(Bramble.ERROR);
                        if (err.code === "ENOENT") {
                            callback(new Error("mount path does not exist: " + path));
                        } else {
                            callback(err);
                        }
                        return;
                    }

                    if (!stats.isDirectory()) {
                        setReadyState(Bramble.ERROR);
                        callback(new Error("mount path is not a directory: " + path));
                    } else {
                        // Tell Bramble the path to mount, and wait for a response
                        addEventListener("message", function mountedMessage(e) {
                            var data = parseEventData(e.data);
                            if (data.type !== "bramble:mounted") {
                                return;
                            }

                            removeEventListener("message", mountedMessage, false);
                            debug("bramble:mounted");
                            setReadyState(Bramble.MOUNTED);
                            callback(null, _instance);
                        }, false);

                        var mountMessage = {
                            type: "bramble:mountPath",
                            path: path
                        };
                        _brambleWindow.postMessage(JSON.stringify(mountMessage), _iframe.src);
                    }
                });
            }

            var readyState = self.getReadyState();
            if (readyState > Bramble.MOUNTABLE) {
                setReadyState(Bramble.ERROR);
                callback(new Error("Bramble.mount() while already mounted, or attempting to mount."));
                return;
            } else if (readyState < Bramble.MOUNTABLE) {
                // We can't mount yet, cache the function to be called when we are ready
                _instance._mount = _mount;
            } else {
                // MOUNTABLE, mount right now
                _mount();
            }
        };

        function setupChannel(win) {
            var channel = new MessageChannel();
            ChannelUtils.postMessage(win,
                                     [JSON.stringify({type: "bramble:filer"}),
                                     "*",
                                     [channel.port2]]);
            _port = channel.port1;
            _port.start();

            ChannelUtils.checkArrayBufferTransfer(_port, function(err, isAllowed) {
                debug("checkArrayBufferTransfer", isAllowed);
                _allowArrayBufferTransfer = isAllowed;
                _port.addEventListener("message", remoteFSCallbackHandler, false);
            });
        }

        function getCallbackFn(id) {
            // If we have a long-running callback (fs.watch()) use that,
            // otherwise generate a new one.
            if(_watches[id]) {
                return _watches[id];
            }

            return function callback(err, result) {
                var transferable;

                // If the second arg is a Filer Buffer (i.e., wrapped Uint8Array),
                // get a reference to the underlying ArrayBuffer for transport.
                if (FilerBuffer.isBuffer(result)) {
                    result = result.buffer;

                    // If the browser allows transfer of ArrayBuffer objects over
                    // postMessage, add a reference to the transferables list.
                    if (_allowArrayBufferTransfer) {
                        transferable = [result];
                    }
                }

                _port.postMessage({callback: id, result: [err, result]}, transferable);
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
                _fs.writeFile.apply(_fs, args.concat(callback));
                break;
            case "readFile":
                _fs.readFile.apply(_fs, args.concat(function(err, data) {
                    // Convert the FilerBuffer to an ArrayBuffer for transport
                    callback(err, data ? data.buffer : null);
                }));
                break;
            case "watch":
                // Persist watch callback until we get an unwatch();
                _watches[callbackId] = callback;
                _fs.watch.apply(_fs, data.args.concat(callback));
                break;
            default:
                _fs[data.method].apply(_fs, data.args.concat(callback));
            }
        }

        self._executeRemoteCommand = function(options) {
            if (!_brambleWindow) {
                console.error("[Bramble Error] No active instance, unable to execute command");
                return;
            }

            options.type = "bramble:remoteCommand";
            debug("executeRemoteCommand", options);
            _brambleWindow.postMessage(JSON.stringify(options), _iframe.src);
        };
    }

    Bramble.prototype = new EventEmitter();
    Bramble.prototype.constructor = Bramble;

    Bramble.prototype.undo = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "EDIT_UNDO"});
    };

    Bramble.prototype.redo = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "EDIT_REDO"});
    };

    Bramble.prototype.increaseFontSize = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "VIEW_INCREASE_FONT_SIZE"});
    };

    Bramble.prototype.decreaseFontSize = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "VIEW_DECREASE_FONT_SIZE"});
    };

    Bramble.prototype.restoreFontSize = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "VIEW_RESTORE_FONT_SIZE"});
    };

    Bramble.prototype.save = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "FILE_SAVE"});
    };

    Bramble.prototype.saveAll = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "FILE_SAVE_ALL"});
    };

    Bramble.prototype.useHorizontalSplitView = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_SPLITVIEW_HORIZONTAL"});
    };

    Bramble.prototype.useVerticalSplitView = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_SPLITVIEW_VERTICAL"});
    };

    Bramble.prototype.find = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_FIND"});
    };

    Bramble.prototype.findInFiles = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_FIND_IN_FILES"});
    };

    Bramble.prototype.replace = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_REPLACE"});
    };

    Bramble.prototype.replaceInFiles = function() {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_REPLACE_IN_FILES"});
    };

    Bramble.prototype.useLightTheme = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_LIGHT_THEME"});
    };

    Bramble.prototype.useDarkTheme = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_DARK_THEME"});
    };

    Bramble.prototype.showSidebar = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_SHOW_SIDEBAR"});
    };

    Bramble.prototype.hideSidebar = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_HIDE_SIDEBAR"});
    };

    Bramble.prototype.showStatusbar = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_SHOW_STATUSBAR"});
    };

    Bramble.prototype.hideStatusbar = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_HIDE_STATUSBAR"});
    };

    Bramble.prototype.refreshPreview = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_RELOAD"});        
    };

    Bramble.prototype.useMobilePreview = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_MOBILE_PREVIEW"});
    };

    Bramble.prototype.useDesktopPreview = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_DESKTOP_PREVIEW"});
    };

    Bramble.prototype.enableJavaScript = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_ENABLE_SCRIPTS"});
    };

    Bramble.prototype.disableJavaScript = function() {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_DISABLE_SCRIPTS"});
    };

    // Bramble instance ready states
    Bramble.ERROR      = -1;// Bramble is in an error state
    Bramble.NOT_LOADED = 0; // Bramble.load() has not been called
    Bramble.LOADING    = 1; // Bramble.load() has been called, loading resources
    Bramble.MOUNTABLE  = 2; // Bramble.mount() can be executed, loading is done
    Bramble.MOUNTING   = 3; // Bramble.mount() has been called, mounting
    Bramble.READY      = 4; // Bramble.mount() has finished, Bramble is fully ready

    // We only support having a single instance in the page.
    var _instance;

    // Require version
    return {
        // Expose Filer for Path, Buffer, providers, etc.
        Filer: Filer,
        getFileSystem: function() {
            return _fs;
        },
        load: function(div, options) {
            if (_instance) {
                throw new Error("Bramble.load() called more than once.");
            }

            // Turn on logging if in debug mode
            if (options.debug) {
                debug = console.log.bind(console);
            }

            _instance = new Bramble(div, options);
        },
        mount: function(path, callback) {
            if (!_instance) {
                callback(new Error("Bramble.mount() called before Bramble.load()."));
                return;
            }

            _instance.mount(path, callback);
        }
    };
});
