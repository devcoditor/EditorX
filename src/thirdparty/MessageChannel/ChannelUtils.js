define(function (require, exports, module) {
    "use strict";

    var UUID = require("thirdparty/MessageChannel/uuid.core");
    var nativeMessageChannel = window.MessageChannel && !window.MessageChannel._shim;
    // We have to be careful trying to transfer ArrayBuffer in postMessage in Blink:
    // https://code.google.com/p/chromium/issues/detail?id=334408&q=transferable&colspec=ID%20Pri%20M%20Week%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified
    var isBlink = (window.chrome || (window.Intl && Intl.v8BreakIterator)) &&
                  'CSS' in window;

    function postMsg(win, args) {
        if(nativeMessageChannel) {
            win.postMessage.apply(win, args);
        } else {
            args.unshift(win);
            Window.postMessage.apply(Window, args);
        }
    }

    exports.allowArrayBufferTransfer = !isBlink;
    exports.postMessage = postMsg;
    exports.UUID = UUID;
});
