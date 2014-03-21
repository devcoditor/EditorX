/*global define, SlowParse, brackets */

/**
 * Provides SlowParse error results via the core linting extension point
 */
define(function (require, exports, module) {
  "use strict";

  var SlowParse = require("slowparse");
  var Errors = require("errors");
  var CodeInspection = brackets.getModule("language/CodeInspection");

  function checkFile(text, fullPath) {
    // We don't have accurate line number info for errors, just stream pos.
    // Return line number and column for pos, or null if not found.
    function getLineInfoForPos(pos) {
      var lines = text.split(/\r?\n/);
      var current = 1;
      var prev = 0;

      for(var i = 0; i < lines.length; i++) {
        prev = current;
        current += lines[i].length;
        if(current >= pos) {
          return {
            line: i,
            ch: pos - prev + 1
          };
        }
      }
      return null;
    }

    var error;
    try {
      error = SlowParse.HTML(document, text).error;
    } catch(e) {
      console.log("SlowParse error: " + e);
      error = null;
    }

    if (!error) {
      return null;
    }
    // SlowParse dies on the first error, so we'll always give only 1
    return { errors: [ Errors.create(error, getLineInfoForPos) ] };
  }

  // Register for HTML files
  CodeInspection.register("html", {
    name: "HTML",
    scanFile: checkFile
  });

});
