(function(root,factory){
  const base=typeof module!=="undefined"&&module.exports?require("./case-notes-v5.js"):root.HandoverCaseNotesV5;
  const arcs=typeof module!=="undefined"&&module.exports?require("./verified-arcs.js"):root.HandoverVerifiedArcs;
  const api=factory(base,arcs);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverCaseNotesV7=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(base,arcs){
  "use strict";
  return Object.freeze({
    observed(s){return [...base.observed(s),...arcs.observed(s)];},
    emphasis(s){return base.emphasis(s);}
  });
});
