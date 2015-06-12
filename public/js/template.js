/*jshint laxbreak:true */
(function (window) {
  'use strict';

  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#x27;',
    '`': '&#x60;'
  };

  var escapeHtmlChar = function (chr) {
    return htmlEscapes[chr];
  };

  var reUnescapedHtml = /[&<>"'`]/g,
      reHasUnescapedHtml = new RegExp(reUnescapedHtml.source);

  var escape = function (string) {
    return (string && reHasUnescapedHtml.test(string))
      ? string.replace(reUnescapedHtml, escapeHtmlChar)
      : string;
  };

  function Template() {
    this.defaultTemplate
    = '<li data-id="{{id}}" class="list-group-item clearfix btn">'
    +   '{{vid}}: {{title}} <span class="destroy glyphicon glyphicon-remove-sign pull-right" aria-hidden="true"></span>'
    + '</li>'
  }

  Template.prototype.show = function (data) {
    var i, l;
    var view = '';

    for (i = 0, l = data.length; i < l; i++) {
      var template = this.defaultTemplate;

      template = template.replace('{{id}}', data[i].id);
      template = template.replace('{{vid}}', data[i].vid);
      template = template.replace('{{title}}', escape(data[i].title));

      view = view + template;
    }

    return view;
  };

  // Export to window
  window.app = window.app || {};
  window.app.Template = Template;
})(window);
