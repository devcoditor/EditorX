require.config({
    paths: {
        "text"              : "thirdparty/text/text",
        "i18n"              : "thirdparty/i18n/i18n"
    }
});

function RemoteFiler(Filer) {
    "use strict";

    // Temporary MessageChannel shim for Firefox, see:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=952139
  //  require("thirdparty/MessageChannel/dist/message_channel");

    // If you need to debug Filer for some reason, drop the .min below
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    var slice = Array.prototype.slice;
    var port;
    var bramble;

    function setupChannel() {
        console.log('setup channel');
        var channel = new MessageChannel();
        debugger;
        bramble.contentWindow.postMessage(JSON.stringify({type: "bramble:filer"}), "*", [channel.port2]);
        port = channel.port1
        port.onmessage = fsHandler;
    }

    function parseEventData(data) {
        try {
            data = JSON.parse(data);
            return data || {};
        } catch(err) {
            return {};
        }
    }

    function fsHandler(e) {
        var data = e.data;
console.log("fsHandler got", e);
        function remoteCallback() {
            var args = slice.call(arguments);
            port.postMessage({callback: data.callback, result: args});
        }

        fs[data.method].apply(fs, data.args.concat(remoteCallback));
    }

    function send(message) {
        if(typeof(message) !== "string") {
            message = JSON.stringify(message);
        }
        bramble.contentWindow.postMessage(message, "*");
    }

    $(function() {
        $(window).on("message", function(e) {
            var data = parseEventData(e.originalEvent.data);
console.log('hosted received', e);
            // When Bramble asks for initial content, reply but don't bother providing any
            if (data.type === "bramble:init") {
                send({type: "bramble:init", source: null});
            }
            // Listen for requests to setup the fs
            else if (data.type === "bramble:filer") {
                setupChannel();
            }
        });

        // Load Bramble, passing search params from this window down.
        bramble = $("#bramble")[0];
        bramble.src = "index.html" + window.location.search;
    });
}


define(function(require){
    if(!("MessageChannel" in window)) {
        // Temporary MessageChannel shim for Firefox, see:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=952139
        require([
            "thirdparty/filer/dist/filer.min",
            "thirdparty/MessageChannel/dist/message_channel"
        ], function(Filer) {
            RemoteFiler(Filer);
        });
    } else {
        require([
            "thirdparty/filer/dist/filer.min"
        ], function(Filer) {
            RemoteFiler(Filer);
        });
    }
});
