/* Explicitly keep verified older saves on the old narrative evidence layer. */
(function(root,factory){
  const older=typeof module!=="undefined"&&module.exports?require("./case-notes-v8.js"):root.HandoverCaseNotesV8;
  const foundational=typeof module!=="undefined"&&module.exports?require("./case-notes.js"):root.HandoverCaseNotes;
  const beats=typeof module!=="undefined"&&module.exports?require("./scene-beats.js"):root.HandoverSceneBeats;
  const arcs=typeof module!=="undefined"&&module.exports?require("./immersive-arcs.js"):root.HandoverImmersiveArcs;
  const api=factory(older,foundational,beats,arcs);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverCaseNotesV9=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(older,foundational,beats,arcs){
  "use strict";
  function observed(s){
    if(!beats.isNew(s))return older.observed(s);
    return [...foundational.observed(s),...beats.safeCaseNotes(s),...arcs.observed(s)];
  }
  return Object.freeze({observed,emphasis:older.emphasis});
});
