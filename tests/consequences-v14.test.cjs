"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const first=require("../story.js"),morning=require("../morning.js");
const mid=require("../midpoint-v14.js"),deduction=require("../deduction.js");
const arcs=require("../arcs-v14.js"),results=require("../consequences-v14.js");
const reader=require("../reading-v14.js"),save=require("../save-v14.js");
const former=require("../save-v13.js"),notes=require("../notes-v14.js");
const beats=require("../scene-beats.js");
const {makeConfig,gate}=require("../scripts/store-build.cjs");
const steps={
 prefilled:["wording","space","author","why","ask"],
 "two-moments":["stoppage","private","author","private","ask"],
 "silent-rule":["renewals","space","targets","why","ask"],
 "permission-is-not-consent":["wording","space","author","private","quote"],
 "the-unspoken-objection":["stoppage","private","agreement","private","ask"],
 "protection-that-erases":["renewals","private","author","why","sign"]
};
function report(seed,initial="surface",revision="revise"){
 let s=save.blank(seed),r=steps[arcs.active(s).id];
 for(const choice of ["listen",r[0],r[1],r[2],"amend"])
  s={...s,night1:first.advance(s.night1,choice)};
 s=mid.chooseInitial(s,"hypothesis:"+initial);
 s={...s,morning:morning.fresh(s.night1)};
 for(const choice of ["examine",r[3],r[4]]){
  const newMorning=morning.advance(s.morning,s.night1,choice);
  s={...s,morning:newMorning,deduction:newMorning.scene==="report"?deduction.start():null};
 }
 s=mid.chooseRevision(s,"revision:"+revision);
 return s;
}
function finish(s,{correct=true,focus,reading="balanced",decision="context"}={}){
 const target=focus||arcs.active(s).focus;
 const choices=deduction.options(s,target);
 const good=choices.find(x=>x.id.includes("arc-support")&&x.id.includes("arc-counter"));
 if(!good)throw Error("Missing route evidence");
 const other=choices.find(x=>x.id!==good.id);
 let d=deduction.advance(s.deduction,s,"focus:"+target);
 d=deduction.advance(d,s,"pair:"+(correct?good.id:other.id));
 d=deduction.advance(d,s,"reading:"+reading);
 return {...s,deduction:d,morning:morning.advance(s.morning,s.night1,decision)};
}
function rendered(s){
 const screen=morning.view(s.morning,s.night1),support=mid.compatible(s);
 return reader.compose(s,screen,{major:arcs.sceneText(s),
  beat:beats.line(support),case:beats.safeCaseText(support),
  review:deduction.assessment(s.deduction,s),verified:arcs.verified(s)});
}
test("six arcs × 72 random identities × nine belief transitions × three report decisions are deterministic",()=>{
 let examined=0;
 for(let seed=0;seed<72;seed++){
  const arc=arcs.active(save.blank(seed));
  const themes=results.THEMES[arc.id];
  assert.ok(themes,arc.id);
  for(const initial of mid.INITIAL)for(const revision of mid.REVISION){
   const s=report(seed,initial,revision);
   assert.equal(save.validState(s),true);
   for(const decision of ["context","protect","accuse"]){
    const done=finish(s,{decision});
    assert.equal(arcs.verified(done),true);
    assert.equal(save.validState(done),true);
    const end=results.result(done);
    assert.match(end,/【あなたの推理が残したもの】/);
    assert.match(end,/【報告書の扱い】/);
    assert.ok(end.includes(themes[decision]));
    assert.ok(end.includes(results.THEORY[initial][revision]));
    assert.deepEqual(save.parse(save.serialize(done)),done);
    const story=rendered(done);
    assert.equal((story.match(/【あなたの推理が残したもの】/g)||[]).length,1);
    assert.equal((story.match(/【大きな回収/g)||[]).length,1);
    assert.ok(!story.includes("【あなたの報告後】"));
    assert.ok(story.length<1350,"too long "+arc.id+" "+story.length);
    examined++;
   }
  }
 }
 assert.equal(examined,1944);
});
test("unearned inference never prints a route-specific known truth or fabricated witness",()=>{
 for(let seed=0;seed<72;seed++)for(const initial of mid.INITIAL){
  const s=report(seed,initial,"suspend"),a=arcs.active(s);
  for(const decision of ["context","protect","accuse"]){
   const done=finish(s,{correct:false,decision});
   const text=results.result(done);
   assert.equal(arcs.verified(done),false);
   assert.ok(!text.includes(results.THEMES[a.id].known));
   assert.ok(!text.includes(results.THEMES[a.id][decision]));
   assert.doesNotMatch(rendered(done),/【大きな回収/);
   assert.equal(save.validState(done),true);
  }
 }
});
test("endings differentiate reports, reconsiderations, and initial theories",()=>{
 for(let seed=0;seed<72;seed++){
  const byReports=["context","protect","accuse"].map(decision=>
    results.result(finish(report(seed),{decision})));
  assert.equal(new Set(byReports).size,3);
  const byRevision=mid.REVISION.map(revision=>
    results.result(finish(report(seed,"surface",revision))));
  assert.equal(new Set(byRevision).size,3);
  const byTheory=mid.INITIAL.map(initial=>
    results.result(finish(report(seed,initial,"revise"))));
  assert.equal(new Set(byTheory).size,3);
 }
});
test("older v13 campaigns remain exactly the same under new rendering and save migration",()=>{
 for(const seed of [0,3,7,24,71]){
  const s=former.blank(seed),f=former.serialize(s),restored=save.migrateAny(f);
  assert.deepEqual(restored,s);
  assert.equal(restored.arcMode,"deliberative");
  assert.equal(results.result(restored),"");
  // A migrated v13 save must retain the exact historical reader result.
  const historical=require("../reading-v13.js").compose(s,{body:"old prose"},{major:"test"});
  assert.equal(reader.compose(s,{body:"old prose"},{major:"test"}),historical);
  assert.deepEqual(save.parse(save.serialize(restored)),restored);
  assert.equal(former.serialize(s),f);
  assert.equal(save.restart(restored).arcMode,"deliberative");
 }
});
test("v13 mid-investigation saves retain their own hypothesis and revision screens",()=>{
 for(const seed of [0,3,7,24,71]){
  let s=former.blank(seed),r=steps[arcs.active(s).id];
  for(const ch of ["listen",r[0],r[1],r[2],"amend"])
   s={...s,night1:first.advance(s.night1,ch)};
  const pending=save.migrateAny(former.serialize(s));
  assert.equal(pending.arcMode,"deliberative");
  assert.equal(pending.midpoint.initial,null);
  assert.equal(mid.beginning(pending).choices.length,3);
  assert.equal(save.validState(pending),true);
  assert.deepEqual(pending,s);
  s=mid.chooseInitial(pending,"hypothesis:system");
  assert.equal(s.arcMode,"deliberative");
  s={...s,morning:morning.fresh(s.night1)};
  for(const ch of ["examine",r[3],r[4]]){
   const m=morning.advance(s.morning,s.night1,ch);
   s={...s,morning:m,deduction:m.scene==="report"?deduction.start():null};
  }
  assert.equal(s.midpoint.revision,null);
  const restored=save.migrateAny(former.serialize(s));
  assert.deepEqual(restored,s);
  assert.equal(mid.second(restored).choices.length,3);
  const continued=mid.chooseRevision(restored,"revision:revise");
  assert.equal(continued.arcMode,"deliberative");
  assert.equal(save.validState(continued),true);
 }
 const game=fs.readFileSync(path.join(__dirname,"..","game-v16.js"),"utf8");
 assert.match(game,/\["responsive","deliberative"\]\.includes\(state\.arcMode\)/);
});
test("new campaign cannot smuggle progress or extra fabricated evidence in JSON",()=>{
 for(const seed of [0,17,35,71]){
  const s=report(seed);
  const corrupted={...s,midpoint:{initial:"fake",revision:"revise"}};
  assert.equal(save.validState(corrupted),false);
  assert.throws(()=>save.serialize(corrupted));
  const extras={...s,extraProof:true};
  assert.equal(save.validState(extras),false);
  const forgery={...s,deduction:{stage:"complete",focus:"records",pair:"arc-proof|arc-support",reading:"balanced"}};
  assert.equal(save.validState(forgery),false);
 }
});
test("single story panel, shorter theory prompts, no new UI tabs or checkout",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const game=fs.readFileSync(path.join(__dirname,"..","game-v16.js"),"utf8");
 const pack=save.blank(0),a=arcs.active(pack);
 let s=pack;
 for(const ch of ["listen",steps[a.id][0],steps[a.id][1],steps[a.id][2],"amend"])
  s={...s,night1:first.advance(s.night1,ch)};
 const preview=mid.beginning(s);
 assert.equal(preview.choices.length,3);
 assert.ok(preview.body.length<450);
 s=mid.chooseInitial(s,"hypothesis:unknown");
 s={...s,morning:morning.fresh(s.night1)};
 for(const ch of ["examine",steps[a.id][3],steps[a.id][4]]){
  const m=morning.advance(s.morning,s.night1,ch);
  s={...s,morning:m,deduction:m.scene==="report"?deduction.start():null};
 }
 const review=mid.second(s);
 assert.equal(review.choices.length,3);
 assert.ok(review.body.length<400);
 assert.ok(review.choices.every(x=>!x.hint));
 assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
 assert.equal((html.match(/<nav\b/g)||[]).length,1,"exactly one buyer navigation");
 assert.match(html,/id="handoverNav"/);
 assert.match(html,/data-handover-view="story"/);
 assert.match(html,/data-handover-view="clues"/);
 assert.ok(html.includes('src="./game-v16.js"'));
 assert.ok(!html.includes('src="./game-v13.js"'));
 assert.ok(game.includes('if (option.hint && option.hint.trim())'));
 assert.doesNotMatch(game,/\bfetch\s*\(/);
 assert.doesNotMatch(html,/stripe|paypal|checkout/i);
 const cfg=makeConfig({STORE_IDENTITY_NAME:"Publisher.HandoverRoom",
  STORE_PUBLISHER:"CN=Publisher",STORE_PUBLISHER_DISPLAY_NAME:"Publisher"});
 for(const p of ["midpoint-v14.js","arcs-v14.js","notes-v14.js","consequences-v14.js",
  "save-v14.js","reading-v14.js","game-v16.js"])assert.ok(cfg.files.includes(p),p);
 assert.ok(gate({},"win32").length>0);
});
