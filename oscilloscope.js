// Renders an oscilloscope from a GainNode, using the Scope dependency.

function initOscilloscope({ Scope, audioContext, canvas, notePlayer }){
  // Get dropdowns for scaling
  const secDivSelect = document.getElementById('secDiv');
  const voltDivSelect = document.getElementById('voltDiv');
  // Default values
  let secDiv = parseFloat(secDivSelect.value);
  let voltDiv = parseFloat(voltDivSelect.value);

  // scopeSamplerInstance holds the instance of Scope.ScopeSampler
  const scopeSamplerInstance = new Scope.ScopeSampler(audioContext, { 
    getTargetFrequency: notePlayer.getLastPlayedFrequency // Uses the initially provided (potentially temporary) function
  });
  const input = scopeSamplerInstance.getInput();

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
  drawBatch.add(() => scopeVis.draw(scopeSamplerInstance.sample()));
  drawBatch.start();

  function connect(gainNode) {
    gainNode.connect(input);
  }

  function disconnect(gainNode) {
    gainNode.disconnect(input);
  }

  // This function will be called from index.html with the fully initialized notePlayer
  function setNotePlayer(actualNotePlayer) {
    if (scopeSamplerInstance) {
      // Update the getTargetFrequency function on the existing scopeSamplerInstance
      scopeSamplerInstance.getTargetFrequency = actualNotePlayer.getLastPlayedFrequency;
    }
  }

  return {
    connect,
    disconnect,
    setNotePlayer // Expose setNotePlayer
  };
}
