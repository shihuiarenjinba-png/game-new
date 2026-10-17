"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const first=require("../story.js");
const morning=require("../morning.js");
const cases=require("../case-variants.js");
const priorArcs=require("../major-arcs.js");
const arcs=require("../verified-arcs.js");
const puzzle=require("../deduction.js");
const save6=require("../save-v6.js");
const save7=require("../save-v7.js");
const facts=require("../case-notes-v7.js");

function night(ids){return ids.reduce((s,id)=>first.advance(s,id),first.fresh());}
function day(n,ids){return ids.reduce((s,id)=>morning.advance(s,n,id),morning.fresh(n));}
function scenario(seed,alter={}){
  const id=arcs.arcIndex(seed),arc=arcs.ARCS[id];
  const n=night(["listen",alter.record||arc.entry,
    alter.coworker||(id===1?"private":"space"),
    alter.supervisor||(id===2?"targets":"author"),"amend"]);
  const m=day(n,["examine",alter.maho||(id===1?"private":"why"),
    alter.sahara||"ask"]);
  return {night1:n,morning:m,case:cases.create(seed),deduction:puzzle.start(),arcMode:"verified"};
}
function infer(s,{focus,pair,reading="balanced"}={}){
  const a=arcs.active(s);
  const f=focus||a.focus;
  const choices=puzzle.options(s,f);
  const selected=pair||choices.find(x=>x.id.includes("arc-support")&&x.id.includes("arc-counter"))?.id||choices[0].id;
  let d=puzzle.advance(s.deduction,s,"focus:"+f);
  d=puzzle.advance(d,s,"pair:"+selected);
  d=puzzle.advance(d,s,"reading:"+reading);
  return {...s,deduction:d};
}
function end(s,report="context"){
  return {...s,morning:morning.advance(s.morning,s.night1,report)};
}

