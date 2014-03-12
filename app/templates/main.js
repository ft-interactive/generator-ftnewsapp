/*global app<% if (flavour !== 'jquery') { %>, domready<% } %> */

'use strict';
<% if (features.handlebars) { %>
require('ig-utils/js/handlebars-utils');<% } %>
require('./boilerplate');
// var iframeUtils = require('ig-utils/js/iframe-utils');

app.views.main.render = function() {

  var html = this.model ? <% if (features.handlebars) { %>this.template(this.model)<% } else { %>''<% } %> : this.messages.no_data;

<% if (flavour === 'jquery') { %>
  this.$el.html(html);
<% } else { %>
  this.el.innerHTML = html;
<% } %>
<% if (projectType === 'embedded') { %>
  /**
  * IFRAME RESIZING OPTION 1
  * Set the size of the iframe to equal the content of this page.
  */
  // iframeUtils.resizeParentFrameToContentSize();

  /**
  * IFRAME RESIZING OPTION 2
  * Sets the size of the iframe along the sides
  * that have not been set on the parent document - i.e it will never override
  * the iframe's explicitly defined dimensions (unless it's 0px).

  * For more, see code docs:
  * /bower_components/ig-utils/js/iframe-utils.js
  */
  // iframeUtils.resizeZeroParentFrameValuesToContent();
<% } %>
  return this;
};


<% if (flavour === 'jquery') { %>$<% } else { %>domready<% } %>(function () {<% if (projectType === 'microsite') { %>
  require('fastclick')(document.body);
  <% } %>

  // Render the main view (see above)
  app.views.main.render();

  // Now the view has been rendered, unhide the content
  // by removing the `invisible` class from the body.<% if (flavour === 'jquery') { %>
  $('body').removeClass('invisible');
  <% } else if (flavour === 'd3') { %>
  d3.select('body').classed('invisible', false);
  <% } else { %>
  document.body.className = document.body.className.replace(/\binvisible\b/, '');
  <% } %>
});
