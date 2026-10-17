/* Evidence for a large arc only enters the game after it was actually encountered.
 * No leaks from a randomized case's fixed private seed.
 */
(function(root,factory){
  const old=typeof module!=="undefined"&&module.exports?require("./case-notes-v5.js"):root.HandoverCaseNotesV5;
  const arcs=typeof module!=="undefined"&&module.exports?require("./major-arcs.js"):root.HandoverGrandArcs;
  const api=factory(old,arcs);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverCaseNotesV6=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,arcs){
  "use strict";
  function observed(state){return [...old.observed(state),...arcs.observed(state)];}
  return Object.freeze({observed,emphasis:old.emphasis});
});
