// Renders an oscilloscope from a GainNode, using the Scope dependency.

function initOscilloscope({ Scope, audioContext, canvas }) {
  const scope = new Scope.ScopeSampler(audioContext);
  const input = scope.getInput();

  const scopeVis = new Scope.ScopeRenderer(canvas);
  // Link renderer and sampler for trigger control
  scopeVis.setSampler(scope);

  // Adaptive buffer size based on time resolution needs
  // Start with larger buffer to support longer time spans
  scope.analyser.fftSize = 32768;
  scope.freqData = new Float32Array(scope.analyser.frequencyBinCount);

  // Store original draw method for fallback
  const originalDraw = scopeVis.draw.bind(scopeVis);
  
  // Completely override the draw method to implement proper time resolution
  scopeVis.draw = function (sample) {
    // Real oscilloscope behavior: 20 divisions total (±10 from center)
    const totalTimeMs = 20 * this.timeResolution;
    const sampleRate = audioContext.sampleRate;
    const totalSamplesToDisplay = Math.floor((totalTimeMs / 1000) * sampleRate);
    
    // Perfect horizontal scaling - always use full screen width
    const pixelsPerSample = this.width / totalSamplesToDisplay;

    // Clear canvas
    this.ctx.fillStyle = "#111";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw gridlines BEFORE the waveform
    this.drawGridlines();

    // Main x axis
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "#555";
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height / 2);
    this.ctx.lineTo(this.width, this.height / 2);
    this.ctx.stroke();

    // STABLE OSCILLOSCOPE: Use Web Audio API's precise timing instead of buffer analysis
    // This eliminates jitter by using mathematical generation with stable timing
    
    const triggerMode = this.triggerMode || 'auto';
    const activeFrequencies = this.activeFrequencies || [];
    
    // CRITICAL FIX: Use FIXED phase reference to eliminate horizontal jitter
    // Initialize phase reference on first note or when frequencies change
    if (!this.phaseReference || this.frequenciesChanged) {
      this.phaseReference = audioContext.currentTime;
      this.frequenciesChanged = false;
    }
    
    const timeStep = (totalTimeMs / 1000) / totalSamplesToDisplay;
    
    // Get amplitude envelope from actual audio analysis (for realistic amplitude)
    let amplitudeEnvelope = 1.0;
    if (sample && sample.data && sample.data.length > 0) {
      // Calculate RMS amplitude from audio buffer for realistic envelope
      let rms = 0;
      for (let i = 0; i < sample.data.length; i++) {
        rms += sample.data[i] * sample.data[i];
      }
      amplitudeEnvelope = Math.sqrt(rms / sample.data.length) * 3; // Scale for visibility
    }

    // Draw waveform
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = "red";
    this.ctx.beginPath();

    let shouldDraw = true;

    // Handle trigger modes
    if (triggerMode === 'auto') {
      shouldDraw = activeFrequencies.length > 0;
    } else if (triggerMode === 'single') {
      // Single mode: capture mathematical waveform and hold
      if (!this.capturedMathWaveform && activeFrequencies.length > 0) {
        this.capturedMathWaveform = [];
        this.capturedFrequencies = [...activeFrequencies];
        this.capturedAmplitude = amplitudeEnvelope;
      }
      // Use captured data if available
      if (this.capturedMathWaveform) {
        shouldDraw = true;
      }
    } else if (triggerMode === 'normal') {
      shouldDraw = activeFrequencies.length > 0 && amplitudeEnvelope > (this.triggerLevel || 0.1);
    }

    if (shouldDraw) {
      let isFirstPoint = true;
      
      // Use captured frequencies for single mode, live frequencies otherwise
      const frequencies = (triggerMode === 'single' && this.capturedFrequencies) 
        ? this.capturedFrequencies 
        : activeFrequencies;
      const amplitude = (triggerMode === 'single' && this.capturedAmplitude) 
        ? this.capturedAmplitude 
        : amplitudeEnvelope;

      for (let i = 0; i < totalSamplesToDisplay; i++) {
        const time = this.phaseReference + (i * timeStep);
        let sampleValue = 0;

        if (frequencies.length > 0) {
          // Generate mathematically perfect waveform
          for (const freq of frequencies) {
            sampleValue += Math.sin(2 * Math.PI * freq * time);
          }
          // Normalize by number of frequencies and apply amplitude envelope
          sampleValue = (sampleValue / Math.max(1, frequencies.length)) * amplitude;
        }

        // Apply amplitude control
        const amplifiedSample = sampleValue * this.amplitudeMultiplier;
        const clampedSample = Math.max(-1.0, Math.min(1.0, amplifiedSample));

        // Map from -1.0/+1.0 range to canvas coordinates
        const x = i * pixelsPerSample;
        const y = ((clampedSample * -1 + 1) / 2) * (this.height - 10) + 5;

        if (isFirstPoint) {
          this.ctx.moveTo(x, y);
          isFirstPoint = false;
        } else {
          this.ctx.lineTo(x, y);
        }
      }
    }

    this.ctx.stroke();

    // Display active frequencies and time information
    this.displayActiveFrequencies();
    
    // Display actual time span being shown
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Span: ${totalTimeMs.toFixed(1)}ms`, 10, this.height - 10);

    return this;
  };

  // Helper function to check if there's active audio
  scopeVis.hasActiveAudio = function() {
    return this.activeFrequencies && this.activeFrequencies.length > 0;
  };

  // Helper function to check for valid trigger
  scopeVis.hasValidTrigger = function(sample) {
    const triggerLevel = this.triggerLevel || 0.0;
    // Look for rising edge that crosses trigger level
    for (let i = 1; i < sample.data.length; i++) {
      if (sample.data[i-1] < triggerLevel && sample.data[i] >= triggerLevel) {
        return true;
      }
    }
    return false;
  };

  // Helper function to display active frequencies
  scopeVis.displayActiveFrequencies = function() {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px monospace';
    
    if (this.activeFrequencies && this.activeFrequencies.length > 0) {
      if (this.activeFrequencies.length === 1) {
        this.ctx.fillText(`${this.activeFrequencies[0].toFixed(1)} Hz`, this.width - 120, 25);
      } else {
        this.ctx.fillText(`${this.activeFrequencies.length} notes`, this.width - 120, 25);
        // Show individual frequencies on separate lines
        this.ctx.font = '12px monospace';
        for (let i = 0; i < Math.min(this.activeFrequencies.length, 5); i++) {
          this.ctx.fillText(`${this.activeFrequencies[i].toFixed(1)}Hz`, this.width - 120, 45 + i * 15);
        }
        if (this.activeFrequencies.length > 5) {
          this.ctx.fillText(`+${this.activeFrequencies.length - 5} more`, this.width - 120, 45 + 5 * 15);
        }
      }
    } else {
      this.ctx.fillText('Silence', this.width - 80, 25);
    }
  };

  // Phase alignment function for single frequency (eliminates jitter)
  scopeVis.findPhaseAlignedStart = function(data, period, startIdx) {
    // Use the technique from Matt Montag's article
    // Find a consistent phase point (zero crossing rising edge)
    const searchLength = Math.min(Math.floor(period), data.length - startIdx - 1);
    
    for (let i = startIdx; i < startIdx + searchLength; i++) {
      // Look for zero crossing with rising edge
      if (i > 0 && data[i-1] <= 0 && data[i] > 0) {
        return i;
      }
    }
    
    // Fallback: find the peak for phase alignment
    let peakIdx = startIdx;
    let peakValue = Math.abs(data[startIdx]);
    
    for (let i = startIdx; i < startIdx + searchLength; i++) {
      if (Math.abs(data[i]) > peakValue) {
        peakValue = Math.abs(data[i]);
        peakIdx = i;
      }
    }
    
    return peakIdx;
  };

  // Traditional trigger point finding for multiple frequencies
  scopeVis.findTriggerPoint = function(data, startIdx) {
    const triggerLevel = this.triggerLevel || 0.0;
    const searchLength = Math.min(data.length - startIdx - 1, 100); // Search limited range
    
    // Look for rising edge trigger
    for (let i = startIdx + 1; i < startIdx + searchLength; i++) {
      if (data[i-1] < triggerLevel && data[i] >= triggerLevel) {
        return i;
      }
    }
    
    return startIdx; // No trigger found, use original
  };

  // Use requestAnimationFrame for smoother rendering with frame rate limiting
  let animationId;
  let isRunning = false;
  let lastFrameTime = 0;
  const targetFrameRate = 60; // Cap at 60fps for stability
  const frameInterval = 1000 / targetFrameRate;

  function drawLoop(currentTime) {
    if (isRunning) {
      // Limit frame rate to prevent jittering
      if (currentTime - lastFrameTime >= frameInterval) {
        scopeVis.draw(scope.sample());
        lastFrameTime = currentTime;
      }
      animationId = requestAnimationFrame(drawLoop);
    }
  }

  function startDrawing() {
    if (!isRunning) {
      isRunning = true;
      drawLoop();
    }
  }

  function stopDrawing() {
    isRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }

  // Start rendering immediately
  startDrawing();

  function connect(gainNode) {
    gainNode.connect(input);
  }

  function disconnect(gainNode) {
    gainNode.disconnect(input);
  }

  function setAmplitude(amplitude) {
    scopeVis.setAmplitude(amplitude);
  }

  function moveGrid(deltaH, deltaV) {
    scopeVis.moveGrid(deltaH, deltaV);
  }

  function resetGrid() {
    scopeVis.resetGrid();
  }

  function getGridPosition() {
    return scopeVis.getGridPosition();
  }

  function setTimeResolution(msPerDiv) {
    console.log("oscilloscope.setTimeResolution called with:", msPerDiv);
    scopeVis.setTimeResolution(msPerDiv);
    console.log("scopeVis.timeResolution is now:", scopeVis.timeResolution);
    
    // Adapt buffer size based on time resolution for optimal performance
    const totalTimeMs = 20 * msPerDiv;
    const neededSamples = Math.ceil((totalTimeMs / 1000) * audioContext.sampleRate);
    
    // Choose appropriate FFT size (must be power of 2)
    let fftSize = 2048;
    while (fftSize < neededSamples && fftSize < 32768) {
      fftSize *= 2;
    }
    
    // Only change FFT size if significantly different to prevent jitter
    const currentSize = scope.analyser.fftSize;
    if (Math.abs(currentSize - fftSize) > currentSize * 0.5) {
      scope.analyser.fftSize = fftSize;
      scope.freqData = new Float32Array(scope.analyser.frequencyBinCount);
      console.log(`Adjusted FFT size to ${fftSize} for ${msPerDiv}ms/div`);
    }
  }

  function setTriggerLevel(level) {
    scopeVis.setTriggerLevel(level);
  }

  function addFrequency(frequency, noteId) {
    if (!scopeVis.activeFrequencies) scopeVis.activeFrequencies = [];
    if (!scopeVis.activeNoteIds) scopeVis.activeNoteIds = new Map();
    
    scopeVis.activeFrequencies.push(frequency);
    scopeVis.activeNoteIds.set(noteId, frequency);
    scopeVis.frequenciesChanged = true; // Mark for phase reference reset
  }

  function removeFrequency(noteId) {
    if (!scopeVis.activeFrequencies || !scopeVis.activeNoteIds) return;
    
    const frequency = scopeVis.activeNoteIds.get(noteId);
    if (frequency !== undefined) {
      const index = scopeVis.activeFrequencies.indexOf(frequency);
      if (index > -1) {
        scopeVis.activeFrequencies.splice(index, 1);
      }
      scopeVis.activeNoteIds.delete(noteId);
      scopeVis.frequenciesChanged = true; // Mark for phase reference reset
    }
  }

  function clearAllFrequencies() {
    scopeVis.activeFrequencies = [];
    scopeVis.activeNoteIds = new Map();
    scopeVis.frequenciesChanged = true; // Mark for phase reference reset
  }

  function setTriggerMode(mode) {
    scopeVis.setTriggerMode(mode);
    scopeVis.triggerMode = mode;
    
    // Clear captured waveform when switching modes
    if (mode !== 'single') {
      scopeVis.capturedWaveform = null;
    }
  }

  function setSynthParameters(params) {
    scopeVis.currentSynthParams = params;
  }

  return {
    connect,
    disconnect,
    setAmplitude,
    moveGrid,
    resetGrid,
    getGridPosition,
    setTimeResolution,
    setTriggerLevel,
    setTriggerMode,
    addFrequency,
    removeFrequency,
    clearAllFrequencies,
    setSynthParameters,
    startDrawing,
    stopDrawing,
  };
}
