/*global self */
/*jslint bitwise: true */
(function() {
    "use strict";

    var indexedDB = self.indexedDB       ||
                    self.mozIndexedDB    ||
                    self.webkitIndexedDB ||
                    self.msIndexedDB;
    var FILE_STORE_NAME = "files";
    var provider;

    function IndexedDBContext(db, mode) {
        var transaction = db.transaction(FILE_STORE_NAME, mode);
        this.objectStore = transaction.objectStore(FILE_STORE_NAME);
    }

    IndexedDBContext.prototype.clear = function(callback) {
        try {
            var request = this.objectStore.clear();
            request.onsuccess = function(event) {
                callback();
            };
            request.onerror = function(error) {
                callback(error);
            };
        } catch(e) {
            callback(e);
        }
    };

    function _get(objectStore, key, callback) {
        try {
            var request = objectStore.get(key);
            request.onsuccess = function onsuccess(event) {
                var result = event.target.result;
                callback(null, result);
            };
            request.onerror = function onerror(error) {
                callback(error);
            };
        } catch(e) {
            callback(e);
        }
    }
    IndexedDBContext.prototype.getObject = function(key, callback) {
        _get(this.objectStore, key, callback);
    };
    IndexedDBContext.prototype.getBuffer = function(key, callback) {
        _get(this.objectStore, key, callback);
    };

    function _put(objectStore, key, value, callback) {  
        try {
            var request = objectStore.put(value, key);
            request.onsuccess = function onsuccess(event) {
                var result = event.target.result;
                callback(null, result);
            };
            request.onerror = function onerror(error) {
                callback(error);
            };
        } catch(e) {
            callback(e);
        }
    }
    IndexedDBContext.prototype.putObject = function(key, value, callback) {
        _put(this.objectStore, key, value, callback);
    };
    IndexedDBContext.prototype.putBuffer = function(key, arrayBuffer, callback) {
        _put(this.objectStore, key, arrayBuffer, callback);
    };

    IndexedDBContext.prototype.delete = function(key, callback) {
        try {
            var request = this.objectStore.delete(key);
            request.onsuccess = function onsuccess(event) {
                var result = event.target.result;
                callback(null, result);
            };
            request.onerror = function(error) {
                callback(error);
            };
        } catch(e) {
            callback(e);
        }
    };


    function IndexedDB(name) {
        this.name = name;
        this.db = null;
    }
    IndexedDB.isSupported = function() {
        return !!indexedDB;
    };

    IndexedDB.prototype.open = function(callback) {
        var that = this;

        // Bail if we already have a db open
        if(that.db) {
            return callback();
        }

        // NOTE: we're not using versioned databases.
        var openRequest = indexedDB.open(that.name);

        // If the db doesn't exist, we'll create it
        openRequest.onupgradeneeded = function onupgradeneeded(event) {
            var db = event.target.result;

            if(db.objectStoreNames.contains(FILE_STORE_NAME)) {
                db.deleteObjectStore(FILE_STORE_NAME);
            }
            db.createObjectStore(FILE_STORE_NAME);
        };

        openRequest.onsuccess = function onsuccess(event) {
            that.db = event.target.result;
            callback();
        };
        openRequest.onerror = function onerror(error) {
            callback(new Error('IndexedDB cannot be accessed. If private browsing is enabled, disable it.'));
        };
    };
    IndexedDB.prototype.getReadOnlyContext = function() {
        // Due to timing issues in Chrome with readwrite vs. readonly indexeddb transactions
        // always use readwrite so we can make sure pending commits finish before callbacks.
        // See https://github.com/js-platform/filer/issues/128
        return new IndexedDBContext(this.db, "readwrite");
    };
    IndexedDB.prototype.getReadWriteContext = function() {
        return new IndexedDBContext(this.db, "readwrite");
    };


    function execRemoteCall(options) {
        var context = options.mode === "readonly" ?
            provider.getReadOnlyContext() : provider.getReadWriteContext();

        function callback(err, result) {
            self.postMessage({
                callback: options.callback,
                result: [err, result]
            });
        }

        var args = options.args.concat(callback);
        context[options.method].apply(context, args);
    }

    function onMessage(e) {
        var data = e.data;
        var type = data.type;

        if(type === "INIT") {
            provider = new IndexedDB(data.name);
            self.postMessage({supported: !!indexedDB});
        } else if (type === "OPEN") {
            provider.open(function(err) {
                self.postMessage({type: "OPEN_CALLBACK", err: err});
            });
        } else {
            execRemoteCall(data);
        }
    }

    self.addEventListener("message", onMessage, false);
}());
