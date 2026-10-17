"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const first=require("../story.js");
const morning=require("../morning.js");
const old=require("../save-guard.js");
const guard=require("../save-v4.js");
const deduction=require("../deduction.js");
const {gate,makeConfig}=require("../scripts/store-build.cjs");

function playNight(ids) {return ids.reduce((s,id)=>first.advance(s,id),first.fresh());}
function playDay(n,ids) {return ids.reduce((s,id)=>morning.advance(s,n,id),morning.fresh(n));}
function reportState(nightIds=["listen","wording","private","author","amend"],
  morningIds=["preserve","private","ask"]) {
  const n=playNight(nightIds);
  return {night1:n,morning:playDay(n,morningIds),deduction:deduction.start()};
}
function runPuzzle(s,focus,pair,reading) {
  const f=deduction.advance(s.deduction,s,"focus:"+focus);
  const p=deduction.advance(f,s,"pair:"+pair);
  return deduction.advance(p,s,"reading:"+reading);
}

test("all puzzle options are pairs of actually discovered evidence",()=>{
  const s=reportState();
  assert.equal(guard.validState(s),true);
  const have=new Set([...s.night1.clues,...s.morning.findings]);
  for(const focus of Object.keys(deduction.FOCI)) {
    const choices=deduction.options(s,focus);
    assert.equal(choices.length,3);
    assert.equal(new Set(choices.map(x=>x.id)).size,3);
    for(const p of choices){
      const ids=p.id.split("|");
      assert.equal(ids.length,2);
      ids.forEach(id=>assert.ok(have.has(id),id));
    }
  }
});

test("careful record inference requires the actual wording plus editor testimony",()=>{
  const s=reportState();
  const source=deduction.options(s,"records").find(p=>p.id.includes("wording") && p.id.includes("draft"));
  assert.ok(source);
  const d=runPuzzle(s,"records",source.id,"balanced");
  const review=deduction.assessment(d,s);
  assert.equal(review.pairGrade,2);
  assert.match(review.status,/根拠を示した/);
  assert.equal(review.sources.length,2);
  assert.equal(deduction.validate(d,s),true);
});

test("a strong pair cannot prove motive; overclaiming has different consequences",()=>{
  const s=reportState();
  const source=deduction.options(s,"records").find(p=>p.id.includes("wording") && p.id.includes("draft"));
  const overstated=deduction.assessment(runPuzzle(s,"records",source.id,"assert"),s);
  const careful=deduction.assessment(runPuzzle(s,"records",source.id,"balanced"),s);
  const neglected=deduction.assessment(runPuzzle(s,"records",source.id,"dismiss"),s);
  assert.match(overstated.status,/断定/);
  assert.notEqual(overstated.consequence,careful.consequence);
  assert.notEqual(neglected.consequence,careful.consequence);
});

test("the personal-agency hypothesis compares the subject with a different account",()=>{
  const s=reportState();
  const p=deduction.options(s,"agency").find(x=>x.id.includes("voice") && x.id.includes("confession"));
  assert.ok(p);
  assert.equal(deduction.assessment(runPuzzle(s,"agency",p.id,"balanced"),s).pairGrade,2);
});

test("pressure argument is grounded only if related evidence was found",()=>{
  const weak=reportState();
  const p=deduction.options(weak,"pressure")[0];
  assert.equal(deduction.assessment(runPuzzle(weak,"pressure",p.id,"balanced"),weak).pairGrade,0);
  const strong=reportState(["formal","renewals","space","targets","hold"],
    ["examine","why","quote"]);
  const good=deduction.options(strong,"pressure").find(x=>x.id.includes("renewals") && x.id.includes("quota"));
  assert.ok(good);
  assert.equal(deduction.assessment(runPuzzle(strong,"pressure",good.id,"balanced"),strong).pairGrade,2);
});

test("unseen evidence, noncandidate pairs and corrupted deduction are rejected",()=>{
  const s=reportState();
  assert.throws(()=>deduction.advance(deduction.start(),s,"focus:ghost"));
  const d=deduction.advance(deduction.start(),s,"focus:agency");
  assert.throws(()=>deduction.advance(d,s,"pair:missing|evidence"));
  assert.equal(deduction.validate({...d,pair:"fake"},s),false);
  assert.equal(guard.validState({...s,deduction:{stage:"complete",focus:"records",pair:"not|found",reading:"balanced"}}),false);
});

test("deduction must be complete before concluding the existing morning chapter",()=>{
  const s=reportState();
  const m=morning.advance(s.morning,s.night1,"context");
  assert.equal(guard.validState({...s,morning:m}),false);
  const pair=deduction.options(s,"records")[1].id;
  const done=runPuzzle(s,"records",pair,"balanced");
  const completed={night1:s.night1,morning:m,deduction:done};
  assert.equal(guard.validState(completed),true);
  assert.deepEqual(guard.parse(guard.serialize(completed)),completed);
  assert.equal(deduction.assessment(done,completed).status,deduction.assessment(done,s).status);
});

