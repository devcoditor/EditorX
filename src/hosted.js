require.config({
    paths: {
        "text"              : "thirdparty/text/text",
        "i18n"              : "thirdparty/i18n/i18n"
    }
});

function RemoteFiler(Filer, ChannelUtils) {
    "use strict";

    // If you need to debug Filer for some reason, drop the .min below
    var fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
    var slice = Array.prototype.slice;
    var port;
    var bramble;

    function setupChannel() {
        var channel = new MessageChannel();
        ChannelUtils.postMessage(bramble.contentWindow, [JSON.stringify({type: "bramble:filer"}), "*", [channel.port2]]);
//        bramble.contentWindow.postMessage(JSON.stringify({type: "bramble:filer"}), "*", [channel.port2]);
        port = channel.port1
        port.addEventListener("message", fsHandler, false);
        port.start && port.start();
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
        ChannelUtils.postMessage(bramble.contentWindow, [message, "*"]);
//        bramble.contentWindow.postMessage(message, "*");
    }

    $(function() {
        window.addEventListener("message", function(e) {
            var data = parseEventData(e.data);

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

define([
    "thirdparty/filer/dist/filer.min",
    "thirdparty/MessageChannel/ChannelUtils",
    "thirdparty/MessageChannel/message_channel"
], function(Filer, ChannelUtils) {
    RemoteFiler(Filer, ChannelUtils);
});
