/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, document, Mustache*/

define(function (require, exports, module) {
    "use strict";

    var EditorManager  = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        lineWidgetHTML = require("text!inlineWidget.html"),
        currentErrorWidget,
        errorToggle,
        isShowingDescription,
        highlights = [];

    ExtensionUtils.loadStyleSheet(module, "main.less");
    require("tooltipsy.source");

    //Publicly available function to remove all errors from brackets
    function cleanUp(line) {
        removeInvalidCodeHighlight();
        removeButton();
        removeLineHighlight(line);
        hideDescription();
        isShowingDescription = false;
    }

    //Publicly available function used to display error markings
    function addInvalidCodeHighlight(token) {
        var start = token.interval.start;
        var end = token.interval.end;

        addTextHighlight(start, end, "red-text");

        highlights.push({
            start: start,
            end: end
        });

        addTextHighlight(end, 9999999999, "faint-text");

        highlights.push({
            start: end,
            end: 9999999999
        });
    }

    function removeInvalidCodeHighlight() {
        // Remove all of the code we highlighted
        for(var i = 0; i < highlights.length; i++) {
            var highlight = highlights[i];
            removeTextHighlight(highlight.start, highlight.end);
        }
        highlights = [];
    }

    //Publicly available function used to display error markings
    function scafoldHinter(errorStart, errorEnd, errorObj) {
        // console.log(errorStart, errorEnd, errorObj);
        //Setup neccessary variables
        errorToggle = document.createElement("div");
        isShowingDescription = false;

        showButton(errorObj);
        addLineHighlight(errorObj);

        //Apply on click method to the errorToggle to display the inLineErrorWidget
        errorToggle.onclick = function() {
            if(!isShowingDescription) {
                showDescription(errorObj);
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

    //Highlights the line in which the error is present
    function addLineHighlight(errorObject) {
        if(!errorObject.line) {
            return;
        }
        getCodeMirror().getDoc().addLineClass(errorObject.line, "background", "errorHighlight");
    }

    //Removes highlight from line in which error was present
    function removeLineHighlight(line) {
        if(!line) {
            return;
        }
        getCodeMirror().getDoc().removeLineClass(line, "background", "errorHighlight");
    }

    //Function that adds a button on the gutter (on given line nubmer) next to the line numbers
    function showButton(errorObject){
        getCodeMirror().addWidget(errorObject, errorToggle, false);
        $(errorToggle).attr("class", "hint-marker-positioning hint-marker-error").removeClass("hidden");

        // Show tooltips message
        // $(".hint-marker-positioning").tooltipsy({content : "Click error icon for details", alignTo: "cursor", offset: [10, -10]});
    }

    // Function that removes gutter button
    function removeButton(){
        if(!errorToggle) {
            return;
        }
        if (errorToggle.parentNode) {
            $(errorToggle).remove();
        }

        //Destroy tooltips instance
        var tooltips = $(".hint-marker-positioning").data("tooltipsy");
        if(tooltips) {
            tooltips.destroy();
        }
        isShowingDescription = false;
    }

    // Creates & shows the error description
    function showDescription(error) {

        var description = document.createElement("div");
        description.className = "errorPanel";
        description.innerHTML = Mustache.render(lineWidgetHTML, {"error": error.message});

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
                    removeTextHighlight(coords[0], coords[1]);
                }
            });
        }

        var options = {coverGutter: false, noHScroll: false, above: false, showIfHidden: false};

        // https://codemirror.net/doc/manual.html#addLineWidget
        // console.log(getCodeMirror());
        currentErrorWidget = getCodeMirror().addLineWidget(error.line, description, options);
    }

    // Stores the highlight objects created when adding text highlight
    var activeTextHighlights = {};

    // Adds a text higlight to the code
    function addTextHighlight(start, end, className){
        var startHighlight = getCodeMirror().doc.posFromIndex(start);
        var endHighlight = getCodeMirror().doc.posFromIndex(end);
        var highlight = getCodeMirror().markText(startHighlight, endHighlight, { className: className });
        activeTextHighlights[start + "," + end] = highlight;
    }

    // Removes a text higlight to the code
    function removeTextHighlight(start, end){
        var highlight = activeTextHighlights[start + "," + end] || false;
        if(highlight){
            highlight.clear();
            delete activeTextHighlights[start + "," + end];
        }
    }

    //Destroys the description
    function hideDescription() {
        if(!currentErrorWidget) {
            return;
        }
        currentErrorWidget.clear();
        currentErrorWidget = null;
    }

    exports.cleanUp = cleanUp;
    exports.scafoldHinter = scafoldHinter;
    exports.addInvalidCodeHighlight = addInvalidCodeHighlight;
});
