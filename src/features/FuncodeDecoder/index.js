"use client";

import React from "react";
import PropTypes from "prop-types";
import { getDeviceId } from "./getDeviceId";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import havePropsChanged from "./havePropsChanged";

var _extends =
  Object.assign ||
  function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

var _class, _temp;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return call && (typeof call === "object" || typeof call === "function")
    ? call
    : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError(
      "Super expression must either be null or a function, not " +
        typeof superClass
    );
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (superClass)
    Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      : (subClass.__proto__ = superClass);
}

var Component = React.Component;

// var createBlob = import('./createBlob');

// Require adapter to support older browser implementations
import("webrtc-adapter");

// Props that are allowed to change dynamicly
var propsKeys = ["delay", "legacyMode", "facingMode"];

let skipCountDown = 0;
const deployHosts = {
  // 填入host
  dev: "",
  stage: "",
  prod: "",
};
const defaultStartupcodes = {
  // 填入啟動碼
  dev: "",
  stage: "",
  prod: "",
};
const baseurii = "https://funaccount.azurewebsites.net";
const state = {
  ifc: 0,
  btc: localStorage.getItem("_fc_btc") || "",
  jwt: localStorage.getItem("_fc_jwt") || "",
  lit: localStorage.getItem("_fc_lit") || "",
  did: "",
  rem: parseInt(localStorage.getItem("_fc_rem") || 0),
  set: (n, v) => {
    state[n] = v;
    localStorage.setItem(`_fc_${n}`, v);
  },
  remove: (n) => {
    state[n] = n !== "rem" ? "" : 0;
    localStorage.removeItem(`_fc_${n}`);
  },
  add: (n) => {
    state.rem += n;
    console.log(state.rem);
    localStorage.setItem("_fc_rem", state.rem);
    return state.rem;
  },
  decoderReady: false,
  workerReady: false,
  busy: false,
  lastPostMessage: performance.now(),
  workerQueue: [],
};
const funDecoder = {
  busy: function () {
    return state.busy;
  },
  ready: function () {
    return (
      state.jwt &&
      state.lit &&
      state.rem > 0 &&
      state.decoderReady &&
      state.workerReady
    );
  },
  decode: function (image) {
    state.busy = true;
    if (!funDecoder.ready()) {
      console.log("decoder not ready...");
      state.busy = false;
    } else {
      if (this.worker && skipCountDown === 0) {
        state.lastPostMessage = performance.now();
        this.worker.postMessage(image, [image.data.buffer]);
      } else {
        if (skipCountDown > 0) {
          console.log("skipCountDown", skipCountDown);
          skipCountDown = skipCountDown - 1;
        }
        state.busy = false;
      }
    }
  },
  terminate: function () {
    console.log("Module terminate...");
    state.workerReady = false;
    state.decoderReady = false;
    this.worker.terminate();
  },
};

// 取得 Device ID
async function getDeviceIdByFingerprint() {
  if (state.did) {
    return state.did;
  } else {
    const fp = await FingerprintJS.load();
    const { visitorId } = await fp.get();
    state.set("did", visitorId);
    return visitorId;
  }
}
// 用啟動碼取得 JWT
async function getJwt(account) {
  if (state.jwt) {
    return state.jwt;
  } else {
    return await fetch(`${baseurii}/api/v2/wal/Login`, {
      method: "POST",
      body: JSON.stringify({ account, deviceid: state.did }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => {
        if (response.ok) {
          state.set("btc", btoa(account));
          return response.json();
        } else {
          return { returnCode: -1, msg: "startup code login fail." };
        }
      })
      .then((json) => {
        if (json.returnCode === 0 && json.access_token) {
          state.set("jwt", json.access_token);
        } else {
          state.remove("btc");
          state.remove("jwt");
          console.error(json.msg);
        }
        return json.access_token || "";
      })
      .catch((err) => {
        state.remove("btc");
        state.remove("jwt");
        console.error(err);
        alert(err);
      });
  }
}

function determineStartupCode() {
  if (this.props.startupcode !== "default") return this.props.startupcode;
  let startupcode;
  switch (window.location.hostname) {
    case deployHosts.dev:
      startupcode = defaultStartupcodes.dev;
      break;
    case deployHosts.stage:
      startupcode = defaultStartupcodes.stage;
      break;
    case deployHosts.prod:
      startupcode = defaultStartupcodes.prod;
      break;
    default:
      startupcode = "guandamachinelocal";
      break;
  }
  return startupcode;
}

// 取得 license 字串
async function getLicenseStr(jwt, licenseStr, deviceId) {
  const startupcode = determineStartupCode.bind(this)();
  fetch(`${baseurii}/api/v2/License`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: licenseStr || "", did: deviceId || "" }),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        return { returnCode: -1, msg: "put lic error." };
      }
    })
    .then((json) => {
      if (json.returnCode === 0 && json.data) {
        const result = JSON.parse(json.data);
        state.set("lit", result.t);
        state.set("rem", result.rem);
        if (this.worker) {
          if (state.decoderReady) {
            _postDecodeWorker.bind(this)({ act: "setLit", lit: result.t });
          } else {
            _postDecodeWorker.bind(this)({
              act: "init",
              startupcode,
              host: window.location.host,
              did: state.did,
              lit: state.lit,
            });
          }
        }
      } else {
        state.remove("rem");
      }
    })
    .catch((err) => {
      console.error("worker.error>", err);
    });
}

