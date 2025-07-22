// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"2ruV":[function(require,module,exports) {
"use strict";

exports.__esModule = true;

var ScopeDrawBatch =
/** @class */
function () {
  function ScopeDrawBatch(_a) {
    var _this = this;

    var fps = (_a === void 0 ? {} : _a).fps;
    this.drawStack = [];
    this.stopCbk = null;

    if (fps) {
      this.draw = function () {
        _this.drawStack.map(function (f) {
          return f();
        });

        var handle = window.setTimeout(function () {
          return _this.draw();
        }, 1000 / fps);

        _this.stopCbk = function () {
          return clearTimeout(handle);
        };
      };
    } else {
      this.draw = function () {
        _this.drawStack.map(function (f) {
          return f();
        });

        var handle = window.requestAnimationFrame(function () {
          return _this.draw();
        });

        _this.stopCbk = function () {
          return cancelAnimationFrame(handle);
        };
      };
    }
  }

  ScopeDrawBatch.prototype.isDrawing = function () {
    return this.stopCbk !== null;
  };

  ScopeDrawBatch.prototype.toggle = function () {
    if (this.isDrawing()) {
      this.stop();
    } else {
      this.start();
    }
  };

  ScopeDrawBatch.prototype.add = function (f) {
    this.drawStack.push(f);
  };

  ScopeDrawBatch.prototype.start = function () {
    this.draw();
  };

  ScopeDrawBatch.prototype.stop = function () {
    this.stopCbk();
    this.stopCbk = null;
  };

  return ScopeDrawBatch;
}();

exports.ScopeDrawBatch = ScopeDrawBatch;

var ScopeRenderer =
/** @class */
function () {
  function ScopeRenderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.yPadding = 5; // Reduced padding for larger waveform display
  }

  ScopeRenderer.prototype.draw = function (sample) {
    var xPxPerTimeSample = Math.ceil(this.width / sample.data.length) + 2; // Background

    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw gridlines BEFORE the waveform
    this.drawGridlines();
    
    // Main x axis
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#555';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height / 2);
    this.ctx.lineTo(this.width, this.height / 2);
    this.ctx.stroke();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = 'red';
    this.ctx.beginPath();
    var sampleIdx = sample.triggerIndex; // display wave with first value aligned at magnitude 0

    for (var x = 0; sampleIdx < sample.data.length && x < this.width; sampleIdx++, x += xPxPerTimeSample) {
      // 0 => height, 128 => height/2, 255 => 0 - use minimal padding for maximum amplitude
      var magnitude = mapNumber(sample.data[sampleIdx], 0, 255, this.height - 5, 5);
      this.ctx.lineTo(x, magnitude);
    }

    this.ctx.stroke();
    
    // Display frequency information
    this.displayFrequencyInfo(sample);
    
    return this;
  };

  // Add gridlines for educational measurement
  ScopeRenderer.prototype.drawGridlines = function() {
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 1;
    this.ctx.font = '10px monospace';
    this.ctx.fillStyle = '#999';
    
    // Vertical gridlines (time divisions)
    var numVerticalLines = 10;
    var verticalSpacing = this.width / numVerticalLines;
    
    for (var i = 1; i < numVerticalLines; i++) {
      var x = i * verticalSpacing;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
      
      // Time labels (assuming 44.1kHz sample rate, 1024 samples)
      var timeMs = (i * 1024 / 44100 * 1000 / numVerticalLines).toFixed(1);
      this.ctx.fillText(timeMs + 'ms', x + 2, 12);
    }
    
    // Horizontal gridlines (amplitude divisions)
    var numHorizontalLines = 8;
    var horizontalSpacing = this.height / numHorizontalLines;
    
    for (var i = 1; i < numHorizontalLines; i++) {
      var y = i * horizontalSpacing;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
      
      // Amplitude labels (-1 to +1 range)
      var amplitude = (1 - (2 * i / numHorizontalLines)).toFixed(1);
      this.ctx.fillText(amplitude, 2, y - 2);
    }
  };

  // Display frequency estimation for educational purposes
  ScopeRenderer.prototype.displayFrequencyInfo = function(sample) {
    // Use triggering-based frequency measurement for stability
    var freq = this.measureFrequencyFromTrigger(sample);
    
    // Apply light smoothing only to display, not measurement
    if (!this.displayFreq) {
      this.displayFreq = freq;
    } else {
      // Much lighter smoothing since triggering provides stability
      this.displayFreq = 0.3 * freq + 0.7 * this.displayFreq;
    }
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('~' + this.displayFreq.toFixed(1) + ' Hz', this.width - 80, 20);
  };

  // Measure frequency using trigger points for hardware-like stability
  ScopeRenderer.prototype.measureFrequencyFromTrigger = function(sample) {
    var triggerLevel = 128; // Middle level (0V equivalent)
    var triggers = [];
    
    // Find all rising edge triggers
    for (var i = 1; i < sample.data.length - 1; i++) {
      if (sample.data[i-1] < triggerLevel && 
          sample.data[i] >= triggerLevel && 
          sample.data[i+1] > sample.data[i-1]) { // Ensure it's actually rising
        triggers.push(i);
      }
    }
    
    // Need at least 2 triggers to measure period
    if (triggers.length < 2) {
      return this.displayFreq || 0;
    }
    
    // Calculate average period from multiple cycles for accuracy
    var totalPeriod = 0;
    var validPeriods = 0;
    
    for (var i = 1; i < triggers.length; i++) {
      var period = triggers[i] - triggers[i-1];
      // Filter out obviously wrong periods (too short/long)
      if (period > 4 && period < sample.data.length / 2) {
        totalPeriod += period;
        validPeriods++;
      }
    }
    
    if (validPeriods === 0) {
      return this.displayFreq || 0;
    }
    
    var avgPeriodSamples = totalPeriod / validPeriods;
    var frequency = 44100 / avgPeriodSamples;
    
    return frequency;
  };

  return ScopeRenderer;
}();

