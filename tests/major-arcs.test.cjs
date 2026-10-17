"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const first=require("../story.js");
const morning=require("../morning.js");
const cases=require("../case-variants.js");
const arcs=require("../major-arcs.js");
const deduction=require("../deduction.js");
const save5=require("../save-v5.js");
const save6=require("../save-v6.js");
const {gate,makeConfig}=require("../scripts/store-build.cjs");

const playNight=ids=>ids.reduce((s,id)=>first.advance(s,id),first.fresh());
const playDay=(n,ids)=>ids.reduce((s,id)=>morning.advance(s,n,id),morning.fresh(n));
function scenario(seed,o={}){
  const arc=arcs.ARCS[Math.floor(seed/24)];
  const n=playNight(["listen",o.record||arc.entry,o.coworker||"private",
    o.supervisor||(arc.id==="silent-rule"?"targets":"author"),"amend"]);
  const m=playDay(n,["examine",o.maho||"why",o.sahara||"ask"]);
  return {night1:n,morning:m,case:cases.create(seed),deduction:deduction.start(),arcMode:"major"};
}
function end(s){
  const arc=arcs.active(s);
  let d=deduction.advance(s.deduction,s,"focus:"+arc.focus);
  d=deduction.advance(d,s,"pair:"+deduction.options(s,arc.focus)[1].id);
  d=deduction.advance(d,s,"reading:balanced");
  return {...s,deduction:d,morning:morning.advance(s.morning,s.night1,"context")};
}
test("3 authored main reveals, 24 variants each",()=>{
  assert.deepEqual(arcs.ARCS.map(x=>x.id),["prefilled","two-moments","silent-rule"]);
  const counts=[0,0,0];
  for(let i=0;i<72;i++){
    const start=save6.blank(i);
    assert.equal(save6.validState(start),true);
    const arc=arcs.active(start);
    const index=arcs.ARCS.indexOf(arc);
    counts[index]++;
    assert.ok(arc.reveal&&arc.first&&arc.second&&arc.turn);
  }
  assert.deepEqual(counts,[24,24,24]);
});
test("all 72 combinations have a reachable, coherent large reveal",()=>{
  for(let seed=0;seed<72;seed++){
    const s=scenario(seed),status=arcs.status(s);
    assert.equal(status.full,true,"case "+seed);
    assert.equal(save6.validState(s),true);
    assert.deepEqual(arcs.observed(s).map(x=>x.id),["arc-primary","arc-support","arc-counter","arc-proof"]);
    assert.match(arcs.sceneText(s),/伏線がつながる/);
    const ending=end(s);
    assert.equal(save6.validState(ending),true);
    assert.match(arcs.sceneText(ending),/大きな回収/);
    assert.deepEqual(save6.parse(save6.serialize(ending)),ending);
  }
});
test("missing any one strand prevents big payoff",()=>{
  for(let seed=0;seed<72;seed++){
    const arc=arcs.ARCS[Math.floor(seed/24)];
    const alt=arc.entry==="wording"?"renewals":"wording";
    const missingSupport=arc.id==="two-moments"?{coworker:"repeat"}:
      {supervisor:arc.id==="silent-rule"?"author":"targets"};
    const missingCounter=arc.id==="two-moments"?{sahara:"quote"}:{maho:"private"};
    for(const o of [{record:alt},missingSupport,missingCounter]){
      const s=scenario(seed,o);
      assert.equal(arcs.status(s).full,false,"case "+seed+" "+JSON.stringify(o));
      assert.doesNotMatch(arcs.sceneText(s),/伏線がつながる/);
      const ending=end(s);
      assert.doesNotMatch(arcs.sceneText(ending),/大きな回収/);
      assert.match(arcs.sceneText(ending),/まだ回収されない/);
    }
  }
});
test("major mystery is hidden before the relevant evidence is found",()=>{
  for(let seed=0;seed<72;seed++){
    const s=save6.blank(seed);
    const intro=arcs.sceneText(s);
    assert.ok(intro.length>0);
    assert.equal(arcs.observed(s).length,0);
    assert.doesNotMatch(intro,/大きな回収|伏線がつながる/);
    const n=first.advance(first.advance(s.night1,"listen"),arcs.active(s).entry);
    assert.deepEqual(arcs.observed({...s,night1:n}).map(x=>x.id),["arc-primary"]);
  }
});
test("main evidence supports only its own big deduction question",()=>{
  for(const seed of [0,24,48]){
    const s=scenario(seed),a=arcs.active(s);
    const proposed=deduction.options(s,a.focus);
    const selected=proposed.find(x=>x.id.includes("arc-counter")||x.id.includes("arc-proof"));
    assert.ok(selected,"matching grand evidence "+a.id);
    let d=deduction.advance(s.deduction,s,"focus:"+a.focus);
    d=deduction.advance(d,s,"pair:"+selected.id);
    d=deduction.advance(d,s,"reading:balanced");
    assert.equal(deduction.assessment(d,s).pairGrade,2);
    assert.equal(save6.validState({...s,deduction:d}),true);
  }
});
test("past v5 saves migrate to legacy without retroactive revelations",()=>{
  const current=scenario(30);
  const old={night1:current.night1,morning:current.morning,case:current.case,deduction:current.deduction};
  const original=save5.serialize(old);
  const restored=save6.migrateAny(original);
  assert.equal(restored.arcMode,"legacy");
  assert.equal(arcs.active(restored),null);
  assert.equal(arcs.sceneText(restored),"");
  assert.deepEqual(arcs.observed(restored),[]);
  assert.deepEqual(save6.parse(save6.serialize(restored)),restored);
  assert.equal(save5.serialize(old),original);
});
test("invalid seed, arc mode and tampered backup are rejected",()=>{
  const s=scenario(4);
  assert.equal(save6.validState({...s,arcMode:"fiction"}),false);
  const data=JSON.parse(save6.serialize(s));
  data.data.case.seed=120;
  assert.throws(()=>save6.parse(JSON.stringify(data)));
  assert.throws(()=>save6.parse("{invalid"));
});
test("round rotation alternates major arcs without repeats across 72 runs",()=>{
  let seed=0;const visited=new Set(),firstArcs=[];
  for(let i=0;i<72;i++){
    visited.add(seed);
    if(i<3)firstArcs.push(Math.floor(seed/24));
    seed=arcs.nextSeed(seed);
  }
  assert.deepEqual(firstArcs,[0,1,2]);
  assert.equal(visited.size,72);
  assert.equal(seed,0);
});
test("no extra UI panel, navigational tabs or game checkout",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const code=fs.readFileSync(path.join(__dirname,"..","game-v16.js"),"utf8");
  assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
  assert.equal((html.match(/<nav\b/g)||[]).length,0);
  for(const file of ["major-arcs.js","case-notes-v6.js","verified-arcs.js","case-notes-v7.js","six-arcs.js","case-notes-v8.js","immersive-arcs.js","scene-beats.js","case-notes-v9.js","save-v6.js","save-v7.js","save-v8.js","save-v9.js","reading-v10.js","deliberation-v13.js","deliberative-arcs-v13.js","notes-v13.js","reading-v13.js","save-v13.js","game-v16.js"])
    assert.ok(html.includes('src="./'+file+'"'));
  assert.match(code,/arcs?\.|grand\.sceneText/);
  assert.match(code,/grand\.nextSeed/);
  assert.doesNotMatch(code,/\bfetch\s*\(/);
  assert.doesNotMatch(html,/stripe|paypal|checkout/i);
  const cfg=makeConfig({STORE_IDENTITY_NAME:"Publisher.HandoverRoom",STORE_PUBLISHER:"CN=Publisher",STORE_PUBLISHER_DISPLAY_NAME:"Publisher"});
  for(const file of ["major-arcs.js","case-notes-v6.js","verified-arcs.js","case-notes-v7.js","six-arcs.js","case-notes-v8.js","immersive-arcs.js","scene-beats.js","case-notes-v9.js","save-v6.js","save-v7.js","save-v8.js","save-v9.js","reading-v10.js","deliberation-v13.js","deliberative-arcs-v13.js","notes-v13.js","reading-v13.js","save-v13.js","game-v16.js"])
    assert.ok(cfg.files.includes(file));
  assert.equal(cfg.files.includes("game-v5.js"),false);
  assert.ok(gate({},"win32").length>0);
});