test("all 72 seeds have valid authored arcs and balanced variant factors",()=>{
  const all=[];
  for(let seed=0;seed<72;seed++){
    const s=save7.blank(seed),a=arcs.active(s),p=cases.profile(s.case);
    assert.equal(save7.validState(s),true);
    assert.ok(a);
    all.push({a:a.id,writer:p.author.id,motive:p.motive.id,incident:p.incident.id,ambience:p.ambience.id});
  }
  for(const a of arcs.ARCS){
    const x=all.filter(row=>row.a===a.id);
    assert.equal(x.length,24);
    assert.equal(new Set(x.map(y=>y.writer)).size,4);
    assert.equal(new Set(x.map(y=>y.motive)).size>=2,true);
    assert.equal(new Set(x.map(y=>y.incident)).size,3);
    assert.equal(new Set(x.map(y=>y.ambience)).size,2);
  }
});
test("next-run rotation alternates authored arcs with no repeats across 72",()=>{
  let seed=17;
  const seen=new Set();
  let before=null;
  for(let i=0;i<72;i++){
    assert.equal(seen.has(seed),false);
    const a=arcs.arcIndex(seed);
    if(before!==null)assert.notEqual(a,before);
    seen.add(seed);before=a;seed=arcs.nextSeed(seed);
  }
  assert.equal(seed,17);
  assert.equal(seen.size,72);
});
test("all 72 seeded mysteries require inspected sources plus deliberate inference",()=>{
  for(let seed=0;seed<72;seed++){
    const s=scenario(seed);
    assert.equal(save7.validState(s),true);
    assert.equal(arcs.status(s).full,true,"seed "+seed);
    assert.equal(arcs.verified(s),false);
    assert.equal(arcs.observed(s).some(f=>f.id==="arc-proof"),false);
    assert.doesNotMatch(arcs.sceneText(s),/【大きな回収/);
    const done=infer(s);
    assert.equal(puzzle.assessment(done.deduction,done).pairGrade,2);
    assert.equal(save7.validState(done),true);
    const last=end(done);
    assert.equal(save7.validState(last),true);
    assert.equal(arcs.verified(last),true);
    assert.match(arcs.sceneText(last),/【大きな回収/);
    assert.doesNotMatch(arcs.sceneText(last),/署名前の記入例|部署評価の掲示と、個人の契約更新書類を照合/);
    assert.deepEqual(save7.parse(save7.serialize(last)),last);
  }
});
test("uninspected record or missing witness prevents major climax in every case",()=>{
  for(let seed=0;seed<72;seed++){
    const arc=arcs.active(save7.blank(seed));
    const missingRecord=scenario(seed,{record:arc.entry==="wording"?"renewals":"wording"});
    const missingSupport=scenario(seed,arcs.arcIndex(seed)===1?{coworker:"repeat"}:
      {supervisor:arcs.arcIndex(seed)===2?"author":"targets"});
    const missingCounter=scenario(seed,arcs.arcIndex(seed)===1?{sahara:"quote"}:{maho:"private"});
    for(const s of [missingRecord,missingSupport,missingCounter]){
      assert.equal(arcs.status(s).full,false);
      assert.equal(arcs.verified(s),false);
      assert.doesNotMatch(arcs.sceneText(end(infer(s))),/【大きな回収/);
    }
  }
});
test("all positive reveals require a central relevant pair, not a different correct topic",()=>{
  for(let seed=0;seed<72;seed++){
    const s=scenario(seed),a=arcs.active(s);
    const other=arcs.ARCS.find(x=>x.focus!==a.focus).focus;
    const d=infer(s,{focus:other});
    assert.equal(arcs.verified(end(d)),false);
    assert.doesNotMatch(arcs.sceneText(end(d)),/【大きな回収/);
    const wrongEvidence=puzzle.options(s,a.focus).find(x=>!x.id.includes("arc-support")||!x.id.includes("arc-counter"));
    assert.ok(wrongEvidence);
    assert.equal(arcs.verified(end(infer(s,{pair:wrongEvidence.id}))),false);
  }
});
test("overclaiming changes consequences but cannot establish unseen responsibility",()=>{
  for(const seed of [0,9,26,41,52,71]){
    const base=scenario(seed);
    const cautious=end(infer(base));
    const forceful=end(infer(base,{reading:"assert"}));
    const ignored=end(infer(base,{reading:"dismiss"}));
    assert.equal(arcs.verified(cautious),true);
    assert.equal(arcs.verified(forceful),true);
    assert.equal(arcs.verified(ignored),false);
    assert.match(arcs.sceneText(forceful),/証拠の範囲を超え/);
    assert.notEqual(arcs.sceneText(cautious),arcs.sceneText(forceful));
  }
});
test("no arc proof leaks before its source or from migrated campaigns",()=>{
  for(let seed=0;seed<72;seed++){
    let state=save7.blank(seed);
    assert.deepEqual(arcs.observed(state),[]);
    assert.doesNotMatch(arcs.sceneText(state),/大きな回収|署名前の記入例|更新書類を照合/);
    const a=arcs.active(state);
    state={...state,night1:first.advance(first.advance(state.night1,"listen"),a.entry)};
    assert.deepEqual(arcs.observed(state).map(x=>x.id),["arc-primary"]);
    assert.equal(arcs.status(state).support,false);
    assert.equal(arcs.status(state).counter,false);
  }
});
test("old version 6 campaign remains original and does not gain revised ending",()=>{
  const n=night(["listen","wording","private","author","amend"]);
  const m=day(n,["examine","why","ask"]);
  const s={night1:n,morning:m,case:cases.create(2),deduction:puzzle.start(),arcMode:"major"};
  assert.equal(save6.validState(s),true);
  const old=save6.serialize(s),restored=save7.migrateAny(old);
  assert.deepEqual(restored,s);
  assert.equal(arcs.active(restored).id,priorArcs.active(restored).id);
  assert.equal(arcs.sceneText(restored),priorArcs.sceneText(restored));
  assert.deepEqual(save7.parse(save7.serialize(restored)),restored);
  const restarted=save7.restart(restored);
  assert.equal(restarted.arcMode,"major");
  assert.equal(restarted.case.seed,s.case.seed);
});
test("new stage still forbids unearned evidence and tampered inference saves",()=>{
  const s=scenario(0),done=infer(s);
  const forged={...done,deduction:{...done.deduction,pair:"arc-proof|arc-support"}};
  assert.equal(save7.validState(forged),false);
  const forgedSeed={...s,case:{...s.case,seed:72}};
  assert.equal(save7.validState(forgedSeed),false);
  assert.throws(()=>save7.parse("{bad"));
});
test("52,488 seeded choice combinations preserve correct witness logic",()=>{
  const records=["wording","stoppage","renewals"],coworkers=["private","repeat","space"],
    supervisors=["author","targets","agreement"],letters=["preserve","share","examine"],
    mahos=["private","why","name"],subjects=["ask","quote","sign"];
  let count=0,complete=0;
  for(let seed=0;seed<72;seed++){
    const a=arcs.active(save7.blank(seed));
    for(const record of records)for(const coworker of coworkers)for(const supervisor of supervisors){
      const n=night(["formal",record,coworker,supervisor,"amend"]);
      for(const letter of letters)for(const maho of mahos)for(const sahara of subjects){
        const m=day(n,[letter,maho,sahara]);
        const state={night1:n,morning:m,case:cases.create(seed),
          deduction:puzzle.start(),arcMode:"verified"};
        const st=arcs.status(state),facts=arcs.observed(state);
        const source=record===a.entry;
        const support=source&&(a.id==="two-moments"?coworker==="private":
          a.id==="silent-rule"?supervisor==="targets":supervisor==="author");
        const counter=source&&(a.id==="two-moments"?sahara==="ask":maho==="why");
        assert.equal(st.source,source);
        assert.equal(st.support,support);
        assert.equal(st.counter,counter);
        assert.equal(st.full,source&&support&&counter);
        assert.equal(facts.some(x=>x.id==="arc-primary"),source);
        assert.equal(facts.some(x=>x.id==="arc-support"),support);
        assert.equal(facts.some(x=>x.id==="arc-counter"),counter);
        assert.equal(facts.some(x=>x.id==="arc-proof"),false);
        assert.equal(arcs.verified(state),false);
        assert.doesNotMatch(arcs.sceneText(state),/【大きな回収|署名前の記入例/);
        if(st.full)complete++;
        count++;
      }
    }
  }
  assert.equal(count,52488);
  assert.ok(complete>0);
  assert.ok(complete<count);
});

test("no new navigation panes, remote API or invented charges",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const game=fs.readFileSync(path.join(__dirname,"..","game-v16.js"),"utf8");
  for(const x of ["verified-arcs.js","case-notes-v7.js","six-arcs.js","case-notes-v8.js","immersive-arcs.js","scene-beats.js","case-notes-v9.js","save-v7.js","save-v8.js","save-v9.js","reading-v10.js","deliberation-v13.js","deliberative-arcs-v13.js","notes-v13.js","reading-v13.js","save-v13.js","game-v16.js"])
    assert.ok(html.includes('src="./'+x+'"'));
  assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
  assert.equal((html.match(/<nav\b/g)||[]).length,0);
  assert.match(game,/grand\.nextSeed/);
  assert.doesNotMatch(game,/\bfetch\s*\(/);
  assert.doesNotMatch(html,/stripe|paypal|checkout/i);
});
