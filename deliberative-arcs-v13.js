/* Non-breaking story adapter: old campaign identities still use old rules. */
(function(root,factory){
 const old=typeof module!=="undefined"&&module.exports?require("./immersive-arcs.js"):root.HandoverImmersiveArcs;
 const mid=typeof module!=="undefined"&&module.exports?require("./deliberation-v13.js"):root.HandoverDeliberation;
 const api=factory(old,mid);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverDeliberativeArcs=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,mid){
 "use strict";
 const map=s=>mid.compatible(s);
 return Object.freeze({...old,
  active:s=>old.active(map(s)),status:s=>old.status(map(s)),
  observed:s=>old.observed(map(s)),sceneText:s=>old.sceneText(map(s)),
  verified:s=>old.verified(map(s))
 });
});
