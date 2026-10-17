(function(root,factory){
 const old=typeof module!=="undefined"&&module.exports?require("./deliberative-arcs-v13.js"):root.HandoverDeliberativeArcs;
 const api=factory(old);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverArcsV14=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old){
 "use strict";
 const adapt=s=>s?.arcMode==="responsive"?{...s,arcMode:"deliberative"}:s;
 return Object.freeze({...old,
  active:s=>old.active(adapt(s)),status:s=>old.status(adapt(s)),
  verified:s=>old.verified(adapt(s)),observed:s=>old.observed(adapt(s)),
  sceneText:s=>old.sceneText(adapt(s))});
});
