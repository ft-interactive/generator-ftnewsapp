'use strict';

<% if (features.handlebars) { %>require('ig-utils/js/handlebars-utils'); // registers some Handlebars helpers<% } %><% if (features.furniture) { %>
var Footer = require('ig-furniture/footer');<% } %><% if (projectType === 'embedded') { %>
var iframeUtils = require('ig-utils/js/iframe-utils');<% } %><% if (features.handlebars) { %>
var mainTemplate = require('../templates/main.hbs');
<% } %><% if (features.bertha) { %>

spreadsheet.options = spreadsheet.options || {};
spreadsheet.credits = spreadsheet.credits || null;

<% } %>
// Render the main HTML
var mainHTML = <% if (features.handlebars) { %>mainTemplate(<% if (features.bertha) { %>spreadsheet<% } else { %>{
  // data to pass into the template
})<% } %>)<% } else { %>'<p>Some dynamic content</p>'<% } %>;

onDomReady(function () {<% if (projectType === 'microsite') { %>

  require('fastclick')(document.body); // github.com/ftlabs/fastclick
  <% } %>

  // Display the main content
  document.getElementById('main-content').innerHTML = mainHTML;<% if (features.furniture) { %>

  // Render and display the footer
  var footerView = new Footer({
    el: document.body.querySelectorAll('.ig-footer')[0],
    credits: <% if (features.bertha) { %>spreadsheet.credits<% } else { %>[
      {type: 'credit', name: 'Some Person', link: 'http://example.com/'},
      {type: 'source', name: 'Some Source', link: 'http://example.com/'}
    ]<% } %>,
    footnotes: <% if (features.bertha) { %>(spreadsheet.options.footnotes || null)<% } else { %>null<% } %>
  });
<% if (features.bertha) { %>  footerView.strings.graphicType = spreadsheet.options.graphictype || footerView.strings.graphicType;<% } %>
  footerView.render();
  <% } %>

  /* ADD INTERACTIVITY HERE! */









<% if (projectType === 'embedded') { %>

  // Make sure all rendered links open in a new tab
  iframeUtils.targetLinks('_blank');<%} %>

  // Now unhide everything by removing the `invisible` class from the body
  document.body.className = document.body.className.replace(/\binvisible\b/, '');<% if (projectType === 'embedded') { %>

  // Resize the iframe to equal the content of this page
  iframeUtils.resizeParentFrameToContentSize();

  /*
    Alternative iframe resizing method: iframeUtils.resizeZeroParentFrameValuesToContent();
    This method sets the width and height attributes on the iframe, but only if they are currently empty/zero.
  */<% } %>
});
