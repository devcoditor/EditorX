/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, document, Mustache*/

define(function (require, exports, module) {
    "use strict";

    var EditorManager  = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        lineWidgetHTML = require("text!inlineWidget.html"),
        errorMessages = require("strings"),
        currentErrorWidget,
        errorToggle,
        isShowingDescription,
        activeTextHighlights = {};

    ExtensionUtils.loadStyleSheet(module, "main.less");
    require("tooltipsy.source");


    // TODO - this is also in parser.js, so we should not duplicate it.
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


    //Publicly available function to remove all errors from brackets
    function cleanUp(line, type) {

        if(type == "keep-emoji") {
            removeButton("instant");
        } else {
            removeButton();
        }

        clearAllHighlights();
        // removeLineHighlight(line);
        hideDescription();
        isShowingDescription = false;
    }

    // Check if the erorr marker is already present
    function checkForMarker(){
        var marker = document.querySelector(".hint-marker-error") || false;
        if(marker) {
            return true;
        } else {
            return false;
        }
    }

    //Publicly available function used to display error markings
    function addInvalidCodeHighlight(highlight) {
        addTextHighlight(highlight.start, highlight.end, "red-text");
        addTextHighlight(highlight.end, 9999999999, "faint-text");  // TODO - should we check doc length instead?
    }

    //Publicly available function used to display error markings
    function scafoldHinter(errorStart, errorEnd, errorObj, markerAnimation, errorType, errorTitle) {
        // console.log("scafoldHinter", errorType, errorTitle);

        //Setup neccessary variables
        errorToggle = document.createElement("div");
        isShowingDescription = false;

        showButton(errorObj, markerAnimation);

        // addLineHighlight(errorObj);

        //Apply on click method to the errorToggle to display the inLineErrorWidget
        errorToggle.onclick = function() {
            if(!isShowingDescription) {
                showDescription(errorObj, errorType, errorTitle);
            }
            else {
                hideDescription();
            }
            isShowingDescription = !isShowingDescription;
        };
        return $(errorToggle);
    }

    //Returns the current editor we reside in
    function getActiveEditor() {
        return EditorManager.getActiveEditor();
    }

    //Returns the current instance of codeMirror
    function getCodeMirror() {
        return getActiveEditor()._codeMirror;
    }

    //Function that adds a button on the gutter (on given line nubmer) next to the line numbers
    function showButton(errorObject, animationType){
        getCodeMirror().addWidget(errorObject, errorToggle, false);
        $(errorToggle).attr("class", "hint-marker-positioning hint-marker-error").removeClass("hidden");

        // Sometimes we want this to pop in instead of appearing instantly,
        // This is where that happens.
        if(animationType == "animated") {
            $(errorToggle).attr("class", "hint-marker-positioning hint-marker-error").addClass("pop");
        }

        // Show tooltips message
        // TODO - this shows even when the error is open, so that's not great
        // $(".hint-marker-positioning").tooltipsy({
        //     content : "Click error icon for details",
        //     alignTo: "cursor", // Can also use on an element
        //     offset: [10, -10]
        // });
    }

    // Function that removes gutter button
    function removeButton(animationType){
        if(!errorToggle) {
            return;
        }

        var goodEmojis = ["biceps", "halo", "heart", "peace", "sunglasses", "wink", "horns", "thumbs"];
        var randomEmoji = goodEmojis[Math.floor(Math.random() * goodEmojis.length)];
        var CHANGE_EMOJI_TIMEOUT_MS = 400;
        var CLEAR_EMOJI_TIMEOUT_MS = 1300;

        if(animationType == "instant") {
            $(errorToggle).remove();
        } else {
            $(errorToggle).addClass("bye");

            // Add the class for a "positive" emoji
            setTimeout(function(el) {
                return function() {
                    el.classList.add(randomEmoji);
                };
            }(errorToggle), CHANGE_EMOJI_TIMEOUT_MS);

            // Remove the emoji
            setTimeout(function(el) {
                return function() {
                    el.remove();
                };
            }(errorToggle), CLEAR_EMOJI_TIMEOUT_MS);
        }


        // TODO - do we need this back?
        //Destroy tooltips instance
        // var tooltips = $(".hint-marker-positioning").data("tooltipsy");
        // if(tooltips) {
            // tooltips.destroy();
        // }

        isShowingDescription = false;
    }

    // Creates & shows the error description
    function showDescription(error, errorType, errorTitle) {
        errorToggle.classList.add("nerd");

        var description = document.createElement("div");
        description.className = "errorPanel";

        description.innerHTML = Mustache.render(lineWidgetHTML, {
            "error": error.message,
            "errorTitle": errorTitle
        });

        var highlightEls = description.querySelectorAll('[data-highlight]');

        for (var i = 0; i < highlightEls.length; ++i) {
            var highlightEl = highlightEls[i];
            highlightEl.addEventListener("mouseenter",function(){
                var coordAttr = this.getAttribute("data-highlight") || false;
                if(coordAttr) {
                    var coords = coordAttr.split(",");
                    addTextHighlight(coords[0], coords[1], "styled-background");
                }
            });

            highlightEl.addEventListener("mouseleave",function(){
                var coordAttr = this.getAttribute("data-highlight") || false;
                if(coordAttr) {
                    var coords = coordAttr.split(",");
                    removeTextHighlight(coords[0], coords[1], "styled-background");
                }
            });
        }

        var options = {coverGutter: false, noHScroll: false, above: false, showIfHidden: false};

        // https://codemirror.net/doc/manual.html#addLineWidget
        // console.log(getCodeMirror());
        currentErrorWidget = getCodeMirror().addLineWidget(error.line, description, options);
    }


    // Adds a text higlight to the code
    function addTextHighlight(start, end, className){
        var startHighlight = getCodeMirror().doc.posFromIndex(start);
        var endHighlight = getCodeMirror().doc.posFromIndex(end);
        var highlight = getCodeMirror().markText(startHighlight, endHighlight, { className: className, startStyle: "mark-start" });

        activeTextHighlights[start + "," + end + "," + className] = highlight;
    }

    // Remove ALL code highlights
    function clearAllHighlights() {
        for(var k in activeTextHighlights){
            activeTextHighlights[k].clear();
            delete activeTextHighlights[k];
        }
    }

    // Removes a text higlight to the code
    function removeTextHighlight(start, end, className){
        var highlight = activeTextHighlights[start + "," + end + "," + className] || false;
        if(highlight){
            highlight.clear();
            delete activeTextHighlights[start + "," + end + "," + className];
        }
    }

    //Destroys the description
    function hideDescription() {
        if(!currentErrorWidget) {
            return;
        }

        errorToggle.classList.remove("nerd");
        currentErrorWidget.clear();
        currentErrorWidget = null;
    }

    exports.checkForMarker = checkForMarker;
    exports.cleanUp = cleanUp;
    exports.scafoldHinter = scafoldHinter;
    exports.addInvalidCodeHighlight = addInvalidCodeHighlight;
});
