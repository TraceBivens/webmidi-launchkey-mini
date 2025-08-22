// FM (Frequency Modulation) Synthesizer for demonstrating FM synthesis concepts
// Uses carrier and modulator oscillators with adjustable modulation parameters

function initFMSynth({ audioContext, onPatchChange, getSynthGain }) {
  const NOTES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  // FM synthesis presets demonstrating different modulation characteristics
  const fmPresets = [
    {
      name: "Simple FM",
      carrierRatio: 1.0,
      modulatorRatio: 1.0,
      modulationIndex: 2.0,
      description: "Basic FM with 1:1 ratio - creates harmonic sidebands",
    },
    {
      name: "Bright Bell",
      carrierRatio: 1.0,
      modulatorRatio: 3.5,
      modulationIndex: 8.0,
      description: "Inharmonic ratios create bell-like metallic tones",
    },
    {
      name: "Electric Piano",
      carrierRatio: 1.0,
      modulatorRatio: 14.0,
      modulationIndex: 3.0,
      description: "High modulator ratio creates electric piano timbre",
    },
    {
      name: "Brass",
      carrierRatio: 1.0,
      modulatorRatio: 2.0,
      modulationIndex: 5.0,
      description: "2:1 ratio with moderate index - brass-like sound",
    },
    {
      name: "Woody",
      carrierRatio: 1.0,
      modulatorRatio: 0.5,
      modulationIndex: 1.5,
      description: "Sub-harmonic modulation creates woody timbre",
    },
    {
      name: "Gong",
      carrierRatio: 1.0,
      modulatorRatio: 1.414,
      modulationIndex: 12.0,
      description: "Irrational ratio with high index - gong-like sound",
    },
    {
      name: "Flute",
      carrierRatio: 1.0,
      modulatorRatio: 1.0,
      modulationIndex: 0.5,
      description: "Low modulation index creates flute-like tone",
    },
    {
      name: "Clav",
      carrierRatio: 1.0,
      modulatorRatio: 4.0,
      modulationIndex: 2.5,
      description: "4:1 ratio creates clavinet-like percussive sound",
    },
  ];

  let currentPreset = 0;
  let currentParams = { ...fmPresets[0] };

  function switchPreset(incr = 1) {
    currentPreset =
      (fmPresets.length + currentPreset + incr) % fmPresets.length;
    currentParams = { ...fmPresets[currentPreset] };
    console.log("FM Synth:", fmPresets[currentPreset].name);
    const presetInfo = {
      name: fmPresets[currentPreset].name,
      type: "fm",
      description: fmPresets[currentPreset].description,
      params: currentParams,
    };
    onPatchChange && onPatchChange(presetInfo);

    // Update FM controls if they exist
    if (typeof updateFMControls === "function") {
      updateFMControls(currentParams);
    }
  }

  function setCarrierRatio(ratio) {
    currentParams.carrierRatio = Math.max(0.1, Math.min(8.0, ratio));
    currentPreset = -1; // Mark as custom
    updateCustomPatch();
  }

  function setModulatorRatio(ratio) {
    currentParams.modulatorRatio = Math.max(0.1, Math.min(16.0, ratio));
    currentPreset = -1; // Mark as custom
    updateCustomPatch();
  }

  function setModulationIndex(index) {
    currentParams.modulationIndex = Math.max(0.0, Math.min(20.0, index));
    currentPreset = -1; // Mark as custom
    updateCustomPatch();
  }

  function updateCustomPatch() {
    onPatchChange &&
      onPatchChange({
        name: "Custom FM",
        type: "fm",
        description: `C:${currentParams.carrierRatio.toFixed(1)} M:${currentParams.modulatorRatio.toFixed(1)} I:${currentParams.modulationIndex.toFixed(1)}`,
        params: currentParams,
      });
  }

  function playTone({ freq, velocity }) {
    // Create carrier oscillator
    const carrier = audioContext.createOscillator();
    carrier.type = "sine";
    carrier.frequency.value = freq * currentParams.carrierRatio;

    // Create modulator oscillator
    const modulator = audioContext.createOscillator();
    modulator.type = "sine";
    modulator.frequency.value = freq * currentParams.modulatorRatio;

    // Create modulation depth control (modulation index)
    const modulationGain = audioContext.createGain();
    modulationGain.gain.value =
      freq * currentParams.modulatorRatio * currentParams.modulationIndex;

    // Create output gain
    const outputGain = audioContext.createGain();
    const baseGain = (velocity / 127) * 0.3; // Scale down to prevent clipping
    const synthGain = getSynthGain ? getSynthGain() : 1.0;
    outputGain.gain.value = baseGain * synthGain;

    // Create simple envelope for more realistic sound
    const now = audioContext.currentTime;
    outputGain.gain.setValueAtTime(0, now);
    outputGain.gain.linearRampToValueAtTime(baseGain * synthGain, now + 0.01); // Quick attack

    // Connect the FM synthesis chain:
    // modulator -> modulationGain -> carrier.frequency (FM)
    // carrier -> outputGain -> destination
    modulator.connect(modulationGain);
    modulationGain.connect(carrier.frequency);
    carrier.connect(outputGain);
    outputGain.connect(audioContext.destination);

    // Start oscillators
    modulator.start();
    carrier.start();

    return {
      oscillator: {
        // Fake oscillator interface for compatibility
        stop: () => {
          // Add release envelope
          const stopTime = audioContext.currentTime;
          outputGain.gain.setValueAtTime(outputGain.gain.value, stopTime);
          outputGain.gain.linearRampToValueAtTime(0, stopTime + 0.1);

          setTimeout(() => {
            modulator.stop();
            carrier.stop();
          }, 100);
        },
      },
      gainNode: outputGain,
      fm: {
        carrier,
        modulator,
        modulationGain,
        params: currentParams,
      },
    };
  }

  function playNote({ note, octave, velocity }) {
    console.log("fm-synth.playNote", { note, octave, velocity });
    // Convert note name + octave to MIDI note number, then to frequency
    // MIDI note 69 = A4 = 440Hz, MIDI note 60 = C4
    const midiNoteNumber = (octave + 1) * 12 + NOTES.indexOf(note);
    const freq = 440 * Math.pow(2, (midiNoteNumber - 69) / 12);
    return playTone({ freq, velocity });
  }

  // Initialize with first preset
  const initialPresetInfo = {
    name: fmPresets[currentPreset].name,
    type: "fm",
    description: fmPresets[currentPreset].description,
    params: currentParams,
  };
  onPatchChange && onPatchChange(initialPresetInfo);

  return {
    playTone,
    playNote,
    switchPreset,
    setCarrierRatio,
    setModulatorRatio,
    setModulationIndex,
    getParams: () => ({ ...currentParams }),
    getPresetInfo: () =>
      fmPresets[currentPreset] || { name: "Custom FM", ...currentParams },
    NUM_PRESETS: fmPresets.length,
  };
}
