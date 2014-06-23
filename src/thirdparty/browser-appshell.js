/**
 * Browser shim for Brackets AppShell API.  See:
 *   https://github.com/adobe/brackets-shell
 *   https://github.com/adobe/brackets-shell/blob/adf27a65d501fae71cc6d8905d6dc3d9460208a9/appshell/appshell_extensions.js
 *   http://www.hyperlounge.com/blog/hacking-the-brackets-shell/
 */

(function(global, navigator, Filer) {

  var Path = Filer.Path;

  var startupTime = Date.now();
  function getElapsedMilliseconds() {
    return (Date.now()) - startupTime;
  }

  function functionNotImplemented() {
    throw "Function not (yet) implemented in browser-appshell.";
  }

  // Provide an implementation of appshell.app as expected by src/utils/Global.js
  // and other parts of the code.
  var appshell = global.appshell = global.appshell || {};

  // Brackets expects the appshell to have a filesystem.
  // TODO: replace this with MakeDrive.
  appshell.fs = new Filer.FileSystem({
    provider: new Filer.FileSystem.providers.Fallback()
  },
  function(err, fs) {
    // XXXhack: Pre-populate a few directories/files, so calls into the fs don't totally fail
    var sh = fs.Shell();
    sh.mkdirp('/ApplicationSupport/extensions/user');

    // Make brackets happy and create a native brackets dir path, see
    // https://github.com/adobe/brackets/blob/0f9574cd969639e4564c953e33bbdd0a2f98bb84/src/file/FileUtils.js#L278-L290
    var pathname = decodeURI(window.location.pathname);
    var directory = pathname.substr(0, pathname.lastIndexOf("/"));

    sh.mkdirp(Path.join(directory, 'extensions/default'));
    sh.mkdirp(Path.join(directory, '../samples/root/Getting Started'), function(err) {
      if(err) return;

      fs.writeFile(Path.join(directory, '../samples/root/Getting Started', 'index.html'), "<p>hello world!</p>");
    });
  });

  // The native appshell fs is a bit different from Filer's
  var fsProto = Filer.FileSystem.prototype;
  fsProto.ERR_BROWSER_NOT_INSTALLED = 11;
  fsProto.ERR_CANT_READ = 4;
  fsProto.ERR_CANT_WRITE = 6;
  fsProto.ERR_FILE_EXISTS = 10;
  fsProto.ERR_INVALID_PARAMS = 2;
  fsProto.ERR_NOT_DIRECTORY = 9;
  fsProto.ERR_NOT_FILE = 8;
  fsProto.ERR_NOT_FOUND = 3;
  fsProto.ERR_OUT_OF_SPACE = 7;
  fsProto.ERR_UNKNOWN = 1;
  fsProto.ERR_UNSUPPORTED_ENCODING = 5;
  fsProto.NO_ERROR = 0;

  fsProto.chmod = function(path, mode, callback) {
    functionNotImplemented();
  };
  fsProto.copyFile = function(src, dest, callback) {
    functionNotImplemented();
  };
  fsProto.isNetworkDrive = function(path, callback) {
    callback(null, false);
  };
  fsProto.makedir = fsProto.mkdir;

  // appshell wants its stats object to have real Date objects
  fsProto.$stat = fsProto.stat;
  fsProto.stat = function(path, callback) {
    this.$stat(path, function(err, stats) {
      if (err){
        callback(fsProto.ERR_UNKNOWN);
        return;
      }

      stats.mtime = new Date(stats.mtime);
      stats.ctime = new Date(stats.ctime);
      stats.atime = new Date(stats.atime);

      callback(null, stats);
    });
  };
  fsProto.moveToTrash = function(path, callback) {
    functionNotImplemented();
  };
  fsProto.showOpenDialog = function (allowMultipleSelection, chooseDirectory, title, initialPath, fileTypes, callback) {
    functionNotImplemented();
  };
  fsProto.showSaveDialog = function (title, initialPath, proposedNewFilename, callback) {
    functionNotImplemented();
  };

  appshell.app = {
    ERR_NODE_FAILED: -3,
    ERR_NODE_NOT_YET_STARTED: -1,
    ERR_NODE_PORT_NOT_YET_SET: -2,
    NO_ERROR: 0,

    // TODO: deal with getter *and* setter
    language: navigator.language,

    abortQuit: function() {
      functionNotImplemented();
    },
    addMenu: function(title, id, position, relativeId, callback) {
      functionNotImplemented();
    },
    addMenuItem: function(parentId, title, id, key, displayStr, position, relativeId, callback) {
      functionNotImplemented();
    },
    closeLiveBrowser: function(callback) {
      functionNotImplemented();
    },
    dragWindow: function() {
      functionNotImplemented();
    },
    getApplicationSupportDirectory: function() {
      return '/ApplicationSupport';
    },
    getDroppedFiles: function(callback) {
      functionNotImplemented();
    },
    getElapsedMilliseconds: getElapsedMilliseconds,
    getMenuItemState: function(commandid, callback) {
      functionNotImplemented();
    },
    getMenuPosition: function(commandId, callback) {
      functionNotImplemented();
    },
    getMenuTitle: function(commandid, callback) {
      functionNotImplemented();
    },
    getPendingFilesToOpen: function(callback) {
      functionNotImplemented();
    },
    getRemoteDebuggingPort: function() {
      functionNotImplemented();
    },
    getUserDocumentsDirectory: function() {
      functionNotImplemented();
    },
    openLiveBrowser: function(url, enableRemoteDebugging, callback) {
      functionNotImplemented();
    },
    openURLInDefaultBrowser: function(url, callback) {
      functionNotImplemented();
    },
    quit: function() {
      functionNotImplemented();
    },
    removeMenu: function(commandId, callback) {
      functionNotImplemented();
    },
    removeMenuItem: function(commandId, callback) {
      functionNotImplemented();
    },
    setMenuItemShortcut: function(commandId, shortcut, displayStr, callback) {
      functionNotImplemented();
    },
    setMenuItemState: function(commandid, enabled, checked, callback) {
      functionNotImplemented();
    },
    setMenuTitle: function(commandid, title, callback) {
      functionNotImplemented();
    },
    showDeveloperTools: function() {
      functionNotImplemented();
    },
    showExtensionsFolder: function(appURL, callback) {
      functionNotImplemented();
    },
    showOSFolder: function(path, callback) {
      functionNotImplemented();
    },

    // https://github.com/adobe/brackets-shell/blob/959836be7a3097e2ea3298729ebd616247c83dce/appshell/appshell_node_process.h#L30
    getNodeState: function(callback) {
      callback(/* BRACKETS_NODE_FAILED = -3 */ -3);
    }
  };

  global.brackets = appshell;

}(window, window.navigator, window.Filer));
