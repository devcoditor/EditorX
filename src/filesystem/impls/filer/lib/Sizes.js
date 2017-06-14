
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define*/

define(function (require, exports, module) {
    "use strict";

    var KB = 1024;
    var MB = 1024 * KB;

    // 3MB size limit for imported files.
    var REGULAR_FILE_SIZE_LIMIT_MB = 3 * MB;

    // 5MB size limit for imported archives (zip & tar)
    var ARCHIVE_FILE_LIMIT_MB = 5 * MB;

    // 12MB size limit for imported image files that can be auto-resized (png, jpg)
    var RESIZABLE_IMAGE_FILE_LIMIT_MB = 12 * MB;

    // 250KB size limit for images we are auto-resizing (our ideal size)
    var RESIZED_IMAGE_TARGET_SIZE_KB = 250 * KB;

    // 20KB +/- of error tolerance when we auto-resize images
    var IMAGE_RESIZE_TOLERANCE_KB = 20 * KB;

    exports.KB = KB;
    exports.MB = MB;
    exports.REGULAR_FILE_SIZE_LIMIT_MB = REGULAR_FILE_SIZE_LIMIT_MB;
    exports.ARCHIVE_FILE_LIMIT_MB = ARCHIVE_FILE_LIMIT_MB;
    exports.RESIZABLE_IMAGE_FILE_LIMIT_MB = RESIZABLE_IMAGE_FILE_LIMIT_MB;
    exports.RESIZED_IMAGE_TARGET_SIZE_KB = RESIZED_IMAGE_TARGET_SIZE_KB;
    exports.IMAGE_RESIZE_TOLERANCE_KB = IMAGE_RESIZE_TOLERANCE_KB;
});
