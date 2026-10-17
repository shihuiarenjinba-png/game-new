(function(root,factory){
 const old=typeof module!=="undefined"&&module.exports?require("./case-notes-v9.js"):root.HandoverCaseNotesV9;
 const mid=typeof module!=="undefined"&&module.exports?require("./deliberation-v13.js"):root.HandoverDeliberation;
 const api=factory(old,mid);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverNotesV13=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,mid){
 "use strict";
 return Object.freeze({observed:s=>old.observed(mid.compatible(s)),
  emphasis:s=>old.emphasis(mid.compatible(s))});
});
