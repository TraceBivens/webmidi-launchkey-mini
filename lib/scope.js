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
    this.amplitudeMultiplier = 1; // Global amplitude control
    this.gridOffsetH = 0; // Horizontal grid offset for measurements
    this.gridOffsetV = 0; // Vertical grid offset for measurements
    this.timeResolution = 5; // ms per division
    this.triggerLevel = 0.0; // Manual trigger level
    this.triggerMode = 'auto'; // auto, normal, single
    this.lastTriggerTime = 0; // For single trigger mode
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

    // Use smooth curves instead of linear interpolation for better visual quality
    var prevX = 0;
    var prevY = this.height / 2;
    var isFirstPoint = true;
    
    for (var x = 0; sampleIdx < sample.data.length && x < this.width; sampleIdx++, x += xPxPerTimeSample) {
      // Float data is already in -1.0 to +1.0 range, apply amplitude multiplier
      var amplifiedSample = sample.data[sampleIdx] * this.amplitudeMultiplier;
      // Clamp to valid range
      amplifiedSample = Math.max(-1.0, Math.min(1.0, amplifiedSample));
      // Map from -1.0/+1.0 range to canvas coordinates
      var magnitude = mapNumber(amplifiedSample, -1.0, 1.0, this.height - 5, 5);
      
      if (isFirstPoint) {
        this.ctx.moveTo(x, magnitude);
        isFirstPoint = false;
      } else {
        // Use quadratic curves for smoother interpolation
        var cpX = (prevX + x) / 2;
        var cpY = (prevY + magnitude) / 2;
        this.ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
      }
      
      prevX = x;
      prevY = magnitude;
    }
    
    // Draw final segment to last point
    if (!isFirstPoint) {
      this.ctx.lineTo(prevX, prevY);
    }

    this.ctx.stroke();
    
    // Display frequency information
    this.displayFrequencyInfo(sample);
    
    return this;
  };

  // Add gridlines for educational measurement
  ScopeRenderer.prototype.drawGridlines = function() {
    this.ctx.strokeStyle = '#777';
    this.ctx.lineWidth = 1;
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = '#ccc';
    
    // Vertical gridlines (time divisions) - increased resolution
    var numVerticalLines = 20;
    var verticalSpacing = this.width / numVerticalLines;
    
    for (var i = 1; i < numVerticalLines; i++) {
      var x = i * verticalSpacing + this.gridOffsetH * verticalSpacing / 20;
      
      // Major gridlines every 5th line
      if (i % 5 === 0) {
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 1.5;
      } else {
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 0.8;
      }
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
      
      // Time labels only on major gridlines - relative to crosshair
      if (i % 5 === 0) {
        this.ctx.fillStyle = '#ddd';
        var divisionFromCenter = (i - 10) + this.gridOffsetH / 20;
        var relativeTimeMs = divisionFromCenter * this.timeResolution;
        var sign = relativeTimeMs >= 0 ? '+' : '';
        this.ctx.fillText(sign + relativeTimeMs.toFixed(1) + 'ms', x + 2, 15);
      }
    }
    
    // Horizontal gridlines (amplitude divisions) - increased resolution
    var numHorizontalLines = 16;
    var horizontalSpacing = this.height / numHorizontalLines;
    
    for (var i = 1; i < numHorizontalLines; i++) {
      var y = i * horizontalSpacing + this.gridOffsetV * horizontalSpacing / 16;
      
      // Major gridlines every 4th line
      if (i % 4 === 0) {
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 1.5;
      } else {
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 0.8;
      }
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
      
      // Amplitude labels only on major gridlines - relative to crosshair
      if (i % 4 === 0) {
        this.ctx.fillStyle = '#ddd';
        var divisionFromCenter = (i - 8) + this.gridOffsetV / 16;
        var relativeAmplitude = -divisionFromCenter * 0.25; // 0.25 units per division
        var sign = relativeAmplitude >= 0 ? '+' : '';
        this.ctx.fillText(sign + relativeAmplitude.toFixed(2), 4, y - 3);
      }
    }
    
    // Draw measurement crosshairs at center
    if (this.gridOffsetH !== 0 || this.gridOffsetV !== 0) {
      this.ctx.strokeStyle = '#ff0';
      this.ctx.lineWidth = 2;
      var centerX = this.width / 2 + this.gridOffsetH * verticalSpacing / 20;
      var centerY = this.height / 2 + this.gridOffsetV * horizontalSpacing / 16;
      
      // Vertical crosshair
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY - 20);
      this.ctx.lineTo(centerX, centerY + 20);
      this.ctx.stroke();
      
      // Horizontal crosshair
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 20, centerY);
      this.ctx.lineTo(centerX + 20, centerY);
      this.ctx.stroke();
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
    this.ctx.font = '16px monospace';
    this.ctx.fillText('~' + this.displayFreq.toFixed(1) + ' Hz', this.width - 90, 25);
  };

  // Measure frequency using trigger points for hardware-like stability
  ScopeRenderer.prototype.measureFrequencyFromTrigger = function(sample) {
    var triggerLevel = 0.0; // 0V equivalent for float data
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

  ScopeRenderer.prototype.setAmplitude = function(amplitude) {
    this.amplitudeMultiplier = amplitude;
  };

  ScopeRenderer.prototype.moveGrid = function(deltaH, deltaV) {
    this.gridOffsetH += deltaH;
    this.gridOffsetV += deltaV;
    // Limit grid movement to reasonable bounds with higher resolution
    this.gridOffsetH = Math.max(-100, Math.min(100, this.gridOffsetH));
    this.gridOffsetV = Math.max(-64, Math.min(64, this.gridOffsetV));
  };

  ScopeRenderer.prototype.resetGrid = function() {
    this.gridOffsetH = 0;
    this.gridOffsetV = 0;
  };

  ScopeRenderer.prototype.getGridPosition = function() {
    var timeMs = this.gridOffsetH * this.timeResolution / 20; // 20 divisions total (±10 from center)
    var amplitude = -this.gridOffsetV * 0.25 / 16; // Convert offset to amplitude with higher resolution
    return {
      timeMs: timeMs,
      amplitude: amplitude
    };
  };

  ScopeRenderer.prototype.setTimeResolution = function(msPerDiv) {
    this.timeResolution = msPerDiv;
  };

  ScopeRenderer.prototype.setTriggerLevel = function(level) {
    // Pass trigger level to the sampler
    // This is a bit of a hack since renderer shouldn't control sampler directly
    // but it works for this educational tool
    if (this.sampler) {
      this.sampler.setTriggerLevel(level);
    }
  };

  ScopeRenderer.prototype.setTriggerMode = function(mode) {
    if (this.sampler) {
      this.sampler.setTriggerMode(mode);
    }
  };

  ScopeRenderer.prototype.setSampler = function(sampler) {
    this.sampler = sampler;
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
    this.analyser = ac.createAnalyser(); // fftSize = 8192 => frequencyBinCount = 4096; 186ms of data per refresh at 44.1Khz (8192/44100)

    this.analyser.fftSize = 8192;
    this.input.connect(this.analyser);
    this.freqData = new Float32Array(this.analyser.frequencyBinCount);
  }

  ScopeSampler.prototype.triggerIndex = function (data, triggerLevel, triggerMode) {
    triggerLevel = triggerLevel || 0.0;
    triggerMode = triggerMode || 'auto';
    var hysteresis = 0.02; // Small hysteresis for float data
    
    // Single trigger mode - only trigger once per note
    if (triggerMode === 'single') {
      var now = Date.now();
      if (now - this.lastTriggerTime < 100) { // 100ms minimum between triggers
        return this.lastTriggerIndex || 0;
      }
    }
    
    var foundTrigger = -1;
    
    // Look for a stable rising edge trigger
    for (var i = 2; i < data.length - 2; i++) {
      if (data[i-2] < triggerLevel - hysteresis &&
          data[i-1] < triggerLevel &&
          data[i] >= triggerLevel &&
          data[i+1] > triggerLevel &&
          data[i+2] > triggerLevel + hysteresis) {
        foundTrigger = i;
        break;
      }
    }
    
    // Fallback to simple trigger if no stable edge found
    if (foundTrigger === -1) {
      for (var i = 1; i < data.length; i++) {
        if (data[i] >= triggerLevel && data[i - 1] < triggerLevel) {
          foundTrigger = i - 1;
          break;
        }
      }
    }
    
    // Auto mode: always return a trigger, even if at index 0
    if (triggerMode === 'auto' && foundTrigger === -1) {
      foundTrigger = 0;
    }
    
    // Normal/Single mode: only return valid triggers
    if (foundTrigger !== -1) {
      if (triggerMode === 'single') {
        this.lastTriggerTime = Date.now();
        this.lastTriggerIndex = foundTrigger;
      }
      return foundTrigger;
    }
    
    // No trigger found in normal mode - return last known good position
    return this.lastTriggerIndex || 0;
  };

  ScopeSampler.prototype.sample = function () {
    this.analyser.getFloatTimeDomainData(this.freqData);
    var triggerIndex = this.triggerIndex(this.freqData, this.triggerLevel, this.triggerMode);
    return {
      data: this.freqData,
      triggerIndex: triggerIndex
    };
  };

  ScopeSampler.prototype.setTriggerLevel = function(level) {
    this.triggerLevel = level;
  };

  ScopeSampler.prototype.setTriggerMode = function(mode) {
    this.triggerMode = mode;
    if (mode === 'single') {
      this.lastTriggerTime = 0; // Reset single trigger timing
    }
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
