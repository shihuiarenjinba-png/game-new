"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const first=require("../story.js");
const morning=require("../morning.js");
const cases=require("../case-variants.js");
const notes=require("../case-notes-v5.js");
const deduction=require("../deduction.js");
const oldGuard=require("../save-v4.js");
const guard=require("../save-v5.js");
const {makeConfig,gate}=require("../scripts/store-build.cjs");

function night(ids){return ids.reduce((s,id)=>first.advance(s,id),first.fresh());}
function day(n,ids){return ids.reduce((s,id)=>morning.advance(s,n,id),morning.fresh(n));}
function run(seed,{trace=true,reveal=true,finish=false}={}){
  const profile=cases.profile(cases.create(seed));
  const record=trace?profile.author.trigger:
    profile.author.trigger==="wording"?"renewals":"wording";
  const n=night(["listen",record,"private","author","amend"]);
  const r=profile.author.route;
  const m=day(n,[
    reveal?"examine":"share",
    reveal?(r.maho||"why"):"name",
    reveal?(r.sahara||"ask"):"sign",
    ...(finish?["context"]:[])
  ]);
  return {night1:n,morning:m,case:cases.create(seed),deduction:finish?null:deduction.start()};
}

test("4 authors × 3 motives × 3 side events × 2 ambience = 72 distinct consistent packets",()=>{
  assert.equal(cases.COUNT,72);
  const seen=new Set(),authors=new Set(),motives=new Set(),events=new Set(),ambiences=new Set();
  for(let seed=0;seed<cases.COUNT;seed++) {
    const p=cases.profile(cases.create(seed));
    seen.add([p.author.id,p.motive.id,p.incident.id,p.ambience.id].join("/"));
    authors.add(p.author.id);
    motives.add(p.author.id+":"+p.motive.id);
    events.add(p.incident.id);
    ambiences.add(p.ambience.id);
    assert.ok(p.author.lead && p.author.letter && p.author.reveal);
    assert.ok(p.motive.clue && p.motive.why);
    assert.ok(p.incident.hook && p.incident.answer);
  }
  assert.equal(seen.size,72);
  assert.equal(authors.size,4);
  assert.equal(motives.size,12);
  assert.equal(events.size,3);
  assert.equal(ambiences.size,2);
});

test("same case seed always reproduces foreshadowing, investigator facts and payoff",()=>{
  const a=run(41);
  const b=run(41);
  assert.deepEqual(cases.profile(a.case),cases.profile(b.case));
  assert.deepEqual(notes.observed(a),notes.observed(b));
  assert.equal(cases.sceneText(a.case,a),cases.sceneText(b.case,b));
  assert.deepEqual(guard.parse(guard.serialize(a)),a);
});

test("every procedural case can be investigated and its authored payoff can be found",()=>{
  const authors=new Set();
  for(let seed=0;seed<cases.COUNT;seed++){
    const s=run(seed);
    assert.equal(guard.validState(s),true);
    assert.equal(cases.isRevealed(s.case,s),true,"seed "+seed);
    const facts=notes.observed(s);
    const ids=new Set(facts.map(f=>f.id));
    assert.ok(ids.has("case-record"),"record "+seed);
    assert.ok(ids.has("case-letter"),"letter "+seed);
    assert.ok(ids.has("case-witness"),"witness "+seed);
    assert.match(cases.sceneText(s.case,s),/回収された伏線/);
    authors.add(cases.profile(s.case).author.id);
    assert.deepEqual(guard.parse(guard.serialize(s)),s);
  }
  assert.equal(authors.size,4);
});

test("wrong evidence or questioning never magically reveals the author",()=>{
  for(let seed=0;seed<cases.COUNT;seed++){
    const s=run(seed,{trace:false,reveal:false});
    assert.equal(cases.isRevealed(s.case,s),false,"seed "+seed);
    assert.equal(notes.observed(s).some(x=>x.id==="case-witness"),false);
    assert.doesNotMatch(cases.sceneText(s.case,s),/回収された伏線/);
    assert.match(cases.sceneText(s.case,s),/確かな証言は得られていない/);
  }
});

test("independent side mysteries are not resolved without the relevant question",()=>{
  const caseIndex=1; // Maho packet: the writer can confess to a private approach.
  const profile=cases.profile(cases.create(caseIndex));
  const n=night(["listen",profile.author.trigger,"private","author","amend"]);
  const m=day(n,["examine","private","ask","context"]);
  const complete={night1:n,morning:m,case:cases.create(caseIndex),deduction:null};
  assert.equal(cases.isRevealed(complete.case,complete),true);
  const epilogue=cases.sceneText(complete.case,complete);
  assert.match(epilogue,/聞き取る機会を逃した/);
  assert.ok(!epilogue.includes(profile.incident.answer));
  assert.equal(cases.observed(complete.case,complete).some(x=>x.id==="case-side"),false);
});

