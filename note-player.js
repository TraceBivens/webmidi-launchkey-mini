// Play tones and sounds when notes are triggered from a keyboard or MIDI input.

function initNotePlayer({ synth, soundGenerator, oscilloscope }){

  const NOTES = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ];
  let lastPlayedFrequency = null; // Added to store the last played frequency

  const padMapping = {
    36: () => soundGenerator.playSound('kick'),
    37: () => soundGenerator.playSound('drysnare'),
    38: () => soundGenerator.playSound('closedhihat'),
    39: () => soundGenerator.playSound('openhihat'),
  };

  const commandMapping = {
    106: () => synth.switchPatch(-1),
    107: () => synth.switchPatch(),
  };

  const activeNotes = {};

  function stopNote({ note, channel }) {
    const { stop } = activeNotes[note] || {};
    if (typeof stop === 'function') stop();  
    delete activeNotes[note];
  }

  function playNote({ note, channel, velocity }) {
    console.log('playNote', { note, channel, velocity });
    if (channel === 10) {
      padMapping[note]({ velocity });
    } else {
      // white and black keys
      stopNote({ note, channel });
      const octave = Math.floor(note / 12);
      const noteIdx = note % 12;
      const freq = synth.getFrequency(NOTES[noteIdx], octave); // Get frequency
      lastPlayedFrequency = freq; // Store the frequency
      const { oscillator, gainNode } = synth.playNote({ note: NOTES[noteIdx], octave, velocity });

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
  };

  // Function to get the last played frequency
  function getLastPlayedFrequency() {
    return lastPlayedFrequency;
  }

  return {
    playParsedMidiMessage,
    getLastPlayedFrequency // Expose the function
  };
  
}
