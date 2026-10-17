(function(root,factory){
 const old=typeof module!=="undefined"&&module.exports?require("./notes-v13.js"):root.HandoverNotesV13;
 const api=factory(old);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverNotesV14=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old){
 "use strict";
 const adapt=s=>s?.arcMode==="responsive"?{...s,arcMode:"deliberative"}:s;
 return Object.freeze({observed:s=>old.observed(adapt(s)),emphasis:s=>old.emphasis(adapt(s))});
});
