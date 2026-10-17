/* v0.9 independent save format: preserves old narrative identities exactly.
 * All new scene reactions are derived from replayed first/second chapter choices.
 */
(function(root,factory){
  const older=typeof module!=="undefined"&&module.exports?require("./save-v8.js"):root.HandoverSaveV8;
  const base=typeof module!=="undefined"&&module.exports?require("./save-v5.js"):root.HandoverSaveV5;
  const puzzle=typeof module!=="undefined"&&module.exports?require("./deduction.js"):root.HandoverDeduction;
  const api=factory(older,base,puzzle);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverSaveV9=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(older,base,puzzle){
  "use strict";
  const VERSION=9,KEY="handover-room-prototype-v9",
    FORMAT="handover-room-offline-backup",MAX_BYTES=65536;
  function validState(s){
    if(!s||typeof s!=="object"||Array.isArray(s)||
       Object.keys(s).sort().join(",")!=="arcMode,case,deduction,morning,night1")return false;
    if(s.arcMode!=="immersive")return older.validState(s);
    if(s.case?.mode!=="procedural")return false;
    const report=s.morning?.scene==="report",ended=s.morning?.scene==="epilogue";
    const legacy={night1:s.night1,morning:s.morning,case:s.case,
      deduction:report?puzzle.start():null};
    if(!base.validState(legacy))return false;
    if(!report&&!ended)return s.deduction===null;
    if(ended&&s.deduction===null)return false;
    try{if(!puzzle.validate(s.deduction,s))return false;}catch(_err){return false;}
    return ended?s.deduction.stage==="complete":true;
  }
  function blank(seed){
    const s={...older.blank(seed),arcMode:"immersive"};
    if(!validState(s))throw Error("新しい物語を開始できません");
    return s;
  }
  function restart(s){
    if(!validState(s))throw Error("調査の履歴が正しくありません");
    return s.arcMode==="immersive"?blank(s.case.seed):older.restart(s);
  }
  function length(t){return new TextEncoder().encode(t).length;}
  function serialize(s){
    if(!validState(s))throw Error("調査記録に矛盾があります");
    const t=JSON.stringify({format:FORMAT,version:VERSION,data:s},null,2);
    if(length(t)>MAX_BYTES)throw Error("保存データが大きすぎます");
    return t;
  }
  function parse(t){
    if(typeof t!=="string"||!t.trim()||length(t)>MAX_BYTES)throw Error("保存ファイルの長さが不正です");
    let item;try{item=JSON.parse(t);}catch(_err){throw Error("JSON形式ではありません")}
    if(!item||typeof item!=="object"||Array.isArray(item)||
      Object.keys(item).sort().join(",")!=="data,format,version"||
      item.format!==FORMAT||item.version!==VERSION||!validState(item.data))
        throw Error("保存データの内容が一致しません");
    return item.data;
  }
  function migrateAny(t){
    if(typeof t!=="string"||length(t)>MAX_BYTES)throw Error("保存データが大きすぎます");
    let item;try{item=JSON.parse(t);}catch(_err){throw Error("JSON形式ではありません")}
    if(item&&item.version===VERSION)return parse(t);
    const original=older.migrateAny(t);
    if(!validState(original))throw Error("過去の記録を変更せず復元できません");
    return original;
  }
  return Object.freeze({VERSION,KEY,MAX_BYTES,FORMAT,LEGACY_KEY:older.KEY,V7_KEY:older.LEGACY_KEY,
    V6_KEY:older.V6_KEY,V5_KEY:older.V5_KEY,V4_KEY:older.V4_KEY,
    V2_KEY:older.V2_KEY,V1_KEY:older.V1_KEY,
    validState,blank,restart,serialize,parse,migrateAny});
});
