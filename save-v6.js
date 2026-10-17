/* v0.6 backup: new major-arc runs only; old saves migrate as unchanged legacy.
 * No previously unseen evidence is added to an in-progress older case.
 */
(function(root,factory){
  const old=typeof module!=="undefined"&&module.exports?require("./save-v5.js"):root.HandoverSaveV5;
  const puzzle=typeof module!=="undefined"&&module.exports?require("./deduction.js"):root.HandoverDeduction;
  const arcs=typeof module!=="undefined"&&module.exports?require("./major-arcs.js"):root.HandoverGrandArcs;
  const api=factory(old,puzzle,arcs);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverSaveV6=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,puzzle,arcs){
  "use strict";
  const FORMAT="handover-room-offline-backup",VERSION=6,MAX_BYTES=65536;
  const KEY="handover-room-prototype-v6",LEGACY_KEY=old.KEY,V4_KEY=old.LEGACY_KEY,
    V2_KEY=old.V2_KEY,V1_KEY=old.V1_KEY;
  function validState(s){
    if(!s||typeof s!=="object"||Array.isArray(s)||
      Object.keys(s).sort().join(",")!=="arcMode,case,deduction,morning,night1"||
      !["major","legacy"].includes(s.arcMode))return false;
    if(s.arcMode==="major"&&s.case?.mode!=="procedural")return false;
    const base={night1:s.night1,morning:s.morning,case:s.case,deduction:s.deduction};
    if(s.arcMode==="legacy")return old.validState(base);
    // Check the chapter history independently of the newly supplied deduction, so
    // that source-pairs from the major arc can be validated against the full v6 state.
    const report=!!s.morning&&s.morning.scene==="report";
    const ended=!!s.morning&&s.morning.scene==="epilogue";
    const historyOnly={...base,deduction:report?puzzle.start():null};
    if(!old.validState(historyOnly))return false;
    if(!report&&!ended)return s.deduction===null;
    if(ended&&s.deduction===null)return false;
    if(!puzzle.validate(s.deduction,s))return false;
    return ended?s.deduction.stage==="complete":true;
  }
  function blank(seed){
    const state={...old.blank(seed),arcMode:"major"};
    if(!validState(state))throw Error("事件の初期化に失敗しました");
    return state;
  }
  function normalize(oldState){
    if(!old.validState(oldState))throw Error("元のセーブデータが不正です");
    return {...oldState,arcMode:"legacy"};
  }
  function len(t){return new TextEncoder().encode(t).length;}
  function serialize(s){
    if(!validState(s))throw Error("進行の整合性がありません");
    const text=JSON.stringify({format:FORMAT,version:VERSION,data:s},null,2);
    if(len(text)>MAX_BYTES)throw Error("セーブファイルが大きすぎます");
    return text;
  }
  function parse(t){
    if(typeof t!=="string"||!t.trim()||len(t)>MAX_BYTES)throw Error("ファイル容量が不正です");
    let o;try{o=JSON.parse(t);}catch(_err){throw Error("JSONではありません");}
    if(!o||typeof o!=="object"||Array.isArray(o)||
      Object.keys(o).sort().join(",")!=="data,format,version"||
      o.format!==FORMAT||o.version!==VERSION||!validState(o.data))throw Error("保存した事件を確認できません");
    return o.data;
  }
  function migrateAny(t){
    if(typeof t!=="string"||len(t)>MAX_BYTES)throw Error("ファイル容量が不正です");
    let o;try{o=JSON.parse(t)}catch(_err){throw Error("JSONではありません")}
    if(o&&o.version===VERSION)return parse(t);
    return normalize(old.migrateAny(t));
  }
  return Object.freeze({FORMAT,VERSION,KEY,LEGACY_KEY,V4_KEY,V2_KEY,V1_KEY,MAX_BYTES,
    validState,blank,normalize,serialize,parse,migrateAny});
});
