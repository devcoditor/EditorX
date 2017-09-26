/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define*/

define(function(require) {
    "use strict";

    // Requires an `npm install` from root
    var slowparse = require("../../../thirdparty/slowparse/slowparse");
    var errorMessages = require("strings");

    // Taken from https://github.com/mozilla/slowparse
    function templatify(input, macros) {
        if(!macros) {
            return input.replace(new RegExp("\\[\\[[^\\]]+\\]\\]", "g"), "");
        }
        return input.replace(new RegExp("\\[\\[([^\\]]+)\\]\\]", "g"), function(a,b) {
            b = b.split(".");
            var rep = macros[b[0]];
            b = b.slice(1);
            while(b && b.length>0 && rep) {
                rep = rep[b.splice(0,1)[0]];
            }
            return rep!==null && rep!==undefined ? rep : "";
        });
    }

    function parse(input, type) {

        var result;

        if (type === "HTML") {
            result = slowparse.HTML(document, input);
        } else if (type === "CSS") {
            result = slowparse.CSS(input);
        } else {
            return;
        }

        var error;

        if(result.error) {
            error = {};
            error.message = templatify(errorMessages[result.error.type], result.error);
            error.cursor = result.error.cursor;
            error.type = result.error.type;
            if(result.error.token) {
                error.token = result.error.token;
            }
        }

        return error;
    }

    return parse;
});
