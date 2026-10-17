"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const first=require("../story.js");
const morning=require("../morning.js");
const cases=require("../case-variants.js");
const arcs=require("../immersive-arcs.js");
const beats=require("../scene-beats.js");
const notes=require("../case-notes-v9.js");
const puzzle=require("../deduction.js");
const oldSave=require("../save-v8.js");
const save=require("../save-v9.js");
const {makeConfig,gate}=require("../scripts/store-build.cjs");

const route={
  prefilled:["wording","space","author","why","ask"],
  "two-moments":["stoppage","private","author","private","ask"],
  "silent-rule":["renewals","space","targets","why","ask"],
  "permission-is-not-consent":["wording","space","author","private","quote"],
  "the-unspoken-objection":["stoppage","private","agreement","private","ask"],
  "protection-that-erases":["renewals","private","author","why","sign"]
};
const playNight=ids=>ids.reduce((s,id)=>first.advance(s,id),first.fresh());
const playDay=(n,ids)=>ids.reduce((s,id)=>morning.advance(s,n,id),morning.fresh(n));
function episode(seed,overrides={}){
  const base=save.blank(seed);
  const arc=arcs.active(base);
  const [record,coworker,supervisor,maho,sahara]=route[arc.id];
  const n=playNight(["listen",record,coworker,supervisor,"amend"]);
  const m=playDay(n,["examine",maho,sahara]);
  return {...base,night1:n,morning:m,deduction:puzzle.start(),...overrides};
}
function infer(s,focus,selected,reading="balanced"){
  let d=puzzle.advance(s.deduction,s,"focus:"+(focus||arcs.active(s).focus));
  const pair=selected||puzzle.options(s,d.focus).find(x=>
    x.id.includes("arc-support")&&x.id.includes("arc-counter"))?.id;
  assert.ok(pair,"evidence pair available");
  d=puzzle.advance(d,s,"pair:"+pair);
  d=puzzle.advance(d,s,"reading:"+reading);
  return {...s,deduction:d};
}
function end(s,decision="context"){
  return {...s,morning:morning.advance(s.morning,s.night1,decision)};
}
test("all six separate character voices exist with an earned callback and unresolved reflection",()=>{
  assert.equal(Object.keys(beats.PACKS).length,6);
  for(const arc of arcs.ARCS){
    const pack=beats.PACKS[arc.id];
    assert.ok(pack,arc.id);
    for(const scene of ["opening","coworker","supervisor","judgment","maho","sahara","callback","missed"])
      assert.ok(pack[scene].length>15,arc.id+" "+scene);
    assert.notEqual(pack.callback,pack.missed);
  }
});
test("source, clue and final reflection are distinct across all six arcs",()=>{
  const openings=new Set(),reactions=new Set(),finals=new Set();
  for(let seed=0;seed<72;seed++){
    let s=save.blank(seed),arc=arcs.active(s);
    const opening=beats.line(s);
    assert.ok(opening.length>0);
    assert.equal(beats.safeCaseNotes(s).length,0);
    openings.add(opening);
    const ready=episode(seed);
    assert.equal(save.validState(ready),true);
    assert.equal(arcs.status(ready).full,true);
    const response=beats.line({...ready,morning:morning.fresh(ready.night1)});
    assert.ok(response.length>0);
    reactions.add(response);
    assert.equal(arcs.verified(ready),false);
    assert.ok(!notes.observed(ready).some(x=>x.id==="case-witness"));
    const decided=infer(ready);
    const finished=end(decided);
    assert.equal(arcs.verified(finished),true);
    assert.match(beats.line(finished),/。/);
    assert.equal(save.validState(finished),true);
    finals.add(beats.line(finished));
    assert.deepEqual(save.parse(save.serialize(finished)),finished);
  }
  assert.equal(openings.size,6);
  assert.equal(reactions.size,1); // letter stage reaction is an intentional shared setting
  assert.equal(finals.size,6);
});
test("no v0.9 run pretends an unasked letter writer admitted authorship",()=>{
  for(let seed=0;seed<72;seed++){
    const p=cases.profile(cases.create(seed)),s=episode(seed);
    for(const s2 of [save.blank(seed),s,end(infer(s))]){
      assert.equal(beats.safeCaseNotes(s2).some(x=>x.id==="case-witness"),false);
      const txt=beats.safeCaseText(s2);
      assert.ok(!txt.includes(p.author.reveal),"unasked confession seed "+seed);
      assert.ok(!txt.includes(p.motive.why),"undiscovered motive seed "+seed);
      assert.ok(!notes.observed(s2).some(x=>x.id==="case-witness"));
    }
  }
});
test("no paper fingerprint is noted if player did not examine the letter",()=>{
  for(let seed=0;seed<72;seed++){
    const s=episode(seed);
    for(const policy of ["share","preserve","examine"]){
      const m=playDay(s.night1,[policy,"why","ask"]);
      const x={...s,morning:m};
      const found=beats.safeCaseNotes(x).map(y=>y.id);
      assert.equal(found.includes("case-letter"),policy==="examine");
      assert.equal(found.includes("case-witness"),false);
      assert.equal(found.includes("case-side"),true);
      assert.equal(save.validState(x),true);
    }
  }
});
test("dialogue only reacts to the prior choice, never to a later one",()=>{
  const seed=0,start=save.blank(seed),a=arcs.active(start);
  const selected=first.advance(first.advance(start.night1,"listen"),a.entry);
  const prior={...start,night1:selected};
  const before=beats.line(prior);
  assert.equal(before.includes(beats.PACKS[a.id].callback),false);
  const s=episode(seed);
  const m=playDay(s.night1,["preserve","private","ask"]);
  const maho={...s,morning:morning.advance(morning.fresh(s.night1),s.night1,"preserve")};
  const read=beats.line(maho);
  assert.ok(read.includes("公開しなかった"));
  assert.ok(!read.includes("既に筆者が自白"));
  const sahara={...s,morning:playDay(s.night1,["preserve","private"])};
  assert.ok(beats.line(sahara).includes("自分で決められる"));
  const alternate={...s,morning:playDay(s.night1,["share","name"])};
  assert.notEqual(beats.line(sahara),beats.line(alternate));
  assert.equal(save.validState({...s,morning:m}),true);
});
test("full solution and neglected hypothesis yield different payoffs",()=>{
  for(let seed=0;seed<72;seed++){
    const s=episode(seed);
    const right=end(infer(s));
    assert.equal(arcs.verified(right),true);
    assert.equal(beats.line(right),beats.PACKS[arcs.active(s).id].callback);
    const other=arcs.ARCS.find(x=>x.focus!==arcs.active(s).focus).focus;
    const wrong=end(infer(s,other,puzzle.options(s,other)[0].id));
    assert.equal(arcs.verified(wrong),false);
    assert.equal(beats.line(wrong),beats.PACKS[arcs.active(s).id].missed);
    assert.notEqual(beats.line(wrong),beats.line(right));
  }
});
test("past v0.8 saves have identical case identity, prose and evidence",()=>{
  const n=playNight(["listen","wording","space","author","amend"]);
  const m=playDay(n,["examine","why","ask"]);
  const prior={...oldSave.blank(0),night1:n,morning:m,deduction:puzzle.start()};
  const old=oldSave.serialize(prior);
  const imported=save.migrateAny(old);
  assert.equal(imported.arcMode,"expanded");
  assert.equal(beats.line(imported),"");
  assert.deepEqual(imported,prior);
  assert.deepEqual(notes.observed(imported),require("../case-notes-v8.js").observed(prior));
  assert.equal(arcs.sceneText(imported),require("../six-arcs.js").sceneText(prior));
  assert.deepEqual(save.parse(save.serialize(imported)),imported);
  assert.equal(oldSave.serialize(prior),old);
  assert.equal(save.restart(imported).arcMode,"expanded");
});
test("wrongly claimed evidence cannot be inserted through save JSON",()=>{
  for(const seed of [0,1,25,48,70]){
    const s=episode(seed),done=infer(s);
    assert.equal(save.validState({...done,deduction:{...done.deduction,pair:"arc-support|case-witness"}}),false);
    assert.equal(save.validState({...s,case:{...s.case,seed:72}}),false);
    assert.throws(()=>save.parse(JSON.stringify({...JSON.parse(save.serialize(s)),version:11})));
  }
});
test("simple UI and guarded Store manifest remain intact",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const game=fs.readFileSync(path.join(__dirname,"..","game-v10.js"),"utf8");
  for(const f of ["immersive-arcs.js","scene-beats.js","case-notes-v9.js","save-v9.js","reading-v10.js","game-v10.js"])
    assert.ok(html.includes('src="./'+f+'"'),f);
  assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
  assert.equal((html.match(/<nav\b/g)||[]).length,0);
  assert.match(game,/beats\.safeCaseNotes/);
  assert.match(game,/beats\.line/);
  assert.doesNotMatch(game,/\bfetch\s*\(/);
  assert.doesNotMatch(html,/paypal|stripe|checkout/i);
  const cfg=makeConfig({STORE_IDENTITY_NAME:"Publisher.HandoverRoom",
    STORE_PUBLISHER:"CN=Vendor",STORE_PUBLISHER_DISPLAY_NAME:"Vendor"});
  for(const f of ["immersive-arcs.js","scene-beats.js","case-notes-v9.js","save-v9.js","reading-v10.js","game-v10.js"])
    assert.ok(cfg.files.includes(f),f);
  assert.ok(gate({},"win32").length>0);
});
