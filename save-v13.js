/* v0.13: explicit checkpoint state with complete causal phase validation.
 * v0.9 and older saves migrate byte-for-byte as their original story mode.
 */
(function(root,factory){
 const old=typeof module!=="undefined"&&module.exports?require("./save-v9.js"):root.HandoverSaveV9;
 const mid=typeof module!=="undefined"&&module.exports?require("./deliberation-v13.js"):root.HandoverDeliberation;
 const puzzle=typeof module!=="undefined"&&module.exports?require("./deduction.js"):root.HandoverDeduction;
 const api=factory(old,mid,puzzle);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverSaveV13=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,mid,puzzle){
 "use strict";
 const VERSION=13,FORMAT="handover-room-offline-backup",KEY="handover-room-prototype-v13",MAX_BYTES=65536;
 const keys=["arcMode","case","deduction","midpoint","morning","night1"].sort().join(",");
 function validState(s){
  if(!s||typeof s!=="object"||Array.isArray(s))return false;
  if(s.arcMode!=="deliberative")return old.validState(s);
  if(Object.keys(s).sort().join(",")!==keys||!mid.valid(s.midpoint)||
    s.case?.mode!=="procedural")return false;
  const base={arcMode:"immersive",night1:s.night1,morning:s.morning,
    case:s.case,deduction:s.deduction};
  if(!old.validState(base))return false;
  const firstEnd=s.night1.scene==="ending";
  if(!s.morning && (s.midpoint.initial!==null&&!firstEnd ||
    (!firstEnd&&s.midpoint.revision!==null)))return false;
  if(s.morning && s.midpoint.initial===null)return false;
  const report=s.morning?.scene==="report",ended=s.morning?.scene==="epilogue";
  if(!report&&!ended&&s.midpoint.revision!==null)return false;
  if(ended&&s.midpoint.revision===null)return false;
  if(report && s.midpoint.revision===null &&
     (s.deduction?.stage!=="focus"||!puzzle.validate(s.deduction,s)))return false;
  if(!report&&!ended&&s.deduction!==null)return false;
  return true;
 }
 function blank(seed){
  const s={...old.blank(seed),arcMode:"deliberative",midpoint:mid.blank()};
  if(!validState(s))throw Error("事件の初期化に失敗しました");
  return s;
 }
 function restart(s){
  if(!validState(s))throw Error("事件の履歴が不正です");
  return s.arcMode==="deliberative"?blank(s.case.seed):old.restart(s);
 }
 function bytes(t){return new TextEncoder().encode(t).length;}
 function serialize(s){
  if(!validState(s))throw Error("保存する事件の整合性がありません");
  const t=JSON.stringify({format:FORMAT,version:VERSION,data:s},null,2);
  if(bytes(t)>MAX_BYTES)throw Error("セーブが大きすぎます");
  return t;
 }
 function parse(t){
  if(typeof t!=="string"||!t.trim()||bytes(t)>MAX_BYTES)throw Error("ファイルの大きさが不正です");
  let item;try{item=JSON.parse(t)}catch(_){throw Error("JSON形式ではありません")}
  if(!item||typeof item!=="object"||Array.isArray(item)||
    Object.keys(item).sort().join(",")!=="data,format,version"||
    item.version!==VERSION||item.format!==FORMAT||!validState(item.data))
    throw Error("事件の履歴を検証できません");
  return item.data;
 }
 function migrateAny(t){
  if(typeof t!=="string"||bytes(t)>MAX_BYTES)throw Error("保存容量が不正です");
  let item;try{item=JSON.parse(t)}catch(_){throw Error("JSON形式ではありません")}
  return item?.version===VERSION?parse(t):old.migrateAny(t);
 }
 return Object.freeze({VERSION,KEY,FORMAT,MAX_BYTES,LEGACY_KEY:old.KEY,
  V7_KEY:old.V7_KEY,V6_KEY:old.V6_KEY,V5_KEY:old.V5_KEY,
  V4_KEY:old.V4_KEY,V2_KEY:old.V2_KEY,V1_KEY:old.V1_KEY,
  validState,blank,restart,serialize,parse,migrateAny});
});
