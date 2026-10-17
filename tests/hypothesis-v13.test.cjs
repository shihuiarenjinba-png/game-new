"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const first=require("../story.js"),morning=require("../morning.js");
const cases=require("../case-variants.js"),puzzle=require("../deduction.js");
const arcs=require("../deliberative-arcs-v13.js"),mid=require("../deliberation-v13.js");
const save=require("../save-v13.js"),old=require("../save-v9.js");
const {makeConfig,gate}=require("../scripts/store-build.cjs");
const routes={
 prefilled:["wording","space","author","why","ask"],
 "two-moments":["stoppage","private","author","private","ask"],
 "silent-rule":["renewals","space","targets","why","ask"],
 "permission-is-not-consent":["wording","space","author","private","quote"],
 "the-unspoken-objection":["stoppage","private","agreement","private","ask"],
 "protection-that-erases":["renewals","private","author","why","sign"]
};
function staged(seed){
 const s=save.blank(seed),r=routes[arcs.active(s).id],night=r.slice(0,3);
 let n=s.night1;
 for(const id of ["listen",...night,"amend"])n=first.advance(n,id);
 return {...s,night1:n};
}
function report(seed,initial="system",revision="revise"){
 let s=mid.chooseInitial(staged(seed),"hypothesis:"+initial);
 assert.equal(save.validState(s),true);
 s={...s,morning:morning.fresh(s.night1)};
 const r=routes[arcs.active(s).id];
 for(const choice of ["examine",r[3],r[4]]){
  const m=morning.advance(s.morning,s.night1,choice);
  s={...s,morning:m,deduction:m.scene==="report"?puzzle.start():s.deduction};
 }
 assert.equal(s.morning.scene,"report");
 if(revision!==null)s=mid.chooseRevision(s,"revision:"+revision);
 return s;
}
function finished(s,correct=true){
 const a=arcs.active(s),focus=a.focus;
 let d=puzzle.advance(s.deduction,s,"focus:"+focus);
 const opts=puzzle.options(s,focus);
 const best=opts.find(x=>x.id.includes("arc-support")&&x.id.includes("arc-counter"));
 assert.ok(best);
 const other=opts.find(x=>x.id!==best.id);
 d=puzzle.advance(d,s,"pair:"+(correct?best.id:other.id));
 d=puzzle.advance(d,s,"reading:balanced");
 s={...s,deduction:d};
 return {...s,morning:morning.advance(s.morning,s.night1,"context")};
}
test("all six route scripts give three provisional interpretations that depend on seen evidence",()=>{
 assert.equal(Object.keys(mid.PLOTS).length,6);
 for(let seed=0;seed<72;seed++){
  const empty=save.blank(seed),arc=arcs.active(empty);
  assert.equal(mid.firstOptions(empty).length,3);
  assert.ok(!mid.beginning({...empty,night1:{...empty.night1,scene:"ending"}}).body.includes(arc.first));
  const full=staged(seed);
  assert.equal(save.validState(full),true);
  const screen=mid.beginning(full);
  assert.ok(screen.body.includes(arc.first));
  assert.equal(new Set(screen.choices.map(x=>x.label)).size,3);
  assert.equal(screen.choices.length,3);
 }
});
test("72 seeds × 3 hypotheses × 3 reassessments always reach evidence-grounded truth",()=>{
 let checked=0;
 for(let seed=0;seed<72;seed++){
  const a=arcs.active(save.blank(seed));
  for(const initial of mid.INITIAL)for(const revision of mid.REVISION){
   let s=report(seed,initial,revision);
   assert.equal(save.validState(s),true);
   const second=mid.second({...s,midpoint:{...s.midpoint,revision:null}});
   assert.ok(second.body.includes(a.first));
   assert.ok(second.body.includes(a.second));
   assert.ok(second.body.includes(a.turn));
   assert.equal(second.choices.length,3);
   const end=finished(s,true);
   assert.equal(save.validState(end),true);
   assert.equal(arcs.verified(end),true);
   assert.match(arcs.sceneText(end),/【大きな回収/);
   assert.match(mid.reflection(end),/仮説の行方/);
   assert.deepEqual(save.parse(save.serialize(end)),end);
   checked++;
  }
 }
 assert.equal(checked,648);
});
test("the first provisional guess creates three distinct later conversation reactions in all six routes",()=>{
 for(let seed=0;seed<72;seed++){
  const lines=[];
  for(const initial of mid.INITIAL){
   const s=report(seed,initial,"revise");
   const inConversation={...s,morning:{...s.morning,scene:"maho"}};
   lines.push(mid.reflection(inConversation));
  }
  assert.equal(new Set(lines).size,3,"case "+seed);
  lines.forEach(x=>assert.ok(x.length>35));
 }
});
test("missing central document never exposes route-specific provisional explanations",()=>{
 for(let seed=0;seed<72;seed++){
  const a=arcs.active(save.blank(seed));
  const wrong=a.entry==="wording"?"stoppage":"wording";
  let s=save.blank(seed);
  for(const choice of ["listen",wrong,"repeat","agreement","amend"])
   s={...s,night1:first.advance(s.night1,choice)};
  assert.equal(s.night1.scene,"ending");
  assert.equal(save.validState(s),true);
  const options=mid.beginning(s);
  assert.ok(!options.body.includes(a.first));
  assert.ok(options.choices.every(o=>!o.label.includes(a.turn)));
  s=mid.chooseInitial(s,"hypothesis:unknown");
  s={...s,morning:morning.fresh(s.night1)};
  for(const choice of ["preserve","name","sign"]){
   const m=morning.advance(s.morning,s.night1,choice);
   s={...s,morning:m,deduction:m.scene==="report"?puzzle.start():s.deduction};
  }
  const next=mid.second(s);
  assert.ok(!next.body.includes(a.first));
  assert.ok(!next.body.includes(a.second));
  assert.ok(!next.body.includes(a.turn));
  assert.equal(arcs.status(s).source,false);
  assert.deepEqual(arcs.observed(s),[]);
  const revised=mid.chooseRevision(s,"revision:suspend");
  assert.equal(save.validState(revised),true);
 }
});
test("hypothesis cannot itself become proof; choosing a weak pair leaves the big mystery unresolved",()=>{
 for(let seed=0;seed<72;seed++){
  for(const initial of mid.INITIAL)for(const revision of mid.REVISION){
   const state=report(seed,initial,revision);
   assert.equal(arcs.verified(state),false);
   const end=finished(state,false);
   assert.equal(arcs.verified(end),false);
   assert.doesNotMatch(arcs.sceneText(end),/【大きな回収/);
   assert.match(mid.reflection(end),/届かない|足りなかった|残った/);
   assert.equal(save.validState(end),true);
  }
 }
});
test("reconsideration cannot be forged before interview or provisional theory",()=>{
 for(const seed of [0,6,24,71]){
  const empty=save.blank(seed);
  assert.throws(()=>mid.chooseInitial(empty,"hypothesis:surface"));
  assert.throws(()=>mid.chooseRevision(empty,"revision:retain"));
  const n=staged(seed);
  const chosen=mid.chooseInitial(n,"hypothesis:surface");
  assert.equal(save.validState(chosen),true);
  assert.equal(save.validState({...empty,midpoint:{initial:"surface",revision:null}}),false);
  assert.throws(()=>mid.chooseInitial(chosen,"hypothesis:system"));
  assert.equal(save.validState({...chosen,midpoint:{initial:"fake",revision:null}}),false);
  const r=report(seed,"surface",null);
  assert.equal(save.validState(r),true);
  assert.equal(save.validState({...r,deduction:{stage:"pair",focus:"records",pair:null,reading:null}}),false);
  assert.throws(()=>mid.chooseRevision(r,"revision:forged"));
  const reassessed=mid.chooseRevision(r,"revision:suspend");
  assert.equal(save.validState(reassessed),true);
  assert.throws(()=>mid.chooseRevision(reassessed,"revision:retain"));
  assert.equal(save.validState({...reassessed,midpoint:{...reassessed.midpoint,revision:"invented"}}),false);
 }
});
test("old v9 saved stories remain identical without novel checkpoints or changed conclusions",()=>{
 for(const seed of [0,7,24,45,71]){
  const legacy=old.blank(seed),exported=old.serialize(legacy);
  const restored=save.migrateAny(exported);
  assert.deepEqual(restored,legacy);
  assert.equal(restored.arcMode,"immersive");
  assert.equal(arcs.active(restored).id,require("../immersive-arcs.js").active(legacy).id);
  assert.equal(mid.reflection(restored),"");
  assert.deepEqual(save.parse(save.serialize(restored)),restored);
  assert.equal(old.serialize(legacy),exported);
 }
});
test("new interface keeps one story panel, authoring and guarded commercial packaging",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const game=fs.readFileSync(path.join(__dirname,"..","game-v13.js"),"utf8");
 const files=["deliberation-v13.js","deliberative-arcs-v13.js","notes-v13.js",
  "reading-v13.js","save-v13.js","game-v13.js"];
 for(const f of files)assert.ok(html.includes('src="./'+f+'"'));
 assert.ok(html.indexOf("deliberative-arcs-v13.js")<html.indexOf("deduction.js"));
 assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
 assert.equal((html.match(/<nav\b/g)||[]).length,0);
 assert.match(game,/midpoint\.chooseInitial/);
 assert.match(game,/midpoint\.chooseRevision/);
 assert.doesNotMatch(game,/\bfetch\s*\(/);
 const config=makeConfig({STORE_IDENTITY_NAME:"Publisher.HandoverRoom",
  STORE_PUBLISHER:"CN=Publisher",STORE_PUBLISHER_DISPLAY_NAME:"Publisher"});
 files.forEach(x=>assert.ok(config.files.includes(x),x));
 assert.ok(gate({},"win32").length>0);
});
