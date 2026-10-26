"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const story=require("../story.js"),morning=require("../morning.js");
const save=require("../save-v14.js"),arcs=require("../arcs-v14.js");
const mid=require("../midpoint-v14.js"),deduction=require("../deduction.js");
const journey=require("../journey-v16.js");
const builder=require("../scripts/store-build.cjs");
const route={
 prefilled:["wording","space","author","why","ask"],
 "two-moments":["stoppage","private","author","private","ask"],
 "silent-rule":["renewals","space","targets","why","ask"],
 "permission-is-not-consent":["wording","space","author","private","quote"],
 "the-unspoken-objection":["stoppage","private","agreement","private","ask"],
 "protection-that-erases":["renewals","private","author","why","sign"]
};
test("all 72 seeds present actual progress 0..14 with actionable next destination",()=>{
 let runs=0;
 for(let seed=0;seed<72;seed++){
  let s=save.blank(seed);const a=arcs.active(s),choices=route[a.id];
  function check(expected){
   const j=journey.describe(s);
   assert.equal(j.now,expected,"seed="+seed);
   assert.equal(j.max,14);
   assert.ok(j.current&&j.next);
   assert.ok(j.guide.includes("→"));
   assert.ok(j.now>=0&&j.now<=j.max);
  }
  check(0);
  for(let i=0;i<5;i++){
   const c=["listen",...choices.slice(0,3),"amend"][i];
   s={...s,night1:story.advance(s.night1,c)};check(i+1);
  }
  assert.equal(journey.describe(s).current,"仮説を立てる");
  s=mid.chooseInitial(s,"hypothesis:unknown");check(6);
  s={...s,morning:morning.fresh(s.night1)};check(6);
  for(let i=0;i<3;i++){
   const m=morning.advance(s.morning,s.night1,["examine",choices[3],choices[4]][i]);
   s={...s,morning:m,deduction:m.scene==="report"?deduction.start():null};
   check(7+i);
  }
  assert.equal(journey.describe(s).current,"仮説を見直す");
  s=mid.chooseRevision(s,"revision:revise");check(10);
  const pair=deduction.options(s,a.focus).find(x=>x.id.includes("arc-support")&&x.id.includes("arc-counter"));
  assert.ok(pair);
  for(const id of ["focus:"+a.focus,"pair:"+pair.id,"reading:balanced"]){
   s={...s,deduction:deduction.advance(s.deduction,s,id)};
   check(({pair:11,reading:12,complete:13})[s.deduction.stage]);
  }
  s={...s,morning:morning.advance(s.morning,s.night1,"context")};
  check(14);
  assert.equal(journey.describe(s).current,"事件の結末");
  assert.equal(save.validState(s),true);
  runs++;
 }
 assert.equal(runs,72);
});
test("earlier non-checkpoint saves use 12 step scale, not invented theory decisions",()=>{
 for(const seed of [0,17,35,71]){
  const s=require("../save-v9.js").blank(seed);
  const j=journey.describe(s);
  assert.equal(j.now,0);
  assert.equal(j.max,12);
  assert.ok(!j.guide.includes("仮説を立てる"));
 }
});
test("legacy finished saves without later deduction are shown as complete 9/9",()=>{
 const s={arcMode:"legacy",night1:{history:Array(5).fill("x")},
  morning:{scene:"epilogue",history:["x","y","z","context"]},
  deduction:null};
 const p=journey.describe(s);
 assert.equal(p.now,9);
 assert.equal(p.max,9);
 assert.equal(p.current,"事件の結末");
});
test("screen has one primary story, visible next action, no additional tabs",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const game=fs.readFileSync(path.join(__dirname,"..","game-v16.js"),"utf8");
 const css=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
 for(const id of ["evidence-jump","return-story","flow-caption","progress-track"])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
 assert.equal((html.match(/<nav\b/g)||[]).length,1,"exactly one buyer navigation");
 assert.match(html,/id="handoverNav"/);
 assert.match(html,/data-handover-view="story"/);
 assert.match(html,/data-handover-view="clues"/);
 assert.ok(html.includes('src="./journey-v16.js"'));
 assert.ok(html.includes('src="./game-v16.js"'));
 assert.ok(!html.includes('src="./game-v14.js"'));
 assert.match(game,/journey\.describe\(state\)/);
 assert.match(game,/evidenceJump\.addEventListener/);
 assert.match(game,/returnStory\.addEventListener/);
 assert.match(css,/\.flow-caption/);
 assert.match(css,/\.evidence-jump/);
 assert.doesNotMatch(game,/\bfetch\s*\(/);
});
test("MSIX is gated by official Partner identity, version and proper store assets",()=>{
 assert.equal(builder.storeVersion("1.0.0.0"),true);
 assert.equal(builder.storeVersion("2.4.9.0"),true);
 for(const bad of ["0.16.0.0","1.0.0.1","1.0.0","-1.0.0.0","65536.0.0.0","hello"])
  assert.equal(builder.storeVersion(bad),false,bad);
 const absent=builder.gate({},"win32").join("\n");
 assert.match(absent,/STORE_IDENTITY_NAME/);
 assert.match(absent,/STORE_PACKAGE_VERSION/);
 assert.match(absent,/STORE_IDENTITY_CONFIRMED/);
 const config=builder.makeConfig({STORE_IDENTITY_NAME:"RealCompany.RealApp",
  STORE_PUBLISHER:"CN=Production Publisher",STORE_PUBLISHER_DISPLAY_NAME:"Publisher",
  STORE_PACKAGE_VERSION:"1.0.0.0"});
 assert.equal(config.buildVersion,"1.0.0.0");
 assert.deepEqual(config.win.target,[{target:"msix",arch:["x64"]}]);
 assert.equal(config.msix.createMsixupload,true);
 assert.equal(config.msix.identityName,"RealCompany.RealApp");
 assert.equal(config.msix.applicationId,"HandoverRoom");
 assert.ok(config.files.includes("journey-v16.js"));
 assert.ok(config.files.includes("game-v16.js"));
 for(const item of Object.keys(builder.LOGOS)){
  assert.match(builder.gate({},"win32").join("\n"),new RegExp(item));
 }
});
