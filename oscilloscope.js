// Renders an oscilloscope from a GainNode, using the Scope dependency.

function initOscilloscope({ Scope, audioContext, canvas }){
  // Get dropdowns for scaling
  const secDivSelect = document.getElementById('secDiv');
  const voltDivSelect = document.getElementById('voltDiv');
  // Default values
  let secDiv = parseFloat(secDivSelect.value);
  let voltDiv = parseFloat(voltDivSelect.value);

  const scope = new Scope.ScopeSampler(audioContext);
  const input = scope.getInput();

  // Pass scaling to ScopeRenderer
  const scopeVis = new Scope.ScopeRenderer(canvas, { secDiv, voltDiv });
  // Redraw on dropdown change
  function updateScaling() {
    secDiv = parseFloat(secDivSelect.value);
    voltDiv = parseFloat(voltDivSelect.value);
    scopeVis.setScaling(secDiv, voltDiv);
  }
  secDivSelect.addEventListener('change', updateScaling);
  voltDivSelect.addEventListener('change', updateScaling);

  const drawBatch = new Scope.ScopeDrawBatch();
  drawBatch.add(() => scopeVis.draw(scope.sample()));
  drawBatch.start();

  function connect(gainNode) {
    gainNode.connect(input);
  }

  function disconnect(gainNode) {
    gainNode.disconnect(input);
  }

  return {
    connect,
    disconnect,
  };
}
