/*global define, SlowParse, brackets */

/**
 * Provides SlowParse error results via the core linting extension point.
 *
 * Code adapted from:
 * https://github.com/mozilla/thimble.webmaker.org/blob/master/locale/en_US/thimble-dialog-messages.json
 */
define(function (require, exports, module) {
  "use strict";

  var CodeInspection = brackets.getModule("language/CodeInspection");
  var _ = brackets.getModule("thirdparty/lodash");

  var templates = {
    "CLOSE_TAG_FOR_VOID_ELEMENT": "The closing </<%= closeTag.name %>> tag is for a void element (that is, an element that doesn't need to be closed).",

    "CSS_MIXED_ACTIVECONTENT": "The css property '<%= cssProperty.property %> has a url() value that links to an HTTP resource, but the page itself is hosted on HTTPS. Most browsers will not be able to load this resource because of mixed-content restrictions. You will have to link to an HTTPS resource for it to be loaded in your CSS.",

    "MISMATCHED_CLOSE_TAG": "The closing </<%= closeTag.name %>> tag doesn't pair with the opening <<%= openTag.name %>> tag. This is likely due to a missing </<%= openTag.name %>> tag.",

    "EVENT_HANDLER_ATTR_NOT_ALLOWED": "Sorry, but security restrictions on this site prevent you from using the JavaScript event handler attribute. If you really need to use JavaScript, consider using http://jsbin.com/ or http://jsfiddle.net/.",

    "HTML_CODE_IN_CSS_BLOCK": "HTML code was detected in a CSS context.",

    "HTTP_LINK_FROM_HTTPS_PAGE": "The <<%=openTag.name%>> tag's <%=attribute.name.value%> attribute points to a HTTP resource, but the page itself is hosted on HTTPS. Most browsers will not be able to load this resource because of mixed-content restrictions. Either point to an HTTPS resource, or include the data as content in an on-page <<%=openTag.name%>> element instead.",

    "INVALID_ATTR_NAME": "The attribute has a name that is not permitted under HTML5 naming conventions.",

    "INVALID_CSS_DECLARATION": "The CSS declaration never closes.",

    "INVALID_CSS_PROPERTY_NAME": "The '<%=cssProperty.property%>' property name does not exist in CSS. You may want to see a https://developer.mozilla.org/en/CSS/CSS_Reference'.",

    "INVALID_CSS_RULE": "The CSS rule is not legal CSS.",

    "INVALID_TAG_NAME": "The < character appears to be the beginning of a tag, but is not followed by a valid tag name. If you just want a < to appear on your Web page, try using &lt; instead. Or, see a http://joshduck.com/periodic-table.html.",

    "JAVASCRIPT_URL_NOT_ALLOWED": "Sorry, but security restrictions on this site prevent you from using the javascript: URL. If you really need to use JavaScript, consider using http://jsbin.com/ or http://jsfiddle.net/",

    "MISSING_CSS_BLOCK_CLOSER": "Missing block closer or next property:value; pair following <%=cssValue.value%>.",

    "MISSING_CSS_BLOCK_OPENER": "Missing block opener after <%= cssSelector.selector %>.",

    "MISSING_CSS_PROPERTY": "Missing property for <%= cssSelector.selector %>.",

    "MISSING_CSS_SELECTOR": "Missing either a new CSS selector or the </style> tag.",

    "MISSING_CSS_VALUE": "Missing value for <%=cssProperty.property%>.",

    "SCRIPT_ELEMENT_NOT_ALLOWED": "Sorry, but security restrictions on this site prevent you from using <script> tags. If you really need to use JavaScript, consider using http://jsbin.com/ or http://jsfiddle.net/.",

    "SELF_CLOSING_NON_VOID_ELEMENT": "The <<%=name%>> can't be self-closed, because <<%=name%>> is not a void element; it must be closed with a separate </<%=name%>> tag.",

    "UNCAUGHT_CSS_PARSE_ERROR": "A parse error occurred outside expected cases: <%=error.msg%>.",

    "UNCLOSED_TAG": "The <<%=openTag.name%>> tag never closes.",

    "UNEXPECTED_CLOSE_TAG": "The closing </<%=closeTag.name%>> tag doesn't pair with anything, because there are no opening tags that need to be closed.",

    "UNFINISHED_CSS_PROPERTY": "Property '<%=cssProperty.property%>' still needs finalizing with :",

    "UNFINISHED_CSS_SELECTOR": "Selector '<%=cssSelector.selector%>' still needs finalizing with {",

    "UNFINISHED_CSS_VALUE": "Value '<%=cssValue.value%> still needs finalizing with ;",

    "UNQUOTED_ATTR_VALUE": "The Attribute value should start with an opening double quote.",

    "UNTERMINATED_ATTR_VALUE": "The <<%=openTag.name%>> tag's '<%=attribute.name.value%>' attribute has a value that doesn't end with a closing double quote.",

    "UNTERMINATED_CLOSE_TAG": "The closing </<%=closeTag.name%>> tag doesn't end with a >",

    "UNTERMINATED_COMMENT": "The comment doesn't end with a -->",

    "UNTERMINATED_CSS_COMMENT": "The CSS comment doesn't end with a */",

    "UNTERMINATED_OPEN_TAG": "The opening <<%=openTag.name%>> tag doesn't end with a >"

  };

  exports.create = function(error, getLineInfoForPos) {
    return {
      pos: getLineInfoForPos(error.cursor),
      message: _.template(templates[error.type], error),
      type: CodeInspection.Type.ERROR
    };
  };

});
