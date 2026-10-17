"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const first=require("../story.js");
const morning=require("../morning.js");
const cases=require("../case-variants.js");
const six=require("../six-arcs.js");
const puzzle=require("../deduction.js");
const notes=require("../case-notes-v8.js");
const oldArcs=require("../verified-arcs.js");
const save7=require("../save-v7.js");
const save8=require("../save-v8.js");
const {makeConfig,gate}=require("../scripts/store-build.cjs");

const steps={
  prefilled:{record:"wording",coworker:"space",supervisor:"author",maho:"why",sahara:"ask"},
  "two-moments":{record:"stoppage",coworker:"private",supervisor:"author",maho:"private",sahara:"ask"},
  "silent-rule":{record:"renewals",coworker:"space",supervisor:"targets",maho:"why",sahara:"ask"},
  "permission-is-not-consent":{record:"wording",coworker:"space",supervisor:"author",maho:"private",sahara:"quote"},
  "the-unspoken-objection":{record:"stoppage",coworker:"private",supervisor:"agreement",maho:"private",sahara:"ask"},
  "protection-that-erases":{record:"renewals",coworker:"private",supervisor:"author",maho:"why",sahara:"sign"}
};
function night(ids){return ids.reduce((s,id)=>first.advance(s,id),first.fresh());}
function day(n,ids){return ids.reduce((s,id)=>morning.advance(s,n,id),morning.fresh(n));}
function make(seed,overrides={}){
  const arc=six.active(save8.blank(seed)),x={...steps[arc.id],...overrides};
  const n=night(["listen",x.record,x.coworker,x.supervisor,"amend"]);
  const m=day(n,["examine",x.maho,x.sahara]);
  return {night1:n,morning:m,case:cases.create(seed),deduction:puzzle.start(),arcMode:"expanded"};
}
function infer(s,{focus,choice,reading="balanced"}={}){
  const arc=six.active(s),target=focus||arc.focus;
  const opts=puzzle.options(s,target);
  const pair=choice || opts.find(x=>x.id.includes("arc-support")&&x.id.includes("arc-counter"))?.id||opts[0].id;
  let d=puzzle.advance(s.deduction,s,"focus:"+target);
  d=puzzle.advance(d,s,"pair:"+pair);
  d=puzzle.advance(d,s,"reading:"+reading);
  return {...s,deduction:d};
}
function finalize(s,choice="context"){
  return {...s,morning:morning.advance(s.morning,s.night1,choice)};
}

test("six different main mysteries are allocated 12 ways each without losing factor diversity",()=>{
  assert.equal(six.ARCS.length,6);
  assert.equal(new Set(six.ARCS.map(x=>x.id)).size,6);
  for(const arc of six.ARCS){
    const seeds=Array.from({length:72},(_,s)=>s).filter(s=>six.active(save8.blank(s)).id===arc.id);
    assert.equal(seeds.length,12,arc.id);
    const profiles=seeds.map(s=>cases.profile(cases.create(s)));
    assert.equal(new Set(profiles.map(x=>x.author.id)).size,4,arc.id+" writers");
    for(const writer of new Set(profiles.map(x=>x.author.id))){
      assert.equal(new Set(profiles.filter(x=>x.author.id===writer).map(x=>x.motive.id)).size,
        3,arc.id+" "+writer+" motive coverage");
    }
    assert.equal(new Set(profiles.map(x=>x.incident.id)).size,3,arc.id+" side events");
    assert.equal(new Set(profiles.map(x=>x.ambience.id)).size,2,arc.id+" ambiences");
  }
});

