# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WebMIDI synthesizer application designed for the Novation Launchkey Mini MIDI keyboard. It's an educational tool demonstrating various synthesis techniques including additive synthesis (Fourier decomposition), FM synthesis, and basic waveform generation. The application runs entirely in the browser using Web Audio API and WebMIDI API.

## Development Commands

### Starting the Development Server
```bash
npm start
```
This starts a local HTTP server using `npx http-server` to serve the application. Open the served URL in a browser to run the synthesizer.

### Testing the Application
- No automated test suite is configured
- Manual testing involves:
  1. Opening the application in a browser
  2. Clicking the "Start" button to initialize Web Audio
  3. Testing MIDI input (if available) or computer keyboard input
  4. Verifying audio output and oscilloscope visualization

## Architecture Overview

### Entry Point and Initialization
- `index.html`: Main HTML file containing the complete UI and initialization logic
- All JavaScript modules are loaded via script tags and initialized in sequence
- Application starts when user clicks "Start" button (required for Web Audio activation)

### Core Synthesis Engines
1. **Basic Synth** (`synth.js`): Traditional oscillator-based synthesis with waveform patches including pulse waves with different duty cycles
2. **Additive Synth** (`additive-synth.js`): Educational Fourier synthesis using 20 harmonics to demonstrate how complex waveforms are built from sine wave components
3. **FM Synth** (`fm-synth.js`): Frequency modulation synthesis with carrier/modulator oscillators and various presets

### Input Handling
- `webmidi-reader.js`: Generic MIDI message parser and WebMIDI API interface
- `keyboard-input.js`: Computer keyboard to MIDI message mapping
- `launchkey-state.js`: State management for MIDI keyboard input

### Audio Processing and Visualization
- `note-player.js`: Central note management and routing to appropriate synthesis engines
- `oscilloscope.js`: Real-time audio visualization with manual trigger controls
- `sound-generator.js`: Noise generator for percussion sounds using SFXR library

### UI and Rendering
- `render.js`: Virtual keyboard renderer showing pressed keys
- All synthesis controls are embedded directly in `index.html` with event listeners

### Libraries
- `lib/scope.js`: Oscilloscope visualization library with trigger and grid controls
- `lib/sfxr.js`: Sound effect generation library for percussion
- `lib/riffwave.js`: WAV file generation utility

### Key Design Patterns
- Each synthesis engine follows the same interface: `playNote({ note, octave, velocity })` and `playTone({ freq, velocity })`
- Modular initialization functions that return objects with public methods
- Preset/patch system with `switchPatch()` methods for cycling through different sounds
- Real-time parameter control through HTML range inputs connected to synthesis parameters

### Educational Features
- **Additive Synthesis**: Demonstrates Fourier decomposition with individual harmonic amplitude controls and presets showing how different waveforms are constructed
- **FM Synthesis**: Shows frequency modulation concepts with carrier/modulator ratios and modulation index
- **Oscilloscope**: Real-time waveform visualization with professional oscilloscope-style controls
- **Live Parameter Control**: All synthesis parameters can be adjusted in real-time while playing

### Browser Compatibility
- Requires modern browser with Web Audio API and WebMIDI API support
- WebMIDI requires HTTPS in most browsers for security
- Designed for desktop browsers with MIDI device support