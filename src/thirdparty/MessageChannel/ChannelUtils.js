define(function (require, exports, module) {
    "use strict";

     var nativeMessageChannel = window.MessageChannel && !window.MessageChannel._shim;

     function postMsg(win, args) {
         if(nativeMessageChannel) {
             console.log('postMsg native', args);
             win.postMessage.apply(win, args);
         } else {
             args.unshift(win);
             console.log('postMsg shimmed', args);
             Window.postMessage.apply(Window, args);
         }
     }

     exports.postMessage = postMsg;
});
