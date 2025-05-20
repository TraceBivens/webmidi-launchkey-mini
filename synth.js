// Polyphonic Synth Tone generator based on WebAudio
// (very) inspired by https://devdocs.io/dom/web_audio_api/simple_synth

function initSynth({ audioContext, onPatchChange }){

  const NOTES = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ];

  function makePulseWaveform ({ dutyCycle }) {
    // from https://mitxela.com/projects/swotgb/about
    const real = new Float32Array(512);
    const imag = new Float32Array(512); // defaults to zeros
    for (var n = 1; n < 512; n++) {
      real[n] = 2 * Math.sin(Math.PI * n * dutyCycle) / (Math.PI * n)
    }
    return audioContext.createPeriodicWave(real, imag);
  }

  function makeSaxWaveform() {
    const numCoefficients = 512; // Length of the coefficient arrays
    const real = new Float32Array(numCoefficients); // For cosine terms (a_k)
    const imag = new Float32Array(numCoefficients); // For sine terms (b_k)

    // real[0] is the DC offset. imag[0] is unused.
    real[0] = 0;
    imag[0] = 0;

    // Define relative amplitudes for harmonics (sine terms b_k for sin(k*omega*t))
    // These values are experimental for a saxophone-like timbre
    imag[1] = 1.0;   // Fundamental
    imag[2] = 0.75;  // 2nd harmonic
    imag[3] = 0.9;   // 3rd harmonic
    imag[4] = 0.5;   // 4th harmonic
    imag[5] = 0.6;   // 5th harmonic
    imag[6] = 0.35;  // 6th harmonic
    imag[7] = 0.25;  // 7th harmonic
    imag[8] = 0.15;  // 8th harmonic
    // Cosine terms (real[k]) can be kept zero for a phase-aligned waveform,
    // or adjusted for different timbral characteristics.
    // For instance, a small real[1] could make the attack slightly different.
    // real[1] = 0.05; // Example

    // The createPeriodicWave function normalizes the wave by default,
    // so the absolute values of coefficients matter in relation to each other.
    return audioContext.createPeriodicWave(real, imag);
  }

  function makeViolinWaveform() {
    const numCoefficients = 512;
    const real = new Float32Array(numCoefficients); // For cosine terms (a_k)
    const imag = new Float32Array(numCoefficients); // For sine terms (b_k)

    real[0] = 0;
    imag[0] = 0;

    // Violins have a rich harmonic spectrum, somewhat like a sawtooth but can be more nuanced.
    // We'll use a series of sine terms (imag) and can add some cosine terms (real) for phase variation if desired.
    // These are approximate and can be tweaked for better sound.
    // Generally, all harmonics are present, with amplitudes decreasing.
    // Some specific harmonics might be slightly more prominent.

    for (let k = 1; k < numCoefficients; k++) {
      // A common approximation for violin-like sounds is 1/k for sine components (sawtooth-like)
      // and sometimes a mix of 1/k^2 for cosine components to alter the phase and timbre.
      imag[k] = 1 / k; // Sawtooth-like fundamental harmonic series for sine components
      // real[k] = 0.5 / (k * k); // Example: Add some cosine components, decaying faster
    }

    // Let's try to boost some of the lower-mid harmonics slightly, which can be characteristic.
    if (imag.length > 3) imag[3] *= 1.1;
    if (imag.length > 4) imag[4] *= 1.2;
    if (imag.length > 5) imag[5] *= 1.1;

    // The createPeriodicWave function normalizes the wave, so relative amplitudes are key.
    return audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
  }
  
  var patches = [
    { type: 'sine' },
    {
      name: 'pulse (12.5%)',
      type: 'custom',
      apply: osc => osc.setPeriodicWave(makePulseWaveform({ dutyCycle: 0.125 }))
    },
    {
      name: 'pulse (25%)',
      type: 'custom',
      apply: osc => osc.setPeriodicWave(makePulseWaveform({ dutyCycle: 0.25 }))
    },
    {
      name: 'pulse (50%)',
      type: 'square'
    },
    {
      name: 'pulse (75%)',
      type: 'custom',
      apply: osc => osc.setPeriodicWave(makePulseWaveform({ dutyCycle: 0.75 }))
    },
    {
      name: 'triangle',
      type: 'triangle'
    },
    { type: 'sawtooth' },
    { name: 'Square Wave', type: 'square' },
    { name: 'Saxophone (approx.)', type: 'custom', apply: osc => osc.setPeriodicWave(makeSaxWaveform()) },
    { name: 'Violin (approx.)', type: 'custom', apply: osc => osc.setPeriodicWave(makeViolinWaveform()) } // Added Violin
  ];
  
  var currentPatch = 0; // Sine wave is now the default (index 0)

  function switchPatch(incr = 1) {
    currentPatch = (patches.length + currentPatch + incr) % patches.length;
    console.log(currentPatch);
    onPatchChange && onPatchChange(patches[currentPatch]);
  }

  onPatchChange && onPatchChange(patches[currentPatch]);
  
  function playTone({ freq, velocity }, patch = patches[currentPatch]) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    // TODO: disconnect when we stop playing that note
    // masterGainNode.gain.value = 1.0;
    gainNode.gain.value = velocity / 127;
    oscillator.connect(gainNode);
    if (patch.apply) {
      patch.apply(oscillator);
    } else {
      oscillator.type = patch.type;
    }
    oscillator.frequency.value = freq;
    oscillator.start();
    return {
      oscillator,
      gainNode,
    };
  }

  function playNote({ note, octave, velocity }, patch) {
    console.log('synth.playNote', { note, octave, velocity });
    const freq = getFrequency(note, octave); // Use getFrequency here
    return playTone({ freq, velocity }, patch);
  }

  // Function to calculate frequency based on note and octave
  function getFrequency(note, octave) {
    const noteIndex = NOTES.indexOf(note);
    if (noteIndex === -1) {
      throw new Error(`Invalid note: ${note}`);
    }
    // A4 = 440Hz, which is octave 4
    // MIDI note number for A4 is 69. C4 is 60.
    // Octave 0 starts with C0 (MIDI note 12)
    const midiNoteNumber = (octave * 12) + noteIndex + 12; // Corrected MIDI note calculation
    return 440 * Math.pow(2, (midiNoteNumber - 69) / 12);
  }

  return {
    playTone,
    playNote,
    switchPatch,
    getFrequency // Expose getFrequency
  };
}
