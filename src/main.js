/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

/**
 * The boostrapping module for brackets. This module sets up the require
 * configuration and loads the brackets module.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, define, window, brackets, navigator */


// Use ?refreshCache=1 to force the files to load from the server again.
var refreshCache = document.location.search.indexOf("refreshCache=1") > -1;
// Use ?deleteCache=1 to force the fs to delete cached files, load from server normally
var deleteCache = document.location.search.indexOf("deleteCache=1") > -1;

// XXXhumph: move this to sh.mkdirp()
function ensureDir(fs, dir, callback) {
    fs.exists(dir, function (exists) {
        if (exists) return callback(null);

        var parent = Filer.Path.dirname(dir);

        ensureDir(fs, parent, function (err) {
            if (err) return callback(err);
            fs.mkdir(dir, function (err) {
                if (err && err.code != 'EEXIST') return callback(err);
                callback(null);
            });
        });
    });
}

// XXXhumph: require.js + filer.js = requiler
// Custom require loader for filer caching
function requiler(req, moduleName, url) {
    var fs = requiler.fs;
    var Path = Filer.Path;
    var path = Path.join('/brackets', url);

    function onLoad(script) {
        try {
            eval(script);
            req.completeLoad(moduleName);
        } catch(e) {
            console.log('Script exec err for `' + moduleName + '`, skipping:', e.message);
        }
    }

    function download() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function (evt) {
            if (xhr.readyState === 4) {
                fs.writeFile(path, xhr.responseText, function(err) {
                    if(err) throw err;
                    onLoad(xhr.responseText);
                });
            }
        };
        xhr.send(null);
    }

    function load(fs) {
        // 1. Make sure sub-dirs along the path exist first
        var dir = Path.dirname(path);
        ensureDir(fs, dir, function(err) {
            if(err) throw err;

            // 2. If ?refreshCache=1, redownload the source to fs
            if(refreshCache) {
                download();
                return;
            }

            // 3. Try and read the file from the filesystem first (cached)
            fs.readFile(path, 'utf8', function(err, contents) {
                if(err) {
                    // 3.1. If it's not in the fs, get it and save to fs (cache)
                    download();
                } else {
                    // 3.2. If it's in the fs, use that
                    onLoad(contents);
                }
            });
        });
    }

    if(!fs) {
        var flags = refreshCache ? ['FORMAT'] : null;
        fs = new Filer.FileSystem({
              flags: flags,
              provider: new Filer.FileSystem.providers.Fallback()
          },
          function(err, fs_) {
              // Make sure we have a /brackets dir
              fs = requiler.fs = fs_;
              fs.mkdir('/brackets', function(err) {
                  if(err && err.code !== 'EEXIST') throw err;
                  load(fs);
              });
          }
        );
    } else {
      load(fs);
    }
}

require.config({
    paths: {
        "text"              : "thirdparty/text/text",
        "i18n"              : "thirdparty/i18n/i18n",

        // The file system implementation. Change this value to use different
        // implementations (e.g. cloud-based storage).
        "fileSystemImpl"    : "filesystem/impls/browser/BrowserFileSystem"
    },
    // Replace the usual load for requiler (requires patched require.js for load swap)
    load: deleteCache ? null : requiler
});

// hack for r.js optimization, move locale to another config call

// Use custom brackets property until CEF sets the correct navigator.language
// NOTE: When we change to navigator.language here, we also should change to
// navigator.language in ExtensionLoader (when making require contexts for each
// extension).
require.config({
    locale: window.localStorage.getItem("locale") || (typeof (brackets) !== "undefined" ? brackets.app.language : navigator.language)
});

define(function(require) {
  require(['utils/Compatibility'], function () {
    "use strict";

    // Allow dumping the fs if requested before loading brackets.
    if(deleteCache) {
      var fs = new Filer.FileSystem({
        provider: new Filer.FileSystem.providers.Fallback()
      }, function(err, fs_) {
        var sh = fs_.Shell();
        sh.rm('/brackets', {recursive: true}, function() {
          require(["brackets"]);
        });
      });
    } else {
      require(["brackets"]);
    }
  });
});
