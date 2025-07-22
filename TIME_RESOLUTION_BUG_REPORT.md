# Time Resolution Bug Report

## Problem Description

The Time Resolution dropdown in the oscilloscope controls does not properly change the time scale of the displayed waveform. When selecting different time resolution values (1ms/div, 2ms/div, 5ms/div, 10ms/div, 20ms/div), the waveform display does not visually change to reflect the new time scale.

## Expected Behavior

- **1ms/div**: Should show 20ms total time span (20 divisions × 1ms/div) with high time resolution
- **2ms/div**: Should show 40ms total time span with medium resolution
- **5ms/div**: Should show 100ms total time span (default)
- **10ms/div**: Should show 200ms total time span with lower resolution
- **20ms/div**: Should show 400ms total time span with lowest resolution

Each setting should display a visibly different horizontal time scale, with higher resolution settings showing shorter time spans (more "zoomed in") and lower resolution settings showing longer time spans (more "zoomed out").

## Current Behavior

- The dropdown values change but the waveform display remains largely unchanged
- Some minor changes occur when switching between very different values (like 5ms to 1ms), but the scaling is incorrect
- Higher time resolution settings (10ms, 20ms) show no visible change from the 5ms default

## Technical Analysis

### Current Implementation

The time resolution control is implemented in `index.html` around line 270:

```javascript
timeResolutionControl.addEventListener('change', (e) => {
  const resolution = parseFloat(e.target.value);
  oscilloscope.setTimeResolution(resolution);
});
```

The `oscilloscope.setTimeResolution()` function in `oscilloscope.js` calls:

```javascript
function setTimeResolution(msPerDiv) {
  scopeVis.setTimeResolution(msPerDiv);
}
```

### Root Cause Analysis

1. **Limited Buffer Size**: The original scope uses `fftSize = 8192`, providing only ~93ms of audio data at 44.1kHz sample rate
2. **Grid Labels vs Actual Time Scale**: The `timeResolution` setting only affects grid labels, not the actual waveform time scaling
3. **Fixed Pixel Calculation**: The scope renderer calculates `xPxPerTimeSample = Math.ceil(this.width / sample.data.length) + 2`, which always stretches available data across the full canvas width regardless of desired time resolution

### Key Files Involved

- `index.html`: Contains the dropdown control and event listener
- `oscilloscope.js`: Wrapper around the scope library
- `lib/scope.js`: The core scope rendering library (minified/bundled)

### Previous Attempted Fixes

Multiple attempts have been made to fix this issue:

1. **Buffer Size Increase**: Changed `fftSize` from 8192 to 32768 to provide ~743ms of data
2. **Draw Function Override**: Completely rewrote the scope draw function to respect time resolution
3. **Data Slicing**: Attempted to slice audio data based on time resolution requirements

However, these fixes have not resolved the fundamental issue.

## Debugging Information

### Console Logging Added

Debug logging has been added to track:
- When the time resolution dropdown changes
- Whether `setTimeResolution` is being called
- The current `timeResolution` value in the scope renderer

### Browser Developer Tools

To debug this issue:
1. Open the application in a browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Click "Start" to initialize the audio
5. Change the Time Resolution dropdown values
6. Observe console output and waveform changes

## Required Solution

The solution needs to:

1. **Properly scale the waveform horizontally** based on the time resolution setting
2. **Handle data availability constraints** (when requested time span exceeds available audio buffer)
3. **Maintain proper triggering** for stable waveform display
4. **Update both the waveform and grid labels** to match the selected time resolution

### Constraints

- The Web Audio API `AnalyserNode` has inherent buffer size limitations
- The scope library is minified/bundled, making direct modifications challenging
- The time resolution must work across all synthesis engines (basic, additive, FM)

## Test Cases

To verify a fix works correctly:

1. **Load the application** and click "Start"
2. **Play a note** (keyboard or MIDI) to generate audio
3. **Change time resolution** from 5ms/div to 1ms/div - should see "zoomed in" view
4. **Change to 10ms/div** - should see "zoomed out" view with longer time span
5. **Change to 20ms/div** - should see maximum "zoomed out" view
6. **Verify grid labels** match the selected time resolution
7. **Test with different waveforms** (sine, square, sawtooth, FM patches)

## Files to Examine

- `webmidi-launchkey-mini/oscilloscope.js` - Oscilloscope wrapper
- `webmidi-launchkey-mini/lib/scope.js` - Core scope rendering (may need to be modified)
- `webmidi-launchkey-mini/index.html` - UI controls and event handling

## Additional Context

- This is an educational WebMIDI synthesizer application
- The oscilloscope is meant to demonstrate waveform characteristics of different synthesis techniques
- Proper time resolution is important for educational value, allowing students to see waveform details at different time scales
- The application runs entirely in the browser using Web Audio API and WebMIDI API