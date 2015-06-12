(function (window) {
  'use strict';

  function Model(storage) {
    this.storage = storage;
  }

  Model.prototype.create = function (vid, title, callback) {
    vid = vid || '';
    title = title || '';
    callback = callback || function () {};

    var newItem = {
      vid: vid.trim(),
      title: title.trim(),
      completed: true
    };

    this.storage.save(newItem, callback);
  };

  Model.prototype.read = function (query, callback) {
    var queryType = typeof query;
    callback = callback || function () {};

    if (queryType === 'function') {
      callback = query;
      return this.storage.findAll(callback);
    } else if (queryType === 'string' || queryType === 'number') {
      query = parseInt(query, 10);
      this.storage.find({ id: query }, callback);
    } else {
      this.storage.find(query, callback);
    }
  };

  Model.prototype.update = function (id, data, callback) {
    this.storage.save(data, callback, id);
  };

  Model.prototype.remove = function (id, callback) {
    this.storage.remove(id, callback);
  };

  Model.prototype.removeAll = function (callback) {
    this.storage.drop(callback);
  };

  Model.prototype.getCurr = function(callback) {
    this.storage.getCurr(callback);
  };

  Model.prototype.setCurr = function(vid) {
    this.storage.setCurr(vid);
  };

  Model.prototype.nextVID = function(callback) {
    this.storage.nextVID(callback);
  };

  Model.prototype.prevVID = function(callback) {
    this.storage.prevVID(callback);
  };

  Model.prototype.copy = function(callback) {
    this.storage.copy(callback);
  };

  Model.prototype.paste = function(data) {
    this.storage.paste(data);
  };

  // Export to window
  window.app = window.app || {};
  window.app.Model = Model;
})(window);
