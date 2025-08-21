// Play tones and sounds when notes are triggered from a keyboard or MIDI input.

function initNotePlayer({
  synth,
  additiveSynth,
  fmSynth,
  soundGenerator,
  oscilloscope,
  getCurrentSynthType,
}) {
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

  const padMapping = {
    36: () => soundGenerator.playSound("kick"),
    37: () => soundGenerator.playSound("drysnare"),
    38: () => soundGenerator.playSound("closedhihat"),
    39: () => soundGenerator.playSound("openhihat"),
  };

  const commandMapping = {
    106: () => {
      const synthType = getCurrentSynthType();
      if (synthType === "additive") {
        additiveSynth.switchPreset(-1);
      } else if (synthType === "fm") {
        fmSynth.switchPreset(-1);
      } else {
        synth.switchPatch(-1);
      }
    },
    107: () => {
      const synthType = getCurrentSynthType();
      if (synthType === "additive") {
        additiveSynth.switchPreset();
      } else if (synthType === "fm") {
        fmSynth.switchPreset();
      } else {
        synth.switchPatch();
      }
    },
    104: () => {
      const synthType = getCurrentSynthType();
      if (synthType === "additive") {
        additiveSynth.switchPreset(-1);
      } else if (synthType === "fm") {
        fmSynth.switchPreset(-1);
      } else {
        synth.switchPatch(-1);
      }
    },
    105: () => {
      const synthType = getCurrentSynthType();
      if (synthType === "additive") {
        additiveSynth.switchPreset();
      } else if (synthType === "fm") {
        fmSynth.switchPreset();
      } else {
        synth.switchPatch();
      }
    },
  };

  const activeNotes = {};

  function stopNote({ note, channel }) {
    const { stop } = activeNotes[note] || {};
    if (typeof stop === "function") stop();
    delete activeNotes[note];

    // Remove note from oscilloscope
    oscilloscope.removeNote(note);
  }

  function playNote({ note, channel, velocity }) {
    console.log("playNote", { note, channel, velocity });
    if (channel === 10) {
      padMapping[note]({ velocity });
    } else {
      // white and black keys - use selected synthesizer
      stopNote({ note, channel });
      const octave = Math.floor(note / 12);
      const noteIdx = note % 12;

      const synthType = getCurrentSynthType();
      let selectedSynth;
      if (synthType === "additive") {
        selectedSynth = additiveSynth;
      } else if (synthType === "fm") {
        selectedSynth = fmSynth;
      } else {
        selectedSynth = synth;
      }

      const synthResult = selectedSynth.playNote({
        note: NOTES[noteIdx],
        octave,
        velocity,
      });
      const { oscillator, gainNode } = synthResult;

      // Calculate frequency for oscilloscope display
      const noteFrequency = 440 * Math.pow(2, (note - 69) / 12); // A4 = 440Hz, MIDI note 69

      // Get harmonic information if available (for additive synth)
      let harmonics = [1]; // Default to fundamental only
      if (synthType === "additive" && selectedSynth.getHarmonics) {
        harmonics = selectedSynth.getHarmonics();
      }

      oscilloscope.addNote(note, noteFrequency, harmonics, velocity);
      oscilloscope.connect(gainNode);

      function stop() {
        oscillator.stop();
        oscilloscope.disconnect(gainNode);
      }

      activeNotes[note] = { stop };
    }
  }

  function playParsedMidiMessage({ command, note, channel, velocity }) {
    const commandKey = command === 11;
    const keyUp = command === 8;
    if (commandKey) {
      if (velocity > 0) commandMapping[note]();
    } else if (keyUp) {
      stopNote({ note, channel });
    } else {
      playNote({ note, channel, velocity });
    }
  }

  return {
    playParsedMidiMessage,
  };
}
