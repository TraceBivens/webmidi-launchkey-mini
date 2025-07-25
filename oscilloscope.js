// Renders an oscilloscope from a GainNode, using the Scope dependency.

function initOscilloscope({ Scope, audioContext, canvas }){

  const scope = new Scope.ScopeSampler(audioContext);
  const input = scope.getInput();

  const scopeVis = new Scope.ScopeRenderer(canvas);
  // Link renderer and sampler for trigger control
  scopeVis.setSampler(scope);
  
  // Create a draw batch targeting 15fps for smoother but stable display
  //    with a single draw instruction in the batch (1 per displayed scope)
  const drawBatch = new Scope.ScopeDrawBatch({ fps: 15 });
  drawBatch.add(() => scopeVis.draw(scope.sample()));
  drawBatch.start();

  function connect(gainNode) {
    gainNode.connect(input);
  }

  function disconnect(gainNode) {
    gainNode.disconnect(input);
  }

  function setAmplitude(amplitude) {
    scopeVis.setAmplitude(amplitude);
  }

  function moveGrid(deltaH, deltaV) {
    scopeVis.moveGrid(deltaH, deltaV);
  }

  function resetGrid() {
    scopeVis.resetGrid();
  }

  function getGridPosition() {
    return scopeVis.getGridPosition();
  }

  function setTimeResolution(msPerDiv) {
    scopeVis.setTimeResolution(msPerDiv);
  }

  function setTriggerLevel(level) {
    scopeVis.setTriggerLevel(level);
  }

  function setTriggerMode(mode) {
    scopeVis.setTriggerMode(mode);
  }

  return {
    connect,
    disconnect,
    setAmplitude,
    moveGrid,
    resetGrid,
    getGridPosition,
    setTimeResolution,
    setTriggerLevel,
    setTriggerMode,
  };
}
