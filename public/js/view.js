/*global qs, qsa, $on, $parent, $live */

(function (window) {
  'use strict';

  function View(template) {
    this.template = template;

    this.$playlist = qs('#playlist');
    this.$videoURL = qs('#video-url');
    this.$clearCompleted = qs('#clear-completed');
    this.$addVideo = qs('#add-video');
    this.$errorMsg = qs('#error-msg');
    this.$play = qs('#play');
    this.$pause = qs('#pause');
    this.$stop = qs('#stop');
    this.$fastBackward = qs('#fast-backward');
    this.$backward = qs('#backward');
    this.$forward = qs('#forward');
    this.$fastForward = qs('#fast-forward');
    this.$mute = qs('#mute');
    this.$unmute = qs('#unmute');
    this.$qrCode = qs('#qr-code');
  }

  View.prototype._removeItem = function (id) {
    var elem = qs('[data-id="' + id + '"]');

    if (elem) {
      this.$playlist.removeChild(elem);
    }
  };

  View.prototype._setActive = function(id) {
    var elem = qs('[data-id="' + id + '"]');

    if (elem) {
      elem.className += ' ' + 'active';
      Array.prototype.filter.call(elem.parentNode.children, function(child){
        if (child !== elem) {
          child.classList.remove('active');
        }
        return child !== elem;
      });
    }
  };

  View.prototype.render = function (viewCmd, parameter) {
    var that = this;
    var viewCommands = {
      showEntries: function () {
        that.$playlist.innerHTML = that.template.show(parameter);
        // TODO: probrably dulplicated
        that._setActive(parameter);
      },
      showQR: function () {
        that.$qrCode.innerHTML = '<img class="visible-md-inline visible-lg-inline" src="https://chart.googleapis.com/chart?cht=qr&amp;chs=96x96&chld=L|0&amp;chl=' + encodeURIComponent(location.href) + '"/>';
      },
      removeItem: function () {
        that._removeItem(parameter);
      },
      setActive: function() {
        that._setActive(parameter);
      },
      clearURL: function () {
        that.$videoURL.value = '';
        that.$errorMsg.removeAttribute('class');
        that.$errorMsg.removeAttribute('role');
        that.$errorMsg.innerHTML = '';
      },
      showError: function() {
        that.$errorMsg.className = 'alert alert-danger text-center';
        that.$errorMsg.setAttribute('role', 'alert');
        that.$errorMsg.innerHTML = 'Invalid YouTube Video ID';
      }
    };

    viewCommands[viewCmd]();
  };

  View.prototype._itemId = function (element) {
    var li = $parent(element, 'li');
    return parseInt(li.dataset.id, 10);
  };

  View.prototype.bind = function (event, handler) {
    var that = this;
    if (event === 'selectVideo') {
      $live('#playlist li', 'click', function () {
        handler({id: parseInt(this.dataset.id, 10)});
      });
    } else if (event === 'removeCompleted') {
      $on(that.$clearCompleted, 'click', function () {
        handler();
      });
    } else if (event === 'itemRemove') {
      $live('#playlist .destroy', 'click', function () {
        handler({id: that._itemId(this)});
      });

    } else if (event === 'addVideo') {
      $on(that.$addVideo, 'click', function() {
        handler(that.$videoURL.value);
      })
    } else if (event === 'play') {
      $on(that.$play, 'click', function () {
        handler();
      });
    } else if (event === 'pause') {
      $on(that.$pause, 'click', function () {
        handler();
      });
    } else if (event === 'stop') {
      $on(that.$stop, 'click', function () {
        handler();
      });
    } else if (event === 'fastBackward') {
      $on(that.$fastBackward, 'click', function () {
        handler();
      });
    } else if (event === 'backward') {
      $on(that.$backward, 'click', function () {
        handler();
      });
    } else if (event === 'forward') {
      $on(that.$forward, 'click', function () {
        handler();
      });
    } else if (event === 'fastForward') {
      $on(that.$fastForward, 'click', function () {
        handler();
      });
    } else if (event === 'mute') {
      $on(that.$mute, 'click', function () {
        handler();
      });
    } else if (event === 'unmute') {
      $on(that.$unmute, 'click', function () {
        handler();
      });
    }
  };

  // Export to window
  window.app = window.app || {};
  window.app.View = View;
}(window));
