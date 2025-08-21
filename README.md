# WebMIDI Educational Synthesizer for Launchkey Mini

An educational synthesizer with advanced oscilloscope visualization, designed for teaching the physics of sound and music synthesis. Originally made for the Novation Launchkey Mini MIDI keyboard, using Web Audio / WebMIDI.

It can also be controlled using any other MIDI controller, and with your computer's keyboard!

![webmidi synth screenshot with oscilloscope](./docs/screenshot-640px.png)

- Demo video: [youtube.com/watch?v=w-BsTGGIlwA](https://www.youtube.com/watch?v=w-BsTGGIlwA)
- Try it now: [adrienjoly.com/webmidi-launchkey-mini](https://adrienjoly.com/webmidi-launchkey-mini)

**Recent Major Improvements:**
- Professional-grade oscilloscope with stable waveform display
- Real-time harmonic synthesis visualization 
- Educational tools for teaching Fourier analysis and sound physics

## Vision

This synthesizer was developed with the aim of performing "chiptune" music live. The idea would be to have 4 musicians use MIDI instruments to perform each of the 4 monophonic channels that a Nintendo/NES can play.

You can read more about that project, there: [adrienjoly.com/chips](https://adrienjoly.com/chips)

## Features

### Synthesis Engines
- **Basic Synthesizer** with waveform modes (use the `[` and `]` keys to cycle through):
  - Square wave
  - Pulse wave with 12.5% and 25% duty cycle (like on the Nintendo NES and GameBoy)
  - Triangle wave
  - Sawtooth wave
  - Sine wave
- **Additive Synthesizer** with real-time harmonic control:
  - 20 independent harmonic oscillators
  - Real-time slider control for each harmonic amplitude
  - Preset waveforms (sawtooth, square, triangle, organ, clarinet, brass, bell)
  - Educational tool for understanding Fourier synthesis
- **FM Synthesizer** with modulation parameters:
  - Carrier and modulator frequency ratios
  - Adjustable modulation index
  - Real-time parameter control

### Sound Effects
- Noise generator with built-in drum sounds:
  - Bass drum kick (press `Q`)
  - Snare drum (press `W`)
  - Closed hi-hat (press `E`)
  - Opened hi-hat / cymbal (press `R`)

### Professional Oscilloscope
- **Stable waveform display** with eliminated jitter
- **Real-time harmonic visualization** - see how sine waves combine to create complex waveforms
- **Professional trigger modes**: Auto, Single, Normal
- **Accurate time base control** with multiple resolution settings
- **Multiple frequency tracking** for polyphonic display
- **Educational grid system** for precise measurements

### Input Support
- Novation Launchkey Mini keyboard, or any other MIDI controller
- Computer QWERTY keyboard for note input and control

### Educational Value
- **Fourier Analysis Visualization**: Watch harmonic series build complex waveforms in real-time
- **Physics of Sound**: Accurate waveform representation for educational use
- **Synthesis Learning**: Interactive exploration of additive and FM synthesis principles

## Technical Improvements

This fork includes major enhancements to the original codebase:

### Oscilloscope Fixes
- **Eliminated horizontal jitter** through fixed phase reference system
- **Complete screen filling** at all time resolutions with smart interpolation
- **Professional trigger modes** implementation (Auto/Single/Normal)
- **Mathematical waveform generation** for stability and accuracy

### Synthesis Integration
- **Real-time harmonic visualization** for additive synthesis
- **Parameter synchronization** between synthesis engines and oscilloscope
- **Educational waveform display** showing actual harmonic content
- **Backward compatibility** with existing synthesis engines

### Educational Features
- **Fourier synthesis demonstration** - see how harmonics build waveforms
- **Real-time parameter feedback** - immediate visual response to slider changes
- **Professional measurement tools** - accurate time and amplitude readings
- **Physics education ready** - suitable for university-level sound physics courses

## Documentation

For complete technical details about the oscilloscope improvements and implementation, see [OSCILLOSCOPE_COMPLETE_FIX.md](./OSCILLOSCOPE_COMPLETE_FIX.md).

## Contributors

- [Adrien Joly](https://github.com/adrienjoly) - Original developer
- [Jérôme Schneider](https://github.com/netgusto) - Original contributor
- [TheFermiSea](https://github.com/TheFermiSea) - Oscilloscope fixes and educational enhancements