exports.ScopeRenderer = ScopeRenderer; // TODO: auto leveling

var ScopeSampler =
/** @class */
function () {
  function ScopeSampler(ac) {
    this.ac = ac;
    this.input = ac.createGain();
    this.analyser = ac.createAnalyser(); // fftSize = 1024 => frequencyBinCount = 512; 12ms of data per refresh at 44.1Khz (1024/44100)

    this.analyser.fftSize = 1024;
    this.input.connect(this.analyser);
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  ScopeSampler.prototype.triggerIndex = function (data) {
    var triggerLevel = 128;
    var hysteresis = 4; // Prevent noise triggering
    
    // Look for a stable rising edge trigger
    for (var i = 2; i < data.length - 2; i++) {
      if (data[i-2] < triggerLevel - hysteresis &&
          data[i-1] < triggerLevel &&
          data[i] >= triggerLevel &&
          data[i+1] > triggerLevel &&
          data[i+2] > triggerLevel + hysteresis) {
        return i;
      }
    }

    // Fallback to simple trigger if no stable edge found
    for (var i = 1; i < data.length; i++) {
      if (data[i] >= triggerLevel && data[i - 1] < triggerLevel) {
        return i - 1;
      }
    }

    return 0;
  };

  ScopeSampler.prototype.sample = function () {
    this.analyser.getByteTimeDomainData(this.freqData);
    var triggerIndex = this.triggerIndex(this.freqData);
    return {
      data: this.freqData,
      triggerIndex: triggerIndex
    };
  };

  ScopeSampler.prototype.getInput = function () {
    return this.input;
  };

  return ScopeSampler;
}();

exports.ScopeSampler = ScopeSampler;

function mapNumber(num, in_min, in_max, out_min, out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
},{}]},{},["2ruV"], "Scope")
//# sourceMappingURL=/scope.js.map
