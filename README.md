# Bramble is based on Brackets

Brackets is a modern open-source code editor for HTML, CSS
and JavaScript that's *built* in HTML, CSS and JavaScript. 

Brackets is at 1.0 and we're not stopping there. We have many feature ideas on our
[trello board](http://bit.ly/BracketsTrelloBoard) that we're anxious to add and other
innovative web development workflows that we're planning to build into Brackets. 
So take Brackets out for a spin and let us know how we can make it your favorite editor. 

You can see some 
[screenshots of Brackets](https://github.com/adobe/brackets/wiki/Brackets-Screenshots)
on the wiki, [intro videos](http://www.youtube.com/user/CodeBrackets) on YouTube, and news on the [Brackets blog](http://blog.brackets.io/).

The text editor inside Brackets is based on 
[CodeMirror](http://github.com/codemirror/CodeMirror)&mdash;thanks to Marijn for
taking our pull requests, implementing feature requests and fixing bugs! See 
[Notes on CodeMirror](https://github.com/adobe/brackets/wiki/Notes-on-CodeMirror)
for info on how we're using CodeMirror.

# How to setup Bramble (Brackets) in your local machine

Step 01: Make sure you fork and clone [Bramble](https://github.com/humphd/brackets).
We do our work on the `bramble` branch, so make sure you aren't on `master`.

```
$ git clone https://github.com/[yourusername]/brackets --recursive
```

Step 02: Install its dependencies

Navigate to the root of the directory you cloned and run

```
$ npm install
```

```
$ git submodule update --init
```

```
Grunt commands to be added
```

Step 03: Run Bramble:

Run one of the suggested local servers (or your own) from the root directory of Bramble:  
* [Apache Webserver](http://www.apache.org/)
* Host on [github pages](https://help.github.com/articles/what-are-github-pages)
* [Python WebServer](https://docs.python.org/2/library/simplehttpserver.html)

Assuming you have Bramble running on port `8080`. Now you can visit [http://localhost:8080/src](http://localhost:8080/src).

NOTE: Bramble expects to be run in an iframe, which hosts its filesystem. For local
development, use `src/hosted.html` instead of `src/index.html`.  To see how the remote end
should host Bramble's iframe, see `src/hosted.js`.

# Optional Extension Loading

Bramble supports enabling and disabling various extensions via the URL and query params.
A standard set of default extensions are always turned on:

* CSSCodeHints
* HTMLCodeHints
* JavaScriptCodeHints
* InlineColorEditor
* JavaScriptQuickEdit
* QuickOpenCSS
* QuickOpenHTML
* QuickOpenJavaScript
* QuickView
* UrlCodeHints
* brackets-paste-and-indent

You could disable QuickView and CSSCodeHints by loading Bramble with `?disableExtensions=QuickView,CSSCodeHints`
on the URL.

In addition, you can enable other extra extensions:

* SVGCodeHints
* HtmlEntityCodeHints
* LESSSupport
* CloseOthers
* InlineTimingFunctionEditor
* WebPlatformDocs
* CodeFolding
* JSLint
* QuickOpenCSS
* RecentProjects
* brackets-cdn-suggestions
* ImageUrlCodeHints
* HTMLHinter
* MdnDocs

You could enable JSLint and LESSSupport by loading Bramble with `?enableExtensions=JSLint,LESSSupport`
on the URL

NOTE: you can combine `disableExtensions` and `enableExtensions` to mix loading/disabling extensions.
You should check src/utils/BrambleExtensionLoader.js for the most up-to-date version of these
extension lists.

--------------

## After installation

After you have everything setup, you can now run the server you chose in the root of your local Bramble directory and see it in action by visiting [http://localhost:8080/src](http://localhost:8080/src). 

# Bramble IFrame API

Bramble is desinged to be run in an iframe, and the hosting web app to communicate with it
via `postMessage` and `MessageChannel`.  In order to simplify this, a convenience API exists
for creating and managing the iframe, as well as providing JavaScript functions for interacting
with the editor, preview, etc.

The hosting app must include the Bramble IFrame API (i.e., `dist/bramble.js`).  Note: in
development you can use `src/hosted.html`, which does this).  This script can either be used as
an AMD module, or as a browser global:

```html
<script src="bramble.js"></script>
<script>
  // Option 1: AMD loading, assumes requirejs is loaded already
  require(["bramble/api"], function(Bramble) {
    ...
  });

  // Option 2: Browser global
  var Bramble = window.Bramble;
</script>
```

Once you have a reference to the `Bramble` object, you use it to create an instance:

```js
var bramble = Bramble.getInstance(elem, options);
```

The `elem` argument specifies which element in the DOM should be used to hold the iframe.
This element's contents will be replaced by the iframe.  You can pass a selector, a reference
to an actual DOM element, or leave it blank, and `document.body` will be used.

The `options` object allows you to configure Bramble:

 * url: <String> a URL to use when loading the Bramble iframe (defaults to prod)
 * locale: <String> the locale Brackets should use
 * extensions <Object>
     * enable: <Array(String)> a list of extensions to enable
     * disable: <Array(String)> a list of extensions to disable
 * hideUntilReady: <Boolean> whether to hide Bramble until it's fully loaded.
 * ready: <Function> a function to be called when Bramble is fully loaded.
 * provider: <Bramble.Filer.FileSystem.providers.*> a provider to use for the fs, defaults to Memory

Here's an example:

```js
// Get the Filer Path object
var Path = Bramble.Filer.Path;

var bramble = Bramble.getInstance("#bramble", {
  hideUntilReady: true,
  ready: function() {
    // Get a reference to the filesystem
    var fs = bramble.fs();
    var html = "<html>...</html>";
    // Assuming we've gotten a project name and filename from the user somehow
    var path = Path.join("/", projectName, filename);

    fs.writeFile(path, html, function(err) {
      if(err) return console.error("Unable to write file", err);
    });
  }
});
```

Repeated calls to `getInstance()` will all return the same instance--there is only ever one.

The Bramble instance has a number of methods you can call in order to interact with the
Bramble editor and preview:

* `undo()` - undo the last operation in the editor (waits for focus)
* `redo()` - redo the last operation that was undone in the editor (waits for focus)
* `increaseFontSize()` - increases the editor's font size
* `decreaseFontSize()` - decreases the edtior's font size
* `restoreFontSize()` - restores the editor's font size to normal
* `save()` - saves the current document
* `saveAll()` - saves all "dirty" documents
* `useHorizontalSplitView()` - splits the editor and preview horizontally
* `useVerticalSplitView()` - splits the editor and preview vertically (default)
* `find()` - opens the Find dialog to search within the current document
* `findInFiles()` - opens the Find in Files dialog to search in all project files
* `replace()` - opens the Replace dialog to replace text in the current document
* `replaceInFiles()` - opens the Replace In Files dialog to replace text in all project files
* `useLightTheme()` - sets the editor to use the light theme (default)
* `useDarkTheme()` - sets the editor to use the dark theme
* `showSidebar()` - opens the file tree sidebar
* `hideSidebar()` - hides the file tree sidebar
* `refreshPreview()` - reloads the preview with the latest content in the editor and filesystem
* `useMobilePreview()` - uses a Mobile view in the preview, as it would look on a smartphone
* `useDesktopPreview()` - uses a Desktop view in the preview, as it would look on a desktop computer (default)
* `enableJavaScript()` - turns on JavaScript execution for the preview (default)
* `disableJavaScript()` - turns off JavaScript execution for the preview
