/* v14 save identity. All earlier story worlds remain semantically unchanged. */
(function(root,factory){
 const old=typeof module!=="undefined"&&module.exports?require("./save-v13.js"):root.HandoverSaveV13;
 const api=factory(old);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverSaveV14=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old){
 "use strict";
 const VERSION=14,KEY="handover-room-prototype-v14",MAX_BYTES=old.MAX_BYTES,FORMAT=old.FORMAT;
 const adapt=s=>s?.arcMode==="responsive"?{...s,arcMode:"deliberative"}:s;
 function validState(s){
  if(!s||typeof s!=="object"||Array.isArray(s))return false;
  return old.validState(adapt(s));
 }
 function blank(seed){
  const s={...old.blank(seed),arcMode:"responsive"};
  if(!validState(s))throw Error("事件を開始できません");
  return s;
 }
 function restart(s){
  if(!validState(s))throw Error("事件の履歴を確認できません");
  return s.arcMode==="responsive"?blank(s.case.seed):old.restart(s);
 }
 function bytes(t){return new TextEncoder().encode(t).length;}
 function serialize(s){
  if(!validState(s))throw Error("不正な調査記録を保存できません");
  const t=JSON.stringify({format:FORMAT,version:VERSION,data:s},null,2);
  if(bytes(t)>MAX_BYTES)throw Error("保存ファイルが大きすぎます");
  return t;
 }
 function parse(t){
  if(typeof t!=="string"||!t.trim()||bytes(t)>MAX_BYTES)throw Error("容量が不正です");
  let x;try{x=JSON.parse(t)}catch(_){throw Error("JSON形式ではありません")}
  if(!x||typeof x!=="object"||Array.isArray(x)||
    Object.keys(x).sort().join(",")!=="data,format,version"||
    x.version!==VERSION||x.format!==FORMAT||!validState(x.data))
     throw Error("保存履歴の整合性がありません");
  return x.data;
 }
 function migrateAny(t){
  if(typeof t!=="string"||bytes(t)>MAX_BYTES)throw Error("容量が不正です");
  let x;try{x=JSON.parse(t)}catch(_){throw Error("JSON形式ではありません")}
  return x?.version===VERSION?parse(t):old.migrateAny(t);
 }
 return Object.freeze({VERSION,KEY,MAX_BYTES,FORMAT,
  LEGACY_KEY:old.KEY,V9_KEY:old.LEGACY_KEY,
  V7_KEY:old.V7_KEY,V6_KEY:old.V6_KEY,V5_KEY:old.V5_KEY,
  V4_KEY:old.V4_KEY,V2_KEY:old.V2_KEY,V1_KEY:old.V1_KEY,
  blank,validState,restart,serialize,parse,migrateAny});
});