test("six arcs all contain distinct questions, source clues and an earned ending",()=>{
  for(const a of six.ARCS){
    assert.ok(steps[a.id],a.id);
    assert.ok(a.opening&&a.first&&a.second&&a.turn&&a.promise&&a.entry);
    const seed=Array.from({length:72},(_,i)=>i).find(i=>six.active(save8.blank(i)).id===a.id);
    const state=make(seed);
    assert.equal(six.status(state).full,true);
    assert.equal(six.verified(state),false);
    const observed=six.observed(state);
    assert.deepEqual(observed.map(x=>x.id),["arc-primary","arc-support","arc-counter"]);
    assert.equal(observed.some(x=>x.id==="arc-proof"),false);
    assert.equal(notes.observed(state).some(x=>x.id==="arc-proof"),false);
    assert.match(six.sceneText(state),/照合/);
    assert.equal(save8.validState(state),true);
    const decided=infer(state);
    const e=finalize(decided);
    assert.equal(six.verified(e),true);
    assert.equal(save8.validState(e),true);
    assert.match(six.sceneText(e),/【大きな回収/);
    assert.deepEqual(save8.parse(save8.serialize(e)),e);
  }
});

test("every one of 72 seeds can reach its own earned grand ending",()=>{
  const found=new Set();
  for(let seed=0;seed<72;seed++){
    const s=make(seed),arc=six.active(s);
    assert.equal(six.status(s).full,true,"seed "+seed);
    const choices=puzzle.options(s,arc.focus);
    assert.equal(choices.length,3);
    const strong=choices.find(x=>x.id.includes("arc-support")&&x.id.includes("arc-counter"));
    assert.ok(strong,"no evidence pair for seed "+seed);
    const selected=infer(s,{choice:strong.id});
    assert.equal(puzzle.assessment(selected.deduction,selected).pairGrade,2);
    assert.equal(six.verified(selected),true);
    const end=finalize(selected);
    assert.equal(save8.validState(end),true);
    assert.match(six.sceneText(end),/【大きな回収/);
    assert.deepEqual(save8.parse(save8.serialize(end)),end);
    found.add(arc.id);
  }
  assert.equal(found.size,6);
});

test("one missing strand or wrong deduction prevents every one of the six main revelations",()=>{
  for(let seed=0;seed<72;seed++){
    const a=six.active(save8.blank(seed)),x=steps[a.id];
    const wrongRecord=a.entry==="wording"?"stoppage":"wording";
    const missingSupport=a.id==="prefilled"?{supervisor:"agreement"}:
      a.id==="two-moments"?{coworker:"repeat"}:
      a.id==="silent-rule"?{supervisor:"agreement"}:
      a.id==="permission-is-not-consent"?{coworker:"repeat"}:
      a.id==="the-unspoken-objection"?{supervisor:"targets"}:{coworker:"repeat"};
    const missingCounter=a.id==="prefilled"?{maho:"private"}:
      a.id==="two-moments"?{sahara:"quote"}:
      a.id==="silent-rule"?{maho:"private"}:
      a.id==="permission-is-not-consent"?{sahara:"sign"}:
      a.id==="the-unspoken-objection"?{maho:"why"}:{sahara:"ask"};
    for(const override of [{record:wrongRecord},missingSupport,missingCounter]){
      const s=make(seed,override),v=six.status(s);
      assert.equal(v.full,false,seed+" "+JSON.stringify(override));
      assert.equal(six.verified(finalize(infer(s))),false);
      assert.doesNotMatch(six.sceneText(finalize(infer(s))),/【大きな回収/);
    }
    const s=make(seed);
    const wrongTopic=six.ARCS.find(t=>t.focus!==a.focus).focus;
    assert.equal(six.verified(finalize(infer(s,{focus:wrongTopic}))),false);
    const wrongPair=puzzle.options(s,a.focus).find(p=>!p.id.includes("arc-support")||!p.id.includes("arc-counter"));
    assert.ok(wrongPair);
    assert.equal(six.verified(finalize(infer(s,{choice:wrongPair.id}))),false);
    assert.equal(six.verified(finalize(infer(s,{reading:"dismiss"}))),false);
  }
});

test("new routes never imply observations from choices the player skipped",()=>{
  for(let seed=0;seed<72;seed++){
    const s=save8.blank(seed),a=six.active(s);
    assert.equal(six.observed(s).length,0);
    assert.equal(six.verified(s),false);
    assert.doesNotMatch(six.sceneText(s),/【大きな回収|署名前の記入例/);
    const afterRecord={...s,night1:first.advance(first.advance(s.night1,"listen"),a.entry)};
    assert.deepEqual(six.observed(afterRecord).map(x=>x.id),["arc-primary"]);
    assert.equal(six.status(afterRecord).support,false);
    assert.equal(six.status(afterRecord).counter,false);
  }
});

