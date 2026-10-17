/* Append only actually encountered procedural clues to the existing investigation notes. */
(function(root,factory){
  const base=typeof module!=="undefined"&&module.exports?require("./case-notes.js"):root.HandoverCaseNotes;
  const cases=typeof module!=="undefined"&&module.exports?require("./case-variants.js"):root.HandoverCases;
  const api=factory(base,cases);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverCaseNotesV5=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(base,cases){
  "use strict";
  function observed(state){
    const result=base.observed(state);
    if(!state.case || !cases.valid(state.case))return result;
    return [...result,...cases.observed(state.case,state)];
  }
  function emphasis(state){return base.emphasis(state);}
  return Object.freeze({observed,emphasis});
});
