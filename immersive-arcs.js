/* v0.9 — explicitly opt-in immersive edition of v0.8.
 * Previous story modes use their original authored logic unchanged.
 */
(function(root,factory){
  const old=typeof module!=="undefined"&&module.exports?require("./six-arcs.js"):root.HandoverSixArcs;
  const api=factory(old);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverImmersiveArcs=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old){
  "use strict";
  function compatible(s){
    return s&&s.arcMode==="immersive"?{...s,arcMode:"expanded"}:s;
  }
  function active(s){return old.active(compatible(s));}
  function status(s){return old.status(compatible(s));}
  function verified(s){return old.verified(compatible(s));}
  function observed(s){return old.observed(compatible(s));}
  function sceneText(s){return old.sceneText(compatible(s));}
  function nextSeed(seed){return old.nextSeed(seed);}
  return Object.freeze({
    VERSION:9,ARCS:old.ARCS,NEW_IDS:old.NEW_IDS,arcIndex:old.arcIndex,
    active,status,verified,observed,sceneText,nextSeed
  });
});
