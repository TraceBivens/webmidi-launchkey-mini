// 10-Oscillator Additive Synthesizer for demonstrating Fourier decomposition
// Each oscillator represents a harmonic (1x, 2x, 3x, etc. the fundamental frequency)

function initAdditiveSynth({ audioContext, onPatchChange }) {

  const NUM_HARMONICS = 10;
  const NOTES = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ];

  // Predefined harmonic presets that demonstrate common waveforms
  const harmonicPresets = [
    {
      name: 'Fundamental Only',
      harmonics: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      description: 'Pure sine wave - single frequency component'
    },
    {
      name: 'Sawtooth (Fourier)',
      harmonics: [1, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14, 0.125, 0.11, 0.1],
      description: 'All harmonics with 1/n amplitude - creates sawtooth'
    },
    {
      name: 'Square Wave (Fourier)',
      harmonics: [1, 0, 0.33, 0, 0.2, 0, 0.14, 0, 0.11, 0],
      description: 'Odd harmonics only with 1/n amplitude - creates square wave'
    },
    {
      name: 'Triangle (Fourier)',
      harmonics: [1, 0, 0.11, 0, 0.04, 0, 0.02, 0, 0.012, 0],
      description: 'Odd harmonics with 1/n² amplitude - creates triangle'
    },
    {
      name: 'Organ-like',
      harmonics: [0.8, 0.3, 0.6, 0.1, 0.4, 0.05, 0.2, 0.02, 0.1, 0.01],
      description: 'Strong fundamental and 3rd harmonic - organ timbre'
    },
    {
      name: 'Clarinet-like',
      harmonics: [1, 0.1, 0.7, 0.05, 0.5, 0.02, 0.3, 0.01, 0.2, 0.005],
      description: 'Odd harmonics emphasized - clarinet-like timbre'
    },
    {
      name: 'Brass-like',
      harmonics: [0.6, 0.8, 0.4, 0.6, 0.2, 0.4, 0.1, 0.2, 0.05, 0.1],
      description: 'Rich harmonic content - brass instrument timbre'
    },
    {
      name: 'Bell-like',
      harmonics: [1, 0.2, 0.1, 0.8, 0.05, 0.02, 0.6, 0.01, 0.005, 0.4],
      description: 'Inharmonic-like ratios - metallic bell sound'
    }
  ];

  let currentPreset = 0;
  let currentHarmonics = [...harmonicPresets[0].harmonics];

  function switchPreset(incr = 1) {
    currentPreset = (harmonicPresets.length + currentPreset + incr) % harmonicPresets.length;
    currentHarmonics = [...harmonicPresets[currentPreset].harmonics];
    console.log('Additive Synth:', harmonicPresets[currentPreset].name);
    const presetInfo = {
      name: harmonicPresets[currentPreset].name,
      type: 'additive',
      description: harmonicPresets[currentPreset].description,
      harmonics: currentHarmonics
    };
    onPatchChange && onPatchChange(presetInfo);
    
    // Update harmonic sliders if they exist
    if (typeof updateHarmonicSliders === 'function') {
      updateHarmonicSliders(currentHarmonics);
    }
  }

  function setHarmonic(harmonicIndex, amplitude) {
    if (harmonicIndex >= 0 && harmonicIndex < NUM_HARMONICS) {
      currentHarmonics[harmonicIndex] = Math.max(0, Math.min(1, amplitude));
      currentPreset = -1; // Mark as custom when manually adjusted
      onPatchChange && onPatchChange({
        name: 'Custom',
        type: 'additive',
        description: 'User-defined harmonic content',
        harmonics: currentHarmonics
      });
    }
  }

  function playTone({ freq, velocity }) {
    const masterGain = audioContext.createGain();
    const oscillators = [];
    const harmonicGains = [];

    // Create oscillators for each harmonic
    for (let i = 0; i < NUM_HARMONICS; i++) {
      if (currentHarmonics[i] > 0) {
        const oscillator = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        
        // Set frequency as multiple of fundamental
        oscillator.frequency.value = freq * (i + 1);
        oscillator.type = 'sine'; // Always use sine waves for pure harmonic content
        
        // Set amplitude for this harmonic
        harmonicGain.gain.value = currentHarmonics[i] * (velocity / 127) * 0.1; // Scale down to prevent clipping
        
        // Connect: oscillator -> harmonic gain -> master gain
        oscillator.connect(harmonicGain);
        harmonicGain.connect(masterGain);
        
        oscillator.start();
        
        oscillators.push(oscillator);
        harmonicGains.push(harmonicGain);
      }
    }

    // Connect master gain to destination
    masterGain.connect(audioContext.destination);

    return {
      oscillator: { // Fake oscillator interface for compatibility
        stop: () => oscillators.forEach(osc => osc.stop())
      },
      gainNode: masterGain,
      harmonics: {
        oscillators,
        gains: harmonicGains,
        count: oscillators.length
      }
    };
  }

  function playNote({ note, octave, velocity }) {
    console.log('additive-synth.playNote', { note, octave, velocity });
    const freq = 440 * Math.pow(Math.pow(2, 1 / 12), ((octave - 4) * 12) + NOTES.indexOf(note));
    return playTone({ freq, velocity });
  }

  // Initialize with first preset
  const initialPresetInfo = {
    name: harmonicPresets[currentPreset].name,
    type: 'additive',
    description: harmonicPresets[currentPreset].description,
    harmonics: currentHarmonics
  };
  onPatchChange && onPatchChange(initialPresetInfo);

  return {
    playTone,
    playNote,
    switchPreset,
    setHarmonic,
    getHarmonics: () => [...currentHarmonics],
    getPresetInfo: () => harmonicPresets[currentPreset],
    NUM_HARMONICS
  };
}