async function syncLit() {
  const startupcode = determineStartupCode.bind(this)();
  const deviceId = await getDeviceIdByFingerprint();
  const jwt = await getJwt(startupcode);
  if (state.rem <= 0) {
    if (state.decoderReady) {
      _postDecodeWorker.bind(this)({ act: "getLit" });
    } else {
      console.log("syncLit觸發getlicnese");
      getLicenseStr.bind(this)(jwt, state.lit || "", deviceId);
    }
  } else if (!state.decoderReady) {
    _postDecodeWorker.bind(this)({
      act: "init",
      startupcode,
      host: window.location.host,
      did: state.did,
      lit: state.lit,
    });
  }
}

//從元件post到worker的訊息
function _postDecodeWorker(msg) {
  if (this.worker) {
    if (state.workerReady) {
      this.worker.postMessage(msg);
      if (this.props.debug) {
        console.log(`post[${msg.act}]`);
      }
    } else {
      state.workerQueue.push(msg);
      if (this.props.debug) {
        console.log(`queue[${msg.act}]`);
      }
    }
  }
}

export default ((_temp = _class =
  (function (_Component) {
    _inherits(Reader, _Component);

    function Reader(props) {
      _classCallCheck(this, Reader);

      var _this = _possibleConstructorReturn(
        this,
        (Reader.__proto__ || Object.getPrototypeOf(Reader)).call(this, props)
      );

      _this.els = {};

      _this.state = {
        mirrorVideo: false,
        constraints: {
          facingMode: { ideal: "environment" },
          frameRate: { ideal: 25, min: 10 },
          zoom: this.props.zoom,
          zoomInRatio: this.props.defaultZoomInRatio,
        },
        trackSupportedConstraints: {
          zoom: false,
        },
        trackCapabilities: {
          max: 100,
          min: 0,
          step: 0.1,
        },

        // Bind function to the class
      };
      _this.initiate = _this.initiate.bind(_this);
      _this.initiateLegacyMode = _this.initiateLegacyMode.bind(_this);
      _this.check = _this.check.bind(_this);
      _this.handleVideo = _this.handleVideo.bind(_this);
      _this.handleLoadStart = _this.handleLoadStart.bind(_this);
      _this.handleInputChange = _this.handleInputChange.bind(_this);
      _this.clearComponent = _this.clearComponent.bind(_this);
      _this.handleReaderLoad = _this.handleReaderLoad.bind(_this);
      _this.openImageDialog = _this.openImageDialog.bind(_this);
      _this.setRefFactory = _this.setRefFactory.bind(_this);
      return _this;
    }

    _createClass(Reader, [
      {
        key: "componentDidMount",
        value: async function componentDidMount() {
          // Bug fix: https://stackoverflow.com/questions/56672205/how-to-create-worker-in-react
          // wasm檔 & js檔只能放在public下，否則指引不到
          function onError(err) {
            console.error(err);
            alert(err);
          }

          function handleWorkerResponseMessage(e) {
            console.log("decode_worker回傳的訊息", e);
            if (e.data.code >= 0) {
              if (e.data.act === "decode") {
                state.busy = false;
                if (this.props.debug) {
                  document.querySelector(
                    ".decode-time"
                  ).innerText = `解碼所需時間: ${Math.round(
                    performance.now() - state.lastPostMessage
                  )} 毫秒`;
                }

                if (e.data.msg !== "") {
                  if (state.add(-1) <= 0) {
                    syncLit.bind(this)();
                  }
                  this.props.onScan(e.data.msg);
                }
                if (
                  !this.props.legacyMode &&
                  typeof this.props.delay == "number" &&
                  this.worker
                ) {
                  this.timeout = setTimeout(this.check, this.props.delay);
                }
              } else if (e.data.act === "getLit") {
                console.log("getLit去觸發getlicnese");
                getLicenseStr.bind(this)(state.jwt, state.lit, state.did);
              } else if (e.data.act === "setLit") {
                if (state.ifc > 0) {
                  state.ifc = 0;
                }
              } else if (e.data.act === "init") {
                if (e.data.msg === "decoder ready.") {
                  state.decoderReady = true;
                  state.ifc = 0;
                }
                // } else if (e.data.act === 'terminate') {
                //     this.worker.terminate();
              } else if (e.data.act === "decodemonitor") {
                if (this.props.debug) {
                  console.log("decodemonitor: ", e.data.msg);
                }
              } else if (e.data.act === "loaded") {
                state.workerReady = true;
                while (state.workerQueue.length > 0) {
                  const msg = state.workerQueue.shift();
                  _postDecodeWorker.call(this, msg);
                }
              }
            } else {
              //若Error 嘗試更新license 幾次
              if (state.ifc < 3) {
                state.ifc = state.ifc + 1;
                console.log("state.ifc小於3去觸發getlicnese");
                getLicenseStr.bind(this)(state.jwt, state.lit, state.did);
              }
            }
            // if (e.data.msg !== '' && this.props.debug) {
            // 		console.log(`[${e.data.act}]${e.data.msg}`);
            // }
          }

          // 優先使用從 app.js 載入的 decoder 檔案
          if (window.Worker) {
            this.worker = new Worker(
              `${process.env.PUBLIC_URL}/funcodeDecoder/decode_worker.js`,
              {
                type: "classic",
              }
            );
            this.worker.onmessage = handleWorkerResponseMessage.bind(this);
            this.worker.onerror = onError;
          } else {
            console.error("Worker not supported.");
            alert("Worker not supported.");
          }

          syncLit.bind(this)();
          // 當解碼器驗證通過後，才可以開始解析鏡頭的影像
          if (!this.props.legacyMode) {
            this.initiate();
          } else {
            this.initiateLegacyMode();
          }
        },
      },
      {
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(nextProps) {
          // React according to change in props
          var changedProps = havePropsChanged(this.props, nextProps, propsKeys);

          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (
              var _iterator = changedProps[Symbol.iterator](), _step;
              !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
              _iteratorNormalCompletion = true
            ) {
              var prop = _step.value;

              if (prop === "facingMode") {
                this.clearComponent();
                this.initiate(nextProps);
                break;
              } else if (prop === "delay") {
                if (this.props.delay === false && !nextProps.legacyMode) {
                  this.timeout = setTimeout(this.check, nextProps.delay);
                }
                if (nextProps.delay === false) {
                  clearTimeout(this.timeout);
                }
              } else if (prop === "legacyMode") {
                if (this.props.legacyMode && !nextProps.legacyMode) {
                  this.clearComponent();
                  this.initiate(nextProps);
                } else {
                  this.clearComponent();
                  this.componentDidUpdate = this.initiateLegacyMode;
                }
                break;
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        },
      },
      {
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState) {
          if (nextState !== this.state) {
            return true;
          }

          // Only render when the `propsKeys` have changed.
          var changedProps = havePropsChanged(this.props, nextProps, propsKeys);
          return changedProps.length > 0;
        },
      },
      {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          // Stop web-worker and clear the component
          // if (this.worker) {
          // 	this.worker.terminate();
          // 	this.worker = undefined;
          // }
          this.clearComponent();
        },
      },
      {
        key: "clearComponent",
        value: function clearComponent() {
          // Remove all event listeners and variables
          if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
          }
          if (this.stopCamera) {
            this.stopCamera();
          }
          if (this.reader) {
            this.reader.removeEventListener("load", this.handleReaderLoad);
          }
          if (this.els.img) {
            this.els.img.removeEventListener("load", this.check);
          }
        },
      },
      {
        key: "initiate",
        value: function initiate() {
          var props =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : this.props;
          var onError = props.onError,
            facingMode = props.facingMode;
          var frameRate = this.state.constraints.frameRate;

          // Check browser facingMode constraint support
          // Firefox ignores facingMode or deviceId constraints

          var isFirefox = /firefox/i.test(navigator.userAgent);
          var supported = {};
          if (
            navigator.mediaDevices &&
            typeof navigator.mediaDevices.getSupportedConstraints === "function"
          ) {
            supported = navigator.mediaDevices.getSupportedConstraints();
          }

          var constraints = {};

          if (supported.facingMode) {
            constraints.facingMode = { ideal: facingMode };
          }
          if (supported.frameRate) {
            constraints.frameRate = { ...frameRate };
          }
          if (supported.zoom) {
            constraints.zoom = true;
          }

          var vConstraintsPromise =
            supported.facingMode || isFirefox
              ? Promise.resolve(props.constraints || constraints)
              : getDeviceId(facingMode).then(function (deviceId) {
                  return Object.assign(
                    {},
                    { deviceId: deviceId },
                    props.constraints
                  );
                });

          vConstraintsPromise
            .then(function (video) {
              return video;
            })
            .then(this.handleVideo)
            .catch(onError);
        },
      },
      {
        key: "handleVideo",
        value: async function handleVideo(video) {
          const stream = await navigator.mediaDevices.getUserMedia({ video });

          var preview = this.els.preview;

          // Preview element hasn't been rendered so wait for it.
          if (!preview) {
            return setTimeout(this.handleVideo, 200, stream);
          }

          // Handle different browser implementations of MediaStreams as src
          if ((preview || {}).srcObject !== undefined) {
            preview.srcObject = stream;
          } else if (preview.mozSrcObject !== undefined) {
            preview.mozSrcObject = stream;
          } else if (window.URL.createObjectURL) {
            preview.src = window.URL.createObjectURL(stream);
          } else if (window.webkitURL) {
            preview.src = window.webkitURL.createObjectURL(stream);
          } else {
            preview.src = stream;
          }

          // IOS play in fullscreen
          preview.playsInline = true;

          var streamTrack = stream.getTracks()[0];
          // Assign `stopCamera` so the track can be stopped once component is cleared
          this.stopCamera = streamTrack.stop.bind(streamTrack);

          preview.addEventListener("loadstart", this.handleLoadStart);

          const [track] = ([window.track] = stream.getVideoTracks());
          const trackCapabilities = track.getCapabilities();
          const trackSetting = track.getSettings();

          if (!("zoom" in trackSetting)) {
            this.setState((state, props) => ({
              mirrorVideo: props.facingMode === "user",
              streamLabel: streamTrack.label,
            }));

            console.warn("Zoom is not supported by " + track.label);
            return;
          }

          const scaledZoom =
            trackCapabilities.zoom.min +
            (trackCapabilities.zoom.max - trackCapabilities.zoom.min) *
              this.state.constraints.zoomInRatio;

          try {
            await track.applyConstraints({
              advanced: [
                {
                  zoom: scaledZoom,
                },
              ],
            });
          } catch (err) {
            console.error("applyConstraints() failed: ", err);
          }

          // set ratio input range scale;
          const ratioInput = this.els?.ratioInput;
          if (ratioInput) {
            ratioInput.min = trackCapabilities.zoom.min;
            ratioInput.max = trackCapabilities.zoom.max;
            ratioInput.step = trackCapabilities.zoom.step;
            ratioInput.defaultValue = scaledZoom;
          }

          this.setState((state, props) => ({
            mirrorVideo: props.facingMode === "user",
            streamLabel: streamTrack.label,
            constraints: {
              ...state.constraints,
              zoom: scaledZoom,
            },
            trackSupportedConstraints: {
              ...state.trackSupportedConstraints,
              zoom: true,
            },
            trackCapabilities: {
              ...state.trackCapabilities,
              ...trackCapabilities.zoom,
            },
          }));
        },
      },
      {
        key: "handleLoadStart",
        value: function handleLoadStart() {
          var _props = this.props,
            delay = _props.delay,
            onLoad = _props.onLoad;
          var _state = this.state,
            mirrorVideo = _state.mirrorVideo,
            streamLabel = _state.streamLabel;

          var preview = this.els.preview;
          preview.play();

          if (typeof onLoad == "function") {
            onLoad({ mirrorVideo: mirrorVideo, streamLabel: streamLabel });
          }

          if (typeof delay == "number") {
            this.timeout = setTimeout(this.check, delay);
          }

          // Some browsers call loadstart continuously
          preview.removeEventListener("loadstart", this.handleLoadStart);
        },
      },
      {
        key: "check",
        value: function check() {
          var _props2 = this.props,
            legacyMode = _props2.legacyMode,
            resolution = _props2.resolution,
            delay = _props2.delay;
          var _els = this.els,
            preview = _els.preview,
            canvas = _els.canvas,
            img = _els.img;

          // Get image/video dimensions

          var width = Math.floor(
            legacyMode ? img.naturalWidth : preview?.videoWidth
          );
          var height = Math.floor(
            legacyMode ? img.naturalHeight : preview?.videoHeight
          );
          document.querySelector(
            ".decode-size"
          ).innerText = `寬: ${width} 高:${height}`;
          if (!width || !height) return;

          // Canvas draw offsets
          var hozOffset = 0;
          var vertOffset = 0;

          // Scale image to correct resolution
          if (legacyMode) {
            // Keep image aspect ratio
            var greatestSize = width > height ? width : height;
            var ratio = resolution / greatestSize;

            height = ratio * height;
            width = ratio * width;

            canvas.width = width;
            canvas.height = height;
          } else {
            // Crop image to fit 1:1 aspect ratio
            var smallestSize = width < height ? width : height;
            var _ratio = resolution / smallestSize;

            height = _ratio * height;
            width = _ratio * width;

            vertOffset = ((height - resolution) / 2) * -1;
            hozOffset = ((width - resolution) / 2) * -1;

            canvas.width = resolution;
            canvas.height = resolution;
          }

          var previewIsPlaying =
            preview && preview.readyState === preview.HAVE_ENOUGH_DATA;

          if (legacyMode || previewIsPlaying) {
            var ctx = canvas.getContext("2d");

            ctx.drawImage(
              legacyMode ? img : preview,
              hozOffset,
              vertOffset,
              width,
              height
            );

            document.querySelector(
              ".decode-canvas-size"
            ).innerText = `Canvas寬: ${canvas.width} Canvas高:${canvas.height}`;
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Send data to web-worker
            funDecoder.decode.bind(this)(imageData);
          } else {
            // Preview not ready -> check later
            this.timeout = setTimeout(this.check, delay);
          }
        },
      },
      {
        key: "initiateLegacyMode",
        value: function initiateLegacyMode() {
          this.reader = new FileReader();
          this.reader.addEventListener("load", this.handleReaderLoad);
          this.els.img.addEventListener("load", this.check, false);

          // Reset componentDidUpdate
          this.componentDidUpdate = undefined;

          if (typeof this.props.onLoad == "function") {
            this.props.onLoad();
          }
        },
      },
      {
        key: "handleInputChange",
        value: function handleInputChange(e) {
          var selectedImg = e.target.files[0];
          this.reader.readAsDataURL(selectedImg);
        },
      },
      {
        key: "handleReaderLoad",
        value: function handleReaderLoad(e) {
          // Set selected image blob as img source
          this.els.img.src = e.target.result;
        },
      },
      {
        key: "openImageDialog",
        value: function openImageDialog() {
          // Function to be executed by parent in user action context to trigger img file uploader
          this.els.input.click();
        },
      },
      {
        key: "setRefFactory",
        value: function setRefFactory(key) {
          var _this2 = this;

          return function (element) {
            _this2.els[key] = element;
          };
        },
      },
      {
        key: "render",
        value: function render() {
          var _props4 = this.props,
            style = _props4.style,
            className = _props4.className,
            onImageLoad = _props4.onImageLoad,
            legacyMode = _props4.legacyMode,
            showViewFinder = _props4.showViewFinder,
            facingMode = _props4.facingMode,
            zoom = _props4.zoom,
            constraints = _props4.constraints;

          var containerStyle = {
            overflow: "hidden",
            position: "relative",
            width: "100%",
            paddingTop: "100%",
          };
          var hiddenStyle = { display: "none" };
          var previewStyle = {
            top: 0,
            left: 0,
            display: "block",
            position: "absolute",
            overflow: "hidden",
            width: "100%",
            height: "100%",
          };
          var videoPreviewStyle = _extends({}, previewStyle, {
            objectFit: "cover",
            transform: this.state.mirrorVideo ? "scaleX(-1)" : undefined,
          });
          var imgPreviewStyle = _extends({}, previewStyle, {
            objectFit: "scale-down",
          });
          var viewFinderStyle = {
            top: 0,
            left: 0,
            zIndex: 1,
            boxSizing: "border-box",
            border: "50px solid rgba(0, 0, 0, 0.3)",
            boxShadow: "inset 0 0 0 5px rgba(255, 0, 0, 0.5)",
            position: "absolute",
            width: "100%",
            height: "100%",
          };
          var buttonGroupStyle = {
            display: "flex",
            zIndex: 1000,
            position: "absolute",
            right: "50px",
            left: "50px",
            bottom: "6px",
            border: "none",
          };
          var inputRangeStyle = {
            height: "2rem",
            width: "100%",
            margin: "0.25rem",
            fontSize: "1.75rem",
            display: this.state.trackSupportedConstraints.zoom
              ? "block"
              : "none",
          };
          var barcodeScanLineStyle = {
            top: "50%",
            left: 0,
            zIndex: 1,
            boxSizing: "border-box",
            position: "absolute",
            width: "100%",
            height: "3px",
            transform: "translateY(-50%)",
            backgroundColor: "rgba(255, 0, 0, 0.5)",
          };

          const onRatioChange = async (e) => {
            const zoom = e.target.value;
            this.setState((state) => ({
              constraints: {
                ...state.constraints,
                zoom,
              },
            }));

            const track = window.track;
            try {
              await track.applyConstraints({
                advanced: [{ zoom }],
              });
            } catch (err) {
              console.error("applyConstraints() failed: ", err);
            }
          };

          return React.createElement(
            "section",
            { className: className, style: style },
            React.createElement(
              "section",
              { style: containerStyle },
              !legacyMode && showViewFinder
                ? React.createElement(
                    "div",
                    { style: viewFinderStyle },
                    React.createElement("div", { style: barcodeScanLineStyle })
                  )
                : null,
              legacyMode
                ? React.createElement("input", {
                    style: hiddenStyle,
                    type: "file",
                    accept: "image/*",
                    ref: this.setRefFactory("input"),
                    onChange: this.handleInputChange,
                  })
                : null,
              legacyMode
                ? React.createElement("img", {
                    style: imgPreviewStyle,
                    ref: this.setRefFactory("img"),
                    onLoad: onImageLoad,
                  })
                : React.createElement("video", {
                    style: videoPreviewStyle,
                    ref: this.setRefFactory("preview"),
                  }),
              React.createElement(
                "section",
                {
                  style: buttonGroupStyle,
                },
                React.createElement("input", {
                  style: inputRangeStyle,
                  type: "range",
                  ref: this.setRefFactory("ratioInput"),
                  onChange: onRatioChange,
                })
              ),
              React.createElement("canvas", {
                style: hiddenStyle,
                ref: this.setRefFactory("canvas"),
              })
            )
          );
        },
      },
    ]);

    return Reader;
  })(Component)),
(_class.propTypes = {
  onScan: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onLoad: PropTypes.func,
  onImageLoad: PropTypes.func,
  delay: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  facingMode: PropTypes.oneOf(["user", "environment"]),
  legacyMode: PropTypes.bool,
  resolution: PropTypes.number,
  showViewFinder: PropTypes.bool,
  style: PropTypes.any,
  className: PropTypes.string,
  zoomInRatio: PropTypes.any,
  constraints: PropTypes.object,
  startupcode: PropTypes.string,
  debug: PropTypes.bool,
}),
(_class.defaultProps = {
  delay: 500,
  resolution: 1600,
  facingMode: "environment",
  showViewFinder: true,
  defaultZoomInRatio: 0.5,
  constraints: null,
}),
_temp);
