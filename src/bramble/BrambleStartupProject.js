define(function (require, exports, module) {
    "use strict";

    var _startupProjectPath;

    // Used to set and get the path to the startup project's index.html file.
    // This info comes to us via postMessage from the hosting app.
    exports.setPath = function(path) {
        _startupProjectPath = path;
    };

    exports.getPath = function(path) {
        return _startupProjectPath;
    };
});
