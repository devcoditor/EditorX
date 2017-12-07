/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define({

    // Legend
    //😀 - Audited, good!
    //✏️ - Needs follow up work
    //❓ - Audited, have questions.
    //🚫 - Not yet audited.
    //✅ - Vetted and added to List of allowed rules
    //     These get included in a list in parser.js

    // ✅ <span></div>
    "ORPHAN_CLOSE_TAG_TITLE": "Mismatched closing tag!", // Mismatched closing tag?
    "ORPHAN_CLOSE_TAG": "<p>This closing <code data-highlight='[[closeTag.start]],[[closeTag.end]]'>&lt;/[[closeTag.name]]&gt;</code> tag doesn't seem to pair with this opening <code data-highlight='[[openTag.start]],[[openTag.end]]'>&lt;[[openTag.name]]&gt;</code> tag before it.</p>",

    // ✅ - <div> at the end of the doc...
    "UNCLOSED_TAG_TITLE": "There's an unclosed tag",
    "UNCLOSED_TAG": "<p>This <code data-highlight='[[openTag.start]],[[openTag.end]]'>&lt;[[openTag.name]]&gt;</code> tag doesn't have a matching closing tag. To fix it, delete it or add a <code>&lt;/[[openTag.name]]&gt;</code> to close it.</p>",

    // ✅ <div></dov>
    "MISMATCHED_CLOSE_TAG_TITLE": "Typo in the closing tag?",
    "MISMATCHED_CLOSE_TAG": "<p>This closing <code data-highlight='[[closeTag.start]],[[closeTag.end]]'>&lt;/[[closeTag.name]]&gt;</code> tag doesn't pair with this opening <code data-highlight='[[openTag.start]],[[openTag.end]]'>&lt;[[openTag.name]]&gt;</code> tag.</p> <p>Close the <code>&lt;[[openTag.name]]&gt;</code> tag with a matching <code>&lt;/[[openTag.name]]&gt;</code> tag.</p>",

    // ✅
    // For tags that are outside of all other closed tag pairs.
    "UNEXPECTED_CLOSE_TAG_TITLE": "Do you need this closing tag?",
    "UNEXPECTED_CLOSE_TAG": "<p>This closing <code data-highlight='[[closeTag.start]],[[closeTag.end]]'>&lt;/[[closeTag.name]]&gt;</code> tag isn't needed. There are no opening tags that need to be closed.</p>",

    // ✅ - <div></>
    "MISSING_CLOSING_TAG_NAME_TITLE": "Did you forget a tag name?",
    "MISSING_CLOSING_TAG_NAME": "<p>Please put the tag name into this <code data-highlight='[[closeTag.start]],[[closeTag.end]]'>&lt/</code> closing tag.</p><p>Did you mean to close this <code data-highlight='[[openTag.start]],[[openTag.end]]'>&lt;[[openTag.name]]&gt;</code> tag? If so, use <code>&lt;/[[openTag.name]]&gt;</code>.</p>",

    // ✅ - <jammo>
    "INVALID_TAG_NAME_TITLE": "That's not a valid tag!",
    "INVALID_TAG_NAME": "<p><code data-highlight='[[openTag.start]],[[openTag.end]]'>&lt;[[openTag.name]]</code> appears to be the start of a tag, but <code>[[openTag.name]]</code> is not a valid tag name.</p> <p>Here's <a href='https://developer.mozilla.org/en/docs/Web/Guide/HTML/HTML5/HTML5_element_list'>a list of HTML5 tags</a>.</p>",

    // ✅ - <div
    "UNTERMINATED_OPEN_TAG_TITLE": "Please close this tag!",
    "UNTERMINATED_OPEN_TAG": "<p>Looks like this <code data-highlight='[[openTag.start]],[[openTag.end]]'>&lt;[[openTag.name]]</code> tag is not properly closed. Fix it by adding a closing <code>&gt;</code> at the end.</p>",

    // ✅ - </div
    "UNTERMINATED_CLOSE_TAG_TITLE": "Please close this tag!",
    "UNTERMINATED_CLOSE_TAG": "<p>This closing <code data-highlight='[[closeTag.start]],[[closeTag.end]]'>&lt;/[[closeTag.name]]</code> tag doesn't end with a <code>&gt;</code>.</p>",

    // ✅ - <div />
    "SELF_CLOSING_NON_VOID_ELEMENT_TITLE": "This is not a self-closing tag",
    "SELF_CLOSING_NON_VOID_ELEMENT": "This <code data-highlight='[[start]],[[end]]'>&lt;[[name]]&gt;</code> tag can't be self-closed because it is not a void element. Remove the <code>/</code> and then close it with a separate <code>&lt;/[[name]]&gt;</code> tag.",

    // ✅ - </img>
    "CLOSE_TAG_FOR_VOID_ELEMENT_TITLE": "You don't need this closing tag!",
    "CLOSE_TAG_FOR_VOID_ELEMENT": "You can delete this closing <code data-highlight='[[closeTag.start]],[[closeTag.end]]'>&lt;/[[closeTag.name]]&gt;</code> tag. <code>&lt;[[closeTag.name]]&gt;</code> elements are void elements, meaning they don't need closing tags.",

    // ✅ - <div class=blam'>
    "UNQUOTED_ATTR_VALUE_TITLE": "Missing opening quote.",
    "UNQUOTED_ATTR_VALUE": "This attribute value <code data-highlight='[[highlight.start]], [[highlight.end]]'>[[attributeValueBeginning]]</code> should start with an opening double quote.</p>",


    //😀
    "ATTRIBUTE_IN_CLOSING_TAG_TITLE": "No attributes in a closing tag allowed!",
    "ATTRIBUTE_IN_CLOSING_TAG": "This closing tag <code data-highlight='[[closeTag.start]],[[closeTag.end]]'>&lt;/[[closeTag.name]]&gt;</code> cannot contain any attributes.</p>",

    //🚫
    "CSS_MIXED_ACTIVECONTENT_TITLE": "CSS_MIXED_ACTIVECONTENT_TITLE",
    "CSS_MIXED_ACTIVECONTENT": "<p>The CSS property <em data-highlight='[[cssProperty.start]],[[cssProperty.end]]'>[[cssProperty.property]]</em> has a url() value <em data-highlight='[[cssValue.start]],[[cssValue.end]]'>here</em> that currently points to an insecure resource. You can make this error disappear by logging into Webmaker. For more information on how modern browsers signal insecure content, visit <a href='https://developer.mozilla.org/en-US/docs/Security/MixedContent'>this link</a>.</p>",

    //🚫
    "EVENT_HANDLER_ATTR_NOT_ALLOWED_TITLE": "EVENT_HANDLER_ATTR_NOT_ALLOWED_TITLE",
    "EVENT_HANDLER_ATTR_NOT_ALLOWED": "<p>Sorry, but security restrictions on this site prevent you from using the JavaScript event handler attribute <em data-highlight='[[name.start]],[[name.end]]'>here</em>. If you really need to use JavaScript, consider using <a href='http://jsbin.com/'>jsbin</a> or <a href='http://jsfiddle.net/'>jsfiddle</a>.</p>",

    //🚫
    "HTML_CODE_IN_CSS_BLOCK_TITLE": "HTML_CODE_IN_CSS_BLOCK_TITLE",
    "HTML_CODE_IN_CSS_BLOCK": "<p>HTML code was detected in CSS context starting <em data-highlight='[[html.start]],[[html.end]]'>here</em></p>",

    //🚫
    "HTTP_LINK_FROM_HTTPS_PAGE_TITLE": "HTTP_LINK_FROM_HTTPS_PAGE_TITLE",
    "HTTP_LINK_FROM_HTTPS_PAGE": "<p>The <code>&lt;[[openTag.name]]&gt;</code> tag's <code>[[attribute.name.value]]</code> attribute (<em data-highlight='[[attribute.value.start]],[[attribute.value.end]]'>here</em>) currently points to an insecure resource. You can make this error disappear by logging into Webmaker. For more information on how modern browsers signal insecure content, visit <a href='https://developer.mozilla.org/en-US/docs/Security/MixedContent'>this link</a>.</p>",

    //😀
    "INVALID_ATTR_NAME_TITLE": "That's not a valid attribute!",
    "INVALID_ATTR_NAME": "This attribute <code class='attribute' data-highlight='[[start]],[[end]]'>[[attribute.name.value]]</code> has a name that is not permitted in HTML5.</p>",

    //❓ - not sure how to get it to come up
    "UNSUPPORTED_ATTR_NAMESPACE_TITLE": "UNSUPPORTED_ATTR_NAMESPACE_TITLE",
    "UNSUPPORTED_ATTR_NAMESPACE": "<p>The attribute <em data-highlight='[[start]],[[end]]'>here</em> uses an attribute namespace that is not permitted under HTML5 conventions.</p>",

    //❓ - not sure how to get it to come up
    "MULTIPLE_ATTR_NAMESPACES_TITLE": "MULTIPLE_ATTR_NAMESPACES_TITLE",
    "MULTIPLE_ATTR_NAMESPACES": "<p>The attribute <em data-highlight='[[start]],[[end]]'>here</em> has multiple namespaces. Check your text and make sure there's only a single namespace prefix for the attribute.</p>",

    //❓ - not sure how to get it to come up, doesn't seem to get triggered
    "INVALID_CSS_DECLARATION_TITLE": "INVALID_CSS_DECLARATION_TITLE",
    "INVALID_CSS_DECLARATION": "<p><em data-highlight='[[cssDeclaration.start]],[[cssDeclaration.end]]'>This</em> CSS declaration never closes.</p>",

    //😀
    "INVALID_CSS_PROPERTY_NAME_TITLE": "Invalid CSS property!",
    "INVALID_CSS_PROPERTY_NAME": "<code class='text' data-highlight='[[cssProperty.start]],[[cssProperty.end]]'>[[cssProperty.property]]</code> is not a valid CSS property. Check the <a href='https://developer.mozilla.org/en/CSS/CSS_Reference'>list of CSS properties</a>.",

    //❓ - not sure how to get it to come up, doesn't seem to get triggered
    "INVALID_CSS_RULE_TITLE": "INVALID_CSS_RULE_TITLE",
    "INVALID_CSS_RULE": "<p><em data-highlight='[[cssRule.start]],[[cssRule.end]]'>This</em> CSS rule is not legal CSS.</p>",

    // ❓ Doesn't seem to get used every
    // "JAVASCRIPT_URL_NOT_ALLOWED_TITLE": "JAVASCRIPT_URL_NOT_ALLOWED_TITLE",
    // "JAVASCRIPT_URL_NOT_ALLOWED": "<p>Sorry, but security restrictions on this site prevent you from using the <code>javascript:</code> URL <em data-highlight='[[value.start]],[[value.end]]'>here</em>. If you really need to use JavaScript, consider using <a href='http://jsbin.com/'>jsbin</a> or <a href='http://jsfiddle.net/'>jsfiddle</a>.</p>",

    //❓ Will leave these for Pomax
    "MISMATCHED_CLOSE_TAG_DUE_TO_EARLIER_AUTO_CLOSING_TITLE" : "MISMATCHED_CLOSE_TAG_DUE_TO_EARLIER_AUTO_CLOSING_TITLE",
    "MISMATCHED_CLOSE_TAG_DUE_TO_EARLIER_AUTO_CLOSING" : "MISMATCHED_CLOSE_TAG_DUE_TO_EARLIER_AUTO_CLOSING",

    // 😀❓- not sure if the message is the best
    "MISSING_CSS_BLOCK_CLOSER_TITLE": "Unclosed block of CSS",
    "MISSING_CSS_BLOCK_CLOSER": "<p>Looks like you forgot to close this block of CSS. Add a <code>}</code> after <code data-highlight='[[cssValue.start]],[[cssValue.end]]'>[[cssValue.value]]</code>.",

    //✏️ https://github.com/mozilla/slowparse/issues/95
    "MISSING_CSS_BLOCK_OPENER_TITLE": "Forgot to open your CSS block?",
    "MISSING_CSS_BLOCK_OPENER": "Add a <code>{</code> after the <code data-highlight='[[cssSelector.start]],[[cssSelector.end]]'>[[cssSelector.selector]]</code>.",

    //✏️ https://github.com/mozilla/slowparse/issues/96
    "MISSING_CSS_PROPERTY_TITLE": "Did you forget a CSS property?",
    "MISSING_CSS_PROPERTY": "<p>Missing property for <em data-highlight='[[cssSelector.start]],[[cssSelector.end]]'>[[cssSelector.selector]]</em>.</p>",

    //😀✏️ https://github.com/mozilla/slowparse/issues/97
    "MISSING_CSS_SELECTOR_TITLE": "Missing selector",
    "MISSING_CSS_SELECTOR": "<p>Did you forget to add a selector in front of this <code data-highlight='[[cssBlock.start]],[[cssBlock.end]]'>{</code> for the rules that start after?",

    //😀
    "MISSING_CSS_VALUE_TITLE": "Missing value",
    "MISSING_CSS_VALUE": "Add a value for the the <code data-highlight='[[cssProperty.start]],[[cssProperty.end]]'>[[cssProperty.property]]</code> rule.",

    //❓✏️https://github.com/mozilla/slowparse/issues/98
    //"SCRIPT_ELEMENT_NOT_ALLOWED_TITLE": "SCRIPT_ELEMENT_NOT_ALLOWED_TITLE",
    //"SCRIPT_ELEMENT_NOT_ALLOWED": "<p>Sorry, but security restrictions on this site prevent you from using <code>&lt;script&gt;</code> tags <em data-highlight='[[openTag.start]],[[closeTag.end]]'>here</em>. If you really need to use JavaScript, consider using <a href='http://jsbin.com/'>jsbin</a> or <a href='http://jsfiddle.net/'>jsfiddle</a>.</p>",


    //🚫❓- not sure how to make this come up
    "UNCAUGHT_CSS_PARSE_ERROR_TITLE": "UNCAUGHT_CSS_PARSE_ERROR_TITLE",
    "UNCAUGHT_CSS_PARSE_ERROR": "<p>A parse error occurred outside expected cases: <em data-highlight='[[error.start]],[[error.end]]'>[[error.msg]]</em></p>",



    //😀
    "UNFINISHED_CSS_PROPERTY_TITLE": "Unfinished CSS rule",
    "UNFINISHED_CSS_PROPERTY": "This <code data-highlight='[[cssProperty.start]],[[cssProperty.end]]'>[[cssProperty.property]]</code> property still needs finalizing with :</p>",

    //😀
    "UNFINISHED_CSS_SELECTOR_TITLE": "Unfinished selector",
    "UNFINISHED_CSS_SELECTOR": "This selector <code data-highlight='[[cssSelector.start]],[[cssSelector.end]]'>[[cssSelector.selector]]</code> still needs finalizing with <code>{</code>",

    //✏️ https://github.com/mozilla/slowparse/issues/100
    "UNFINISHED_CSS_VALUE_TITLE": "UNFINISHED_CSS_VALUE_TITLE",
    "UNFINISHED_CSS_VALUE": "<p>Value <em data-highlight='[[cssValue.start]],[[cssValue.end]]'>[[cssValue.value]]</em> still needs finalizing with ;</p>",

    //😀
    "UNKOWN_CSS_KEYWORD_TITLE": "Unrecognized CSS Keyword",
    "UNKOWN_CSS_KEYWORD": "The CSS @keyword <code data-highlight='[[cssKeyword.start]],[[cssKeyword.end]]'>[[cssKeyword.value]]</code> does not match any known @keywords.",

    //✏️https://github.com/mozilla/slowparse/issues/101
    "UNTERMINATED_ATTR_VALUE_TITLE": "Unclosed attribute value",
    "UNTERMINATED_ATTR_VALUE": "<p>The <code>&lt;[[openTag.name]]&gt;</code> tag's <code>[[attribute.name.value]]</code> attribute has a value <code class='blue' data-highlight='[[attribute.value.start]]'>here</code> that doesn't end with a closing double quote.</p>",

    //✏️https://github.com/mozilla/slowparse/issues/102
    "UNTERMINATED_COMMENT_TITLE": "Unclosed comment",
    "UNTERMINATED_COMMENT": "This comment <code class='comment' data-highlight='[[start]]'>&lt;!--</code> needs to be closed with a matching <code>--&gt;</code>.",

    "UNTERMINATED_CSS_COMMENT_TITLE": "UNTERMINATED_CSS_COMMENT_TITLE",
    "UNTERMINATED_CSS_COMMENT": "<p>The CSS comment <em data-highlight='[[start]]'>here</em> doesn't end with a <code>*/</code>.</p>",

    //❓ TODO - figure out where to send people
    "BLOCK_INSIDE_INLINE_ELEMENT_TITLE" : "You can't put a &lt;[[invalidTag.name]]&gt; here!",
    "BLOCK_INSIDE_INLINE_ELEMENT" : `
      <p>
      This <code data-highlight='[[invalidTag.start]],[[invalidTag.end]]'>&lt;[[invalidTag.name]]&gt;</code>
      is a block element, which are not allowed inside of inline elements, like this
      <code data-highlight='[[openTag.start]],[[openTag.end]]'>&lt;[[openTag.name]]&gt;</code>.
      </p>
      <p>
      Change the <code>[[openTag.name]]</code> to a block-level
      element: here's a <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements">handy list</a>.
      </p>
    `

});
