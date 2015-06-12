(function (window) {
  'use strict';

  function Store(name, callback) {
    callback = callback || function () {};

    this._dbName = name;

    if (!localStorage[name]) {
      var data = {
        playlist: [],
        idx: []
      };

      localStorage[name] = JSON.stringify(data);
    }

    callback.call(this, JSON.parse(localStorage[name]));
  }

  Store.prototype.find = function (query, callback) {
    if (!callback) {
      return;
    }

    var playlist = JSON.parse(localStorage[this._dbName]).playlist;

    callback.call(this, playlist.filter(function (video) {
      for (var q in query) {
        if (query[q] !== video[q]) {
          return false;
        }
      }
      return true;
    }));
  };

  Store.prototype.findAll = function (callback) {
    callback = callback || function () {};
    callback.call(this, JSON.parse(localStorage[this._dbName]).playlist);
  };

  Store.prototype.getCurr = function(callback) {
    callback = callback || function () {};
    var data = JSON.parse(localStorage[this._dbName]);
    var curr = data.curr;
    callback.call(this, curr);
  }

  Store.prototype.setCurr = function(vid) {
    var data = JSON.parse(localStorage[this._dbName]);
    data.curr = vid;
    localStorage[this._dbName] = JSON.stringify(data);
  }

  Store.prototype.nextVID = function(callback) {
    callback = callback || function () {};
    var data = JSON.parse(localStorage[this._dbName]);
    var idx = data.idx;
    var curr = data.curr;
    callback.call(this, idx[idx.indexOf(curr)+1]);
  }

  Store.prototype.prevVID = function(callback) {
    callback = callback || function () {};
    var data = JSON.parse(localStorage[this._dbName]);
    var idx = data.idx;
    var curr = data.curr;
    callback.call(this, idx[idx.indexOf(curr)-1]);
  }

  Store.prototype.save = function (updateData, callback, id) {
    var data = JSON.parse(localStorage[this._dbName]);
    var playlist = data.playlist;
    var idx = data.idx;

    callback = callback || function () {};

    // If an ID was actually given, find the item and update each property
    if (id) {
      for (var i = 0; i < playlist.length; i++) {
        if (playlist[i].id === id) {
          for (var key in updateData) {
            playlist[i][key] = updateData[key];
          }
          // TODO: vid break the capsulation
          idx[i] = updateData['vid'];
          break;
        }
      }

      localStorage[this._dbName] = JSON.stringify(data);
      callback.call(this, JSON.parse(localStorage[this._dbName]).playlist);
    } else {
      // Generate an ID
      updateData.id = new Date().getTime();

      playlist.push(updateData);
      idx.push(updateData.vid);
      localStorage[this._dbName] = JSON.stringify(data);
      callback.call(this, [updateData]);
    }
  };

  Store.prototype.remove = function (id, callback) {
    var data = JSON.parse(localStorage[this._dbName]);
    var playlist = data.playlist;
    var idx = data.idx;

    for (var i = 0; i < playlist.length; i++) {
      if (playlist[i].id == id) {
        playlist.splice(i, 1);
        idx.splice(i, 1);
        break;
      }
    }

    localStorage[this._dbName] = JSON.stringify(data);
    callback.call(this, JSON.parse(localStorage[this._dbName]).playlist);
  };

  Store.prototype.drop = function (callback) {
    localStorage[this._dbName] = JSON.stringify({playlist: [], idx: []});
    callback.call(this, JSON.parse(localStorage[this._dbName]).playlist);
  };

  Store.prototype.copy = function (callback) {
    callback = callback || function () {};
    callback.call(this, JSON.parse(localStorage[this._dbName]));
  };

  Store.prototype.paste = function (data) {
    localStorage[this._dbName] = JSON.stringify(data);
  };

  // Export to window
  window.app = window.app || {};
  window.app.Store = Store;
})(window);
