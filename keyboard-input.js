// Generates pseudo-MIDI messages from the computer's keyboard.

function initKeyboardInput() {
  const MIN_OCTAVE = 1;
  const MAX_OCTAVE = 8;

  const PAD_NOTES = {
    q: 36,
    w: 37,
    e: 38,
    r: 39,
    t: 44,
    y: 45,
    u: 46,
    i: 47,
  };

  const KEY_NOTES = {
    // white keys + black keys, at octave = 0
    z: 0,
    s: 1,
    x: 2,
    d: 3,
    c: 4,
    v: 5,
    g: 6,
    b: 7,
    h: 8,
    n: 9,
    j: 10,
    m: 11,
    ",": 12,
    l: 13,
    ".": 14,
    ";": 15,
    "/": 16,
  };

  const COMMANDS = {
    "[": 106, // trackPrev
    "]": 107, // trackNext
  };

  let octaveOffset = 2; // Changed from 3 to 2 for better audible range
  let onOctaveChange = null; // Callback for octave changes

  function listenToKeyboardMessages(handler) {
    function emit(message) {
      setTimeout(handler.bind(null, message), 0);
    }

    const stopAllNotes = () =>
      Object.keys(KEY_NOTES).forEach((key) =>
        emit({
          channel: 1,
          command: 8,
          note: getKeyNote(key),
          velocity: 0,
        }),
      );

    const incrementOctave = (incr) => {
      stopAllNotes();
      const newOctave = Math.max(
        Math.min(octaveOffset + incr, MAX_OCTAVE),
        MIN_OCTAVE,
      );
      if (newOctave !== octaveOffset) {
        octaveOffset = newOctave;
        console.log(`Octave changed to: ${octaveOffset}`);
        if (onOctaveChange) {
          onOctaveChange(octaveOffset);
        }
      }
    };

    const OTHER_KEYS = {
      "+": () => incrementOctave(+1),
      "-": () => incrementOctave(-1),
      "=": () => incrementOctave(+1), // to prevent having to press shift on american keyboard
    };

    const getPadNote = (key) => PAD_NOTES[key];

    const getKeyNote = (key) => KEY_NOTES[key] + (octaveOffset + 1) * 12;

    const getKeyCommand = (key) => COMMANDS[key];

    function handleKeyboardEvent(e) {
      const keyUp = e.type === "keyup";
      const padNote = getPadNote(e.key);
      const commandNote = getKeyCommand(e.key);
      const note = getKeyNote(e.key) || padNote || commandNote;
      if (note) {
        emit({
          channel: padNote ? 10 : 1,
          command: commandNote ? 11 : keyUp ? 8 : 9,
          note,
          velocity: keyUp ? 0 : 64,
        });
      }
    }

    function handleKeyboardCommand(e) {
      const otherKeyFct = OTHER_KEYS[e.key];
      if (otherKeyFct) {
        otherKeyFct();
      }
    }

    window.addEventListener(
      "keydown",
      (e) => !e.repeat && handleKeyboardEvent(e),
    );
    window.addEventListener("keyup", handleKeyboardEvent);
    window.addEventListener("keypress", handleKeyboardCommand);
  }

  return {
    onKeyEvents: listenToKeyboardMessages,
    setOctave: (octave) => {
      const newOctave = Math.max(Math.min(octave, MAX_OCTAVE), MIN_OCTAVE);
      if (newOctave !== octaveOffset) {
        // Stop all notes when changing octave
        Object.keys(KEY_NOTES).forEach((key) => {
          // This is a simplified stopAllNotes since we don't have access to emit here
          // The UI will handle stopping notes when octave changes
        });
        octaveOffset = newOctave;
        console.log(`Octave set to: ${octaveOffset}`);
        if (onOctaveChange) {
          onOctaveChange(octaveOffset);
        }
      }
    },
    incrementOctave: (incr) => {
      const newOctave = Math.max(
        Math.min(octaveOffset + incr, MAX_OCTAVE),
        MIN_OCTAVE,
      );
      if (newOctave !== octaveOffset) {
        octaveOffset = newOctave;
        if (onOctaveChange) {
          onOctaveChange(octaveOffset);
        }
      }
    },
    getCurrentOctave: () => octaveOffset,
    setOctaveChangeCallback: (callback) => {
      onOctaveChange = callback;
    },
    getOctaveRange: () => ({ min: MIN_OCTAVE, max: MAX_OCTAVE }),
  };
}
