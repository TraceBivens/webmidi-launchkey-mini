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

    const triggerMode = this.triggerMode || "auto";
    const activeNotes = this.activeNotes || {};

    // CRITICAL FIX: Use FIXED phase reference to eliminate horizontal jitter
    // Initialize phase reference on first note or when frequencies change
    if (!this.phaseReference || this.frequenciesChanged) {
      this.phaseReference = audioContext.currentTime;
      this.frequenciesChanged = false;
    }

    const timeStep = totalTimeMs / 1000 / totalSamplesToDisplay;

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
    const hasActiveNotes = Object.keys(activeNotes).length > 0;

    // Handle trigger modes
    if (triggerMode === "auto") {
      shouldDraw = hasActiveNotes;
    } else if (triggerMode === "single") {
      // Single mode: capture mathematical waveform and hold
      if (!this.capturedMathWaveform && hasActiveNotes) {
        this.capturedMathWaveform = [];
        this.capturedNotes = JSON.parse(JSON.stringify(activeNotes));
        this.capturedAmplitude = amplitudeEnvelope;
      }
      // Use captured data if available
      if (this.capturedMathWaveform) {
        shouldDraw = true;
      }
    } else if (triggerMode === "normal") {
      shouldDraw =
        hasActiveNotes && amplitudeEnvelope > (this.triggerLevel || 0.1);
    }

    if (shouldDraw) {
      let isFirstPoint = true;

      // Use captured notes for single mode, live notes otherwise
      const notes =
        triggerMode === "single" && this.capturedNotes
          ? this.capturedNotes
          : activeNotes;
      const amplitude =
        triggerMode === "single" && this.capturedAmplitude
          ? this.capturedAmplitude
          : amplitudeEnvelope;

      for (let i = 0; i < totalSamplesToDisplay; i++) {
        const time = this.phaseReference + i * timeStep;
        let sampleValue = 0;

        if (Object.keys(notes).length > 0) {
          // Generate mathematically perfect waveform with harmonics
          for (const noteId in notes) {
            const noteData = notes[noteId];
            const fundamentalFreq = noteData.frequency;
            const harmonics = noteData.harmonics || [1]; // fallback to fundamental only
            const velocity = noteData.velocity || 127;

            // Generate all harmonics for this note
            for (let h = 0; h < harmonics.length; h++) {
              if (harmonics[h] > 0) {
                const harmonicFreq = fundamentalFreq * (h + 1);
                const harmonicAmp = harmonics[h] * (velocity / 127);
                sampleValue +=
                  harmonicAmp * Math.sin(2 * Math.PI * harmonicFreq * time);
              }
            }
          }
          // Apply amplitude envelope
          sampleValue = sampleValue * amplitude;
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
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "12px monospace";
    this.ctx.fillText(
      `Span: ${totalTimeMs.toFixed(1)}ms`,
      10,
      this.height - 10,
    );

    return this;
  };

  // Helper function to check if there's active audio
  scopeVis.hasActiveAudio = function () {
    return this.activeFrequencies && this.activeFrequencies.length > 0;
  };

  // Helper function to check for valid trigger
  scopeVis.hasValidTrigger = function (sample) {
    const triggerLevel = this.triggerLevel || 0.0;
    // Look for rising edge that crosses trigger level
    for (let i = 1; i < sample.data.length; i++) {
      if (sample.data[i - 1] < triggerLevel && sample.data[i] >= triggerLevel) {
        return true;
      }
    }
    return false;
  };

  // Helper function to display active frequencies
  scopeVis.displayActiveFrequencies = function () {
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "16px monospace";

    const activeNotes = this.activeNotes || {};
    const noteCount = Object.keys(activeNotes).length;

    if (noteCount > 0) {
      if (noteCount === 1) {
        const noteData = Object.values(activeNotes)[0];
        this.ctx.fillText(
          `${noteData.frequency.toFixed(1)} Hz`,
          this.width - 120,
          25,
        );

        // Show harmonic count if using additive synthesis
        if (noteData.harmonics && noteData.harmonics.length > 1) {
          const activeHarmonics = noteData.harmonics.filter(
            (h) => h > 0,
          ).length;
          this.ctx.font = "12px monospace";
          this.ctx.fillText(
            `${activeHarmonics} harmonics`,
            this.width - 120,
            45,
          );
        }
      } else {
        this.ctx.fillText(`${noteCount} notes`, this.width - 120, 25);
        // Show individual frequencies on separate lines
        this.ctx.font = "12px monospace";
        const frequencies = Object.values(activeNotes).map((n) => n.frequency);
        for (let i = 0; i < Math.min(frequencies.length, 5); i++) {
          this.ctx.fillText(
            `${frequencies[i].toFixed(1)}Hz`,
            this.width - 120,
            45 + i * 15,
          );
        }
        if (frequencies.length > 5) {
          this.ctx.fillText(
            `+${frequencies.length - 5} more`,
            this.width - 120,
            45 + 5 * 15,
          );
        }
      }
    } else {
      this.ctx.fillText("Silence", this.width - 80, 25);
    }
  };

  // Phase alignment function for single frequency (eliminates jitter)
  scopeVis.findPhaseAlignedStart = function (data, period, startIdx) {
    // Use the technique from Matt Montag's article
    // Find a consistent phase point (zero crossing rising edge)
    const searchLength = Math.min(
      Math.floor(period),
      data.length - startIdx - 1,
    );

    for (let i = startIdx; i < startIdx + searchLength; i++) {
      // Look for zero crossing with rising edge
      if (i > 0 && data[i - 1] <= 0 && data[i] > 0) {
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
  scopeVis.findTriggerPoint = function (data, startIdx) {
    const triggerLevel = this.triggerLevel || 0.0;
    const searchLength = Math.min(data.length - startIdx - 1, 100); // Search limited range

    // Look for rising edge trigger
    for (let i = startIdx + 1; i < startIdx + searchLength; i++) {
      if (data[i - 1] < triggerLevel && data[i] >= triggerLevel) {
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
    const neededSamples = Math.ceil(
      (totalTimeMs / 1000) * audioContext.sampleRate,
    );

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

  function addNote(noteId, frequency, harmonics, velocity) {
    if (!scopeVis.activeNotes) scopeVis.activeNotes = {};

    scopeVis.activeNotes[noteId] = {
      frequency: frequency,
      harmonics: harmonics || [1], // Default to fundamental only
      velocity: velocity || 127,
    };
    scopeVis.frequenciesChanged = true; // Mark for phase reference reset
    console.log(
      "Oscilloscope: Added note",
      noteId,
      "freq:",
      frequency,
      "harmonics:",
      harmonics,
    );
  }

  function removeNote(noteId) {
    if (!scopeVis.activeNotes) return;

    if (scopeVis.activeNotes[noteId]) {
      delete scopeVis.activeNotes[noteId];
      scopeVis.frequenciesChanged = true; // Mark for phase reference reset
    }
  }

  function clearAllNotes() {
    scopeVis.activeNotes = {};
    scopeVis.frequenciesChanged = true; // Mark for phase reference reset
  }

  function updateNoteHarmonics(noteId, harmonics) {
    if (scopeVis.activeNotes && scopeVis.activeNotes[noteId]) {
      scopeVis.activeNotes[noteId].harmonics = harmonics;
      scopeVis.frequenciesChanged = true; // Mark for phase reference reset
      console.log(
        "Oscilloscope: Updated harmonics for note",
        noteId,
        "harmonics:",
        harmonics,
      );
    }
  }

  // Legacy functions for backward compatibility
  function addFrequency(frequency, noteId) {
    addNote(noteId, frequency, [1], 127);
  }

  function removeFrequency(noteId) {
    removeNote(noteId);
  }

  function clearAllFrequencies() {
    clearAllNotes();
  }

  function setTriggerMode(mode) {
    scopeVis.setTriggerMode(mode);
    scopeVis.triggerMode = mode;

    // Clear captured waveform when switching modes
    if (mode !== "single") {
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
    addNote,
    removeNote,
    clearAllNotes,
    updateNoteHarmonics,
    addFrequency,
    removeFrequency,
    clearAllFrequencies,
    setSynthParameters,
    startDrawing,
    stopDrawing,
    get activeNotes() {
      return scopeVis.activeNotes;
    },
  };
}
