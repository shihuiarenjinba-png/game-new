/* v0.8 saves: expanded mysteries have an independent identifier.
 * Old runs are never retroactively assigned a different major plot.
 */
(function(root,factory){
  const previous=typeof module!=="undefined"&&module.exports?require("./save-v7.js"):root.HandoverSaveV7;
  const caseV5=typeof module!=="undefined"&&module.exports?require("./save-v5.js"):root.HandoverSaveV5;
  const puzzle=typeof module!=="undefined"&&module.exports?require("./deduction.js"):root.HandoverDeduction;
  const api=factory(previous,caseV5,puzzle);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverSaveV8=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(previous,caseV5,puzzle){
  "use strict";
  const VERSION=8,KEY="handover-room-prototype-v8",MAX_BYTES=65536,
    FORMAT="handover-room-offline-backup";
  function validState(s){
    if(!s||typeof s!=="object"||Array.isArray(s)||
      Object.keys(s).sort().join(",")!=="arcMode,case,deduction,morning,night1")return false;
    if(s.arcMode!=="expanded")return previous.validState(s);
    if(s.case?.mode!=="procedural")return false;
    const report=!!s.morning&&s.morning.scene==="report";
    const ended=!!s.morning&&s.morning.scene==="epilogue";
    // Replay the actual earlier choices before interpreting any new evidence.
    const base={night1:s.night1,morning:s.morning,case:s.case,deduction:report?puzzle.start():null};
    if(!caseV5.validState(base))return false;
    if(!report&&!ended)return s.deduction===null;
    if(ended&&s.deduction===null)return false;
    try{if(!puzzle.validate(s.deduction,s))return false;}catch(_err){return false;}
    return ended?s.deduction.stage==="complete":true;
  }
  function blank(seed){
    const state={...previous.blank(seed),arcMode:"expanded"};
    if(!validState(state))throw Error("事件の初期化に失敗");
    return state;
  }
  function restart(s){
    if(!validState(s))throw Error("現在の記録が不正");
    return s.arcMode==="expanded"?blank(s.case.seed):previous.restart(s);
  }
  function size(text){return new TextEncoder().encode(text).length;}
  function serialize(s){
    if(!validState(s))throw Error("事件の履歴に不整合");
    const t=JSON.stringify({format:FORMAT,version:VERSION,data:s},null,2);
    if(size(t)>MAX_BYTES)throw Error("保存ファイルが大きすぎます");
    return t;
  }
  function parse(t){
    if(typeof t!=="string"||!t.trim()||size(t)>MAX_BYTES)throw Error("保存ファイル容量が不正");
    let x;try{x=JSON.parse(t)}catch(_err){throw Error("JSON形式ではありません")}
    if(!x||typeof x!=="object"||Array.isArray(x)||
      Object.keys(x).sort().join(",")!=="data,format,version"||
      x.format!==FORMAT||x.version!==VERSION||!validState(x.data))
      throw Error("記録の整合性を確認できません");
    return x.data;
  }
  function migrateAny(t){
    if(typeof t!=="string"||size(t)>MAX_BYTES)throw Error("容量が不正");
    let x;try{x=JSON.parse(t)}catch(_err){throw Error("JSON形式ではありません")}
    if(x&&x.version===VERSION)return parse(t);
    const previousSave=previous.migrateAny(t);
    if(!validState(previousSave))throw Error("旧版の記録を復元できません");
    return previousSave;
  }
  return Object.freeze({VERSION,KEY,MAX_BYTES,FORMAT,LEGACY_KEY:previous.KEY,
    V6_KEY:previous.LEGACY_KEY,V5_KEY:previous.V5_KEY,
    V4_KEY:previous.V4_KEY,V2_KEY:previous.V2_KEY,V1_KEY:previous.V1_KEY,
    validState,blank,restart,serialize,parse,migrateAny});
});
