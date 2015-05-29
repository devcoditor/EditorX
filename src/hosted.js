require.config({
    paths: {
        "text"              : "thirdparty/text/text",
        "i18n"              : "thirdparty/i18n/i18n"
    }
});

function RemoteFiler(Filer, ChannelUtils) {
    "use strict";

    var FilerBuffer = Filer.Buffer;
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    var slice = Array.prototype.slice;
    var port;
    var brambleWindow;

    function setupChannel() {
        var channel = new MessageChannel();
        ChannelUtils.postMessage(brambleWindow,
                                 [JSON.stringify({type: "bramble:filer"}),
                                 "*",
                                 [channel.port2]]);
        port = channel.port1
        port.addEventListener("message", remoteFSCall, false);
        port.start();
    }

    function parseEventData(data) {
        try {
            data = JSON.parse(data);
            return data || {};
        } catch(err) {
            return {};
        }
    }

    function remoteFSCall(e) {
        var data = e.data;

        function remoteCallback() {
            var args = slice.call(arguments);
            port.postMessage({callback: data.callback, result: args});
        }

        // Most fs methods can just get run normally, but we have to deal with
        // ArrayBuffer vs. Filer.Buffer for readFile and writeFile.
        switch(data.method) {
        case "writeFile":
            // Convert the passed ArrayBuffer back to a FilerBuffer
            data.args[1] = new FilerBuffer(data.args[1]);
            fs[data.method].apply(fs, data.args.concat(remoteCallback));
            break;
        case "readFile":
            fs[data.method].apply(fs, data.args.concat(function(err, data) {
                // Convert the FilerBuffer to an ArrayBuffer for transport
                remoteCallback(err, data ? data.buffer : null);
            }));
            break;
        default:
            fs[data.method].apply(fs, data.args.concat(remoteCallback));
        }

    }

    $(function() {
        window.addEventListener("message", function(e) {
            var data = parseEventData(e.data);

            // When Bramble asks for initial content, reply but don't bother providing any
            if (data.type === "bramble:init") {
                brambleWindow.postMessage(JSON.stringify({type: "bramble:init", source: null}), "*");
            }
            // Listen for requests to setup the fs
            else if (data.type === "bramble:filer") {
                setupChannel();
            }
        });

        // Load Bramble, passing search params from this window down.
        var bramble = $("#bramble")[0];
        bramble.src = "index.html" + window.location.search;
        brambleWindow = bramble.contentWindow;
    });
}

define([
    // Change this to filer vs. filer.min if you need to debug Filer
    "thirdparty/filer/dist/filer.min",
    "thirdparty/MessageChannel/ChannelUtils",
    "thirdparty/MessageChannel/message_channel"
], function(Filer, ChannelUtils) {
    RemoteFiler(Filer, ChannelUtils);
});
