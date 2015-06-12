(function () {
  'use strict';

  function YTR(name) {
    this.storage = new app.Store(name);
    this.model = new app.Model(this.storage);
    this.template = new app.Template();
    this.view = new app.View(this.template);
    this.controller = new app.Controller(this.model, this.view);
  }

  var ytr = new YTR('youtube-remote');

  function setView() {
    ytr.controller.setView(document.location.hash);
  }
  $on(window, 'load', setView);
  $on(window, 'hashchange', setView);

})();
