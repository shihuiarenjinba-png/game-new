/* v0.5 isolated case seed persistence. Old saves remain readable without inventing backstory. */
(function(root,factory){
  const old=typeof module!=="undefined"&&module.exports?require("./save-v4.js"):root.HandoverSaveV4;
  const cases=typeof module!=="undefined"&&module.exports?require("./case-variants.js"):root.HandoverCases;
  const api=factory(old,cases);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverSaveV5=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,cases){
  "use strict";
  const FORMAT="handover-room-offline-backup",VERSION=5,MAX_BYTES=65536;
  const KEY="handover-room-prototype-v5",LEGACY_KEY=old.KEY,
    V2_KEY="handover-room-prototype-v2", V1_KEY="handover-room-prototype-v1";
  function validState(s){
    if(!s || typeof s!=="object"||Array.isArray(s)||
      Object.keys(s).sort().join(",")!=="case,deduction,morning,night1")return false;
    if(!cases.valid(s.case))return false;
    return old.validState({night1:s.night1,morning:s.morning,deduction:s.deduction});
  }
  function blank(seed){
    const s={night1:old.blank().night1,morning:null,deduction:null,case:cases.create(seed)};
    if(!validState(s))throw Error("事件初期化に失敗しました");
    return s;
  }
  function normalize(oldState){
    if(!old.validState(oldState))throw Error("旧セーブの整合性が確認できません");
    const s={...oldState,case:cases.legacy()};
    if(!validState(s))throw Error("旧セーブの移行に失敗しました");
    return s;
  }
  function size(t){return new TextEncoder().encode(t).length;}
  function serialize(s){
    if(!validState(s))throw Error("保存する事件の整合性が確認できません");
    const raw=JSON.stringify({format:FORMAT,version:VERSION,data:s},null,2);
    if(size(raw)>MAX_BYTES)throw Error("保存データが大きすぎます");
    return raw;
  }
  function parse(raw){
    if(typeof raw!=="string"||!raw.trim()||size(raw)>MAX_BYTES)throw Error("保存ファイルの長さが不正です");
    let x;try{x=JSON.parse(raw)}catch(_err){throw Error("正しいJSONではありません")}
    if(!x || typeof x!=="object"||Array.isArray(x)||
      Object.keys(x).sort().join(",")!=="data,format,version"||
      x.format!==FORMAT||x.version!==VERSION)throw Error("v0.5の保存ファイルではありません");
    if(!validState(x.data))throw Error("事件と進行履歴の照合に失敗しました");
    return x.data;
  }
  function migrateV4(raw){return normalize(old.parse(raw));}
  function migrateV2(raw){return normalize(old.migrateV2(raw));}
  function migrateV1(raw){return normalize(old.migrateV1(raw));}
  function migrateAny(raw){
    let obj;
    try{obj=JSON.parse(raw)}catch(_err){throw Error("JSON形式ではありません")}
    if(obj && obj.version===5)return parse(raw);
    if(obj && obj.version===4)return migrateV4(raw);
    if(obj && obj.version===2 && obj.format===FORMAT)return migrateV2(raw);
    return migrateV1(raw);
  }
  return Object.freeze({VERSION,FORMAT,KEY,LEGACY_KEY,V2_KEY,V1_KEY,MAX_BYTES,
    validState,blank,normalize,serialize,parse,migrateV1,migrateV2,migrateV4,migrateAny});
});
