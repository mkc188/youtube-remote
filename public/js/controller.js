(function (window) {
  'use strict';

  var playing = null;
  var paused = null;
  var socket = null;

  function Controller(model, view) {

    var that = this;
    that.model = model;
    that.view = view;

    that.view.bind('selectVideo', function (item) {
      that.selectVideo(item.id);
      that.model.read({
        id: item.id
      }, function (data) {
        socket.emit('select-video', data[0].vid);
      });
    });

    that.view.bind('addVideo', function (vid) {
      that.addItem(vid);
      socket.emit('add-video', vid);
    });

    that.view.bind('itemRemove', function (item) {
      that.model.read({
        id: item.id
      }, function (data) {
        socket.emit('item-remove', data[0].vid);
      });
      that.removeItem(item.id);
    });

    that.view.bind('removeCompleted', function () {
      that.removeCompletedItems();
      socket.emit('remove-completed');
    });

    that.view.bind('play', function () {
      that.playVideo();
      socket.emit('control', 'play');
    });
    that.view.bind('pause', function () {
      that.pauseVideo();
      socket.emit('control', 'pause');
    });
    that.view.bind('stop', function () {
      that.stopVideo();
      socket.emit('control', 'stop');
    });
    that.view.bind('fastBackward', function () {
      that.prevVideo();
      socket.emit('control', 'fast-backward');
    });
    that.view.bind('backward', function () {
      that.backward();
      socket.emit('control', 'backward');
    });
    that.view.bind('forward', function () {
      that.forward();
      socket.emit('control', 'forward');
    });
    that.view.bind('fastForward', function () {
      that.nextVideo();
      socket.emit('control', 'fast-forward');
    });
    that.view.bind('mute', function () {
      that.mute();
      socket.emit('control', 'mute');
    });
    that.view.bind('unmute', function () {
      that.unMute();
      socket.emit('control', 'unmute');
    });


    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) {
        if (!that.player) {
          that.player = new YT.Player('player', {
            playerVars: {
              'controls': 0,
              'autoplay': 0,
              'html5': 1
            },
            videoId: '',
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
            }
          });
        }
      } else {
        if (that.player) {
          that.player.destroy();
          that.player = null;
        }
      }
    })

    window.onYouTubeIframeAPIReady = function () {
      if (window.innerWidth >= 992) {
        that.player = new YT.Player('player', {
          playerVars: {
            'controls': 0,
            'autoplay': 0,
            'html5': 1
          },
          videoId: '',
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
      }
    }

    function onPlayerReady(event) {}

    function onPlayerStateChange(event) {
      if (event.data == YT.PlayerState.PLAYING) {
        playing = true;
      } else if (event.data == YT.PlayerState.PAUSED) {
        paused = true;
      } else {
        playing = false;
        paused = false;
      }
      if (event.data == YT.PlayerState.ENDED) {
        that.nextVideo();
      }
    }

    var sessionID = window.location.pathname.slice(9);
    socket = io('ws://' + window.location.hostname + ':8000/');

    var regSession = function () {
      socket.emit('register', sessionID, function (data) {
        if (parseInt(data)) {
          socket.once('sync-ack', function (data) {
            that.model.paste(data);
          });
        }
      });
    }

    socket.on('connect', regSession);
    socket.on('reconnect', regSession);
    socket.on('select-video', function (data) {
      that.selectVideoByVid(data);
    });
    socket.on('add-video', function (data) {
      that.addItem(data);
    });
    socket.on('item-remove', function (data) {
      that.removeItemByVid(data);
    });
    socket.on('remove-completed', function () {
      that.removeCompletedItems();
    });
    socket.on('control', function (data) {
      switch (data) {
      case 'play':
        that.playVideo();
        break;
      case 'pause':
        that.pauseVideo();
        break;
      case 'stop':
        that.stopVideo();
        break;
      case 'fast-backward':
        that.prevVideo();
        break;
      case 'backward':
        that.backward();
        break;
      case 'forward':
        that.forward();
        break;
      case 'fast-forward':
        that.nextVideo();
        break;
      case 'mute':
        that.mute();
        break;
      case 'unmute':
        that.unMute();
        break;
      }
    });

    socket.on('sync', function () {
      that.model.copy(function (data) {
        socket.emit('sync-ack', data);
      });
    });
    var connectFailed = function() {
      console.log("Failed to connect websocket server.");
    }
    socket.on('connect_failed', connectFailed);
    socket.on('reconnect_failed', connectFailed);
    socket.on('ws-error', function(data) {
      console.log(data);
      setTimeout(function() {
        socket.disconnect();
      }, 1000);
    });
  }

  Controller.prototype.setView = function (locationHash) {
    var that = this;
    var route = locationHash.split('/')[1];
    var page = route || '';
    this.showAll();
    that.view.render('showQR');
    that.model.read(function(data) {
      if (data.length) {
        that.model.setCurr(data[0].vid);
      }
    })
  };

  Controller.prototype.showAll = function () {
    var that = this;
    that.model.read(function (data) {
      that.view.render('showEntries', data);
    });
  };

  Controller.prototype.addItem = function (vid) {
    var that = this;

    this.view.render('clearURL');

    if (vid.trim() === '') {
      return;
    }

    vid = vid.match(/\b[a-zA-Z0-9_-]{11}\b/) || '';

    if (!vid) {
      this.view.render('showError');
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/video_title/' + vid, true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 400) {
        var res = JSON.parse(xhr.responseText);

        that.model.read({
          vid: vid[0]
        }, function (data) {
          if (!data.length) {
            that.model.create(vid[0], res.title, function () {
              that.showAll();
              that.setActive();
            });
          } else {
            return;
          }
        });
      } else {
        console.log(xhr.responseText);
        return;
      }
    };
    xhr.onerror = function () {
      console.log("Connection error");
      return;
    };
    xhr.send();

  };

  Controller.prototype.removeItem = function (id) {
    var that = this;
    that.model.read({
      id: id
    }, function (data) {
      that.model.getCurr(function (curr) {
        if (curr !== data[0].vid) {
          that.model.remove(id, function () {
            that.view.render('removeItem', id);
          });
        } else if (!playing) {
          // TODO: clear all on mobile client
          that.model.remove(id, function () {
            that.view.render('removeItem', id);
          });
          that.model.setCurr('');
        }
      })
    });
  };

  Controller.prototype.removeItemByVid = function (vid) {
    var that = this;
    that.model.read({
      vid: vid
    }, function (data) {
      that.model.getCurr(function (curr) {
        if (curr !== data[0].vid) {
          that.model.remove(data[0].id, function () {
            that.view.render('removeItem', data[0].id);
          });
        } else if (!playing) {
          that.model.remove(data[0].id, function () {
            that.view.render('removeItem', data[0].id);
          });
          that.model.setCurr('');
        }
      })
    });
  };

  Controller.prototype.setActive = function (id) {
    var that = this;
    if (id) {
      that.view.render('setActive', id);
    } else {
      that.model.getCurr(function (curr) {
        that.model.read({
          vid: curr
        }, function (data) {
          if (data.length) that.view.render('setActive', data[0].id);
        });
      });
    }
  };

  Controller.prototype.removeCompletedItems = function () {
    var that = this;
    that.model.read({
      completed: true
    }, function (data) {
      data.forEach(function (item) {
        that.removeItem(item.id);
      });
    });
  };

  Controller.prototype.nextVideo = function () {
    var that = this;
    that.model.nextVID(function (vid) {
      if (vid) {
        if (that.player) that.player.loadVideoById(vid);
        that.model.setCurr(vid);
        that.model.read({
          vid: vid
        }, function (data) {
          that.setActive(data[0].id);
        });
      }
    })
  };

  Controller.prototype.prevVideo = function () {
    var that = this;
    that.model.prevVID(function (vid) {
      if (vid) {
        if (that.player) that.player.loadVideoById(vid);
        that.model.setCurr(vid);
        that.model.read({
          vid: vid
        }, function (data) {
          that.setActive(data[0].id);
        });
      }
    })
  };

  Controller.prototype.selectVideo = function (id) {
    var that = this;
    that.model.read({
      id: id
    }, function (data) {
      if (that.player) that.player.loadVideoById(data[0].vid);
      that.model.setCurr(data[0].vid);
      that.setActive(id);
    });
  }

  Controller.prototype.selectVideoByVid = function (vid) {
    var that = this;
    that.model.read({
      vid: vid
    }, function (data) {
      if (that.player) that.player.loadVideoById(data[0].vid);
      that.model.setCurr(data[0].vid);
      that.setActive(data[0].id);
    });
  }

  Controller.prototype.playVideo = function (vid) {
    var that = this;
    if (vid) {
      that.model.read({
        vid: vid
      }, function (data) {
        if (that.player) that.player.loadVideoById(data[0].vid);
        that.setActive(data[0].id);
      });
    } else if (paused) {
      if (that.player) that.player.playVideo();
    } else if (!playing) {
      that.model.read(function(data) {
        if (data.length) {
          if (that.player) that.player.loadVideoById(data[0].vid);
          that.setActive(data[0].id);
          that.model.setCurr(data[0].vid);
        }
      });
    }
  };

  Controller.prototype.pauseVideo = function () {
    var that = this;
    if (that.player) {
      that.player.pauseVideo();
    }
  };

  Controller.prototype.stopVideo = function () {
    var that = this;
    if (that.player) {
      that.player.seekTo(0);
      that.player.stopVideo();
      that.model.read(function(data) {
        if (data.length) {
          that.model.setCurr(data[0].vid);
        }
      })
      that.showAll();
    }
  };

  Controller.prototype.backward = function () {
    var that = this;
    if (that.player && (playing || paused)) {
      var currentTime = that.player.getCurrentTime();
      that.player.seekTo(currentTime - 2.0);
    }
  };

  Controller.prototype.forward = function () {
    var that = this;
    if (that.player && (playing || paused)) {
      var currentTime = that.player.getCurrentTime();
      that.player.seekTo(currentTime + 2.0);
    }
  };

  Controller.prototype.mute = function () {
    var that = this;
    if (that.player) {
      that.player.mute();
    }
  };

  Controller.prototype.unMute = function () {
    var that = this;
    if (that.player) {
      that.player.unMute();
    }
  };

  // Export to window
  window.app = window.app || {};
  window.app.Controller = Controller;
})(window);