test("resume during each inference step without losing selected facts",()=>{
  const base=reportState();
  const choices=deduction.options(base,"records");
  let d=base.deduction;
  const states=[d];
  d=deduction.advance(d,base,"focus:records");states.push(d);
  d=deduction.advance(d,base,"pair:"+choices[0].id);states.push(d);
  d=deduction.advance(d,base,"reading:balanced");states.push(d);
  for(const step of states) {
    const current={...base,deduction:step};
    assert.deepEqual(guard.parse(guard.serialize(current)),current);
  }
});

test("one-step rewind is valid and lets players revise evidence without starting over",()=>{
  const base=reportState();
  const focus=deduction.advance(base.deduction,base,"focus:records");
  const pair=deduction.advance(focus,base,"pair:"+deduction.options(base,"records")[0].id);
  const complete=deduction.advance(pair,base,"reading:assert");
  assert.deepEqual(deduction.rewind(focus,base),deduction.start());
  assert.deepEqual(deduction.rewind(pair,base),focus);
  assert.deepEqual(deduction.rewind(complete,base),pair);
  assert.equal(guard.validState({...base,deduction:deduction.rewind(complete,base)}),true);
  assert.equal(guard.validState({...base,deduction:deduction.rewind(pair,base)}),true);
});

test("v0.2/v0.3 backup migrates without touching old data; v0.1 stays compatible",()=>{
  const s=reportState();
  const oldData={night1:s.night1,morning:s.morning};
  const oldJSON=old.serialize(oldData);
  const oldSnapshot=oldJSON;
  const newData=guard.migrateV2(oldJSON);
  assert.equal(newData.deduction.stage,"focus");
  assert.equal(oldJSON,oldSnapshot);
  assert.deepEqual(newData.night1,s.night1);
  const oldNight=JSON.stringify(s.night1);
  const migrated1=guard.migrateV1(oldNight);
  assert.equal(migrated1.morning,null);
  assert.equal(migrated1.deduction,null);
  assert.throws(()=>guard.parse(oldJSON));
  assert.throws(()=>guard.migrateV2("{bad}"));
});

test("completed v0.2 saves preserve their outcome without forced new gameplay",()=>{
  const night=playNight(["formal","renewals","repeat","targets","approve"]);
  const end=playDay(night,["share","name","sign","accuse"]);
  const oldData={night1:night,morning:end};
  const migrated=guard.migrateV2(old.serialize(oldData));
  assert.equal(migrated.deduction,null);
  assert.equal(guard.validState(migrated),true);
  assert.deepEqual(guard.parse(guard.serialize(migrated)),migrated);
});

test("the markup presents deduction in the same existing choice panel, no new tabs",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const game=fs.readFileSync(path.join(__dirname,"..","game-v4.js"),"utf8");
  const paths=["story.js","morning.js","save-guard.js","case-notes.js","deduction.js","save-v4.js","game-v4.js"];
  let last=-1;
  for(const p of paths) {
    const at=html.indexOf('src="./'+p+'"');
    assert.ok(at>last,p+" script missing or misordered");
    last=at;
  }
  assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
  assert.equal((html.match(/<nav\b/g)||[]).length,0);
  assert.match(game,/if \(doingDeduction\)/);
  assert.match(game,/deduction\.assessment/);
  assert.doesNotMatch(game,/\bfetch\s*\(/);
  assert.doesNotMatch(html,/checkout|stripe|paypal/i);
  const config=makeConfig({STORE_IDENTITY_NAME:"Publisher.HandoverRoom",STORE_PUBLISHER:"CN=Publisher",STORE_PUBLISHER_DISPLAY_NAME:"Publisher"});
  assert.ok(config.files.includes("deduction.js"));
  assert.ok(config.files.includes("save-v4.js"));
  assert.ok(gate({},"win32").length>0);
});

test("small sample across each final report decision preserves integrity",()=>{
  const s=reportState(["listen","stoppage","private","author","amend"],["examine","why","ask"]);
  for(const focus of Object.keys(deduction.FOCI)) {
    for(const pair of deduction.options(s,focus)) {
      for(const reading of ["assert","balanced","dismiss"]) {
        const done=runPuzzle(s,focus,pair.id,reading);
        for(const report of ["context","protect","accuse"]) {
          const next={night1:s.night1,morning:morning.advance(s.morning,s.night1,report),deduction:done};
          assert.equal(guard.validState(next),true);
          assert.deepEqual(guard.parse(guard.serialize(next)),next);
        }
      }
    }
  }
});
