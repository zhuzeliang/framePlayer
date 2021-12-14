export default class FramePlayer {
  constructor(options) {
    if (!options) {
      console.log("请设置参数！");
      return;
    }
    const _this = this;
    //dom
    this.dom = options.dom;
    //开始帧
    this.startFrame = 0;
    //结束帧
    this.endFrame = options.imgArr.length - 1;
    //当前帧
    this.curFrame = 0;
    //上一帧
    this.prevFrame = 0;
    //fps
    this.fps = options.fps || 25;
    //是否canvas播放
    this.useCanvas = options.useCanvas ? true : false;
    //循环播放
    this.loop = options.loop || 0;
    //正序接倒序
    this.reverse = options.reverse ? true : false;
    //序列图实例
    this._imgObjArr = [];
    //监听事件
    this._events = {};
    //是否png
    this._isPng = true;
    //是否播放
    this._isPlay = false;
    //循环次数
    this._times = 0;
    //是否正序播放
    this._asc = true;
    //临时变量
    this._temp = {};

    for (let k in options.imgArr) {
      const img = new Image();
      img.src = options.imgArr[k];
      this._imgObjArr.push(img);
    }

    this.init();
  }

  init() {
    const _this = this;
    this.dom.textContent = "";

    if (_this.useCanvas) {
      let canvas = document.createElement("canvas");
      canvas.width = canvas.height = 0;
      canvas.style.width = canvas.style.height = "100%";
      this.ctx = canvas.getContext("2d");
      this.dom.appendChild(canvas);

      const setWH = function () {
        _this._isPng = /(\.png(\?|$))|(image\/png;base64)/.test(
          _this._imgObjArr[0].src
        );
        _this.width = canvas.width = _this._imgObjArr[0].width;
        _this.height = canvas.height = _this._imgObjArr[0].height;
      };

      this.loadImg(this._imgObjArr[0], setWH);
    } else {
      _this.mc = document.createElement("div");
      _this.mc.setAttribute("class", "mc");
      _this.mc.style.width = _this.mc.style.height = "100%";
      this.dom.appendChild(_this.mc);
      for (let i = 0; i < this._imgObjArr.length; i++) {
        this._imgObjArr[i].style.opacity = 0;
        this._imgObjArr[i].style.position = "absolute";
        this._imgObjArr[i].style.width = this._imgObjArr[i].style.height =
          "100%";
        this._imgObjArr[i].style.top = this._imgObjArr[i].style.left = 0;
        _this.mc.appendChild(this._imgObjArr[i]);
      }
    }
  }
  loadImg(imgObj, callback) {
    if (imgObj.complete) {
      callback();
    } else {
      imgObj.onload = function () {
        callback();
      };
    }
  }
  //设置参数
  set(attr, value) {
    var _temp = this._temp;
    if (arguments.length === 1 && typeof arguments[0] === "object") {
      for (var i in arguments[0]) {
        this[i] = arguments[0][i];
      }
    }
    if (arguments.length === 2) {
      this[arguments[0]] = arguments[1];
    }

    if (attr === "useCanvas") {
      this.init();
    }
    if (attr === "fps") {
      if (this._isPlay) {
        clearInterval(this._interval);
        this._process(_temp.onUpdate, _temp.onComplete);
      }
    }
    if (attr === "startFrame") {
      if (!this._isPlay) {
        this.curFrame = this.startFrame;
      }
    }
  }
  get(attr) {
    return this[attr];
  }
  //播放
  play(start, end, options) {
    if (this._isPlay) return;

    var _this = this;
    var argumentsNum = 0;
    var onComplete, onUpdate;

    for (var i in arguments) {
      switch (typeof arguments[i]) {
        case "number":
          if (argumentsNum == 0) {
            _this.set("startFrame", arguments[i]);
            argumentsNum++;
          } else {
            _this.set("endFrame", arguments[i]);
          }
          break;
        case "object":
          if (arguments[i].onComplete) onComplete = arguments[i].onComplete;
          delete arguments[i].onComplete;
          if (arguments[i].onUpdate) onUpdate = arguments[i].onUpdate;
          delete arguments[i].onUpdate;
          _this.set(arguments[i]);
          break;
      }
    }
    _this._temp.onComplete = onComplete;
    _this._temp.onUpdate = onUpdate;

    _this._asc = _this.startFrame < _this.endFrame;
    if (!_this._isPlay) this.trigger("play");

    this._process(onUpdate, onComplete);
  }
  _process(onUpdate, onComplete) {
    var _this = this;

    this._interval = setInterval(function () {
      if (_this._imgObjArr[_this.curFrame].complete) {
        if (_this.useCanvas) {
          if (_this._isPng)
            _this.ctx.clearRect(0, 0, _this.width, _this.height);
          _this.ctx.drawImage(
            _this._imgObjArr[_this.curFrame],
            0,
            0,
            _this.width,
            _this.height
          );
        } else {
          _this.mc.childNodes[_this.prevFrame].style.opacity = 0;
          _this.mc.childNodes[_this.curFrame].style.opacity = 1;
        }

        //保存本帧为上一帧
        _this.prevFrame = _this.curFrame;

        //update回调;
        // console.log(_this.curFrame,_this._times+1,_this._asc);
        _this.trigger("update", _this.curFrame, _this._times + 1, _this._asc);
        if (onUpdate) onUpdate(_this.curFrame, _this._times + 1, _this._asc);

        //当reverse为true时，如果当前帧等于开始或者结束帧 并且 不是第一次播放
        //当reverse为false时，如果当前帧等于开始或者结束帧 并且 没有进入过判断
        if (
          (_this.curFrame == _this.endFrame ||
            _this.curFrame == _this.startFrame) &&
          _this._isPlay &&
          !_this._temp.repeat
        ) {
          if (
            _this.loop &&
            (_this._times + 1 < _this.loop || _this.loop == -1)
          ) {
            if (_this.reverse) {
              if (_this._asc) {
                _this.curFrame = Math.max(_this.startFrame, _this.endFrame) - 1;
              } else {
                _this.curFrame = Math.min(_this.startFrame, _this.endFrame) + 1;
              }
              _this._asc = !_this._asc;
            } else {
              _this._temp.repeat = true;
              if (_this._asc) {
                _this.curFrame = Math.min(_this.startFrame, _this.endFrame);
              } else {
                _this.curFrame = Math.max(_this.startFrame, _this.endFrame);
              }
            }
            _this._times++;
          } else {
            _this.stop();
            if (onComplete) onComplete();
          }
        } else {
          if (_this._asc) {
            _this.curFrame++;
          } else {
            _this.curFrame--;
          }
          _this._isPlay = true;
          _this._temp.repeat = false;
        }
      }
    }, 1000 / this.fps);
  }
  goto(id) {
    const _this = this;
    this.curFrame = id;

    const show = function () {
      if (_this.useCanvas) {
        if (_this._isPng) _this.ctx.clearRect(0, 0, _this.width, _this.height);
        _this.ctx.drawImage(
          _this._imgObjArr[_this.curFrame],
          0,
          0,
          _this.width,
          _this.height
        );
      } else {
        _this.mc.childNodes[_this.prevFrame].style.opacity = 0;
        _this.mc.childNodes[_this.curFrame].style.opacity = 1;
      }
      _this.trigger("update", _this.curFrame, _this._times + 1, _this._asc);
    };

    loadImg(this._imgObjArr[this.curFrame], show);
  }
  pause() {
    this._isPlay = false;
    this.trigger("pause");
    clearInterval(this._interval);
  }
  stop() {
    this._isPlay = false;
    this.trigger("stop");
    this.curFrame = this.startFrame;
    clearInterval(this._interval);
    this._times = 0;
    // this.goto(this.startFrame);
  }
  on(events, handler) {
    events = events.split(" ");
    for (let i = 0; i < events.length; ++i) {
      if (!this._events[events[i]]) this._events[events[i]] = [];
      this._events[events[i]].unshift(handler);
    }
    //console.log("on", events, this._events)
    return this;
  }
  one(events, handler) {
    const _handler = function () {
      handler();
      this.off(events, _handler);
    };
    return this.on(events, _handler);
  }
  off(events, handler) {
    if (events) {
      events = events.split(" ");
      const _events = this._events;
      for (let i = 0; i < events.length; ++i) {
        if (!_events[events[i]]) continue;
        if (!handler) {
          _events[events[i]] = [];
        } else {
          for (let j = _events[events[i]].length - 1; j >= 0; --j) {
            if (_events[events[i]][j] == handler)
              _events[events[i]].splice(j, 1);
          }
        }
      }
    } else {
      this._events = {};
    }
    //console.log("off", events, this._events)
    return this;
  }
  trigger() {
    let events = Array.prototype.shift.call(arguments);
    events = events.split(" ");
    for (let i = 0; i < events.length; ++i) {
      if (this._events[events[i]]) {
        for (let j = this._events[events[i]].length - 1; j >= 0; --j) {
          try {
            this._events[events[i]][j].apply(this, arguments);
          } catch (e) {
            console.log(e);
          }
        }
      }
    }
    //console.log(events)
    return this;
  }
  destroy() {
    clearInterval(this._interval);
    this.off();
  }
}
