// Renders an oscilloscope from a GainNode, using the Scope dependency.

function initOscilloscope({ Scope, audioContext, canvas }){

  const scope = new Scope.ScopeSampler(audioContext);
  const input = scope.getInput();

  const scopeVis = new Scope.ScopeRenderer(canvas);
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

  return {
    connect,
    disconnect,
    setAmplitude,
  };
}