test("the source list respects time causality and only discovered material",()=>{
  const seed=0, profile=cases.profile(cases.create(seed));
  let n=first.fresh();
  let s={night1:n,morning:null,case:cases.create(seed),deduction:null};
  assert.equal(cases.observed(s.case,s).length,0);
  n=first.advance(n,"listen");n=first.advance(n,profile.author.trigger);
  s={...s,night1:n};
  assert.deepEqual(cases.observed(s.case,s).map(x=>x.id),["case-record"]);
  for(const id of ["private","author","amend"])n=first.advance(n,id);
  s={...s,night1:n,morning:morning.fresh(n)};
  assert.deepEqual(cases.observed(s.case,s).map(x=>x.id),["case-record"]);
  s={...s,morning:morning.advance(s.morning,n,"examine")};
  assert.deepEqual(cases.observed(s.case,s).map(x=>x.id),["case-record","case-letter"]);
  assert.equal(cases.isRevealed(s.case,s),false);
});

test("a discovered procedural witness is usable as grounded deduction evidence",()=>{
  for(const seed of [0,1,2,3]){
    const s=run(seed);
    const f=deduction.advance(s.deduction,s,"focus:records");
    const proposals=deduction.options(s,"records");
    assert.ok(proposals.some(x=>x.id.includes("case-witness") || x.id.includes("case-side")));
    const chosen=proposals.find(x=>x.id.includes("case-witness"))||proposals[0];
    const p=deduction.advance(f,s,"pair:"+chosen.id);
    const done=deduction.advance(p,s,"reading:balanced");
    assert.equal(deduction.validate(done,s),true);
    assert.match(deduction.assessment(done,s).status,/推理|照合|根拠/);
    const w={...s,deduction:done};
    assert.equal(guard.validState(w),true);
    assert.deepEqual(guard.parse(guard.serialize(w)),w);
  }
});

test("old completed chapters remain untouched and no unrelated procedural facts appear",()=>{
  const n=night(["listen","wording","private","author","amend"]);
  const m=day(n,["preserve","why","ask","context"]);
  const prior={night1:n,morning:m,deduction:null};
  const original=oldGuard.serialize(prior);
  const migrated=guard.migrateV4(original);
  assert.equal(migrated.case.mode,"legacy");
  assert.equal(cases.sceneText(migrated.case,migrated),"");
  assert.deepEqual(cases.observed(migrated.case,migrated),[]);
  assert.equal(guard.validState(migrated),true);
  assert.equal(oldGuard.serialize(prior),original);
});

test("v1, v2 and v4 backups migrate without erasing source and reject forgeries",()=>{
  const n=night(["listen","renewals","private","author","amend"]);
  const m=day(n,["examine","why","ask"]);
  const oldReport={night1:n,morning:m,deduction:deduction.start()};
  const migrated=guard.migrateV4(oldGuard.serialize(oldReport));
  assert.equal(migrated.case.mode,"legacy");
  assert.equal(migrated.deduction.stage,"focus");
  assert.deepEqual(guard.parse(guard.serialize(migrated)),migrated);
  const early=guard.migrateV1(JSON.stringify(n));
  assert.equal(early.morning,null);
  assert.equal(early.case.mode,"legacy");
  const bad={...guard.blank(0),case:{mode:"procedural",version:1,seed:72}};
  assert.equal(guard.validState(bad),false);
  assert.throws(()=>guard.parse(JSON.stringify({format:guard.FORMAT,version:5,data:bad})));
  assert.throws(()=>guard.parse(guard.serialize(guard.blank(0)).replace('"seed": 0','"seed": 999')));
});

test("72 sequential cases have no duplicate before cycling",()=>{
  let n=15;const unique=new Set();
  for(let i=0;i<72;i++) {unique.add(n);n=cases.nextSeed(n);}
  assert.equal(unique.size,72);
  assert.equal(n,15);
  assert.deepEqual(cases.profile(cases.create(cases.nextSeed(0))).author.id,"maho");
});

test("no procedural author names leak into introduction before evidence is collected",()=>{
  for(let seed=0;seed<72;seed++) {
    const c=cases.create(seed);
    const p=cases.profile(c);
    const s={night1:first.fresh(),morning:null,deduction:null,case:c};
    const opening=cases.sceneText(c,s);
    assert.ok(opening.length>0);
    assert.equal(opening.includes(p.author.name),false);
    assert.equal(cases.observed(c,s).length,0);
  }
});

test("the only UI is existing story and evidence panel, no new tabs",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const game=fs.readFileSync(path.join(__dirname,"..","game-v5.js"),"utf8");
  assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
  assert.equal((html.match(/<nav\b/g)||[]).length,0);
  assert.ok(html.includes('src="./game-v5.js"'));
  assert.ok(!html.includes('src="./game-v4.js"'));
  assert.match(game,/別の事件を調査する/);
  assert.match(game,/同じ事件を最初から調べ直す/);
  assert.match(game,/cases\.nextSeed/);
  assert.doesNotMatch(game,/\bfetch\s*\(/);
  const config=makeConfig({STORE_IDENTITY_NAME:"Publisher.HandoverRoom",STORE_PUBLISHER:"CN=Publisher",STORE_PUBLISHER_DISPLAY_NAME:"Publisher"});
  for(const x of ["case-variants.js","case-notes-v5.js","save-v5.js","game-v5.js"]) assert.ok(config.files.includes(x));
  assert.equal(config.files.includes("game-v4.js"),false);
  assert.ok(gate({},"win32").length>0);
});
