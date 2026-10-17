(function(root,factory){
 const old=typeof module!=="undefined"&&module.exports?require("./reading-v10.js"):root.HandoverReadingV10;
 const mid=typeof module!=="undefined"&&module.exports?require("./deliberation-v13.js"):root.HandoverDeliberation;
 const api=factory(old,mid);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverReadingV13=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,mid){
 "use strict";
 return Object.freeze({compose:(s,screen,pieces)=>{
  const base=old.compose(mid.compatible(s),screen,pieces);
  if(s.arcMode!=="deliberative")return base;
  const extra=mid.reflection(s);
  return base===null?null:base+(extra?"\n\n"+extra:"");
 }});
});
