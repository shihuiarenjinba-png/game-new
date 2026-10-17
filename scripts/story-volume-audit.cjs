"use strict";
/* Objective scripted-text inventory. Not a human reading-time measurement. */
const story=require("../story.js"),morning=require("../morning.js");
const cases=require("../case-variants.js"),arcs=require("../immersive-arcs.js");
const beats=require("../scene-beats.js"),reader=require("../reading-v10.js");
const notes=require("../case-notes-v9.js"),deduction=require("../deduction.js");
const save=require("../save-v9.js");
const routes={
 prefilled:["wording","space","author","why","ask"],
 "two-moments":["stoppage","private","author","private","ask"],
 "silent-rule":["renewals","space","targets","why","ask"],
 "permission-is-not-consent":["wording","space","author","private","quote"],
 "the-unspoken-objection":["stoppage","private","agreement","private","ask"],
 "protection-that-erases":["renewals","private","author","why","sign"]
};
function preview(state){
 const inMorning=state.morning!==null;
 const inDeduction=inMorning&&state.morning.scene==="report"&&state.deduction?.stage!=="complete";
 const screen=inDeduction?deduction.display(state.deduction,state):
   inMorning?morning.view(state.morning,state.night1):story.view(state.night1);
 const major=arcs.sceneText(state),beat=beats.line(state),side=beats.safeCaseText(state);
 const review=state.deduction?.stage==="complete"?deduction.assessment(state.deduction,state):null;
 const rendered=reader.compose(state,screen,{
  context:notes.emphasis(state),major,beat,case:side,review,verified:arcs.verified(state)
 });
 if(typeof rendered!=="string")throw Error("Missing active reading mode");
 return {text:rendered,base:screen.body,extra:major+beat+side};
}
function simulate(seed){
 const a=arcs.active(save.blank(seed)),route=routes[a.id];
 if(!route)throw Error("Missing authored route "+a.id);
 let s=save.blank(seed);const snapshots=[];
 function snap(){snapshots.push(preview(s));}
 snap();
 for(const choice of ["listen",route[0],route[1],route[2],"amend"]){
  s={...s,night1:story.advance(s.night1,choice)};snap();
 }
 s={...s,morning:morning.fresh(s.night1)};snap();
 for(const choice of ["examine",route[3],route[4]]){
  const m=morning.advance(s.morning,s.night1,choice);
  s={...s,morning:m,deduction:m.scene==="report"?deduction.start():s.deduction};snap();
 }
 const evidence=deduction.options(s,a.focus).find(x=>x.id.includes("arc-support")&&x.id.includes("arc-counter"));
 if(!evidence)throw Error("Missing pair "+a.id);
 for(const id of ["focus:"+a.focus,"pair:"+evidence.id,"reading:balanced"]){
  s={...s,deduction:deduction.advance(s.deduction,s,id)};snap();
 }
 s={...s,morning:morning.advance(s.morning,s.night1,"context")};snap();
 if(!arcs.verified(s))throw Error("Unexpected ending "+a.id);
 return {id:a.id,scenes:snapshots.length,
  displayedChars:snapshots.reduce((p,x)=>p+x.text.length,0),
  sourceBaseChars:snapshots.reduce((p,x)=>p+x.base.length,0),
  routeSupplementChars:snapshots.reduce((p,x)=>p+x.extra.length,0),
  longestSceneChars:Math.max(...snapshots.map(x=>x.text.length)),
  opening:snapshots[0].text,ending:snapshots[snapshots.length-1].text
 };
}
const representative=new Map();
for(let seed=0;seed<72;seed++){
 const id=arcs.active(save.blank(seed)).id;
 if(!representative.has(id))representative.set(id,seed);
}
const rows=[...representative.entries()].map(([id,seed])=>({seed,...simulate(seed)}));
if(rows.length!==6)throw Error("Six main routes expected");
if(new Set(rows.map(x=>x.opening)).size!==6||new Set(rows.map(x=>x.ending)).size!==6)
 throw Error("Duplicate beginnings or endings");
for(const r of rows){
 console.log(r.id+" seed="+r.seed+" scenes="+r.scenes+" displayed_chars="+r.displayedChars+
  " common_source_chars="+r.sourceBaseChars+" route_supplement_chars="+r.routeSupplementChars+
  " longest_scene_chars="+r.longestSceneChars);
}
const values=rows.map(x=>x.displayedChars);
console.log("STORY_VOLUME_AUDIT_PASS distinct_openings=6 distinct_endings=6"+
 " displayed_chars_min="+Math.min(...values)+" max="+Math.max(...values));
console.log("NOTE: Common passages recur and these counts do not represent unique stories, playtime or purchase intent.");
