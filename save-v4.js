/* v0.4: safe backups including deduction, with read-only migration from v0.2/v0.3. */
(function(root,factory) {
  const old=typeof module!=="undefined" && module.exports?require("./save-guard.js"):root.HandoverSave;
  const puzzle=typeof module!=="undefined" && module.exports?require("./deduction.js"):root.HandoverDeduction;
  const api=factory(old,puzzle);
  if(typeof module!=="undefined" && module.exports)module.exports=api;
  root.HandoverSaveV4=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,puzzle) {
  "use strict";
  const FORMAT="handover-room-offline-backup";
  const VERSION=4, MAX_BYTES=65536;
  const KEY="handover-room-prototype-v4";
  const LEGACY_KEY=old.KEY;
  const FIRST_KEY=old.LEGACY_KEY;

  function validState(s) {
    if(!s || typeof s!=="object" || Array.isArray(s) ||
      Object.keys(s).sort().join(",")!=="deduction,morning,night1")return false;
    const base={night1:s.night1,morning:s.morning};
    if(!old.validState(base))return false;
    if(s.morning===null || (s.morning.scene!=="report" && s.morning.scene!=="epilogue"))
      return s.deduction===null;
    if(s.morning.scene==="epilogue" && s.deduction===null)return true; // completed v0.2 save
    if(!puzzle.validate(s.deduction,base))return false;
    return s.morning.scene==="epilogue"?s.deduction.stage==="complete":true;
  }
  function blank(){return {night1:old.blank().night1,morning:null,deduction:null};}
  function normalize(previous) {
    if(!old.validState(previous))throw new Error("以前の保存形式を読み取れません");
    const isReport=previous.morning && previous.morning.scene==="report";
    const state={night1:previous.night1,morning:previous.morning,
      deduction:isReport?puzzle.start():null};
    if(!validState(state))throw new Error("保存データの移行に失敗しました");
    return state;
  }
  function size(text){return new TextEncoder().encode(text).length;}
  function serialize(state){
    if(!validState(state))throw new Error("不正な進行履歴を保存しようとしました");
    const text=JSON.stringify({format:FORMAT,version:VERSION,data:state},null,2);
    if(size(text)>MAX_BYTES)throw new Error("記録が容量上限を超えています");
    return text;
  }
  function parse(text){
    if(typeof text!=="string" || !text.trim() || size(text)>MAX_BYTES)throw new Error("保存ファイルのサイズが不正です");
    let raw;
    try{raw=JSON.parse(text);}catch(_err){throw new Error("正しいJSONファイルではありません");}
    if(!raw || Object.keys(raw).sort().join(",")!=="data,format,version" ||
      raw.format!==FORMAT || raw.version!==VERSION)throw new Error("v0.4用の保存ファイルではありません");
    if(!validState(raw.data))throw new Error("記録の一貫性を確認できず、読み込みを拒否しました");
    return raw.data;
  }
  function migrateV2(text){return normalize(old.parse(text));}
  function migrateV1(text){
    const previous=old.fromLegacy(text);
    if(!previous)throw new Error("旧セーブの形式を確認できません");
    return normalize(previous);
  }
  return Object.freeze({FORMAT,VERSION,MAX_BYTES,KEY,LEGACY_KEY,FIRST_KEY,
    validState,blank,normalize,serialize,parse,migrateV1,migrateV2});
});