test("run rotation visits 72 combinations once and changes the main plot each run",()=>{
  for(const firstSeed of [0,7,21,35,71]){
    let seed=firstSeed;
    const visited=new Set();
    let previous=null;
    for(let i=0;i<72;i++){
      assert.equal(visited.has(seed),false);
      const id=six.arcIndex(seed);
      if(previous!==null)assert.notEqual(id,previous);
      previous=id;visited.add(seed);
      seed=six.nextSeed(seed);
    }
    assert.equal(seed,firstSeed);
    assert.equal(visited.size,72);
  }
});

test("old v7 saves migrate without a different identity, explanation, or motive",()=>{
  const n=night(["listen","wording","space","author","amend"]);
  const m=day(n,["examine","why","quote"]);
  const old={night1:n,morning:m,case:cases.create(0),deduction:puzzle.start(),arcMode:"verified"};
  assert.equal(save7.validState(old),true);
  const snapshot=save7.serialize(old);
  const converted=save8.migrateAny(snapshot);
  assert.deepEqual(converted,old);
  assert.equal(six.active(converted),oldArcs.active(old));
  assert.equal(six.sceneText(converted),oldArcs.sceneText(old));
  assert.deepEqual(save8.parse(save8.serialize(converted)),converted);
  assert.equal(save7.serialize(old),snapshot);
  const restarted=save8.restart(converted);
  assert.equal(restarted.arcMode,"verified");
});

test("new saves record seed, inference, ending and detect invalid histories",()=>{
  for(const seed of [0,11,24,43,59,71]){
    const partial=make(seed),report=infer(partial),ending=finalize(report);
    for(const s of [save8.blank(seed),partial,report,ending]){
      assert.equal(save8.validState(s),true);
      assert.deepEqual(save8.parse(save8.serialize(s)),s);
    }
    const fake={...partial,case:{...partial.case,seed:72}};
    assert.equal(save8.validState(fake),false);
    const premature={...partial,morning:morning.advance(partial.morning,partial.night1,"context")};
    assert.equal(save8.validState(premature),false);
    const fakeEvidence={...report,deduction:{...report.deduction,pair:"arc-proof|arc-support"}};
    assert.equal(save8.validState(fakeEvidence),false);
  }
});

test("all authored results distinguish decision consequences without asserting unknown causes",()=>{
  for(const a of six.ARCS){
    const seed=Array.from({length:72},(_,i)=>i).find(i=>six.active(save8.blank(i)).id===a.id);
    const base=infer(make(seed));
    const texts=["context","protect","accuse"].map(x=>six.sceneText(finalize(base,x)));
    assert.equal(new Set(texts).size,3,"same outcome "+a.id);
    if(["permission-is-not-consent","the-unspoken-objection","protection-that-erases"].includes(a.id)){
      const t=texts.join(" ");
      assert.doesNotMatch(t,/真帆が解雇された|事故の直接原因が証明された|本人の意思を強制したことが確定/);
    }
  }
});

test("common UI remains one story and folded notes, and Store gate is unchanged",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const js=fs.readFileSync(path.join(__dirname,"..","game-v8.js"),"utf8");
  for(const file of ["six-arcs.js","case-notes-v8.js","save-v8.js","game-v8.js"])
    assert.ok(html.includes('src="./'+file+'"'));
  assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
  assert.equal((html.match(/<nav\b/g)||[]).length,0);
  assert.equal((html.match(/<details class="data-tools">/g)||[]).length,1);
  assert.match(js,/grand\.nextSeed/);
  assert.doesNotMatch(js,/\bfetch\s*\(/);
  const config=makeConfig({STORE_IDENTITY_NAME:"Publisher.HandoverRoom",
    STORE_PUBLISHER:"CN=Publisher",STORE_PUBLISHER_DISPLAY_NAME:"Publisher"});
  for(const file of ["six-arcs.js","case-notes-v8.js","save-v8.js","game-v8.js"])
    assert.ok(config.files.includes(file));
  assert.ok(gate({},"win32").length>0);
});
