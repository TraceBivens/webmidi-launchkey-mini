# WebMIDI Launchkey Mini Project Overview

## Purpose
Educational WebMIDI synthesizer application for the Novation Launchkey Mini MIDI keyboard. Demonstrates synthesis techniques including additive synthesis (Fourier decomposition), FM synthesis, and basic waveform generation. Runs entirely in the browser using Web Audio API and WebMIDI API.

## Tech Stack
- Pure JavaScript (ES6)
- Web Audio API for synthesis
- WebMIDI API for MIDI input
- HTML5 Canvas for oscilloscope visualization
- External libraries: SFXR (sound effects), custom Scope library

## Project Structure
- `index.html` - Main application with complete UI and initialization
- `oscilloscope.js` - Real-time audio visualization with scope controls
- `synth.js` - Basic oscillator synthesis with waveform patches
- `additive-synth.js` - Educational Fourier synthesis (20 harmonics)
- `fm-synth.js` - Frequency modulation synthesis
- `lib/scope.js` - Oscilloscope visualization library
- Support files: keyboard input, MIDI handling, rendering, sound generation

## Key Features
- Real-time oscilloscope with accurate time base controls
- Educational synthesis engines with live parameter control
- MIDI and computer keyboard input
- Professional oscilloscope-style trigger controls