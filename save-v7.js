/* v0.7 content version. v0.6 saves stay on their original narrative rules. */
(function(root,factory){
  const previous=typeof module!=="undefined"&&module.exports?require("./save-v6.js"):root.HandoverSaveV6;
  const game5=typeof module!=="undefined"&&module.exports?require("./save-v5.js"):root.HandoverSaveV5;
  const puzzle=typeof module!=="undefined"&&module.exports?require("./deduction.js"):root.HandoverDeduction;
  const api=factory(previous,game5,puzzle);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverSaveV7=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(previous,game5,puzzle){
  "use strict";
  const VERSION=7,KEY="handover-room-prototype-v7",MAX_BYTES=65536,
    FORMAT="handover-room-offline-backup";
  function validState(s){
    if(!s||typeof s!=="object"||Array.isArray(s)||
      Object.keys(s).sort().join(",")!=="arcMode,case,deduction,morning,night1")return false;
    if(s.arcMode!=="verified")return previous.validState(s);
    if(s.case?.mode!=="procedural")return false;
    const report=!!s.morning&&s.morning.scene==="report";
    const ended=!!s.morning&&s.morning.scene==="epilogue";
    // Independently replay the chapter history without the new inference overlay.
    const base={night1:s.night1,morning:s.morning,case:s.case,
      deduction:report?puzzle.start():null};
    if(!game5.validState(base))return false;
    if(!report&&!ended)return s.deduction===null;
    if(ended&&s.deduction===null)return false;
    try{
      if(!puzzle.validate(s.deduction,s))return false;
    }catch(_err){return false;}
    return ended?s.deduction.stage==="complete":true;
  }
  function blank(seed){
    const result={...previous.blank(seed),arcMode:"verified"};
    if(!validState(result))throw Error("事件の初期化に失敗しました");
    return result;
  }
  function restart(s){
    if(!validState(s))throw Error("既存の記録が不正です");
    if(s.arcMode==="verified")return blank(s.case.seed);
    const result={...previous.blank(s.case.mode==="procedural"?s.case.seed:0),
      arcMode:s.arcMode,case:s.case};
    if(!validState(result))throw Error("過去の事件形式を再現できません");
    return result;
  }
  function size(t){return new TextEncoder().encode(t).length;}
  function serialize(s){
    if(!validState(s))throw Error("保存記録の整合性を確認できません");
    const t=JSON.stringify({format:FORMAT,version:VERSION,data:s},null,2);
    if(size(t)>MAX_BYTES)throw Error("保存可能な容量を超えました");
    return t;
  }
  function parse(t){
    if(typeof t!=="string"||!t.trim()||size(t)>MAX_BYTES)throw Error("保存ファイルの容量が不正です");
    let x;try{x=JSON.parse(t);}catch(_err){throw Error("JSON形式ではありません");}
    if(!x||typeof x!=="object"||Array.isArray(x)||
      Object.keys(x).sort().join(",")!=="data,format,version"||
      x.version!==VERSION||x.format!==FORMAT||!validState(x.data))
      throw Error("記録と事件の整合性を確認できません");
    return x.data;
  }
  function migrateAny(t){
    if(typeof t!=="string"||size(t)>MAX_BYTES)throw Error("保存ファイルの容量が不正です");
    let x;try{x=JSON.parse(t)}catch(_err){throw Error("JSON形式ではありません");}
    if(x&&x.version===VERSION)return parse(t);
    const migrated=previous.migrateAny(t);
    if(!validState(migrated))throw Error("旧版の復元に失敗しました");
    return migrated;
  }
  return Object.freeze({VERSION,KEY,MAX_BYTES,FORMAT,LEGACY_KEY:previous.KEY,
    V5_KEY:previous.LEGACY_KEY,V4_KEY:previous.V4_KEY,
    V2_KEY:previous.V2_KEY,V1_KEY:previous.V1_KEY,
    validState,blank,restart,serialize,parse,migrateAny});
});
