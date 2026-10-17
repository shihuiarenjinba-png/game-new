"use strict";
/* Text inventory for v13 actual visible scenes. Not actual player time.
 * Both hypothesis checkpoints counted; quoted shared text is NOT new content.
 */
const story=require("../story.js"),morning=require("../morning.js");
const cases=require("../case-variants.js"),arcs=require("../deliberative-arcs-v13.js");
const beats=require("../scene-beats.js"),reader=require("../reading-v13.js");
const notes=require("../notes-v13.js"),deduction=require("../deduction.js");
const mid=require("../deliberation-v13.js"),save=require("../save-v13.js");
const routes={
 prefilled:["wording","space","author","why","ask"],
 "two-moments":["stoppage","private","author","private","ask"],
 "silent-rule":["renewals","space","targets","why","ask"],
 "permission-is-not-consent":["wording","space","author","private","quote"],
 "the-unspoken-objection":["stoppage","private","agreement","private","ask"],
 "protection-that-erases":["renewals","private","author","why","sign"]
};
function preview(s){
 const m=s.morning;
 const needsTheory=!m&&s.night1.scene==="ending"&&s.midpoint.initial===null;
 const needsRevision=m?.scene==="report"&&s.midpoint.revision===null;
 const ded=m?.scene==="report"&&!needsRevision&&s.deduction?.stage!=="complete";
 const screen=needsTheory?mid.beginning(s):needsRevision?mid.second(s):
   ded?deduction.display(s.deduction,s):m?morning.view(m,s.night1):story.view(s.night1);
 const major=arcs.sceneText(s),cast=mid.compatible(s);
 const beat=beats.line(cast),side=beats.safeCaseText(cast);
 const assessment=s.deduction?.stage==="complete"?deduction.assessment(s.deduction,s):null;
 const text=(needsTheory||needsRevision)?screen.body:reader.compose(s,screen,{
  context:notes.emphasis(s),major,beat,case:side,review:assessment,verified:arcs.verified(s)
 });
 if(typeof text!=="string")throw Error("No active story text");
 return {text,base:screen.body,extra:major+beat+side+mid.reflection(s)};
}
function simulate(seed){
 const a=arcs.active(save.blank(seed)),route=routes[a.id];
 if(!route)throw Error("No route "+a.id);
 let s=save.blank(seed);const views=[];
 const snap=()=>views.push(preview(s));
 snap();
 for(const choice of ["listen",route[0],route[1],route[2],"amend"]){
  s={...s,night1:story.advance(s.night1,choice)};snap();
 }
 s=mid.chooseInitial(s,"hypothesis:surface");snap();
 s={...s,morning:morning.fresh(s.night1)};snap();
 for(const choice of ["examine",route[3],route[4]]){
  const m=morning.advance(s.morning,s.night1,choice);
  s={...s,morning:m,deduction:m.scene==="report"?deduction.start():s.deduction};snap();
 }
 s=mid.chooseRevision(s,"revision:revise");snap();
 const best=deduction.options(s,a.focus).find(x=>x.id.includes("arc-support")&&x.id.includes("arc-counter"));
 if(!best)throw Error("No evidence for "+a.id);
 for(const choice of ["focus:"+a.focus,"pair:"+best.id,"reading:balanced"]){
  s={...s,deduction:deduction.advance(s.deduction,s,choice)};snap();
 }
 s={...s,morning:morning.advance(s.morning,s.night1,"context")};snap();
 if(!arcs.verified(s))throw Error("Big mystery not earned: "+a.id);
 return {id:a.id,scenes:views.length,
  displayedChars:views.reduce((n,x)=>n+x.text.length,0),
  sourceBaseChars:views.reduce((n,x)=>n+x.base.length,0),
  authoredSupplementChars:views.reduce((n,x)=>n+x.extra.length,0),
  longestSceneChars:Math.max(...views.map(x=>x.text.length)),
  opening:views[0].text,ending:views[views.length-1].text};
}
const representative=new Map();
for(let seed=0;seed<72;seed++){
 const id=arcs.active(save.blank(seed)).id;
 if(!representative.has(id))representative.set(id,seed);
}
const rows=[...representative.entries()].map(([id,seed])=>({seed,...simulate(seed)}));
if(rows.length!==6||new Set(rows.map(r=>r.opening)).size!==6||new Set(rows.map(r=>r.ending)).size!==6)
 throw Error("Six different main routes required");
for(const r of rows)console.log(r.id+" seed="+r.seed+" scenes="+r.scenes+
 " displayed_chars="+r.displayedChars+" shared_source_chars="+r.sourceBaseChars+
 " scripted_supplement_chars="+r.authoredSupplementChars+
 " longest_scene_chars="+r.longestSceneChars);
const values=rows.map(r=>r.displayedChars);
console.log("STORY_VOLUME_AUDIT_PASS distinct_openings=6 distinct_endings=6"+
 " displayed_chars_min="+Math.min(...values)+" max="+Math.max(...values));
console.log("NOTE: includes repeated common passages; no actual reading time, enjoyment, or purchase intent tested.");
