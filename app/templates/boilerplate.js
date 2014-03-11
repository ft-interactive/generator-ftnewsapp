<% if (features.furniture) { %>/*global Furniture:true */<%} %>

'use strict';
<% if (projectType === 'embedded') { %>
var iframeUtils = require('../bower_components/ig-utils/js/iframe-utils');
iframeUtils.setDocumentDomain();

/**
* This method makes sure all links open in a new tab.
* When using this you don't need to have target attributes
* on link (<a>) elements. Values: '_blank', '_top', '_parent'
*/
iframeUtils.targetLinks('_blank');
<% } %>

var app = window.app = window.app || {};

app.views = {};
<% if (features.furniture) { %>
app.views.furniture = {
  model: {
    credits: [],
    footnotes: null
  },
  render: function() {

    if (this.model) {
      Furniture.setCredits(this.model.credits);
      if (this.model.footnotes) {
        Furniture.setFootnotes(this.model.footnotes);
      }
    }

    return this;
  }
};
<%} %>
app.views.main = {
  messages: {
    no_data: 'Error loading data'
  },<% if (flavour === 'jquery') { %>
  $el: $('#main-content'),<% } else { %>
  el: document.getElementById('main-content'),<% } %><% if (features.handlebars) { %>
  template: require('../templates/main.hbs')<% } %>
};
<% if (features.bertha) { %>
// Spreadsheet data from Bertha is attached to app.
if (app.data) {
  app.views.main.model = app.data;<% if (features.furniture) { %>
  app.views.furniture.model = {
    credits: app.data.credits,
    footnotes: app.data.options && app.data.options.footnotes ? app.data.options.footnotes : null
  };<% } %>
}
<% } %><% if (features.furniture) { %>
app.views.furniture.render();<% } %>
