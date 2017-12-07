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

        var result, error;

        if (type === "HTML") {
            result = slowparse.HTML(document, input);
        } else if (type === "CSS") {
            result = slowparse.CSS(input);
        } else {
            return;
        }

        console.log("parser.js received...");
        console.log(result.error);

        if(result.error) {

            // We are testing these one by one, and only showing approved rules
            var allowedRules = [
                "ORPHAN_CLOSE_TAG",
                "MISMATCHED_CLOSE_TAG",
                "UNEXPECTED_CLOSE_TAG",
                "MISSING_CLOSING_TAG_NAME",
                "INVALID_TAG_NAME",
                "UNTERMINATED_OPEN_TAG",
                "UNTERMINATED_CLOSE_TAG",
                "CLOSE_TAG_FOR_VOID_ELEMENT",
                "SELF_CLOSING_NON_VOID_ELEMENT",
                "UNQUOTED_ATTR_VALUE"
            ];

            if(allowedRules.indexOf(result.error.type) < 0){
                return;
            }

            error = {};
            error.message = templatify(errorMessages[result.error.type], result.error);
            error.cursor = result.error.cursor;
            error.type = result.error.type;
            error.title = templatify(errorMessages[result.error.type + "_TITLE"], result.error);

            if(result.error.token) {
                error.token = result.error.token;
            }
            if(result.error.highlight) {
                error.highlight = result.error.highlight;
            }
        }

        return error;
    }

    return parse;
});
