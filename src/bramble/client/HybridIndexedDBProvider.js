/*global define, Worker */
/*jslint bitwise: true */

define([
    "thirdparty/filer/dist/filer.min",
    "bramble/client/RemoteIndexedDB"
], function(Filer, RemoteIndexedDB) {
    "use strict";

    var NonWorkerIndexedDB = Filer.FileSystem.providers.IndexedDB;
    var FILE_SYSTEM_NAME = "local";
    var indexedDB = window.indexedDB       ||
                    window.mozIndexedDB    ||
                    window.webkitIndexedDB ||
                    window.msIndexedDB;

    /**
     * Prefer to do run IndexedDB on a worker thread, but fall back to main thread.
     */
    function HybridIndexedDB(name) {
        this.name = name || FILE_SYSTEM_NAME;
        this._impl = null;
    }
    HybridIndexedDB.isSupported = function() {
        // We'll either support it in the main thread or a worker
        return !!indexedDB;
    };

    HybridIndexedDB.prototype.open = function(callback) {
        var that = this;
        var dbWorker = new Worker("/src/bramble/client/IndexedDBWorker.js");

        function pickImplementation(e) {
            dbWorker.removeEventListener("message", pickImplementation, false);
            var workerSupportsIndexedDB = e.data.supported;

            if(workerSupportsIndexedDB) {
                that._impl = new RemoteIndexedDB(that.name, dbWorker);
            } else {
                that._impl = new NonWorkerIndexedDB(that.name);
                dbWorker.terminate();
                dbWorker = null;
            }

            that._impl.open(callback);
        }
        dbWorker.addEventListener("message", pickImplementation, false);
        dbWorker.postMessage({type: "INIT", name: that.name});
    };

    HybridIndexedDB.prototype.getReadOnlyContext = function() {
        return this._impl.getReadOnlyContext();
    };
    HybridIndexedDB.prototype.getReadWriteContext = function() {
        return this._impl.getReadWriteContext();
    };

    return HybridIndexedDB;
});
